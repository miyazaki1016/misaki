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
};

export type GeminiJsonResponse = {
  ok: boolean;
  status: number;
  text: string | null;
  data: unknown;
};

const MODEL = "gemini-3.1-flash-lite";

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

  while (true) {
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
    } catch (error) {
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
      const delayMs = transientRetryDelaysMs[transientAttempt++];
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    const data = await response.json();
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
