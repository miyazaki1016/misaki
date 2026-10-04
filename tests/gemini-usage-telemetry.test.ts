import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateGeminiJson, GEMINI_CHAT_MODEL } from "../lib/gemini-json-generator.ts";
import { normalizeGeminiUsage, telemetryRow, type GeminiAttempt, type GeminiTelemetrySink } from "../lib/gemini-usage-telemetry.ts";
import { analyzeRelationshipEvidence, validateCriticalEvent } from "../lib/relationship-analyzer-v1.ts";

const request = { apiKey: "SECRET", systemInstruction: "PRIVATE PROMPT", contents: [], userText: "PRIVATE MESSAGE",
  transientRetryDelaysMs: [0, 0, 0, 0], timeoutRetryDelaysMs: [0] };
const usage = { promptTokenCount: 21, candidatesTokenCount: 7, thoughtsTokenCount: 3, totalTokenCount: 31, cachedContentTokenCount: 4 };
const unknown = { prompt_tokens: null, candidate_tokens: null, thoughts_tokens: null, total_tokens: null, cached_tokens: null };
const response = (status = 200, metadata: unknown = usage, text = "PRIVATE RESPONSE") =>
  Response.json({ usageMetadata: metadata, candidates: [{ content: { parts: [{ text }] } }] }, { status });

test("provider counts are normalized verbatim; absent/invalid fields are unknown, explicit zero remains zero", () => {
  assert.deepEqual(normalizeGeminiUsage(usage), { prompt_tokens: 21, candidate_tokens: 7, thoughts_tokens: 3, total_tokens: 31, cached_tokens: 4 });
  for (const value of [null, undefined, {}, "bad"]) assert.deepEqual(normalizeGeminiUsage(value), unknown);
  assert.deepEqual(normalizeGeminiUsage({ promptTokenCount: 0, candidatesTokenCount: "7", thoughtsTokenCount: -1,
    totalTokenCount: Infinity, cachedContentTokenCount: 1.5 }), { ...unknown, prompt_tokens: 0 });
  // total is a provider fact, never reconstructed from other counts.
  assert.equal(normalizeGeminiUsage({ promptTokenCount: 10, candidatesTokenCount: 5 }).total_tokens, null);
});

test("every transient/timeout/network physical attempt is separate, with provider usage on error responses", async () => {
  const original = globalThis.fetch;
  const rows: GeminiAttempt[] = [];
  const pending: Promise<void>[] = [];
  const sink: GeminiTelemetrySink = (attempt, deferred) => {
    rows.push(attempt);
    if (deferred) pending.push(deferred.then(value => { Object.assign(attempt, value); }));
  };
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) throw new DOMException("SECRET", "AbortError");
    return response([429, 502, 503, 504, 200][calls - 2], calls === 3 ? null : usage);
  };
  try {
    const result = await generateGeminiJson({ ...request, telemetrySink: sink });
    await Promise.all(pending);
    assert.equal(result.text, "PRIVATE RESPONSE");
    assert.deepEqual(rows.map(r => r.attempt_no), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(rows.map(r => r.http_status), [null, 429, 502, 503, 504, 200]);
    assert.deepEqual(rows.map(r => r.success), [false, false, false, false, false, true]);
    assert.deepEqual(rows.map(r => r.prompt_tokens), [null, 21, null, 21, 21, 21]);
    for (const r of rows) { assert.equal(r.model, GEMINI_CHAT_MODEL); assert.ok(r.latency_ms! >= 0); assert.ok(Number.isFinite(Date.parse(r.occurred_at))); }
    globalThis.fetch = async () => { throw new Error("NETWORK SECRET"); };
    await assert.rejects(generateGeminiJson({ ...request, telemetrySink: sink }), /NETWORK SECRET/);
    assert.equal(rows.at(-1)!.http_status, null);
    assert.equal(rows.at(-1)!.total_tokens, null);
  } finally { globalThis.fetch = original; }
});

test("throwing/rejecting/hung telemetry cannot change result, request body, retries or error logs", async () => {
  const original = globalThis.fetch;
  const log = console.error;
  const logs: unknown[][] = [];
  const bodies: string[] = [];
  console.error = (...args) => { logs.push(args); };
  globalThis.fetch = async (_url, init) => { bodies.push(String(init!.body)); return response(); };
  try {
    const baseline = await generateGeminiJson(request);
    for (const sink of [() => { throw Error("PRIVATE PROMPT SECRET"); }, async () => { throw Error("PRIVATE RESPONSE SECRET"); }, () => new Promise<void>(() => {})]) {
      assert.deepEqual(await generateGeminiJson({ ...request, telemetrySink: sink }), baseline);
    }
    assert.ok(bodies.every(body => body === bodies[0]));
    assert.ok(logs.length >= 2);
    assert.ok(logs.every(args => JSON.stringify(args) === '["GEMINI TELEMETRY WRITE FAILED"]'));
  } finally { globalThis.fetch = original; console.error = log; }
});

