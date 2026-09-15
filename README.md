# Nabha · Corporate Payroll Splits

A payroll allocation and claim-accounting MVP built on Midnight by **Nabha**.
The operator registers employee commitments; employees prove ownership to record one budget-bounded claim.

[![Frontend CI](https://github.com/Nabha14/corporate-payroll-splits/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Nabha14/corporate-payroll-splits/actions/workflows/frontend-ci.yml)
[![Contract CI](https://github.com/Nabha14/corporate-payroll-splits/actions/workflows/contract-ci.yml/badge.svg)](https://github.com/Nabha14/corporate-payroll-splits/actions/workflows/contract-ci.yml)

> This is **claim accounting, not token payroll**. No tokens are transferred. Claim amounts are public through ledger deltas. Never use real employee data or wallet recovery phrases.

## Run locally

Node 20, npm, and Compact compiler 0.30.0 are required.

```sh
npm ci
npm run compile
npm test
npm run build
npm run dev
```

The interface remains usable without a wallet or valid deployment, but chain actions stay disabled.
Only a **new Preprod payroll v2 deployment** is accepted. The checked-in Preview receipt is historical and cannot be relabeled.

## Documentation

- [Setup and operator deployment](SETUP.md)
- [Usage: prepare, register, claim](USAGE.md)
- [Product scope](PROPOSAL.md)
- [Tests and verification](TESTING.md)
- [Security and disclosure boundaries](SECURITY.md)
- [Operations and recovery](OPERATIONS.md)
- [Submission evidence and demo recording](SUBMISSION.md)

## Submission status

| Requirement              | Evidence / status                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Public source repository | [Nabha14/corporate-payroll-splits](https://github.com/Nabha14/corporate-payroll-splits)          |
| 15 meaningful commits    | Repository had 24 commits before the v2 work; new work uses Nabha as author and committer        |
| CI workflows             | Linked above; latest observed frontend/contract runs passed for the **previous release**, not v2 |
| Live Preprod v2 contract | **Pending funded project-wallet deployment and canary verification**                             |
| Live v2 demo             | **Pending hosting and deployment**                                                               |
| Product X profile        | **Pending account creation by the owner** — no placeholder profile link                          |
| MVP demo video           | **Pending v2 recording**; see [recording plan](SUBMISSION.md)                                    |

## Contract and frontend

- `contracts/payroll.compact`: administrator registration, commitment checks, budget limits, replay prevention.
- `src/App.tsx`: responsive operator/employee workspace and session activity.
- `src/midnightClient.ts`: Preprod wallet, proving, finalized calls, and ledger reads.
- `src/runtimeConfig.ts`: deployment receipt validation.
- `src/test/`: compiled-contract and input/configuration tests.

An employee can be registered once and claim once per contract. Use a new contract for a new payroll cycle. Registration does not reserve budget; an oversized allocation fails at claim time.

## Release discipline

Run `npm run check` before committing. Tag releases compile with the pinned compiler, run tests, build, and require a Preprod v2 receipt before publishing artifacts. Workflow files alone do not prove a live deployment.

New commits must use the project-local Nabha identity. Do not rewrite existing history or add artificial commits to meet a count.
