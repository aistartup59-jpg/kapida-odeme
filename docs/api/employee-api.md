# Employee API

## Overview

Employees have no module of their own: they are created and authenticated through the auth
module, so their surface is a section of the authentication API rather than a parallel one.

## Current surface

- `POST /auth/employee` — invite. Owner only, and the merchant comes from the owner's JWT rather
  than from the body (see [auth-api.md](auth-api.md)).
- `POST /auth/employee/accept-invitation`
- `POST /auth/employee/set-password`
- `POST /auth/employee/login`
- `POST /auth/employee/refresh` — authenticated; rotates the session belonging to the presented
  token.
- `POST /auth/employee/logout`

## What an employee can see

An employee's payment reads are scoped to their own payment requests. An owner sees every
employee's. Both identities are taken from the JWT and never from the request (ADR-005).

## Notes

This document groups the employee-facing operations under one reference while preserving the
existing route structure.
