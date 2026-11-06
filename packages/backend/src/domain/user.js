export const BCRYPT_ROUNDS = 10;

const MIN_PASSWORD_LENGTH = 8;
// bcrypt only hashes the first 72 bytes, so longer passwords are rejected instead of silently cut.
const MAX_PASSWORD_BYTES = 72;
const MAX_NAME_LENGTH = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function cleanEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function cleanName(name) {
  return typeof name === 'string' ? name.trim() : '';
}

export function emailError(email) {
  return EMAIL_RE.test(email) ? null : 'Enter a valid email address.';
}

export function nameError(name) {
  if (!name) return 'Enter your name.';
  if (name.length > MAX_NAME_LENGTH)
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  return null;
}

export function passwordError(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES)
    return `Password must be ${MAX_PASSWORD_BYTES} bytes or fewer.`;
  return null;
}
