import type { RelationshipSignalAssessment } from "./relationship-signal";

function weight(assessment: RelationshipSignalAssessment, names: string[]) {
  return assessment.signals
    .filter((signal) => names.includes(signal.name))
    .reduce((sum, signal) => sum + signal.strength * signal.confidence, 0);
}

/**
 * Relationship points are a consequence of what happened in the conversation.
 * Ordinary chat is deliberately 0: message count is not intimacy.
 * Keep one turn bounded so a single dramatic message cannot manufacture a relationship.
 */
export function deriveRelationshipPointDelta(assessment: RelationshipSignalAssessment) {
  const positive = weight(assessment, ["warmth", "care", "trust", "openness", "shared_history"]);
  const romantic = weight(assessment, ["romantic"]);
  // A boundary is not harm by itself. Saying "that is not okay for me" must not
  // punish the relationship; actual hurt/rejection is represented separately.
  const harm = weight(assessment, ["hurtful", "rejection"]);
  const repair = weight(assessment, ["apology", "repair"]);

  if (harm >= 1.2) return -2;
  if (harm >= 0.45) return -1;

  // Repair matters, but an apology alone must not become a farming mechanic.
  if (repair >= 0.9 && positive >= 0.35) return 2;
  if (repair >= 0.5) return 1;

  if (positive + romantic >= 1.45) return 2;
  if (positive + romantic >= 0.55) return 1;

  return 0;
}
