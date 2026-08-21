# Corporate Payroll Splits

![Frontend CI](https://github.com/Nabha14/corporate-payroll-splits/actions/workflows/frontend-ci.yml/badge.svg?branch=main) ![Contract CI](https://github.com/Nabha14/corporate-payroll-splits/actions/workflows/contract-ci.yml/badge.svg?branch=main)

A private allocation rail for proving a payroll distribution fits a budget without exposing each employee’s salary or destination.

## Payroll assurance index

- Business case: [PROPOSAL.md](./PROPOSAL.md)
- Budget and claim controls: [payroll.test.ts](./src/test/payroll.test.ts)
- QA ledger: [TESTING.md](./TESTING.md)
- Deployed contract receipt: [deployment.json](./deployment.json)

## Use case

A payroll operator defines a total budget and registers committed employee allocations. An eligible employee later claims the amount bound to their private commitment. The operations dashboard focuses on budget health, distributed total, claim readiness, wallet sync, and confirmed contract activity.

## Contract API

The `payroll` Compact contract exposes two business actions:

- `registerEmployeeSalary(employee_pk, commitment)` binds a private allocation commitment.
- `claimSalary()` allows the matching employee to claim.

`computeCommitment(amount, salt, sk)` derives the private commitment used by the flow. The ledger keeps the public budget and aggregate distributed amount while employee amounts and receiving identities remain shielded.

## Current Preview deployment

| Field | Value |
| --- | --- |
| Network | Midnight Preview |
| Contract address | `d7cb98b65cebf797cbcd53ebf9dbe0d1a13a23824676f86d1da12bb6237d912b` |
| Contract name | `payroll` |
| Deployment transaction | `003776fe366397dc2a0ae0297944fbced697ddf69b23f081c786518884106582a8` |
| Payroll deployer | `mn_addr_preview1u0x5hj5kx4utwdkq2hahjhvj5ndwed44z43aazwqwnckafce086qjpgcp7` |
| Deployment time | `2026-08-03T18:55:43.988Z` |
| Indexer | Confirmed |

## Developer path

The payroll sandbox is funded only through the [official Preview faucet](https://faucet.preview.midnight.network/).

```bash
npm install
npm run compile
npm test
npm run build
npm run dev
```

The deploy helper is available once a Preview wallet and provider configuration are present:

```bash
npm run deploy
```

Do not use real employee data, salaries, or recovery phrases. This is a testnet product demonstration.

## Pipeline and verification

Every repository push runs separate frontend and contract checks. A tagged release produces a manifest plus build artifacts. Dependency auditing runs independently and never receives wallet secrets.

Demo video: [open the payroll operations walkthrough](https://drive.google.com/file/d/1UFQdhII0XHEgIodmr1J3Qj18RF6rzVqZ/view?usp=sharing).

## Verification

Privacy is the product feature: employee allocations and destinations remain private, while budget constraints and aggregate distribution state remain enforceable. Run `npm test`, `npm run compile`, and `npm run build`; the five contract scenarios are documented in [TESTING.md](./TESTING.md), the product scope is in [PROPOSAL.md](./PROPOSAL.md), and both CI workflows run on every push and pull request.

## Payroll release discipline

Before operating Corporate Payroll Splits, read the independent [security model](SECURITY.md) and [operations runbook](OPERATIONS.md). Runtime configuration is fail-closed and its executable checks live in [src/test/runtime-config.test.ts](src/test/runtime-config.test.ts).
