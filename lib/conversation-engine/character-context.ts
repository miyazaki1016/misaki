/** Character-aware input boundary for the shared conversation engine.
 * Design-only adapter: no DB writes, character switching, or production wiring.
 */
export type CharacterPersonaSnapshot = Readonly<{
  characterId: string;
  personaVersion: string;
  personaPrompt: string;
}>;

export type CharacterConversationScope = Readonly<{
  characterId: string;
  userId: string;
}>;

export function resolveCharacterPersona(
  requestedCharacterId: string,
  snapshot: CharacterPersonaSnapshot,
): CharacterPersonaSnapshot {
  if (!requestedCharacterId || !snapshot.characterId || requestedCharacterId !== snapshot.characterId) {
    throw new Error("CHARACTER_PERSONA_SCOPE_MISMATCH");
  }
  if (!snapshot.personaVersion.trim() || !snapshot.personaPrompt.trim()) {
    throw new Error("CHARACTER_PERSONA_INCOMPLETE");
  }
  return Object.freeze({ ...snapshot });
}

/** Reject cross-character history/memory retrieval before building a prompt. */
export function assertCharacterConversationScope(
  requested: CharacterConversationScope,
  resolved: CharacterConversationScope,
): void {
  if (!requested.userId || !requested.characterId || requested.userId !== resolved.userId || requested.characterId !== resolved.characterId) {
    throw new Error("CHARACTER_CONVERSATION_SCOPE_MISMATCH");
  }
}
