import type { ReadOnlyModelAdapter } from "./context-ab-offline-harness";

/**
 * Isolated Gemini adapter for the offline A/B harness.
 * No Supabase or chat API calls. Must run in a trusted server-side environment.
 * Requires explicit opt-in; never embed the API key in client-side code.
 */
export function createIsolatedGeminiAdapter(options: {
  apiKey: string;
  model: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** Explicit authorization is required for real billable model requests. */
  allowLiveRequests?: boolean;
}): ReadOnlyModelAdapter {
  if (!options.apiKey || !options.model) throw new Error("Missing Gemini credentials or model");
  if (!options.fetchImpl && options.allowLiveRequests !== true) {
    throw new Error("Live Gemini calls disabled: set allowLiveRequests explicitly");
  }
  const fetcher = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30000;
  return async ({ systemInstruction, history, userText }) => {
    const started = performance.now();
    try {
      const response = await fetcher(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": options.apiKey },
          signal: AbortSignal.timeout(timeoutMs),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [
              ...history.map((entry) => ({
                role: entry.role,
                parts: [{ text: entry.text }],
              })),
              { role: "user", parts: [{ text: userText }] },
            ],
            generationConfig: { responseMimeType: "application/json", temperature: 0 },
          }),
        },
      );
      const payload = await response.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      let jsonValid = false;
      try { JSON.parse(raw); jsonValid = true; } catch { /* invalid model JSON */ }
      return {
        latencyMs: Math.round(performance.now() - started),
        promptTokens: payload.usageMetadata?.promptTokenCount ?? null,
        outputTokens: payload.usageMetadata?.candidatesTokenCount ?? null,
        success: response.ok && raw.length > 0,
        jsonValid,
        timedOut: false,
        httpStatus: response.status,
        emptyCandidate: raw.length === 0,
      };
    } catch (error) {
      const timedOut = error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      return {
        latencyMs: Math.round(performance.now() - started),
        promptTokens: null,
        outputTokens: null,
        success: false,
        jsonValid: false,
        timedOut,
        httpStatus: null,
        emptyCandidate: false,
      };
    }
  };
}
