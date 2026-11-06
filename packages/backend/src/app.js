import express from 'express';
import { createTransactionRepository } from './repositories/transactionRepository.js';
import { createCategoryRepository } from './repositories/categoryRepository.js';
import { createBudgetRepository } from './repositories/budgetRepository.js';
import { createUserRepository } from './repositories/userRepository.js';
import { createTransactionService } from './services/transactionService.js';
import { createBudgetService } from './services/budgetService.js';
import { createCategoryService } from './services/categoryService.js';
import { createAuthService } from './services/authService.js';
import { apiRouter } from './routes/api.js';
import { authRouter } from './routes/auth.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/** Wires repositories -> services -> routes. Takes the db so tests can pass an in-memory one. */
export function createApp(db, { tokenSecret }) {
  const transactions = createTransactionRepository(db);
  const categories = createCategoryRepository(db);
  const budgets = createBudgetRepository(db);
  const authService = createAuthService({
    users: createUserRepository(db),
    tokenSecret,
  });

  const app = express();
  app.use(express.json());
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api', authRouter({ authService }));
  // Everything mounted after this line requires a valid token.
  app.use('/api', authenticate(authService));
  app.use(
    '/api',
    apiRouter({
      transactionService: createTransactionService({
        transactions,
        categories,
      }),
      budgetService: createBudgetService({
        transactions,
        budgets,
        categories,
      }),
      categoryService: createCategoryService({ categories }),
      categories,
    }),
  );
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
