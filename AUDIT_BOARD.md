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
**Current Phase:** Phase 6 – Database & Shared
**Current Module:** Database & Shared
**Current File:** `shared/decimal.transformer.ts`

**Current File Rule**

When a file reaches 🟢 Fully Audited,
Current File automatically becomes the next ⬜ file in the queue.

If no ⬜ files remain,
Current File becomes:

Backend Audit Complete

**Current Activity:** Continuous audit mode (per user instruction 2026-07-18: proceed through no-issue files autonomously, commit without asking, only interrupt for real bugs). **Phases 1, 2, 3, 4, 5 all complete.** Phase 4 (core financial lifecycle) verified carefully against ADR-011/012: state machine transition table, `.status` mutation confirmed centralized (grepped whole codebase), pessimistic-write locking confirmed to correctly serialize `cancelPayment` against `createTransaction` on the same row, idempotent provider-reference replay protection confirmed. Found and fixed one real bug: `calculateRemainingAmount()` didn't round its result, causing float-drift artifacts (e.g. `19.9 - 19.1` → `0.7999999999999989`) in the `remainingAmount` shown on every partial payment (`4c764a9`). Only Phase 6 (Database & Shared) and Phase 7 (Health) remain — 5 files total.

---

# Overall Progress

**Auditable Files: 65** (98 total backend source files, 33 Not Applicable)

**🟢 Fully Audited**
`🟢🟢🟢🟢🟢🟢🟢🟢🟢⬜` 60 / 65 — 92%

**🟡 Review Started** (includes files already at 🟢)
`🟡🟡🟡🟡🟡🟡🟡🟡🟡⬜` 61 / 65 — 94%

| Status | Meaning | Count |
|---|---|---:|
| 🟢 Fully Audited | Complete manual review finished | 60 / 65 |
| 🟡 Review Started | Fix landed, file not yet fully reviewed | 1 / 65 |
| ⬜ Remaining | Not started | 4 / 65 |
| ⚪ Not Applicable | No business logic — types, enums, DI wiring, barrels | 33 |
| | **Total backend source files** | **98** |

---

# Phase Progress

**Phase 1 – Authentication Security**
5 / 5
`■■■■■■■■■■`

**Phase 2 – Authentication Core**
18 / 18
`■■■■■■■■■■`

**Phase 3 – Payment Provider**
17 / 17
`■■■■■■■■■■`

**Phase 4 – Payment & Transaction**
14 / 14
`■■■■■■■■■■`

**Phase 5 – Merchant**
6 / 6
`■■■■■■■■■■`

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
| 16 | | Include role claim in merchant and employee JWTs so RolesGuard is functional | `af32185` | Auth | Bug Fix | Fixed |
| 17 | | Scope merchant logout to the merchant's own session | `bd594b4` | Auth | Bug Fix | Fixed |
| 18 | | Register global ValidationPipe; add missing validators to 13 DTOs | `39ada07` | Auth / Payment / Merchant | Bug Fix | Fixed |
| 19 | newest | Round remainingAmount to avoid float drift | `4c764a9` | Transaction | Bug Fix | Fixed |

---

# Current Audit Queue

Every file that still requires auditing (🟡 or ⬜), grouped by phase. 🟢 and ⚪ files are excluded — nothing further is required from them unless a future commit touches a 🟢 file (which resets it to 🟡).

## Phase 6 — Database & Shared
🟡 `shared/decimal.transformer.ts` (556ba2f)
⬜ `database/migrations/1783976400000-InitialSchema.ts`
⬜ `database/data-source.ts`
⬜ `database/database-connection.options.ts`

## Phase 7 — Health
⬜ `health/health.controller.ts`

---

# Deferred Findings

Only findings that require an architecture change belong here.

**Title:** `CredentialVaultService` uses in-memory storage only, no persistence

