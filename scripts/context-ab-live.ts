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
import { makeSyntheticLongContext } from "../lib/context-ab-long-fixture.ts";

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
const shortSnapshot = {
  systemPromptTemplate: [
    "あなたは美咲という会話AIです。自然で短い日本語の返事をしてください。",
    "{{RECENT_REPLY_SECTION}}",
    "必ずJSONオブジェクトで返答してください。形式: {\"reply\": \"...\"}",
  ].join("\n"),
  recentReplies: [
    "おはよう、今日はいい天気だね。散歩に行きたいな。",
    "昨日話していた映画の続き、気になっていたよ。",
    "そうなんだ、もう少し詳しく聞いてもいい？",
    "今日もお疲れさま。ゆっくり休んでね。",
    "その話、前にもしてくれたよね。覚えてるよ。",
    "わあ、それは楽しそう。どんな感じだった？",
    "無理しすぎないでね。明日も話せたらうれしいな。",
    "おかえり。今日はどんな一日だった？",
  ],
  history: [
    { role: "user" as const, text: "今日は天気がいいね" },
    { role: "model" as const, text: "おはよう、今日はいい天気だね。散歩に行きたいな。" },
    { role: "user" as const, text: "昨日の映画はどうだった？" },
    { role: "model" as const, text: "昨日話していた映画の続き、気になっていたよ。" },
    { role: "user" as const, text: "映画の感想を話そう" },
    { role: "model" as const, text: "そうなんだ、もう少し詳しく聞いてもいい？" },
    { role: "user" as const, text: "今日は忙しかった" },
    { role: "model" as const, text: "今日もお疲れさま。ゆっくり休んでね。" },
    { role: "user" as const, text: "前にもこの話をしたね" },
    { role: "model" as const, text: "その話、前にもしてくれたよね。覚えてるよ。" },
    { role: "user" as const, text: "週末の予定が楽しみ" },
    { role: "model" as const, text: "わあ、それは楽しそう。どんな感じだった？" },
    { role: "user" as const, text: "明日も話そう" },
    { role: "model" as const, text: "無理しすぎないでね。明日も話せたらうれしいな。" },
    { role: "user" as const, text: "ただいま" },
    { role: "model" as const, text: "おかえり。今日はどんな一日だった？" },
  ],
  userText: "さっき散歩から帰ってきたよ",
};
const fixture = process.env.MISAKI_AB_FIXTURE ?? "short";
if (!["short", "long"].includes(fixture)) throw new Error("MISAKI_AB_FIXTURE must be short or long.");
const snapshot = fixture === "long" ? makeSyntheticLongContext() : shortSnapshot;
const delayMs = Number(process.env.MISAKI_AB_DELAY_MS ?? "0");
if (!Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 120000) throw new Error("MISAKI_AB_DELAY_MS must be 0..120000.");
const adapter = createIsolatedGeminiAdapter({
  apiKey,
  model,
  allowLiveRequests: true,
  timeoutMs: 30000,
});
let requestCount = 0;
const pacedAdapter: typeof adapter = async (request) => {
  if (requestCount++ > 0 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  return adapter(request);
};
const result = await runOfflineContextComparison(snapshot, pacedAdapter, runs);
console.log(JSON.stringify({
  mode: "synthetic-live-gemini",
  fixture,
  delayMs,
  model,
  runsPerVariant: runs,
  promptChars: result.promptChars,
  summary: result.summary,
}, null, 2));
