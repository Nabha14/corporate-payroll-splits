import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { createProofProvider } from "@midnight-ntwrk/midnight-js-types";
import {
  fromHex,
  parseCoinPublicKeyToHex,
  parseEncPublicKeyToHex,
  toHex,
} from "@midnight-ntwrk/midnight-js-utils";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import * as contractModule from "../contracts/managed/payroll/contract/index.js";
import { witnesses, type PayrollPrivateState } from "./witnesses";
import { payrollBytes32, payrollAmount, hexString } from "./payrollInputs";
import { Buffer } from "buffer";

if (!globalThis.Buffer) globalThis.Buffer = Buffer;
const NETWORK_ID = "preprod";
setNetworkId(NETWORK_ID);
export type ConnectedWallet = ConnectedAPI;
export { payrollBytes32 };

async function walletConfiguration(wallet: ConnectedWallet) {
  const configuration = await wallet.getConfiguration();
  if (configuration.networkId !== NETWORK_ID)
    throw new Error("Switch your wallet to Midnight Preprod and reconnect.");
  const expected = "indexer.preprod.midnight.network";
  if (
    new URL(configuration.indexerUri).hostname !== expected ||
    new URL(configuration.indexerUri).protocol !== "https:" ||
    new URL(configuration.indexerWsUri).hostname !== expected ||
    new URL(configuration.indexerWsUri).protocol !== "wss:"
  ) {
    throw new Error("Wallet must use the official Preprod indexer endpoints.");
  }
  return configuration;
}

export async function connectPayrollWallet(wallet: {
  connect(network: string): Promise<ConnectedWallet>;
}) {
  const connected = await wallet.connect(NETWORK_ID);
  await walletConfiguration(connected);
  const address = await connected.getUnshieldedAddress();
  return { connected, address: address.unshieldedAddress };
}

function zkConfigProvider() {
  const read = async (folder: string, id: string, extension: string) => {
    const circuit = id.split("#").pop();
    if (!["claimSalary", "registerEmployeeSalary"].includes(circuit ?? ""))
      throw new Error("Unsupported payroll circuit.");
    const response = await fetch(
      import.meta.env.BASE_URL +
        "midnight/payroll/" +
        folder +
        "/" +
        circuit +
        extension,
    );
    if (!response.ok)
      throw new Error(
        "Payroll proving assets unavailable. Ask the operator to rebuild and publish this release.",
      );
    return new Uint8Array(await response.arrayBuffer());
  };
  return {
    getProverKey: (id: string) => read("keys", id, ".prover"),
    getVerifierKey: (id: string) => read("keys", id, ".verifier"),
    getZKIR: (id: string) => read("zkir", id, ".bzkir"),
    getVerifierKeys: (ids: string[]) =>
      Promise.all(
        ids.map(async (id) => [id, await read("keys", id, ".verifier")]),
      ),
    get: async (id: string) => ({
      circuitId: id,
      proverKey: await read("keys", id, ".prover"),
      verifierKey: await read("keys", id, ".verifier"),
      zkir: await read("zkir", id, ".bzkir"),
    }),
  };
}

// Each operation has isolated in-memory witnesses. No shared wallet globals or disk persistence.
function privateStateProvider() {
  const states = new Map<string, unknown>(),
    keys = new Map<string, unknown>();
  let address = "";
  return {
    setContractAddress(value: string) {
      address = value;
    },
    async set(id: string, value: unknown) {
      states.set(address + ":" + id, value);
    },
    async get(id: string) {
      return states.get(address + ":" + id) ?? null;
    },
    async remove(id: string) {
      states.delete(address + ":" + id);
    },
    async clear() {
      states.clear();
    },
    async setSigningKey(id: string, value: unknown) {
      keys.set(id, value);
    },
    async getSigningKey(id: string) {
      return keys.get(id) ?? null;
    },
    async removeSigningKey(id: string) {
      keys.delete(id);
    },
    async clearSigningKeys() {
      keys.clear();
    },
  };
}

