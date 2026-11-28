import test from "node:test";
import assert from "node:assert/strict";
import { prepareScopedConversationHandoff, buildScopedConversationAudit } from "../lib/conversation-lab-pipeline.ts";
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

test("audit envelope preserves scope and rejection reasons without candidate text", () => {
  const scope = { ownerUserId: "user-a", characterId: "misaki" };
  const result = prepareScopedConversationHandoff([
    candidate("allowed", "user-a", ["misaki"]),
    candidate("denied", "user-b", ["misaki"]),
  ], scope,
  { minimumPriority: 0, maximumSelected: 9, suppressPreviouslyUsed: true },
  { selectionRulesVersion: "v1", snapshotId: "s1" });
  const audit = buildScopedConversationAudit(result, scope);
  assert.deepEqual(audit.scope, scope);
  assert.deepEqual(audit.scopeRejections, [{ candidateId: "memory:denied", reason: "different-user" }]);
  assert.equal(JSON.stringify(audit).includes("PRIVATE-"), false);
  assert.equal(JSON.stringify(audit.selection).includes("PRIVATE-"), false);
  assert.throws(() => buildScopedConversationAudit(result, { ownerUserId: "", characterId: "misaki" }), /Missing lab scope/);
});

test("retains malformed rejection in audit rather than silently dropping it", () => {
  const scope = { ownerUserId: "user-a", characterId: "misaki" };
  const malformed = { ...candidate("bad", "user-a", ["misaki"]), visibility: undefined } as unknown as ScopedConversationCandidate;
  const result = prepareScopedConversationHandoff(
    [candidate("good", "user-a", ["misaki"]), malformed], scope,
    { minimumPriority: 0, maximumSelected: 9, suppressPreviouslyUsed: true },
    { selectionRulesVersion: "v1", snapshotId: "s2" },
  );
  assert.deepEqual(result.handoff.selected.map(x => x.id), ["good"]);
  assert.deepEqual(result.scopeRejections, [{ candidateId: "memory:bad", reason: "malformed" }]);
  assert.deepEqual(buildScopedConversationAudit(result, scope).scopeRejections, result.scopeRejections);
});
