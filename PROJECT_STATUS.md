# Project Status

_Source of truth for current project state. Generated from repository contents and commit history on 2026-07-17._

## Current Project Goal

Kapıda Ödeme is a hybrid payment platform connecting merchants and delivery employees. Payment is accepted at the door on a POS device via QR (real Bank QR / TR Karekod), NFC, or Cash (ADR-013), including hybrid/partial payment flows across multiple transactions per order.

The backend is built to remain provider-independent, platform-independent, API-first, and modular (see Locked Architecture in `CLAUDE.md`).

## Current Architecture

- **Backend**: NestJS/TypeScript (`backend/`), TypeORM with migrations, PostgreSQL-style decimal columns.
  - `modules/auth` — merchant & employee authentication, JWT, roles/guards, sessions
  - `modules/merchant` — merchant payment provider configuration
  - `modules/payment` — PaymentRequest domain, payment engine orchestration, state machine
  - `modules/payment-provider` — provider abstraction (`PaymentProvider` interface), ParamPOS adapter, credential vault/encryption
  - `modules/transaction` — Transaction engine (append-only ledger)
  - `modules/partner` — order platform integration: merchant-issued API keys and the payment verification endpoint (ADR-015)
  - `modules/health` — platform health check
  - `database/` — TypeORM data source, migrations, decimal transformer
- **Flutter app** (`mobile/`): Android-only POS app serving both audiences (ADR-015). A small business signs up or signs in and keys the amount in by hand; an order platform's courier arrives on a hand-off deep link with no account at all. Both then use the same collection screen: real Bank QR for the remaining amount, cash, multiple transactions per payment, and — for a hand-off — an automatic return to the platform's app once paid. NFC is present in the flow but inert until a certified SoftPOS SDK is integrated. `API_BASE_URL` is a `--dart-define` build argument, and release signing is read from the git-ignored `android/key.properties`.
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
| ADR-004 | Payment Method / Delivery Channel | **Superseded by ADR-013.** |
| ADR-005 | Single Payment Endpoint | `POST /payments` only; `merchantId`/`employeeId` always derived from JWT, never from client input. |
| ADR-006 | Customer Secure Mode | Mandatory secure UI mode for customer authentication (e.g. NFC PIN): hides employee/merchant/order info, randomized keypad, auto-return to Employee Mode. |
| ADR-007 | Payment Orchestration Architecture | Business logic never references a specific provider; all providers implement the `PaymentProvider` interface; new providers require only an adapter + registration. |
| ADR-009 | YAGNI | No speculative fields/abstractions ahead of an implemented business capability. |
| ADR-010 | Reuse Before Create | Search and reuse/refactor existing services before creating new ones; no parallel orchestration paths. |
| ADR-011 | Payment Lifecycle Ownership | Only `PaymentStateMachineService` may mutate `PaymentRequest.status`; all transitions after creation go through `applyTransition()`. |
| ADR-012 | Financial History Immutability | Transactions are append-only and immutable; `paidAmount` only advances via new Transactions; lifecycle transitions (including cancellation) may change `status` only, never financial data; refunds must be new ledger entries, never rewrites. |
| ADR-013 | POS-Only Payment Acceptance | PaymentMethod: QR, NFC, CASH. Payment Links and the whole DeliveryChannel concept are removed. QR is the only method that dispatches to a provider at creation time. Pre-ADR-013 rows keep their recorded values. |
| ADR-014 | Open Provider Registry | A provider is a free-form string id, never an enum; `ProviderRegistry` is the source of truth for what is installed; adding a provider needs no enum edit and no migration. |
| ADR-015 | Two Products, One App | Small businesses sign up and sign in; order platform couriers never sign in. The platform's backend mints a hand-off token with its API key, the deep link carries only that token, and the token is scoped to one PaymentRequest — no hand-off endpoint accepts a payment id. The platform confirms the result server side. |

(ADR-006 through ADR-014 confirmed present in `docs/adr/`; ADR-008 is not present in the repository.)

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
