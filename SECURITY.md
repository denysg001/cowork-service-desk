# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| `0.x-alpha` | Security reports accepted, production hardening in progress |

## Reporting A Vulnerability

Do not open a public issue for suspected vulnerabilities.

Contact: `security@example.com`

Include:

- affected component;
- reproduction steps;
- impact;
- logs or screenshots with secrets removed;
- suggested mitigation if known.

## Response SLA

- Initial acknowledgement: 3 business days.
- Triage target: 7 business days.
- Critical vulnerability mitigation plan: as soon as practical after validation.

## Disclosure

Coordinated disclosure is preferred. Public disclosure should wait until a fix or mitigation is available unless there is active exploitation.

## Security Principles

- No secrets in Git.
- No wildcard CORS with credentials.
- No refresh tokens in localStorage.
- No Redis-backed source of truth for sessions.
- No file upload trust based on client content-type.
- No production destructive migrations.
