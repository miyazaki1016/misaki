/**
 * Three distinct sources of conversational context.
 *
 * This is a structural contract, not a production prompt migration.
 * In particular, the current Misaki template remains character-specific.
 */
export type SharedConversationPolicy = Readonly<{
  version: string;
  rules: readonly string[];
}>;

export type CharacterIdentityContext = Readonly<{
  characterId: string;
  personaVersion: string;
  personaPrompt: string;
  lifestyleGuide: string;
}>;

export type CharacterUserRelationshipContext = Readonly<{
  characterId: string;
  userId: string;
  relationshipGuide: string;
  memoryGuide: string;
}>;

export type LayeredConversationContext = Readonly<{
  shared: SharedConversationPolicy;
  character: CharacterIdentityContext;
  relationship: CharacterUserRelationshipContext;
}>;

export function resolveLayeredConversationContext(
  context: LayeredConversationContext,
  requested: Readonly<{ characterId: string; userId: string }>,
): LayeredConversationContext {
  if (!requested.characterId || !requested.userId ||
    context.character.characterId !== requested.characterId ||
    context.relationship.characterId !== requested.characterId ||
    context.relationship.userId !== requested.userId) {
    throw new Error("LAYERED_CONVERSATION_SCOPE_MISMATCH");
  }
  if (!context.shared.version.trim() || !context.character.personaVersion.trim() ||
    !context.character.personaPrompt.trim()) {
    throw new Error("LAYERED_CONVERSATION_REQUIRED_CONTEXT_MISSING");
  }
  return context;
}

/** An explicit audit view: never concatenate layers into the old Misaki template
 * for another character. Actual general-purpose prompt formatting is a later gate.
 */
export function inspectConversationLayers(context: LayeredConversationContext) {
  return {
    sharedPolicyVersion: context.shared.version,
    characterId: context.character.characterId,
    personaVersion: context.character.personaVersion,
    relationshipScopedTo: {
      characterId: context.relationship.characterId,
      userId: context.relationship.userId,
    },
    sharedRuleCount: context.shared.rules.length,
  };
}
