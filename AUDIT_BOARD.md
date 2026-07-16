# Backend Audit Board

# ⚠ Single Source of Truth

This file is the ONLY audit tracking document for the project.

Every audit session MUST begin by reading this file.

Do not create another audit tracker.

Do not rely on conversation history.

Always resume from **Current File**.

---

## Audit Workflow

Every auditable file follows this lifecycle:

⬜ Not Started

↓

🟡 Auditing

↓

🟢 Fully Audited

If any future commit modifies a 🟢 file:

🟢

↓

🟡

↓

Re-audit required

This workflow is permanent.

---

**Project:** Kapıda Ödeme / PayALS
**Last Updated:** 2026-07-17
**Current Phase:** Phase 1 – Authentication Security
**Current Module:** Auth
**Current File:** `auth/guards/jwt-auth.guard.ts`

**Current File Rule**

When a file reaches 🟢 Fully Audited,
Current File automatically becomes the next ⬜ file in the queue.

If no ⬜ files remain,
Current File becomes:

Backend Audit Complete

**Current Activity:** Queued — audit not yet started. Auditing is currently paused; resume only when explicitly instructed.

---

# Overall Progress

**Auditable Files: 65** (98 total backend source files, 33 Not Applicable)

**🟢 Fully Audited**
`⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜` 0 / 65 — 0%

**🟡 Review Started** (includes files already at 🟢)
`🟡🟡⬜⬜⬜⬜⬜⬜⬜⬜` 15 / 65 — 23%

| Status | Meaning | Count |
|---|---|---:|
| 🟢 Fully Audited | Complete manual review finished | 0 / 65 |
| 🟡 Review Started | Fix landed, file not yet fully reviewed | 15 / 65 |
| ⬜ Remaining | Not started | 50 / 65 |
| ⚪ Not Applicable | No business logic — types, enums, DI wiring, barrels | 33 |
| | **Total backend source files** | **98** |

---

# Phase Progress

**Phase 1 – Authentication Security**
0 / 5
`□□□□□□□□□□`

**Phase 2 – Authentication Core**
0 / 18
`□□□□□□□□□□`

**Phase 3 – Payment Provider**
0 / 17
`□□□□□□□□□□`

**Phase 4 – Payment & Transaction**
0 / 14
`□□□□□□□□□□`

**Phase 5 – Merchant**
0 / 6
`□□□□□□□□□□`

**Phase 6 – Database & Shared**
0 / 4
`□□□□□□□□□□`

**Phase 7 – Health**
0 / 1
`□□□□□□□□□□`

Every future session must update these numbers.

---

# Completed Audit Fixes

Chronological, oldest → newest. All authored on `main`, co-authored by Claude Sonnet 5.

| # | Date order | Title | Commit | Module | Type | Status |
|---|---|---|---|---|---|---|
| 1 | oldest | Require JWT secret at startup | `7373276` | Auth | Hardening | Fixed |
| 2 | | Require credential encryption secret | `1125935` | Payment Provider | Hardening | Fixed |
| 3 | | Harden Docker image and CI pipeline | `c20a031` | Infrastructure | Hardening | Fixed |
| 4 | | Wrap transaction and lifecycle update in a single DB transaction | `9fe3157` | Payment / Transaction | Bug Fix | Fixed |
| 5 | | Mark failed provider dispatches as FAILED | `ad7eaf8` | Payment | Bug Fix | Fixed |
| 6 | | Validate enums and preserve provider credentials on DB failure | `47f8d87` | Payment / Merchant | Bug Fix | Fixed |
| 7 | | Deserialize decimal columns as numbers | `556ba2f` | Database / Shared | Bug Fix | Fixed |
| 8 | | Make provider activation atomic | `033443b` | Merchant | Bug Fix | Fixed |
| 9 | | Prevent concurrent overpayment race | `18733d6` | Transaction | Bug Fix | Fixed |
| 10 | | Serialize cancellation with transaction recording | `fdd82e2` | Payment | Bug Fix | Fixed |
| 11 | | Add idempotency protection for provider references | `c5273b7` | Transaction | Bug Fix | Fixed |
| 12 | | Set `paidAt` on first PAID transition | `cda6725` | Transaction | Bug Fix | Fixed |
| 13 | | Enforce employee ownership when recording transactions | `5f27175` | Payment | Bug Fix | Fixed |
| 14 | | Eliminate floating-point payment state drift | `a06cef2` | Transaction | Bug Fix | Fixed |
| 15 | newest | Scope merchant refresh tokens to merchant sessions and enforce expiry | `bc16b12` | Auth | Bug Fix | Fixed |

