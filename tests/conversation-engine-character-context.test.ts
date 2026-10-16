import assert from "node:assert/strict";
import test from "node:test";
import { assertCharacterConversationScope, resolveCharacterPersona } from "../lib/conversation-engine/character-context.ts";

test("different characters can supply different versioned personas", () => {
  const a = resolveCharacterPersona("misaki", { characterId: "misaki", personaVersion: "v1", personaPrompt: "Persona A" });
  const b = resolveCharacterPersona("character-b", { characterId: "character-b", personaVersion: "v2", personaPrompt: "Persona B" });
  assert.notEqual(a.personaPrompt, b.personaPrompt);
  assert.equal(a.characterId, "misaki");
  assert.ok(Object.isFrozen(a));
});

test("persona mismatch or incomplete definition fails closed", () => {
  assert.throws(() => resolveCharacterPersona("character-b", { characterId: "misaki", personaVersion: "v1", personaPrompt: "Persona A" }), /SCOPE_MISMATCH/);
  assert.throws(() => resolveCharacterPersona("misaki", { characterId: "misaki", personaVersion: "", personaPrompt: "Persona A" }), /INCOMPLETE/);
});

test("conversation state cannot be shared across characters or users", () => {
  assert.doesNotThrow(() => assertCharacterConversationScope({ characterId: "misaki", userId: "u1" }, { characterId: "misaki", userId: "u1" }));
  assert.throws(() => assertCharacterConversationScope({ characterId: "misaki", userId: "u1" }, { characterId: "other", userId: "u1" }), /SCOPE_MISMATCH/);
  assert.throws(() => assertCharacterConversationScope({ characterId: "misaki", userId: "u1" }, { characterId: "misaki", userId: "u2" }), /SCOPE_MISMATCH/);
});
