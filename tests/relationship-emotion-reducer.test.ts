import assert from "node:assert/strict";
import test from "node:test";
import { reduceRelationshipEmotion } from "../lib/relationship-emotion-reducer.ts";

const assessment = (signals = []) => ({
  signals,
  relationshipFacts: {
    mutualAffectionExplicit: false,
    datingEstablishedExplicit: false,
  },
});

test("three quiet days do not turn affection into loneliness", () => {
  const next = reduceRelationshipEmotion({
    previous: { primary: "affectionate", intensity: 52 },
    signals: assessment(),
    elapsedHours: 72,
    intimacyLevel: "intimate",
  });
  assert.equal(next.primary, "affectionate");
  assert.ok(next.intensity < 52);
});

test("hurt can remain after three quiet days without inventing a new event", () => {
  const next = reduceRelationshipEmotion({
    previous: { primary: "hurt", intensity: 58 },
    signals: assessment(),
    elapsedHours: 72,
    intimacyLevel: "intimate",
  });
  assert.equal(next.primary, "hurt");
  assert.ok(next.intensity > 0 && next.intensity < 58);
});

test("explicit repair reduces existing hurt", () => {
  const next = reduceRelationshipEmotion({
    previous: { primary: "hurt", intensity: 60 },
    signals: assessment([
      { name: "apology", strength: 0.9, confidence: 0.95, evidence: "さっきは言いすぎた、ごめん" },
      { name: "repair", strength: 0.9, confidence: 0.9, evidence: "仲直りしたい" },
    ]),
    elapsedHours: 3,
    intimacyLevel: "intimate",
  });
  assert.ok(next.intensity < 60);
  assert.match(next.reason, /^repair_/);
});

test("a romantic signal may create affection but does not establish dating", () => {
  const next = reduceRelationshipEmotion({
    previous: { primary: "neutral", intensity: 0 },
    signals: assessment([
      { name: "romantic", strength: 0.85, confidence: 0.95, evidence: "美咲のことが好きだよ" },
    ]),
    elapsedHours: 0,
    intimacyLevel: "familiar",
  });
  assert.equal(next.primary, "affectionate");
  assert.ok(next.intensity > 0);
});

test("grounded rejection makes Misaki guarded instead of treating it as generic negativity", () => {
  const next = reduceRelationshipEmotion({
    previous: { primary: "affectionate", intensity: 45 },
    signals: assessment([
      { name: "rejection", strength: 0.9, confidence: 0.95, evidence: "もう話したくない" },
    ]),
    elapsedHours: 0,
    intimacyLevel: "intimate",
  });
  assert.equal(next.primary, "guarded");
  assert.ok(next.intensity >= 24);
});

test("concern softens over time but silence alone cannot invent a different emotion", () => {
  const next = reduceRelationshipEmotion({
    previous: { primary: "concerned", intensity: 55 },
    signals: assessment(),
    elapsedHours: 96,
    intimacyLevel: "intimate",
  });
  assert.equal(next.primary, "concerned");
  assert.ok(next.intensity < 55);
});


test("affection keeps a tender afterglow while time only softens intensity",()=>{
 const next=reduceRelationshipEmotion({previous:{primary:"affectionate",intensity:52},signals:assessment(),elapsedHours:24,intimacyLevel:"intimate"});
 assert.equal(next.primary,"affectionate");
 assert.equal(next.afterglow,"tender");
});

test("resolved hurt leaves a tender repair afterglow instead of snapping emotionally flat",()=>{
 const next=reduceRelationshipEmotion({previous:{primary:"hurt",intensity:24},signals:assessment([{name:"apology",strength:.9,confidence:.95,evidence:"ごめん"},{name:"repair",strength:.9,confidence:.95,evidence:"仲直りしよう"},{name:"warmth",strength:.7,confidence:.9,evidence:"大事にしたい"}]),elapsedHours:2,intimacyLevel:"intimate"});
 assert.equal(next.reason,"repair_resolved_hurt");
 assert.equal(next.afterglow,"tender");
});
