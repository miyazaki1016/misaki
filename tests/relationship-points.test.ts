import test from "node:test";
import assert from "node:assert/strict";
import { deriveRelationshipPointDelta } from "../lib/relationship-points.ts";

const assessment = (signals: any[]) => ({
  signals,
  relationshipFacts: { mutualAffectionExplicit: false, datingEstablishedExplicit: false },
});

const signal = (name: string, strength: number, confidence = 1) => ({
  name, strength, confidence, evidence: "test evidence",
});

test("ordinary chat does not manufacture intimacy", () => {
  assert.equal(deriveRelationshipPointDelta(assessment([]) as any), 0);
});

test("grounded warmth can move the relationship a little", () => {
  assert.equal(deriveRelationshipPointDelta(assessment([signal("warmth", .7)]) as any), 1);
  assert.equal(deriveRelationshipPointDelta(assessment([signal("warmth", .8), signal("trust", .75)]) as any), 2);
});

test("harm can reduce relationship points", () => {
  assert.equal(deriveRelationshipPointDelta(assessment([signal("hurtful", .7)]) as any), -1);
  assert.equal(deriveRelationshipPointDelta(assessment([signal("hurtful", .8), signal("rejection", .7)]) as any), -2);
});

test("repair is meaningful but bounded", () => {
  assert.equal(deriveRelationshipPointDelta(assessment([signal("repair", .6)]) as any), 1);
  assert.equal(deriveRelationshipPointDelta(assessment([signal("repair", .95), signal("care", .5)]) as any), 2);
});


test("a healthy boundary alone does not reduce relationship points", () => {
  assert.equal(deriveRelationshipPointDelta(assessment([signal("boundary", .9)]) as any), 0);
});
