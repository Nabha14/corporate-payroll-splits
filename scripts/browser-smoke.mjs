import assert from "node:assert/strict";
// Optional browser QA: provide PLAYWRIGHT_MODULE when using a shared tooling installation.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.PAYROLL_PREVIEW_URL || "http://127.0.0.1:4178");
  await page.getByRole("heading", { name: "Payroll, with proof." }).waitFor();
  await page
    .getByText("Preprod deployment required", { exact: true })
    .waitFor();
  await page.screenshot({
    path: "artifacts/overview-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  assert.match(await page.getByRole("alert").innerText(), /Install or unlock/);
  await page
    .getByRole("button", { name: "Employee claim", exact: true })
    .click();
  await page.getByRole("button", { name: "Prepare public commitment" }).click();
  assert.match(await page.getByRole("alert").innerText(), /64 hexadecimal/);
  await page.getByLabel("Allocation amount").fill("300");
  await page
    .getByRole("button", { name: "Generate new private values" })
    .click();
  await page.getByRole("button", { name: "Prepare public commitment" }).click();
  await page
    .getByRole("heading", { name: "Public registration packet" })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Prove & record claim" })
      .isDisabled(),
    true,
  );
  assert.equal(await page.locator(".packet code").count(), 2);
  for (const code of await page.locator(".packet code").allTextContents())
    assert.match(code, /^[a-f0-9]{64}$/);
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  await page
    .getByRole("button", { name: "Privacy & trust", exact: true })
    .click();
  await page.getByRole("heading", { name: "Know what is public." }).waitFor();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "artifacts/overview-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    "Browser smoke passed: desktop/mobile, navigation, missing wallet, input validation, commitment generation, disabled unconfigured claims, and no browser-storage secrets. No chain transaction was attempted.",
  );
} finally {
  await browser.close();
}
