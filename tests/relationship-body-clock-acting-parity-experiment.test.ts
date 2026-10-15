import assert from "node:assert/strict";
import { test } from "node:test";
import { createRelationshipActingGuide, type RelationshipActingState } from "../lib/relationship-acting-guide.ts";

/**
 * Isolated Body Clock parity adapter experiment.
 * Pure data only: no DB, Edge, Gemini, token decoding, or production import.
 */
type Axis = "friendship" | "trust" | "playfulness" | "affection" | "romance";
const axes: Axis[] = ["friendship", "trust", "playfulness", "affection", "romance"];
const sample = { friendship: 55, trust: 80, playfulness: 35, affection: 65, romance: 85, relationshipStatus: "none" as const };
function strictState(value: unknown, intimacyStage: RelationshipActingState["intimacyStage"]): RelationshipActingState {
  if (!value || typeof value !== "object") throw Error("missing_relationship");
  const v = value as Record<string, unknown>;
  if (!axes.every(axis => Number.isInteger(v[axis]) && Number(v[axis]) >= 0 && Number(v[axis]) <= 100)) throw Error("invalid_axis");
  if (v.relationshipStatus !== "none" && v.relationshipStatus !== "romantic_partner") throw Error("invalid_status");
  if (!Number.isInteger(intimacyStage) || intimacyStage < 0 || intimacyStage > 5) throw Error("invalid_stage");
  return { intimacyStage, friendship: v.friendship as number, trust: v.trust as number,
    playfulness: v.playfulness as number, affection: v.affection as number,
    romance: v.romance as number, relationshipStatus: v.relationshipStatus };
}
function permanent(row: Record<string, unknown>, stage: RelationshipActingState["intimacyStage"]) {
  return strictState({
    ...Object.fromEntries(axes.map(axis => [axis, row[`${axis}_score`]])),
    relationshipStatus: row.relationship_status,
  }, stage);
}
function anonymous(verifiedTemporaryState: unknown, stage: RelationshipActingState["intimacyStage"]) {
  if (!verifiedTemporaryState || typeof verifiedTemporaryState !== "object") throw Error("invalid_temporary");
  const root = verifiedTemporaryState as { relationshipEngine?: { state?: unknown } };
  return strictState(root.relationshipEngine?.state, stage);
}
test("Body Clock permanent and verified anonymous sources yield identical guide", () => {
  const row = { ...Object.fromEntries(axes.map(axis => [`${axis}_score`, sample[axis]])), relationship_status: sample.relationshipStatus };
  const tokenRoot = { relationshipEngine: { state: { ...sample, intimacyStage: 5 } } };
  const p = createRelationshipActingGuide(permanent(row, 3));
  const a = createRelationshipActingGuide(anonymous(tokenRoot, 3));
  assert.equal(p, a);
  assert.match(a, /交際状態は未成立/);
});
test("partner status overrides high romance interpretation in both channels", () => {
  const partner = { ...sample, relationshipStatus: "romantic_partner" };
  const row = { ...Object.fromEntries(axes.map(axis => [`${axis}_score`, partner[axis]])), relationship_status: partner.relationshipStatus };
  assert.equal(createRelationshipActingGuide(permanent(row, 4)),
    createRelationshipActingGuide(anonymous({ relationshipEngine: { state: partner } }, 4)));
});
test("Body Clock fails closed if temporary engine, status, or axis missing", () => {
  assert.throws(() => anonymous({ relationshipPoints: 300 }, 5), /missing_relationship/);
  assert.throws(() => anonymous({ relationshipEngine: { state: { ...sample, relationshipStatus: undefined } } }, 3), /invalid_status/);
  assert.throws(() => anonymous({ relationshipEngine: { state: { ...sample, trust: undefined } } }, 3), /invalid_axis/);
});
test("legacy points alone cannot manufacture a relationship status", () => {
  assert.throws(() => permanent({ intimacy_points: 300 }, 5), /invalid_axis/);
});
