Purpose:
- Provide reusable guidance for implementing backend features and safe code edits in the NestJS service.

When to use:
- Implementing modules, endpoints, background jobs, or provider adapters.

Inputs:
- Approved RFC or ticket
- API contract (public endpoints)
- Domain model and module list

Outputs:
- Pull request with code changes, tests, and updated docs
- CI-ready artifacts and test reports

Rules:
- Follow NestJS feature-module pattern and locked architecture decisions.
- Never introduce secrets into code; use config and secret store.
- Add unit and integration tests for business-critical flows.
- Propose new dependencies only with security/maintenance notes.

Checklist:
- [ ] Confirm RFC and API contract present
- [ ] Create feature module and unit tests
- [ ] Add integration tests for external provider calls (mocked)
- [ ] Update docs and PR description with impact notes