test("malformed/hung retry bodies do not prevent retry; final JSON errors preserve throw and observable unknown usage", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  const pending: Promise<unknown>[] = [];
  const rows: GeminiAttempt[] = [];
  globalThis.fetch = async () => ++calls === 1 ? new Response(new ReadableStream({ start() {} }), { status: 503 }) : response();
  try {
    await generateGeminiJson({ ...request, telemetrySink: (r, usage) => { rows.push(r); if (usage) pending.push(usage); } });
    assert.equal(calls, 2); // The first body's stream never finishes, but retry already completed.
    assert.equal(rows[0].total_tokens, null);
    await Promise.all(pending);
    globalThis.fetch = async () => new Response("not-json", { status: 200 });
    await assert.rejects(generateGeminiJson({ ...request, telemetrySink: r => { rows.push(r); } }), SyntaxError);
    assert.equal(rows.at(-1)!.http_status, 200);
    assert.equal(rows.at(-1)!.total_tokens, null);
  } finally { globalThis.fetch = original; }
});

test("storage allowlist drops all prompt, response, memory, evidence, secret and pricing fields", () => {
  const attempt = { ...normalizeGeminiUsage(usage), model: GEMINI_CHAT_MODEL, attempt_no: 1, http_status: 200, success: true, latency_ms: 5,
    occurred_at: "2026-10-04T00:00:00Z", ...request, rawResponse: "PRIVATE RESPONSE", memory: "MEMORY", evidence: "EVIDENCE", supportingTurn: "TURN", usd: 12 };
  const row = telemetryRow(attempt, { callKind: "normal_reply", userId: "trusted-user", requestId: "opaque-request" });
  assert.deepEqual(Object.keys(row).sort(), ["user_id", "request_id", "call_kind", "model", "attempt_no", "prompt_tokens", "candidate_tokens", "thoughts_tokens", "total_tokens", "cached_tokens", "http_status", "success", "latency_ms", "occurred_at"].sort());
  assert.doesNotMatch(JSON.stringify(row), /PRIVATE|SECRET|MEMORY|EVIDENCE|TURN|usd/);
  assert.equal(telemetryRow(attempt, { callKind: "critical_validator" }).user_id, null);
});

test("Analyzer and critical validator results remain identical with failing telemetry", async () => {
  const original = globalThis.fetch;
  const log = console.error;
  console.error = () => {};
  const turn = { requestId: "opaque", message: "体調は大丈夫？", reply: "ありがとう", savedAt: "2026-10-04T00:00:00Z" };
  const evidence = { type: "care", axis: "affection", polarity: "1", strength: 70, confidence: .95, interpretation: "direct", subject: "user_to_misaki", supportingTurn: "体調は大丈夫" };
  const failure = () => { throw Error("storage unavailable"); };
  try {
    globalThis.fetch = async () => response(200, usage, JSON.stringify({ evidence: [evidence] }));
    const baseline = await analyzeRelationshipEvidence(turn);
    assert.ok(baseline.length > 0);
    assert.deepEqual(await analyzeRelationshipEvidence(turn, failure), baseline);
    globalThis.fetch = async () => response(200, usage, JSON.stringify({ confirmed: true, supportingTurn: turn.message }));
    assert.equal(await validateCriticalEvent(turn, "boundary_event", [], failure), await validateCriticalEvent(turn, "boundary_event", []));
  } finally { globalThis.fetch = original; console.error = log; }
});

test("runtime call classifications and verified server identity cover all three paths without future runtimes", () => {
  const chat = readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
  const runtime = readFileSync(new URL("../lib/relationship-runtime-v1.ts", import.meta.url), "utf8");
  assert.match(chat, /createGeminiTelemetrySink\("normal_reply", userData.user.id, usageRequestId\)/);
  for (const kind of ["relationship_analyzer", "critical_validator"]) assert.match(runtime, new RegExp(`createGeminiTelemetrySink\\("${kind}"`));
  assert.doesNotMatch(chat + runtime, /createGeminiTelemetrySink\("(proactive_reply|body_clock|image_generation)"/);
});
