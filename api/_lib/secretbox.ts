import crypto from "node:crypto";

// Server-side secret box for TRAPAY credentials at rest (AES-256-GCM).
// The encryption key comes from the TRAPAY_SECRET_ENC_KEY environment variable
// (32 raw bytes, hex or base64). It lives only in the server runtime — never in
// the database, the browser bundle or logs. Generate with: openssl rand -hex 32.

const BLOB_VERSION = "v1";

export function getEncryptionKeyFromEnv(env: NodeJS.ProcessEnv = process.env): Buffer | null {
  const raw = env["TRAPAY_SECRET_ENC_KEY"];
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, "hex");
  const decoded = Buffer.from(trimmed, "base64");
  if (decoded.length === 32) return decoded;
  return null;
}

export function encryptSecret(plaintext: string, key: Buffer): string {
  if (key.length !== 32) throw new Error("encryption key must be 32 bytes");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [BLOB_VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptSecret(blob: string, key: Buffer): string {
  const parts = blob.split(":");
  if (parts.length !== 4 || parts[0] !== BLOB_VERSION) {
    throw new Error("malformed secret blob");
  }
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
