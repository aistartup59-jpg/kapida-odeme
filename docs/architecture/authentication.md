# Authentication Architecture

## Overview

Kapıda Ödeme uses a merchant-first authentication model with separate flows for merchants and employees. The current approved approach is centered on secure sign-in, password recovery, invitation-based employee onboarding, and token refresh.

## Approved authentication flows

- Merchant registration and login through the auth module.
- Merchant token refresh and logout through the authenticated session flow.
- Employee onboarding through invitation acceptance and password setup.
- Employee login for day-to-day access on behalf of a merchant.

## Current implementation surface

The backend currently exposes these auth endpoints:

- POST /auth/merchant/register
- POST /auth/merchant/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/employee
- POST /auth/employee/accept-invitation
- POST /auth/employee/set-password
- POST /auth/employee/login

## Design notes

- Merchant and employee identities are treated as distinct user types in the same platform.
- Employee access is tied to a merchant context and remains subject to activation state.
- JWT-based protection and role-aware guards are the intended enforcement points for authenticated routes.
