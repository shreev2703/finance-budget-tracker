import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';

/**
 * Bank connections (#94). Mounted after `authenticate`, so every route knows the user.
 * With no Plaid keys configured, status says so and the other routes are 404,
 * and the website hides its Connect bank button.
 */
export function plaidRouter({ plaidService }) {
  const router = Router();
  const enabled = () => {
    if (!plaidService) throw new HttpError(404, 'Bank connections are not set up.');
    return plaidService;
  };

  router.get('/plaid/status', async (req, res) => {
    res.json(
      plaidService
        ? await plaidService.status(req.userId)
        : { enabled: false, connected: false },
    );
  });

  router.post('/plaid/link-token', async (req, res) => {
    res.json(await enabled().createLinkToken(req.userId));
  });

  router.post('/plaid/connect', async (req, res) => {
    res.json(await enabled().connect(req.userId, req.body ?? {}));
  });

  router.post('/plaid/sync', async (req, res) => {
    res.json(await enabled().sync(req.userId));
  });

  return router;
}
