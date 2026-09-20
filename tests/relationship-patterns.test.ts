import test from "node:test";
import assert from "node:assert/strict";
import { deriveRelationshipPatterns } from "../lib/relationship-patterns.ts";

const event=(signals:any[],daysAgo=0)=>({
 event_type:"emotion_action_v2_after_chat",
 created_at:new Date(Date.now()-daysAgo*86400000).toISOString(),
 metadata:{signal_summary:signals},
});
const s=(name:string,strength=.8,confidence=.95)=>({name,strength,confidence});

test("repeated harm counts distinct persisted events",()=>{
 const p=deriveRelationshipPatterns([event([s("hurtful")]),event([s("hurtful")],1),event([s("boundary")],2)]);
 assert.equal(p.repeatedHarm,2);
});

test("repair mixed with fresh harm is not credited as reliable repair",()=>{
 const p=deriveRelationshipPatterns([event([s("repair"),s("hurtful")]),event([s("repair")],1)]);
 assert.equal(p.reliableRepair,0);
 assert.equal(p.repeatedHarm,1.35);
});

test("care mixed with harm is not credited as sustained care",()=>{
 const p=deriveRelationshipPatterns([event([s("care"),s("hurtful")]),event([s("care"),s("warmth")],1)]);
 assert.equal(p.sustainedCare,1);
});

test("pattern counters are capped so history cannot amplify forever",()=>{
 const events=Array.from({length:10},(_,i)=>event([s("hurtful"),s("care"),s("repair")],i));
 const p=deriveRelationshipPatterns(events);
 assert.equal(p.repeatedHarm,3);
 assert.equal(p.reliableRepair,0);
 assert.equal(p.sustainedCare,0);
});

test("apology alone is not evidence of demonstrated reliable repair",()=>{
 const p=deriveRelationshipPatterns([event([s("apology")]),event([s("apology")],1)]);
 assert.equal(p.reliableRepair,0);
});


test("old hurt fades in learned pattern weight instead of becoming permanent resentment",()=>{
 const recent=deriveRelationshipPatterns([event([s("hurtful")],5)]);
 const old=deriveRelationshipPatterns([event([s("hurtful")],200)]);
 assert.ok((recent.repeatedHarm??0) > (old.repeatedHarm??0));
 assert.ok((old.repeatedHarm??0) > 0);
});

test("harm recurring after repair is weighted more than two unrelated hurts",()=>{
 const repairedThenRelapsed=deriveRelationshipPatterns([
  event([s("hurtful")],0),
  event([s("repair")],1),
  event([s("hurtful")],2),
 ]);
 const unrelated=deriveRelationshipPatterns([
  event([s("hurtful")],0),
  event([s("hurtful")],2),
 ]);
 assert.ok((repairedThenRelapsed.repeatedHarm??0) > (unrelated.repeatedHarm??0));
});

test("repair intent alone never becomes reliable repair, recent or old",()=>{
 const recent=deriveRelationshipPatterns([event([s("repair")],5)]);
 const old=deriveRelationshipPatterns([event([s("repair")],200)]);
 assert.equal(recent.reliableRepair,0);
 assert.equal(old.reliableRepair,0);
});

test("repair earns reliability only after a later caring outcome",()=>{
 const p=deriveRelationshipPatterns([event([s("care")],0),event([s("repair")],1)]);
 assert.ok((p.reliableRepair??0) > 0);
});

test("sustained recent care outweighs a single old caring event",()=>{
 const sustained=deriveRelationshipPatterns([
  event([s("care")],2), event([s("trust")],8), event([s("warmth")],20),
 ]);
 const old=deriveRelationshipPatterns([event([s("care")],200)]);
 assert.ok((sustained.sustainedCare??0) > (old.sustainedCare??0));
});
