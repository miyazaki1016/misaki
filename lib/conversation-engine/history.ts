/**
 * Pure conversation-history adapter for the future shared conversation engine.
 * No DB, network, Gemini, clock, or production route dependency.
 *
 * IMPORTANT: The existing production route has not been switched to this helper.
 */
export type CanonicalConversationTurn = {
  role: "user" | "misaki";
  text: string;
};

export type GeminiConversationTurn = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

/**
 * Matches the production chat route's history-to-Gemini mapping.
 * Caller must supply the already-validated, last-60-message history.
 * The current user message is intentionally NOT appended to contents.
 */
export function toGeminiConversationHistory(
  safeHistory: readonly CanonicalConversationTurn[],
): GeminiConversationTurn[] {
  return safeHistory.map((item) => ({
    role: item.role === "user" ? "user" : "model",
    parts: [{ text: item.text }],
  }));
}

/**
 * Produces a defensive snapshot without mutating the caller's array.
 * Mirrors production's history filtering and last-60 cap; invalid items
 * are excluded before the history-to-Gemini mapping.
 */
export function sanitizeConversationHistory(
  history: unknown,
  maxHistory = 60,
): CanonicalConversationTurn[] {
  if (!Number.isInteger(maxHistory) || maxHistory < 0) {
    throw new Error("invalid history limit");
  }
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (item): item is CanonicalConversationTurn =>
        !!item &&
        (item.role === "user" || item.role === "misaki") &&
        typeof item.text === "string",
    )
    .slice(-maxHistory)
    .map((item) => ({ role: item.role, text: item.text }));
}
