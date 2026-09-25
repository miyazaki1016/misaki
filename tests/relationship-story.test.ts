import assert from "node:assert/strict";
import test from "node:test";
import { deriveRelationshipStory } from "../lib/relationship-patterns.ts";
import { storyMeaningFromEvents } from "../supabase/functions/body-clock/proactive-decision.ts";

const at=(day:number)=>new Date(Date.UTC(2026,8,day)).toISOString();
const ev=(day:number,signals:any[])=>({event_type:"emotion_action_v2_after_chat",created_at:at(day),metadata:{signals}});

test("hurt stays unresolved without repair",()=>{
 const s=deriveRelationshipStory([ev(1,[{name:"hurtful",strength:.9,confidence:1}])]);
 assert.equal(s.meaning,"unresolved_hurt");
 assert.equal(s.repairStage,"hurt");
 assert.ok(s.unresolvedHurt>0);
});

test("apology/repair starts repair but does not erase the event",()=>{
 const s=deriveRelationshipStory([
  ev(1,[{name:"hurtful",strength:.9,confidence:1}]),
  ev(2,[{name:"repair",strength:.9,confidence:1}]),
 ]);
 assert.equal(s.meaning,"repair_in_progress");
 assert.equal(s.repairStage,"repair_attempted");
 assert.ok(s.unresolvedHurt>0);
});

test("later care can change the meaning from grievance to demonstrated repair",()=>{
 const s=deriveRelationshipStory([
  ev(1,[{name:"hurtful",strength:.7,confidence:1}]),
  ev(2,[{name:"repair",strength:1,confidence:1}]),
  ev(3,[{name:"care",strength:1,confidence:1}]),
  ev(4,[{name:"trust",strength:1,confidence:1}]),
 ]);
 assert.equal(s.meaning,"repair_demonstrated");
 assert.equal(s.repairStage,"rebuilding");
});

test("repeated harm after repair remains cautionary instead of being rewritten as success",()=>{
 const s=deriveRelationshipStory([
  ev(1,[{name:"hurtful",strength:.8,confidence:1}]),
  ev(2,[{name:"repair",strength:1,confidence:1}]),
  ev(3,[{name:"care",strength:1,confidence:1}]),
  ev(4,[{name:"hurtful",strength:.9,confidence:1}]),
 ]);
 assert.equal(s.meaning,"repeated_harm");
 assert.equal(s.repairStage,"hurt");
 assert.ok(s.unresolvedHurt>0);
});

test("boundary alone is not remembered as user harm",()=>{
 const s=deriveRelationshipStory([ev(1,[{name:"boundary",strength:1,confidence:1}])]);
 assert.equal(s.meaning,"none");
 assert.equal(s.unresolvedHurt,0);
});


test("one generic warm turn after apology does not erase serious hurt",()=>{
 const s=deriveRelationshipStory([
  ev(1,[{name:"hurtful",strength:1,confidence:1}]),
  ev(2,[{name:"repair",strength:.9,confidence:1}]),
  ev(3,[{name:"warmth",strength:1,confidence:1}]),
 ]);
 assert.equal(s.meaning,"repair_in_progress");
 assert.ok(s.unresolvedHurt>0);
});


test("normal chat and Body Clock derive the same meaning for canonical relationship histories",()=>{
 const cases=[
  [ev(1,[{name:"hurtful",strength:.9,confidence:1}])],
  [ev(1,[{name:"hurtful",strength:.9,confidence:1}]),ev(2,[{name:"apology",strength:1,confidence:1}])],
  [ev(1,[{name:"hurtful",strength:.9,confidence:1}]),ev(2,[{name:"repair",strength:.9,confidence:1}])],
  [ev(1,[{name:"hurtful",strength:.7,confidence:1}]),ev(2,[{name:"repair",strength:1,confidence:1}]),ev(3,[{name:"care",strength:1,confidence:1}]),ev(4,[{name:"trust",strength:1,confidence:1}])],
  [ev(1,[{name:"hurtful",strength:.8,confidence:1}]),ev(2,[{name:"repair",strength:1,confidence:1}]),ev(3,[{name:"care",strength:1,confidence:1}]),ev(4,[{name:"hurtful",strength:.9,confidence:1}])],
  [ev(1,[{name:"boundary",strength:1,confidence:1}])],
  [ev(1,[{name:"hurtful",strength:1,confidence:1}]),ev(2,[{name:"repair",strength:.9,confidence:1}]),ev(3,[{name:"warmth",strength:1,confidence:1}])],
 ];
 for(const events of cases){
  const normal=deriveRelationshipStory(events).meaning;
  const bodyClock=storyMeaningFromEvents([...events].reverse());
  assert.equal(bodyClock,normal,JSON.stringify(events));
 }
});
