/**
 * Conservative screening for an already manually redacted local replay fixture.
 * This is NOT anonymization: names, addresses, and contextual identifiers
 * can remain even if all checks pass. Never use it to approve data release.
 */
export type ReplayPrivacyFinding = "email" | "url" | "phone_like" | "credential_like";
export type ReplayPrivacyReport = {
  safeForAutomaticExport: false;
  needsHumanReview: true;
  findings: { turnIndex: number; kinds: ReplayPrivacyFinding[] }[];
};
const patterns: Record<ReplayPrivacyFinding, RegExp> = {
  email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  url: /(?:https?:\/\/|www\.)\S+/i,
  phone_like: /(?:\+?81[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/,
  credential_like: /(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*\S+/i,
};
export function screenReplayPrivacy(turns: unknown): ReplayPrivacyReport {
  if (!Array.isArray(turns)) throw new Error("Expected a local array");
  const findings: ReplayPrivacyReport["findings"] = [];
  for (let i = 0; i < turns.length; i++) {
    const item = turns[i];
    if (!item || typeof item !== "object" || typeof item.text !== "string") {
      throw new Error("Invalid local turn");
    }
    const kinds = (Object.keys(patterns) as ReplayPrivacyFinding[])
      .filter((kind) => patterns[kind].test(item.text));
    if (kinds.length) findings.push({turnIndex:i,kinds});
  }
  return {safeForAutomaticExport:false,needsHumanReview:true,findings};
}
