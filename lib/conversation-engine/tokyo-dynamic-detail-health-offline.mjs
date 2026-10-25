// Offline-only dynamic detail-fetch audit. Does not perform network requests.
// A discovered detail link must have exactly one recorded outcome.
export function auditDynamicDetails({ source, discovered, outcomes }) {
  if (!['earthquake', 'warning'].includes(source) || !Array.isArray(discovered) || !Array.isArray(outcomes)) {
    throw new TypeError('Invalid dynamic detail audit input');
  }
  const expected = new Set();
  for (const id of discovered) {
    if (typeof id !== 'string' || id.length === 0 || expected.has(id)) {
      throw new TypeError('Invalid or duplicate discovered detail');
    }
    expected.add(id);
  }
  const seen = new Set();
  let succeeded = 0, failed = 0, skipped = 0;
  for (const item of outcomes) {
    if (!item || typeof item.id !== 'string' || !expected.has(item.id) || seen.has(item.id)) {
      throw new TypeError('Unknown or duplicate detail outcome');
    }
    if (!['success', 'failure', 'skipped'].includes(item.state)) {
      throw new TypeError('Invalid detail state');
    }
    seen.add(item.id);
    if (item.state === 'success') succeeded++;
    if (item.state === 'failure') failed++;
    if (item.state === 'skipped') skipped++;
  }
  if (seen.size !== expected.size) throw new TypeError('Discovered detail has no outcome');
  const complete = failed === 0 && skipped === 0;
  return {
    source, discoveredCount: expected.size, succeeded, failed, skipped, complete,
    status: complete ? 'available' : succeeded > 0 ? 'partial' : failed > 0 ? 'unavailable' : 'skipped'
  };
}
