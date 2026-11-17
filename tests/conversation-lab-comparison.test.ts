import test from "node:test";
import assert from "node:assert/strict";
import { compareConversationDecisions } from "../lib/conversation-lab-comparison.ts";

test("compares the same snapshot without mutating it", () => {
  const snapshot = Object.freeze([
    Object.freeze({ id: "rain", kind: "external-event", text: "rain", priority: 4 }),
    Object.freeze({ id: "chat", kind: "conversation", text: "chat", priority: 8 }),
  ]) as any;
  const a = { minimumPriority: 5, maximumSelected: 5, suppressPreviouslyUsed: true };
  const b = { ...a, minimumPriority: 3 };
  const result = compareConversationDecisions(snapshot, a, b, new Date("2026-11-17T00:00:00Z"));
  assert.deepEqual(result.addedIds, ["external-event:rain"]);
  assert.deepEqual(result.removedIds, []);
  assert.deepEqual(result.changedReasons, [{ id: "external-event:rain", from: "below-threshold", to: "selected" }]);
  assert.equal(snapshot[0].text, "rain");
});


test("shows selected-material removal when sandbox selection limit is tightened", () => {
  const snapshot = [
    { id: "first", kind: "conversation" as const, text: "first", priority: 9 },
    { id: "second", kind: "memory" as const, text: "second", priority: 8 },
  ];
  const original = { minimumPriority: 0, maximumSelected: 2, suppressPreviouslyUsed: true };
  const experimental = { ...original, maximumSelected: 1 };
  const diff = compareConversationDecisions(snapshot, original, experimental, new Date("2026-11-17T00:00:00Z"));
  assert.deepEqual(diff.addedIds, []);
  assert.deepEqual(diff.removedIds, ["memory:second"]);
  assert.deepEqual(diff.changedReasons, [{ id: "memory:second", from: "selected", to: "limit" }]);
  assert.equal(diff.original.selected.length, 2);
  assert.equal(diff.experimental.selected.length, 1);
});

test("never selects cancelled or expired events in either variant", () => {
  const snapshot = [
    { id: "cancelled", kind: "external-event" as const, text: "cancelled", priority: 100, cancelled: true },
    { id: "expired", kind: "external-event" as const, text: "expired", priority: 99, expiresAt: "2026-11-16T00:00:00Z" },
    { id: "current", kind: "personal-life" as const, text: "current", priority: 5 },
  ];
  const a = { minimumPriority: 6, maximumSelected: 5, suppressPreviouslyUsed: true };
  const b = { ...a, minimumPriority: 0 };
  const diff = compareConversationDecisions(snapshot, a, b, new Date("2026-11-17T00:00:00Z"));
  assert.deepEqual(diff.addedIds, ["personal-life:current"]);
  assert.deepEqual(diff.experimental.selected.map(c => c.id), ["current"]);
  assert.deepEqual(diff.experimental.decisions.map(d => d.reason), ["cancelled", "expired", "selected"]);
});


test("uses namespaced candidate IDs to avoid collisions across material types", () => {
  const snapshot = [
    { id: "same", kind: "conversation" as const, text: "utterance", priority: 10 },
    { id: "same", kind: "memory" as const, text: "memory", priority: 9 },
  ];
  const a = { minimumPriority: 0, maximumSelected: 1, suppressPreviouslyUsed: true };
  const b = { ...a, maximumSelected: 2 };
  const diff = compareConversationDecisions(snapshot, a, b, new Date("2026-11-17T00:00:00Z"));
  assert.deepEqual(diff.addedIds, ["memory:same"]);
  assert.deepEqual(diff.changedReasons, [{ id: "memory:same", from: "limit", to: "selected" }]);
});

test("compares suppression of previously used materials without changing production data", () => {
  const snapshot = Object.freeze([
    Object.freeze({ id: "used", kind: "conversation" as const, text: "already sent", priority: 10, alreadyUsed: true }),
  ]);
  const a = { minimumPriority: 0, maximumSelected: 3, suppressPreviouslyUsed: true };
  const b = { ...a, suppressPreviouslyUsed: false };
  const diff = compareConversationDecisions(snapshot, a, b, new Date("2026-11-17T00:00:00Z"));
  assert.deepEqual(diff.addedIds, ["conversation:used"]);
  assert.deepEqual(diff.changedReasons, [{ id: "conversation:used", from: "previously-used", to: "selected" }]);
  assert.equal(snapshot[0].alreadyUsed, true);
});
