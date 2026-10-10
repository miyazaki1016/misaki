import test from "node:test";
import assert from "node:assert/strict";
import {preflightApprovedReplay,summarizeReplayPreflight} from "../lib/context-ab-replay-preflight.ts";

test("preflight maps a local conversation and reports numeric-only diagnostics",()=>{
 const source=[
  {role:"user",text:"test@example.com"},
  {role:"misaki",text:"こんにちは"},
  {role:"user",text:"また話そう"},
 ];
 const result=preflightApprovedReplay(source);
 assert.equal(result.fixture.history.length,2);
 assert.equal(result.privacy.findings.length,1);
 assert.deepEqual(summarizeReplayPreflight(result),{
  historyMessages:2,userMessages:1,modelMessages:1,
  flaggedTurns:1,manualReviewRequired:true,eligibleForAutomaticModelSubmission:false,
 });
 assert.ok(!JSON.stringify(summarizeReplayPreflight(result)).includes("test@example.com"));
});
test("even clean 60-turn fixtures cannot be submitted automatically",()=>{
 const history=Array.from({length:60},(_,i)=>({role:i%2?"misaki":"user",text:`turn ${i}`}));
 const result=preflightApprovedReplay(history,"次の発言");
 assert.equal(result.fixture.history.length,60);
 assert.equal(result.privacy.findings.length,0);
 assert.equal(result.eligibleForAutomaticModelSubmission,false);
});
test("the next message is screened too",()=>{
 const result=preflightApprovedReplay([
  {role:"user",text:"こんにちは"},
  {role:"misaki",text:"こんにちは"},
 ],"test@example.com");
 assert.deepEqual(result.privacy.findings,[{turnIndex:2,kinds:["email"]}]);
});
