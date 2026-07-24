import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../../contracts/managed/payroll/contract/index.js";
import { type PayrollPrivateState, witnesses } from "../witnesses.js";

export class PayrollSimulator {
  readonly contract: Contract<PayrollPrivateState>;
  circuitContext: CircuitContext<PayrollPrivateState>;

  constructor(secretKey: Uint8Array, salaryAmount: bigint, salarySalt: Uint8Array, budget: bigint, adminPk: Uint8Array) {
    this.contract = new Contract<PayrollPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext({ secretKey, salaryAmount, salarySalt }, "0".repeat(64)),
      budget,
      adminPk
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchUser(secretKey: Uint8Array, salaryAmount: bigint, salarySalt: Uint8Array) {
    this.circuitContext.currentPrivateState = {
      secretKey,
      salaryAmount,
      salarySalt
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): PayrollPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public registerEmployeeSalary(employeePk: Uint8Array, commitment: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.registerEmployeeSalary(
      this.circuitContext,
      employeePk,
      commitment,
    ).context;
    return this.getLedger();
  }

  public claimSalary(): Ledger {
    this.circuitContext = this.contract.impureCircuits.claimSalary(
      this.circuitContext,
    ).context;
    return this.getLedger();
  }

  public publicKey(sk: Uint8Array): Uint8Array {
    return this.contract.circuits.publicKey(
      this.circuitContext,
      sk,
    ).result;
  }

  public computeCommitment(amount: bigint, salt: Uint8Array, sk: Uint8Array): Uint8Array {
    return this.contract.circuits.computeCommitment(
      this.circuitContext,
      amount,
      salt,
      sk
    ).result;
  }
}