---

# Current Audit Queue

Every file that still requires auditing (🟡 or ⬜), grouped by phase. 🟢 and ⚪ files are excluded — nothing further is required from them unless a future commit touches a 🟢 file (which resets it to 🟡).

## Phase 1 — Authentication Security
⬜ `auth/guards/jwt-auth.guard.ts`
⬜ `auth/guards/roles.guard.ts`
⬜ `auth/jwt.strategy.ts`
⬜ `auth/decorators/current-user.decorator.ts`
⬜ `auth/decorators/roles.decorator.ts`

## Phase 2 — Authentication Core
🟡 `auth/auth.service.ts` (bc16b12)
🟡 `auth/jwt-secret.ts` (7373276)
🟡 `auth/jwt-config.service.ts` (7373276)
🟡 `main.ts` (7373276)
⬜ `auth/auth.controller.ts`
⬜ `auth/password-hashing.service.ts`
⬜ `auth/entities/merchant.entity.ts`
⬜ `auth/entities/merchant-session.entity.ts`
⬜ `auth/entities/employee.entity.ts`
⬜ `auth/dto/merchant-login.dto.ts`
⬜ `auth/dto/employee-login.dto.ts`
⬜ `auth/dto/create-merchant.dto.ts`
⬜ `auth/dto/create-employee.dto.ts`
⬜ `auth/dto/accept-invitation.dto.ts`
⬜ `auth/dto/reset-password.dto.ts`
⬜ `auth/dto/forgot-password.dto.ts`
⬜ `auth/dto/set-password.dto.ts`
⬜ `auth/dto/refresh-token.dto.ts`

## Phase 3 — Payment Provider
🟡 `payment-provider/security/credential-encryption.service.ts` (1125935)
🟡 `payment-provider/security/credential-encryption-secret.ts` (1125935)
⬜ `payment-provider/security/credential-vault.service.ts`
⬜ `payment-provider/security/credential-masking.service.ts`
⬜ `payment-provider/factory/payment-provider.factory.ts`
⬜ `payment-provider/registry/provider.registry.ts`
⬜ `payment-provider/resolver/provider-resolver.service.ts`
⬜ `payment-provider/adapters/parampos/parampos.adapter.ts`
⬜ `payment-provider/adapters/parampos/parampos.client.ts`
⬜ `payment-provider/adapters/parampos/parampos.config.ts`
⬜ `payment-provider/adapters/parampos/parampos.credentials.ts`
⬜ `payment-provider/entities/merchant-payment-provider.entity.ts`
⬜ `payment-provider/core/provider-error.model.ts`
⬜ `payment-provider/core/provider-credentials.model.ts`
⬜ `payment-provider/core/payment-result.model.ts`
⬜ `payment-provider/core/provider-config.model.ts`
⬜ `payment-provider/core/provider-context.model.ts`

## Phase 4 — Payment & Transaction
🟡 `payment/payment.service.ts` (5f27175, 47f8d87)
🟡 `payment/state-machine/payment-state-machine.service.ts` (9fe3157)
🟡 `payment/engine/payment-engine.service.ts` (fdd82e2, ad7eaf8)
🟡 `payment/entities/payment-request.entity.ts` (556ba2f)
🟡 `transaction/engine/transaction-engine.service.ts` (a06cef2, cda6725, c5273b7, 18733d6, 9fe3157)
🟡 `transaction/entities/transaction.entity.ts` (556ba2f)
⬜ `payment/payment.controller.ts`
⬜ `payment/dto/create-payment-request.dto.ts`
⬜ `payment/dto/create-transaction-request.dto.ts`
⬜ `payment/dto/payment-request-response.dto.ts`
⬜ `payment/dto/transaction-response.dto.ts`
⬜ `payment/dto/list-payment-requests-query.dto.ts`
⬜ `payment/engine/models/payment-execution-context.model.ts`
⬜ `payment/engine/models/payment-execution-result.model.ts`

