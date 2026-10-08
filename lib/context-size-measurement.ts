/** Numeric-only, non-authoritative chat prompt size measurements. No raw text is logged. */
export type ContextSizeInput = {
  systemInstruction: string;
  history: Array<{ parts: Array<{ text: string }> }>;
  userText: string;
  persona: string;
  relationshipGuides: string[];
  longTermMemory: string;
  todayMemory: string;
  repeatedReplies: string;
  environmentGuides: string[];
};
const chars = (s: string) => s.length;
const sum = (items: string[]) => items.reduce((n, item) => n + chars(item), 0);
export function measureContextSize(input: ContextSizeInput) {
  const historyChars = input.history.reduce((n, item) =>
    n + item.parts.reduce((m, part) => m + chars(part.text), 0), 0);
  const dynamic = {
    persona: chars(input.persona),
    relationship: sum(input.relationshipGuides),
    longTermMemory: chars(input.longTermMemory),
    todayMemory: chars(input.todayMemory),
    repeatedReplies: chars(input.repeatedReplies),
    environment: sum(input.environmentGuides),
  };
  return {
    unit: "utf16_chars" as const,
    systemInstructionChars: chars(input.systemInstruction),
    historyChars,
    historyMessages: input.history.length,
    userMessageChars: chars(input.userText),
    dynamicComponentChars: dynamic,
    // This is a character-size diagnostic, NOT token counting.
    // Dynamic components can occur multiple times; totals are not additive.
  };
}
export function contextSizeMeasurementEnabled(value: string | undefined) {
  return value === "1";
}
