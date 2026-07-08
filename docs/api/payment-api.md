# Payment API

## Overview

The payment API is expected to support payment request and transaction workflows for merchants and employees. The current backend scaffold includes payment and transaction modules, but the implementation surface is still pending.

## Approved API modeling guidance

- One order creates exactly one PaymentRequest.
- A PaymentRequest may contain multiple Transactions.
- PaymentRequest should expose totalAmount and paidAmount.
- remainingAmount should be derived rather than stored.
- PaymentRequest status should use the approved values: PENDING, PARTIALLY_PAID, PAID, FAILED, EXPIRED, and CANCELLED.
- QR-based payments are real bank QR flows, not payment-link QR flows.
- PaymentMethod and DeliveryChannel should remain separate concepts in API contract design.

## Current status

- Payment module exists as a scaffold.
- Transaction module exists as a scaffold.
- No additional payment endpoints are implemented in the current repository state.

## Notes

This document captures the intended payment API area without changing any existing implementation or contract.
