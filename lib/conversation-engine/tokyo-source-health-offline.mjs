// Experimental source-health aggregation; not wired to live fetchers.
// A fulfilled [] means a completed source query with no matching events.
// A rejected query means unavailable, not verified empty.
export const TOKYO_SOURCES = Object.freeze(['earthquake', 'warning', 'forecast', 'train', 'haneda']);
export function aggregateTokyoSourceResults(outcomes) {
  if (!Array.isArray(outcomes) || outcomes.length !== TOKYO_SOURCES.length) {
    throw new TypeError('Expected one outcome for each Tokyo source');
  }
  const events = [], failures = [], seen = new Set();
  for (const item of outcomes) {
    if (!item || !TOKYO_SOURCES.includes(item.source) || seen.has(item.source)) {
      throw new TypeError('Unknown or duplicate source');
    }
    seen.add(item.source);
    if (item.status === 'fulfilled' && Array.isArray(item.events)) {
      events.push(...item.events);
    } else if (item.status === 'rejected' && item.events === undefined) {
      failures.push(item.source);
    } else {
      throw new TypeError('Malformed source outcome');
    }
  }
  return { events, failures, attempted: TOKYO_SOURCES.length };
}