export function prepareEmployee(amount: string, secret: string, salt: string) {
  const state = {
    secretKey: payrollBytes32(secret, "Employee secret"),
    salarySalt: payrollBytes32(salt, "Salary salt"),
    salaryAmount: payrollAmount(amount),
  };
  return {
    state,
    publicKey: hexString(
      contractModule.pureCircuits.publicKey(state.secretKey),
    ),
    commitment: hexString(
      contractModule.pureCircuits.computeCommitment(
        state.salaryAmount,
        state.salarySalt,
        state.secretKey,
      ),
    ),
  };
}

export async function submitPayrollCircuit(
  wallet: ConnectedWallet,
  contractAddress: string,
  circuitId: "claimSalary" | "registerEmployeeSalary",
  args: unknown[],
  state: PayrollPrivateState,
) {
  payrollBytes32(contractAddress, "Contract address");
  if (
    state.secretKey.length !== 32 ||
    state.salarySalt.length !== 32 ||
    state.salaryAmount < 0n ||
    state.salaryAmount > 4294967295n
  )
    throw new Error("Invalid payroll witness state.");
  const configuration = await walletConfiguration(wallet);
  const addresses = await wallet.getShieldedAddresses();
  const zk = zkConfigProvider();
  const privateState = privateStateProvider();
  const providers = {
    privateStateProvider: privateState,
    publicDataProvider: indexerPublicDataProvider(
      configuration.indexerUri,
      configuration.indexerWsUri,
      WebSocket as unknown as NonNullable<
        Parameters<typeof indexerPublicDataProvider>[2]
      >,
    ),
    zkConfigProvider: zk,
    proofProvider: createProofProvider(await wallet.getProvingProvider(zk)),
    walletProvider: {
      getCoinPublicKey: () =>
        parseCoinPublicKeyToHex(addresses.shieldedCoinPublicKey, NETWORK_ID),
      getEncryptionPublicKey: () =>
        parseEncPublicKeyToHex(
          addresses.shieldedEncryptionPublicKey,
          NETWORK_ID,
        ),
      async balanceTx(tx: ledger.Transaction<any, any, any>) {
        const balanced = await wallet.balanceUnsealedTransaction(
          toHex(tx.serialize()),
        );
        return ledger.Transaction.deserialize(
          "signature",
          "proof",
          "binding",
          fromHex(balanced.tx),
        );
      },
    },
    midnightProvider: {
      async submitTx(tx: ledger.Transaction<any, any, any>) {
        await wallet.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
  try {
    const compiledContract = CompiledContract.make(
      "payroll",
      contractModule.Contract,
    ).pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(
        import.meta.env.BASE_URL + "midnight/payroll",
      ),
    );
    const deployed = await findDeployedContract(providers as any, {
      compiledContract,
      contractAddress,
      privateStateId: "payrollState",
      initialPrivateState: state,
    });
    const call = (
      deployed.callTx as unknown as Record<
        string,
        (...args: unknown[]) => Promise<any>
      >
    )[circuitId];
    return (await call(...args)).public as { txId: string };
  } finally {
    await privateState.clear();
    await privateState.clearSigningKeys();
  }
}

export async function readPayrollLedger(
  wallet: ConnectedWallet,
  contractAddress: string,
) {
  const configuration = await walletConfiguration(wallet);
  const state = await indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri,
    WebSocket as unknown as NonNullable<
      Parameters<typeof indexerPublicDataProvider>[2]
    >,
  ).queryContractState(contractAddress);
  if (!state)
    throw new Error(
      "Payroll contract was not found on Preprod. Check the deployment receipt.",
    );
  const value = contractModule.ledger(state.data);
  return {
    budget: Number(value.total_budget),
    distributed: Number(value.distributed_amount),
    employeeCount: Number(value.employee_salaries.size()),
    claimedCount: Number(value.claimed.size()),
  };
}
