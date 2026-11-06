import { HttpError } from './errorHandler.js';

/** Requires a valid `Authorization: Bearer <token>` header and sets req.userId from the token. */
export function authenticate(authService) {
  return (req, res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    const user =
      scheme === 'Bearer' && token ? authService.userFromToken(token) : null;
    if (!user) {
      res.set('WWW-Authenticate', 'Bearer');
      throw new HttpError(401, 'Please log in to continue.');
    }
    req.userId = user.id;
    req.user = user;
    next();
  };
}
