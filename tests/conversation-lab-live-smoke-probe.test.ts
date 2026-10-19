import assert from "node:assert/strict";
import test from "node:test";
import { runLiveSmokeProbe, LIVE_SMOKE_MAX_CALLS, SmokeProbeFailure } from "../lib/conversation-lab/live-smoke-probe.ts";
import type { RecordedReplyManifest } from "../lib/conversation-lab/recorded-reply-import.ts";

const manifest: RecordedReplyManifest = {
  captureId: "smoke-fixture", modelName: "gemini-3.1-flash-lite",
  modelVersion: "api-name-unverified", promptRevision: "fallback-smoke-v1",
  personaRevision: "fallback-current", relationshipFixtureId: "unknown",
  memoryFixtureId: "none", timeFixture: "2026-10-19T08:00:00+09:00",
  externalContextFixtureId: "none", userConsentOrSyntheticFixture: "synthetic-fixture",
};
const mock: typeof fetch = async () => new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: "約束については覚えていないんだ。もう一度教えてくれる？" }) }] } }],
}), { status: 200 });

test("does not call network without explicit opt-in and key", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return mock("", {}); };
  await assert.rejects(runLiveSmokeProbe({ apiKey: "test", approved: false, fetcher, manifest }), /NOT_AUTHORIZED/);
  await assert.rejects(runLiveSmokeProbe({ apiKey: "", approved: true, fetcher, manifest }), /NOT_AUTHORIZED/);
  assert.equal(calls, 0);
});

test("two-turn history and strict physical request budget", async () => {
  const bodies: any[] = [];
  const fetcher: typeof fetch = async (_url, options) => {
    assert.equal(options?.method, "POST");
    assert.equal((options?.headers as Record<string, string>)["x-goog-api-key"], "test-secret");
    bodies.push(JSON.parse(String(options?.body)));
    return mock("", {});
  };
  const observed = await runLiveSmokeProbe({ apiKey: "test-secret", approved: true, fetcher, manifest });
  assert.equal(observed.physicalCalls, LIVE_SMOKE_MAX_CALLS);
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].contents.length, 1);
  assert.equal(bodies[1].contents.length, 3);
  assert.equal(bodies[0].generationConfig.maxOutputTokens, 1024);
  assert.equal(bodies[0].generationConfig.thinkingConfig.thinkingLevel, "minimal");
  assert.equal(observed.imported.run.completedPairs, 2);
  assert.equal(observed.imported.verification, "caller-attested-unverified");
});

test("non-200 response fails closed without retry", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return new Response("rate limited", { status: 429 }); };
  await assert.rejects(runLiveSmokeProbe({ apiKey: "test", approved: true, fetcher, manifest }),
    (error: unknown) => error instanceof SmokeProbeFailure && error.code === "api_rate_limit" && error.physicalCalls === 1);
  assert.equal(calls, 1);
});

test("synthetic-only consent boundary enforced before network access", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return mock("", {}); };
  await assert.rejects(runLiveSmokeProbe({
    apiKey: "test", approved: true, fetcher,
    manifest: { ...manifest, userConsentOrSyntheticFixture: "consented-redacted" },
  }), /SYNTHETIC_ONLY/);
  assert.equal(calls, 0);
});

test("malformed model reply fails without another physical attempt", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 });
  };
  await assert.rejects(runLiveSmokeProbe({ apiKey: "test", approved: true, fetcher, manifest }),
    (error: unknown) => error instanceof SmokeProbeFailure && error.code === "response_json" && error.physicalCalls === 1);
  assert.equal(calls, 1);
});

test("invalid manifest never spends a physical API request", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return mock("", {}); };
  const base = { apiKey: "test", approved: true, fetcher };
  await assert.rejects(runLiveSmokeProbe({
    ...base, manifest: { ...manifest, timeFixture: "invalid" },
  }), /TIME_INVALID/);
  await assert.rejects(runLiveSmokeProbe({
    ...base, manifest: { ...manifest, captureId: "" },
  }), /MANIFEST_INVALID/);
  await assert.rejects(runLiveSmokeProbe({
    ...base, manifest: { ...manifest, modelName: "different-model" },
  }), /MODEL_MISMATCH/);
  await assert.rejects(runLiveSmokeProbe({
    ...base, manifest: { ...manifest, memoryFixtureId: "actual-user-memory" },
  }), /FIXTURE_MISMATCH/);
  assert.equal(calls, 0);
});
