Goal:
- Ensure code quality, security, and adherence to project rules before merging.

Trigger:
- Any pull request that modifies code, infra, or config.

Agent execution order:
1. `code-reviewer` performs automated linting and static analysis.
2. `security-agent` runs dependency and secret scans for sensitive changes.
3. Human reviewer(s) perform functional and architectural review.
4. `code-reviewer` re-checks after author updates.
5. `orchestrator` provides final approval for production-impacting changes.

Expected outputs:
- Review comments, required fixes, security findings, and a merge-ready PR.

Completion criteria:
- No blocking findings remain, CI passes, required approvals obtained, and Orchestrator acknowledges readiness.