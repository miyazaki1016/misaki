import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const stub = `
globalThis.fetch = async (_url, init) => {
  const { generationConfig } = JSON.parse(init.body);
  if (generationConfig.thinkingConfig.thinkingBudget !== 0 || generationConfig.maxOutputTokens !== 256) {
    process.exit(98);
  }
  console.error("stub-call");
  const usage = { promptTokenCount: 100, candidatesTokenCount: 10, thoughtsTokenCount: 2 };
  if (process.env.PROBE === "budget") usage.promptTokenCount = 150000;
  if (process.env.PROBE === "invalid") usage.candidatesTokenCount = -1;
  if (process.env.PROBE === "timeout") throw Error("synthetic timeout");
  return Response.json({usageMetadata: usage, candidates: []});
};`;
const preload = "data:text/javascript," + encodeURIComponent(stub);

for (const [model, probe, calls, stopReason] of [
  ["unknown", "unknown", 0, "unknown"],
  ["gemini-2.5-flash", "ok", 14, null],
  ["gemini-2.5-flash-lite", "ok", 14, null],
  ["gemini-2.5-flash", "budget", 1, "budget"],
  ["gemini-2.5-flash", "invalid", 1, "usage-unknown"],
  ["gemini-2.5-flash", "timeout", 1, "usage-unknown"],
] as const) {
  test(`offline budget guard: ${model} / ${probe}`, () => {
    const run = spawnSync(process.execPath, ["--experimental-strip-types", "--import", preload,
      "scripts/context-ab-quality-live.ts"], {
      encoding: "utf8",
      env: { MISAKI_AB_LIVE: "YES", GEMINI_API_KEY: "synthetic", MISAKI_AB_DELAY_MS: "0",
        MISAKI_AB_MODEL: model, PROBE: probe },
    });
    assert.equal(run.status, stopReason ? 1 : 0, run.stderr);
    assert.equal(run.stderr.split("stub-call").length - 1, calls);
    if (probe === "unknown") {
      assert.match(run.stderr, /No verified standard text price/);
      return;
    }
    const summary = JSON.parse(run.stdout);
    assert.equal(summary.stopReason, stopReason);
    if (probe === "ok") {
      const expected = 14 * (model.endsWith("lite") ? 14.8 : 60) / 1_000_000;
      assert.ok(Math.abs(summary.estimatedUsd - expected) < 1e-10);
    }
  });
}
