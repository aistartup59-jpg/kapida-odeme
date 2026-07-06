# Authorization Architecture

## Overview

Authorization in Kapıda Ödeme is structured around merchant ownership and employee delegation. Merchants own the merchant workspace, while employees act on behalf of that merchant within the approved boundaries.

## Permission model

- Merchants can manage merchant account settings, employees, payment requests, reporting, and provider configuration.
- Employees can create and manage payment requests and view reporting for the merchant context they belong to.
- Administrative actions remain scoped to the merchant and its associated records.

## Enforcement approach

- JWT-based guards protect authenticated routes.
- Role-aware guards provide the enforcement layer for role-specific access.
- Ownership and merchant scoping remain central to authorization decisions.

## Notes

This document preserves the existing authorization direction and does not introduce new access rules beyond the approved merchant/employee model.
