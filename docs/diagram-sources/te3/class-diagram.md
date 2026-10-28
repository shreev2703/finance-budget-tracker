# LedgerLogic domain model (TE3)

![LedgerLogic class diagram](class-diagram.png)

Source: [`class-diagram.mmd`](class-diagram.mmd). Re-render the PNG after editing it:

```bash
npx -y @mermaid-js/mermaid-cli -i docs/diagram-sources/te3/class-diagram.mmd -o docs/diagram-sources/te3/class-diagram.png -b white -s 2
```

```mermaid
classDiagram
  direction LR

  class User {
    -int id
    -String email
    -String passwordHash
    -String name
    -DateTime createdAt
    +register(email, password, name) User
    +login(email, password) bool
    +getId() int
    +getEmail() String
    +getName() String
    +getTransactions(period) List~Transaction~
    +getCategories() List~Category~
    +getBudgets(period) List~Budget~
  }

  class Category {
    -int id
    -int userId
    -String name
    -CategoryType type
    +getId() int
    +getName() String
    +getType() CategoryType
    +rename(name) void
  }

  class Transaction {
    -int id
    -int userId
    -int categoryId
    -CategoryType type
    -int amountCents
    -Date date
    -String note
    -DateTime createdAt
    +getId() int
    +getAmount() decimal
    +getDate() Date
    +getType() CategoryType
    +getCategory() Category
    +getNote() String
    +isExpense() bool
    +validate() List~String~
    +update(amount, date, categoryId, note) void
    +delete() void
  }

  class Budget {
    -int id
    -int userId
    -int categoryId
    -String period
    -int limitAmountCents
    +getLimit() decimal
    +getPeriod() String
    +setLimit(amount) void
    +spent() decimal
    +remaining() decimal
    +percentUsed() float
    +isNearLimit() bool
    +isOverLimit() bool
    +getStatus() BudgetStatus
  }

  class MonthlySummary {
    -String period
    -int incomeCents
    -int expenseCents
    -int balanceCents
    -List~Budget~ budgets
    +getIncome() decimal
    +getExpenses() decimal
    +getBalance() decimal
    +getBudgets() List~Budget~
  }

  class CategoryType {
    <<enumeration>>
    INCOME
    EXPENSE
  }

  class BudgetStatus {
    <<enumeration>>
    OK
    WARNING
    OVER
  }

  User "1" --> "M" Transaction : records
  User "1" --> "M" Category : owns
  User "1" --> "M" Budget : sets
  User "1" --> "M" MonthlySummary : views
  Transaction "M" --> "1" Category : classified as
  Budget "M" --> "1" Category : limits
  MonthlySummary "1" o-- "M" Budget : includes
  MonthlySummary ..> Transaction : totals
  Category ..> CategoryType
  Transaction ..> CategoryType
  Budget ..> BudgetStatus
```

## Classes

| Class            | Responsibility                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User**         | A registered student. Owns all of their data, so records stay private (US-07).                                                                                                                               |
| **Category**     | A user-defined bucket such as "Groceries" or "Part-time Job". `type` says whether it holds income or expenses.                                                                                               |
| **Transaction**  | One income or expense entry with amount, date, category, and note (US-01, US-02, US-03).                                                                                                                     |
| **Budget**       | A monthly spending limit for one expense category. `period` is a month (`YYYY-MM`). It derives how much has been spent, what remains, and whether the user is near (≥ 80%) or over the limit (US-08, US-09). |
| **CategoryType** | Enumeration: `INCOME` or `EXPENSE`.                                                                                                                                                                          |

## Design notes

- **Money** is `decimal` in the model and stored as integer cents in the database, which avoids floating-point rounding errors.
- **Budget is per category per month.** A user has at most one budget for a given category and period.
- **Dashboard totals are derived, not stored.** Total income, total expenses, and remaining balance (US-04) and the spending-by-category chart (US-05) are computed from Transactions for a period, so no extra class is needed.
- **Filtering (US-06)** is a query over Transactions by category and date range, not a class.
- **Not modeled:** a SavingsGoal class was considered but dropped, because no TE2 user story requires it. It can be added later if the team writes a story for it. Admin features are also not modeled, since SRS §2.2 has no admin stories yet.

See [`traceability.md`](traceability.md) for how each user story maps to these classes.
