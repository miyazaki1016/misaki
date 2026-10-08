/**
 * Safe smoke run for the A/B pipeline. Synthetic data + fake model only.
 * Run: node --experimental-strip-types scripts/context-ab-smoke.ts
 * No API keys, network requests, user data, or canonical writes.
 */
import { runOfflineContextComparison } from "../lib/context-ab-offline-harness.ts";

const snapshot = {
  systemPromptTemplate: [
    "あなたは美咲です。",
    "{{RECENT_REPLY_SECTION}}",
    "返答はJSON形式で返してください。",
  ].join("\n"),
  recentReplies: ["今日はどうだった？", "そうなんだね"],
  history: [
    { role: "user" as const, text: "おはよう" },
    { role: "model" as const, text: "おはよう！" },
    { role: "user" as const, text: "今日はどう？" },
    { role: "model" as const, text: "今日はどうだった？" },
  ],
  userText: "今日は散歩したよ",
};

const output = await runOfflineContextComparison(
  snapshot,
  async ({ systemInstruction }) => ({
    latencyMs: 10,
    promptTokens: systemInstruction.length,
    outputTokens: 12,
    success: true,
    jsonValid: true,
    timedOut: false,
  }),
  20,
);

if (output.summary.A.count !== 20 || output.summary.B.count !== 20) {
  throw new Error("Unexpected A/B sample count");
}
console.log(JSON.stringify({
  mode: "synthetic-mock-only",
  promptChars: output.promptChars,
  summary: output.summary,
}, null, 2));
