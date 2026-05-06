# Security

## Auth

Access tokens are JWTs with short expiration. Refresh tokens are stored in httpOnly cookies and rotated on use. Sessions are persisted in PostgreSQL and can be revoked.

## RBAC

Target roles:

- `CLIENT`: company users.
- `OPERATOR`: coworking staff.
- `ADMIN`: full control.

Authorization must be enforced in backend services and routes.

## CORS

Never use wildcard origin with credentials. Use an explicit frontend allow-list.

## CSP And Headers

Required headers:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` in production HTTPS only.

## Uploads

Uploads must validate:

- filename sanitization;
- path traversal;
- extension;
- declared content-type;
- magic bytes with `file-type`;
- size limit.

## Rate Limits

Target limits:

- login: 5/min/IP;
- refresh: 10/min/IP;
- ticket create: 10/h/user;
- messages: 30/min/user;
- attachments: 10/h/user;
- websocket: one active connection per user.

## Logging

Never log passwords, tokens, cookies, Authorization headers or huge payloads.

## Threat Model

Primary threats:

- stolen refresh token;
- privilege escalation between CLIENT and OPERATOR;
- upload abuse;
- CORS misconfiguration;
- websocket room leakage;
- cache exposure of personalized data;
- destructive migrations.
