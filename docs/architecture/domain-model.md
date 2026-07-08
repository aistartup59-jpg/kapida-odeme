# Domain Model

## Core entities

Merchant
- Owns the merchant workspace.
- Has employees, payment requests, transactions, and provider mappings.

Employee
- Represents a merchant staff user.
- Can create and manage payment requests on behalf of the merchant.
- Replaces the earlier courier concept in the approved domain model.

PaymentRequest
- Represents an invoice-like request for payment.
- Belongs to exactly one merchant.
- May contain multiple Transactions.
- Stores totalAmount and paidAmount.
- Calculates remainingAmount dynamically.

Transaction
- Represents a payment event linked to a PaymentRequest.
- May be part of a hybrid or partial payment flow.
- Captures payment method, amount, status, and timestamps.

Merchant Payment Provider
- Maps the merchant to configured provider accounts.
- Remains independent from employee-specific data.

## Relationship summary

Merchant
├── Employees
├── PaymentRequests
├── Merchant Payment Providers
└── (PaymentRequest relationships are defined below)

PaymentRequest
├── Transactions
└── Belongs to one Merchant

Employee
└── PaymentRequests

## Approved payment states

PaymentRequest status values:
- PENDING
- PARTIALLY_PAID
- PAID
- FAILED
- EXPIRED
- CANCELLED

## Terminology note

Any historical references to courier should be treated as employee in documentation, data migration planning, and external-facing contracts.
