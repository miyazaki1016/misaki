import test from "node:test";
import assert from "node:assert/strict";
import { buildConversationSelectionHandoff, redactSelectionHandoff } from "../lib/conversation-lab-handoff.ts";

const rules = { minimumPriority: 5, maximumSelected: 3, suppressPreviouslyUsed: true };
test("versioned handoff provides selected payload only in-memory and reason metadata", () => {
  const candidates = [
    { id: "c1", kind: "conversation" as const, text: "PRIVATE TEST UTTERANCE", priority: 8 },
    { id: "e1", kind: "external-event" as const, text: "PRIVATE TEST EVENT", priority: 2 },
  ];
  const handoff = buildConversationSelectionHandoff(candidates, rules, { selectionRulesVersion: "v1", snapshotId: "snapshot-1", experimentId: "experiment-1" }, new Date("2026-11-17T00:00:00Z"));
  assert.equal(handoff.schemaVersion, 1);
  assert.equal(handoff.selected[0].text, "PRIVATE TEST UTTERANCE");
  assert.deepEqual(handoff.decisions.map(d => [d.candidateId, d.reason]), [["conversation:c1", "selected"], ["external-event:e1", "below-threshold"]]);
  const logged = redactSelectionHandoff(handoff);
  assert.deepEqual(logged.selectedIds, ["conversation:c1"]);
  assert.equal(JSON.stringify(logged).includes("PRIVATE TEST"), false);
  assert.equal(JSON.stringify(logged).includes('"text"'), false);
  assert.equal(candidates.length, 2);
});
test("normal operation needs no experiment ID; invalid metadata fails closed", () => {
  const handoff = buildConversationSelectionHandoff([], rules, { selectionRulesVersion: "v1", snapshotId: "s1" });
  assert.equal("experimentId" in handoff, false);
  assert.throws(() => buildConversationSelectionHandoff([], rules, { selectionRulesVersion: "", snapshotId: "s1" }), /metadata/);
  assert.throws(() => buildConversationSelectionHandoff([], rules, { selectionRulesVersion: "v1", snapshotId: "s1", experimentId: " " }), /metadata/);
});
