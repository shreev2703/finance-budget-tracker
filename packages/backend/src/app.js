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
import { accountRouter, authRouter } from './routes/auth.js';
import { plaidRouter } from './routes/plaid.js';
import { createBankRepository } from './repositories/bankRepository.js';
import { createPlaidService } from './services/plaidService.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/** Wires PostgreSQL repositories -> services -> routes. */
export function createApp(db, { tokenSecret, plaid = null, plaidTokenKey }) {
  const transactions = createTransactionRepository(db);
  const categories = createCategoryRepository(db);
  const plaidService = plaid
    ? createPlaidService({
        plaid,
        bank: createBankRepository(db),
        categories,
        // Encrypts stored bank tokens. Its own key when set, else derived from TOKEN_SECRET.
        tokenSecret: plaidTokenKey || tokenSecret,
      })
    : null;
  const budgets = createBudgetRepository(db);
  const authService = createAuthService({
    users: createUserRepository(db),
    tokenSecret,
  });

  const app = express();
  app.use(express.json());
  // Financial data must not stay in the browser's cache after logging out.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api', authRouter({ authService }));
  // Everything mounted after this line requires a valid token.
  app.use('/api', authenticate(authService));
  app.use('/api', accountRouter({ authService }));
  app.use('/api', plaidRouter({ plaidService }));
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
