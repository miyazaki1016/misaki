// Offline-only coverage of a prefiltered JMA feed candidate list.
// "complete" means every candidate has a recorded decision, NOT that the feed was
// downloaded, parsed, or filtered correctly. No production wiring.
export function auditTokyoCandidateCoverage({ source, feedState, candidates, decisions }) {
  if (!['earthquake', 'warning'].includes(source) ||
      !['success', 'failure'].includes(feedState) ||
      !Array.isArray(candidates) || !Array.isArray(decisions)) {
    throw new TypeError('Invalid candidate audit input');
  }
  if (feedState === 'failure') {
    if (candidates.length || decisions.length) throw new TypeError('Failed feed cannot claim candidates');
    return { source, feedState, status: 'unavailable', complete: false, discoveredCount: 0, missing: [] };
  }
  const known = new Set();
  for (const id of candidates) {
    if (typeof id !== 'string' || !id || known.has(id)) throw new TypeError('Invalid candidate ID');
    known.add(id);
  }
  const seen = new Set(), missing = [];
  let selected = 0, ignored = 0, blocked = 0;
  for (const item of decisions) {
    if (!item || !known.has(item.id) || seen.has(item.id) ||
        !['selected', 'filtered', 'no_link', 'cap_reached'].includes(item.reason)) {
      throw new TypeError('Unknown, duplicate, or invalid candidate decision');
    }
    seen.add(item.id);
    if (item.reason === 'selected') selected++;
    if (item.reason === 'filtered' || item.reason === 'no_link') ignored++;
    if (item.reason === 'cap_reached') blocked++;
  }
  for (const id of candidates) if (!seen.has(id)) missing.push(id);
  const complete = missing.length === 0;
  return {
    source, feedState, status: complete ? 'available' : 'partial', complete,
    discoveredCount: candidates.length, selected, ignored, blocked, missing
  };
}
