import test from "node:test";
import assert from "node:assert/strict";
import {screenReplayPrivacy} from "../lib/context-ab-replay-privacy.ts";

test("flags common sensitive patterns without returning source text",()=>{
 const turns=[
  {role:"user",text:"連絡先は test@example.com です"},
  {role:"misaki",text:"https://example.com/path"},
  {role:"user",text:"api_key=sk-example"},
  {role:"misaki",text:"今日はどう？"},
 ];
 const result=screenReplayPrivacy(turns);
 assert.deepEqual(result,{
  safeForAutomaticExport:false,
  needsHumanReview:true,
  findings:[
   {turnIndex:0,kinds:["email"]},
   {turnIndex:1,kinds:["url"]},
   {turnIndex:2,kinds:["credential_like"]},
  ],
 });
 assert.ok(!JSON.stringify(result).includes("test@example.com"));
});
test("zero regex findings never means export is authorized",()=>{
 assert.deepEqual(screenReplayPrivacy([{text:"東京都のどこかで会った"}]),{
  safeForAutomaticExport:false,needsHumanReview:true,findings:[],
 });
});
test("rejects malformed input",()=>{
 assert.throws(()=>screenReplayPrivacy({text:"hello"}),/local array/);
 assert.throws(()=>screenReplayPrivacy([{}]),/Invalid local turn/);
});
