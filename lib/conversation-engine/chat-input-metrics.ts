/**
 * Offline-only prompt-section measurement for synthetic conversation fixtures.
 *
 * This module has no model/network/database access and intentionally does not
 * log or persist section text. It measures already-rendered strings; it does
 * NOT claim to tokenize Gemini output or preserve production prompt parity.
 */
export type SectionState =
  | "present"
  | "empty"
  | "unavailable"
  | "expired"
  | "not_relevant";

export type PromptSection = Readonly<{
  key: string;
  text: string;
  state: SectionState;
  sourceKeys?: readonly string[];
  selected?: boolean;
}>;

export type SectionMetric = Readonly<{
  key: string;
  state: SectionState;
  selected: boolean;
  sourceCount: number;
  utf16Units: number;
  codePoints: number;
  utf8Bytes: number;
  repeatedSourceKeys: readonly string[];
}>;

export type PromptInputMetrics = Readonly<{
  sections: readonly SectionMetric[];
  selectedUtf16Units: number;
  selectedCodePoints: number;
  selectedUtf8Bytes: number;
  // Do not estimate token counts from Japanese characters or bytes.
  modelInputTokens: null;
}>;

/**
 * A metric is produced for every named section, including empty sections.
 * "not selected" doesn't mean that the data was authorized for generation.
 * Data provenance/permissions must be checked before constructing sections.
 */
export function measureRenderedChatSections(
  sections: readonly PromptSection[],
): PromptInputMetrics {
  const seenSectionKeys = new Set<string>();
  const seenSourceKeys = new Set<string>();
  const metrics: SectionMetric[] = [];
  let selectedUtf16Units = 0;
  let selectedCodePoints = 0;
  let selectedUtf8Bytes = 0;

  for (const section of sections) {
    if (!section.key.trim() || seenSectionKeys.has(section.key)) {
      throw new Error("CHAT_METRIC_DUPLICATE_OR_EMPTY_SECTION_KEY");
    }
    seenSectionKeys.add(section.key);
    const selected = section.selected ?? true;
    const sourceKeys = [...new Set(section.sourceKeys ?? [])];
    const repeatedSourceKeys = sourceKeys.filter((key) => seenSourceKeys.has(key));
    // Inspect repeated sources even when their section is not selected, but
    // only count selected sources as actually present in a composed prompt.
    if (selected) for (const key of sourceKeys) seenSourceKeys.add(key);

    const utf16Units = section.text.length;
    const codePoints = Array.from(section.text).length;
    const utf8Bytes = new TextEncoder().encode(section.text).byteLength;
    metrics.push({
      key: section.key,
      state: section.state,
      selected,
      sourceCount: sourceKeys.length,
      utf16Units,
      codePoints,
      utf8Bytes,
      repeatedSourceKeys,
    });
    if (selected) {
      selectedUtf16Units += utf16Units;
      selectedCodePoints += codePoints;
      selectedUtf8Bytes += utf8Bytes;
    }
  }

  return {
    sections: metrics,
    selectedUtf16Units,
    selectedCodePoints,
    selectedUtf8Bytes,
    modelInputTokens: null,
  };
}
