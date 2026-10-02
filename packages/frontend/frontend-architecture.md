# Frontend Architecture

## Component Tree

App
└── DashboardPage
    ├── BudgetSummary
    ├── TransactionList
    └── AddTransactionForm

## State Management

DashboardPage will store the shared transactions and budget summary data.
It will pass the data to BudgetSummary and TransactionList as props.

AddTransactionForm will store its own form fields while the user is typing.
After the user submits a transaction, the form will send it to the API and
DashboardPage will refresh the transactions and budget summary.

## Planned File Structure

packages/frontend/
└── src/
    ├── App.jsx
    ├── DashboardPage.jsx
    ├── BudgetSummary.jsx
    ├── TransactionList.jsx
    └── AddTransactionForm.jsx