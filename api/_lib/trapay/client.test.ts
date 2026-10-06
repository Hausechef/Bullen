import { test } from "node:test";
import assert from "node:assert/strict";
import { createTrapayPayment, parseTrapayResponse } from "./client.js";
import { TrapayClientError } from "./types.js";

const BASE = "https://demo.trapay.uk";

function documentedResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    message: "Payment created successfully",
    result: {
      id: "pay_123",
      orderId: "BH-DEP-abc",
      proxy_url: "https://demo.trapay.uk/pay/pay_123",
      status: "PENDING_CUSTOMER_DETAILS",
      ...overrides,
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("parseTrapayResponse accepts the documented envelope", () => {
  const parsed = parseTrapayResponse(documentedResponse());
  assert.equal(parsed.providerPaymentId, "pay_123");
  assert.equal(parsed.orderId, "BH-DEP-abc");
  assert.equal(parsed.proxyUrl, "https://demo.trapay.uk/pay/pay_123");
  assert.equal(parsed.providerStatus, "PENDING_CUSTOMER_DETAILS");
});

test("parseTrapayResponse rejects malformed payloads without echoing them", () => {
  for (const bad of [null, "nope", {}, { success: false, message: "rejected" }, { success: true, result: null }, { success: true, result: { id: "" } }, { success: true, result: { id: "pay_1", proxy_url: "javascript:alert(1)" } }]) {
    assert.throws(() => parseTrapayResponse(bad), TrapayClientError);
  }
});

test("createTrapayPayment posts the documented payload", async () => {
  let captured: any = null;
  const fetchImpl = async (url: string, init: any) => {
    captured = { url, init };
    return jsonResponse(documentedResponse());
  };
  const result = await createTrapayPayment(
    BASE,
    {
      publicKey: "pk",
      gateway: "gw-card",
      orderId: "BH-DEP-abc",
      amount: 100,
      currency: "EUR",
      successUrl: "https://app/s",
      failUrl: "https://app/f",
      pendingUrl: "https://app/p",
    },
    fetchImpl,
  );
  assert.equal(captured.url, "https://demo.trapay.uk/api/payments/create");
  assert.equal(captured.init.method, "POST");
  const payload = JSON.parse(captured.init.body);
  assert.deepEqual(payload, {
    public_key: "pk",
    gateway: "gw-card",
    order_id: "BH-DEP-abc",
    amount: 100,
    currency: "EUR",
    success_url: "https://app/s",
    fail_url: "https://app/f",
    pending_url: "https://app/p",
  });
  assert.equal(result.providerPaymentId, "pay_123");
});

test("createTrapayPayment maps HTTP and network failures to safe errors", async () => {
  await assert.rejects(
    createTrapayPayment(BASE, {} as any, async () => jsonResponse({ error: "boom" }, 500)),
    (err: unknown) => err instanceof TrapayClientError && err.kind === "http_error" && (err as TrapayClientError).httpStatus === 500,
  );
  await assert.rejects(
    createTrapayPayment(BASE, {} as any, async () => {
      throw new Error("socket down");
    }),
    (err: unknown) => err instanceof TrapayClientError && err.kind === "network_error",
  );
  await assert.rejects(
    createTrapayPayment(BASE, {} as any, async () => new Response("not json", { status: 200 })),
    (err: unknown) => err instanceof TrapayClientError && err.kind === "malformed_response",
  );
  await assert.rejects(
    createTrapayPayment("not-a-url", {} as any, async () => jsonResponse(documentedResponse())),
    (err: unknown) => err instanceof TrapayClientError && err.kind === "network_error",
  );
});

test("createTrapayPayment times out", async () => {
  await assert.rejects(
    createTrapayPayment(
      BASE,
      {} as any,
      ((_url: string, init: any) => new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          const e = new Error("aborted");
          e.name = "AbortError";
          reject(e);
        });
      })) as any,
      10,
    ),
    (err: unknown) => err instanceof TrapayClientError && err.kind === "timeout",
  );
});
