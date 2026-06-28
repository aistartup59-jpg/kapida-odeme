Purpose:
- Quickly analyze repository health, discover architecture, and summarize gaps for onboarding agents.

When to use:
- Onboarding a new agent or before any large change; after workspace updates or when asked for a high-level report.

Inputs:
- Repository root path
- `docs/PROJECT_SPEC.md` and existing docs
- Key files and folder list provided by agents

Outputs:
- Concise summary of repo layout and missing artifacts
- Suggested next actions and risks
- List of files and areas needing human review

Rules:
- Do not modify files or run destructive commands.
- Keep summaries factual and cite paths to supporting files.
- Highlight assumptions and uncertain areas explicitly.

Checklist:
- [ ] Confirm `docs/PROJECT_SPEC.md` present and read
- [ ] List top-level folders and detected tech locks
- [ ] Identify missing core files (CI, infra, README)
- [ ] Produce recommended next steps (1–3 bullets)