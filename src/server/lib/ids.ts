import crypto from "node:crypto";

// Unambiguous alphabet (no 0/O/1/I) for human-readable activity codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateActivityCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return `ACT-${s}`;
}

/**
 * URL-safe, high-entropy QR token. Contains no personal data, IDs, or secrets
 * (spec NFR-08).
 */
export function generateQrToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/** Short, non-reversible fingerprint of a QR token for safe logging (§35). */
export function qrTokenFingerprint(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 12);
}
