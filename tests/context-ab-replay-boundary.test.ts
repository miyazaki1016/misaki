import test from "node:test";
import assert from "node:assert/strict";
import {selectLastUserReplayBoundary} from "../lib/context-ab-replay-boundary.ts";

test("replays last user and excludes future model messages",()=>{
 const fixture=selectLastUserReplayBoundary([
  {role:"user",text:"a"},{role:"misaki",text:"b"},
  {role:"user",text:"c"},{role:"misaki",text:"future reply"},
 ]);
 assert.equal(fixture.nextUserText,"c");
 assert.deepEqual(fixture.history.map(t=>t.parts[0].text),["a","b"]);
});
test("handles consecutive model replies",()=>{
 const fixture=selectLastUserReplayBoundary([
  {role:"user",text:"a"},{role:"misaki",text:"b"},
  {role:"misaki",text:"c"},{role:"user",text:"d"},
 ]);
 assert.equal(fixture.nextUserText,"d");
 assert.deepEqual(fixture.history.map(t=>t.role),["user","model","model"]);
});
test("rejects missing replay boundary",()=>{
 assert.throws(()=>selectLastUserReplayBoundary([{role:"user",text:"a"},{role:"misaki",text:"b"}]),/Not enough context/);
});
