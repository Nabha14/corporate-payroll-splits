export function payrollBytes32(value: string, label: string): Uint8Array {
  const hex = value.trim().replace(/^0x/i, "");
  if (!/^[0-9a-f]{64}$/i.test(hex))
    throw new Error(`${label} must be exactly 64 hexadecimal characters.`);
  return Uint8Array.from(hex.match(/../g)!, (byte) => parseInt(byte, 16));
}

export function payrollAmount(value: string): bigint {
  if (!/^[1-9][0-9]*$/.test(value) || BigInt(value) > 4294967295n) {
    throw new Error(
      "Enter a whole amount from 1 to 4,294,967,295 accounting units.",
    );
  }
  return BigInt(value);
}

export const hexString = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
