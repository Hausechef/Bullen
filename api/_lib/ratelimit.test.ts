import { test } from "node:test";
import assert from "node:assert/strict";
import { hit, resetForTests, sweep } from "./ratelimit.js";

test("allows up to the limit then blocks within the window", () => {
  resetForTests();
  const now = 1_000_000;
  for (let i = 0; i < 3; i++) {
    assert.equal(hit("k", 3, 60_000, now).allowed, true);
  }
  const blocked = hit("k", 3, 60_000, now + 1);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});

test("window reset re-opens the limiter", () => {
  resetForTests();
  const now = 2_000_000;
  hit("k", 1, 1_000, now);
  assert.equal(hit("k", 1, 1_000, now + 500).allowed, false);
  assert.equal(hit("k", 1, 1_000, now + 1_001).allowed, true);
});

test("keys are isolated", () => {
  resetForTests();
  assert.equal(hit("a", 1, 60_000, 3_000_000).allowed, true);
  assert.equal(hit("b", 1, 60_000, 3_000_000).allowed, true);
  assert.equal(hit("a", 1, 60_000, 3_000_001).allowed, false);
});

test("sweep removes expired buckets only", () => {
  resetForTests();
  hit("old", 1, 100, 9_000);   // expires at 9_100
  hit("live", 1, 100_000, 10_000); // expires at 110_000
  sweep(10_050);
  assert.equal(hit("live", 1, 100_000, 10_050).allowed, false); // still counting
  assert.equal(hit("old", 1, 100, 10_050).allowed, true);       // fresh bucket
});
