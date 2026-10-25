// Offline-only preflight for the current JMA Atom feed regex parser.
// This is a conservative compatibility check, NOT a complete XML parser.
export function auditTokyoFeedShape(xml) {
  if (typeof xml !== 'string') throw new TypeError('Feed must be text');
  const hasFeed = /<feed(?:\s[^>]*)?>[\s\S]*<\/feed\s*>/i.test(xml);
  const opens = [...xml.matchAll(/<entry(?=[\s>])[^>]*>/gi)].length;
  const closes = [...xml.matchAll(/<\/entry\s*>/gi)].length;
  const parsed = xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) ?? [];
  const namespaceEntries = /<(?:[\w.-]+):entry\b/i.test(xml);
  const reasons = [];
  if (!hasFeed) reasons.push('feed_wrapper_missing');
  if (opens !== closes || parsed.length !== opens) reasons.push('entry_boundary_mismatch');
  if (namespaceEntries) reasons.push('namespaced_entry_unsupported');
  const linksMissing = parsed.filter(entry => !/<link[^>]+href=["'][^"']+["'][^>]*\/?>/i.test(entry)).length;
  if (linksMissing) reasons.push('entry_link_not_recognized');
  return {
    safeToClaimParsedCoverage: reasons.length === 0,
    reasons, entryOpenCount: opens, entryCloseCount: closes,
    matchedEntryCount: parsed.length, linksMissing,
  };
}
