Purpose:
- Produce and maintain public REST API contracts used by the mobile app.

When to use:
- Designing new endpoints, versioning APIs, or changing public contracts.

Inputs:
- Domain model and locked backend decisions
- Use cases or feature RFC

Outputs:
- Endpoint list, HTTP methods, and short-purpose notes (no request/response bodies here)
- Versioning notes and migration guidance

Rules:
- Keep APIs resource-oriented and stable; prefer additive changes.
- Version breaking changes and provide migration guidance.
- Document authentication, rate limits, and error semantics.
- Do not expose internal implementation details.

Checklist:
- [ ] Map endpoints to domain features
- [ ] Define auth and rate-limit requirements
- [ ] Specify versioning plan if breaking
- [ ] Add short examples and consumer notes