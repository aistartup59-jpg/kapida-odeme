Purpose:
- Produce and maintain concise, link-first documentation for features, RFCs, and operational runbooks.

When to use:
- Writing feature READMEs, release notes, or updating `docs/PROJECT_SPEC.md`.

Inputs:
- Feature RFC, PR diffs, and key design decisions

Outputs:
- Short README, changelog entry, and stakeholder summary

Rules:
- Link, don't duplicate existing docs; keep docs <200 lines where possible.
- Always update `docs/PROJECT_SPEC.md` for architecture-level changes.
- Include migration notes for breaking changes.

Checklist:
- [ ] Create or update feature README
- [ ] Add changelog entry for releases
- [ ] Provide upgrade/migration notes if applicable
- [ ] Add one-line user-impact summary for stakeholders