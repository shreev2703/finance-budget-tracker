# Contributing Guidelines

## Tickets

- Every change starts from a ticket on the [project board](https://github.com/users/shreev2703/projects/1) with an owner and an estimate.
- If you take over someone else's ticket, reassign it to yourself and leave a comment saying why.
- Work that wasn't planned, such as a bug that blocks a demo, still gets a ticket so the board matches the code.
- When a ticket moves to Done, fill in Actual Time.

## Branches

- Branch from an up-to-date `main`. Never commit directly to `main`.
- Use `type/short-description`, for example `feat/te6-access-control` or `fix/blank-screen`.
- Check that a pull request's base branch is `main` before merging it.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Scopes: `backend`, `frontend`, `srd`, or a TE number
- Mention the ticket in the body, for example `Refs #78`

## Pull requests

- Keep each pull request to one ticket or one closely related set of tickets.
- Describe what changed and how you tested it, and link the tickets with `Closes #n`.
- Ask a teammate to review it before merging.
- Before opening one, run these from the repo root:

```bash
npm test
npm run lint
npm run build -w frontend
```

## Code style

- Run `npm run format` (Prettier) on the files you changed.
- Backend layers go routes → services → domain → repositories. SQL only belongs in repositories.
- Store money as integer cents.
- Every data route requires a login and filters by the logged-in user.
- Never commit secrets. `.env` is gitignored; add new settings to `packages/backend/.env.example`.

## SRD

When a change affects requirements or the code the traceability matrix points to, update `docs/srd/srd.html`, add a Document History row, and regenerate `docs/srd/LedgerLogic-SRD.pdf`.
