import assert from "node:assert/strict";
import test from "node:test";
import { reduceRelationshipEmotion, type EmotionStateV2 } from "../lib/relationship-emotion-reducer.ts";
import { reduceRelationshipAction } from "../lib/relationship-action-reducer.ts";

const assessment=(signals:any[]=[])=>({signals,relationshipFacts:{mutualAffectionExplicit:false,datingEstablishedExplicit:false}});
const sig=(name:string,strength:number,evidence:string)=>({name,strength,confidence:.95,evidence});

function step(previous:EmotionStateV2,signals:any[],elapsedHours:number,intimacyLevel="intimate"){
 const a=assessment(signals);
 const emotion=reduceRelationshipEmotion({previous,signals:a,elapsedHours,intimacyLevel});
 const action=reduceRelationshipAction({previousAction:"NORMAL",emotion,signals:a,intimacyLevel});
 return {emotion,action};
}

test("scenario: affection -> hurt -> quiet night -> apology -> repair keeps continuity",()=>{
 let s=step({primary:"neutral",intensity:0},[sig("romantic",.85,"好きだよ"),sig("warmth",.7,"一緒にいると落ち着く")],0);
 assert.equal(s.emotion.primary,"affectionate");

 s=step(s.emotion,[sig("hurtful",.9,"嫌な言い方をした")],1);
 assert.equal(s.emotion.primary,"hurt");
 assert.ok(s.emotion.intensity>0);

 const hurtIntensity=s.emotion.intensity;
 s=step(s.emotion,[],12);
 assert.equal(s.emotion.primary,"hurt");
 assert.ok(s.emotion.intensity<=hurtIntensity);

 s=step(s.emotion,[sig("apology",.8,"さっきはごめん"),sig("repair",.8,"仲直りしたい")],1);
 assert.match(s.emotion.reason,/^repair_/);
 assert.ok(["RECONNECT","NORMAL"].includes(s.action.action));
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: happy conversation -> three quiet days never invents rejection or loneliness",()=>{
 let s=step({primary:"neutral",intensity:0},[sig("warmth",.9,"今日楽しかった")],0);
 assert.equal(s.emotion.primary,"happy");
 s=step(s.emotion,[],72);
 assert.equal(s.emotion.primary,"happy");
 assert.equal(s.action.direction,"gentle");
 assert.notEqual(s.action.action,"PULL");
});

test("scenario: affection -> grounded concern can coexist with affection",()=>{
 let s=step({primary:"neutral",intensity:0},[sig("romantic",.9,"大好き")],0);
 assert.equal(s.emotion.primary,"affectionate");
 s=step(s.emotion,[sig("concern",.9,"体調悪いって言ってたけど大丈夫？")],2);
 assert.equal(s.emotion.primary,"concerned");
 assert.equal(s.emotion.secondary,"affectionate");
 assert.equal(s.action.direction,"check_in");
});

test("scenario: rejection creates space and time alone does not turn it romantic",()=>{
 let s=step({primary:"affectionate",intensity:60},[sig("rejection",.9,"今は話したくない")],0);
 assert.equal(s.emotion.primary,"guarded");
 assert.equal(s.action.direction,"space");
 s=step(s.emotion,[],24);
 assert.equal(s.emotion.primary,"guarded");
 assert.notEqual(s.action.direction,"closer");
 assert.notEqual(s.action.action,"TEASE");
});
