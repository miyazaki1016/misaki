/** Offline-only comparison of synthetic rendered chat input sections.
 * No production route, model API, DB, logging, or token price estimates.
 * Input strings must already have passed access and Forget permission checks.
 */
const EXTERNAL = new Set(["weather", "earthquake", "weather_warning", "rail", "airport", "tokyo_life_events"]);

/**
 * Compare a baseline with a selection-only candidate. Forbid changes to all
 * non-external sections, including persona, relationship, memory, and safety.
 * Byte savings are not Gemini token savings.
 */
export function compareChatPromptSelections(baseline, candidate) {
  const ensure = (items) => {
    const keys = new Set();
    for (const section of items) {
      if (!section.key?.trim() || keys.has(section.key)) throw new Error("PROMPT_DIFF_BAD_SECTION_KEY");
      if (typeof section.text !== "string") throw new Error("PROMPT_DIFF_BAD_TEXT");
      keys.add(section.key);
    }
    return new Map(items.map(item => [item.key, item]));
  };
  const previous = ensure(baseline), next = ensure(candidate);
  if (previous.size !== next.size || [...previous.keys()].some(key => !next.has(key))) {
    throw new Error("PROMPT_DIFF_SECTION_SET_CHANGED");
  }
  let before = 0, after = 0;
  const changes = [];
  for (const [key, oldSection] of previous) {
    const newSection = next.get(key);
    const originalSelected = oldSection.selected ?? true;
    const updatedSelected = newSection.selected ?? true;
    if (!EXTERNAL.has(key) && (oldSection.text !== newSection.text ||
        originalSelected !== updatedSelected || oldSection.state !== newSection.state ||
        JSON.stringify(oldSection.sourceKeys ?? []) !== JSON.stringify(newSection.sourceKeys ?? []))) {
      throw new Error("PROMPT_DIFF_PROTECTED_SECTION_CHANGED:" + key);
    }
    if (EXTERNAL.has(key) && oldSection.text !== newSection.text) {
      throw new Error("PROMPT_DIFF_EXTERNAL_TEXT_CHANGED:" + key);
    }
    const baselineBytes = originalSelected ? new TextEncoder().encode(oldSection.text).length : 0;
    const candidateBytes = updatedSelected ? new TextEncoder().encode(newSection.text).length : 0;
    before += baselineBytes; after += candidateBytes;
    changes.push({ key, baselineBytes, candidateBytes, savedBytes: baselineBytes - candidateBytes });
  }
  return { baselineUtf8Bytes: before, candidateUtf8Bytes: after,
    savedUtf8Bytes: before - after, changes, modelTokenSavings: null };
}
