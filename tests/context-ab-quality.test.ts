import assert from "node:assert/strict";
import test from "node:test";
import {qualityScenarios,assessQualityReply,summarizeBlindQuality} from "../lib/context-ab-quality.ts";

test("quality scenarios have unique IDs and deterministic checks",()=>{
  assert.equal(qualityScenarios.length,7);
  assert.equal(new Set(qualityScenarios.map(s=>s.id)).size,qualityScenarios.length);
  for(const scenario of qualityScenarios){
    assert.ok(scenario.history.length>0);
    assert.equal(assessQualityReply(scenario,"").nonempty,false);
    const violating=scenario.forbiddenTerms[0];
    if(violating) assert.equal(assessQualityReply(scenario,violating).unsupportedClaimsAbsent,false);
    const expected=scenario.expectedTerms.join(" ");
    assert.equal(assessQualityReply(scenario,expected).expectedFactsPresent,true);
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
});
