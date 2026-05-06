# Contributing

## Branches

- `main`: production.
- `develop`: staging.
- `feature/*`: net-new functionality.
- `fix/*`: bug fixes.
- `release/*`: release preparation.
- `hotfix/*`: urgent production fixes.

## Commits

Use Conventional Commits:

- `feat(tickets): add optimistic locking`
- `fix(auth): rotate refresh token inside transaction`
- `docs(readme): add production deployment guide`
- `security(upload): enforce magic-byte validation`

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`, `perf`, `security`, `infra`.

## Pull Requests

Every PR must complete `.github/PULL_REQUEST_TEMPLATE.md`. Architecture, concurrency, consistency, rollback, observability and TestSprite validation are first-class review items.

## Migrations

Use forward-only, non-destructive migrations in production. Prefer expand/contract:

1. add nullable columns/tables/indexes;
2. backfill safely;
3. deploy code that reads/writes both when needed;
4. remove old schema only after compatibility windows.

Never run `prisma reset` in production.

## Quality Gates

Run:

```bash
npx pnpm@9.12.3 build
npx pnpm@9.12.3 test
```

Coverage target is 70% minimum before production stabilization.

## Review Focus

- RBAC and data visibility.
- Prisma transaction safety.
- N+1 query prevention.
- Cache invalidation.
- Idempotency and retries.
- Distributed locks.
- Graceful degradation.
- Logs and metrics.