## Phase 5 — Merchant
🟡 `merchant/merchant-payment-provider.service.ts` (033443b, 47f8d87)
🟡 `merchant/repositories/merchant-payment-provider.repository.ts` (033443b)
⬜ `merchant/merchant-payment-provider.controller.ts`
⬜ `merchant/dto/create-merchant-payment-provider.dto.ts`
⬜ `merchant/dto/update-merchant-payment-provider.dto.ts`
⬜ `merchant/dto/merchant-payment-provider-response.dto.ts`

## Phase 6 — Database & Shared
🟡 `shared/decimal.transformer.ts` (556ba2f)
⬜ `database/migrations/1783976400000-InitialSchema.ts`
⬜ `database/data-source.ts`
⬜ `database/database-connection.options.ts`

## Phase 7 — Health
⬜ `health/health.controller.ts`

---

# Deferred Findings

Only findings that require an architecture change belong here. None recorded yet.

_Format for future entries:_

**Title:**
**Reason:**
**Future Epic:**

---

# Resume Development

```
Backend Audit Complete
        ↓
Backend Freeze
        ↓
Integration Tests
        ↓
Flutter Development
        ↓
Website Development
        ↓
New Features
```

Flutter (`flutter/`) has no tracked implementation yet and Website (`website/`) is still an unmodified Next.js skeleton — both resume only after the backend audit above is complete and frozen.

---

# Session Notes

**Current Branch:** main

**Last Commit:** `bc16b12`

**Current Audit Phase:** Phase 1 – Authentication Security

**Current File:** `auth/guards/jwt-auth.guard.ts`

**Last completed task:** `bc16b12` — scope merchant refresh tokens to merchant sessions and enforce expiry (last commit on `main`). Since then, work has been documentation-only: replacing the audit tracker with this board.

**Current task:** Establishing `AUDIT_BOARD.md` as the single tracking document, replacing the deleted `AUDIT_STATUS.md`. No file audit is in progress.

**Next task:** Resume Phase 1 — audit `auth/guards/jwt-auth.guard.ts`, then proceed down the Phase 1 list, once the user explicitly says to resume auditing.

**Blocked by:** Explicit user go-ahead to resume auditing. No further code changes or commits happen until then.

**Important reminders:**
- Only `PaymentStateMachineService.applyTransition()` may change `PaymentRequest.status` (ADR-011).
- Financial history is append-only — `Transaction` rows and `paidAmount` are immutable once written; lifecycle transitions (including cancellation) must never touch them (ADR-012).
- `remainingAmount` is always derived, never stored (ADR-002).
- QR always means a real Bank QR — never generated from a Payment Link (ADR-003).
- Single endpoint `POST /payments`; `merchantId`/`employeeId` always come from JWT, never client input (ADR-005).
- Do not modify Authentication or Authorization unless explicitly requested.
- Reuse Before Create (ADR-010) and YAGNI (ADR-009) apply to any new code.
- Always run `npm run build` before finishing backend work.
- Never commit or push without explicit user approval.
- 🟢 is only earned by a complete manual review of the whole file — a fix commit alone keeps a file at 🟡, never 🟢.

---

# Audit Session Rules

Every audit session MUST follow this workflow.

1.
Read AUDIT_BOARD.md first.

2.
Resume from Current File.

3.
Audit exactly one file.

4.
If no issue is found:

⬜ → 🟢

Update:
- Overall Progress
- Phase Progress
- Current File
- Audit Log

5.
If an issue is found:

Fix

Run build

Wait for explicit user approval

Commit

Update:

- Completed Audit Fixes
- Overall Progress
- Phase Progress
- Current File
- Audit Log

The file remains 🟡 until the entire file has been reviewed.

6.
Move Current File to the next ⬜ file.

Repeat until:

Backend Audit Complete.

---

# Audit Log

Record only important audit-board milestones.

**2026-07-17**
- AUDIT_BOARD.md created.
- AUDIT_STATUS.md retired.
- Documentation only.
- No production code changed.
- Backend audit will resume from:
  Phase 1
  auth/guards/jwt-auth.guard.ts

Future sessions will append new entries here.
