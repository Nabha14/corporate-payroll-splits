import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  salaryAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  salarySalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerEmployeeSalary(context: __compactRuntime.CircuitContext<PS>,
                         employee_pk_0: Uint8Array,
                         commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimSalary(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerEmployeeSalary(context: __compactRuntime.CircuitContext<PS>,
                         employee_pk_0: Uint8Array,
                         commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimSalary(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  computeCommitment(amount_0: bigint, salt_0: Uint8Array, sk_0: Uint8Array): Uint8Array;
  publicKey(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  registerEmployeeSalary(context: __compactRuntime.CircuitContext<PS>,
                         employee_pk_0: Uint8Array,
                         commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimSalary(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  computeCommitment(context: __compactRuntime.CircuitContext<PS>,
                    amount_0: bigint,
                    salt_0: Uint8Array,
                    sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  publicKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly total_budget: bigint;
  readonly distributed_amount: bigint;
  employee_salaries: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  readonly admin: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               budget_0: bigint,
               admin_pk_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
