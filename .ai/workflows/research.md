Goal:
- Produce time-boxed, evidence-backed recommendations for decisions (vendors, libraries, approaches).

Trigger:
- Request from Orchestrator, Architect, or when an agent encounters an unclear technology choice.

Agent execution order:
1. `research-agent` performs focused comparison and gathers sources.
2. `architect` reviews trade-offs and validates constraints.
3. `security-agent` or `backend-engineer` reviews any security or implementation concerns.
4. `orchestrator` decides and issues an RFC or next steps.

Expected outputs:
- Short report with 2–3 options, pros/cons, one recommended choice, and sources.

Completion criteria:
- Orchestrator accepts the recommendation or requests follow-up; report stored in `.ai/research` and linked to RFCs.