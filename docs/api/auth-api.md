# Authentication API

## Overview

Merchant registration, merchant login, session refresh, logout, password recovery, and employee
onboarding. Every route is under the `/api` prefix.

Two session kinds exist and refresh through different endpoints, so a client has to remember
which it is holding. Access tokens last 15 minutes; refresh tokens rotate on use.

## Endpoints

Public — no token required:

- `POST /auth/merchant/register`
- `POST /auth/merchant/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/employee/accept-invitation`
- `POST /auth/employee/set-password`
- `POST /auth/employee/login`

Authenticated:

- `POST /auth/logout`
- `POST /auth/employee` — owner only (`RolesGuard`)
- `POST /auth/employee/refresh`
- `POST /auth/employee/logout`

## Identity comes from the token

`POST /auth/employee` derives the merchant from the acting owner's own JWT. The request body has
no `merchantId` field and supplying one is rejected — it is the same rule ADR-005 states for
payments, and the reason it is stated here too is that the endpoint once accepted it, which let
an owner invite an employee into somebody else's account.

## Rate limits

Registration is capped at 5/minute per client and every route accepting a secret at 20/minute.
See [rate-limits.md](rate-limits.md).

## Notes

Authentication and authorization are not modified without an explicit request; this document
describes the surface rather than proposing changes to it.
