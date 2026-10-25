// Experimental, offline-only source/subrequest health model. No production wiring.
export const TOKYO_SOURCE_IDS = Object.freeze(['earthquake', 'warning', 'forecast', 'train', 'haneda']);
export function summarizeTokyoSources(outcomes) {
  if (!Array.isArray(outcomes) || outcomes.length !== TOKYO_SOURCE_IDS.length) {
    throw new TypeError('Exactly five source outcomes required');
  }
  const seen = new Set(), events = [], sources = {};
  for (const item of outcomes) {
    if (!item || !TOKYO_SOURCE_IDS.includes(item.source) || seen.has(item.source)) {
      throw new TypeError('Unknown or duplicate source');
    }
    seen.add(item.source);
    if (!Array.isArray(item.requests) || item.requests.length === 0) {
      throw new TypeError('Source requires explicit subrequest states');
    }
    const states = item.requests.map(x => x?.state);
    if (states.some(x => !['success', 'failure', 'skipped'].includes(x))) {
      throw new TypeError('Invalid request state');
    }
    const hasSuccess = states.includes('success');
    const hasFailure = states.includes('failure');
    const hasSkip = states.includes('skipped');
    if (!Array.isArray(item.events) || (item.events.length > 0 && !hasSuccess)) {
      throw new TypeError('Events require a successful request');
    }
    const status = hasFailure
      ? (hasSuccess ? 'partial' : 'unavailable')
      : hasSkip
        ? (hasSuccess ? 'partial' : 'skipped')
        : 'available';
    sources[item.source] = status;
    events.push(...item.events);
  }
  const statuses = Object.values(sources);
  const status = statuses.every(x => x === 'available')
    ? (events.length ? 'available' : 'empty')
    : statuses.every(x => x === 'skipped')
      ? 'skipped'
      : statuses.some(x => x === 'available' || x === 'partial')
        ? 'partial'
        : 'unavailable';
  return { status, sources, events, completenessVerified: statuses.every(x => x === 'available') };
}
