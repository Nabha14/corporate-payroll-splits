# Operations — Nabha Payroll

## Local release gate

Run `npm ci`, `npm run compile`, and `npm run check`. Compile with Compact 0.30.0.
Tests exercise generated contract code. Publish a new v2 contract; do not use old Preview artifacts.

## Live release gate

1. Sign GitHub in as Nabha14 with product-repository write access.
2. Deploy with a dedicated project wallet using [SETUP.md](SETUP.md).
3. Verify root/public receipt equality with `npm run verify:deployment`.
4. Verify the address, finalized deployment transaction, and live ledger on Preprod.
5. Register one synthetic allocation, claim it, and confirm a repeated claim is rejected.
6. Push the verified release and wait for its own CI runs to pass.
7. Publish the frontend, repeat the canary on the public URL, and record the demo.
8. Update README with actual live evidence, X profile, video, and workflow run links.

A workflow badge from the old release is not evidence for this release.

## Incidents

Check wallet history before retrying uncertain transactions. Disable submissions when state is stale, reconcile public claim totals, and preserve only public receipts in incident notes. Wallet approval is not finalization.

## Rollback

Roll back frontend artifacts only to a release matching its contract version and receipt. On-chain state cannot be rolled back. Contract changes require a new deployment. Keep old receipts as explicitly labeled historical evidence, never as an active fallback.
