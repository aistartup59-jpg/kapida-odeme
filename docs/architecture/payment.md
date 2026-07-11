# Payment Architecture

## Overview

Kapıda Ödeme supports a merchant-centric payment model built around payment requests, transactions, and payment outcomes that may be completed through multiple successful payment attempts.

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

### ADR-004: Payment Method vs Delivery Channel

- PaymentMethod values:
  - QR
  - PAYMENT_LINK
  - NFC
  - CASH
- DeliveryChannel values:
  - NONE
  - SMS
  - WHATSAPP
  - COPY_LINK
- SMS and WhatsApp are delivery channels only and are not payment methods.

## Domain expectations

- PaymentRequest is the primary invoice-like object for requesting payment.
- Transaction represents a payment attempt or success event linked to a PaymentRequest.
- PaymentRequest stores totalAmount and paidAmount.
- Merchant payment providers remain separate from employee-level data.
- The backend remains platform-independent; Android/iOS differences belong only to the mobile application.

### ADR-007: Payment Orchestration Architecture

#### Purpose

Kapıda Ödeme is a payment orchestration platform.

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
- `createPaymentLink`
- `cancelPayment`
- `refundPayment`
- `getPaymentStatus`
- `handleWebhook`

#### Extensibility

Adding a new provider must require:

- one new adapter
- provider registration

No business logic changes.

## Current implementation status

The backend currently contains scaffolded payment and transaction modules. This document captures the approved payment architecture without changing any implementation contracts.
