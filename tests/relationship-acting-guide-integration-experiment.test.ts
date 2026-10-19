import test from "node:test";
import assert from "node:assert/strict";
import { createRelationshipActingGuide, type RelationshipActingState } from "../lib/relationship-acting-guide.ts";
import { createIntegratedActingGuideExperiment } from "../lib/relationship-acting-guide-gradual-experiment.ts";
const base: RelationshipActingState = {
  intimacyStage: 1, friendship: 0, trust: 0, playfulness: 0,
  affection: 0, romance: 0, relationshipStatus: "none",
};
for (const axis of ["friendship", "trust", "playfulness", "affection"] as const) {
  test(`integration candidate preserves baseline and adds intermediate ${axis} notes`, () => {
    const early = createIntegratedActingGuideExperiment({ ...base, [axis]: 1 });
    const middle = createIntegratedActingGuideExperiment({ ...base, [axis]: 30 });
    const later = createIntegratedActingGuideExperiment({ ...base, [axis]: 60 });
    assert.equal(early, createRelationshipActingGuide({ ...base, [axis]: 1 }));
    assert.ok(middle.startsWith(createRelationshipActingGuide({ ...base, [axis]: 30 })));
    assert.ok(later.startsWith(createRelationshipActingGuide({ ...base, [axis]: 60 })));
    assert.notEqual(early, middle);
    assert.notEqual(middle, later);
    assert.equal(createIntegratedActingGuideExperiment({ ...base, [axis]: 80 }),
      createRelationshipActingGuide({ ...base, [axis]: 80 }));
  });
}
test("integration candidate keeps explicit status and intimacy guards", () => {
  const partner = { ...base, intimacyStage: 5 as const, romance: 100, relationshipStatus: "romantic_partner" as const, trust: 60 };
  const guide = createIntegratedActingGuideExperiment(partner);
  assert.match(guide, /現在の交際状態は明示的に成立済み/);
  assert.match(guide, /かなり近い相手/);
  assert.match(guide, /交際も会話上成立済み/);
  assert.match(guide, /相談を受け止める落ち着き/);
  assert.equal(createIntegratedActingGuideExperiment({ ...partner, trust: 0 }),
    createRelationshipActingGuide({ ...partner, trust: 0 }));
});
test("no intermediate additions for 0-to-1 changes", () => {
  assert.equal(createIntegratedActingGuideExperiment(base),
    createIntegratedActingGuideExperiment({ ...base, affection: 1 }));
});
