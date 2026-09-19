import assert from "node:assert/strict";
import test from "node:test";
import { deriveProactiveTags } from "../supabase/functions/body-clock/proactive-decision.ts";

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
