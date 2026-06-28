Purpose:
- Guide design of relational models and relationships for business entities (PostgreSQL).

When to use:
- Defining relationships, preparing migrations, or reviewing schema changes.

Inputs:
- Domain model (approved) and feature requirements
- Existing DB migration history (if any)

Outputs:
- Relationship diagrams and migration strategy notes (no SQL)
- Recommendations for indexing and retention policies

Rules:
- Model relationships to reflect business invariants; prefer clarity over premature optimization.
- Avoid storing secrets or raw payment data beyond necessary tokens.
- Propose migrations with rollback and data-migration plans.

Checklist:
- [ ] Validate relationships against domain model
- [ ] Propose migration plan and downtime impact
- [ ] Add retention and backup recommendations
- [ ] Flag any PII handling for security review