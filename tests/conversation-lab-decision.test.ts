import assert from "node:assert/strict";
import test from "node:test";
import { selectConversationMaterials } from "../lib/conversation-lab-decision.ts";

test("selects by priority with a stable tie-break and explains every exclusion", () => {
  const source = [
    { id: "old", kind: "external-event", text: "old", priority: 10, expiresAt: "2026-01-01T00:00:00Z" },
    { id: "a", kind: "memory", text: "first", priority: 8 },
    { id: "a", kind: "memory", text: "duplicate", priority: 8 },
    { id: "b", kind: "emotion", text: "second", priority: 8 },
    { id: "used", kind: "external-event", text: "used", priority: 9, alreadyUsed: true },
    { id: "cancel", kind: "external-event", text: "cancel", priority: 11, cancelled: true },
    { id: "low", kind: "memory", text: "low", priority: 1 },
  ] as const;
  const original = JSON.stringify(source);
  const result = selectConversationMaterials(source, { minimumPriority: 5, maximumSelected: 2, suppressPreviouslyUsed: true }, new Date("2026-11-17T00:00:00Z"));
  assert.deepEqual(result.selected.map((x) => x.text), ["first", "second"]);
  assert.deepEqual(result.decisions.map((x) => x.reason), ["cancelled", "expired", "previously-used", "selected", "duplicate", "selected", "below-threshold"]);
  assert.equal(JSON.stringify(source), original);
});
test("a lab rule change does not mutate source and can produce a different selection", () => {
  const candidates = [{ id: "1", kind: "memory", text: "memory", priority: 2 }] as const;
  assert.equal(selectConversationMaterials(candidates, { minimumPriority: 3, maximumSelected: 9, suppressPreviouslyUsed: true }).selected.length, 0);
  assert.equal(selectConversationMaterials(candidates, { minimumPriority: 1, maximumSelected: 9, suppressPreviouslyUsed: true }).selected.length, 1);
});
test("invalid rules fail closed", () => {
  assert.throws(() => selectConversationMaterials([], { minimumPriority: 0, maximumSelected: -1, suppressPreviouslyUsed: true }));
});
