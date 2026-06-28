# Test Plan — {{Feature or Release}}

## Scope
What is in scope and out of scope.

## Objectives
- Validate functionality, stability, and security of critical payment flows.

## Test Types
- Unit tests: areas to cover
- Integration tests: provider adapters, API contracts
- End-to-end: merchant happy path (QR, SMS, WhatsApp, link, cash)

## Test Cases (table)
- ID | Title | Preconditions | Steps | Expected Result | Owner
- TC-001 | {{title}} | {{pre}} | {{steps}} | {{expected}} | {{owner}}

## Environment & Data
- Test environment: {{staging details}}
- Required test data and mock configuration

## Entry & Exit Criteria
- Entry: feature branch merged to test, CI green
- Exit: all critical E2E pass, no high-severity bugs

## Schedule & Owners
- Test window: {{dates}}
- Owners: {{qa-engineer name}}

## Reporting
- Deliverables: test report, bug list, regression checklist
