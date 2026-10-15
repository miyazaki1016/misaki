/**
 * Pure relationship acting adapter.
 *
 * The actual wording is delegated to the production shared interpreter.
 * This adapter does not persist relationship values or infer dating status.
 * It is not wired into production chat yet.
 */
import {
  createLegacyRelationshipActingState,
  createRelationshipActingGuide,
  type RelationshipActingState,
} from "../relationship-acting-guide";

export type RelationshipGuideSnapshot = Readonly<{
  points: number;
  actingState?: RelationshipActingState | null;
  engineState?: Omit<RelationshipActingState, "intimacyStage"> | null;
}>;

export function buildRelationshipActingContext(
  snapshot: RelationshipGuideSnapshot,
): string {
  const legacy = createLegacyRelationshipActingState(snapshot.points);
  const resolved: RelationshipActingState = snapshot.actingState
    ? snapshot.actingState
    : snapshot.engineState
      ? { ...snapshot.engineState, intimacyStage: legacy.intimacyStage }
      : legacy;
  return createRelationshipActingGuide(resolved);
}
