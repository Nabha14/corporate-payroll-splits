import { describe, expect, it } from 'vitest';
import { verifyPayrollDeployment, validatePayrollDeploymentRuntime } from '../runtimeConfig';

const deployment = {
  contractName: 'payroll',
  contractAddress: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  network: 'preview',
  transactionHash: '000000000000000000000000000000000000000000000000000000000000000000',
  deployedAt: '2026-08-03T18:00:00.000Z',
};

describe('Corporate Payroll Splits production configuration', () => {
  it('accepts matching Preview deployment evidence', () => {
    expect(verifyPayrollDeployment(deployment).contractName).toBe('payroll');
  });

  it('rejects evidence copied from another project', () => {
    expect(() => verifyPayrollDeployment({ ...deployment, contractName: 'foreign_contract' })).toThrow(/different contract/);
  });

  it('rejects malformed contract and transaction identifiers', () => {
    expect(() => verifyPayrollDeployment({ ...deployment, contractAddress: 'preview1bad' })).toThrow(/32-byte/);
    expect(() => verifyPayrollDeployment({ ...deployment, transactionHash: 'pending' })).toThrow(/transaction evidence/);
  });

  it('prevents demo mode and network drift in production', () => {
    expect(() => validatePayrollDeploymentRuntime({ networkId: 'preprod' })).toThrow(/Preview/);
    expect(() => validatePayrollDeploymentRuntime({ production: true, demoMode: 'true' })).toThrow(/forbidden/);
  });
});

