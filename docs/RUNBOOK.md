# Runbook

1. Copy `.env.example` to `.env` and replace all secrets.
2. Start infrastructure with `pnpm docker:up`.
3. Apply migrations with `pnpm db:migrate`.
4. Seed the initial admin with `pnpm db:seed`.
5. Open `http://localhost:8080`.

Default seed login:

- Email: `admin@cowork.local`
- Password: `Admin123!ChangeMe`

## Backups

Create a backup:

```bash
bash scripts/backup-postgres.sh
```

Run restore verification:

```bash
bash scripts/restore-test.sh
```
