# Product Proposal: Corporate Payroll Splits

**Submission lane:** Payments  
**Payroll project owner:** `Nabha14`  
**Readiness:** Preview MVP with automated budget invariants

## Problem

Payroll distribution requires proving budget compliance without exposing every employee’s compensation.

## Proposed product

Corporate Payroll Splits commits employee allocations and allows the matching employee to claim privately while the contract tracks budget totals.

## Privacy model

Total budget and distributed aggregate are public. Employee salary amounts, destination identities, and salts remain private.

## User journey

1. Administrator sets the total budget.
2. Employee allocation commitment is registered.
3. Employee claims with the matching private parameters.
4. Operations dashboard confirms aggregate distribution.

## Success criteria

- Commitments are bound to the employee key.
- Valid claims update distributed amount.
- Mismatched claims fail.
- Claims exceeding the budget fail.
