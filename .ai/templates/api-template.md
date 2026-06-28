# API Design Template — {{API / Feature Name}}

## Purpose
Short description of what this API serves and which consumers (mobile) will use it.

## Endpoints (resource-oriented)
- `GET /{{resource}}` — Purpose: {{brief}}
- `GET /{{resource}}/{id}` — Purpose: {{brief}}
- `POST /{{resource}}` — Purpose: {{brief}}
- `PUT /{{resource}}/{id}` — Purpose: {{brief}}
- `DELETE /{{resource}}/{id}` — Purpose: {{brief}}

## Authentication & Authorization
- Auth method: {{e.g., Bearer JWT}}
- Required scopes/roles: {{list}}

## Versioning
- Version: `v{{n}}` if breaking changes required. Migration notes: {{brief}}

## Error handling
- Standard error format: `{ code, message, details? }`
- Common status codes and meanings for this API

## Rate limiting & quotas
- Limits (if applicable): {{brief}}

## Notes & Examples
- Example usage and brief notes for mobile integration: {{example}}

## Backwards compatibility
- Compatibility guarantees and deprecation policy.

## References
- Related ADRs or docs: {{link}}
