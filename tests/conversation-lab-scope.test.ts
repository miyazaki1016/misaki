import test from "node:test";
import assert from "node:assert/strict";
import { filterConversationLabScope, type ScopedConversationCandidate } from "../lib/conversation-lab-scope.ts";

const visibility = (participatingCharacterIds: string[] = [], witnessingCharacterIds: string[] = [], explicitlySharedWithCharacterIds: string[] = []) =>
  ({ participatingCharacterIds, witnessingCharacterIds, explicitlySharedWithCharacterIds });
const item = (id: string, ownerUserId: string, v: ReturnType<typeof visibility>): ScopedConversationCandidate => ({
  candidate: { id, kind: "memory", text: "SENSITIVE TEST MATERIAL " + id, priority: 5 },
  ownerUserId, visibility: v,
});
test("allows only same-user materials visible through participation, witness, or explicit share", () => {
  const source = [
    item("participant", "u1", visibility(["misaki"])),
    item("witness", "u1", visibility([], ["misaki"])),
    item("shared", "u1", visibility([], [], ["misaki"])),
    item("private", "u1", visibility(["other-character"])),
    item("other-user", "u2", visibility(["misaki"], [], ["misaki"])),
  ];
  const result = filterConversationLabScope(source, { ownerUserId: "u1", characterId: "misaki" });
  assert.deepEqual(result.candidates.map(x => x.id), ["participant", "witness", "shared"]);
  assert.deepEqual(result.decisions.map(x => x.reason), ["in-scope", "in-scope", "in-scope", "not-visible-to-character", "different-user"]);
  assert.equal(JSON.stringify(result.decisions).includes("SENSITIVE"), false);
});
test("fails closed when scope is missing and does not modify source", () => {
  const source = [item("a", "u1", visibility(["misaki"]))];
  assert.throws(() => filterConversationLabScope(source, { ownerUserId: "", characterId: "misaki" }), /Missing lab scope/);
  const result = filterConversationLabScope(source, { ownerUserId: "u1", characterId: "misaki" });
  result.candidates[0].text = "changed";
  assert.equal(source[0].candidate.text, "SENSITIVE TEST MATERIAL a");
});

test("rejects malformed visibility per item while retaining valid materials", () => {
  const broken = { ...item("broken", "u1", visibility(["misaki"])), visibility: undefined } as unknown as ScopedConversationCandidate;
  const source = [broken, item("valid", "u1", visibility(["misaki"]))];
  const result = filterConversationLabScope(source, { ownerUserId: "u1", characterId: "misaki" });
  assert.deepEqual(result.candidates.map(c => c.id), ["valid"]);
  assert.deepEqual(result.decisions.map(d => d.reason), ["malformed", "in-scope"]);
});

test("rejects non-finite priorities individually without dropping valid character-scoped materials", () => {
  const invalid = [NaN, Infinity, -Infinity].map((priority, index) => ({
    ...item("invalid-" + index, "u1", visibility(["misaki"])),
    candidate: { ...item("invalid-" + index, "u1", visibility(["misaki"])).candidate, priority },
  }));
  const source = [item("valid", "u1", visibility(["misaki"])), ...invalid];
  const result = filterConversationLabScope(source, { ownerUserId: "u1", characterId: "misaki" });
  assert.deepEqual(result.candidates.map(c => c.id), ["valid"]);
  assert.deepEqual(result.decisions.map(d => d.reason), ["in-scope", "malformed", "malformed", "malformed"]);
});
