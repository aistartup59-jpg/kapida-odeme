# Project

PayALS is a hybrid payment platform for merchants and delivery employees.

# Naming

The product and the app are called PayALS. The repository directory, the git remote and the
database names still say kapida-odeme; those are internal and were left alone on purpose.

Fixed identifiers, none of which may be changed casually:

- Android applicationId: com.payals.pos — frozen forever once the app is first published.
- Deep link scheme: payals://collect — changing it after a platform ships an integration
  requires a release from them, not from us.
- Partner API key prefix: pay_ — parsing is prefix-exact, so changing it invalidates every
  key already issued.
- Hand-off token prefix: hof_ — describes the mechanism, not the brand, so it stays.

The backend must remain:

- Provider independent
- Platform independent
- API-first
- Modular

# Locked Architecture

ADR-001
One PaymentRequest may contain many Transactions.

Merchant
1 -> N PaymentRequest

PaymentRequest
1 -> N Transaction

ADR-002

Hybrid / Partial Payments are supported.

Never store remainingAmount.

Always calculate it.

ADR-003

QR always means a real Bank QR (TR Karekod / EMV QR).

Never generate QR from Payment Link.

ADR-013 (supersedes ADR-004)

Payment is accepted on the POS device only.

PaymentMethod

- QR
- NFC
- CASH

There is no PAYMENT_LINK and no DeliveryChannel.

Payment Links, SMS, WhatsApp and Copy Link are removed from the product.

ADR-014

A payment provider is identified by a free-form string id, never an enum.

ProviderRegistry is the single source of truth for which providers are installed.

ADR-015

One app, two products.

Small businesses sign up and sign in, and key the amount in by hand.

Order platform couriers never sign in.

The platform's backend mints a hand-off token with its API key; the deep link carries only that token.

The token is scoped to one PaymentRequest and expires. No hand-off endpoint accepts a payment id.

Never accept an amount stated by the deep link, and never treat a deep link result as proof of payment.

The platform confirms the result with its API key through GET /partner/payments.

ADR-005

Use a single endpoint:

POST /payments

merchantId and employeeId always come from JWT.

Never accept them from the client.

# Authentication

Do not modify Authentication unless explicitly requested.

# Authorization

Do not modify Authorization unless explicitly requested.

# Coding Rules

Reuse existing architecture.

Respect module boundaries.

Keep changes limited to the requested sprint.

Do not refactor unrelated code.

# YAGNI

ADR-009: docs/adr/ADR-009.md

Do not expose API fields for features that do not yet exist.

Do not add speculative fields or abstractions.

New capabilities must be introduced only when the corresponding business capability is implemented.

Keep the domain model minimal.

Future requirements must not shape today's API.

# Reuse Before Create

ADR-010: docs/adr/ADR-010.md

Rules:

- Search the existing codebase before creating anything new.
- Reuse existing services whenever possible.
- Prefer refactoring over duplication.
- Do not create parallel implementations.
- If duplication appears necessary, stop and explain the architectural reason before writing code.

# Documentation

Keep PROJECT_SPEC.md concise.

Architecture documentation belongs under docs/architecture.

API documentation belongs under docs/api.

# Build

Always run npm run build before finishing backend work.

Always run flutter analyze and flutter test before finishing mobile work.

The mobile app is Flutter, Android only. Toolchain on this machine:

- Flutter SDK: C:\dev\flutter
- Android SDK: C:\dev\android-sdk
- JDK 17: C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot

Build the APK with:

flutter build apk --release --dart-define=API_BASE_URL=<backend url>

API_BASE_URL is a build-time define, not a bundled .env file.

# Git

Never commit automatically.

Wait for user approval.

Use conventional commit messages.

# Sprint Rule

Only implement the requested sprint.

Do not implement future functionality.

# Decision Rule

If an implementation decision is unclear:

Do not guess.

Ask for clarification.

Never silently change the architecture.

# Locked Product Decisions

The following product decisions are final unless the user explicitly changes them.

## QR

QR always means a real bank QR (TR Karekod / EMV QR).

Do not implement QR using Payment Links.

## Payment Link

Payment Links are removed from the product (ADR-013).

Never reintroduce Payment Links, SMS, WhatsApp or Copy Link delivery.

## NFC

NFC payments are supported only on Android.

Never implement NFC payment acceptance on iOS.

## Hybrid Payments

One PaymentRequest may be completed by multiple Transactions.

Examples:

- QR + Cash
- NFC + Cash
- QR + NFC
- QR + NFC + Cash

## Remaining Amount

Never store remainingAmount.

Always calculate it from:

PaymentRequest.totalAmount

minus

sum(Transaction.amount)

## Provider Independence

Payment providers must be replaceable.

Never couple business logic to a specific provider.

Use provider abstractions.

## Architecture Changes

Never change a locked architecture decision.

If a requested feature conflicts with the architecture,

stop and ask for clarification.

# Core Product Features

The following features define the product identity.

They are mandatory and must never be removed or bypassed without explicit user approval.

## Real Bank QR

QR always means a real Bank QR (TR Karekod / EMV QR).

Never replace it with a Payment Link QR.

## Hybrid Payments

A PaymentRequest may be completed using multiple Transactions.

Examples:

- QR + Cash
- NFC + Cash
- QR + NFC
- QR + NFC + Cash

## Customer Secure Mode

Customer Secure Mode is mandatory.

Whenever customer authentication is required (for example NFC PIN),

the application must enter Customer Secure Mode.

Customer Secure Mode must:

- Hide all employee information.
- Hide all merchant management screens.
- Hide order details.
- Display only:
  - payment amount
  - secure PIN entry screen
- Use a randomized numeric keypad every time.
- Automatically return to Employee Mode after authentication.

Customer Secure Mode must never be disabled without explicit user approval.

# Development Workflow

Every development session follows this order:

1. Read CLAUDE.md.
2. Read the relevant documentation for the current sprint.
3. Implement only the requested sprint.
4. Keep changes minimal and isolated.
5. Run npm run build.
6. Stop and summarize the changes.
7. Wait for user approval before any Git operation.

Never skip the build step.

Never commit or push without explicit approval.

# Payment Orchestration

PayALS is a payment orchestration platform.

Business logic must never depend on a specific payment provider.

All payment providers must implement the PaymentProvider interface.

Adding a new payment provider must require only:

- one adapter
- provider registration

No business logic changes are allowed.

Adding a provider must not require an enum edit or a schema migration.

An adapter declares its own provider id and registers itself with ProviderRegistry (ADR-014).

# Payment Lifecycle Ownership

ADR-011: docs/adr/ADR-011.md

Only PaymentStateMachineService may mutate PaymentRequest.status.

No other service may assign the status property directly.

Creating a new PaymentRequest with the initial PENDING state is allowed.

All subsequent lifecycle changes must go through applyTransition().

# Financial History Immutability

ADR-012: docs/adr/ADR-012.md

Financial records are append-only.

Transactions are immutable once created. Never update or delete a Transaction.

paidAmount is immutable once recorded. It only advances by recording new Transactions.

Lifecycle transitions (applyTransition, per ADR-011) may change PaymentRequest.status only.

Never modify paidAmount or any Transaction as part of a lifecycle transition.

Cancellation is a lifecycle transition only. It must never zero, adjust, or otherwise touch paidAmount or Transaction history.

Refunds must be represented as new financial events appended to the ledger, never by rewriting or deleting existing Transactions.

This rule is provider neutral. It applies uniformly regardless of PaymentMethod or PaymentProvider.
