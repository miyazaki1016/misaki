import type { RelationshipTimeContext } from "./relationship-time.ts";
import type { RelationshipSignalAssessment } from "./relationship-signal.ts";
import type { RelationshipPatternContext } from "./relationship-emotion-reducer.ts";
import { previewRelationshipConversation } from "./relationship-conversation-preview.ts";
import { createRelationshipConversationPrompt } from "./relationship-conversation-prompt.ts";

export type NaturalnessScenario = {
  name: string;
  context: RelationshipTimeContext | null;
  signals: RelationshipSignalAssessment;
  patterns?: RelationshipPatternContext;
  recentConversation?: string;
  relationshipMemory?: string;
  userMessage: string;
};

export type NaturalnessScenarioPreview = {
  name: string;
  userMessage: string;
  emotion: ReturnType<typeof previewRelationshipConversation>["emotion"];
  action: ReturnType<typeof previewRelationshipConversation>["action"];
  systemPrompt: string;
};

export function buildNaturalnessScenarioPreview(
  scenario: NaturalnessScenario
): NaturalnessScenarioPreview {
  const preview = previewRelationshipConversation(
    scenario.context,
    scenario.signals,
    scenario.patterns
  );

  return {
    name: scenario.name,
    userMessage: scenario.userMessage,
    emotion: preview.emotion,
    action: preview.action,
    systemPrompt: createRelationshipConversationPrompt({
      preview,
      recentConversation: scenario.recentConversation,
      relationshipMemory: scenario.relationshipMemory,
    }),
  };
}
