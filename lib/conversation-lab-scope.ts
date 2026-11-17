/**
 * Conversation Lab intake boundary for a future real-data adapter.
 * Deny by default: candidates cannot cross user boundaries, and character
 * visibility requires participation, witnessing, or explicit sharing.
 * Pure function only; caller must verify the provenance of scope assertions.
 */
import type { ConversationCandidate } from "./conversation-lab-decision.ts";

export type ScopedConversationCandidate = {
  candidate: ConversationCandidate;
  ownerUserId: string;
  visibility: Readonly<{
    participatingCharacterIds: readonly string[];
    witnessingCharacterIds: readonly string[];
    explicitlySharedWithCharacterIds: readonly string[];
  }>;
};
export type ConversationLabScope = Readonly<{
  ownerUserId: string;
  characterId: string;
}>;
export type ScopeRejection = "different-user" | "not-visible-to-character";
export type ScopeDecision = {
  candidateId: string;
  allowed: boolean;
  reason: "in-scope" | ScopeRejection;
};
export function filterConversationLabScope(
  source: readonly ScopedConversationCandidate[],
  scope: ConversationLabScope,
): { candidates: ConversationCandidate[]; decisions: ScopeDecision[] } {
  if (!scope.ownerUserId.trim() || !scope.characterId.trim()) throw new Error("Missing lab scope");
  const candidates: ConversationCandidate[] = [];
  const decisions: ScopeDecision[] = [];
  for (const item of source) {
    const candidateId = item.candidate.kind + ":" + item.candidate.id;
    const sameUser = item.ownerUserId === scope.ownerUserId;
    const visible = item.visibility.participatingCharacterIds.includes(scope.characterId) ||
      item.visibility.witnessingCharacterIds.includes(scope.characterId) ||
      item.visibility.explicitlySharedWithCharacterIds.includes(scope.characterId);
    const reason = !sameUser ? "different-user" : !visible ? "not-visible-to-character" : "in-scope";
    if (reason === "in-scope") candidates.push({ ...item.candidate });
    decisions.push({ candidateId, allowed: reason === "in-scope", reason });
  }
  return { candidates, decisions };
}
