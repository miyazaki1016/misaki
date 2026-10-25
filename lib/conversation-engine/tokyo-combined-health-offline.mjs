// Offline-only combination of fixed-source and discovered-detail completeness.
// The caller must report feed discovery completeness; this function cannot infer it.
import { summarizeTokyoSourcesStrict } from './tokyo-source-health-v3-offline.mjs';
import { auditDynamicDetails } from './tokyo-dynamic-detail-health-offline.mjs';

export function summarizeTokyoCombinedHealth({ sources, details }) {
  const base = summarizeTokyoSourcesStrict(sources);
  if (!Array.isArray(details) || details.length !== 2) {
    throw new TypeError('Both earthquake and warning detail audits required');
  }
  const seen = new Set(), detailStates = {};
  for (const item of details) {
    if (!item || !['earthquake', 'warning'].includes(item.source) || seen.has(item.source)) {
      throw new TypeError('Unknown or duplicate detail source');
    }
    seen.add(item.source);
    // Do not accept a "complete" detail audit if its feed was unavailable.
    const feed = base.sources[item.source];
    const audited = auditDynamicDetails(item);
    detailStates[item.source] = feed === 'available' ? audited.status : feed;
    if (feed !== 'available' && item.discovered.length > 0) {
      throw new TypeError('Details cannot be claimed from unavailable feed');
    }
  }
  const detailComplete = details.every(item => detailStates[item.source] === 'available');
  const completenessVerified = base.completenessVerified && detailComplete;
  const status = completenessVerified ? (base.events.length ? 'available' : 'empty')
    : base.events.length || Object.values(base.sources).some(x => x === 'available' || x === 'partial')
      ? 'partial' : 'unavailable';
  return { status, completenessVerified, sources: base.sources, details: detailStates, events: base.events };
}
