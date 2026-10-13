import { qualityScenarios, assessQualityReply } from "../lib/context-ab-quality.ts";

let checks = 0;
let failures = 0;
const fail = (scenarioId: string, check: string) => {
  failures += 1;
  console.error(`FAIL ${scenarioId}: ${check}`);
};
const pass = () => { checks += 1; };

for (const scenario of qualityScenarios) {
  const empty = assessQualityReply(scenario, "");
  if (!empty.nonempty) pass(); else fail(scenario.id, "empty reply must fail nonempty check");

  for (const term of scenario.forbiddenTerms) {
    const result = assessQualityReply(scenario, term);
    if (!result.unsupportedClaimsAbsent) pass();
    else fail(scenario.id, `forbidden term was not detected: ${term}`);
  }

  for (const term of scenario.expectedTerms) {
    const result = assessQualityReply(scenario, term);
    if (result.expectedFactsPresent) pass();
    else fail(scenario.id, `expected term was not detected: ${term}`);
  }

  const neutralReply = "承知しました。今の話に合わせて、無理のない範囲で考えてみましょう。";
  const neutral = assessQualityReply(scenario, neutralReply);
  if (neutral.unsupportedClaimsAbsent) pass();
  else fail(scenario.id, "neutral synthetic reply unexpectedly matched a forbidden term");

  console.log(`${failures === 0 ? "CHECKED" : "REVIEW"} ${scenario.id}`);
}

console.log(`Synthetic regression checks: ${checks - failures}/${checks} passed across ${qualityScenarios.length} scenarios.`);
console.log("Local deterministic checks only; no AI model, network call, or real conversation data used.");
if (failures > 0) process.exitCode = 1;
