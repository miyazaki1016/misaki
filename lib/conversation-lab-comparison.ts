import { selectConversationMaterials, type ConversationCandidate, type ConversationDecisionRules, type DecisionRecord } from "./conversation-lab-decision";

export type LabVariant = {
  rules: ConversationDecisionRules;
  selected: ConversationCandidate[];
  decisions: DecisionRecord[];
};
export type LabComparison = {
  original: LabVariant;
  experimental: LabVariant;
  addedIds: string[];
  removedIds: string[];
  changedReasons: { id: string; from: string; to: string }[];
};
/**
 * Read-only A/B decision preview. No Gemini calls, DB writes, or user-facing notifications.
 * Both variants receive the same frozen-in-time candidate snapshot.
 */
export function compareConversationDecisions(
  snapshot: readonly ConversationCandidate[],
  originalRules: Readonly<ConversationDecisionRules>,
  experimentalRules: Readonly<ConversationDecisionRules>,
  now: Date = new Date(),
): LabComparison {
  const original = selectConversationMaterials(snapshot, originalRules, now);
  const experimental = selectConversationMaterials(snapshot, experimentalRules, now);
  const identity = (c: ConversationCandidate) => c.kind + ":" + c.id;
  const a = new Set(original.selected.map(identity));
  const b = new Set(experimental.selected.map(identity));
  const originalReasons = new Map(original.decisions.map(d => [identity(d.candidate), d.reason]));
  const changedReasons = experimental.decisions.flatMap(d => {
    const id = identity(d.candidate);
    const from = originalReasons.get(id);
    return from && from !== d.reason ? [{ id, from, to: d.reason }] : [];
  });
  return {
    original: { rules: { ...originalRules }, ...original },
    experimental: { rules: { ...experimentalRules }, ...experimental },
    addedIds: [...b].filter(id => !a.has(id)),
    removedIds: [...a].filter(id => !b.has(id)),
    changedReasons,
  };
}
