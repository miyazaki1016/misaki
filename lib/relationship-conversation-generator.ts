export type ConversationGenerationRequest = {
  systemPrompt: string;
  message: string;
  history?: Array<{ role: "user" | "model"; text: string }>;
};

export type ConversationGenerator = (
  request: ConversationGenerationRequest
) => Promise<string>;

export function createGeminiConversationGenerator(
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): ConversationGenerator {
  return async ({ systemPrompt, message, history = [] }) => {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...history.map((item) => ({
              role: item.role,
              parts: [{ text: item.text }],
            })),
            { role: "user", parts: [{ text: message }] },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GEMINI_PREVIEW_HTTP_${response.status}`);
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof raw !== "string" || !raw.trim()) {
      throw new Error("GEMINI_PREVIEW_EMPTY");
    }

    const parsed = JSON.parse(raw) as { reply?: unknown };
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      throw new Error("GEMINI_PREVIEW_INVALID_REPLY");
    }

    return parsed.reply.trim();
  };
}
