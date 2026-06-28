Purpose:
- Standardize feature implementation and maintenance for the Flutter merchant app.

When to use:
- Adding features, fixing bugs, or producing builds for QA/release.

Inputs:
- API spec for public endpoints
- UX/flow approval (no screens required)
- Feature ticket or RFC

Outputs:
- Feature branch with Dart code, unit/widget tests, and build artifacts
- Release notes and testing instructions

Rules:
- Follow feature-first project layout and Riverpod-based state patterns.
- Use dependency injection and centralized config; do not hardcode endpoints or keys.
- Include tests for critical payment flows and offline handling.
- Avoid platform-specific work unless necessary; document any native code changes.

Checklist:
- [ ] Confirm API compatibility and contracts
- [ ] Implement feature in feature module and add tests
- [ ] Verify push and notification integration in QA
- [ ] Provide build/test instructions in PR