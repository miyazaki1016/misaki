import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveProactiveTags, type RelationshipAction, type RelationshipEmotion } from "../supabase/functions/body-clock/proactive-decision.ts";

/** Isolated characterization tests: existing tag derivation, not production changes. */
function tags(emotion: RelationshipEmotion, action: RelationshipAction) {
  return deriveProactiveTags({
    direction: "MISAKI", emotion, action, timeBand: "same_day",
    lifeConfidence: "none", currentTime: "2026-10-15 14:00",
  });
}
test("lonely and affectionate can emit romantic tags without relationship status input", () => {
  assert.ok(tags("lonely", "NORMAL").includes("romantic"));
  assert.ok(tags("lonely", "NORMAL").includes("miss_you"));
  assert.ok(tags("affectionate", "NORMAL").includes("romantic"));
});
test("CHASE can emit miss_you from action alone", () => {
  assert.ok(tags("neutral", "CHASE").includes("miss_you"));
});
test("PULL suppresses romance and longing even when emotion is affectionate or lonely", () => {
  for (const emotion of ["affectionate", "lonely"] as const) {
    const result = tags(emotion, "PULL");
    assert.ok(!result.includes("romantic"));
    assert.ok(!result.includes("miss_you"));
    assert.ok(result.includes("calm"));
  }
});
test("SULK removes playful but may preserve romance from affectionate emotion", () => {
  const result = tags("affectionate", "SULK");
  assert.ok(!result.includes("playful"));
  assert.ok(result.includes("romantic"));
});
test("TEASE adds playful regardless of friendship and playfulness axis", () => {
  assert.ok(tags("neutral", "TEASE").includes("playful"));
});
test("existing tag derivation has no relationshipStatus input; status must be guarded at prompt boundary", () => {
  const result = tags("affectionate", "NORMAL");
  assert.ok(result.includes("romantic"));
  // This is an architectural risk characterization, not a guarantee about generated wording.
  assert.equal(typeof result[0], "string");
});
