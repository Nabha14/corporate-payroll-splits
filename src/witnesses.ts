import { Ledger } from "../contracts/managed/payroll/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type PayrollPrivateState = {
  readonly secretKey: Uint8Array;
  readonly salaryAmount: bigint;
  readonly salarySalt: Uint8Array;
};

export const createPayrollPrivateState = (secretKey: Uint8Array, salaryAmount: bigint, salarySalt: Uint8Array) => ({
  secretKey,
  salaryAmount,
  salarySalt
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, PayrollPrivateState>): [
    PayrollPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],

  salaryAmount: ({
    privateState,
  }: WitnessContext<Ledger, PayrollPrivateState>): [
    PayrollPrivateState,
    bigint,
  ] => [privateState, privateState.salaryAmount],

  salarySalt: ({
    privateState,
  }: WitnessContext<Ledger, PayrollPrivateState>): [
    PayrollPrivateState,
    Uint8Array,
  ] => [privateState, privateState.salarySalt],
};
