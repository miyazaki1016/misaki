import { createFallbackPersonaPrompt } from "../persona/fallback-persona.ts";
import { runQualityProbe } from "./quality-probe-runner.ts";
import { importRecordedQualityReplies, type RecordedReplyManifest } from "./recorded-reply-import.ts";
import { QUALITY_PROBES } from "./quality-probes.ts";

export const LIVE_SMOKE_MODEL = "gemini-3.1-flash-lite";
export const LIVE_SMOKE_MAX_CALLS = 2;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/" + LIVE_SMOKE_MODEL + ":generateContent";

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
  manifest: RecordedReplyManifest;
}) {
  if (input.approved !== true || !input.apiKey.trim()) {
    throw new Error("LIVE_SMOKE_NOT_AUTHORIZED");
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
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
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
            maxOutputTokens: 300,
          },
        }),
      });
      if (!response.ok) throw new Error("LIVE_SMOKE_HTTP_" + response.status);
      const raw = await response.text();
      if (raw.length > 50_000) throw new Error("LIVE_SMOKE_RESPONSE_TOO_LARGE");
      const payload = JSON.parse(raw);
      const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof content !== "string") throw new Error("LIVE_SMOKE_MISSING_REPLY");
      const parsed = JSON.parse(content);
      if (typeof parsed?.reply !== "string" || !parsed.reply.trim() || parsed.reply.length > 4000) {
        throw new Error("LIVE_SMOKE_INVALID_REPLY");
      }
      replies.push(parsed.reply);
      return parsed.reply;
    } finally {
      clearTimeout(timeout);
    }
  });
  // A failed reply is not a valid comparison or a successful observation.
  if (result.status !== "complete" || replies.length !== LIVE_SMOKE_MAX_CALLS) {
    throw new Error("LIVE_SMOKE_INCOMPLETE_" + physicalCalls);
  }
  return {
    physicalCalls,
    imported: importRecordedQualityReplies({ probe, replies, manifest: input.manifest }),
  };
}
