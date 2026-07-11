# Project

Kapıda Ödeme is a hybrid payment platform for merchants and delivery employees.

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

ADR-004

PaymentMethod

- QR
- PAYMENT_LINK
- NFC
- CASH

DeliveryChannel

- NONE
- SMS
- WHATSAPP
- COPY_LINK

SMS and WhatsApp are not payment methods.

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

# Documentation

Keep PROJECT_SPEC.md concise.

Architecture documentation belongs under docs/architecture.

API documentation belongs under docs/api.

# Build

Always run npm run build before finishing backend work.

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

Payment Links are independent from QR.

SMS and WhatsApp only deliver the Payment Link.

## NFC

NFC payments are supported only on Android.

Never implement NFC payment acceptance on iOS.

## Hybrid Payments

One PaymentRequest may be completed by multiple Transactions.

Examples:

- QR + Cash
- NFC + Cash
- QR + NFC
- QR + Payment Link
- Cash + Payment Link

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
