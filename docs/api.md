# API

All business routes are versioned under `/api/v1`.

Unversioned operational routes:

- `GET /health`
- `GET /ready`
- `GET /metrics`

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "correlationId": "uuid",
    "details": {}
  }
}
```

## Pagination

List endpoints return:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "order": ["createdAt DESC", "id DESC"]
  }
}
```

Default `page` is `1`, default `limit` is `20`, max `limit` is `100`.

## Idempotency-Key

Critical POST endpoints should accept `Idempotency-Key` or request body `idempotencyKey`:

- ticket creation;
- message creation;
- attachments;
- report job creation.

The stored record must include key, request hash, response, status code and expiration.

## ETag

Single-resource GETs may return an ETag based on `updatedAt + version`. Clients can send `If-None-Match` and receive `304 Not Modified`.

## Route Catalog

The target API catalog includes auth, users, companies, rooms, categories, suppliers, tickets, chat, dashboard, reports, notifications and admin DLQ. Current implementation is being expanded from the initial auth/tickets/dashboard/upload foundation.
