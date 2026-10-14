import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
const canonicalState = fs.readFileSync(new URL("../lib/canonical-state.ts", import.meta.url), "utf8");

test("authenticated chat wires canonical DB relationship state into the Gemini system instruction", () => {
  assert.match(route, /loadCanonicalState\(userData\.user\.id\)/);
  assert.match(canonicalState, /from\("misaki_relationship_state"\)\.select\("\*"\)\.eq\("user_id", userId\)\.maybeSingle\(\)/);
  assert.match(canonicalState, /relationshipActingState:\s*engineEnabled\(\) && relationship\.data\s*\?\s*canonicalActingState\(relationship\.data/);
  assert.match(route, /createRelationshipActingGuide\(\s*rootState\.relationshipActingState/);
  assert.match(route, /\$\{relationshipActingGuide\}/);
  assert.match(route, /systemInstruction:\s*baseSystemPrompt\s*\+/);
  assert.match(route, /generateGeminiJson\(\{/);
});

test("legacy relationship guidance is disabled while the canonical engine flag is enabled", () => {
  assert.match(route, /const relationshipGuide = engineEnabled\(\) \? \"\"\s*:\s*createRelationshipGuide\(/);
});
