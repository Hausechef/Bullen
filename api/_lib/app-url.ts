// Canonical server-side app URL for provider callback URLs.
//
// TRAPAY callback URLs (success/fail/pending) are NEVER derived from request
// headers (Host / X-Forwarded-Host / Origin) — a spoofable input. They are
// built exclusively from the APP_URL environment variable configured in the
// server runtime. Fail closed: if the configuration is missing or invalid the
// deposit creation aborts instead of guessing a redirect target.

export type AppUrlErrorCode =
  | "APP_URL_MISSING"
  | "APP_URL_INVALID"
  | "APP_URL_INVALID_PROTOCOL"
  | "APP_URL_NOT_HTTPS"
  | "APP_URL_NOT_ORIGIN";

export class AppUrlError extends Error {
  readonly code: AppUrlErrorCode;
  constructor(code: AppUrlErrorCode) {
    super(code);
    this.name = "AppUrlError";
    this.code = code;
  }
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function getCanonicalAppUrl(env: NodeJS.ProcessEnv = process.env): URL {
  const raw = env["APP_URL"];
  if (!raw || raw.trim().length === 0) {
    throw new AppUrlError("APP_URL_MISSING");
  }
  // Canonical form: origin only, no trailing slash, no path/query/credentials.
  const trimmed = raw.trim().replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AppUrlError("APP_URL_INVALID");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new AppUrlError("APP_URL_INVALID_PROTOCOL");
  }
  const productionRuntime =
    env["NODE_ENV"] === "production" || env["VERCEL_ENV"] === "production";
  const isLocalHost = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && productionRuntime && !isLocalHost) {
    throw new AppUrlError("APP_URL_NOT_HTTPS");
  }
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new AppUrlError("APP_URL_NOT_ORIGIN");
  }
  return url;
}

// Deterministic callback targets for a deposit. The deposit id is the only
// variable part; everything else comes from server configuration.
export function buildDepositCallbackUrls(
  depositId: string,
  env: NodeJS.ProcessEnv = process.env,
): { successUrl: string; failUrl: string; pendingUrl: string; origin: string } {
  const origin = getCanonicalAppUrl(env).origin;
  const statusUrl = (page: string) => `${origin}/trade/deposit/${page}?deposit=${encodeURIComponent(depositId)}`;
  return {
    successUrl: statusUrl("success"),
    failUrl: statusUrl("failed"),
    pendingUrl: statusUrl("pending"),
    origin,
  };
}

export function buildWebhookUrl(env: NodeJS.ProcessEnv = process.env): string {
  return `${getCanonicalAppUrl(env).origin}/api/webhooks/trapay`;
}
