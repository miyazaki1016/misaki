export type BlindQualityErrorCode =
  | "gemini-http-error"
  | "gemini-empty-response"
  | "gemini-invalid-json"
  | "gemini-missing-reply";

export class BlindQualitySafeError extends Error {
  constructor(readonly code: BlindQualityErrorCode, readonly upstreamStatus?: number) {
    super(code);
    this.name = "BlindQualitySafeError";
  }
}

/** Extract only the expected reply field; never include generated text in diagnostics. */
export function decodeBlindQualityReply(payload: unknown): string {
  const candidates = (payload as { candidates?: unknown } | null)?.candidates;
  const parts = Array.isArray(candidates)
    ? (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts
    : undefined;
  const raw = Array.isArray(parts)
    ? parts.map((part) => {
        const text = (part as { text?: unknown } | null)?.text;
        return typeof text === "string" ? text : "";
      }).join("")
    : "";

  if (!raw.trim()) throw new BlindQualitySafeError("gemini-empty-response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BlindQualitySafeError("gemini-invalid-json");
  }
  const reply = (parsed as { reply?: unknown } | null)?.reply;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new BlindQualitySafeError("gemini-missing-reply");
  }
  return reply;
}
