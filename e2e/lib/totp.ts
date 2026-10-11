import { createHmac } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  let bits = "";
  for (const char of input.replace(/=+$/u, "").toUpperCase()) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Invalid base32");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** RFC 6238 code (SHA-1, 6 digits, 30 s), the same as an authenticator app. */
export function totp(secret: string, at = Date.now()): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const digest = createHmac("sha1", base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

/**
 * A code for a window not used yet: the server refuses a code from a window it already
 * accepted, so a second staff sign-in within 30 s waits for the next one.
 */
export async function freshTotp(secret: string, lastWindow: number | undefined): Promise<{ code: string; window: number }> {
  let window = Math.floor(Date.now() / 30_000);
  if (lastWindow !== undefined && window <= lastWindow) {
    await new Promise((r) => setTimeout(r, (lastWindow + 1) * 30_000 - Date.now() + 250));
    window = Math.floor(Date.now() / 30_000);
  }
  return { code: totp(secret), window };
}
