# User story → class traceability (TE3)

Every Must-have noun in a TE2 user story maps to a class or attribute, and every class traces back to at least one story.

| Story | Summary                                                    | Priority | Classes                     | Attributes / methods                                                               |
| ----- | ---------------------------------------------------------- | -------- | --------------------------- | ---------------------------------------------------------------------------------- |
| US-01 | Log an expense with amount, date, category, description    | 1        | Transaction, Category, User | `Transaction.amount`, `.date`, `.note`, `.type = EXPENSE`; Transaction → Category  |
| US-02 | Record paychecks and income sources                        | 1        | Transaction, Category, User | `Transaction.type = INCOME`; income Categories (e.g. "Part-time Job")              |
| US-03 | Edit or delete a past transaction                          | 2        | Transaction                 | `Transaction.id`; update/delete operations                                         |
| US-04 | Dashboard: total income, total expenses, remaining balance | 1        | Transaction                 | Derived: sum of `amount` by `type` for the month                                   |
| US-05 | Spending-by-category chart                                 | 2        | Transaction, Category       | Derived: sum of expense `amount` grouped by Category                               |
| US-06 | Filter history by category and date range                  | 3        | Transaction, Category       | Query on `Transaction.date` and Category                                           |
| US-07 | Create an account and log in with email and password       | 1        | User                        | `User.email`, `.passwordHash`, `register()`, `login()`                             |
| US-08 | Monthly spending limit per category                        | 2        | Budget, Category            | `Budget.limitAmount`, `.period`; Budget → Category; `remaining()`, `isOverLimit()` |
| US-09 | Warning at 80% of a category limit                         | 3        | Budget                      | `percentUsed()`, `isNearLimit()`                                                   |

## Class → stories

| Class        | Stories                                  |
| ------------ | ---------------------------------------- |
| User         | US-01, US-02, US-07                      |
| Category     | US-01, US-02, US-05, US-06, US-08        |
| Transaction  | US-01, US-02, US-03, US-04, US-05, US-06 |
| Budget       | US-08, US-09                             |
| CategoryType | US-01, US-02                             |
