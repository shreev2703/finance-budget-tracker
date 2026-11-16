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

/** Protected account routes: mounted after `authenticate`, so req.userId comes from the token. */
export function accountRouter({ authService }) {
  const router = Router();

  router.put('/auth/password', async (req, res) => {
    await authService.changePassword(req.userId, req.body ?? {});
    res.status(204).end();
  });

  router.delete('/auth/me', async (req, res) => {
    await authService.deleteAccount(req.userId, req.body ?? {});
    res.status(204).end();
  });

  return router;
}
