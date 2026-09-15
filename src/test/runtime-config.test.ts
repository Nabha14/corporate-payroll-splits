import { describe, expect, it } from "vitest";
import {
  verifyPayrollDeployment,
  validatePayrollDeploymentRuntime,
} from "../runtimeConfig";

const deployment = {
  contractName: "payroll",
  contractAddress:
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  network: "preprod",
  contractVersion: 2,
  transactionHash:
    "000000000000000000000000000000000000000000000000000000000000000000",
  deployedAt: "2026-08-03T18:00:00.000Z",
};

describe("Corporate Payroll Splits production configuration", () => {
  it("accepts matching Preprod deployment evidence", () => {
    expect(verifyPayrollDeployment(deployment).contractName).toBe("payroll");
  });

  it("rejects evidence copied from another project", () => {
    expect(() =>
      verifyPayrollDeployment({
        ...deployment,
        contractName: "foreign_contract",
      }),
    ).toThrow(/different contract/);
  });

  it("rejects malformed contract and transaction identifiers", () => {
    expect(() =>
      verifyPayrollDeployment({
        ...deployment,
        contractAddress: "preview1bad",
      }),
    ).toThrow(/32-byte/);
    expect(() =>
      verifyPayrollDeployment({ ...deployment, transactionHash: "pending" }),
    ).toThrow(/transaction evidence/);
  });

  it("prevents demo mode and network drift in production", () => {
    expect(() =>
      validatePayrollDeploymentRuntime({ networkId: "preview" }),
    ).toThrow(/Preprod/);
    expect(() =>
      validatePayrollDeploymentRuntime({ production: true, demoMode: "true" }),
    ).toThrow(/forbidden/);
  });
  it("rejects archived deployments and old contract versions", () => {
    expect(() =>
      verifyPayrollDeployment({ ...deployment, network: "preview" }),
    ).toThrow(/v2/);
    expect(() =>
      verifyPayrollDeployment({ ...deployment, contractVersion: 1 }),
    ).toThrow(/v2/);
  });
});
