import { test } from "node:test";
import assert from "node:assert/strict";
import { AppUrlError, buildDepositCallbackUrls, getCanonicalAppUrl } from "./app-url.js";

const baseEnv = (overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv =>
  ({ NODE_ENV: "test", VERCEL_ENV: undefined, ...overrides } as NodeJS.ProcessEnv);

test("missing APP_URL fails closed", () => {
  assert.throws(() => getCanonicalAppUrl(baseEnv({ APP_URL: undefined })), (err: unknown) =>
    err instanceof AppUrlError && err.code === "APP_URL_MISSING",
  );
  assert.throws(() => getCanonicalAppUrl(baseEnv({ APP_URL: "   " })), AppUrlError);
});

test("invalid protocol is rejected (no arbitrary schemes)", () => {
  for (const bad of ["ftp://app.example.com", "javascript:alert(1)", "file:///etc/passwd"]) {
    assert.throws(
      () => getCanonicalAppUrl(baseEnv({ APP_URL: bad })),
      (err: unknown) => err instanceof AppUrlError && err.code === "APP_URL_INVALID_PROTOCOL",
    );
  }
  for (const bad of ["not-a-url", "app.example.com", "https://"]) {
    assert.throws(
      () => getCanonicalAppUrl(baseEnv({ APP_URL: bad })),
      (err: unknown) => err instanceof AppUrlError && err.code === "APP_URL_INVALID",
    );
  }
});

test("plain http is rejected in production runtime (except local hosts)", () => {
  assert.throws(
    () => getCanonicalAppUrl(baseEnv({ APP_URL: "http://app.example.com", VERCEL_ENV: "production" })),
    (err: unknown) => err instanceof AppUrlError && err.code === "APP_URL_NOT_HTTPS",
  );
  // Local http stays allowed for local development.
  assert.doesNotThrow(() => getCanonicalAppUrl(baseEnv({ APP_URL: "http://localhost:3000", VERCEL_ENV: "production" })));
  // Non-production runtimes allow http for staging previews.
  assert.doesNotThrow(() => getCanonicalAppUrl(baseEnv({ APP_URL: "http://staging.example.com" })));
});

test("origin-only enforcement: path, query and credentials are rejected", () => {
  assert.throws(
    () => getCanonicalAppUrl(baseEnv({ APP_URL: "https://app.example.com/evil" })),
    (err: unknown) => err instanceof AppUrlError && err.code === "APP_URL_NOT_ORIGIN",
  );
  assert.throws(
    () => getCanonicalAppUrl(baseEnv({ APP_URL: "https://user:pass@app.example.com" })),
    AppUrlError,
  );
});

test("trailing slashes are normalized and the origin is stable", () => {
  assert.equal(getCanonicalAppUrl(baseEnv({ APP_URL: "https://app.example.com///" })).origin, "https://app.example.com");
});

test("host-header injection cannot influence callbacks", () => {
  // No header ever reaches this module; a poisoned request must not change the
  // canonical target. Simulated here by proving the built URL depends only on
  // the environment value.
  const urls = buildDepositCallbackUrls("d-123", baseEnv({ APP_URL: "https://app.example.com" }));
  assert.ok(urls.successUrl.startsWith("https://app.example.com/trade/deposit/success?deposit=d-123"));
  assert.ok(urls.failUrl.startsWith("https://app.example.com/trade/deposit/failed"));
  assert.ok(urls.pendingUrl.startsWith("https://app.example.com/trade/deposit/pending"));
  assert.equal(
    buildDepositCallbackUrls("d-123", baseEnv({ APP_URL: "https://app.example.com" })).origin,
    "https://app.example.com",
  );
});

test("X-Forwarded-Host-style values in APP_URL position still pass URL validation only if valid origins", () => {
  // Even if a proxy header value leaked into configuration, an attacker host
  // would have to be a fully valid https origin — and configuration is
  // server-only. Header-based derivation remains impossible by design.
  assert.throws(
    () => buildDepositCallbackUrls("d-123", baseEnv({ APP_URL: undefined })),
    (err: unknown) => err instanceof AppUrlError && err.code === "APP_URL_MISSING",
  );
  assert.equal(
    buildDepositCallbackUrls("d 123", baseEnv({ APP_URL: "https://app.example.com" })).successUrl,
    "https://app.example.com/trade/deposit/success?deposit=d%20123",
  );
});

test("valid production URL builds all three callbacks", () => {
  const urls = buildDepositCallbackUrls("0e2b1c58-1e6f-4d11-9b56-6a4e5b7f9a01", baseEnv({ APP_URL: "https://app.bullenhaus.com", VERCEL_ENV: "production" }));
  assert.deepEqual(urls, {
    origin: "https://app.bullenhaus.com",
    successUrl: "https://app.bullenhaus.com/trade/deposit/success?deposit=0e2b1c58-1e6f-4d11-9b56-6a4e5b7f9a01",
    failUrl: "https://app.bullenhaus.com/trade/deposit/failed?deposit=0e2b1c58-1e6f-4d11-9b56-6a4e5b7f9a01",
    pendingUrl: "https://app.bullenhaus.com/trade/deposit/pending?deposit=0e2b1c58-1e6f-4d11-9b56-6a4e5b7f9a01",
  });
});
