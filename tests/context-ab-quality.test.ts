import assert from "node:assert/strict";
import test from "node:test";
import {qualityScenarios,assessQualityReply} from "../lib/context-ab-quality.ts";
test("quality scenarios have unique IDs and deterministic checks",()=>{
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
