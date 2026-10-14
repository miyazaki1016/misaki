import assert from "node:assert/strict";
import { test } from "node:test";
import { createRelationshipActingGuide, type RelationshipActingState } from "../lib/relationship-acting-guide.ts";

/**
 * Isolated read-only DTO contract experiment.
 * Not imported by production, Body Clock or Edge Functions.
 */
type Source = "permanent_canonical" | "temporary_verified";
type ActingSnapshot = RelationshipActingState & { source: Source };
const AXES = ["friendship", "trust", "playfulness", "affection", "romance"] as const;

function checked(value: unknown, source: Source): ActingSnapshot {
  if (!value || typeof value !== "object") throw new Error("acting_snapshot_invalid");
  const row = value as Record<string, unknown>;
  const intimacyStage = row.intimacyStage;
  if (!Number.isInteger(intimacyStage) || Number(intimacyStage) < 0 || Number(intimacyStage) > 5) throw new Error("acting_intimacy_invalid");
  if (!AXES.every(axis => Number.isInteger(row[axis]) && Number(row[axis]) >= 0 && Number(row[axis]) <= 100)) throw new Error("acting_axis_invalid");
  if (row.relationshipStatus !== "none" && row.relationshipStatus !== "romantic_partner") throw new Error("acting_status_invalid");
  return { source, intimacyStage: intimacyStage as ActingSnapshot["intimacyStage"],
    friendship: row.friendship as number, trust: row.trust as number,
    playfulness: row.playfulness as number, affection: row.affection as number,
    romance: row.romance as number, relationshipStatus: row.relationshipStatus };
}
function fromPermanent(row: Record<string, unknown>, stage: ActingSnapshot["intimacyStage"]) {
  return checked({
    intimacyStage: stage, relationshipStatus: row.relationship_status,
    ...Object.fromEntries(AXES.map(axis => [axis, row[`${axis}_score`]])),
  }, "permanent_canonical");
}
function fromTemporary(root: { relationshipEngine?: { state?: unknown } }, verifiedStage: ActingSnapshot["intimacyStage"]) {
  const state = root.relationshipEngine?.state;
  if (!state || typeof state !== "object") throw new Error("temporary_relationship_missing");
  return checked({ ...state, intimacyStage: verifiedStage }, "temporary_verified");
}
const sample = { friendship: 75, trust: 60, playfulness: 45, affection: 30, romance: 90, relationshipStatus: "none" as const };
test("permanent and verified temporary roots produce the same acting guide", () => {
  const permanent = fromPermanent({
    ...Object.fromEntries(AXES.map(axis => [`${axis}_score`, sample[axis]])),
    relationship_status: sample.relationshipStatus,
  }, 2);
  const temporary = fromTemporary({ relationshipEngine: { state: { ...sample, intimacyStage: 0 } } }, 2);
  assert.equal(permanent.source, "permanent_canonical");
  assert.equal(temporary.source, "temporary_verified");
  assert.deepEqual(createRelationshipActingGuide(permanent), createRelationshipActingGuide(temporary));
});
test("high romance without partner status does not become established romance", () => {
  const state = checked({ ...sample, intimacyStage: 3 }, "temporary_verified");
  const guide = createRelationshipActingGuide(state);
  assert.match(guide, /恋人|交際/);
  assert.doesNotMatch(guide, /すでに恋人として確立/);
});
test("invalid canonical values fail closed", () => {
  for (const bad of [
    { ...sample, intimacyStage: 2, friendship: -1 },
    { ...sample, intimacyStage: 2, trust: 101 },
    { ...sample, intimacyStage: 2, affection: 1.5 },
    { ...sample, intimacyStage: 2, relationshipStatus: "unknown" },
    { ...sample, intimacyStage: 9 },
  ]) assert.throws(() => checked(bad, "permanent_canonical"));
});
test("missing verified temporary relationship must not fall back to a fabricated status", () => {
  assert.throws(() => fromTemporary({}, 0), /temporary_relationship_missing/);
});
