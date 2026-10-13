import test from "node:test";
import assert from "node:assert/strict";
import {preflightApprovedReplay} from "../lib/context-ab-replay-preflight.ts";
import {makeReviewedOfflineSnapshot} from "../lib/context-ab-reviewed-snapshot.ts";
import {runOfflineContextComparison} from "../lib/context-ab-offline-harness.ts";

test("approved local snapshot reaches both A and B with identical history",async()=>{
 const turns=[
  {role:"user",text:"こんにちは"},
  {role:"misaki",text:"こんにちは"},
  {role:"misaki",text:"元気？"},
  {role:"user",text:"元気だよ"},
 ];
 const snapshot=makeReviewedOfflineSnapshot({
  preflight:preflightApprovedReplay(turns,"続きを話そう"),
  systemPromptTemplate:"Persona. {{RECENT_REPLY_SECTION}}",
  manuallyReviewedAndApproved:true,
 });
 assert.equal(snapshot.history.length,4);
 assert.deepEqual(snapshot.recentReplies,["こんにちは","元気？"]);
 const requests:{history:unknown;userText:string;systemInstruction:string}[]=[];
 const result=await runOfflineContextComparison(snapshot,async request=>{
  requests.push({
   history:request.history,userText:request.userText,systemInstruction:request.systemInstruction,
  });
  return {latencyMs:1,promptTokens:10,outputTokens:5,success:true,jsonValid:true,timedOut:false};
 },1);
 assert.equal(requests.length,2);
 assert.deepEqual(requests[0].history,requests[1].history);
 assert.equal(requests[0].userText,requests[1].userText);
 assert.notEqual(requests[0].systemInstruction,requests[1].systemInstruction);
 assert.ok(result.summary);
});
test("unreviewed or malformed template is rejected",()=>{
 const preflight=preflightApprovedReplay([{role:"user",text:"a"},{role:"misaki",text:"b"}],"c");
 assert.throws(()=>makeReviewedOfflineSnapshot({
  preflight,systemPromptTemplate:"{{RECENT_REPLY_SECTION}}",manuallyReviewedAndApproved:false as true,
 }),/Explicit review/);
 assert.throws(()=>makeReviewedOfflineSnapshot({
  preflight,systemPromptTemplate:"no placeholder",manuallyReviewedAndApproved:true,
 }),/placeholder/);
});
