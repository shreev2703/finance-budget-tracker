# Project management reports

`status-report.pdf` (and `status-report.html`) is the PM status report: actual hours per person per sprint, the burnup chart, and whether we are on schedule, when we will finish, and what the project costs. The numbers come from the GitHub project board ("Finance Budget Tracker Board").

## Board fields the report relies on

| Field | Type | Used for |
|---|---|---|
| Estimated Time (hrs) | Number | Scope and earned value |
| Actual Time (hrs) | Number | Hours per person and cost |
| Iteration | Iteration (dated sprints) | Grouping by sprint and the burnup's timeline |
| Status | Single select | Done vs. open |
| Assignees | People | Hours per person |

## Regenerate it (end of every sprint)

From the repo root, in Git Bash:

```bash
gh project item-list 1 --owner shreev2703 --limit 300 --format json > /tmp/board.json
gh issue list --state all --limit 300 --json number,title,state,createdAt,closedAt,assignees,milestone > /tmp/issues.json
node docs/pm/compute.cjs /tmp/board.json /tmp/issues.json > docs/pm/report-data.json
node docs/pm/build-report.cjs
```

Then print `docs/pm/status-report.html` to PDF (Chrome: Print → Save as PDF, or headless `--print-to-pdf`). Update `TODAY` in `build-report.cjs` and `today` in `compute.cjs` first.

## The same charts live in GitHub

On the project board, open **Insights**:
- **Burn up:** the default chart, filtered to all items.
- **Hours by person per sprint:** new chart, Bar, X-axis **Iteration**, group by **Assignees**, Y-axis **Sum of Actual Time (hrs)**. Tickets with two assignees count fully for each in GitHub's chart; the report splits them instead.
