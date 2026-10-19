import assert from "node:assert/strict";
import { test } from "node:test";
import { createRelationshipActingGuide, type RelationshipActingState } from "../lib/relationship-acting-guide.ts";

/** Read-only experiment. Does not query Supabase or change production code. */
const AXES = ["friendship", "trust", "playfulness", "affection", "romance"] as const;
type Source = "permanent_canonical" | "temporary_verified";
type DTO = RelationshipActingState & { source: Source };
function normalize(input: unknown, source: Source): DTO | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  if (!Number.isInteger(row.intimacyStage) || Number(row.intimacyStage) < 0 || Number(row.intimacyStage) > 5) return null;
  if (row.relationshipStatus !== "none" && row.relationshipStatus !== "romantic_partner") return null;
  if (!AXES.every(a => Number.isInteger(row[a]) && Number(row[a]) >= 0 && Number(row[a]) <= 100)) return null;
  return {
    source, intimacyStage: row.intimacyStage as DTO["intimacyStage"],
    friendship: row.friendship as number, trust: row.trust as number,
    playfulness: row.playfulness as number, affection: row.affection as number,
    romance: row.romance as number, relationshipStatus: row.relationshipStatus,
  };
}
function permanent(row: Record<string, unknown>, stage: number): DTO | null {
  return normalize({ intimacyStage: stage, relationshipStatus: row.relationship_status,
    ...Object.fromEntries(AXES.map(axis => [axis, row[axis + "_score"]])) }, "permanent_canonical");
}
function anonymous(verifiedRoot: unknown, stage: number): DTO | null {
  if (!verifiedRoot || typeof verifiedRoot !== "object") return null;
  const root = verifiedRoot as { relationshipEngine?: { state?: unknown }; relationshipImportPending?: boolean; relationshipCriticalPending?: boolean };
  if (root.relationshipImportPending || root.relationshipCriticalPending) return null;
  if (!root.relationshipEngine?.state || typeof root.relationshipEngine.state !== "object") return null;
  return normalize({ ...root.relationshipEngine.state, intimacyStage: stage }, "temporary_verified");
}
const sample = { friendship: 65, trust: 80, playfulness: 30, affection: 55, romance: 90, relationshipStatus: "none" };
test("canonical permanent row and verified anonymous root yield identical acting", () => {
  const a = permanent({ ...Object.fromEntries(AXES.map(axis => [axis + "_score", sample[axis]])), relationship_status: sample.relationshipStatus }, 3);
  const b = anonymous({ relationshipEngine: { state: sample } }, 3);
  assert.ok(a && b);
  assert.equal(a.source, "permanent_canonical");
  assert.equal(b.source, "temporary_verified");
  assert.equal(createRelationshipActingGuide(a), createRelationshipActingGuide(b));
});
test("anonymous state never falls back to unrelated permanent scores", () => {
  assert.equal(anonymous({ relationshipPoints: 160 }, 5), null);
});
test("missing status and invalid axes fail closed", () => {
  assert.equal(permanent({ ...Object.fromEntries(AXES.map(axis => [axis + "_score", sample[axis]])) }, 3), null);
  assert.equal(anonymous({ relationshipEngine: { state: { ...sample, trust: -1 } } }, 3), null);
});
test("pending relationship import or critical state fails closed", () => {
  assert.equal(anonymous({ relationshipImportPending: true, relationshipEngine: { state: sample } }, 3), null);
  assert.equal(anonymous({ relationshipCriticalPending: true, relationshipEngine: { state: sample } }, 3), null);
});
test("partner status is authoritative independently of romance score", () => {
  const a = anonymous({ relationshipEngine: { state: { ...sample, romance: 0, relationshipStatus: "romantic_partner" } } }, 1);
  assert.ok(a);
  assert.match(createRelationshipActingGuide(a), /交際も会話上成立済み/);
});
