import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Edge/Deno imports use npm: specifiers that Next's tsc cannot resolve.
// Characterize the actual Edge source without importing its Deno module into Node.
const source = readFileSync("supabase/functions/body-clock/proactive-decision.ts", "utf8");
const derive = source.split("export function deriveProactiveTags(")[1]?.split("export async function buildProactiveDecisionContext(")[0];
if (!derive) throw Error("Body Clock tag derivation source not found");

test("lonely and affectionate branches currently add romantic tags", () => {
  assert.match(derive, /case "lonely":[\\s\\S]*?tags\\.add\\("miss_you"\\);[\\s\\S]*?tags\\.add\\("romantic"\\);[\\s\\S]*?break;/);
  assert.match(derive, /case "affectionate":[\\s\\S]*?tags\\.add\\("affectionate"\\);[\\s\\S]*?tags\\.add\\("romantic"\\);[\\s\\S]*?break;/);
});
test("CHASE adds longing and PULL explicitly suppresses it", () => {
  assert.match(derive, /case "CHASE":[\\s\\S]*?tags\\.add\\("miss_you"\\);/);
  assert.match(derive, /case "PULL":[\\s\\S]*?tags\\.delete\\("romantic"\\);[\\s\\S]*?tags\\.delete\\("miss_you"\\);/);
});
test("TEASE adds playful and SULK removes playful", () => {
  assert.match(derive, /case "TEASE":[\\s\\S]*?tags\\.add\\("playful"\\);/);
  assert.match(derive, /case "SULK":[\\s\\S]*?tags\\.delete\\("playful"\\);/);
});
test("tag derivation signature has no relationshipStatus parameter", () => {
  const signature = source.split("export function deriveProactiveTags(")[1]?.split("): ProactiveExpressionTag[]")[0];
  assert.ok(signature);
  assert.doesNotMatch(signature, /relationshipStatus|relationship_status/);
});
