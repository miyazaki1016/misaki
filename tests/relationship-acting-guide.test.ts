import test from "node:test";
import assert from "node:assert/strict";
import { ACTING_LAB_PROFILES, createRelationshipActingGuide } from "../lib/relationship-acting-guide.ts";

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
