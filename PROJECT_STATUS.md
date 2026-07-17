# Project Status

_Source of truth for current project state. Generated from repository contents and commit history on 2026-07-17._

## Current Project Goal

Kapıda Ödeme is a hybrid payment platform connecting merchants and delivery employees, supporting QR (real Bank QR / TR Karekod), NFC, Payment Link, and Cash payment methods, including hybrid/partial payment flows across multiple transactions per order.

The backend is built to remain provider-independent, platform-independent, API-first, and modular (see Locked Architecture in `CLAUDE.md`).

## Current Architecture

- **Backend**: NestJS/TypeScript (`backend/`), TypeORM with migrations, PostgreSQL-style decimal columns.
  - `modules/auth` — merchant & employee authentication, JWT, roles/guards, sessions
  - `modules/merchant` — merchant payment provider configuration
  - `modules/payment` — PaymentRequest domain, payment engine orchestration, state machine
  - `modules/payment-provider` — provider abstraction (`PaymentProvider` interface), ParamPOS adapter, credential vault/encryption
  - `modules/transaction` — Transaction engine (append-only ledger)
  - `modules/notification` — empty module scaffold, no implementation yet
  - `modules/health` — platform health check
  - `database/` — TypeORM data source, migrations, decimal transformer
- **Flutter app** (`flutter/`): no tracked files in the repository (skeleton not yet committed).
- **Website** (`website/`): Next.js project skeleton (16 tracked source files), unchanged since initial scaffold — no product-specific implementation yet.
- **Orchestration call chain** (ADR-007): `PaymentService → PaymentEngine → PaymentProviderFactory → PaymentProvider interface → Provider Adapter → Provider API`.

## Completed Milestones

Chronologically, based on commit history:

1. Project skeletons created (backend, Flutter, website), shared dev environment, platform health check.
2. Authentication foundation: merchant registration/login, merchant session architecture, refresh token rotation, merchant logout.
3. Authorization: role-based authorization, employee invitation flow, employee login, employee session management.
4. Payment domain model and payment request API (`POST /payments`, ADR-005).
5. Payment provider foundation: generic provider core, ParamPOS adapter (auth + skeleton), credential security (vault, encryption, masking).
6. Merchant payment provider domain and API (create/update/activate provider per merchant).
7. Payment engine foundation, integrated with the state machine, provider factory, and active-provider resolution from merchant configuration.
8. Payment lifecycle state unified; payment lifecycle transitions centralized in `PaymentStateMachineService` (ADR-011).
9. Transaction engine foundation and hybrid payment transaction flow completed (multiple transactions per payment request).
10. Payment method dispatch and transaction recording; payment request query API; payment cancellation flow.
11. Database migration foundation added.
12. Security hardening: JWT secret required at startup, credential encryption secret required, Docker image and CI pipeline hardened.
13. Post-implementation audit/fix cycle (12 fix commits) across auth, payment, transaction, merchant, and database layers — see `AUDIT_STATUS.md` for the full list.

## Current Development Phase

Post-implementation correctness audit and stabilization of the core payment/transaction lifecycle, following completion of the core epics (auth, payment domain, provider orchestration, hybrid transactions). Per explicit user instruction, all auditing has been stopped and no further code changes are being made until this status is reviewed.

## Last Completed Development Task

`bc16b12` — `fix(auth): scope merchant refresh to merchant sessions and enforce expiry` (most recent commit on `main`).

## Next Planned Development Task

Not yet determined — development is paused pending user review of `PROJECT_STATUS.md` and `AUDIT_STATUS.md`, per explicit instruction to regain control before continuing.

## Known Technical Decisions (ADR Summary)

| ADR | Title | Summary |
|---|---|---|
| ADR-001 | PaymentRequest ↔ Transaction | Merchant 1→N PaymentRequest; PaymentRequest 1→N Transaction. |
| ADR-002 | Hybrid / Partial Payments | `remainingAmount` is never stored; always derived from `totalAmount - sum(Transaction.amount)`. |
| ADR-003 | QR Semantics | QR always means a real Bank QR (TR Karekod / EMV QR); never generated from a Payment Link. |
| ADR-004 | Payment Method / Delivery Channel | PaymentMethod: QR, PAYMENT_LINK, NFC, CASH. DeliveryChannel: NONE, SMS, WHATSAPP, COPY_LINK. SMS/WhatsApp are delivery only, not payment methods. |
| ADR-005 | Single Payment Endpoint | `POST /payments` only; `merchantId`/`employeeId` always derived from JWT, never from client input. |
| ADR-006 | Customer Secure Mode | Mandatory secure UI mode for customer authentication (e.g. NFC PIN): hides employee/merchant/order info, randomized keypad, auto-return to Employee Mode. |
| ADR-007 | Payment Orchestration Architecture | Business logic never references a specific provider; all providers implement the `PaymentProvider` interface; new providers require only an adapter + registration. |
| ADR-009 | YAGNI | No speculative fields/abstractions ahead of an implemented business capability. |
| ADR-010 | Reuse Before Create | Search and reuse/refactor existing services before creating new ones; no parallel orchestration paths. |
| ADR-011 | Payment Lifecycle Ownership | Only `PaymentStateMachineService` may mutate `PaymentRequest.status`; all transitions after creation go through `applyTransition()`. |
| ADR-012 | Financial History Immutability | Transactions are append-only and immutable; `paidAmount` only advances via new Transactions; lifecycle transitions (including cancellation) may change `status` only, never financial data; refunds must be new ledger entries, never rewrites. |

(ADR-006 through ADR-012 confirmed present in `docs/adr/`; ADR-008 is not present in the repository.)

## What Is Considered Production-Ready

Based on repository evidence (implemented, integrated, and subject to the fix cycle documented in `AUDIT_BOARD.md`):

- Merchant registration, login, session management, refresh token rotation, logout
- Employee invitation, login, session management, role-based authorization
- Payment request creation via the single `POST /payments` endpoint with JWT-derived identity
- Payment engine orchestration through the provider abstraction (ParamPOS adapter)
- Payment lifecycle state machine and centralized transition enforcement
- Hybrid/partial transaction recording with append-only ledger semantics
- Payment cancellation flow
- Credential encryption (AES-256-GCM) and required-secret startup checks
- Database migrations and decimal-safe persistence

## What Is Still Under Development

- `modules/notification` — module scaffold exists with no controllers/providers/logic implemented
- Flutter mobile app — no tracked implementation in the repository
- Website — Next.js skeleton only, no product-specific pages or integration
- Refund flow — explicitly deferred by ADR-012 ("exact refund event model is left to the future Refund epic")
- Additional payment providers beyond ParamPOS — architecture supports them (ADR-007) but none are implemented
- Credential vault persistence — `CredentialVaultService` stores vaulted provider credentials in an in-memory `Map` only (self-documented placeholder); lost on restart and not shared across instances. Encryption itself is sound, only the storage layer is a placeholder. See `AUDIT_BOARD.md` Deferred Findings.
- Any module or area not yet covered by the audit cycle — see `AUDIT_BOARD.md` for the module-by-module breakdown
