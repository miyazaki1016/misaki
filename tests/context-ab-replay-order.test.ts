import test from "node:test";
import assert from "node:assert/strict";
import {prepareApprovedReplayFixture} from "../lib/context-ab-approved-replay.ts";
import {preflightApprovedReplay,summarizeReplayPreflight} from "../lib/context-ab-replay-preflight.ts";

test("keeps consecutive Misaki messages in their original order",()=>{
 const turns=[
  {role:"user",text:"今なにしてる？"},
  {role:"misaki",text:"お茶を飲んでるよ"},
  {role:"misaki",text:"そういえば、今日はどうだった？"},
  {role:"user",text:"仕事だったよ"},
  {role:"misaki",text:"お疲れさま"},
 ];
 const before=JSON.stringify(turns);
 const fixture=prepareApprovedReplayFixture(turns,"もう少し話そう");
 assert.deepEqual(fixture.history.map(turn=>turn.parts[0].text),turns.map(turn=>turn.text));
 assert.deepEqual(fixture.history.map(turn=>turn.role),["user","model","model","user","model"]);
 assert.deepEqual(fixture.counts,{historyMessages:5,userMessages:2,modelMessages:3});
 assert.equal(JSON.stringify(turns),before);
});
test("preflight retains all 60 turns even when roles are not alternating",()=>{
 const turns=Array.from({length:60},(_,i)=>({
  role:i%3===0?"user":"misaki",
  text:`synthetic turn ${i}`,
 }));
 const result=preflightApprovedReplay(turns,"続きは？");
 assert.equal(result.fixture.history.length,60);
 assert.deepEqual(result.fixture.history.map(x=>x.parts[0].text),turns.map(x=>x.text));
 assert.deepEqual(summarizeReplayPreflight(result),{
  historyMessages:60,userMessages:20,modelMessages:40,
  flaggedTurns:0,manualReviewRequired:true,eligibleForAutomaticModelSubmission:false,
 });
});
