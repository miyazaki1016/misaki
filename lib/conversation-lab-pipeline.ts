import { filterConversationLabScope, type ScopedConversationCandidate, type ConversationLabScope } from "./conversation-lab-scope.ts";
import { buildConversationSelectionHandoff, redactSelectionHandoff, type ConversationSelectionHandoff } from "./conversation-lab-handoff.ts";
import type { ConversationDecisionRules } from "./conversation-lab-decision.ts";

/**
 * Mandatory scope gate before material selection and Gemini handoff.
 * The caller must establish scope and provenance server-side; this pure
 * function does not authenticate a user or verify source assertions.
 */
export function prepareScopedConversationHandoff(
  source: readonly ScopedConversationCandidate[],
  scope: ConversationLabScope,
  rules: Readonly<ConversationDecisionRules>,
  metadata: Readonly<{ selectionRulesVersion: string; snapshotId: string; experimentId?: string }>,
  now: Date = new Date(),
): { handoff: ConversationSelectionHandoff; scopeRejections: { candidateId: string; reason: "different-user" | "not-visible-to-character" }[] } {
  const scoped = filterConversationLabScope(source, scope);
  const handoff = buildConversationSelectionHandoff(scoped.candidates, rules, metadata, now);
  return {
    handoff,
    scopeRejections: scoped.decisions.filter((decision): decision is typeof decision & { reason: "different-user" | "not-visible-to-character" } => !decision.allowed) .map(({ candidateId, reason }) => ({ candidateId, reason })),
  };
}

/**
 * In-memory audit envelope. Not persistence-safe until identifiers are
 * pseudonymized, access is restricted, and retention is defined.
 * Keeps scope rejections alongside redacted selection decisions.
 */
export function buildScopedConversationAudit(
  result: ReturnType<typeof prepareScopedConversationHandoff>,
  scope: ConversationLabScope,
) {
  if (!scope.ownerUserId.trim() || !scope.characterId.trim()) throw new Error("Missing lab scope");
  return {
    scope: { ownerUserId: scope.ownerUserId, characterId: scope.characterId },
    selection: redactSelectionHandoff(result.handoff),
    scopeRejections: result.scopeRejections.map(({ candidateId, reason }) => ({ candidateId, reason })),
  };
}
