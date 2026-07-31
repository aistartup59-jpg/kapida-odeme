# Payment Architecture

## Overview

PayALS supports a merchant-centric payment model built around payment requests, transactions, and payment outcomes that may be completed through multiple successful payment attempts.

## Locked architecture decisions

### ADR-001: PaymentRequest and Transaction relationship

- One order creates exactly one PaymentRequest.
- A PaymentRequest may contain multiple Transactions.
- Relationship:
  - Merchant: 1 -> N PaymentRequest
  - PaymentRequest: 1 -> N Transaction

### ADR-002: Hybrid / Partial Payments

- A PaymentRequest may be completed using multiple successful Transactions.
- Example:
  - 500 TL QR
  - + 250 TL CASH
  - = 750 TL PAID
- PaymentRequest stores:
  - totalAmount
  - paidAmount
- remainingAmount is not stored and must always be calculated as totalAmount - paidAmount.
- Payment status values:
  - PENDING
  - PARTIALLY_PAID
  - PAID
  - FAILED
  - EXPIRED
  - CANCELLED

### ADR-003: QR Architecture

- QR means a real bank payment QR.
- QR is not a QR generated from a payment link.
- Flow:
  1. Employee generates a bank QR.
  2. Customer opens their banking application.
  3. Customer scans the QR.
  4. Payment succeeds.
  5. The PaymentRequest is updated.

### ADR-013: POS-Only Payment Acceptance (supersedes ADR-004)

- Payment is accepted on the POS device only.
- PaymentMethod values:
  - QR — a real Bank QR displayed on the device
  - NFC — a card read by the device (Android only)
  - CASH — cash handed to the employee at the door
- Payment Links are removed. DeliveryChannel is removed entirely — with no URL to deliver, SMS, WhatsApp and Copy Link have nothing to carry.
- QR is the only method that reaches the provider at PaymentRequest creation time. NFC is captured by the device and CASH involves no provider; both are reported afterwards as Transactions.
- Rows recorded before this decision keep their values exactly as recorded (ADR-012): `paymentMethod` still permits the retired PAYMENT_LINK value for existing rows, and `deliveryChannel` was renamed to `legacyDeliveryChannel` rather than dropped.

## Domain expectations

- PaymentRequest is the primary invoice-like object for requesting payment.
- Transaction represents a payment attempt or success event linked to a PaymentRequest.
- PaymentRequest stores totalAmount and paidAmount.
- Merchant payment providers remain separate from employee-level data.
- The backend remains platform-independent; Android/iOS differences belong only to the mobile application.

### ADR-007: Payment Orchestration Architecture

#### Purpose

PayALS is a payment orchestration platform.

It must never depend on a specific payment provider.

#### Architecture

```
PaymentService
      ↓
PaymentEngine
      ↓
PaymentProviderFactory
      ↓
PaymentProvider Interface
      ↓
Provider Adapter
      ↓
Provider API
```

#### Rules

Business logic must never reference:

- ParamPOS
- iyzico
- PayTR
- Sipay
- or any specific provider.

Business logic communicates only through the `PaymentProvider` interface.

#### Merchant Configuration

Each merchant selects their own provider.

Merchant credentials belong to the merchant.

#### Provider Responsibilities

A provider implementation is responsible for:

- `createPayment`
- `generateBankQR`
- `cancelPayment`
- `refundPayment`
- `getPaymentStatus`
- `handleWebhook`

`generateBankQR` is the only capability the payment flow dispatches to today (ADR-013).

#### Extensibility

Adding a new provider must require:

- one new adapter
- provider registration

No business logic changes.

### ADR-014: Open Provider Registry

- A provider is identified by a free-form string id, never an enum.
- `ProviderRegistry` is the single source of truth for which providers are installed. An adapter registers itself under its own id, declared alongside the adapter.
- Merchant configuration validates `providerType` against the registry, so a provider with no installed adapter is rejected at configuration time rather than at payment time.
- `merchant_payment_providers.providerType` is a text column: installing a provider never requires a schema migration.
- Provider ids are normalized (trimmed, upper-cased) before being matched or persisted.

## Current implementation status

The backend currently contains scaffolded payment and transaction modules. This document captures the approved payment architecture without changing any implementation contracts.
