import assert from "node:assert/strict";
import test from "node:test";
import { reduceRelationshipEmotion, type EmotionStateV2 } from "../lib/relationship-emotion-reducer.ts";
import { reduceRelationshipAction } from "../lib/relationship-action-reducer.ts";

const assessment=(signals:any[]=[])=>({signals,relationshipFacts:{mutualAffectionExplicit:false,datingEstablishedExplicit:false}});
const sig=(name:string,strength:number,evidence:string)=>({name,strength,confidence:.95,evidence});

function step(previous:EmotionStateV2,signals:any[],elapsedHours:number,intimacyLevel="intimate",patterns?:{repeatedHarm?:number;reliableRepair?:number;sustainedCare?:number}){
 const a=assessment(signals);
 const emotion=reduceRelationshipEmotion({previous,signals:a,elapsedHours,intimacyLevel,patterns});
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


test("scenario: boundary -> warmth -> explicit repair may reopen connection gradually",()=>{
 let s=step({primary:"affectionate",intensity:65},[sig("boundary",.9,"少し距離を置きたい")],0);
 assert.equal(s.emotion.primary,"guarded");
 s=step(s.emotion,[sig("warmth",.7,"嫌いになったわけじゃない")],2);
 assert.equal(s.emotion.primary,"guarded");
 assert.equal(s.emotion.secondary,"happy");
 s=step(s.emotion,[sig("apology",.8,"言い方きつくてごめん"),sig("repair",.85,"またゆっくり話そう")],6);
 assert.match(s.emotion.reason,/^repair_/);
 assert.ok(["repair","steady","gentle"].includes(s.action.direction));
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: concern without new evidence fades instead of becoming endless checking",()=>{
 let s=step({primary:"affectionate",intensity:50},[sig("concern",.85,"帰りが遅いって言ってたから心配")],0);
 assert.equal(s.emotion.primary,"concerned");
 const first=s.emotion.intensity;
 s=step(s.emotion,[],48);
 assert.ok(s.emotion.intensity<first);
 s=step(s.emotion,[],168);
 assert.ok(s.emotion.intensity<first);
 if(s.emotion.intensity===0) assert.equal(s.emotion.primary,"neutral");
});

test("scenario: one affectionate message after rejection cannot immediately restore teasing",()=>{
 let s=step({primary:"affectionate",intensity:70},[sig("rejection",.95,"恋愛っぽいのはやめよう")],0);
 assert.equal(s.emotion.primary,"guarded");
 s=step(s.emotion,[sig("romantic",.55,"でも大切には思ってる")],3);
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: repair then ordinary conversation can return toward normal without forced romance",()=>{
 let s=step({primary:"hurt",intensity:55},[sig("apology",.8,"ごめん"),sig("repair",.8,"仲直りしたい")],1);
 s=step(s.emotion,[sig("warmth",.5,"今日は普通に話そう")],12);
 assert.notEqual(s.action.action,"PULL");
 assert.notEqual(s.action.action,"SULK");
});


test("scenario: a good night does not make yesterday's repaired hurt vanish by morning",()=>{
 let s=step({primary:"hurt",intensity:72},[sig("apology",.7,"昨日はごめん"),sig("repair",.65,"ちゃんと仲直りしたい")],1);
 assert.ok(["hurt","happy","neutral"].includes(s.emotion.primary));
 s=step(s.emotion,[],8);
 assert.notEqual(s.action.action,"TEASE");
 assert.notEqual(s.action.direction,"closer");
});

test("scenario: ordinary silence after trust does not become rejection by itself",()=>{
 let s=step({primary:"happy",intensity:48},[sig("trust",.8,"安心して話せる"),sig("shared_history",.75,"いつもの感じ")],0);
 s=step(s.emotion,[],24*7);
 assert.notEqual(s.emotion.primary,"guarded");
 assert.notEqual(s.emotion.primary,"hurt");
 assert.notEqual(s.action.action,"PULL");
});

test("scenario: warmth and hurt in the same turn preserve the hurt instead of cherry-picking affection",()=>{
 const s=step({primary:"affectionate",intensity:62},[
  sig("warmth",.8,"大切に思ってる"),
  sig("hurtful",.85,"でも傷つく言い方をした")
 ],0);
 assert.ok(["hurt","guarded"].includes(s.emotion.primary));
 assert.notEqual(s.action.action,"TEASE");
 assert.notEqual(s.action.direction,"closer");
});

test("scenario: concern must not appear from elapsed time alone",()=>{
 let s=step({primary:"happy",intensity:42},[sig("warmth",.7,"楽しかったね")],0);
 s=step(s.emotion,[],72);
 assert.notEqual(s.emotion.primary,"concerned");
 assert.notEqual(s.action.action,"CHASE");
});


test("scenario: apology without repair intent should not fully reset a deep hurt",()=>{
 let s=step({primary:"hurt",intensity:78},[sig("apology",.65,"ごめん")],1);
 assert.notEqual(s.action.action,"TEASE");
 assert.notEqual(s.action.direction,"closer");
 assert.ok(s.emotion.intensity>0);
});

test("scenario: repeated apologies cannot manufacture affection after repeated harm",()=>{
 let s=step({primary:"happy",intensity:45},[sig("hurtful",.85,"傷つく言い方")],0);
 s=step(s.emotion,[sig("apology",.7,"ごめん")],1);
 s=step(s.emotion,[sig("hurtful",.85,"また傷つく言い方")],2);
 s=step(s.emotion,[sig("apology",.75,"またごめん")],1);
 assert.notEqual(s.action.action,"TEASE");
 assert.notEqual(s.action.direction,"closer");
});

test("scenario: affectionate history does not override a fresh boundary",()=>{
 const s=step({primary:"affectionate",intensity:88},[
  sig("shared_history",.9,"ずっと仲良くしてきた"),
  sig("boundary",.9,"でも今日は触れないでほしい")
 ],0);
 assert.equal(s.emotion.primary,"guarded");
 assert.equal(s.action.direction,"space");
});

test("scenario: calm ordinary conversation after guardedness may soften without forcing closeness",()=>{
 let s=step({primary:"guarded",intensity:55},[],12);
 const before=s.emotion.intensity;
 s=step(s.emotion,[sig("openness",.5,"今日は普通に話せそう")],12);
 assert.ok(s.emotion.intensity>=0);
 assert.notEqual(s.action.action,"TEASE");
 assert.ok(before<=55);
});


test("scenario: saying I love you during an unresolved boundary does not erase the boundary",()=>{
 let s=step({primary:"affectionate",intensity:80},[sig("boundary",.95,"今は距離を置きたい")],0);
 s=step(s.emotion,[sig("romantic",.9,"それでも大好きだよ")],1);
 assert.notEqual(s.action.action,"TEASE");
 assert.notEqual(s.action.direction,"closer");
});

test("scenario: one bad joke in a secure warm moment can hurt without deleting all attachment",()=>{
 const s=step({primary:"affectionate",intensity:75},[sig("hurtful",.55,"冗談がちょっと刺さった")],0);
 assert.equal(s.emotion.primary,"hurt");
 assert.equal(s.emotion.secondary,"affectionate");
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: a quiet week after repaired warmth does not recreate the old fight",()=>{
 let s=step({primary:"hurt",intensity:45},[
  sig("repair",.85,"仲直りしよう"),
  sig("warmth",.75,"大事にしたい")
 ],1);
 s=step(s.emotion,[],24*7);
 assert.notEqual(s.action.action,"SULK");
 assert.notEqual(s.action.action,"PULL");
});

test("scenario: current rejection beats nostalgic shared history",()=>{
 const s=step({primary:"happy",intensity:55},[
  sig("shared_history",.95,"昔からずっと仲良し"),
  sig("rejection",.9,"でも恋愛関係にはなりたくない")
 ],0);
 assert.equal(s.emotion.primary,"guarded");
 assert.equal(s.action.direction,"space");
});


test("scenario: two quiet weeks after affection soften intensity without rewriting love as rejection",()=>{
 let s=step({primary:"affectionate",intensity:82},[],24*7);
 const week=s.emotion.intensity;
 s=step(s.emotion,[],24*7);
 assert.ok(s.emotion.intensity<=week);
 assert.notEqual(s.emotion.primary,"hurt");
 assert.notEqual(s.emotion.primary,"guarded");
 assert.notEqual(s.action.action,"PULL");
});

test("scenario: unresolved hurt can fade across weeks but time alone cannot call it repaired",()=>{
 let s=step({primary:"hurt",intensity:72},[],24*7);
 const week=s.emotion.intensity;
 assert.equal(s.emotion.primary,"hurt");
 s=step(s.emotion,[],24*7);
 assert.ok(s.emotion.intensity<week);
 assert.ok(["hurt","neutral"].includes(s.emotion.primary));
 assert.notEqual(s.emotion.reason,"repair_resolved_hurt");
});

test("scenario: concern fades over days without inventing a new bad event",()=>{
 let s=step({primary:"concerned",intensity:68},[],48);
 const twoDays=s.emotion.intensity;
 s=step(s.emotion,[],120);
 assert.ok(s.emotion.intensity<twoDays);
 assert.notEqual(s.emotion.primary,"hurt");
 assert.notEqual(s.emotion.primary,"guarded");
});

test("scenario: a fresh warm reunion after a long quiet period can become happy without pretending dating",()=>{
 let s=step({primary:"happy",intensity:50},[],24*14);
 s=step(s.emotion,[sig("warmth",.8,"久しぶり、話せて嬉しい"),sig("shared_history",.7,"またいつもの話しよう")],0);
 assert.equal(s.emotion.primary,"happy");
 assert.notEqual(s.action.action,"PULL");
});


test("scenario: warmth during a long silence can refresh warmth without creating romance",()=>{
 let s=step({primary:"happy",intensity:62},[],24*5);
 const faded=s.emotion.intensity;
 s=step(s.emotion,[sig("warmth",.72,"今日は少し話せてよかった")],0);
 assert.equal(s.emotion.primary,"happy");
 assert.ok(s.emotion.intensity>=faded);
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: fresh hurt midway through quiet weeks changes the trajectory instead of being averaged away",()=>{
 let s=step({primary:"affectionate",intensity:76},[],24*6);
 s=step(s.emotion,[sig("hurtful",.85,"その言い方は傷ついた")],0);
 assert.equal(s.emotion.primary,"hurt");
 s=step(s.emotion,[],24*6);
 assert.ok(["hurt","neutral"].includes(s.emotion.primary));
 assert.notEqual(s.emotion.primary,"affectionate");
});

test("scenario: explicit repair midway through a long hurt period changes the later trajectory",()=>{
 let s=step({primary:"hurt",intensity:78},[],24*4);
 s=step(s.emotion,[sig("apology",.9,"ごめん"),sig("repair",.9,"ちゃんと仲直りしたい"),sig("warmth",.7,"大切にしたい")],0);
 assert.ok(["hurt","happy"].includes(s.emotion.primary));
 const repairedReason=s.emotion.reason;
 s=step(s.emotion,[],24*5);
 assert.notEqual(s.emotion.reason,"passive_hurt_decay");
 assert.ok(repairedReason.startsWith("repair_"));
});

test("scenario: reassurance during concern redirects the next days instead of preserving endless checking",()=>{
 let s=step({primary:"concerned",intensity:74},[sig("warmth",.8,"もう大丈夫だよ、ありがとう")],0);
 assert.notEqual(s.emotion.primary,"hurt");
 const afterReassurance=s.emotion.intensity;
 s=step(s.emotion,[],72);
 assert.ok(s.emotion.intensity<=afterReassurance);
 assert.notEqual(s.action.action,"PULL");
});


test("scenario: the same small hurt lands harder in a close relationship than at first meeting",()=>{
 const signals=[sig("hurtful",.5,"その言い方は少し傷ついた")];
 const early=step({primary:"neutral",intensity:0},signals,0,"new");
 const close=step({primary:"affectionate",intensity:70},signals,0,"very_intimate");
 assert.equal(early.emotion.primary,"hurt");
 assert.equal(close.emotion.primary,"hurt");
 assert.ok(close.emotion.intensity>early.emotion.intensity);
 assert.equal(close.emotion.secondary,"affectionate");
 assert.equal(early.emotion.secondary,null);
});

test("scenario: the same romantic words do not imply the same relationship history",()=>{
 const signals=[sig("romantic",.72,"好きだよ")];
 const early=step({primary:"neutral",intensity:0},signals,0,"new");
 const close=step({primary:"affectionate",intensity:68},signals,0,"very_intimate");
 assert.equal(early.emotion.primary,"affectionate");
 assert.equal(close.emotion.primary,"affectionate");
 assert.ok(close.emotion.intensity>early.emotion.intensity);
});

test("scenario: shared history warms an established relationship without turning a new one romantic",()=>{
 const history=[sig("shared_history",.8,"前にも一緒に笑ったね"),sig("warmth",.5,"覚えてて嬉しい")];
 const early=step({primary:"neutral",intensity:0},history,0,"new");
 const close=step({primary:"happy",intensity:58},history,0,"intimate");
 assert.equal(early.emotion.primary,"happy");
 assert.equal(close.emotion.primary,"happy");
 assert.notEqual(early.action.action,"TEASE");
 assert.notEqual(close.emotion.primary,"affectionate");
});

test("scenario: deep affection does not grant permission to cross a fresh boundary",()=>{
 const close=step({primary:"affectionate",intensity:92},[
  sig("boundary",.95,"今日は一人にして"),
  sig("shared_history",.8,"いつもは甘えてるけど")
 ],0,"very_intimate");
 assert.equal(close.emotion.primary,"guarded");
 assert.equal(close.action.direction,"space");
 assert.notEqual(close.action.action,"TEASE");
});


test("scenario: remembered affection can coexist with fresh hurt without being treated as current permission",()=>{
 const s=step({primary:"affectionate",intensity:78},[
  sig("shared_history",.85,"前に大好きって言い合った"),
  sig("hurtful",.82,"でも今の言い方は傷ついた")
 ],0,"very_intimate");
 assert.equal(s.emotion.primary,"hurt");
 assert.equal(s.emotion.secondary,"affectionate");
 assert.notEqual(s.action.action,"TEASE");
});

test("scenario: remembered repair does not excuse repeated fresh harm",()=>{
 let s=step({primary:"hurt",intensity:62},[
  sig("apology",.9,"この前はごめん"),
  sig("repair",.9,"仲直りしたい"),
  sig("warmth",.7,"大切にしたい")
 ],0,"intimate");
 s=step(s.emotion,[
  sig("shared_history",.8,"前にも仲直りした"),
  sig("hurtful",.9,"また同じことを言われて傷ついた")
 ],24,"intimate");
 assert.equal(s.emotion.primary,"hurt");
 assert.ok(s.emotion.intensity>=24);
 assert.notEqual(s.action.direction,"closer");
});

test("scenario: remembered care supports warmth after time but does not invent a new concern",()=>{
 let s=step({primary:"happy",intensity:58},[],24*5,"intimate");
 s=step(s.emotion,[
  sig("shared_history",.8,"前に心配してくれたの覚えてる"),
  sig("warmth",.6,"あの時うれしかった")
 ],0,"intimate");
 assert.equal(s.emotion.primary,"happy");
 assert.notEqual(s.emotion.primary,"concerned");
 assert.notEqual(s.action.motive,"check_in");
});

test("scenario: a past rejection remains history, but current explicit repair can change the present",()=>{
 let s=step({primary:"guarded",intensity:64},[
  sig("shared_history",.75,"前は距離を置いた"),
  sig("apology",.9,"あの時はごめん"),
  sig("repair",.9,"今はちゃんと話したい"),
  sig("warmth",.65,"また話せてうれしい")
 ],24*3,"intimate");
 assert.notEqual(s.action.action,"PULL");
 assert.ok(["hurt","guarded","happy","neutral"].includes(s.emotion.primary));
 assert.ok(s.emotion.reason.startsWith("repair_"));
});


test("scenario: repeated harm teaches caution even when each incident looks small alone",()=>{
 const incident=[sig("hurtful",.5,"また少し刺さる言い方だった")];
 const first=step({primary:"happy",intensity:52},incident,0,"intimate",{repeatedHarm:0});
 const learned=step({primary:"happy",intensity:52},incident,0,"intimate",{repeatedHarm:3});
 assert.equal(first.emotion.primary,"hurt");
 assert.equal(learned.emotion.primary,"hurt");
 assert.ok(learned.emotion.intensity>first.emotion.intensity);
 assert.notEqual(learned.action.direction,"closer");
});

test("scenario: repeated harm makes apology slower to repair than a one-off mistake",()=>{
 const apology=[sig("apology",.75,"ごめん"),sig("repair",.7,"直したい")];
 const oneOff=step({primary:"hurt",intensity:76},apology,1,"intimate",{repeatedHarm:0});
 const repeated=step({primary:"hurt",intensity:76},apology,1,"intimate",{repeatedHarm:3});
 assert.ok(repeated.emotion.intensity>oneOff.emotion.intensity);
 assert.equal(repeated.emotion.reason,"repair_in_progress");
});

test("scenario: demonstrated reliable repair can rebuild trust faster than words alone",()=>{
 const repair=[sig("apology",.72,"ごめん"),sig("repair",.72,"今度は行動で直す")];
 const wordsOnly=step({primary:"hurt",intensity:82},repair,1,"intimate",{repeatedHarm:2,reliableRepair:0});
 const proven=step({primary:"hurt",intensity:82},repair,1,"intimate",{repeatedHarm:2,reliableRepair:3});
 assert.ok(proven.emotion.intensity<wordsOnly.emotion.intensity);
 assert.notEqual(proven.action.action,"TEASE");
});

test("scenario: sustained care accumulates warmth but never substitutes for explicit romance",()=>{
 const care=[sig("care",.7,"今日も無理しないでね"),sig("warmth",.55,"話せてうれしい")];
 let s=step({primary:"happy",intensity:45},care,24,"very_intimate",{sustainedCare:3});
 assert.equal(s.emotion.primary,"happy");
 assert.equal(s.emotion.secondary,null);
 assert.notEqual(s.emotion.reason,"romantic_warmth");
});


test("scenario: identical apology leads to different behavior after different relationship histories",()=>{
 const apology=[sig("repair",.9,"仲直りしたい"),sig("apology",.9,"ごめん")];
 const fragile=step({primary:"hurt",intensity:46},apology,2,"intimate",{repeatedHarm:2.5,reliableRepair:0,sustainedCare:.2});
 const proven=step({primary:"hurt",intensity:46},apology,2,"intimate",{repeatedHarm:1,reliableRepair:2,sustainedCare:2});
 assert.ok(fragile.emotion.intensity >= proven.emotion.intensity);
});

test("scenario: identical warmth feels safer after sustained care but does not create dating",()=>{
 const warmth=[sig("care",.8,"大事にする"),sig("warmth",.7,"今日も話せてよかった")];
 const newBond=step({primary:"neutral",intensity:8},warmth,4,"familiar",{sustainedCare:0});
 const livedBond=step({primary:"neutral",intensity:8},warmth,4,"familiar",{sustainedCare:2.7});
 assert.ok(livedBond.emotion.intensity >= newBond.emotion.intensity);
 assert.notEqual(livedBond.action.action,"TEASE");
});

test("scenario: fresh hurt still matters even in a history full of care",()=>{
 const hurt=[sig("hurtful",.85,"ひどいことを言った")];
 const r=step({primary:"happy",intensity:48},hurt,1,"very_intimate",{sustainedCare:3,reliableRepair:2.5,repeatedHarm:0});
 assert.ok(["hurt","guarded","sulky"].includes(r.emotion.primary));
 assert.equal(r.action.direction,"space");
});

test("scenario: learned caution can soften after reliable repair and sustained care",()=>{
 const apology=[sig("repair",.9,"ちゃんと直したい"),sig("apology",.8,"ごめん")];
 const stillFragile=step({primary:"hurt",intensity:42},apology,3,"intimate",{repeatedHarm:2.6,reliableRepair:0,sustainedCare:.5});
 const rebuilt=step({primary:"hurt",intensity:42},apology,3,"intimate",{repeatedHarm:1.2,reliableRepair:2.2,sustainedCare:2.4});
 assert.ok(rebuilt.emotion.intensity <= stillFragile.emotion.intensity);
});


test("scenario: the same caring words land warmer in a relationship with demonstrated safety",()=>{
 const words=[sig("care",.75,"ちゃんと大事にする"),sig("warmth",.65,"話せて嬉しい")];
 const cautious=step({primary:"neutral",intensity:10},words,2,"intimate",{repeatedHarm:2.5,reliableRepair:0,sustainedCare:.3});
 const safe=step({primary:"neutral",intensity:10},words,2,"intimate",{repeatedHarm:.2,reliableRepair:2.4,sustainedCare:2.7});
 assert.ok(safe.emotion.intensity > cautious.emotion.intensity);
});

test("scenario: relationship safety never erases fresh hurt",()=>{
 const fresh=[sig("hurtful",.9,"傷つくことを言った")];
 const safe=step({primary:"happy",intensity:55},fresh,1,"very_intimate",{repeatedHarm:0,reliableRepair:3,sustainedCare:3});
 assert.equal(safe.emotion.primary,"hurt");
 assert.equal(safe.action.direction,"space");
});

test("scenario: learned caution can coexist with affection instead of deleting it",()=>{
 const romantic=[sig("romantic",.85,"好きだよ"),sig("warmth",.55,"会えて嬉しい")];
 const cautious=step({primary:"neutral",intensity:12},romantic,2,"intimate",{repeatedHarm:2.7,reliableRepair:.2,sustainedCare:.5});
 assert.equal(cautious.emotion.primary,"affectionate");
 assert.ok(cautious.emotion.intensity > 0);
});

test("scenario: reliable repair changes reception gradually, not by flipping a permanent trust switch",()=>{
 const warmth=[sig("care",.7,"大事にする"),sig("trust",.6,"ちゃんと向き合う")];
 const none=step({primary:"neutral",intensity:8},warmth,2,"intimate",{repeatedHarm:1.5,reliableRepair:0,sustainedCare:1});
 const some=step({primary:"neutral",intensity:8},warmth,2,"intimate",{repeatedHarm:1.5,reliableRepair:1,sustainedCare:1});
 const strong=step({primary:"neutral",intensity:8},warmth,2,"intimate",{repeatedHarm:1.5,reliableRepair:2.5,sustainedCare:1});
 assert.ok(some.emotion.intensity >= none.emotion.intensity);
 assert.ok(strong.emotion.intensity >= some.emotion.intensity);
});
