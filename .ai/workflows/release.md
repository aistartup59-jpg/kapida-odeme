Goal:
- Safely deploy a release to production with verifiable rollback and stakeholder communication.

Trigger:
- Orchestrator-approved merge candidate or scheduled release window.

Agent execution order:
1. `qa-engineer` confirms release readiness and collects test artifacts.
2. `documentation-agent` prepares release notes and stakeholder summary.
3. `infrastructure` (via `infrastructure operator` skill) runs IaC plan and pre-deploy checks.
4. `backend-engineer` / `mobile-engineer` coordinate deployment steps.
5. `security-agent` performs final quick security checks.
6. `orchestrator` gives final go/no-go and coordinates rollout.

Expected outputs:
- Deployed release, release notes, monitoring alerts enabled, and rollback plan documented.

Completion criteria:
- Post-deploy smoke tests pass, monitoring shows no critical errors, and stakeholders are notified.