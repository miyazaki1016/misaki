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
