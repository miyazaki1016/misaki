import { createFallbackPersonaPrompt } from "../persona/fallback-persona.ts";
import { runQualityProbe } from "./quality-probe-runner.ts";
import { importRecordedQualityReplies, validateRecordedReplyManifest, type RecordedReplyManifest } from "./recorded-reply-import.ts";
import { QUALITY_PROBES } from "./quality-probes.ts";

export const LIVE_SMOKE_MODEL = "gemini-3.1-flash-lite";
export const LIVE_SMOKE_MAX_CALLS = 2;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/" + LIVE_SMOKE_MODEL + ":generateContent";

export type SmokeFailureCode = "api_auth" | "api_rate_limit" | "api_model" | "api_server" | "api_other" | "timeout_or_network" | "timeout" | "network" | "response_shape" | "response_json" | "response_size" | "unknown";
export class SmokeProbeFailure extends Error {
  readonly code: SmokeFailureCode;
  readonly physicalCalls: number;
  constructor(code: SmokeFailureCode, physicalCalls: number) {
    super("SMOKE_PROBE_FAILED");
    this.name = "SmokeProbeFailure";
    this.code = code;
    this.physicalCalls = physicalCalls;
  }
}
function classifyHttp(status: number): SmokeFailureCode {
  if (status === 401 || status === 403) return "api_auth";
  if (status === 429) return "api_rate_limit";
  if (status === 400 || status === 404) return "api_model";
  if (status >= 500) return "api_server";
  return "api_other";
}

/**
 * Explicitly opted-in, isolated smoke experiment with a hard bound of two
 * physical requests, no retries, no DB, no prod chat endpoint, no logging.
 * This is fallback-persona research, NOT production-prompt parity.
 * Caller must independently enforce cost ceiling and protect the API key.
 */
export async function runLiveSmokeProbe(input: {
  apiKey: string;
  approved: boolean;
  fetcher?: typeof fetch;
  /** For deterministic offline timeout tests; production never exceeds 15 seconds. */
  timeoutMs?: number;
  manifest: RecordedReplyManifest;
}) {
  if (input.approved !== true || !input.apiKey.trim()) {
    throw new Error("LIVE_SMOKE_NOT_AUTHORIZED");
  }
  validateRecordedReplyManifest(input.manifest);
  if (input.manifest.modelName !== LIVE_SMOKE_MODEL) {
    throw new Error("LIVE_SMOKE_MODEL_MISMATCH");
  }
  if (input.manifest.memoryFixtureId !== "none" ||
      input.manifest.relationshipFixtureId !== "unknown" ||
      input.manifest.externalContextFixtureId !== "none") {
    throw new Error("LIVE_SMOKE_FIXTURE_MISMATCH");
  }
  if (input.manifest.userConsentOrSyntheticFixture !== "synthetic-fixture") {
    throw new Error("LIVE_SMOKE_SYNTHETIC_ONLY");
  }
  const probe = QUALITY_PROBES.find(p => p.id === "Q02");
  if (!probe || probe.turns.length !== LIVE_SMOKE_MAX_CALLS) {
    throw new Error("LIVE_SMOKE_FIXTURE_INVALID");
  }
  const fetcher = input.fetcher ?? fetch;
  let physicalCalls = 0;
  const replies: string[] = [];
  let failure: SmokeFailureCode = "unknown";
  const result = await runQualityProbe(probe, async ({ message, history }) => {
    if (physicalCalls >= LIVE_SMOKE_MAX_CALLS) throw new Error("LIVE_SMOKE_BUDGET_EXCEEDED");
    physicalCalls += 1; // count before network attempt, including failures
    const systemInstruction = [
      createFallbackPersonaPrompt("chat"),
      "【オフライン固定条件の研究用会話】",
      "過去の会話履歴・長期記憶は提供されていません。覚えていない約束を捏造しないでください。",
      "この検証は本番の関係性・記憶にアクセスせず、ユーザー情報は架空の試験入力です。",
      "JSONのみ返してください。形式: {\"reply\":\"美咲の返事\"}",
    ].join("\n\n");
    const controller = new AbortController();
    const duration = Number.isFinite(input.timeoutMs) ? Math.min(15_000, Math.max(1, input.timeoutMs!)) : 15_000;
    const timeout = setTimeout(() => controller.abort(), duration);
    let response: Response;
    try {
      try {
        response = await fetcher(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": input.apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [...history, { role: "user", parts: [{ text: message }] }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
        });
      } catch {
        // Only report timeout when OUR 15-second AbortController fired.
        // Other transport errors (including external cancellation) are not proof of a timeout.
        failure = controller.signal.aborted ? "timeout" : "network";
        throw new Error("MODEL_TRANSPORT_FAILED");
      }
      if (!response.ok) { failure = classifyHttp(response.status); throw new Error("MODEL_HTTP_FAILED"); }
      let raw: string;
      try { raw = await response.text(); }
      catch { failure = controller.signal.aborted ? "timeout" : "network"; throw new Error("MODEL_READ_FAILED"); }
      if (raw.length > 50_000) { failure = "response_size"; throw new Error("MODEL_TOO_LARGE"); }
      let payload: any;
      try { payload = JSON.parse(raw); }
      catch { failure = "response_json"; throw new Error("MODEL_OUTER_JSON_INVALID"); }
      const content = payload?.candidates?.[0]?.content?.parts?.find((part: any) => part?.thought !== true && typeof part?.text === "string")?.text;
      if (typeof content !== "string") { failure = "response_shape"; throw new Error("MODEL_REPLY_MISSING"); }
      let parsed: any;
      try { parsed = JSON.parse(content); }
      catch { failure = "response_json"; throw new Error("MODEL_INNER_JSON_INVALID"); }
      if (typeof parsed?.reply !== "string" || !parsed.reply.trim() || parsed.reply.length > 4000) {
        failure = "response_shape";
        throw new Error("MODEL_REPLY_INVALID");
      }
      replies.push(parsed.reply);
      return parsed.reply;
    } finally {
      clearTimeout(timeout);
    }
  });
  // A failed reply is not a valid comparison or a successful observation.
  if (result.status !== "complete" || replies.length !== LIVE_SMOKE_MAX_CALLS) {
    throw new SmokeProbeFailure(failure, physicalCalls);
  }
  return {
    physicalCalls,
    imported: importRecordedQualityReplies({ probe, replies, manifest: input.manifest }),
  };
}
