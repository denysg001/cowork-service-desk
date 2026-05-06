# Testing

The CI runs:

```bash
pnpm build
pnpm test
```

Current focused tests cover:

- Ticket optimistic locking.
- Invalid ticket status transitions.
- Cache stampede prevention.
- BullMQ retry/backoff defaults.
- SLA business-hours calculator with pause handling.

Production acceptance target is 70% minimum coverage across API and workers. Coverage reporting is wired, but the current API coverage report is still below that target because route, auth, upload, websocket, CRUD, reports, notification and worker integration suites still need expansion against real PostgreSQL and Redis test containers.

Recommended next suites:

- Auth session rotation, revoke, remote logout, and max-session eviction.
- Idempotent ticket creation replay.
- Soft delete visibility.
- ETag `If-None-Match` behavior.
- Websocket reconnect REST refetch behavior.
- BullMQ final failure persistence in `DeadLetterJob`.
- Upload magic-byte validation and path traversal rejection.
- Graceful degradation with Redis, SMTP, and S3 failures.
