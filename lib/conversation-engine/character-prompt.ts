import { buildBaseSystemPrompt, type ResolvedBasePromptContext } from "./base-prompt.ts";
import { assertCharacterConversationScope, resolveCharacterPersona, type CharacterConversationScope, type CharacterPersonaSnapshot } from "./character-context.ts";

/** A safe, explicit bridge for a character-aware prompt without duplicating the production template.
 * This is a transitional compatibility adapter. Other fields in ResolvedBasePromptContext
 * still contain Misaki-specific rules and must NOT be reused for other characters yet.
 */
export function buildMisakiScopedBasePrompt(
  requestedScope: CharacterConversationScope,
  resolvedScope: CharacterConversationScope,
  persona: CharacterPersonaSnapshot,
  resolved: Omit<ResolvedBasePromptContext, "personaPrompt">,
): string {
  assertCharacterConversationScope(requestedScope, resolvedScope);
  if (requestedScope.characterId !== "misaki") {
    throw new Error("CHARACTER_TEMPLATE_NOT_GENERALIZED");
  }
  const verifiedPersona = resolveCharacterPersona(requestedScope.characterId, persona);
  return buildBaseSystemPrompt({ ...resolved, personaPrompt: verifiedPersona.personaPrompt });
}
