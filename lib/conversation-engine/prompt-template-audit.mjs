/** Offline prompt-template structural audit. No production imports or model calls. */
const te = new TextEncoder();
export const utf8Bytes = value => te.encode(value).byteLength;

/** Extract source template, not rendered runtime input. Does not execute substitutions. */
export function inspectBaseSystemPromptSource(routeSource) {
  if (typeof routeSource !== 'string') throw new TypeError('ROUTE_SOURCE_REQUIRED');
  const opening = 'const baseSystemPrompt = `';
  const start = routeSource.indexOf(opening);
  if (start < 0 || routeSource.indexOf(opening, start + opening.length) >= 0) throw new Error('BASE_PROMPT_ANCHOR_NOT_UNIQUE');
  const end = routeSource.indexOf('`.trim();', start + opening.length);
  if (end < 0) throw new Error('BASE_PROMPT_END_NOT_FOUND');
  const raw = routeSource.slice(start + opening.length, end);
  const placeholderPattern = /\$\{([^{}]*)\}/g;
  const interpolationNames = [...raw.matchAll(placeholderPattern)].map(x => x[1].trim());
  const constantText = raw.replace(placeholderPattern, '');
  if (constantText.includes('${') || interpolationNames.some(name => name.length === 0)) throw new Error('PROMPT_INTERPOLATION_UNSUPPORTED');
  return Object.freeze({
    sourceTemplateUtf8Bytes: utf8Bytes(raw),
    constantScaffoldUtf8Bytes: utf8Bytes(constantText),
    constantScaffoldTrimmedUtf8Bytes: utf8Bytes(constantText.trim()),
    interpolationCount: interpolationNames.length,
    interpolationNames,
    measuredRuntimeBytes: null,
    measuredModelTokens: null,
  });
}

/** Only use synthetic sections; this does not establish parity with production. */
export function measureSyntheticSections(sections) {
  if (!Array.isArray(sections)) throw new TypeError('SECTIONS_REQUIRED');
  const seen = new Set();
  const out = sections.map(section => {
    if (!section || typeof section.key !== 'string' || !section.key.trim() || seen.has(section.key) || typeof section.text !== 'string') throw new Error('BAD_SECTION');
    seen.add(section.key);
    return { key: section.key, selected: section.selected !== false, utf8Bytes: utf8Bytes(section.text) };
  });
  return { sections: out, selectedUtf8Bytes: out.reduce((sum,x) => sum + (x.selected ? x.utf8Bytes : 0), 0), modelInputTokens: null };
}
