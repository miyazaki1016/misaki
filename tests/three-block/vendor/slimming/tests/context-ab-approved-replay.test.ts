import test from "node:test";
import assert from "node:assert/strict";
import {prepareApprovedReplayFixture} from "../lib/context-ab-approved-replay.ts";

test("maps approved turns to Gemini roles without modifying the source", () => {
  const source = [
    {role:"user",text:"こんにちは"},
    {role:"misaki",text:"おはよう"},
    {role:"user",text:"今日はどう？"},
  ];
  const before = JSON.stringify(source);
  const fixture = prepareApprovedReplayFixture(source);
  assert.deepEqual(fixture.history,[
    {role:"user",parts:[{text:"こんにちは"}]},
    {role:"model",parts:[{text:"おはよう"}]},
  ]);
  assert.equal(fixture.nextUserText,"今日はどう？");
  assert.deepEqual(fixture.counts,{historyMessages:2,userMessages:1,modelMessages:1});
  assert.equal(JSON.stringify(source),before);
});

test("supports all 60 stored turns with a separate next user message",()=>{
  const turns=Array.from({length:60},(_,i)=>({role:i%2===0?"user":"misaki",text:`turn ${i}`}));
  const fixture=prepareApprovedReplayFixture(turns,"次の発言");
  assert.equal(fixture.history.length,60);
  assert.equal(fixture.nextUserText,"次の発言");
  assert.deepEqual(fixture.counts,{historyMessages:60,userMessages:30,modelMessages:30});
});

test("rejects malformed and unknown roles",()=>{
  assert.throws(()=>prepareApprovedReplayFixture([{role:"system",text:"x"},{role:"misaki",text:"y"},{role:"user",text:"z"}]),/Unsupported/);
  assert.throws(()=>prepareApprovedReplayFixture([{role:"user",text:"x"},{role:"misaki",text:"y"},{role:"misaki",text:"z"}]),/Last turn/);
  assert.throws(()=>prepareApprovedReplayFixture([{role:"user",text:"x"},{role:"misaki",text:""}],"hi"),/Invalid role/);
  assert.throws(()=>prepareApprovedReplayFixture([{role:"user",text:"x"},{role:"misaki",text:"y"}],""),/Invalid next/);
});
