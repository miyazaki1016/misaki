/** Deterministic, non-committing A/B prompt construction.
 * This module performs no network calls, DB reads/writes, or logging.
 * Inputs must be provided by a separate explicitly approved isolated harness.
 */
export const REPEAT_GUIDANCE = [
  "【直近の美咲の発言と表現の重複】",
  "直近の美咲の発言は会話履歴に含まれています。",
  "会話履歴を参照し、同じ表現をそのまま繰り返さないでください。",
].join("\n");

export type PromptVariant = "A" | "B";

export function makeRecentReplySection(
  variant: PromptVariant,
  recentReplies: readonly string[],
): string {
  if (variant === "A") {
    const recentTopicText = recentReplies.length
      ? recentReplies.map((reply) => `・${reply}`).join("\n")
      : "なし";
    return [
      "【直近の美咲の発言】",
      recentTopicText,
      "同じ表現を",
      "そのまま繰り返さないでください。",
    ].join("\n\n");
  }
  return REPEAT_GUIDANCE;
}

export function makePromptVariants(
  basePromptWithPlaceholder: string,
  recentReplies: readonly string[],
  placeholder = "{{RECENT_REPLY_SECTION}}",
) {
  if (basePromptWithPlaceholder.split(placeholder).length !== 2) {
    throw new Error("Expected exactly one recent reply section placeholder");
  }
  const A = basePromptWithPlaceholder.replace(
    placeholder,
    makeRecentReplySection("A", recentReplies),
  );
  const B = basePromptWithPlaceholder.replace(
    placeholder,
    makeRecentReplySection("B", recentReplies),
  );
  return {
    A,
    B,
    metrics: {
      aChars: A.length,
      bChars: B.length,
      savedChars: A.length - B.length,
    },
  };
}
