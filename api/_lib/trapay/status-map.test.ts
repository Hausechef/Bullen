import { test } from "node:test";
import assert from "node:assert/strict";
import { mapTrapayStatus } from "./status-map.js";

test("maps the documented creation status to PENDING", () => {
  assert.equal(mapTrapayStatus("PENDING_CUSTOMER_DETAILS"), "PENDING");
  assert.equal(mapTrapayStatus("pending_customer_details"), "PENDING");
});

test("returns UNKNOWN_PROVIDER_STATUS for undocumented values", () => {
  // Deliberately NOT guessed: until TRAPAY documents its status vocabulary,
  // every unknown value must be non-crediting.
  assert.equal(mapTrapayStatus("COMPLETED"), "UNKNOWN_PROVIDER_STATUS");
  assert.equal(mapTrapayStatus("PAID"), "UNKNOWN_PROVIDER_STATUS");
  assert.equal(mapTrapayStatus("success"), "UNKNOWN_PROVIDER_STATUS");
});

test("handles missing or malformed status", () => {
  assert.equal(mapTrapayStatus(null), "UNKNOWN_PROVIDER_STATUS");
  assert.equal(mapTrapayStatus(undefined), "UNKNOWN_PROVIDER_STATUS");
  assert.equal(mapTrapayStatus(""), "UNKNOWN_PROVIDER_STATUS");
  assert.equal(mapTrapayStatus(42 as unknown as string), "UNKNOWN_PROVIDER_STATUS");
});
