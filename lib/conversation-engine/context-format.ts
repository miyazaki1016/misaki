import type { CanonicalConversationTurn } from "./history";

/**
 * Pure formatting helpers matching the existing production chat route.
 * They are not wired into production yet. Input history must already be
 * sanitized by the caller.
 */
export function formatLongTermMemory(memory: readonly string[]): string {
  return memory.length > 0
    ? memory.map((item) => `・${item}`).join("\n")
    : "まだ長期記憶はありません。";
}

export function formatRecentMisakiMessages(
  history: readonly CanonicalConversationTurn[],
): string {
  const recent = history
    .filter((item) => item.role === "misaki")
    .slice(-8)
    .map((item) => item.text);
  return recent.length > 0
    ? recent.map((text) => `・${text}`).join("\n")
    : "なし";
}
