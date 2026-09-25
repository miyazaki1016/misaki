import assert from "node:assert/strict";
import test from "node:test";
import { deriveProactiveTags, normalizeIntimacyLevel, storyMeaningFromEvents } from "../supabase/functions/body-clock/proactive-decision.ts";
import { hasMisakiProactivePhotoOpportunity, selectMisakiProactivePhoto } from "../supabase/functions/body-clock/proactive-photo.ts";

const base={direction:"MISAKI" as const,action:"NORMAL" as const,timeBand:"seven_plus_days" as const,lifeConfidence:"none" as const,currentTime:"2026/09/20 18:00"};

test("seven days alone does not manufacture missing-you from hurt",()=>{
 const tags=deriveProactiveTags({...base,emotion:"hurt"});
 assert.equal(tags.includes("miss_you"),false);
 assert.equal(tags.includes("romantic"),false);
});
test("guarded proactive expression stays calm rather than romantic",()=>{
 const tags=deriveProactiveTags({...base,emotion:"guarded",action:"PULL"});
 assert.equal(tags.includes("affectionate"),false);
 assert.equal(tags.includes("romantic"),false);
 assert.equal(tags.includes("calm"),true);
});
test("affection may remain affectionate without time manufacturing a new emotion",()=>{
 const tags=deriveProactiveTags({...base,emotion:"affectionate",timeBand:"same_day"});
 assert.equal(tags.includes("affectionate"),true);
});
test("concern only becomes check-in with grounded life evidence",()=>{
 const tags=deriveProactiveTags({...base,emotion:"concerned",timeBand:"same_day"});
 assert.equal(tags.includes("check_in"),false);
 const grounded=deriveProactiveTags({...base,emotion:"concerned",timeBand:"same_day",lifeConfidence:"explicit"});
 assert.equal(grounded.includes("check_in"),true);
});


test("persisted intimacy labels map to proactive numeric levels",()=>{
 assert.equal(normalizeIntimacyLevel("initial"),0);
 assert.equal(normalizeIntimacyLevel("familiar"),1);
 assert.equal(normalizeIntimacyLevel("intimate"),2);
 assert.equal(normalizeIntimacyLevel("very_intimate"),3);
});


const event=(signals:any[])=>({metadata:{signals}});

test("Body Clock keeps unresolved hurt instead of resetting proactive tone",()=>{
 assert.equal(storyMeaningFromEvents([
  event([{name:"hurtful",strength:.9,confidence:.9}])
 ]),"unresolved_hurt");
});

test("Body Clock reads apology as repair in progress, not instant reset",()=>{
 assert.equal(storyMeaningFromEvents([
  event([{name:"apology",strength:.9,confidence:.9},{name:"repair",strength:.8,confidence:.9}]),
  event([{name:"hurtful",strength:.9,confidence:.9}])
 ]),"repair_in_progress");
});

test("Body Clock can reinterpret repaired history as demonstrated repair",()=>{
 assert.equal(storyMeaningFromEvents([
  event([{name:"care",strength:.9,confidence:.95}]),
  event([{name:"care",strength:.9,confidence:.95}]),
  event([{name:"apology",strength:.9,confidence:.9},{name:"repair",strength:.8,confidence:.9}]),
  event([{name:"hurtful",strength:.7,confidence:.9}])
 ]),"repair_demonstrated");
});

test("Body Clock preserves caution when harm repeats after repair",()=>{
 assert.equal(storyMeaningFromEvents([
  event([{name:"hurtful",strength:.9,confidence:.9}]),
  event([{name:"care",strength:.9,confidence:.95}]),
  event([{name:"apology",strength:.9,confidence:.9},{name:"repair",strength:.8,confidence:.9}]),
  event([{name:"hurtful",strength:.8,confidence:.9}])
 ]),"repeated_harm");
});


test("unresolved or repeated hurt cannot produce a contradictory proactive photo",()=>{
 const decision:any={shouldSend:true,direction:"US",action:"NORMAL",emotion:"happy",emotionIntensity:70,intimacyLevel:3,relationshipPoints:100,timeBand:"same_day",situation:null,plan:null,lifeEvidence:[],lifeConfidence:"none",tags:["romantic","affectionate","miss_you"],relationshipStoryMeaning:"unresolved_hurt"};
 assert.equal(hasMisakiProactivePhotoOpportunity({currentTime:"2026/09/25 19:00",decision}),false);
 assert.equal(selectMisakiProactivePhoto({currentTime:"2026/09/25 19:00",reply:"ちょっと話したくなった",decision,desire:"be_close",urgeStrength:90}),null);
 const repeated={...decision,relationshipStoryMeaning:"repeated_harm"};
 assert.equal(hasMisakiProactivePhotoOpportunity({currentTime:"2026/09/25 19:00",decision:repeated}),false);
 assert.equal(selectMisakiProactivePhoto({currentTime:"2026/09/25 19:00",reply:"ちょっと話したくなった",decision:repeated,desire:"share_photo",urgeStrength:90}),null);
});


test("Body Clock does not treat apology alone as demonstrated repair evidence",()=>{
 assert.equal(storyMeaningFromEvents([
  event([{name:"apology",strength:1,confidence:1}]),
  event([{name:"hurtful",strength:.9,confidence:.9}])
 ]),"unresolved_hurt");
});

test("Body Clock generic warmth after repair stays repair in progress",()=>{
 assert.equal(storyMeaningFromEvents([
  event([{name:"warmth",strength:1,confidence:1}]),
  event([{name:"repair",strength:.9,confidence:.9},{name:"apology",strength:.9,confidence:.9}]),
  event([{name:"hurtful",strength:1,confidence:1}])
 ]),"repair_in_progress");
});


test("repair in progress allows only emotionally neutral proactive photo opportunities",()=>{
 const baseDecision:any={shouldSend:true,direction:"US",action:"TEASE",emotion:"affectionate",emotionIntensity:80,intimacyLevel:3,relationshipPoints:100,timeBand:"same_day",situation:null,plan:null,lifeEvidence:[],lifeConfidence:"none",tags:["romantic","affectionate","miss_you"],relationshipStoryMeaning:"repair_in_progress"};
 assert.equal(hasMisakiProactivePhotoOpportunity({currentTime:"2026/09/25 19:00",decision:baseDecision}),false);
 assert.equal(selectMisakiProactivePhoto({currentTime:"2026/09/25 19:00",reply:"これ見せたくなった",decision:baseDecision,desire:"share_photo",urgeStrength:90}),null);
 const daytime={...baseDecision,tags:["soft","casual"]};
 assert.equal(hasMisakiProactivePhotoOpportunity({currentTime:"2026/09/25 13:00",decision:daytime}),true);
 assert.equal(selectMisakiProactivePhoto({currentTime:"2026/09/25 13:00",reply:"これ見せたくなった",decision:daytime,desire:"share_photo",urgeStrength:90})?.id,"day-01");
});
