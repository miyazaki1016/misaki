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


test("scenario: deep hurt -> apology -> next morning may still be tender, not instantly playful",()=>{
 let s=step({primary:"affectionate",intensity:70},[sig("hurtful",1,"大きく傷つく言い方をされた")],0);
 assert.equal(s.emotion.primary,"hurt");
 s=step(s.emotion,[sig("apology",.55,"昨日はごめん"),sig("repair",.55,"ちゃんと仲直りしたい")],8);
 assert.ok(["hurt","neutral","happy"].includes(s.emotion.primary));
 assert.notEqual(s.action.action,"TEASE");
 const morning=step(s.emotion,[],10);
 assert.notEqual(morning.action.action,"TEASE");
 assert.notEqual(morning.action.direction,"closer");
});

test("scenario: repeated warmth builds continuity without declaring dating",()=>{
 let s=step({primary:"neutral",intensity:0},[sig("warmth",.7,"話せてうれしい")],0,"familiar");
 s=step(s.emotion,[sig("trust",.7,"君には話せる"),sig("shared_history",.6,"前に話したこと覚えてる")],6,"familiar");
 assert.equal(s.emotion.primary,"happy");
 assert.notEqual(s.action.action,"TEASE");
 assert.ok(["closer","gentle"].includes(s.action.direction));
});

test("scenario: concern -> reassurance -> quiet time should soften concern rather than invent danger",()=>{
 let s=step({primary:"affectionate",intensity:45},[sig("concern",.9,"帰り遅いって言ってたけど大丈夫？")],0);
 assert.equal(s.emotion.primary,"concerned");
 const before=s.emotion.intensity;
 s=step(s.emotion,[sig("warmth",.6,"無事着いたよ")],2);
 assert.notEqual(s.emotion.primary,"hurt");
 s=step(s.emotion,[],24);
 assert.ok(s.emotion.intensity<=Math.max(before,100));
 assert.notEqual(s.action.action,"PULL");
});

test("scenario: boundary remains space even when prior relationship was affectionate",()=>{
 let s=step({primary:"affectionate",intensity:80},[sig("boundary",.95,"今日は一人にしてほしい")],0);
 assert.equal(s.emotion.primary,"guarded");
 assert.equal(s.action.direction,"space");
 const later=step(s.emotion,[],6);
 assert.notEqual(later.action.action,"TEASE");
 assert.notEqual(later.action.direction,"closer");
});


test("scenario: long quiet period softens affection but does not erase relationship warmth into hostility",()=>{
 let s=step({primary:"neutral",intensity:0},[sig("romantic",.9,"大好き"),sig("warmth",.8,"今日も話せて嬉しい")],0);
 assert.equal(s.emotion.primary,"affectionate");
 s=step(s.emotion,[],24*14);
 assert.ok(["affectionate","neutral"].includes(s.emotion.primary));
 assert.notEqual(s.action.action,"PULL");
 assert.notEqual(s.action.action,"SULK");
});

test("scenario: awkward joke -> repair can be accepted without pretending nothing happened",()=>{
 let s=step({primary:"happy",intensity:45},[sig("hurtful",.6,"冗談のつもりが傷つく言い方だった")],0);
 assert.equal(s.emotion.primary,"hurt");
 s=step(s.emotion,[sig("apology",.65,"ごめん、冗談のつもりだった"),sig("repair",.6,"嫌な気持ちにさせたね")],1);
 assert.match(s.emotion.reason,/^repair_/);
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: being cared for while hurt may repair gradually, not because time alone passed",()=>{
 let s=step({primary:"hurt",intensity:70},[],24);
 const afterTime=s.emotion.intensity;
 assert.equal(s.emotion.primary,"hurt");
 s=step(s.emotion,[sig("care",.8,"無理しなくていいよ"),sig("warmth",.6,"そばにいるよ")],1);
 assert.ok(["hurt","happy"].includes(s.emotion.primary));
 assert.notEqual(s.action.action,"PULL");
 assert.ok(afterTime<70);
});

test("scenario: explicit rejection outranks simultaneous warmth and prevents romantic escalation",()=>{
 const s=step({primary:"affectionate",intensity:65},[
  sig("warmth",.8,"嫌いじゃないよ"),
  sig("rejection",.9,"でも今は恋愛っぽくしたくない")
 ],0);
 assert.equal(s.emotion.primary,"guarded");
 assert.equal(s.action.direction,"space");
 assert.notEqual(s.action.action,"TEASE");
});


test("scenario: repeated small hurts should not be erased by one warm sentence",()=>{
 let s=step({primary:"happy",intensity:50},[sig("hurtful",.55,"少し刺さる言い方")],0);
 s=step(s.emotion,[sig("hurtful",.55,"また少し雑に扱われた")],3);
 assert.equal(s.emotion.primary,"hurt");
 const hurt=s.emotion.intensity;
 s=step(s.emotion,[sig("warmth",.55,"でも好きだよ")],1);
 assert.notEqual(s.action.action,"TEASE");
 assert.ok(s.emotion.intensity>=0);
 assert.ok(hurt>0);
});

test("scenario: repair followed by renewed harm should reopen distance",()=>{
 let s=step({primary:"hurt",intensity:55},[sig("apology",.8,"ごめん"),sig("repair",.8,"仲直りしよう")],1);
 s=step(s.emotion,[sig("hurtful",.9,"直後にまた傷つく言い方")],2);
 assert.ok(["hurt","guarded"].includes(s.emotion.primary));
 assert.ok(["space","steady"].includes(s.action.direction));
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: mutual affection can stay affectionate without automatically establishing a relationship status",()=>{
 const a=assessment([sig("romantic",.95,"お互い大好きだね"),sig("warmth",.8,"一緒にいたい")]);
 a.relationshipFacts.mutualAffectionExplicit=true;
 const emotion=reduceRelationshipEmotion({previous:{primary:"happy",intensity:40},signals:a,elapsedHours:0,intimacyLevel:"intimate"});
 const action=reduceRelationshipAction({previousAction:"NORMAL",emotion,signals:a,intimacyLevel:"intimate"});
 assert.equal(emotion.primary,"affectionate");
 assert.ok(["TEASE","NORMAL"].includes(action.action));
 assert.equal(a.relationshipFacts.datingEstablishedExplicit,false);
});

test("scenario: care after a boundary does not cancel the boundary by itself",()=>{
 let s=step({primary:"affectionate",intensity:60},[sig("boundary",.9,"今日は一人でいたい")],0);
 assert.equal(s.action.direction,"space");
 s=step(s.emotion,[sig("care",.65,"心配してくれてありがとう")],2);
 assert.notEqual(s.action.action,"TEASE");
 assert.notEqual(s.action.direction,"closer");
});
