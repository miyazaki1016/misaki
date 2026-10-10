/**
 * Non-billable A/B smoke test using synthetic 8-reply context and fake responses.
 * Run: node --experimental-strip-types scripts/context-ab-smoke.ts
 * No keys, network, personal content, or canonical writes.
 * Character counts are NOT model token counts.
 */
import { runOfflineContextComparison } from "../lib/context-ab-offline-harness.ts";

const replies = [
  "おはよう、今日はいい天気だね。散歩に行きたいな。",
  "昨日話していた映画の続き、気になっていたよ。",
  "そうなんだ、もう少し詳しく聞いてもいい？",
  "今日もお疲れさま。ゆっくり休んでね。",
  "その話、前にもしてくれたよね。覚えてるよ。",
  "わあ、それは楽しそう。どんな感じだった？",
  "無理しすぎないでね。明日も話せたらうれしいな。",
  "おかえり。今日はどんな一日だった？",
];
const history = replies.flatMap((reply, i) => [
  { role: "user" as const, text: `話題${i + 1}について話そう` },
  { role: "model" as const, text: reply },
]);
const snapshot = {
  systemPromptTemplate: [
    "あなたは美咲です。自然な日本語で会話してください。",
    "{{RECENT_REPLY_SECTION}}",
    "返答はJSON形式で返してください。",
  ].join("\n"),
  recentReplies: replies,
  history,
  userText: "さっきの話の続きを聞かせて",
};
const output = await runOfflineContextComparison(
  snapshot,
  async () => ({
    latencyMs: 10,
    promptTokens: null, // Mock has no Gemini token usage.
    outputTokens: null,
    success: true,
    jsonValid: true,
    timedOut: false,
  }),
  20,
);
if (output.summary.A.count !== 20 || output.summary.B.count !== 20) {
  throw new Error("Unexpected A/B sample count");
}
if (output.promptChars.savedChars <= 0) {
  throw new Error("Eight repeated replies should make A longer than B");
}
if (output.summary.A.meanPromptTokens !== null || output.summary.B.meanPromptTokens !== null) {
  throw new Error("Mock run must not fabricate token usage");
}
console.log(JSON.stringify({
  mode: "synthetic-mock-only",
  promptChars: output.promptChars,
  summary: output.summary,
}, null, 2));
