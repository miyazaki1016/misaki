import test from "node:test";
import assert from "node:assert/strict";
import {qualityScenarios} from "../lib/context-ab-quality.ts";
import {makeLongQualityHistory,recentModelReplies} from "../lib/context-ab-quality-long-history.ts";

test("extended quality scenarios have exactly 60 synthetic messages and eight recent replies",()=>{
 for(const scenario of qualityScenarios){
   const history=makeLongQualityHistory(scenario);
   assert.equal(history.length,60);
   assert.deepEqual(history.slice(0,scenario.history.length),scenario.history);
   assert.equal(recentModelReplies(history).length,8);
   assert.ok(history.every((turn,i)=>turn.role===(i%2===0?"user":"model")));
   assert.equal(recentModelReplies(history)[7],history[59].text);
 }
});
