import { qualityScenarios } from "../../../../lib/context-ab-quality";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };
const MODEL = "gemini-3.1-flash-lite";
const MAX_CALLS = 14;
const MAX_ESTIMATED_USD = 0.04;
const INPUT_USD_PER_MILLION = 0.25;
const OUTPUT_USD_PER_MILLION = 1.5;

/**
 * Preview-only synthetic evaluation. No request body, database, history, or persistence.
 * The only prompts are built from fixed fictional fixtures in qualityScenarios.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "Preview only" }, { status: 404, headers: NO_STORE });
  }
  const expectedToken = process.env.MISAKI_SYNTHETIC_EVAL_TOKEN;
  const providedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!expectedToken || !providedToken || providedToken !== expectedToken) {
    return Response.json({ error: "Not authorized" }, { status: 403, headers: NO_STORE });
  }
  if (process.env.MISAKI_SYNTHETIC_EVAL_ENABLED !== "YES") {
    return Response.json({ error: "Synthetic evaluation disabled" }, { status: 403, headers: NO_STORE });
  }
  const apiKey = process.env.MISAKI_AB_GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Preview API key unavailable" }, { status: 503, headers: NO_STORE });

  const fixtures = qualityScenarios.slice(0, 7);
  if (fixtures.length !== 7) return Response.json({ error: "Expected seven fixed fixtures" }, { status: 500, headers: NO_STORE });

  let calls = 0;
  let estimatedUsd = 0;
  const results: Array<Record<string, unknown>> = [];
  for (const fixture of fixtures) {
    for (const arm of ["X", "Y"] as const) {
      if (calls >= MAX_CALLS) break;
      const system = arm === "X"
        ? "あなたは日本語の会話AIです。与えられた架空の会話履歴だけを根拠に、自然で短い返答をしてください。根拠のない記憶や関係性を作らず、直前の返答をそのまま繰り返さないでください。"
        : "あなたは日本語の会話AIです。最新のユーザー発言に直接答えてください。与えられた架空の会話履歴以外の事実を推測せず、親しみやすく簡潔に返答してください。";
      const prompt = [
        "以下は評価専用の架空データです。JSONではなく、返答文だけを出力してください。",
        "会話履歴:",
        ...fixture.history.map((turn) => `${turn.role === "user" ? "ユーザー" : "美咲"}: ${turn.text}`),
        `今回のユーザー発言: ${fixture.userText}`,
        "返答文のみを出力してください。"
      ].join("\n");
      const roughInputTokens = Math.ceil((system.length + prompt.length) / 3);
      const worstCost = (roughInputTokens * INPUT_USD_PER_MILLION + 128 * OUTPUT_USD_PER_MILLION) / 1_000_000;
      if (estimatedUsd + worstCost >= MAX_ESTIMATED_USD) {
        return Response.json({ error: "Budget guard stopped evaluation", calls, estimatedUsd, results }, { status: 429, headers: NO_STORE });
      }
      calls += 1;
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 128, thinkingConfig: { thinkingLevel: "minimal" } }
          }),
          signal: AbortSignal.timeout(20000)
        });
        const data = await response.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
          error?: { code?: number; message?: string };
        };
        if (!response.ok) {
          results.push({ scenarioId: fixture.id, arm, ok: false, status: response.status, errorCode: data.error?.code ?? null });
          continue;
        }
        const reply = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
        const inputTokens = data.usageMetadata?.promptTokenCount ?? roughInputTokens;
        const outputTokens = (data.usageMetadata?.candidatesTokenCount ?? 0) + (data.usageMetadata?.thoughtsTokenCount ?? 0);
        estimatedUsd += (inputTokens * INPUT_USD_PER_MILLION + outputTokens * OUTPUT_USD_PER_MILLION) / 1_000_000;
        results.push({
          scenarioId: fixture.id, arm, ok: true, reply,
          usage: { inputTokens, outputTokens },
          heuristic: {
            nonempty: reply.length > 0,
            expectedFactsPresent: fixture.expectedTerms.every((term) => reply.includes(term)),
            unsupportedClaimsAbsent: fixture.forbiddenTerms.every((term) => !reply.includes(term))
          }
        });
      } catch {
        results.push({ scenarioId: fixture.id, arm, ok: false, error: "request failed or timed out" });
      }
      if (estimatedUsd >= MAX_ESTIMATED_USD) {
        return Response.json({ error: "Budget guard stopped evaluation", calls, estimatedUsd, results }, { status: 429, headers: NO_STORE });
      }
    }
  }
  return Response.json({
    model: MODEL, calls, maxCalls: MAX_CALLS, estimatedUsd,
    budgetLimitUsd: 0.05, allFictionalFixtures: true,
    noHistoryRead: true, noPersistence: true, results
  }, { headers: NO_STORE });
}
