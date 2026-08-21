type RuntimeEnvironment = {
  networkId?: string;
  contractAddress?: string;
  faucetUrl?: string;
  demoMode?: string;
  production?: boolean;
};

export type VerifiedDeployment = {
  contractName: 'payroll';
  contractAddress: string;
  network: 'preview';
  transactionHash: string;
  deployedAt: string;
};

const ADDRESS = /^[0-9a-f]{64}$/i;
const TRANSACTION = /^[0-9a-f]{66}$/i;
const PREVIEW_FAUCET = 'https://faucet.preview.midnight.network/';

export function verifyPayrollDeployment(value: unknown): VerifiedDeployment {
  if (!value || typeof value !== 'object') {
    throw new Error('Corporate Payroll Splits: deployment evidence is missing.');
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.contractName !== 'payroll') {
    throw new Error('Corporate Payroll Splits: deployment belongs to a different contract.');
  }
  if (candidate.network !== 'preview') {
    throw new Error('Corporate Payroll Splits: only the independently deployed Preview contract is accepted.');
  }
  if (typeof candidate.contractAddress !== 'string' || !ADDRESS.test(candidate.contractAddress)) {
    throw new Error('Corporate Payroll Splits: contract address is not a 32-byte hexadecimal address.');
  }
  if (typeof candidate.transactionHash !== 'string' || !TRANSACTION.test(candidate.transactionHash)) {
    throw new Error('Corporate Payroll Splits: finalized deployment transaction evidence is invalid.');
  }
  if (typeof candidate.deployedAt !== 'string' || Number.isNaN(Date.parse(candidate.deployedAt))) {
    throw new Error('Corporate Payroll Splits: deployment timestamp is invalid.');
  }

  return candidate as VerifiedDeployment;
}

export function validatePayrollDeploymentRuntime(env: RuntimeEnvironment) {
  const networkId = env.networkId || 'preview';
  const faucetUrl = env.faucetUrl || PREVIEW_FAUCET;

  if (networkId !== 'preview') {
    throw new Error('Corporate Payroll Splits: wallet network must be Preview.');
  }
  if (faucetUrl !== PREVIEW_FAUCET) {
    throw new Error('Corporate Payroll Splits: faucet host is not the approved Preview faucet.');
  }
  if (env.contractAddress && !ADDRESS.test(env.contractAddress)) {
    throw new Error('Corporate Payroll Splits: VITE_CONTRACT_ADDRESS is malformed.');
  }
  if (env.production && env.demoMode === 'true') {
    throw new Error('Corporate Payroll Splits: simulated chain activity is forbidden in production.');
  }

  return { networkId, faucetUrl, contractAddress: env.contractAddress || null };
}

