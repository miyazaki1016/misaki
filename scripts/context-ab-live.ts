/**
 * Offline synthetic A/B runner for an explicitly authorized, billable Gemini test.
 * Not imported by app routes; does not access Supabase, relationship, or memory.
 *
 * Required env:
 *   MISAKI_AB_LIVE=YES
 *   GEMINI_API_KEY=<secret>
 *   MISAKI_AB_MODEL=gemini-3.1-flash-lite
 *
 * Optional MISAKI_AB_RUNS=1..20 (default 1). Use synthetic data only.
 * Never log or store raw model replies, API keys, or personal conversation.
 */
import { runOfflineContextComparison } from "../lib/context-ab-offline-harness.ts";
import { createIsolatedGeminiAdapter } from "../lib/context-ab-gemini-adapter.ts";

if (process.env.MISAKI_AB_LIVE !== "YES") {
  throw new Error("Live Gemini A/B is disabled; explicit MISAKI_AB_LIVE=YES required.");
}
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is required.");
const model = process.env.MISAKI_AB_MODEL;
if (!model) throw new Error("MISAKI_AB_MODEL must be explicitly provided.");
const runs = Number(process.env.MISAKI_AB_RUNS ?? "1");
if (!Number.isSafeInteger(runs) || runs < 1 || runs > 20) {
  throw new Error("MISAKI_AB_RUNS must be 1..20.");
}
const snapshot = {
  systemPromptTemplate: [
    "あなたは美咲という会話AIです。自然で短い日本語の返事をしてください。",
    "{{RECENT_REPLY_SECTION}}",
    "必ずJSONオブジェクトで返答してください。形式: {\"reply\": \"...\"}",
  ].join("\n"),
  recentReplies: ["おはよう！", "今日もいい一日になるといいね"],
  history: [
    { role: "user" as const, text: "おはよう" },
    { role: "model" as const, text: "おはよう！" },
    { role: "user" as const, text: "今日は散歩しようかな" },
    { role: "model" as const, text: "今日もいい一日になるといいね" },
  ],
  userText: "さっき散歩から帰ってきたよ",
};
const adapter = createIsolatedGeminiAdapter({
  apiKey,
  model,
  allowLiveRequests: true,
  timeoutMs: 30000,
});
const result = await runOfflineContextComparison(snapshot, adapter, runs);
console.log(JSON.stringify({
  mode: "synthetic-live-gemini",
  model,
  runsPerVariant: runs,
  promptChars: result.promptChars,
  summary: result.summary,
}, null, 2));
