# Setup and deployment

## Local development

1. Use Node 20 (`nvm use` if installed) and npm.
2. Install the Midnight Compact toolchain with compiler **0.30.0**, matching CI and the generated runtime.
3. Run `npm ci`, `npm run compile`, `npm run check`, then `npm run dev`.
4. Open the local address printed by Vite.

No secrets are needed to build, test, or browse the interface. Optional public build configuration: `VITE_NETWORK_ID=preprod`, `VITE_CONTRACT_ADDRESS=<new address>`. Never put private values in a `VITE_` variable.

The archived root/public deployment receipts identify Preview and are rejected by this release. The dashboard explains the missing setup and disables chain actions rather than inventing data.

## Dedicated operator wallet

Deployment is an owner-operated step. Do not use a wallet from another project or a shared wallet directory.

Create a dedicated Preprod wallet offline and fund it using the official Preprod faucet. The wallet needs synchronized NIGHT and DUST. Put its wallet data in a file under this repository's ignored `.private/` directory. The JSON fields required by the existing wallet SDK helper are:

- `seed`: wallet seed encoded as hexadecimal, supplied privately by the owner.
- `payrollSecret`: an independent cryptographically random 32-byte hex value used for administrator authorization. This is **not** the wallet seed.

Keep backups in the owner's password manager. Never commit the file or print its contents.
Set `PAYROLL_WALLET_FILE` to this exact local file and `PAYROLL_STORAGE_PASSWORD` to a random secret of at least 24 characters in a private terminal environment. The deployment command does not auto-load environment files or search shared wallets.

## Preprod deployment

Confirm current [official network endpoints](https://docs.midnight.network/relnotes/network) and proof-server compatibility before deploying; network compatibility can change.

1. Run a trusted compatible proof server. The helper defaults to `http://127.0.0.1:6300`; `PAYROLL_PROOF_SERVER` can override it. Do not send private payroll inputs to an untrusted prover.
2. Run `npm run compile`, `npm test`, and `npm run deploy` from this project.
3. The helper uses Preprod, account index 0, and a 1,000-unit accounting budget. It requires wallet synchronization and waits for DUST with a timeout.
4. On a finalized deployment, the helper writes matching root and public `deployment.json` files with `contractName: payroll`, `contractVersion: 2`, Preprod network, address, transaction ID, and timestamp.
5. Verify the transaction and address in a Preprod explorer and by reading the contract through the wallet-connected app.
6. Complete the canary in [USAGE.md](USAGE.md), preserving public transaction IDs.
7. Run `npm run verify:deployment` and rebuild. Receipt format checks are not chain verification.

No new Preprod deployment has been performed as part of the local v2 changes. Do not submit the old Preview address as Preprod evidence.

## Publishing

Sign GitHub in as **Nabha14** with write permission to this product repository before pushing. Git commit identity and GitHub authentication are different. Never publish this repository under another account to bypass permissions.

Publish the generated `dist/` directory over HTTPS using the project's owner-approved hosting account. Serve it at the domain root and preserve the `midnight/payroll/` asset paths. Hosting must allow the wallet's configured prover/indexer connections and WebAssembly. Add the verified live URL to README only after testing it.

The existing release workflow publishes build artifacts, not a hosted website. Public hosting and a live Preprod canary remain release gates.
