# Backup And Restore

## Backup

```bash
bash infra/scripts/backup.sh
```

Backups use `pg_dump --format=custom`.

## Restore Test

```bash
bash infra/scripts/restore-test.sh
```

Restore tests should run against an isolated database, never directly over production.

## Retention

Recommended minimum:

- daily backups for 14 days;
- weekly backups for 8 weeks;
- monthly backups for 12 months.

## Disaster Recovery

1. Provision PostgreSQL.
2. Restore latest verified backup.
3. Run migrations if needed.
4. Start Redis fresh.
5. Start API and workers.
6. Validate `/ready`, login, ticket list, worker logs and websocket.
