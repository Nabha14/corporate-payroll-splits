import { describe, it, expect } from "vitest";
import { payrollAmount, payrollBytes32, hexString } from "../payrollInputs";

describe("payroll input boundaries", () => {
  it("accepts and round trips exactly 32 bytes", () => {
    expect(hexString(payrollBytes32("0x" + "AB".repeat(32), "Secret"))).toBe(
      "ab".repeat(32),
    );
    for (const value of ["", "a".repeat(63), "g".repeat(64)])
      expect(() => payrollBytes32(value, "Secret")).toThrow();
  });
  it("accepts Uint32 accounting units only", () => {
    expect(payrollAmount("4294967295")).toBe(4294967295n);
    for (const value of ["0", "-1", "1.2", "1e3", "4294967296", "", " 2"])
      expect(() => payrollAmount(value)).toThrow();
  });
});
