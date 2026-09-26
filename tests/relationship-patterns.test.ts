import test from "node:test";
import assert from "node:assert/strict";
import { deriveRelationshipPatterns, deriveRelationshipStory } from "../lib/relationship-patterns.ts";

const event = (created_at: string, signals: Array<{name:string;strength:number;confidence:number}>) => ({
  event_type: "emotion_action_v2_after_chat",
  created_at,
  metadata: { signal_summary: signals },
});
const s = (name:string, strength:number, confidence=1) => ({ name, strength, confidence });

test("anonymous-compatible compact trajectory keeps unresolved hurt", () => {
  const events = [event("2026-09-25T00:00:00Z", [s("hurtful", .8)])];
  const story = deriveRelationshipStory(events);
  assert.equal(story.repairStage, "hurt");
  assert.equal(story.meaning, "unresolved_hurt");
  assert.ok(story.unresolvedHurt > 0);
});

test("repair words alone do not falsely complete reconciliation", () => {
  const events = [
    event("2026-09-25T00:00:00Z", [s("hurtful", .8)]),
    event("2026-09-25T01:00:00Z", [s("repair", .7)]),
  ];
  const story = deriveRelationshipStory(events);
  assert.equal(story.repairStage, "repair_attempted");
  assert.equal(story.meaning, "repair_in_progress");
  assert.ok(story.unresolvedHurt > .2);
});

test("repair followed by demonstrated care can become repaired history", () => {
  const events = [
    event("2026-09-25T00:00:00Z", [s("hurtful", .6)]),
    event("2026-09-25T01:00:00Z", [s("repair", .9)]),
    event("2026-09-25T02:00:00Z", [s("care", .9), s("trust", .7)]),
  ];
  const story = deriveRelationshipStory(events);
  const patterns = deriveRelationshipPatterns(events);
  assert.equal(story.repairStage, "rebuilding");
  assert.equal(story.meaning, "repair_demonstrated");
  assert.equal(story.unresolvedHurt, 0);
  assert.ok(patterns.reliableRepair > 0);
  assert.ok(patterns.sustainedCare > 0);
});

test("repeated harm remains visible as a pattern instead of being erased by time ordering", () => {
  const events = [
    event("2026-09-24T00:00:00Z", [s("hurtful", .7)]),
    event("2026-09-25T00:00:00Z", [s("hurtful", .7)]),
  ];
  const story = deriveRelationshipStory(events);
  const patterns = deriveRelationshipPatterns(events);
  assert.equal(story.meaning, "repeated_harm");
  assert.ok(patterns.repeatedHarm > 1);
});
