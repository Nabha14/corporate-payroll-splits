# Product proposal: Nabha Payroll

Owner: Nabha14. Status: locally tested v2 claim-accounting MVP; Preprod deployment pending.

## Problem

Payroll operators need an accountable registration and claim process with explicit budget limits. Employees should demonstrate ownership of an allocation without handing their payroll secret to the operator.

## Scope

An administrator initializes an accounting budget and registers employee commitments. Each employee proves knowledge of the associated amount, salt, and secret to record one claim. The operator workspace displays actual chain counts and totals after a wallet-connected ledger read.

The MVP does not transfer or escrow tokens. Amount confidentiality is not achieved: individual public counter deltas reveal amounts. Names and real-world employee identities are not collected, but employee pseudonyms and timing are public.

## Journey

Prepare a public packet locally, register it with administrator authorization, then record a budget-bounded claim. The user sees wallet/proving status, final transaction IDs, and refreshed totals, with no fake balance data.

## Acceptance criteria

Unauthorized registrations, duplicate allocations, repeat claims, wrong commitments, zero claims, and budget overflow must fail. A public Preprod v2 address, hosted frontend, passing release CI, owner-created product X profile, and demonstrable canary transactions are required for submission readiness.

Token settlement and stronger amount privacy would require a separately designed and tested contract, not changes to dashboard labels.
