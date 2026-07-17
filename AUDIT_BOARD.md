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
**Current File:** `auth/jwt.strategy.ts`

**Current File Rule**

When a file reaches 🟢 Fully Audited,
Current File automatically becomes the next ⬜ file in the queue.

If no ⬜ files remain,
Current File becomes:

Backend Audit Complete

**Current Activity:** Auditing in progress — resumed by explicit user instruction. `auth/guards/jwt-auth.guard.ts` fully audited, no issue found. `auth/guards/roles.guard.ts` audited: guard logic itself correct, but no JWT ever carried a `role` claim, so its one consumer (`POST /auth/employee`, `@Roles(OWNER)`) rejected every caller. Fixed in `auth.service.ts` (`af32185`) — merchant JWTs now carry `role: OWNER`, employee JWTs carry `role: employee.role`. `roles.guard.ts` marked 🟢 (guard logic confirmed correct end-to-end); `auth.service.ts` stays 🟡 (fix landed, full-file review still pending — its turn is later in Phase 2). Paused pending user direction to continue.

---

# Overall Progress

**Auditable Files: 65** (98 total backend source files, 33 Not Applicable)

**🟢 Fully Audited**
`🟢🟢⬜⬜⬜⬜⬜⬜⬜⬜` 2 / 65 — 3%

**🟡 Review Started** (includes files already at 🟢)
`🟡🟡🟡⬜⬜⬜⬜⬜⬜⬜` 17 / 65 — 26%

| Status | Meaning | Count |
|---|---|---:|
| 🟢 Fully Audited | Complete manual review finished | 2 / 65 |
| 🟡 Review Started | Fix landed, file not yet fully reviewed | 15 / 65 |
| ⬜ Remaining | Not started | 48 / 65 |
| ⚪ Not Applicable | No business logic — types, enums, DI wiring, barrels | 33 |
| | **Total backend source files** | **98** |

---

# Phase Progress

**Phase 1 – Authentication Security**
2 / 5
`■■□□□□□□□□`

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
| 15 | | Scope merchant refresh tokens to merchant sessions and enforce expiry | `bc16b12` | Auth | Bug Fix | Fixed |
| 16 | newest | Include role claim in merchant and employee JWTs so RolesGuard is functional | `af32185` | Auth | Bug Fix | Fixed |

---

# Current Audit Queue

Every file that still requires auditing (🟡 or ⬜), grouped by phase. 🟢 and ⚪ files are excluded — nothing further is required from them unless a future commit touches a 🟢 file (which resets it to 🟡).

## Phase 1 — Authentication Security
⬜ `auth/jwt.strategy.ts`
⬜ `auth/decorators/current-user.decorator.ts`
⬜ `auth/decorators/roles.decorator.ts`

## Phase 2 — Authentication Core
🟡 `auth/auth.service.ts` (bc16b12, af32185)
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

**Last Commit:** `af32185`

**Current Audit Phase:** Phase 1 – Authentication Security

**Current File:** `auth/jwt.strategy.ts`

**Last completed task:** Audited `auth/guards/roles.guard.ts`. Found and fixed a real bug: no JWT ever carried a `role` claim, so the guard's one consumer (`POST /auth/employee`, `@Roles(OWNER)`) rejected every caller, including legitimate merchant owners. Fixed in `auth.service.ts` — merchant JWTs now carry `role: OWNER`, employee JWTs carry `role: employee.role`. Build passed, user approved, committed and pushed as `af32185`. `roles.guard.ts` marked 🟢; `auth.service.ts` stays 🟡 (fix landed, full-file review still pending).

**Current task:** None in progress. Paused after `auth/guards/roles.guard.ts`, awaiting user direction to continue.

**Next task:** Audit `auth/jwt.strategy.ts`, then proceed down the Phase 1 list, once the user explicitly says to continue.

**Blocked by:** Explicit user go-ahead to continue auditing the next file. No further code changes or commits happen until then.

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

**2026-07-17 (cont.)**
- Resumed auditing by explicit user instruction.
- Audited `auth/guards/jwt-auth.guard.ts`: simple delegation to `AuthGuard('jwt')`, no custom logic, no global `APP_GUARD` override, correctly applied per-controller across `auth`, `payment`, and `merchant` controllers. No issue found.
- Marked 🟢 Fully Audited. No code changes, no commit needed.
- Current File advanced to `auth/guards/roles.guard.ts`.

**2026-07-18**
- Resumed auditing by explicit user instruction.
- Audited `auth/guards/roles.guard.ts`: guard logic itself correct (reads required roles via `Reflector`, fails closed with `ForbiddenException` if the user or role is missing). Found the guard's only consumer, `POST /auth/employee` (`@Roles(OWNER)`), was completely unusable — no JWT (merchant or employee) ever carried a `role` claim, verified end-to-end (JWT signing in `auth.service.ts`, `JwtStrategy.validate()`, and a full-codebase search confirmed no other code ever set it).
- Discussed real-world patterns (embed role in JWT vs. per-request DB lookup vs. hybrid) with the user; user chose embedding the role in the JWT for architectural consistency with the existing short-lived access token + refresh rotation design.
- Fixed in `auth.service.ts`: merchant login/refresh now sign `role: Role.OWNER`; employee login/refresh now sign `role: employee.role` from the database. Build passed. User approved. Committed and pushed as `af32185`.
- Marked `auth/guards/roles.guard.ts` 🟢 Fully Audited. `auth/auth.service.ts` remains 🟡 (fix landed, full-file review still pending in Phase 2).
- Current File advanced to `auth/jwt.strategy.ts`.

Future sessions will append new entries here.
