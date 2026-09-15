import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Users,
  Activity,
  ArrowRight,
  CircleHelp,
} from "lucide-react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import {
  connectPayrollWallet,
  prepareEmployee,
  readPayrollLedger,
  submitPayrollCircuit,
  type ConnectedWallet,
} from "./midnightClient";
import { payrollBytes32, hexString } from "./payrollInputs";
import {
  verifyPayrollDeployment,
  validatePayrollDeploymentRuntime,
  type VerifiedDeployment,
} from "./runtimeConfig";

type Tab = "overview" | "register" | "claim" | "privacy";
type Ledger = Awaited<ReturnType<typeof readPayrollLedger>>;
const repo = "https://github.com/Nabha14/corporate-payroll-splits";
const short = (value: string) => value.slice(0, 10) + "…" + value.slice(-8);
const number = (value: number | undefined) =>
  value === undefined ? "—" : value.toLocaleString();
const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "register", label: "Register allocation", icon: Users },
  { id: "claim", label: "Employee claim", icon: Fingerprint },
  { id: "privacy", label: "Privacy & trust", icon: ShieldCheck },
] as const;

export default function App() {
  const [tab, setTab] = useState<Tab>("overview");
  const [deployment, setDeployment] = useState<VerifiedDeployment | null>(null);
  const [setupIssue, setSetupIssue] = useState("Checking deployment receipt…");
  const [wallets, setWallets] = useState<InitialAPI[]>([]);
  const [walletIndex, setWalletIndex] = useState("0");
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [address, setAddress] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [updated, setUpdated] = useState("");
  const [busy, setBusy] = useState("");
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<
    { id: string; action: string; time: string }[]
  >([]);
  const [amount, setAmount] = useState("");
  const [secret, setSecret] = useState("");
  const [salt, setSalt] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [employeeKey, setEmployeeKey] = useState("");
  const [commitment, setCommitment] = useState("");
  const [packet, setPacket] = useState<{
    publicKey: string;
    commitment: string;
  } | null>(null);
  const ready = !!wallet && !!deployment && !!ledger;

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const runtime = validatePayrollDeploymentRuntime({
          networkId: import.meta.env.VITE_NETWORK_ID,
          contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
          faucetUrl: import.meta.env.VITE_FAUCET_URL,
          demoMode: import.meta.env.VITE_DEMO_MODE,
          production: import.meta.env.PROD,
        });
        const response = await fetch(
          import.meta.env.BASE_URL + "deployment.json",
          { signal: abort.signal, cache: "no-store" },
        );
        if (!response.ok)
          throw new Error(
            "No deployment receipt is published. Complete the operator setup guide.",
          );
        const verified = verifyPayrollDeployment(await response.json());
        if (
          runtime.contractAddress &&
          runtime.contractAddress !== verified.contractAddress
        )
          throw new Error(
            "Configured address does not match the deployment receipt.",
          );
        if (!abort.signal.aborted) {
          setDeployment(verified);
          setSetupIssue("");
        }
      } catch (e) {
        if (!abort.signal.aborted)
          setSetupIssue(
            e instanceof Error ? e.message : "Deployment setup failed.",
          );
      }
    }
    const detect = () =>
      setWallets(
        Object.values(
          (window as Window & { midnight?: Record<string, InitialAPI> })
            .midnight ?? {},
        ).filter(
          (w) =>
            typeof w.connect === "function" && w.apiVersion?.startsWith("4."),
        ),
      );
    void load();
    detect();
    const timer = setInterval(detect, 1500);
    return () => {
      abort.abort();
      clearInterval(timer);
    };
  }, []);

  async function run(label: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setError("");
    setMessage("");
    try {
      await action();
    } catch {
      setError(
        "Operation did not complete. Check wallet approval, Preprod network, DUST balance, and your inputs. If you approved a transaction, check its status in your wallet before retrying.",
      );
    } finally {
      lock.current = false;
      setBusy("");
    }
  }
  async function refresh(currentWallet = wallet) {
    if (!currentWallet || !deployment) return;
    setLedger(null);
    setUpdated("");
    const value = await readPayrollLedger(
      currentWallet,
      deployment.contractAddress,
    );
    setLedger(value);
    setUpdated(new Date().toLocaleTimeString());
  }
  function clearSecrets() {
    setSecret("");
    setSalt("");
    setAdminSecret("");
    setPacket(null);
  }
  async function connect() {
    if (!wallets[Number(walletIndex)]) {
      setError(
        "Install or unlock a Midnight wallet supporting DApp Connector v4, then reload.",
      );
      return;
    }
    await run("Connecting wallet", async () => {
      const session = await connectPayrollWallet(wallets[Number(walletIndex)]);
      setWallet(session.connected);
      setAddress(session.address);
      await refresh(session.connected);
      setMessage("Wallet connected to Preprod.");
    });
  }
  async function submit(
    event: FormEvent,
    action: "registerEmployeeSalary" | "claimSalary",
  ) {
    event.preventDefault();
    if (!wallet || !deployment || !ready) return;
    let state,
      args: unknown[] = [];
    try {
      if (action === "claimSalary")
        state = prepareEmployee(amount, secret, salt).state;
      else {
        state = {
          secretKey: payrollBytes32(adminSecret, "Administrator secret"),
          salaryAmount: 0n,
          salarySalt: new Uint8Array(32),
        };
        args = [
          payrollBytes32(employeeKey, "Employee public key"),
          payrollBytes32(commitment, "Commitment"),
        ];
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your inputs.");
      return;
    }
    await run("Approve in wallet · proving and confirming", async () => {
      const result = await submitPayrollCircuit(
        wallet,
        deployment.contractAddress,
        action,
        args,
        state,
      );
      setLogs((previous) => [
        {
          id: result.txId,
          action:
            action === "claimSalary"
              ? "Claim recorded"
              : "Allocation registered",
          time: new Date().toLocaleTimeString(),
        },
        ...previous,
      ]);
      clearSecrets();
      setMessage(
        "Transaction confirmed on Preprod. No salary tokens were transferred.",
      );
      try {
        await refresh();
      } catch {
        setLedger(null);
        setError(
          "Transaction confirmed, but ledger refresh failed. Refresh before any further operation.",
        );
      }
    });
  }
  function prepare() {
    setError("");
    try {
      const result = prepareEmployee(amount, secret, salt);
      setPacket({ publicKey: result.publicKey, commitment: result.commitment });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check allocation inputs.");
    }
  }
  function generatePrivateValues() {
    if (
      (secret || salt) &&
      !window.confirm(
        "Replace the private values in this form? Keep an offline backup if they belong to a registered allocation.",
      )
    )
      return;
    setSecret(hexString(crypto.getRandomValues(new Uint8Array(32))));
    setSalt(hexString(crypto.getRandomValues(new Uint8Array(32))));
    setPacket(null);
    setMessage(
      "New private values generated. Save them in your password manager using the reveal control before registering.",
    );
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Public value copied.");
    } catch {
      setError(
        "Clipboard unavailable. Select and copy the public value manually.",
      );
    }
  }
  const step = !deployment ? 0 : !wallet ? 1 : !ledger ? 2 : 3;
  const used = ledger?.budget
    ? Math.min(100, (ledger.distributed / ledger.budget) * 100)
    : 0;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <a href="#workspace" className="brand">
          <span className="brand-symbol">
            <Fingerprint size={25} />
          </span>
          <span>
            Nabha<span className="brand-caption">PAYROLL WORKSPACE</span>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">CP</span>
          <div>
            Corporate payroll<small>Test-network workspace</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Workspace navigation">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "nav-item active" : "nav-item"}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                setTab(id);
                setError("");
              }}
            >
              <Icon size={18} />
              {label}
              {tab === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <LockKeyhole size={19} />
            <strong>Your secrets stay yours.</strong>
            <p>
              Use dedicated payroll secrets. Never enter a wallet recovery
              phrase.
            </p>
          </div>
          <a
            href={repo + "/blob/main/SETUP.md"}
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={17} />
            Setup & documentation
            <ArrowUpRight size={15} />
          </a>
          <span className="built-on">BUILT ON MIDNIGHT · BY NABHA</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>{tabs.find((t) => t.id === tab)?.label}</strong>
          </div>
          <div className="top-actions">
            <span className="network-pill">
              <span />
              Preprod
            </span>
            {wallet ? (
              <button
                className="button secondary compact"
                disabled={!!busy}
                onClick={() => {
                  setWallet(null);
                  setAddress("");
                  setLedger(null);
                  clearSecrets();
                  setMessage("Local wallet session disconnected.");
                }}
              >
                <Wallet size={16} />
                {short(address)} · Disconnect
              </button>
            ) : (
              <>
                <select
                  aria-label="Choose Midnight wallet"
                  value={walletIndex}
                  onChange={(e) => setWalletIndex(e.target.value)}
                  disabled={!!busy || !wallets.length}
                >
                  {wallets.length ? (
                    wallets.map((w, i) => (
                      <option key={i} value={i}>
                        {w.name}
                      </option>
                    ))
                  ) : (
                    <option>No wallet detected</option>
                  )}
                </select>
                <button
                  className="button compact"
                  disabled={!!busy}
                  onClick={connect}
                >
                  <Wallet size={16} />
                  Connect wallet
                </button>
              </>
            )}
          </div>
        </header>
        <main id="workspace" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <p className="eyebrow">CORPORATE PAYROLL SPLITS</p>
              <h1>
                {tab === "overview"
                  ? "Payroll, with proof."
                  : tab === "register"
                    ? "One allocation. One claim."
                    : tab === "claim"
                      ? "Your allocation, verified."
                      : "Know what is public."}
              </h1>
              <p>
                {tab === "overview"
                  ? "A clear view of your budget. Verifiable allocation and claim records."
                  : tab === "register"
                    ? "Register an employee commitment with your administrator key."
                    : tab === "claim"
                      ? "Prepare an allocation commitment or claim a registered amount."
                      : "Zero-knowledge proofs are not a promise that every field is hidden."}
              </p>
            </div>
            <span className="version-tag">MVP / V2</span>
          </div>
          {setupIssue && (
            <div className="notice warning" role="status">
              <ShieldCheck size={20} />
              <div>
                <strong>Preprod deployment required</strong>
                <p>{setupIssue} Transactions remain disabled.</p>
              </div>
            </div>
          )}
          {error && (
            <div className="notice error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}
          <div aria-live="polite">
            {(busy || message) && (
              <div className="notice info">
                {busy ? (
                  <RefreshCw size={18} className="spinning" />
                ) : (
                  <Check size={18} />
                )}
                {busy || message}
              </div>
            )}
          </div>

          {tab === "overview" && (
            <>
              <section className="overview-grid">
                <div className="budget-panel">
                  <div className="panel-label">
                    <span>BUDGET OVERVIEW</span>
                    <span className="subtle-tag">
                      {ledger ? "Chain data" : "Awaiting chain data"}
                    </span>
                  </div>
                  <h2>
                    Every allocation.
                    <br />
                    <span>Accounted for.</span>
                  </h2>
                  <div className="budget-value">
                    {number(ledger?.budget)}
                    <span>accounting units</span>
                  </div>
                  <div
                    className="budget-track"
                    role="progressbar"
                    aria-label="Budget claimed"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={ledger ? used : undefined}
                  >
                    <span style={{ width: used + "%" }} />
                  </div>
                  <div className="budget-legend">
                    <span>
                      <i />
                      {number(ledger?.distributed)} claimed
                    </span>
                    <span>
                      {number(
                        ledger ? ledger.budget - ledger.distributed : undefined,
                      )}{" "}
                      remaining
                    </span>
                  </div>
                  <p className="budget-footnote">
                    Claim accounting only. This contract does not custody or
                    transfer tokens.
                  </p>
                </div>
                <div className="readiness-panel panel">
                  <div className="section-title">
                    <h2>Ready when you are</h2>
                    <span className="count-label">{step}/3</span>
                  </div>
                  <p className="muted">
                    Three checks before your first transaction.
                  </p>
                  {[
                    "Publish a Preprod v2 receipt",
                    "Connect a Preprod wallet",
                    "Read the deployed ledger",
                  ].map((label, i) => (
                    <div className="check-step" key={label}>
                      <span
                        className={
                          step > i ? "step-number complete" : "step-number"
                        }
                      >
                        {step > i ? <Check size={15} /> : i + 1}
                      </span>
                      <div>
                        <strong>{label}</strong>
                        <small>
                          {i === 0
                            ? "A new address is required for this contract."
                            : i === 1
                              ? "Approve access in your wallet extension."
                              : "Confirm the budget from the indexer."}
                        </small>
                      </div>
                    </div>
                  ))}
                  <button
                    className="button secondary full"
                    disabled={!!busy || !wallet || !deployment}
                    onClick={() => run("Reading ledger", () => refresh())}
                  >
                    <RefreshCw size={16} />
                    Refresh chain state
                  </button>
                </div>
              </section>
              <section className="stats-row" aria-label="Payroll statistics">
                <div>
                  <Users size={20} />
                  <span>
                    Registered allocations
                    <strong>{number(ledger?.employeeCount)}</strong>
                  </span>
                </div>
                <div>
                  <ShieldCheck size={20} />
                  <span>
                    Confirmed claims
                    <strong>{number(ledger?.claimedCount)}</strong>
                  </span>
                </div>
                <div>
                  <Activity size={20} />
                  <span>
                    Last ledger refresh
                    <strong className="small-stat">
                      {updated || "Not connected"}
                    </strong>
                  </span>
                </div>
              </section>
              <div className="action-grid">
                <button
                  className="action-card"
                  onClick={() => setTab("register")}
                >
                  <span className="action-icon">
                    <Users size={21} />
                  </span>
                  <div>
                    <span className="eyebrow">FOR OPERATORS</span>
                    <h3>Register an allocation</h3>
                    <p>Commit an employee allocation to the ledger.</p>
                  </div>
                  <ArrowRight size={20} />
                </button>
                <button className="action-card" onClick={() => setTab("claim")}>
                  <span className="action-icon lilac">
                    <Fingerprint size={23} />
                  </span>
                  <div>
                    <span className="eyebrow">FOR EMPLOYEES</span>
                    <h3>Prepare or claim</h3>
                    <p>Prove ownership using your payroll secret.</p>
                  </div>
                  <ArrowRight size={20} />
                </button>
              </div>
              <section className="panel activity-panel">
                <div className="section-title">
                  <h2>Session activity</h2>
                  <span className="muted">Finalized transactions only</span>
                </div>
                {logs.length ? (
                  <div className="activity-list">
                    {logs.map((log) => (
                      <div key={log.id}>
                        <Check size={17} />
                        <strong>{log.action}</strong>
                        <code>{short(log.id)}</code>
                        <button
                          className="icon-button"
                          aria-label="Copy transaction identifier"
                          onClick={() => copy(log.id)}
                        >
                          <Copy size={15} />
                        </button>
                        <time>{log.time}</time>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Activity size={25} />
                    <strong>A clean ledger starts here</strong>
                    <p>
                      Your confirmed actions will appear here during this
                      session.
                      <br />
                      Nothing is simulated or pre-filled.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}

          {(tab === "register" || tab === "claim") && (
            <div className="form-layout">
              <section className="panel form-panel">
                <div className="section-title">
                  <h2>
                    {tab === "register"
                      ? "Allocation details"
                      : "Private claim details"}
                  </h2>
                  <LockKeyhole size={19} />
                </div>
                <p className="muted">
                  {tab === "register"
                    ? "Ask the employee for their public key and commitment. You do not need their secret."
                    : "Use a dedicated 32-byte payroll secret, not a wallet seed or recovery phrase."}
                </p>
                <form
                  onSubmit={(event) =>
                    submit(
                      event,
                      tab === "register"
                        ? "registerEmployeeSalary"
                        : "claimSalary",
                    )
                  }
                >
                  <fieldset disabled={!!busy}>
                    {tab === "register" ? (
                      <>
                        <label>
                          Employee public key
                          <input
                            required
                            value={employeeKey}
                            onChange={(e) => setEmployeeKey(e.target.value)}
                            placeholder="64 hexadecimal characters"
                            spellCheck={false}
                          />
                        </label>
                        <label>
                          Allocation commitment
                          <input
                            required
                            value={commitment}
                            onChange={(e) => setCommitment(e.target.value)}
                            placeholder="64 hexadecimal characters"
                            spellCheck={false}
                          />
                        </label>
                        <label>
                          Administrator payroll secret
                          <input
                            required
                            type="password"
                            autoComplete="off"
                            value={adminSecret}
                            onChange={(e) => setAdminSecret(e.target.value)}
                            placeholder="Dedicated administrator secret"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label>
                          Allocation amount{" "}
                          <span>Accounting units, not tNIGHT</span>
                          <input
                            required
                            inputMode="numeric"
                            value={amount}
                            onChange={(e) => {
                              setAmount(e.target.value);
                              setPacket(null);
                            }}
                            placeholder="e.g. 300"
                          />
                        </label>
                        <label>
                          Employee payroll secret
                          <input
                            required
                            type="password"
                            autoComplete="off"
                            value={secret}
                            onChange={(e) => {
                              setSecret(e.target.value);
                              setPacket(null);
                            }}
                            placeholder="64 hexadecimal characters"
                          />
                        </label>
                        <label>
                          Salary salt
                          <input
                            required
                            type="password"
                            autoComplete="off"
                            value={salt}
                            onChange={(e) => {
                              setSalt(e.target.value);
                              setPacket(null);
                            }}
                            placeholder="64 hexadecimal characters"
                          />
                        </label>
                        <div className="form-tools">
                          <button
                            type="button"
                            className="text-button"
                            onClick={generatePrivateValues}
                          >
                            Generate new private values
                          </button>
                          <button
                            className="text-button"
                            type="button"
                            onClick={prepare}
                          >
                            Prepare public commitment
                          </button>
                        </div>
                        <details className="secret-details">
                          <summary>
                            Reveal private values for offline backup
                          </summary>
                          <p>
                            Keep these in your password manager. Never send them
                            to the operator.
                          </p>
                          <code>{secret || "No secret yet"}</code>
                          <code>{salt || "No salt yet"}</code>
                        </details>
                      </>
                    )}
                    <button
                      className="button full"
                      type="submit"
                      disabled={!ready || !!busy}
                    >
                      {tab === "register"
                        ? "Register allocation"
                        : "Prove & record claim"}
                      <ArrowRight size={17} />
                    </button>
                  </fieldset>
                  <p className="form-hint">
                    {!ready
                      ? "A verified deployment, connected wallet, and loaded ledger are required."
                      : "Your wallet will request approval. Keep this tab open until confirmation."}
                  </p>
                </form>
              </section>
              <aside className="form-aside">
                <section className="panel">
                  <p className="eyebrow">
                    {tab === "register"
                      ? "ADMINISTRATOR CHECKLIST"
                      : "BEFORE YOU CLAIM"}
                  </p>
                  <h3>
                    {tab === "register"
                      ? "Built-in guardrails."
                      : "Prepare. Register. Claim."}
                  </h3>
                  <ul>
                    {(tab === "register"
                      ? [
                          "Only the contract administrator can register.",
                          "An allocation cannot be overwritten.",
                          "Each registered employee can claim once.",
                          "Claims cannot exceed the total budget.",
                        ]
                      : [
                          "Save your amount, secret, and salt offline.",
                          "Prepare and share only the public commitment packet.",
                          "Ask the administrator to register that packet.",
                          "Return with the same private inputs to claim.",
                        ]
                    ).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <p className="muted">
                    This MVP supports one allocation per employee per deployed
                    payroll contract.
                  </p>
                </section>
                {packet && tab === "claim" && (
                  <section className="panel packet">
                    <p className="eyebrow">SAFE TO SHARE WITH OPERATOR</p>
                    <h3>Public registration packet</h3>
                    <label>
                      Employee public key<code>{packet.publicKey}</code>
                    </label>
                    <label>
                      Commitment<code>{packet.commitment}</code>
                    </label>
                    <button
                      className="button secondary full"
                      onClick={() => copy(JSON.stringify(packet, null, 2))}
                    >
                      <Copy size={16} />
                      Copy public packet
                    </button>
                  </section>
                )}
              </aside>
            </div>
          )}

          {tab === "privacy" && (
            <div className="privacy-grid">
              <section className="panel">
                <ShieldCheck size={28} />
                <h2>What the circuit enforces</h2>
                <ul>
                  <li>Administrator-only registration.</li>
                  <li>Proof of the employee secret and committed amount.</li>
                  <li>A positive claim within the remaining budget.</li>
                  <li>One claim per registered employee.</li>
                </ul>
              </section>
              <section className="panel">
                <Activity size={28} />
                <h2>What remains public</h2>
                <ul>
                  <li>Budget, cumulative claimed amount, and claim deltas.</li>
                  <li>Pseudonymous employee keys and commitments.</li>
                  <li>
                    Claim status, transaction timing, and public ledger
                    activity.
                  </li>
                </ul>
                <p>
                  Individual claim amounts can be inferred from changes to the
                  public total. Do not use real salary data.
                </p>
              </section>
              <section className="panel privacy-wide">
                <LockKeyhole size={25} />
                <div>
                  <h2>Private witnesses. Honest boundaries.</h2>
                  <p>
                    Secrets and salts are held in memory, not browser storage. A
                    wallet proving provider may process witness data; trust and
                    configure it accordingly. This is unaudited test-network
                    software, not a salary payment service. No tokens move when
                    a claim is recorded.
                  </p>
                </div>
              </section>
            </div>
          )}

          <footer className="footer">
            <span>
              <span className="footer-dot" />
              Midnight Preprod · Test-network only
            </span>
            <div>
              {deployment ? (
                <button
                  className="text-button"
                  onClick={() => copy(deployment.contractAddress)}
                >
                  Contract {short(deployment.contractAddress)}{" "}
                  <Copy size={12} />
                </button>
              ) : (
                <span>No verified v2 contract</span>
              )}
              <a href={repo} target="_blank" rel="noreferrer">
                Source code
                <ArrowUpRight size={14} />
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
