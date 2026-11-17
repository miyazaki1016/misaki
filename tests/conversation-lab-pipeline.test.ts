import test from "node:test";
import assert from "node:assert/strict";
import { prepareScopedConversationHandoff } from "../lib/conversation-lab-pipeline.ts";
import type { ScopedConversationCandidate } from "../lib/conversation-lab-scope.ts";

const candidate = (id: string, ownerUserId: string, visible: string[]): ScopedConversationCandidate => ({
  candidate: { kind: "memory", id, text: "PRIVATE-" + id, priority: 10 },
  ownerUserId,
  visibility: { participatingCharacterIds: visible, witnessingCharacterIds: [], explicitlySharedWithCharacterIds: [] },
});
test("never passes cross-user or non-visible materials into Gemini handoff", () => {
  const result = prepareScopedConversationHandoff([
    candidate("allowed", "user-a", ["misaki"]),
    candidate("other-user", "user-b", ["misaki"]),
    candidate("private", "user-a", ["someone-else"]),
  ], { ownerUserId: "user-a", characterId: "misaki" },
  { minimumPriority: 0, maximumSelected: 9, suppressPreviouslyUsed: true },
  { selectionRulesVersion: "v1", snapshotId: "s1" });
  assert.deepEqual(result.handoff.selected.map(x => x.id), ["allowed"]);
  assert.deepEqual(result.handoff.decisions.map(x => x.candidateId), ["memory:allowed"]);
  assert.deepEqual(result.scopeRejections, [
    { candidateId: "memory:other-user", reason: "different-user" },
    { candidateId: "memory:private", reason: "not-visible-to-character" },
  ]);
  assert.equal(JSON.stringify(result.scopeRejections).includes("PRIVATE"), false);
});
test("fails closed when owner scope is absent", () => {
  assert.throws(() => prepareScopedConversationHandoff(
    [candidate("a", "user-a", ["misaki"])],
    { ownerUserId: "", characterId: "misaki" },
    { minimumPriority: 0, maximumSelected: 9, suppressPreviouslyUsed: true },
    { selectionRulesVersion: "v1", snapshotId: "s1" },
  ), /Missing lab scope/);
});
