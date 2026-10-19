import test from "node:test";
import assert from "node:assert/strict";
import { runLiveSmokeProbe, LIVE_SMOKE_MODEL } from "../lib/conversation-lab/live-smoke-probe.ts";

const manifest = {
  captureId: "mock-q02",
  modelName: LIVE_SMOKE_MODEL,
  modelVersion: "mock",
  promptRevision: "mock",
  personaRevision: "mock",
  relationshipFixtureId: "unknown",
  memoryFixtureId: "none",
  timeFixture: "2026-10-19T00:00:00.000Z",
  externalContextFixtureId: "none",
  userConsentOrSyntheticFixture: "synthetic-fixture" as const,
};

test("mocked Q02 returns two ordered replies and only two physical attempts", async () => {
  let calls = 0;
  const fetcher = (async (_url: string, init: RequestInit) => {
    calls++;
    assert.equal(init.method, "POST");
    const body = JSON.parse(String(init.body));
    assert.equal(body.contents.at(-1).role, "user");
    assert.equal(body.contents.length, calls === 1 ? 1 : 3);
    return { ok: true, text: async () => JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: "テスト返答" + calls }) }] } }],
    }) };
  }) as unknown as typeof fetch;
  const result = await runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest });
  assert.equal(result.physicalCalls, 2);
  assert.equal(calls, 2);
  assert.deepEqual(result.imported.run.turns.filter(x => x.role === "model").map(x => x.text),
    ["テスト返答1", "テスト返答2"]);
});

test("HTTP failure fails without retry or later turn", async () => {
  let calls = 0;
  const fetcher = (async () => { calls++; return { ok: false, status: 429 }; }) as unknown as typeof fetch;
  await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest }));
  assert.equal(calls, 1);
});

test("empty or unparsable structured response fails closed after first attempt", async () => {
  for (const payload of [
    { candidates: [{ content: { parts: [] } }] },
    { candidates: [{ content: { parts: [{ text: "invalid json" }] } }] },
    { candidates: [{ content: { parts: [{ text: '{"reply":""}' }] } }] },
  ]) {
    let calls = 0;
    const fetcher = (async () => {
      calls++;
      return { ok: true, text: async () => JSON.stringify(payload) };
    }) as unknown as typeof fetch;
    await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest }));
    assert.equal(calls, 1);
  }
});

test("no opt-in means no network request", async () => {
  let called = false;
  const fetcher = (async () => { called = true; throw new Error("should not be called"); }) as unknown as typeof fetch;
  await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: false, fetcher, manifest }));
  assert.equal(called, false);
});
