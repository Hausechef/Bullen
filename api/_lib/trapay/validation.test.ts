import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveGatewayId,
  validateDepositRequest,
  validateTrapayConfiguration,
} from "./validation.js";
import type { CompanyPaymentSettingsRecord } from "./types.js";

function baseSettings(overrides: Partial<CompanyPaymentSettingsRecord> = {}): CompanyPaymentSettingsRecord {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    company_id: "00000000-0000-0000-0000-000000000001",
    provider: "TRAPAY",
    enabled: true,
    environment: "SANDBOX",
    public_key: "pk_test",
    secret_encrypted: null,
    sandbox_base_url: "https://demo.trapay.uk",
    production_base_url: null,
    card_enabled: true,
    bank_transfer_enabled: true,
    card_gateway_id: "gw-card",
    bank_transfer_gateway_id: "gw-bank",
    default_currency: "USD",
    supported_currencies: ["USD", "EUR"],
    minimum_deposit: 50,
    maximum_deposit: 100000,
    webhook_configured: false,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

test("sandbox configuration passes when everything is present", () => {
  const result = validateTrapayConfiguration(baseSettings(), "SANDBOX");
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("missing public key or currencies is reported", () => {
  const noKey = validateTrapayConfiguration(baseSettings({ public_key: null }), "SANDBOX");
  assert.equal(noKey.ok, false);
  assert.ok(noKey.errors.includes("Missing Public Key"));

  const noCurrencies = validateTrapayConfiguration(baseSettings({ supported_currencies: [] }), "SANDBOX");
  assert.equal(noCurrencies.ok, false);
  assert.ok(noCurrencies.errors.includes("No supported currencies configured"));
});

test("enabled methods require their gateway ids", () => {
  const noCard = validateTrapayConfiguration(baseSettings({ card_gateway_id: null }), "SANDBOX");
  assert.ok(noCard.errors.includes("Missing Card Gateway ID"));

  const noBank = validateTrapayConfiguration(
    baseSettings({ bank_transfer_gateway_id: null }),
    "SANDBOX",
  );
  assert.ok(noBank.errors.includes("Missing Bank Transfer Gateway ID"));

  const disabledMethods = validateTrapayConfiguration(
    baseSettings({ card_gateway_id: null, card_enabled: false }),
    "SANDBOX",
  );
  assert.ok(!disabledMethods.errors.includes("Missing Card Gateway ID"));
});

test("production activation is blocked while webhook verification is undocumented", () => {
  const result = validateTrapayConfiguration(baseSettings({ webhook_configured: true }), "PRODUCTION");
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("TRAPAY_DOCUMENTATION_REQUIRED")));
});

test("production requires production base url and webhook flag", () => {
  const result = validateTrapayConfiguration(baseSettings(), "PRODUCTION");
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("Missing or invalid Production Base URL"));
  assert.ok(result.errors.includes("Webhook not configured in the TRAPAY dashboard"));
});

test("deposit request validation enforces bounds, currency and method", () => {
  const settings = baseSettings();
  const ok = validateDepositRequest({ amount: 100, currency: "eur", method: "CARD" }, settings);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.value, { amount: 100, currency: "EUR", method: "CARD" });

  const belowMin = validateDepositRequest({ amount: 10, currency: "USD", method: "CARD" }, settings);
  assert.ok(belowMin.errors?.some((e) => e.includes("below minimum")));

  const aboveMax = validateDepositRequest({ amount: 200000, currency: "USD", method: "CARD" }, settings);
  assert.ok(aboveMax.errors?.some((e) => e.includes("above maximum")));

  const badCurrency = validateDepositRequest({ amount: 100, currency: "RUB", method: "CARD" }, settings);
  assert.ok(badCurrency.errors?.includes("Currency not supported for this company"));

  const disabledCard = validateDepositRequest(
    { amount: 100, currency: "USD", method: "CARD" },
    baseSettings({ card_enabled: false }),
  );
  assert.ok(disabledCard.errors?.includes("Bank Card payments are not available"));

  const disabledBank = validateDepositRequest(
    { amount: 100, currency: "USD", method: "BANK_TRANSFER" },
    baseSettings({ bank_transfer_enabled: false }),
  );
  assert.ok(disabledBank.errors?.includes("Bank Transfer payments are not available"));

  const badMethod = validateDepositRequest({ amount: 100, currency: "USD", method: "CRYPTO" }, settings);
  assert.ok(badMethod.errors?.includes("Invalid payment method"));

  const notANumber = validateDepositRequest({ amount: "abc", currency: "USD", method: "CARD" }, settings);
  assert.ok(notANumber.errors?.includes("Invalid amount"));
});

test("gateway resolution follows the method", () => {
  const settings = baseSettings();
  assert.equal(resolveGatewayId("CARD", settings), "gw-card");
  assert.equal(resolveGatewayId("BANK_TRANSFER", settings), "gw-bank");
  assert.equal(resolveGatewayId("CARD", baseSettings({ card_gateway_id: null })), null);
});
