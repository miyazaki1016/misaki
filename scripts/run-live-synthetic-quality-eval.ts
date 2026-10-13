import { qualityScenarios } from "../lib/context-ab-quality.ts";

const MODEL = "gemini-3.1-flash-lite";
const MAX_CALLS = 14;
const HARD_BUDGET_USD = 0.05;
const STOP_BUDGET_USD = 0.04;
const INPUT_USD_PER_MILLION = 0.25;
const OUTPUT_USD_PER_MILLION = 1.5;
const apiKey = process.env.MISAKI_AB_GEMINI_API_KEY;

if (process.env.CONFIRM_SYNTHETIC_ONLY !== "YES") {
  throw new Error("Set CONFIRM_SYNTHETIC_ONLY=YES to run fixed synthetic fixtures.");
}
if (!apiKey) throw new Error("Missing MISAKI_AB_GEMINI_API_KEY secret.");

const fixtures = qualityScenarios.slice(0, 7);
if (fixtures.length !== 7) throw new Error("Expected exactly seven fixed fixtures.");

let calls = 0;
let estimatedUsd = 0;
const results = [];

for (const fixture of fixtures) {
  for (const arm of ["X", "Y"]) {
    if (calls >= MAX_CALLS) break;
    const system = arm === "X"
      ? "あなたは日本語の会話AIです。与えられた架空の会話履歴だけを根拠に、自然で短い返答をしてください。根拠のない記憶や関係性を作らず、直前の返答をそのまま繰り返さないでください。"
      : "あなたは日本語の会話AIです。最新のユーザー発言に直接答えてください。与えられた架空の会話履歴以外の事実を推測せず、親しみやすく簡潔に返答してください。";
    const prompt = [
      "以下は評価専用の架空データです。返答文だけを出力してください。",
      "会話履歴:",
      ...fixture.history.map((turn) => `${turn.role === "user" ? "ユーザー" : "美咲"}: ${turn.text}`),
      `今回のユーザー発言: ${fixture.userText}`,
      "返答文のみを出力してください。",
    ].join("\n");
    const roughInputTokens = Math.ceil((system.length + prompt.length) / 3);
    const worstCost = (roughInputTokens * INPUT_USD_PER_MILLION + 128 * OUTPUT_USD_PER_MILLION) / 1_000_000;
    if (estimatedUsd + worstCost >= STOP_BUDGET_USD) {
      results.push({ scenarioId: fixture.id, arm, ok: false, error: "budget guard stopped before call" });
      break;
    }
    calls++;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 128, thinkingConfig: { thinkingLevel: "minimal" } },
        }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) {
        results.push({ scenarioId: fixture.id, arm, ok: false, status: response.status, errorCode: data?.error?.code ?? null });
        continue;
      }
      const reply = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
      const inputTokens = data.usageMetadata?.promptTokenCount ?? roughInputTokens;
      const outputTokens = (data.usageMetadata?.candidatesTokenCount ?? 0) + (data.usageMetadata?.thoughtsTokenCount ?? 0);
      estimatedUsd += (inputTokens * INPUT_USD_PER_MILLION + outputTokens * OUTPUT_USD_PER_MILLION) / 1_000_000;
      results.push({
        scenarioId: fixture.id, description: fixture.description, arm, ok: true, reply,
        usage: { inputTokens, outputTokens },
        heuristic: {
          nonempty: reply.length > 0,
          expectedFactsPresent: fixture.expectedTerms.every((term) => reply.includes(term)),
          unsupportedClaimsAbsent: fixture.forbiddenTerms.every((term) => !reply.includes(term)),
        },
      });
    } catch {
      results.push({ scenarioId: fixture.id, arm, ok: false, error: "request failed or timed out" });
    }
    if (estimatedUsd >= STOP_BUDGET_USD) break;
  }
  if (estimatedUsd >= STOP_BUDGET_USD) break;
}

const report = {
  model: MODEL, calls, maxCalls: MAX_CALLS, estimatedUsd,
  hardBudgetUsd: HARD_BUDGET_USD, conservativeStopUsd: STOP_BUDGET_USD,
  allFictionalFixtures: true, noHistoryRead: true, noPersistence: true, results,
};
await import("node:fs/promises").then(({ writeFile }) =>
  writeFile("synthetic-quality-results.json", JSON.stringify(report, null, 2), { mode: 0o600 }),
);
console.log(JSON.stringify({ ...report, results: results.map(({ reply, ...meta }) => ({ ...meta, reply: reply ? "[saved in artifact]" : undefined })) }, null, 2));
if (estimatedUsd > HARD_BUDGET_USD) throw new Error("Hard budget limit exceeded.");
