import type { RelationshipTimeContext } from "./relationship-time.ts";
import type { RelationshipSignalAssessment } from "./relationship-signal.ts";
import type { RelationshipPatternContext } from "./relationship-emotion-reducer.ts";
import {
  previewRelationshipTurn,
  createCurrentTurnActionGuide,
} from "./relationship-turn-expression.ts";

export type RelationshipConversationPreview = {
  emotion: ReturnType<typeof previewRelationshipTurn>["emotion"];
  action: ReturnType<typeof previewRelationshipTurn>["action"];
  expressionGuide: string;
};

/**
 * Read-only relationship preview for conversation naturalness validation.
 * No Supabase read/write or persistence happens here.
 */
export function previewRelationshipConversation(
  context: RelationshipTimeContext | null,
  signals: RelationshipSignalAssessment,
  patterns?: RelationshipPatternContext
): RelationshipConversationPreview {
  const state = previewRelationshipTurn(context, signals, patterns);

  return {
    ...state,
    expressionGuide: createCurrentTurnActionGuide(
      state.action,
      state.emotion.afterglow,
      state.emotion.secondary
    ),
  };
}
