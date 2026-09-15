# Verification

The executable contract suite is `src/test/payroll.test.ts` and uses `src/test/payroll-simulator.ts` to execute the actual generated Compact contract, not a substitute implementation.

```sh
npm run compile
npm run check
```

## Automated coverage

- Budget/admin initialization.
- Authorized allocation registration and a valid claim.
- Wrong commitment and budget overflow rejection.
- Unauthorized and duplicate registration rejection.
- Unknown employee, zero amount, and repeat claim rejection.
- Uint32 amount and 32-byte input validation.
- Preprod-only configuration, v2 receipts, identifier checks, and production demo rejection.

All 16 tests passed locally during v2 implementation. Production build also passed. SDK bundling warnings remain; a successful bundle is not evidence that a real wallet transaction succeeds.

## Manual/browser checks

The local browser smoke test in `scripts/browser-smoke.mjs` passed on desktop (1440px) and mobile (390px), including actual local commitment generation and no browser runtime errors. Run it against a production preview with optional Playwright tooling; set `PLAYWRIGHT_MODULE` to that tool installation and `PAYROLL_PREVIEW_URL` if not using port 4178. It deliberately tests the unconfigured release state, not a live wallet flow.

Verify desktop and narrow mobile layout, navigation, keyboard focus, setup warning, wallet-absent handling, input rejection, public packet generation, and disabled submissions before setup.
Never record screenshots of private witness fields while expanded.

Live end-to-end checks require a funded dedicated wallet and a new v2 deployment. No live Preprod claim was executed during this local implementation. Keep the finalized registration and claim IDs in the submission evidence after running the canary.

## CI

Frontend and contract workflows run on main/codex branches and pull requests. Both use Node 20. Contract/release compilation is pinned to Compact 0.30.0. Release artifacts require valid Preprod v2 receipts. CI does not receive wallet secrets.
