import assert from "node:assert/strict";
import test from "node:test";
import { summarizeContextTrials } from "../lib/context-ab-results.ts";

test("summarizes balanced trial counts, latency and token metrics", () => {
  const result = summarizeContextTrials([
    { variant: "A", latencyMs: 100, promptTokens: 1000, outputTokens: 50, success: true, jsonValid: true, timedOut: false },
    { variant: "A", latencyMs: 300, promptTokens: 1100, outputTokens: 70, success: true, jsonValid: true, timedOut: false },
    { variant: "B", latencyMs: 120, promptTokens: 900, outputTokens: null, success: false, jsonValid: false, timedOut: true },
  ]);
  assert.equal(result.A.latencyP50Ms, 100);
  assert.equal(result.A.latencyP95Ms, 300);
  assert.equal(result.A.meanPromptTokens, 1050);
  assert.equal(result.B.timeouts, 1);
  assert.equal(result.B.invalidJson, 1);
  assert.equal(result.B.meanOutputTokens, null);
});
test("empty trial set never invents metrics", () => {
  const result = summarizeContextTrials([]);
  assert.equal(result.A.count, 0);
  assert.equal(result.B.latencyP50Ms, null);
  assert.equal(result.A.meanPromptTokens, null);
});
