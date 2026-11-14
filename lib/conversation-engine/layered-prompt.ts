import { resolveLayeredConversationContext, type LayeredConversationContext } from "./layered-context.ts";

/** New multi-character prompt assembly for isolated lab experiments only.
 * The existing Misaki production template remains the compatibility baseline.
 * Rules are structured as separate sections; no character may inherit Misaki's life story.
 */
export function buildLayeredConversationPrompt(
  input: LayeredConversationContext,
  requested: Readonly<{ characterId: string; userId: string }>,
): string {
  const { shared, character, relationship } = resolveLayeredConversationContext(input, requested);
  const sharedRules = shared.rules.map((rule) => rule.trim()).filter(Boolean);
  return [
    "【共通会話ルール】",
    ...sharedRules,
    "",
    "【キャラクター人格】",
    character.personaPrompt.trim(),
    "",
    "【キャラクター生活設定】",
    character.lifestyleGuide.trim(),
    "",
    "【このユーザーとの関係性】",
    relationship.relationshipGuide.trim(),
    "",
    "【このユーザーとの記憶】",
    relationship.memoryGuide.trim(),
  ].join("\n").trim();
}
