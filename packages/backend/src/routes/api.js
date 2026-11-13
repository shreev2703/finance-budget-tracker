import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { currentPeriod } from '../domain/period.js';

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function periodFrom(req) {
  const period = req.query.period ?? currentPeriod();
  if (!PERIOD_RE.test(period)) {
    throw new HttpError(400, 'period must be YYYY-MM');
  }
  return period;
}

/** Thin controllers: parse the request, call a service, send JSON. */
export function apiRouter({
  transactionService,
  budgetService,
  categoryService,
  categories,
}) {
  const router = Router();

  router.get('/auth/me', (req, res) => res.json(req.user));

  router.get('/categories', async (req, res) => {
    res.json(await categories.listForUser(req.userId, currentPeriod()));
  });

  router.post('/categories', async (req, res) => {
    res.status(201).json(await categoryService.create(req.userId, req.body ?? {}));
  });

  router.put('/categories/:id', async (req, res) => {
    res.json(await categoryService.rename(req.userId, req.params.id, req.body ?? {}));
  });

  router.delete('/categories/:id', async (req, res) => {
    await categoryService.remove(req.userId, req.params.id);
    res.status(204).end();
  });

  router.get('/transactions', async (req, res) => {
    const { categoryId, from, to } = req.query;
    const limit = Math.min(
      Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    res.json(await transactionService.list(req.userId, limit, { categoryId, from, to }));
  });

  router.post('/transactions', async (req, res) => {
    res.status(201).json(await transactionService.create(req.userId, req.body));
  });

  router.put('/transactions/:id', async (req, res) => {
    res.json(await transactionService.update(req.userId, req.params.id, req.body));
  });

  router.delete('/transactions/:id', async (req, res) => {
    await transactionService.remove(req.userId, req.params.id);
    res.status(204).end();
  });

  router.get('/budgets/summary', async (req, res) => {
    res.json(await budgetService.summary(req.userId, periodFrom(req)));
  });

  router.get('/reports/spending-by-category', async (req, res) => {
    res.json(await budgetService.spendingByCategory(req.userId, periodFrom(req)));
  });

  router.post('/budgets', async (req, res) => {
    const input = { ...req.body, period: req.body?.period ?? currentPeriod() };
    res.status(201).json(await budgetService.create(req.userId, input));
  });

  router.put('/budgets/:id', async (req, res) => {
    res.json(
      await budgetService.updateLimit(req.userId, req.params.id, req.body ?? {}),
    );
  });

  return router;
}
