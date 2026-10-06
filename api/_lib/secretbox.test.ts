import { test } from "node:test";
import assert from "node:assert/strict";
import { decryptSecret, encryptSecret, getEncryptionKeyFromEnv } from "./secretbox.js";

const KEY = Buffer.alloc(32, 7);

test("env key parsing accepts hex and base64 of 32 bytes only", () => {
  const hex = Buffer.alloc(32, 1).toString("hex");
  assert.deepEqual(getEncryptionKeyFromEnv({ TRAPAY_SECRET_ENC_KEY: hex } as any), Buffer.alloc(32, 1));
  const b64 = Buffer.alloc(32, 2).toString("base64");
  assert.deepEqual(getEncryptionKeyFromEnv({ TRAPAY_SECRET_ENC_KEY: b64 } as any), Buffer.alloc(32, 2));
  assert.equal(getEncryptionKeyFromEnv({} as any), null);
  assert.equal(getEncryptionKeyFromEnv({ TRAPAY_SECRET_ENC_KEY: "too-short" } as any), null);
});

test("roundtrip preserves the secret", () => {
  const secret = "sk_live_aBcD1234567890";
  const blob = encryptSecret(secret, KEY);
  assert.notEqual(blob, secret);
  assert.ok(blob.startsWith("v1:"));
  assert.equal(decryptSecret(blob, KEY), secret);
});

test("each encryption produces a fresh IV", () => {
  assert.notEqual(encryptSecret("same", KEY), encryptSecret("same", KEY));
});

test("tampered blob or wrong key fails closed", () => {
  const blob = encryptSecret("secret", KEY);
  const tampered = `${blob.slice(0, -4)}AAAA`; // corrupt the ciphertext tail
  assert.notEqual(tampered, blob);
  assert.throws(() => decryptSecret(tampered, KEY));
  assert.throws(() => decryptSecret(blob, Buffer.alloc(32, 9)));
  assert.throws(() => decryptSecret("garbage", KEY));
});