**Reason:** `payment-provider/security/credential-vault.service.ts` stores vaulted merchant provider credentials in a plain in-process `Map` (self-documented in the code as "Placeholder in-memory store. Persistent storage is out of scope for this sprint."). Credentials are lost on every restart/deploy and are not shared across multiple app instances. This contradicts `PROJECT_STATUS.md`, which currently lists "Credential vault/encryption" under production-ready features. Per user (2026-07-18): likely an intentional gap, left open because persistent storage design shouldn't be built around any single provider (ParamPOS, iyzico, etc.) before the multi-provider shape is settled — not an oversight, but still needs a real fix before this is production-ready. The encryption itself (`credential-encryption.service.ts`) is sound (AES-256-GCM, correct IV/auth-tag handling) — only the storage layer is a placeholder.

**Future Epic:** Persistent, provider-agnostic credential storage (e.g. an encrypted DB-backed table keyed by an opaque reference, written once the intended set of providers is settled so the storage design isn't shaped around ParamPOS alone).

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

**Last Commit:** `4c764a9`

**Current Audit Phase:** Phase 6 – Database & Shared

**Current File:** `shared/decimal.transformer.ts`

**Last completed task:** Full manual review of all remaining Phase 4 files: `payment.service.ts` (identity resolution, ownership scoping, ADR-002/005 compliant), `payment-state-machine.service.ts` (transition table verified against business rules, ADR-011 confirmed by grepping the whole codebase for `.status =` — only this file writes it), `payment-engine.service.ts` (provider dispatch failure correctly transitions to FAILED via the state machine, `cancelPayment` uses a matching pessimistic lock to `transaction-engine.service.ts` so the two properly serialize), `payment-request.entity.ts`, `transaction.entity.ts` (no `updatedAt`, matches ADR-012 immutability), `payment.controller.ts`, and the remaining response DTOs/models (type-only). Found and fixed one real bug in `transaction-engine.service.ts`: `calculateRemainingAmount()` didn't round its subtraction, causing float-drift artifacts in the API response (`4c764a9`). **Phase 4 – Payment & Transaction complete (14/14).**

**Current task:** Continuous audit mode — proceeding through Phase 6 without stopping for no-issue files (per user instruction 2026-07-18). Only bugs get reported before proceeding; architecture-level gaps go to Deferred Findings.

**Next task:** Audit `shared/decimal.transformer.ts` (already 🟡 from `556ba2f`; needs complete manual review to reach 🟢). Only 5 files remain in the entire audit (Phase 6: 4, Phase 7: 1).

**Blocked by:** Nothing — continuous audit mode active. Still stop and wait for explicit approval before committing any actual code fix (not board-only updates).

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
- Audited `auth/jwt.strategy.ts`: correct Bearer extraction, `ignoreExpiration: false`, required secret via `getRequiredJwtSecret()`, HMAC-only algorithm defaults from `jsonwebtoken` (no `alg: none` bypass), 15m access token TTL confirmed in `auth.module.ts` signOptions. `validate()` returns the raw payload, which is safe since only our own signed tokens can pass verification. No issue found, marked 🟢.
- Current File advanced to `auth/decorators/current-user.decorator.ts`.
- User instructed continuous audit mode: proceed through no-issue files without stopping to ask, commit those directly, only interrupt for real bugs.
- Audited `current-user.decorator.ts`: plain passthrough of `request.user`, no transformation. No issue found, marked 🟢.
- Audited `roles.decorator.ts`: standard `SetMetadata` wrapper, `ROLES_KEY` consistent with `RolesGuard`. No issue found, marked 🟢.
- **Phase 1 – Authentication Security complete (5/5).**
- Current File advanced to `auth/auth.service.ts` (Phase 2).
- Full manual review of `auth/auth.service.ts`: found `logout()` (merchant logout) revoked the most-recently-used session by `merchantId` alone, with no `employeeId: IsNull()` filter, so it could revoke an unrelated employee's session instead of the merchant's own whenever that employee was more recently active. Fixed to match `refreshToken()`/`logoutEmployee()` scoping. Build passed, user approved, committed and pushed as `bd594b4`. Marked 🟢.
- Current File advanced to `auth/jwt-secret.ts` (Phase 2).
- Audited `jwt-secret.ts` and `jwt-config.service.ts`: required-secret pattern correct, sensible token TTL defaults. No issues, both marked 🟢.
- Audited `main.ts`: found a major bug — no `ValidationPipe` registered anywhere in the app (`main.ts` or `app.module.ts`), so `class-validator` decorators were never enforced. A codebase-wide scan showed only `create-merchant.dto.ts` (of 17 request DTOs) had any decorators at all, and even that one was inert. Registering a naive `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` alone would have broken nearly every endpoint, since `whitelist` strips/rejects any DTO property with zero decorators. User chose the full fix: added `class-validator` decorators to all 13 previously-bare DTOs (auth, payment, merchant), preserving existing service-layer enum normalization by using `@IsString()` rather than `@IsEnum()` on enum-backed fields. Build passed, user approved, committed and pushed as `39ada07`. All 17 touched files (main.ts + 13 fixed DTOs + `create-merchant.dto.ts` + `jwt-secret.ts` + `jwt-config.service.ts`) reviewed and marked 🟢, including DTOs in Phase 4 and Phase 5 completed out of order as part of this fix.
- Current File advanced to `auth/auth.controller.ts` (Phase 2).
- Audited `auth.controller.ts`: every route's guard/decorator combination checked against its intended access level (public: register/login/refresh/forgot-reset-password/accept-invitation/set-password; protected: logout/employee-create/employee-refresh/employee-logout). All correct. No issue found, marked 🟢.
- Audited `password-hashing.service.ts`: scrypt with random 16-byte salt per hash, `timingSafeEqual` for constant-time comparison. No issue found, marked 🟢.
- Audited `merchant.entity.ts`, `merchant-session.entity.ts`, `employee.entity.ts`: unique constraints, cascades, and relations all consistent with service-layer usage. Noted (not a bug) that `Merchant.isVerified` and `MerchantSession.deviceName`/`ipAddress`/`userAgent` are defined but never written or read anywhere — dead columns, no behavioral impact. All three marked 🟢.
- **Phase 2 – Authentication Core complete (18/18).**
- Current File advanced to `payment-provider/security/credential-encryption.service.ts` (Phase 3).
- Audited `credential-encryption.service.ts`: AES-256-GCM with a fresh random 12-byte IV per `encrypt()` call and correct GCM auth-tag verification on `decrypt()`. Static scrypt salt for key derivation is fine here (single stable key from one secret, not per-record password hashing). No issue found, marked 🟢.
- Audited `credential-encryption-secret.ts`: same required-secret-no-default pattern as `jwt-secret.ts`. No issue found, marked 🟢.
- Audited `credential-vault.service.ts`: storage is an in-memory `Map` only, self-documented as a placeholder ("Persistent storage is out of scope for this sprint"). Credentials are lost on restart and not shared across instances — contradicts `PROJECT_STATUS.md`'s "production-ready" listing for credential vaulting. Discussed with user: likely intentionally deferred so persistent storage isn't designed around ParamPOS alone before the full provider set is settled. Recorded as a Deferred Finding (architecture-level, not a quick fix). File marked 🟢 — correctly implemented for its current, explicitly-scoped placeholder behavior.
- Current File advanced to `payment-provider/security/credential-masking.service.ts` (Phase 3).
- Audited `credential-masking.service.ts`: correctly implemented (masks all but last 4 chars) but not referenced anywhere in the codebase. To confirm this isn't hiding a real leak, fully reviewed the `merchant-payment-provider` module: `merchant-payment-provider.service.ts` (vault update/delete ordering is failure-safe, `activate()` is transactionally atomic), `.controller.ts` (all routes correctly guarded, merchant-only via `resolveMerchantId`), `.repository.ts`, `merchant-payment-provider.entity.ts`, and `merchant-payment-provider-response.dto.ts` — confirmed `toResponse()` never includes credentials in API output, so the missing masking has no actual impact. No bugs found in any of these six files; all marked 🟢, completing **Phase 5 – Merchant (6/6)** out of order.
- Noted two harmless dead fields, not fixed (not bugs): `MerchantPaymentProvider.priority` is a DB column never set by any code path — matches the exact question raised in the stray text previously removed from `PROJECT_SPEC.md`, suggesting that text was accidental leftover audit output pasted into the wrong file rather than a malicious prompt injection. `isActive` entity default of `true` is never exercised since `register()` always explicitly sets `false`.
- Current File advanced to `payment-provider/factory/payment-provider.factory.ts` (Phase 3).
- Audited `payment-provider.factory.ts` and `provider.registry.ts`: simple Map-based register/resolve, throws `NotFoundException` for unregistered providers, matches ADR-007 (new providers need only an adapter + registration). No issue, both marked 🟢.
- Audited `provider-resolver.service.ts`: looks up the merchant's `isActive: true` provider, throws `NoActiveProviderException` if none configured. No issue, marked 🟢.
- Audited `parampos.adapter.ts`, `.client.ts`, `.config.ts`, `.credentials.ts`: adapter is an honest, self-documented skeleton — every method throws `NotImplementedException` pending the official ParamPOS API contract, rather than faking success. `client.post()` has no request timeout, but it's currently unreachable dead code (the adapter always throws before calling it), so not a live bug — worth remembering once the sandbox contract lands. Confirmed `ParamPosAdapter` is registered in `payment-provider.module.ts`'s providers array (self-registers with `ProviderRegistry` on construction, correctly wired). No issue, all four marked 🟢.
- Audited `merchant-payment-provider.entity.ts` and the 5 core model interfaces (`provider-error`, `provider-credentials`, `payment-result`, `provider-config`, `provider-context`): structurally correct, type-only files carry no logic. No issue, all marked 🟢.
- **Phase 3 – Payment Provider complete (17/17).**
- Current File advanced to `payment/payment.service.ts` (Phase 4).
- Audited `payment.service.ts`: identity always resolved from JWT via `resolveIdentity()` (ADR-005), ownership scoping consistent across all methods, `remainingAmount` always computed via the engine and never stored (ADR-002), cancellation delegates to the engine without touching `paidAmount`. No issue, marked 🟢.
- Audited `payment-state-machine.service.ts`: transition table matches business rules (e.g. `PARTIALLY_PAID → CANCELLED` allowed per ADR-012's "cancellation never touches paidAmount"; all terminal states have no outgoing transitions). Grepped the entire `modules/` tree for `.status =` assignments — confirmed this is the only file that ever writes it, verifying the ADR-011 claim in its own comment. No issue, marked 🟢.
- Audited `payment-engine.service.ts`: provider dispatch failure correctly transitions to FAILED through the state machine (never a direct assignment); `cancelPayment()` takes a `pessimistic_write` lock on the same `PaymentRequest` row that `TransactionEngineService.createTransaction()` locks, confirming the two properly serialize as the code comments claim; all unimplemented capabilities (`generateQr`, `refundPayment`, `processNfc`, `getPaymentStatus`) honestly throw `NotImplementedException` and are unreachable from any current controller route. No issue, marked 🟢.
- Audited `payment-request.entity.ts`: no `remainingAmount` column (ADR-002 confirmed), decimal precision/transformer correct, `employeeId` uses `SET NULL` on employee deletion to preserve financial history. No issue, marked 🟢.
- Full review of `transaction-engine.service.ts`: idempotent provider-reference replay protection, pessimistic locking, and rounded `projectedPaid` all correct. Found and fixed a real bug: `calculateRemainingAmount()` subtracted `totalPaid` from `totalAmount` without rounding (unlike `projectedPaid` in the same file), producing float-drift artifacts (e.g. `19.9 - 19.1` → `0.7999999999999989`) directly in API responses on every partial payment. Fixed to round to the money scale, matching the existing pattern. Build passed, user approved, committed and pushed as `4c764a9`. Marked 🟢.
- Audited `transaction.entity.ts`: no `updatedAt` column, matching ADR-012 immutability (Transactions are never updated). No issue, marked 🟢.
- Audited `payment.controller.ts`, `payment-request-response.dto.ts`, `transaction-response.dto.ts`, `payment-execution-context.model.ts`, `payment-execution-result.model.ts`: correct route/guard wiring and type-only response shapes consistent with their producers. No issue, all marked 🟢.
- **Phase 4 – Payment & Transaction complete (14/14).**
- Current File advanced to `shared/decimal.transformer.ts` (Phase 6). Only Phase 6 (4 files) and Phase 7 (1 file) remain.

Future sessions will append new entries here.
