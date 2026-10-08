/** Pure analysis helpers. Never alter the prompt or relationship state. */
export type PromptSection = { name: string; text: string };
export type PromptOverlap = {
  name: string;
  chars: number;
  occurrences: number;
  extraRepeatedChars: number;
};
export function analyzePromptSectionOverlap(
  fullPrompt: string,
  sections: PromptSection[],
): PromptOverlap[] {
  return sections.map(({ name, text }) => {
    if (!text) return { name, chars: 0, occurrences: 0, extraRepeatedChars: 0 };
    let occurrences = 0;
    let cursor = 0;
    while (true) {
      const index = fullPrompt.indexOf(text, cursor);
      if (index === -1) break;
      occurrences++;
      cursor = index + text.length;
    }
    return {
      name,
      chars: text.length,
      occurrences,
      extraRepeatedChars: Math.max(0, occurrences - 1) * text.length,
    };
  });
}
/** The recent model replies are already present in the raw history.
 * Return only a numeric overlap diagnostic; never output their contents. */
export function countRepeatedRepliesInHistory(
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  recentReplies: string[],
) {
  const modelTexts = new Set(history.filter((m) => m.role === "model").flatMap((m) => m.parts.map((p) => p.text)));
  return {
    recentReplies: recentReplies.length,
    duplicatedReplies: recentReplies.filter((reply) => modelTexts.has(reply)).length,
  };
}
