import { selectConversationMaterials, type ConversationCandidate, type ConversationDecisionRules, type DecisionReason } from "./conversation-lab-decision.ts";

/** Read-only, versioned handoff from Misaki material selection to Gemini wording. */
export const CONVERSATION_LAB_SCHEMA_VERSION = 1 as const;
export type MaterialDecisionSummary = {
  candidateId: string;
  kind: ConversationCandidate["kind"];
  priority: number;
  reason: DecisionReason;
};
export type ConversationSelectionHandoff = {
  schemaVersion: typeof CONVERSATION_LAB_SCHEMA_VERSION;
  selectionRulesVersion: string;
  snapshotId: string;
  experimentId?: string;
  selected: ConversationCandidate[];
  decisions: MaterialDecisionSummary[];
};
export function buildConversationSelectionHandoff(
  candidates: readonly ConversationCandidate[],
  rules: Readonly<ConversationDecisionRules>,
  metadata: Readonly<{ selectionRulesVersion: string; snapshotId: string; experimentId?: string }>,
  now: Date = new Date(),
): ConversationSelectionHandoff {
  if (!metadata.selectionRulesVersion.trim() || !metadata.snapshotId.trim() ||
      (metadata.experimentId !== undefined && !metadata.experimentId.trim())) {
    throw new Error("Missing conversation selection handoff metadata");
  }
  const result = selectConversationMaterials(candidates, rules, now);
  return {
    schemaVersion: CONVERSATION_LAB_SCHEMA_VERSION,
    selectionRulesVersion: metadata.selectionRulesVersion,
    snapshotId: metadata.snapshotId,
    ...(metadata.experimentId === undefined ? {} : { experimentId: metadata.experimentId }),
    selected: result.selected,
    decisions: result.decisions.map(({ candidate, reason }) => ({
      candidateId: candidate.kind + ":" + candidate.id,
      kind: candidate.kind,
      priority: candidate.priority,
      reason,
    })),
  };
}
/** For persistence/logging: omit all conversation text and selection payloads by default. */
export function redactSelectionHandoff(handoff: Readonly<ConversationSelectionHandoff>) {
  return {
    schemaVersion: handoff.schemaVersion,
    selectionRulesVersion: handoff.selectionRulesVersion,
    snapshotId: handoff.snapshotId,
    ...(handoff.experimentId === undefined ? {} : { experimentId: handoff.experimentId }),
    selectedIds: handoff.selected.map(c => c.kind + ":" + c.id),
    decisions: handoff.decisions.map(d => ({ ...d })),
  };
}
