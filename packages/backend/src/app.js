import express from 'express';
import { createTransactionRepository } from './repositories/transactionRepository.js';
import { createCategoryRepository } from './repositories/categoryRepository.js';
import { createBudgetRepository } from './repositories/budgetRepository.js';
import { createTransactionService } from './services/transactionService.js';
import { createBudgetService } from './services/budgetService.js';
import { apiRouter } from './routes/api.js';
import { demoUser } from './middleware/demoUser.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/** Wires repositories -> services -> routes. Takes the db so tests can pass an in-memory one. */
export function createApp(db) {
  const transactions = createTransactionRepository(db);
  const categories = createCategoryRepository(db);
  const budgets = createBudgetRepository(db);

  const app = express();
  app.use(express.json());
  app.use('/api', demoUser(db));
  app.use(
    '/api',
    apiRouter({
      transactionService: createTransactionService({
        transactions,
        categories,
      }),
      budgetService: createBudgetService({ transactions, budgets }),
      categories,
    }),
  );
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
