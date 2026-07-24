import { PayrollSimulator } from "./payroll-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Private Payroll & Splits Smart Contract Tests", () => {
  const adminSecret = randomBytes(32);
  const totalBudget = 1000n;

  // Setup helper to create a simulator
  const setupSimulator = (userSecret: Uint8Array, amount: bigint, salt: Uint8Array) => {
    const tempSim = new PayrollSimulator(adminSecret, 0n, new Uint8Array(32), totalBudget, new Uint8Array(32));
    const adminPk = tempSim.publicKey(adminSecret);
    return new PayrollSimulator(userSecret, amount, salt, totalBudget, adminPk);
  };

  it("1. Properly initializes contract budget and admin PK", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret, 0n, new Uint8Array(32));
    const ledgerState = simulator.getLedger();

    expect(ledgerState.total_budget).toEqual(totalBudget);
    expect(ledgerState.distributed_amount).toEqual(0n);
  });

  it("2. Lets admin register an employee salary commitment", () => {
    const employeeSecret = randomBytes(32);
    const amount = 300n;
    const salt = randomBytes(32);
    const simulator = setupSimulator(employeeSecret, amount, salt);

    const commitment = simulator.computeCommitment(amount, salt, employeeSecret);
    const employeePk = simulator.publicKey(employeeSecret);

    // Switch to admin to register
    simulator.switchUser(adminSecret, 0n, new Uint8Array(32));
    const ledgerState = simulator.registerEmployeeSalary(employeePk, commitment);
    expect(ledgerState.employee_salaries.member(employeePk)).toEqual(true);
  });

  it("3. Allows employee to claim their salary with valid parameters", () => {
    const employeeSecret = randomBytes(32);
    const amount = 300n;
    const salt = randomBytes(32);
    const simulator = setupSimulator(employeeSecret, amount, salt);

    const commitment = simulator.computeCommitment(amount, salt, employeeSecret);
    const employeePk = simulator.publicKey(employeeSecret);

    // Register
    simulator.switchUser(adminSecret, 0n, new Uint8Array(32));
    simulator.registerEmployeeSalary(employeePk, commitment);

    // Switch back to employee and claim
    simulator.switchUser(employeeSecret, amount, salt);
    const ledgerState = simulator.claimSalary();
    expect(ledgerState.distributed_amount).toEqual(300n);
  });

  it("4. Throws when salary parameters mismatch the registered commitment", () => {
    const employeeSecret = randomBytes(32);
    const amount = 300n;
    const salt = randomBytes(32);
    const simulator = setupSimulator(employeeSecret, amount, salt);

    const commitment = simulator.computeCommitment(amount, salt, employeeSecret);
    const employeePk = simulator.publicKey(employeeSecret);

    // Register
    simulator.switchUser(adminSecret, 0n, new Uint8Array(32));
    simulator.registerEmployeeSalary(employeePk, commitment);

    // Employee tries to claim a fake salary of 400
    simulator.switchUser(employeeSecret, 400n, salt);
    expect(() => simulator.claimSalary()).toThrow("failed assert: Revealed salary parameters do not match commitment");
  });

  it("5. Throws when the salary claim exceeds the remaining budget", () => {
    const employeeSecret = randomBytes(32);
    const amount = 1200n; // Exceeds budget of 1000
    const salt = randomBytes(32);
    const simulator = setupSimulator(employeeSecret, amount, salt);

    const commitment = simulator.computeCommitment(amount, salt, employeeSecret);
    const employeePk = simulator.publicKey(employeeSecret);

    // Register
    simulator.switchUser(adminSecret, 0n, new Uint8Array(32));
    simulator.registerEmployeeSalary(employeePk, commitment);

    // Claim
    simulator.switchUser(employeeSecret, amount, salt);
    expect(() => simulator.claimSalary()).toThrow("failed assert: Budget limit exceeded");
  });
});
