import assert from "node:assert/strict";
import test from "node:test";
import {
  RELATIONSHIP_SIGNAL_NAMES,
  sanitizeRelationshipSignalAssessment,
} from "../lib/relationship-signal.ts";

test("accepts grounded high-confidence signals", () => {
  const result = sanitizeRelationshipSignalAssessment({
    signals: [{
      name: "repair",
      strength: 0.8,
      confidence: 0.9,
      evidence: "さっきは言いすぎた。ごめん",
    }],
    relationshipFacts: {
      mutualAffectionExplicit: false,
      datingEstablishedExplicit: false,
    },
  });

  assert.deepEqual(result.signals, [{
    name: "repair",
    strength: 0.8,
    confidence: 0.9,
    evidence: "さっきは言いすぎた。ごめん",
  }]);
});

test("drops unknown, weak, ungrounded and low-confidence signals", () => {
  const result = sanitizeRelationshipSignalAssessment({
    signals: [
      { name: "romantic", strength: 0.9, confidence: 0.4, evidence: "好き" },
      { name: "magic", strength: 1, confidence: 1, evidence: "x" },
      { name: "warmth", strength: 0.8, confidence: 0.9, evidence: "" },
      { name: "care", strength: 0, confidence: 1, evidence: "大丈夫？" },
    ],
  });
  assert.deepEqual(result.signals, []);
});

test("relationship facts require literal booleans and never derive from signals", () => {
  const result = sanitizeRelationshipSignalAssessment({
    signals: [{ name: "romantic", strength: 1, confidence: 1, evidence: "大好き" }],
    relationshipFacts: {
      mutualAffectionExplicit: "true",
      datingEstablishedExplicit: 1,
    },
  });

  assert.equal(result.relationshipFacts.mutualAffectionExplicit, false);
  assert.equal(result.relationshipFacts.datingEstablishedExplicit, false);
  assert.equal(result.signals[0]?.name, "romantic");
});

test("signal vocabulary stays deliberately small", () => {
  assert.deepEqual(RELATIONSHIP_SIGNAL_NAMES, [
    "warmth", "care", "trust", "openness", "shared_history", "romantic",
    "hurtful", "rejection", "apology", "repair", "concern", "boundary",
  ]);
});
