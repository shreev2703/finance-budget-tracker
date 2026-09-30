import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { currentPeriod } from '../db/seed-data.js';

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Thin controllers: parse the request, call a service, send JSON. */
export function apiRouter({ transactionService, budgetService, categories }) {
  const router = Router();

  router.get('/health', (req, res) => res.json({ ok: true }));

  router.get('/categories', (req, res) => {
    res.json(categories.listForUser(req.userId));
  });

  router.get('/transactions', (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    res.json(transactionService.list(req.userId, limit));
  });

  router.post('/transactions', (req, res) => {
    res.status(201).json(transactionService.create(req.userId, req.body));
  });

  router.get('/budgets/summary', (req, res) => {
    const period = req.query.period ?? currentPeriod();
    if (!PERIOD_RE.test(period))
      throw new HttpError(400, 'period must be YYYY-MM');
    res.json(budgetService.summary(req.userId, period));
  });

  return router;
}
