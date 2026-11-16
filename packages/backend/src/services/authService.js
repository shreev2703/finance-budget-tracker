import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { HttpError } from '../middleware/errorHandler.js';
import { DEFAULT_CATEGORIES } from '../domain/category.js';
import {
  BCRYPT_ROUNDS,
  cleanEmail,
  cleanName,
  emailError,
  nameError,
  passwordError,
} from '../domain/user.js';

const TOKEN_LIFETIME = '1d';
const JWT_ALGORITHM = 'HS256';
const BAD_LOGIN = 'Incorrect email or password.';

/** Sign-up, sign-in, and checking the JWT sent with each protected request. */
export function createAuthService({ users, tokenSecret }) {
  // Compared against when the email is unknown, so both failures take about the same time.
  const unknownUserHash = bcrypt.hashSync('no-such-user', BCRYPT_ROUNDS);

  function generateAccessToken(user) {
    return jwt.sign({ sub: String(user.id) }, tokenSecret, {
      algorithm: JWT_ALGORITHM,
      expiresIn: TOKEN_LIFETIME,
    });
  }

  const session = (user) => ({
    token: generateAccessToken(user),
    user: { id: user.id, email: user.email, name: user.name },
  });

  return {
    async register({ email, password, name }) {
      const cleanedEmail = cleanEmail(email);
      const cleanedName = cleanName(name);
      const errors = [
        nameError(cleanedName),
        emailError(cleanedEmail),
        passwordError(password),
      ].filter(Boolean);
      if (errors.length) throw new HttpError(400, 'Invalid sign-up', errors);

      const taken = new HttpError(409, 'That email is already registered.');
      if (await users.findByEmail(cleanedEmail)) throw taken;

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      try {
        const user = await users.create(
          { email: cleanedEmail, passwordHash, name: cleanedName },
          DEFAULT_CATEGORIES,
        );
        return session(user);
      } catch (error) {
        // Two sign-ups can pass the check above while hashing; the UNIQUE constraint settles it.
        if (error.code === '23505' || /UNIQUE/.test(error.message)) throw taken;
        throw error;
      }
    },

    async login({ email, password }) {
      const user = await users.findByEmail(cleanEmail(email));
      const matched = await bcrypt.compare(
        typeof password === 'string' ? password : '',
        user?.passwordHash ?? unknownUserHash,
      );
      if (!user || !matched) throw new HttpError(401, BAD_LOGIN);
      return session(user);
    },

    /**
     * US-07: a logged-in user changes their password. The current password is required,
     * so someone using an unlocked, logged-in laptop can't lock the owner out.
     * A wrong current password is a 400, not a 401, so the website doesn't log the user out.
     */
    async changePassword(userId, { currentPassword, newPassword }) {
      const hash = await users.findPasswordHash(userId);
      const matched = await bcrypt.compare(
        typeof currentPassword === 'string' ? currentPassword : '',
        hash ?? unknownUserHash,
      );
      if (!matched) throw new HttpError(400, 'Current password is incorrect.');
      const error = passwordError(newPassword);
      if (error) throw new HttpError(400, 'Invalid password', [error]);
      if (newPassword === currentPassword) {
        throw new HttpError(400, 'Invalid password', [
          'New password must be different from the current one.',
        ]);
      }
      await users.updatePasswordHash(userId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS));
    },

    /** US-07: deletes the account and all of its data, after confirming the password. */
    async deleteAccount(userId, { password }) {
      const hash = await users.findPasswordHash(userId);
      const matched = await bcrypt.compare(
        typeof password === 'string' ? password : '',
        hash ?? unknownUserHash,
      );
      if (!matched) throw new HttpError(400, 'Password is incorrect.');
      await users.remove(userId);
    },

    /** Returns the token's user, or null if the token is invalid, expired, or the user is gone. */
    async userFromToken(token) {
      try {
        const { sub } = jwt.verify(token, tokenSecret, {
          algorithms: [JWT_ALGORITHM],
        });
        return (await users.findById(Number(sub))) ?? null;
      } catch {
        return null;
      }
    },
  };
}
