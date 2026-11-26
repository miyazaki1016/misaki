import assert from "node:assert/strict";
import test from "node:test";
import { createTuningPreviewPair, validateTuningDraft } from "../lib/conversation-tuning-preview.ts";
const settings = { warmth: 70, humor: 30, phrasingInitiative: 40, questionTone: 20, length: "short" as const };
const draft = (version: string) => ({ tuningVersion: version, characterId: "synthetic-misaki", scope: "preview", settings });
const fixture = {characterId:"synthetic-misaki",snapshotId:"snapshot-1",selectionRulesVersion:"rules-1",promptVersion:"prompt-1",model:"synthetic-only",userInput:"疲れた",selectedFacts:[],requiredConstraints:["do-not-invent"],forbiddenConstraints:["invent-facts"],questionAllowed:false};
test("A/B fixture is shared and immutable",()=>{
 const pair=createTuningPreviewPair(fixture,draft("a"),draft("b"));
 assert.equal(pair.experiment,"tuning");assert.equal(Object.isFrozen(pair.fixture.selectedFacts),true);
});
test("reject invalid tuning",()=>{
 for(const value of [NaN,Infinity,-1,101,"70"])assert.throws(()=>validateTuningDraft({...draft("a"),settings:{...settings,warmth:value}}));
 assert.throws(()=>validateTuningDraft({...draft("a"),scope:"production"}));
 assert.throws(()=>validateTuningDraft({...draft("a"),settings:{...settings,length:"verbose"}}));
});
test("fail closed on missing constraints or version collision",()=>{
 assert.throws(()=>createTuningPreviewPair({...fixture,requiredConstraints:undefined} as never,draft("a"),draft("b")));
 assert.throws(()=>createTuningPreviewPair(fixture,draft("a"),{...draft("a"),settings:{...settings,humor:50}}));
});

test("reject missing and cross-character scopes in synthetic preview",()=>{
 assert.throws(()=>validateTuningDraft({...draft("a"),characterId:undefined}));
 assert.throws(()=>createTuningPreviewPair({...fixture,characterId:undefined} as never,draft("a"),draft("b")));
 assert.throws(()=>createTuningPreviewPair(fixture,draft("a"),{...draft("b"),characterId:"synthetic-other"}));
 assert.throws(()=>createTuningPreviewPair({...fixture,characterId:"synthetic-other"},draft("a"),draft("b")));
});
