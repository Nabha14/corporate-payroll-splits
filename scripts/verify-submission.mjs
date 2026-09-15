import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const required = [
  "README.md",
  "SETUP.md",
  "USAGE.md",
  "SUBMISSION.md",
  "PROPOSAL.md",
  "TESTING.md",
  "SECURITY.md",
  "OPERATIONS.md",
  "src/test/payroll.test.ts",
  "src/runtimeConfig.ts",
  ".github/workflows/frontend-ci.yml",
  ".github/workflows/contract-ci.yml",
];
for (const file of required)
  assert.ok((await stat(file)).isFile(), "Missing required file: " + file);
const readme = await readFile("README.md", "utf8");
for (const file of required.filter(
  (file) => file.endsWith(".md") && file !== "README.md",
))
  assert.ok(readme.includes(file), "README must link " + file);
const suite = await readFile("src/test/payroll.test.ts", "utf8");
assert.ok(
  (suite.match(/\bit\s*\(/g)?.length ?? 0) >= 9,
  "Contract regression scenarios are missing.",
);
console.log(
  "Repository documentation and test structure verified. This is not a live-deployment or submission-completion claim.",
);
