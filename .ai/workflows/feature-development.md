Goal:
- Deliver a new feature from RFC to production with clear accountability and tests.

Trigger:
- Approved RFC or product ticket assigned and prioritized by Orchestrator.

Agent execution order:
1. `architect` drafts or reviews RFC (if needed).
2. `backend-engineer` / `mobile-engineer` implement feature per RFC.
3. `code-reviewer` and at least one human reviewer review PRs.
4. `qa-engineer` runs automated and manual tests.
5. `documentation-agent` updates docs and release notes.
6. `orchestrator` reviews findings and signs off for release.

Expected outputs:
- Merged PR with tests green, updated documentation, QA report, and release notes.

Completion criteria:
- CI passes (lint/tests), critical flows validated by QA, documentation updated, and Orchestrator approval.