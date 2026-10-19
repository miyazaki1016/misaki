import test from "node:test";
import assert from "node:assert/strict";
import { runLiveSmokeProbe, LIVE_SMOKE_MODEL, SmokeProbeFailure } from "../lib/conversation-lab/live-smoke-probe.ts";

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
    assert.equal(body.generationConfig.maxOutputTokens, 1024);
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "minimal");
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

test("safe failure category and physical attempt count without upstream data leakage", async () => {
  for (const [status, expected] of [[401,"api_auth"],[429,"api_rate_limit"],[404,"api_model"],[503,"api_server"]] as const) {
    let calls = 0;
    const fetcher = (async () => { calls++; return { ok: false, status }; }) as unknown as typeof fetch;
    await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest }),
      (error: unknown) => {
        assert.ok(error instanceof SmokeProbeFailure);
        assert.equal(error.code, expected);
        assert.equal(error.physicalCalls, 1);
        assert.equal(error.message, "SMOKE_PROBE_FAILED");
        return true;
      });
    assert.equal(calls, 1);
  }
});
test("malformed Gemini JSON classified without raw model output", async () => {
  const fetcher = (async () => ({ ok: true, text: async () => JSON.stringify({
    candidates: [{ content: { parts: [{ text: "bad private content" }] } }],
  }) })) as unknown as typeof fetch;
  await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest }),
    (error: unknown) => {
      assert.ok(error instanceof SmokeProbeFailure);
      assert.equal(error.code, "response_json");
      assert.equal(error.physicalCalls, 1);
      assert.doesNotMatch(error.message, /private/);
      return true;
    });
});


test("thought parts are ignored when a later normal reply part is present", async () => {
  let calls = 0;
  const fetcher = (async () => {
    calls++;
    return { ok: true, text: async () => JSON.stringify({ candidates: [{ content: { parts: [
      { thought: true, text: "hidden reasoning" },
      { text: JSON.stringify({ reply: "通常の返答" + calls }) },
    ] } }] }) };
  }) as unknown as typeof fetch;
  const result = await runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest });
  assert.equal(result.physicalCalls, 2);
  assert.equal(calls, 2);
  assert.deepEqual(result.imported.run.turns.filter(turn => turn.role === "model").map(turn => turn.text), ["通常の返答1", "通常の返答2"]);
});

test("model transport error is classified as network without retry", async () => {
  let calls = 0;
  const fetcher = (async () => { calls++; throw new TypeError("private upstream detail"); }) as unknown as typeof fetch;
  await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest }),
    (error: unknown) => {
      assert.ok(error instanceof SmokeProbeFailure);
      assert.equal(error.code, "network");
      assert.equal(error.physicalCalls, 1);
      assert.doesNotMatch(error.message, /private upstream/);
      return true;
    });
  assert.equal(calls, 1);
});

test("our timer-aborted model fetch is classified as timeout without retry", async () => {
  let calls = 0;
  const fetcher = (async (_url: string, init: RequestInit) => {
    calls++;
    await new Promise<void>((_resolve, reject) => {
      const signal = init.signal;
      if (!signal) throw new Error("missing abort signal");
      signal.addEventListener("abort", () => reject(new Error("private abort detail")), { once: true });
    });
    throw new Error("unreachable");
  }) as unknown as typeof fetch;
  await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest, timeoutMs: 5 }),
    (error: unknown) => {
      assert.ok(error instanceof SmokeProbeFailure);
      assert.equal(error.code, "timeout");
      assert.equal(error.physicalCalls, 1);
      return true;
    });
  assert.equal(calls, 1);
});

test("failed response body read distinguishes network from our timeout", async () => {
  const fetcher = (async () => ({ok:true, text: async () => { throw new Error("private read error"); }})) as unknown as typeof fetch;
  await assert.rejects(runLiveSmokeProbe({ apiKey: "mock-key", approved: true, fetcher, manifest }),
    (error: unknown) => { assert.ok(error instanceof SmokeProbeFailure); assert.equal(error.code, "network"); return true; });
});
