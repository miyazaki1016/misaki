import { normalizeGeminiUsage, observeGeminiAttempt, type GeminiTelemetrySink } from "./gemini-usage-telemetry.ts";

export type GeminiJsonRequest = {
  apiKey: string;
  systemInstruction: string;
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  userText: string;
  timeoutMs?: number;
  transientRetryDelaysMs?: number[];
  timeoutRetryDelaysMs?: number[];
  responseSchema?: Record<string, unknown>;
  telemetrySink?: GeminiTelemetrySink;
};

export type GeminiJsonResponse = {
  ok: boolean;
  status: number;
  text: string | null;
  data: unknown;
};

const MODEL = "gemini-3.1-flash-lite";

/** Retry bodies were previously discarded. Observe a bounded clone off the retry path. */
function retryUsage(response: Response) {
  const unknown = normalizeGeminiUsage(null);
  try {
    const clone = response.clone();
    const reader = clone.body?.getReader();
    if (!reader) return Promise.resolve(unknown);
    return new Promise<ReturnType<typeof normalizeGeminiUsage>>(resolve => {
      let finished = false;
      const finish = (usage: ReturnType<typeof normalizeGeminiUsage>) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(usage);
        void reader.cancel().catch(() => {});
      };
      const timer = setTimeout(() => finish(unknown), 2_000);
      void (async () => {
        const decoder = new TextDecoder();
        let body = "";
        try {
          while (!finished) {
            const { done, value } = await reader.read();
            if (done) { body += decoder.decode(); finish(normalizeGeminiUsage(JSON.parse(body)?.usageMetadata)); return; }
            body += decoder.decode(value, { stream: true });
            if (body.length > 1_000_000) { finish(unknown); return; }
          }
        } catch { finish(unknown); }
      })();
    });
  } catch { return Promise.resolve(unknown); }
}

export async function generateGeminiJson(
  request: GeminiJsonRequest
): Promise<GeminiJsonResponse> {
  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
  };
  if (request.responseSchema) generationConfig.responseSchema = request.responseSchema;

  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: request.systemInstruction }],
    },
    contents: [
      ...request.contents,
      {
        role: "user",
        parts: [{ text: request.userText }],
      },
    ],
    generationConfig,
  });

  const transientRetryDelaysMs =
    request.transientRetryDelaysMs ?? [2_000, 5_000];
  const timeoutRetryDelaysMs =
    request.timeoutRetryDelaysMs ?? [2_000];
  let transientAttempt = 0;
  let timeoutAttempt = 0;
  let physicalAttempt = 0;

  while (true) {
    const attemptNo = ++physicalAttempt;
    const occurredAt = new Date().toISOString();
    const startedAt = performance.now();
    let httpLatencyMs: number | null = null;
    const observe = (status: number | null, success: boolean, metadata?: unknown, usage?: ReturnType<typeof retryUsage>) =>
      observeGeminiAttempt(request.telemetrySink, {
        ...normalizeGeminiUsage(metadata), model: MODEL, attempt_no: attemptNo,
        http_status: status, success, latency_ms: httpLatencyMs ?? Math.max(0, Math.round(performance.now() - startedAt)),
        occurred_at: occurredAt,
      }, usage);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      request.timeoutMs ?? 30_000
    );

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${request.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body,
        }
      );
      httpLatencyMs = Math.max(0, Math.round(performance.now() - startedAt));
    } catch (error) {
      observe(null, false);
      if (
        error instanceof Error &&
        error.name === "AbortError" &&
        timeoutAttempt < timeoutRetryDelaysMs.length
      ) {
        const delayMs = timeoutRetryDelaysMs[timeoutAttempt++];
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (
      [429, 502, 503, 504].includes(response.status) &&
      transientAttempt < transientRetryDelaysMs.length
    ) {
      if (request.telemetrySink) observe(response.status, response.ok, undefined, retryUsage(response));
      const delayMs = transientRetryDelaysMs[transientAttempt++];
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    let data: any;
    try { data = await response.json(); }
    catch (error) { observe(response.status, response.ok); throw error; }
    observe(response.status, response.ok, data?.usageMetadata);
    const text =
      typeof data?.candidates?.[0]?.content?.parts?.[0]?.text === "string"
        ? data.candidates[0].content.parts[0].text
        : null;

    return {
      ok: response.ok,
      status: response.status,
      text,
      data,
    };
  }
}

export const GEMINI_CHAT_MODEL = MODEL;
