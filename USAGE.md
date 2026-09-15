# Use the payroll workspace

## What this MVP does

Records allocations and one-time claims against an accounting budget. It does not pay tNIGHT, exchange currencies, escrow funds, or hide individual claim amounts.

## Employee: prepare a commitment

1. Open **Employee claim**. You can prepare a packet without connecting a wallet.
2. Enter a positive whole amount (1–4,294,967,295 accounting units).
3. Generate fresh payroll secret/salt values, or enter existing 32-byte hex values.
4. Use the reveal control to save both private values and the amount in your password manager. Reloading or disconnecting clears private inputs.
5. Select **Prepare public commitment**, then copy the public packet.
6. Share only the employee public key and commitment with the administrator.

Generating new private values replaces the form inputs. Never do this for an already registered allocation unless you still have its original private values.

## Operator: register

1. Connect a Midnight DApp Connector v4 wallet configured for Preprod.
2. Confirm the app loads the new payroll v2 contract ledger.
3. Open **Register allocation**, paste the employee public key and commitment, and enter the dedicated administrator payroll secret from deployment.
4. Approve the wallet request. Wait for finalization.
5. Check the confirmed transaction ID in Session activity and the updated registered allocation count.

The contract rejects non-admin registration and duplicate employee keys. Allocation amounts are not reserved during registration; the operator must plan the budget.

## Employee: claim

1. After registration, return to **Employee claim** with the same amount, secret, and salt.
2. Connect your Preprod wallet and load the ledger.
3. Select **Prove & record claim**, approve the wallet request, and wait.
4. Confirm the transaction ID and increased public claimed total.
5. A second claim must fail. This operation records a claim; it does not transfer tokens.

Private inputs clear after a successful transaction. Activity is local to the current page session, not a full historical indexer view.

## Recovery

- No wallet detected: install/unlock a compatible wallet, then reload.
- Setup warning: a new valid Preprod v2 receipt must be published by the owner.
- Wrong network: switch the wallet to Preprod and reconnect.
- Proving or transaction error: check DUST, network/prover availability, approval, and private inputs.
- Uncertain submission: inspect wallet history before retrying. A failed refresh is not proof that the transaction failed.
- Ledger refresh failed after confirmation: keep the transaction ID, then refresh; actions remain disabled until state reloads.
