import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeResult, parseJsonObject } from "./analyze-external.js";

// These helpers sanitize UNTRUSTED LLM output before it feeds a KYC review
// decision. Their fail-safe behavior is security-relevant: a regression that
// let an unrecognized decision fall through as "approve", or let confidence
// exceed its bounds, would be dangerous. These tests lock that behavior in.

test("normalizeResult: unknown/missing decision fails safe to 'escalate'", () => {
  assert.equal(normalizeResult({}, []).decision, "escalate");
  assert.equal(normalizeResult({ decision: "approve_now" }, []).decision, "escalate");
  assert.equal(normalizeResult(null, []).decision, "escalate");
  assert.equal(normalizeResult("garbage", []).decision, "escalate");
});

test("normalizeResult: valid decisions pass through", () => {
  assert.equal(normalizeResult({ decision: "approve" }, []).decision, "approve");
  assert.equal(normalizeResult({ decision: "reject" }, []).decision, "reject");
  assert.equal(normalizeResult({ decision: "escalate" }, []).decision, "escalate");
});

test("normalizeResult: risk_tier defaults to 'medium' when invalid", () => {
  assert.equal(normalizeResult({}, []).risk_tier, "medium");
  assert.equal(normalizeResult({ risk_tier: "critical" }, []).risk_tier, "medium");
  assert.equal(normalizeResult({ risk_tier: "high" }, []).risk_tier, "high");
});

test("normalizeResult: confidence is clamped to 0..100", () => {
  assert.equal(normalizeResult({ confidence: 5000 }, []).confidence, 100);
  assert.equal(normalizeResult({ confidence: -20 }, []).confidence, 0);
  assert.equal(normalizeResult({ confidence: 73 }, []).confidence, 73);
  assert.equal(normalizeResult({ confidence: "not a number" }, []).confidence, 0);
});

test("normalizeResult: string/array fields are truncated, not unbounded", () => {
  const bigSummary = "x".repeat(5000);
  const manyReasons = Array.from({ length: 50 }, (_, i) => `reason ${i}`);
  const out = normalizeResult({ summary: bigSummary, reasoning: manyReasons }, []);
  assert.equal(out.summary.length, 1000);
  assert.equal(out.reasoning.length, 8);
});

test("normalizeResult: falls back to per-doc placeholders when no analyses returned", () => {
  const out = normalizeResult({}, [{ docType: "passport", fileData: "data:...", fileName: "p.png" }]);
  assert.equal(out.document_analyses.length, 1);
  assert.equal(out.document_analyses[0].docType, "passport");
  assert.equal(out.document_analyses[0].status, "unclear");
});

test("parseJsonObject: parses clean JSON", () => {
  assert.deepEqual(parseJsonObject('{"decision":"reject"}'), { decision: "reject" });
});

test("parseJsonObject: extracts a JSON object embedded in noisy text", () => {
  const noisy = 'Here is my analysis:\n```json\n{"decision":"approve","confidence":90}\n```\nDone.';
  assert.deepEqual(parseJsonObject(noisy), { decision: "approve", confidence: 90 });
});

test("parseJsonObject: returns null when there is no JSON object", () => {
  assert.equal(parseJsonObject("no json here at all"), null);
});
