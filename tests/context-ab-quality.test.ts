import assert from "node:assert/strict";
import test from "node:test";
import {qualityScenarios,assessQualityReply,summarizeBlindQuality} from "../lib/context-ab-quality.ts";

test("quality scenarios have unique IDs and deterministic checks",()=>{
  assert.equal(qualityScenarios.length,7);
  assert.equal(new Set(qualityScenarios.map(s=>s.id)).size,qualityScenarios.length);
  for(const scenario of qualityScenarios){
    assert.ok(scenario.history.length>0);
    assert.equal(assessQualityReply(scenario,"").nonempty,false);
    for(const forbidden of scenario.forbiddenTerms){
      assert.equal(
        assessQualityReply(scenario,forbidden).unsupportedClaimsAbsent,
        false,
        `Scenario ${scenario.id} should reject forbidden text: ${forbidden}`,
      );
    }
    assert.equal(assessQualityReply(scenario,"自然な返答です").unsupportedClaimsAbsent,true);
    for(const expected of scenario.expectedTerms){
      assert.equal(
        assessQualityReply(scenario,expected).expectedFactsPresent,
        true,
        `Scenario ${scenario.id} should accept expected fact: ${expected}`,
      );
    }
    assert.equal(assessQualityReply(scenario,"関係ない文章").expectedFactsPresent,scenario.expectedTerms.length===0);
  }
});

test("blind quality summary compares all five axes and detects ties",()=>{
  const result=summarizeBlindQuality({
    left:{memory:2,relationship:1,continuity:2,repetition:2,naturalness:1},
    right:{memory:1,relationship:1,continuity:1,repetition:2,naturalness:1},
  });
  assert.equal(result.scores.length,5);
  assert.equal(result.leftTotal,8);
  assert.equal(result.rightTotal,6);
  assert.equal(result.overall,"left");
  assert.deepEqual(result.scores.map(s=>s.winner),["left","tie","left","tie","tie"]);
  const tied=summarizeBlindQuality({
    left:{memory:1,relationship:1,continuity:1,repetition:1,naturalness:1},
    right:{memory:1,relationship:1,continuity:1,repetition:1,naturalness:1},
  });
  assert.equal(tied.overall,"tie");
  assert.deepEqual(tied.safetyBlocker,{left:true,right:true,any:true});
});


test("blind quality summary supports the documented five-point scale",()=>{
  const result=summarizeBlindQuality({
    left:{memory:5,relationship:4,continuity:5,repetition:4,naturalness:5},
    right:{memory:4,relationship:4,continuity:3,repetition:4,naturalness:2},
  });
  assert.equal(result.leftTotal,23);
  assert.equal(result.rightTotal,17);
  assert.equal(result.overall,"left");
  assert.equal(result.scores.find(s=>s.axis==="naturalness")?.right,2);
  assert.deepEqual(result.safetyBlocker,{left:false,right:true,any:true});
});
