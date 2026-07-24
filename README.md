# Corporate Payroll Splits

A private allocation rail for proving a payroll distribution fits a budget without exposing each employee’s salary or destination.

## Use case

A payroll operator defines a total budget and registers committed employee allocations. An eligible employee later claims the amount bound to their private commitment. The operations dashboard focuses on budget health, distributed total, claim readiness, wallet sync, and confirmed contract activity.

## Contract API

The `payroll` Compact contract exposes two business actions:

- `registerEmployeeSalary(employee_pk, commitment)` binds a private allocation commitment.
- `claimSalary()` allows the matching employee to claim.

`computeCommitment(amount, salt, sk)` derives the private commitment used by the flow. The ledger keeps the public budget and aggregate distributed amount while employee amounts and receiving identities remain shielded.

## Known Preprod deployment

| Field | Value |
| --- | --- |
| Network | Midnight Preprod |
| Contract address | `31d1d6e1fb6a2d9e5d597b43bcec12d8ce29d9d0d9798d91e036018fc34640d8` |
| Contract name | `payroll` |
| Deployment transaction | `2cb52361974526957a3f9f7a116156503d3aef2604f582702bd8e335a7e73cd4` |
| Indexer | Confirmed |

## Developer path

```bash
npm install
npm run compile
npm test
npm run build
npm run dev
```

The deploy helper is available once a Preprod wallet and provider configuration are present:

```bash
npm run deploy
```

Do not use real employee data, salaries, or recovery phrases. This is a testnet product demonstration.

## Pipeline and verification

Every repository push runs separate frontend and contract checks. A tagged release produces a manifest plus build artifacts. Dependency auditing runs independently and never receives wallet secrets.

Demo video: [open the payroll operations walkthrough](https://drive.google.com/file/d/1UFQdhII0XHEgIodmr1J3Qj18RF6rzVqZ/view?usp=sharing).

