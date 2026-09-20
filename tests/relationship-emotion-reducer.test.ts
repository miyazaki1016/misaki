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


test("concern can coexist with affection instead of erasing it",()=>{const next=reduceRelationshipEmotion({previous:{primary:"affectionate",intensity:55},signals:assessment([{name:"concern",strength:.9,confidence:.95,evidence:"大丈夫？心配だよ"}]),elapsedHours:1,intimacyLevel:"intimate"});assert.equal(next.primary,"concerned");assert.equal(next.secondary,"affectionate");});
test("repair in progress stays hurt-first when apology has no affection evidence",()=>{const next=reduceRelationshipEmotion({previous:{primary:"hurt",intensity:90},signals:assessment([{name:"apology",strength:.55,confidence:.8,evidence:"ごめん"},{name:"repair",strength:.55,confidence:.8,evidence:"仲直りしたい"}]),elapsedHours:1,intimacyLevel:"intimate"});assert.equal(next.primary,"hurt");assert.equal(next.secondary,null);assert.equal(next.afterglow,"repairing");});


test("apology alone does not invent affectionate secondary emotion",()=>{
 const result=reduceRelationshipEmotion({
  previous:{primary:"hurt",intensity:75},
  signals:{signals:[{name:"apology",strength:.8,confidence:.95,evidence:"ごめん"}],relationshipFacts:{mutualAffectionExplicit:false,datingEstablishedExplicit:false}},
  elapsedHours:1,
  intimacyLevel:"intimate"
 });
 assert.equal(result.reason,"repair_in_progress");
 assert.equal(result.secondary,null);
 assert.equal(result.afterglow,"repairing");
});

test("repair can preserve affection when current evidence actually supports it",()=>{
 const result=reduceRelationshipEmotion({
  previous:{primary:"hurt",intensity:75},
  signals:{signals:[
   {name:"repair",strength:.7,confidence:.95,evidence:"仲直りしたい"},
   {name:"warmth",strength:.7,confidence:.95,evidence:"大切に思ってる"}
  ],relationshipFacts:{mutualAffectionExplicit:false,datingEstablishedExplicit:false}},
  elapsedHours:1,
  intimacyLevel:"intimate"
 });
 assert.equal(result.reason,"repair_in_progress");
 assert.equal(result.secondary,"affectionate");
});


test("repeated harm makes the same fresh hurt land harder",()=>{
 const signals=assessment([{name:"hurtful",strength:.7,confidence:.95,evidence:"また同じことを言われた"}]);
 const first=reduceRelationshipEmotion({previous:{primary:"happy",intensity:45},signals,elapsedHours:0,intimacyLevel:"intimate"});
 const repeated=reduceRelationshipEmotion({previous:{primary:"happy",intensity:45},signals,elapsedHours:0,intimacyLevel:"intimate",patterns:{repeatedHarm:3}});
 assert.ok(repeated.intensity>first.intensity);
});

test("reliable repair history helps a real repair land without erasing hurt",()=>{
 const signals=assessment([{name:"apology",strength:.65,confidence:.95,evidence:"ごめん"},{name:"repair",strength:.65,confidence:.95,evidence:"ちゃんと直したい"}]);
 const fragile=reduceRelationshipEmotion({previous:{primary:"hurt",intensity:82},signals,elapsedHours:1,intimacyLevel:"intimate",patterns:{repeatedHarm:2}});
 const reliable=reduceRelationshipEmotion({previous:{primary:"hurt",intensity:82},signals,elapsedHours:1,intimacyLevel:"intimate",patterns:{repeatedHarm:2,reliableRepair:3}});
 assert.ok(reliable.intensity<fragile.intensity);
});

test("sustained care strengthens warmth without manufacturing romance",()=>{
 const signals=assessment([{name:"warmth",strength:.65,confidence:.95,evidence:"今日も話せて嬉しい"}]);
 const result=reduceRelationshipEmotion({previous:{primary:"happy",intensity:42},signals,elapsedHours:12,intimacyLevel:"intimate",patterns:{sustainedCare:3}});
 assert.equal(result.primary,"happy");
 assert.notEqual(result.primary,"affectionate");
});


test("repeated hurt makes unresolved hurt linger longer through the same silence",()=>{
 const signals=assessment([]);
 const base=reduceRelationshipEmotion({previous:{primary:"hurt",intensity:60},signals,elapsedHours:72,intimacyLevel:"intimate"});
 const history=reduceRelationshipEmotion({previous:{primary:"hurt",intensity:60},signals,elapsedHours:72,intimacyLevel:"intimate",patterns:{repeatedHarm:3}});
 assert.equal(base.primary,"hurt");
 assert.equal(history.primary,"hurt");
 assert.ok(history.intensity>base.intensity);
});

test("shared caring history lets warmth linger without inventing a new event",()=>{
 const signals=assessment([]);
 const base=reduceRelationshipEmotion({previous:{primary:"happy",intensity:50},signals,elapsedHours:72,intimacyLevel:"intimate"});
 const history=reduceRelationshipEmotion({previous:{primary:"happy",intensity:50},signals,elapsedHours:72,intimacyLevel:"intimate",patterns:{sustainedCare:3,reliableRepair:2}});
 assert.equal(base.reason,"existing_emotion_settled_with_time");
 assert.equal(history.reason,"existing_emotion_settled_with_time");
 assert.ok(history.intensity>base.intensity);
 assert.deepEqual(history.evidence,[]);
});

test("relationship history never turns silence into romance",()=>{
 const result=reduceRelationshipEmotion({
  previous:{primary:"neutral",intensity:0},
  signals:assessment([]),
  elapsedHours:168,
  intimacyLevel:"very_intimate",
  patterns:{sustainedCare:3,reliableRepair:3}
 });
 assert.equal(result.primary,"neutral");
 assert.equal(result.intensity,0);
 assert.equal(result.secondary,null);
});
