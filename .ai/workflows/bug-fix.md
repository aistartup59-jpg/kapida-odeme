Goal:
- Fix a confirmed defect quickly while preserving stability and traceability.

Trigger:
- Bug report from QA, production alert, or user feedback triaged by Orchestrator.

Agent execution order:
1. `qa-engineer` or monitoring alerts identify and triage the bug.
2. `backend-engineer` / `mobile-engineer` reproduce and prepare a fix branch.
3. `code-reviewer` reviews the fix; human reviewer approves.
4. `qa-engineer` verifies the fix in a test environment.
5. `documentation-agent` records the bug and fix in changelog.
6. `orchestrator` approves deployment to production.

Expected outputs:
- PR with fix, test that reproduces the bug (or regression test), QA verification, and changelog entry.

Completion criteria:
- Regression test passes, CI green, QA sign-off, and Orchestrator approval for release.