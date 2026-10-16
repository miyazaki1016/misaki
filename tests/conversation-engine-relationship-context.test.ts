import test from "node:test";
import assert from "node:assert/strict";
import {
  createLegacyRelationshipActingState,
  createRelationshipActingGuide,
} from "../lib/relationship-acting-guide.ts";
import { buildRelationshipActingContext } from "../lib/conversation-engine/relationship-context.ts";

test("legacy relationship context uses existing production interpreter exactly", () => {
  for (const points of [0, 29, 30, 79, 80, 159, 160, 999]) {
    assert.equal(
      buildRelationshipActingContext({ points }),
      createRelationshipActingGuide(createLegacyRelationshipActingState(points)),
    );
  }
});

test("explicit acting state overrides legacy points and preserves established partner", () => {
  const state = {
    intimacyStage: 3 as const,
    friendship: 70, trust: 90, playfulness: 50, affection: 80, romance: 70,
    relationshipStatus: "romantic_partner" as const,
  };
  assert.equal(
    buildRelationshipActingContext({ points: 0, actingState: state }),
    createRelationshipActingGuide(state),
  );
});

test("engine state inherits legacy stage without inventing relationship status", () => {
  const engineState = {
    friendship: 80, trust: 90, playfulness: 70, affection: 75, romance: 95,
  };
  const guide = buildRelationshipActingContext({ points: 160, engineState });
  assert.equal(
    guide,
    createRelationshipActingGuide({
      ...engineState,
      intimacyStage: 5,
    }),
  );
  assert.match(guide, /交際状態は未成立/);
  assert.doesNotMatch(guide, /現在の交際状態は明示的に成立済み/);
});
