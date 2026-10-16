import assert from "node:assert/strict";
import test from "node:test";
import { inspectConversationLayers, resolveLayeredConversationContext, type LayeredConversationContext } from "../lib/conversation-engine/layered-context.ts";

const fixture: LayeredConversationContext = {
  shared: { version: "v1", rules: ["No invented facts"] },
  character: { characterId: "misaki", personaVersion: "v2", personaPrompt: "Warm character", lifestyleGuide: "Day off" },
  relationship: { characterId: "misaki", userId: "u1", relationshipGuide: "Friend", memoryGuide: "Remember tea" },
};

test("three layers remain distinct and inspectable", () => {
  const resolved = resolveLayeredConversationContext(fixture, { characterId: "misaki", userId: "u1" });
  assert.equal(resolved.shared.rules[0], "No invented facts");
  assert.equal(resolved.character.lifestyleGuide, "Day off");
  assert.equal(resolved.relationship.memoryGuide, "Remember tea");
  assert.deepEqual(inspectConversationLayers(resolved), {
    sharedPolicyVersion: "v1",
    characterId: "misaki",
    personaVersion: "v2",
    relationshipScopedTo: { characterId: "misaki", userId: "u1" },
    sharedRuleCount: 1,
  });
});

test("relationship and character scopes cannot diverge", () => {
  assert.throws(() => resolveLayeredConversationContext({
    ...fixture, relationship: { ...fixture.relationship, characterId: "other" },
  }, { characterId: "misaki", userId: "u1" }), /SCOPE_MISMATCH/);
  assert.throws(() => resolveLayeredConversationContext(fixture, { characterId: "misaki", userId: "u2" }), /SCOPE_MISMATCH/);
});

test("missing shared policy or persona version is rejected", () => {
  assert.throws(() => resolveLayeredConversationContext({
    ...fixture, shared: { ...fixture.shared, version: "" },
  }, { characterId: "misaki", userId: "u1" }), /REQUIRED_CONTEXT_MISSING/);
});
