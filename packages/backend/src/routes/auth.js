import { Router } from 'express';

/** Public routes: these are how a client gets a token in the first place. */
export function authRouter({ authService }) {
  const router = Router();

  router.post('/auth/register', async (req, res) => {
    res.status(201).json(await authService.register(req.body ?? {}));
  });

  router.post('/auth/login', async (req, res) => {
    res.json(await authService.login(req.body ?? {}));
  });

  return router;
}
