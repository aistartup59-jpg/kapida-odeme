# Domain Model

## Core entities

Merchant
- Owns the merchant workspace.
- Has employees, payment requests, transactions, and provider mappings.

Employee
- Represents a merchant staff user.
- Can create and manage payment requests on behalf of the merchant.
- Replaces the earlier courier concept in the approved domain model.

Payment Request
- Represents an invoice-like request for payment.
- Belongs to a merchant and is created by an employee or merchant-controlled flow.

Transaction
- Represents a settled payment event linked to a payment request.
- Captures payment method, amount, status, and timestamps.

Merchant Payment Provider
- Maps the merchant to configured provider accounts.
- Remains independent from employee-specific data.

## Relationship summary

Merchant
├── Employees
├── Payment Requests
├── Transactions
└── Merchant Payment Providers

Employee
└── Payment Requests

## Terminology note

Any historical references to courier should be treated as employee in documentation, data migration planning, and external-facing contracts.
