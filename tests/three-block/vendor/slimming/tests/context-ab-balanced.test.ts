import test from "node:test";
import assert from "node:assert/strict";
import {measureBalancedABBA} from "../lib/context-ab-balanced.ts";

test("balanced order, equal inputs and numeric-only results",async()=>{
 const seen:string[]=[];
 const snapshot={
  systemPromptTemplate:"美咲です。\n{{RECENT_REPLY_SECTION}}\nJSONで返答してください。",
  recentReplies:["前の返答"],history:[{role:"user" as const,text:"こんにちは"}],userText:"またね",
 };
 const result=await measureBalancedABBA(snapshot,async request=>{
  const variant=request.systemInstruction.includes("【直近の美咲の発言】")?"A":"B";
  seen.push(variant);
  assert.equal(request.userText,"またね");
  assert.equal(request.history[0].text,"こんにちは");
  return {latencyMs:variant==="A"?100:200,promptTokens:variant==="A"?90:80,outputTokens:10,success:true,jsonValid:true,timedOut:false};
 });
 assert.deepEqual(seen,["A","B","B","A"]);
 assert.equal(result.A.runs,2);
 assert.equal(result.B.runs,2);
 assert.equal(result.A.meanLatencyMs,100);
 assert.equal(result.B.meanLatencyMs,200);
 assert.equal(result.A.meanPromptTokens,90);
 assert.equal(result.B.meanPromptTokens,80);
 assert.equal(JSON.stringify(result).includes("こんにちは"),false);
});
test("failed trials are excluded from latency means",async()=>{
 let i=0;
 const result=await measureBalancedABBA({
  systemPromptTemplate:"{{RECENT_REPLY_SECTION}}",recentReplies:[],history:[],userText:"hello",
 },async()=>{i++;return {latencyMs:i*100,promptTokens:null,outputTokens:null,success:i!==1,jsonValid:i!==1,timedOut:i===1};});
 assert.equal(result.A.successes,1);
 assert.equal(result.B.successes,2);
 assert.equal(result.A.meanLatencyMs,400);
 assert.equal(result.B.meanLatencyMs,250);
});
