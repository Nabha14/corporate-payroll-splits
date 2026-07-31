# Verification checklist

The executable contract suite is `src/test/payroll.test.ts`.

```bash
npm test
npm run compile
npm run build
```

Five passing scenarios cover budget initialization, employee commitment registration, a valid private salary claim, commitment mismatch rejection, and budget-overflow protection. The tests verify that salary details are checked privately while the budget rules remain enforceable.

CI runs the contract and frontend checks on every push and pull request.
