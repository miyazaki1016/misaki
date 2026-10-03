import test from "node:test";
import assert from "node:assert/strict";
import { ACTING_LAB_PROFILES, createLegacyRelationshipActingState, createRelationshipActingGuide } from "../lib/relationship-acting-guide.ts";

test("acting profiles never establish dating implicitly", () => {
  const guide = createRelationshipActingGuide(ACTING_LAB_PROFILES.E);
  assert.match(guide, /交際は成立していない/);
  assert.match(guide, /既成事実化/);
});

test("acting guide never exposes numeric scores", () => {
  const guide = createRelationshipActingGuide(ACTING_LAB_PROFILES.D);
  assert.doesNotMatch(guide, /\b55\b|\b90\b|\b95\b/);
});

test("low romance does not turn closeness into romance", () => {
  const guide = createRelationshipActingGuide(ACTING_LAB_PROFILES.C);
  assert.match(guide, /親しさや優しさを恋愛表現へ変換しない/);
});

test("time alone cannot invent relationship emotion", () => {
  const guide = createRelationshipActingGuide(ACTING_LAB_PROFILES.D);
  assert.match(guide, /時間が経ったことだけを理由に/);
});


test("legacy points map only to conservative intimacy stages", () => {
  assert.equal(createLegacyRelationshipActingState(0).intimacyStage, 0);
  assert.equal(createLegacyRelationshipActingState(29).intimacyStage, 0);
  assert.equal(createLegacyRelationshipActingState(30).intimacyStage, 2);
  assert.equal(createLegacyRelationshipActingState(79).intimacyStage, 2);
  assert.equal(createLegacyRelationshipActingState(80).intimacyStage, 4);
  assert.equal(createLegacyRelationshipActingState(159).intimacyStage, 4);
  assert.equal(createLegacyRelationshipActingState(160).intimacyStage, 5);
});

test("legacy points never invent relationship direction or dating status", () => {
  const state = createLegacyRelationshipActingState(9999);
  assert.deepEqual(
    {
      friendship: state.friendship,
      trust: state.trust,
      playfulness: state.playfulness,
      affection: state.affection,
      romance: state.romance,
      relationshipStatus: state.relationshipStatus,
    },
    {
      friendship: 0,
      trust: 0,
      playfulness: 0,
      affection: 0,
      romance: 0,
      relationshipStatus: "none",
    }
  );

  const guide = createRelationshipActingGuide(state);
  assert.match(guide, /恋愛方向は弱い/);
  assert.doesNotMatch(guide, /交際も会話上成立済み/);
});
