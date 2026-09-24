import { createBasePersonaPrompt } from "./persona/fallback-persona.ts";
import type { RelationshipConversationPreview } from "./relationship-conversation-preview.ts";

export type RelationshipConversationPromptInput = {
  preview: RelationshipConversationPreview;
  recentConversation?: string;
  relationshipMemory?: string;
};

export function createRelationshipConversationPrompt(
  input: RelationshipConversationPromptInput
) {
  const recent = input.recentConversation?.trim();
  const memory = input.relationshipMemory?.trim();

  return [
    createBasePersonaPrompt("chat"),
    memory
      ? `【二人の共有履歴・記憶】
${memory}
ここにない出来事や関係事実は作らないでください。`
      : "",
    recent
      ? `【直近の会話】
${recent}`
      : "",
    input.preview.expressionGuide,
    `【検証時の返答ルール】
・上の人格と関係状態を両方守る
・感情状態や内部判定を説明しない
・ユーザーへの返答だけを書く
・基本1〜3文。LINEとして自然なら一言でもよい
・直近会話や共有履歴にない事実を補完しない
・傷・警戒・仲直り途中では、急に普段どおりの甘さへ戻さない
・ただし距離を取ることを、別れ・嫌悪・会話拒否へ勝手に拡大しない`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
