import assert from "node:assert/strict";
import test from "node:test";
import { buildMisakiScopedBasePrompt } from "../lib/conversation-engine/character-prompt.ts";
import type { ResolvedBasePromptContext } from "../lib/conversation-engine/base-prompt.ts";

const resolved = Object.fromEntries([
  "relationshipGuide", "relationshipActingGuide", "pendingRelationshipGuide",
  "userProfileGuide", "lifeUnderstandingGuide", "relationshipTimeGuide",
  "relationshipSignalGuide", "taxiContextGuide", "misakiLife",
  "activityGroundingGuide", "safeCurrentTime", "timeGuide", "weatherGuide",
  "weatherHistoryGuide", "tokyoLifeEventsGuide", "todayMemoryGuide",
  "recentTopicText", "memoryText", "currentDate",
].map((key) => [key, "fixture-" + key])) as Omit<ResolvedBasePromptContext, "personaPrompt">;

test("Misaki can use scoped persona with existing template", () => {
  const scope = { characterId: "misaki", userId: "u1" };
  const prompt = buildMisakiScopedBasePrompt(scope, scope, { characterId: "misaki", personaVersion: "v1", personaPrompt: "MISAKI_PERSONA" }, resolved);
  assert.ok(prompt.startsWith("MISAKI_PERSONA"));
});

test("non-Misaki characters fail closed until template is generalized", () => {
  const scope = { characterId: "other", userId: "u1" };
  assert.throws(() => buildMisakiScopedBasePrompt(scope, scope, { characterId: "other", personaVersion: "v1", personaPrompt: "OTHER_PERSONA" }, resolved), /NOT_GENERALIZED/);
});

test("cross-user scope mismatch fails before prompt generation", () => {
  assert.throws(() => buildMisakiScopedBasePrompt({ characterId: "misaki", userId: "u1" }, { characterId: "misaki", userId: "u2" }, { characterId: "misaki", personaVersion: "v1", personaPrompt: "MISAKI_PERSONA" }, resolved), /SCOPE_MISMATCH/);
});
