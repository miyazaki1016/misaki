// Offline-only cross-stage contract; no fetches, live wiring, or prompt changes.
import { summarizeTokyoCombinedHealth } from './tokyo-combined-health-offline.mjs';
import { auditTokyoCandidateCoverage } from './tokyo-candidate-coverage-offline.mjs';

export function summarizeTokyoThreeStageHealth({ sources, candidates, details }) {
  const base = summarizeTokyoCombinedHealth({ sources, details });
  if (!Array.isArray(candidates) || candidates.length !== 2) {
    throw new TypeError('Both JMA candidate audits required');
  }
  const seen = new Set(), candidateStates = {}, coverage = {};
  for (const item of candidates) {
    if (!item || !['earthquake', 'warning'].includes(item.source) || seen.has(item.source)) {
      throw new TypeError('Unknown or duplicate candidate source');
    }
    seen.add(item.source);
    const feedAvailable = base.sources[item.source] === 'available';
    if (item.feedState !== (feedAvailable ? 'success' : 'failure')) {
      throw new TypeError('Candidate feed state contradicts source result');
    }
    const audit = auditTokyoCandidateCoverage(item);
    const detail = details.find(x => x.source === item.source);
    const selected = item.decisions.filter(x => x.reason === 'selected').map(x => x.id);
    if (selected.length !== detail.discovered.length ||
        new Set(selected).size !== selected.length ||
        selected.some(id => !detail.discovered.includes(id))) {
      throw new TypeError('Selected candidates and detail inventory differ');
    }
    candidateStates[item.source] = audit.status;
    coverage[item.source] = { complete: audit.complete, blocked: audit.blocked, missingCount: audit.missing.length };
  }
  // Reaching an event cap means some candidates were deliberately not fetched.
  // It may be correct product behavior, but is not exhaustive source coverage.
  const exhaustive = Object.values(coverage).every(x => x.complete && x.blocked === 0);
  const completenessVerified = base.completenessVerified && exhaustive;
  return {
    ...base,
    candidates: candidateStates,
    coverage,
    completenessVerified,
    status: completenessVerified ? base.status : base.status === 'empty' || base.status === 'available' ? 'partial' : base.status,
  };
}
