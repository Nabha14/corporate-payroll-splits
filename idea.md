# Project Idea: Private Payroll / Splits (Confidential Employee Payroll)

A payroll distribution DApp that pays employee salaries from a company treasury, ensuring that individual salary values and employee addresses are kept private while verifying that the total distribution aligns with the corporate budget.

## 1. Midnight Network Specialty (ZK & Privacy Features)
*   **Shielded Ledger State:** Uses private state ledgers to record payment transfers, hiding employee balances and receiver wallet addresses from public ledger observers.
*   **Confidential Roster Summation:** Sums individual private salary amounts within a ZK circuit to match against the public budget allocation, proving that the sum is under budget without publishing the individual numbers.
*   **Auditor Compliance:** Supports selective disclosure keys, allowing companies to share payroll records with regulators without publishing employee data to the general public.

## 2. Technical Architecture (Compact Contract)
*   **Public State:**
    *   `approved_budget`: Total public budget allocated for the pay cycle.
    *   `total_spent`: Public aggregate of spent tokens.
    *   `company_admin`: Admin public key.
*   **Private State (Stored by Admin):**
    *   `employee_salaries`: Map of employee wallets to salary values.
*   **Circuits (ZK Proofs):**
    *   `execute_payroll(employee_salaries, company_treasury_pool)`:
        1. Computes the sum of all individual salaries.
        2. Asserts that the `sum(salaries) <= approved_budget`.
        3. Distributes the corresponding token amounts privately to each employee.
        4. Updates the public `total_spent` by adding the sum of the salaries.
        *Output:* A transaction proof showing budget compliance, without exposing employee addresses or their individual salary figures.

## 3. Frontend & Integration (Level 3 Focus)
*   **User Interface:** An HR administrator dashboard where managers configure employee lists and trigger payroll. Employees have an interface to connect their wallet and view private ledger salary receipts.
*   **Lace/Midnight Wallet Integration:**
    *   Handles local ZK proof compilation.
    *   Receives shielded token transfers directly into private balances.

## 4. Verification & Testing Plan
*   **Unit Tests:**
    *   Assert that payroll succeeds when the sum of salaries is under the budget.
    *   Assert that payroll fails if the sum exceeds the budget.
    *   Verify that transaction outputs do not leak employee addresses or individual payout amounts.

---

## 5. How to Build & Deploy on Midnight
To build this project without errors, refer to the master build guide located at the root of the workspace: [BUILD_GUIDE.md](file:///Users/neelsubhashpote/moonlight/BUILD_GUIDE.md). It details how to:
1. Fix language pragma version mismatches.
2. Resolve SDK `4.x` dependency issues.
3. Start the Docker-based local ZK proof server.
4. Deploy the contract using a custom `deploy.mjs` script.
5. Prevent DUST gas errors.
