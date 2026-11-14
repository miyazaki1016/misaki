import assert from "node:assert/strict";
import test from "node:test";
import { buildLayeredConversationPrompt } from "../lib/conversation-engine/layered-prompt.ts";
import type { LayeredConversationContext } from "../lib/conversation-engine/layered-context.ts";

const makeContext = (characterId: string, persona: string, lifestyle: string): LayeredConversationContext => ({
  shared: { version: "v1", rules: ["Never invent external sources.", "Respect user boundaries."] },
  character: { characterId, personaVersion: "v1", personaPrompt: persona, lifestyleGuide: lifestyle },
  relationship: { characterId, userId: "user-1", relationshipGuide: "Just met", memoryGuide: "Likes tea" },
});

test("shared policy stays stable while character identity changes", () => {
  const misaki = buildLayeredConversationPrompt(makeContext("misaki", "Misaki persona", "Misaki works at cafe"), { characterId: "misaki", userId: "user-1" });
  const other = buildLayeredConversationPrompt(makeContext("other", "Other persona", "Other studies astronomy"), { characterId: "other", userId: "user-1" });
  assert.ok(misaki.includes("Never invent external sources."));
  assert.ok(other.includes("Never invent external sources."));
  assert.ok(misaki.includes("Misaki works at cafe"));
  assert.ok(!other.includes("Misaki works at cafe"));
  assert.ok(other.includes("Other studies astronomy"));
  assert.ok(!misaki.includes("Other studies astronomy"));
});

test("different user's relationship context is rejected", () => {
  assert.throws(() => buildLayeredConversationPrompt(makeContext("misaki", "Persona", "Lifestyle"), { characterId: "misaki", userId: "user-2" }), /SCOPE_MISMATCH/);
});

test("empty optional lifestyle and memory sections do not invent content", () => {
  const context = makeContext("other", "Other persona", "");
  const result = buildLayeredConversationPrompt({ ...context, relationship: { ...context.relationship, memoryGuide: "" } }, { characterId: "other", userId: "user-1" });
  assert.ok(result.includes("Other persona"));
  assert.ok(!result.includes("Misaki"));
});
