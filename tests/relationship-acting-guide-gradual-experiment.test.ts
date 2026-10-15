import test from "node:test";
import assert from "node:assert/strict";
import { createGradualActingGuide } from "../lib/relationship-acting-guide-gradual-experiment.ts";
import type { RelationshipActingState } from "../lib/relationship-acting-guide.ts";

const base: RelationshipActingState = {
  intimacyStage: 2, friendship: 0, trust: 0, playfulness: 0,
  affection: 0, romance: 0, relationshipStatus: "none",
};
const axes = ["friendship", "trust", "playfulness", "affection"] as const;
for (const axis of axes) {
  test(`gradual ${axis}: intermediate growth is visible without 0-to-1 jump`, () => {
    const at = (n: number) => createGradualActingGuide({ ...base, [axis]: n });
    assert.equal(at(0), at(1));
    assert.notEqual(at(0), at(20));
    assert.notEqual(at(20), at(50));
    assert.notEqual(at(50), at(80));
    assert.equal(at(50), at(79));
  });
}
test("romance is not allowed to establish relationship status", () => {
  const single = createGradualActingGuide({ ...base, romance: 100 });
  assert.match(single, /交際は未成立/);
  assert.match(single, /恋人扱いしない/);
  const partner = createGradualActingGuide({ ...base, romance: 0, relationshipStatus: "romantic_partner" });
  assert.match(partner, /交際は明示的に成立済み/);
  assert.equal(partner, createGradualActingGuide({ ...base, romance: 100, relationshipStatus: "romantic_partner" }));
});
test("low scores never fabricate relationship history", () => {
  const guide = createGradualActingGuide(base);
  assert.match(guide, /推測で作らない/);
  assert.match(guide, /共通の歴史を知っている前提で話さない/);
});
