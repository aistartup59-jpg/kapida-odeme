# Payment Architecture

## Overview

Kapıda Ödeme supports a multi-channel payment model for merchants that want to collect payments through simple, modern entry points.

## Approved MVP payment methods

- QR Code
- NFC
- SMS payment link
- WhatsApp payment link
- Generic payment link
- Cash

## Domain expectations

- Payment requests are the primary invoice-like objects for requesting payment.
- Transactions represent settled payment events linked to payment requests.
- Transaction records should carry payment method, amount, status, and timestamps.
- Merchant payment providers remain separate from employee-level data.

## Current implementation status

The backend currently contains scaffolded payment and transaction modules. This document captures the approved payment architecture and reporting expectations without changing any implementation contracts.
