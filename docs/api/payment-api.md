# Payment API

## Overview

Payment request and transaction workflows for merchants, employees, and order platform
couriers. Implemented and covered by the integration suite. Every route is under the `/api`
prefix.

- `POST /payments` — the single creation endpoint (ADR-005). `merchantId`/`employeeId` always
  come from the JWT and are rejected if supplied.
- `GET /payments`, `GET /payments/:id`
- `POST /payments/:id/qr`, `POST /payments/:id/transactions`, `POST /payments/:id/cancel`

## Approved API modeling guidance

- One order creates exactly one PaymentRequest.
- A PaymentRequest may contain multiple Transactions.
- PaymentRequest should expose totalAmount and paidAmount.
- remainingAmount should be derived rather than stored.
- PaymentRequest status should use the approved values: PENDING, PARTIALLY_PAID, PAID, FAILED, EXPIRED, and CANCELLED.
- QR-based payments are real bank QR flows, not payment-link QR flows.
- PaymentMethod accepts QR, NFC and CASH only (ADR-013). Payment Links and the `deliveryChannel` field are not part of the contract.
- The create response carries `qrData` / `qrExpiresAt` for QR only; the bank QR payload is provider-issued and never persisted.

## Order platform integration (ADR-015)

The courier delivering for an order platform never signs in. Nothing in the contract names a specific platform.

**1. The platform's backend mints a hand-off token** when an order is ready for delivery. This is the security model: the amount is authorised by a server that holds the merchant's API key, not stated by an app on the courier's phone.

```
POST /partner/handoffs
X-Api-Key: pay_<publicId>_<secret>
{ "externalOrderId": "UBER-4471", "totalAmount": 250, "currency": "TRY" }

→ { "paymentRequestId": "...", "handoffToken": "hof_<publicId>_<secret>", "expiresAt": "..." }
```

Minting twice for one order returns the PaymentRequest that already exists — a repeated hand-off never charges the customer twice.

**2. The platform's app deep-links into ours**, carrying only the token:

```
payals://collect?token=hof_<publicId>_<secret>&returnUrl=<platform link>
```

**3. The courier collects**, authorised by the token alone. No endpoint takes a payment id — the token names the one payment it may act on, so there is nothing to substitute:

```
GET  /handoff/payment                 X-Handoff-Token: hof_...
POST /handoff/payment/qr              X-Handoff-Token: hof_...
POST /handoff/payment/transactions    X-Handoff-Token: hof_...
```

The token expires four hours after minting. Once the payment is PAID the app returns the courier to `returnUrl`.

**4. The platform's backend confirms server side** before letting the courier mark the order delivered. A result travelling back through the courier's device is a claim; this is the fact:

```
GET /partner/payments?externalOrderId=UBER-4471
X-Api-Key: pay_<publicId>_<secret>
```

The merchant is derived from the key, never from the request. The response is the standard payment payload, including the derived `remainingAmount` and every Transaction.

Merchants manage the keys themselves at `POST|GET|DELETE /merchant/partner-keys`. The full key is returned once at issue time; only its hashed secret is stored.

`externalOrderId` is not accepted on `POST /payments` — it belongs to the channel where a platform backend authorised the amount.

## Collecting on an existing payment

- `POST /payments/:id/qr` issues a real Bank QR for whatever is still owed. A collection is opened before the customer has chosen how to pay, and after a partial cash payment the QR must cover the reduced remaining amount.
- `POST /payments/:id/transactions` records what was actually taken, per method — which is what makes hybrid collection (part cash, part QR) work.

## Rate limits

The partner channel is capped at 300/minute per API key, and everything here at 600/minute per
caller. See [rate-limits.md](rate-limits.md) — in particular, hand-off requests are counted
against the token rather than the courier's address.

## Current status

Implemented. What is not yet real behind it:

- The only working provider is the demo adapter, enabled by `DEMO_PAYMENT_PROVIDER` and never
  to be run in production. The ParamPOS adapter is an honest stub — every dispatch method
  throws rather than faking success — pending the provider's API contract.
- There is no provider webhook. Completion is discovered by polling.
- NFC is accepted as a transaction method but no device can originate one: that needs a
  PCI-certified SoftPOS SDK from the provider.

## Notes

This document describes the payment API surface as implemented.
