import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = JSON.parse(await readFile("deployment.json", "utf8"));
const published = JSON.parse(await readFile("public/deployment.json", "utf8"));
assert.deepEqual(
  root,
  published,
  "Root/public deployment receipts must match.",
);
assert.equal(
  root.network,
  "preprod",
  "Release requires a new Preprod deployment, not the archived Preview receipt.",
);
assert.equal(root.contractName, "payroll");
assert.equal(
  root.contractVersion,
  2,
  "Deploy the replay-protected v2 contract.",
);
assert.match(root.contractAddress, /^[a-f0-9]{64}$/i);
assert.match(root.transactionHash, /^(?:[a-f0-9]{64}|[a-f0-9]{66})$/i);
assert.ok(Number.isFinite(Date.parse(root.deployedAt)));
console.log(
  "Preprod v2 receipt format and publication match. Verify chain state and canary transactions separately.",
);
