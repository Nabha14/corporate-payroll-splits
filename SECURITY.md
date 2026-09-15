# Security model — Nabha Payroll

Owned and operated independently by Nabha14. Wallets, secrets, private state, deployment receipts, and incident decisions are project-specific.

## Actual disclosure boundary

The current contract is a claim-accounting prototype, not a token payment contract. It updates a public cumulative counter. **Each individual amount is revealed by the counter delta**, and the Compact circuit explicitly discloses the amount. Employee keys, commitments, claimed membership, and transaction timing are public. Real-world names are not collected.

The employee secret and salary salt are private witnesses. A selected wallet proving provider may process witness data, so trust its implementation and deployment. The app holds private inputs in memory, clears them on success/disconnect, and does not use local storage or analytics. Browser extensions, screenshots, clipboard managers, and compromised devices remain threats. Revealing values for backup must be done privately.

## Contract controls

- Only the key matching the constructor administrator can register.
- Employee registration cannot be overwritten.
- A claim must match the committed secret, salt, and amount.
- Zero claims, repeat claims, unknown employees, and budget overflow are rejected.
- One employee allocation per contract; a new period requires a new deployment.
- Registration does not reserve funds or budget.

## Deployment controls

Only Preprod payroll version 2 receipts are accepted. The archived Preview contract lacks replay protection and is intentionally not usable from this frontend. Receipt validation checks structure, not cryptographic proof of an on-chain deployment. A ledger read and canary transaction are required before claiming readiness.

Deployment requires an explicit file under the project's ignored `.private/` directory; it never discovers a shared wallet. Administrator secrets are separate from wallet keys. Private-state encryption requires an owner-supplied random password, not a public address-derived password.

## Limits and reporting

Unaudited test-network software. No production payroll, regulated-payment compliance, amount confidentiality, token settlement, or third-party security certification is claimed.

Report vulnerabilities through a private GitHub security advisory. Include only public reproduction steps, network, release, and transaction IDs. Never include wallet recovery phrases, payroll secrets, salts, private-state databases, or screenshots revealing them.
