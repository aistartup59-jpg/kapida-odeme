# PROJECT SPECIFICATION

Version: 1.0

Status: Active

---

# 1. Project Overview

Project Name:
Kapıda Ödeme

Project Type:
SaaS Platform

Development Method:
AI Assisted Software Development

Primary IDE:
Visual Studio Code

Implementation AI:
Claude Code

Architecture & Product Management:
ChatGPT

Product Owner:
Project Owner

---

# 2. Mission

Kapıda Ödeme is a modern payment platform that enables merchants to offer secure, fast and user-friendly payment experiences using QR technologies and digital payment solutions.

The system must be designed as a scalable SaaS product capable of serving thousands of businesses.

---

# 3. Primary Goal

Our first objective is NOT writing code.

Our first objective is building a software platform that can continue growing for years without requiring architectural redesign.

Every technical decision must prioritize long-term maintainability.

---

# 4. Project Principles

Priority Order

1. Simplicity
2. Maintainability
3. Security
4. Scalability
5. Performance
6. Developer Experience

Never sacrifice architecture for short-term speed.

---

# 5. Updated Domain Model

Approved domain changes (2026-07-01):

- Replace the previous "Courier" concept with `Employee` across the product domain.

Canonical model (simplified):

Merchant
 └── Employee
	└── Payment Requests

Notes:
- `Employee` represents a merchant's staff user who can create and manage payment requests on behalf of the merchant.
- `Payment Request` remains the primary object representing an invoice-like request for payment.

---

# 6. MVP Payment Methods (Updated)

The following payment methods are in scope for the initial MVP (ordered by priority):

- QR Code
- NFC
- SMS Payment Link
- WhatsApp Payment Link
- Payment Link (generic)
- Cash

Implementation notes:
- Each payment method should surface in the Merchant Dashboard reporting and in the Transaction records as the `payment_method` field.

---

# 7. Merchant Dashboard (Specification Update)

Overview:
The Merchant Dashboard provides merchants with tools to manage employees and view payment activity and reports.

New: Employee Management section

Employee Management capabilities:

- Create Employee: merchant can create new `Employee` records with name, role, contact, and credentials/activation state.
- Activate Employee: enable an employee to operate (issue payment requests, view reports) without deleting their history.
- Deactivate Employee: disable employee access while preserving historical data and ownership of payment requests.
- View Employee payment reports: per-employee lists and aggregates showing payment requests, transactions, success/failures, and totals.

Dashboard Reporting requirements:

- View payment totals grouped by `payment_method` (QR, NFC, SMS link, WhatsApp link, Payment Link, Cash).
- View totals aggregated by time window: daily, weekly, and monthly.
- Filter and slice by Employee, date ranges, and payment method.

UX notes:
- Employee create/activate/deactivate actions should be auditable and recorded in an activity log.
- Reports should allow exporting CSV for the selected time range and filters.

---

# 8. Entity Relationships (Updated)

High-level relationships (approved):

Merchant
 ├── Employees
 ├── Payment Requests
 ├── Transactions
 └── Merchant Payment Providers

Employee
 └── Payment Requests

Notes:
- `Payment Requests` are created by `Employee` (or by the Merchant via API/admin), and belong to a `Merchant` for accounting and reconciliation.
- `Transactions` represent settled payment events linked to `Payment Requests` and record `payment_method`, `amount`, `status`, and timestamps.
- `Merchant Payment Providers` map to configured provider accounts for a merchant (e.g., Stripe, local acquirers) and are kept separate from per-employee data.

---

# 9. Migration & Backwards-compatibility Guidance (documentation only)

- Any prior references or tables/fields named `courier` should be mapped to `employee` in documentation, DB migration plans, and API contracts.
- Maintain backwards-compatibility in external-facing APIs where possible; introduce `employee` fields as additive, and deprecate `courier` names with clear versioning notes.

---

Last updated: 2026-07-01