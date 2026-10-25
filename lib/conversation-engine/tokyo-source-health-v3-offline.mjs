// Offline-only strict subrequest inventory. No live fetches or production wiring.
export const REQUIRED_REQUESTS = Object.freeze({
  earthquake: ['feed'],
  warning: ['feed'],
  forecast: ['hourly'],
  train: ['rail_page'],
  haneda: ['domestic', 'international'],
});
export function summarizeTokyoSourcesStrict(outcomes) {
  const ids = Object.keys(REQUIRED_REQUESTS);
  if (!Array.isArray(outcomes) || outcomes.length !== ids.length) {
    throw new TypeError('Exactly five sources required');
  }
  const seenSources = new Set(), sources = {}, events = [];
  for (const outcome of outcomes) {
    if (!outcome || !ids.includes(outcome.source) || seenSources.has(outcome.source)) {
      throw new TypeError('Unknown or duplicate source');
    }
    seenSources.add(outcome.source);
    const required = REQUIRED_REQUESTS[outcome.source];
    if (!Array.isArray(outcome.requests) || outcome.requests.length !== required.length) {
      throw new TypeError('Missing or extra required subrequest');
    }
    const seenRequests = new Set();
    for (const req of outcome.requests) {
      if (!req || !required.includes(req.id) || seenRequests.has(req.id) ||
          !['success', 'failure', 'skipped'].includes(req.state)) {
        throw new TypeError('Invalid or duplicate subrequest');
      }
      seenRequests.add(req.id);
    }
    if (!Array.isArray(outcome.events)) throw new TypeError('Events must be an array');
    const states = outcome.requests.map(req => req.state);
    const success = states.includes('success');
    if (outcome.events.length > 0 && !success) {
      throw new TypeError('Events cannot originate from failed or skipped requests');
    }
    const failure = states.includes('failure');
    const skipped = states.includes('skipped');
    sources[outcome.source] = failure
      ? (success ? 'partial' : 'unavailable')
      : skipped ? (success ? 'partial' : 'skipped') : 'available';
    events.push(...outcome.events);
  }
  const statuses = Object.values(sources);
  const completenessVerified = statuses.every(status => status === 'available');
  const status = completenessVerified ? (events.length ? 'available' : 'empty')
    : statuses.every(x => x === 'skipped') ? 'skipped'
    : statuses.some(x => x === 'available' || x === 'partial') ? 'partial' : 'unavailable';
  return { status, sources, events, completenessVerified };
}
