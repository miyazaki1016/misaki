export type GeminiJsonRequest = {
  apiKey: string;
  systemInstruction: string;
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  userText: string;
  timeoutMs?: number;
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
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    request.timeoutMs ?? 30_000
  );

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${request.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
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
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

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
  } finally {
    clearTimeout(timeout);
  }
}

export const GEMINI_CHAT_MODEL = MODEL;
