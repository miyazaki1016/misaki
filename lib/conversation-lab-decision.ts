/**
 * Conversation Lab decision model (pure, no network or production writes).
 * Misaki selects materials; Gemini is responsible only for wording.
 * Exactly one reason is recorded per candidate, in this precedence:
 * cancelled > expired > previously-used > below-threshold > duplicate > limit.
 * Candidate identity (kind:id) must be unique within each input snapshot.
 */
export type CandidateKind = "conversation" | "memory" | "personal-life" | "external-event" | "emotion" | "relationship" | "body-clock";
export type ConversationCandidate = {
  id: string;
  kind: CandidateKind;
  text: string;
  priority: number;
  expiresAt?: string | null;
  alreadyUsed?: boolean;
  cancelled?: boolean;
};
export type ConversationDecisionRules = {
  minimumPriority: number;
  maximumSelected: number;
  suppressPreviouslyUsed: boolean;
};
export type DecisionReason = "selected" | "below-threshold" | "expired" | "cancelled" | "previously-used" | "duplicate" | "limit";
export type DecisionRecord = { candidate: ConversationCandidate; reason: DecisionReason };
export const DEFAULT_CONVERSATION_RULES: Readonly<ConversationDecisionRules> = Object.freeze({
  minimumPriority: 0,
  maximumSelected: 9,
  suppressPreviouslyUsed: true,
});
export function selectConversationMaterials(
  candidates: readonly ConversationCandidate[],
  rules: Readonly<ConversationDecisionRules> = DEFAULT_CONVERSATION_RULES,
  now: Date = new Date(),
): { selected: ConversationCandidate[]; decisions: DecisionRecord[] } {
  if (!Number.isFinite(rules.minimumPriority) || !Number.isInteger(rules.maximumSelected) || rules.maximumSelected < 0 || rules.maximumSelected > 100) {
    throw new Error("Invalid conversation decision rules");
  }
  const identities = new Set<string>();
  for (const candidate of candidates) {
    if (!Number.isFinite(candidate.priority)) throw new Error("Invalid candidate priority");
    if (!candidate.id || !candidate.id.trim()) throw new Error("Invalid candidate identity");
    const identity = candidate.kind + ":" + candidate.id;
    if (identities.has(identity)) throw new Error("Duplicate candidate identity");
    identities.add(identity);
  }
  const seen = new Set<string>();
  const decisions: DecisionRecord[] = [];
  const selected: ConversationCandidate[] = [];
  const sorted = candidates.map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => b.candidate.priority - a.candidate.priority || a.index - b.index);
  for (const { candidate } of sorted) {
    let reason: DecisionReason = "selected";
    if (candidate.cancelled) reason = "cancelled";
    else if (candidate.expiresAt && (!Number.isFinite(Date.parse(candidate.expiresAt)) || Date.parse(candidate.expiresAt) <= now.getTime())) reason = "expired";
    else if (rules.suppressPreviouslyUsed && candidate.alreadyUsed) reason = "previously-used";
    else if (!Number.isFinite(candidate.priority) || candidate.priority < rules.minimumPriority) reason = "below-threshold";
    else if (seen.has(candidate.kind + ":" + candidate.id)) reason = "duplicate";
    else if (selected.length >= rules.maximumSelected) reason = "limit";
    if (reason === "selected") {
      selected.push({ ...candidate });
      seen.add(candidate.kind + ":" + candidate.id);
    }
    decisions.push({ candidate: { ...candidate }, reason });
  }
  return { selected, decisions };
}
