Purpose:
- Provide reusable testing practices and orchestration steps for CI and local runs.

When to use:
- Adding or updating test coverage, or when validating CI failures.

Inputs:
- Code changes and test plans
- CI configuration and test artifacts

Outputs:
- Test commands, expected coverage targets, and failure triage notes

Rules:
- Critical flows (payments, provider integrations, cash recording) require unit + integration tests.
- CI must fail on test regressions; flaky tests must be fixed before merging.
- Include mocking strategies for external providers and clear seeds for reproducible tests.

Checklist:
- [ ] Add unit tests for new logic
- [ ] Add integration tests for provider adapters (mocked)
- [ ] Ensure CI config runs tests and reports coverage
- [ ] Document how to run tests locally and reproduce CI failures