import { qualityScenarios, assessQualityReply } from "../lib/context-ab-quality.ts";

let checks = 0;
let failures = 0;
const record = (ok: boolean, scenarioId: string, check: string) => {
  checks += 1;
  if (!ok) {
    failures += 1;
    console.error(`FAIL ${scenarioId}: ${check}`);
  }
};

for (const scenario of qualityScenarios) {
  const empty = assessQualityReply(scenario, "");
  record(!empty.nonempty, scenario.id, "empty reply must fail nonempty check");

  for (const term of scenario.forbiddenTerms) {
    const result = assessQualityReply(scenario, term);
    record(!result.unsupportedClaimsAbsent, scenario.id, `forbidden term was not detected: ${term}`);
  }

  for (const term of scenario.expectedTerms) {
    const result = assessQualityReply(scenario, term);
    record(result.expectedFactsPresent, scenario.id, `expected term was not detected: ${term}`);
  }

  const neutralReply = "承知しました。今の話に合わせて、無理のない範囲で考えてみましょう。";
  const neutral = assessQualityReply(scenario, neutralReply);
  record(neutral.unsupportedClaimsAbsent, scenario.id, "neutral synthetic reply unexpectedly matched a forbidden term");

  console.log(`${failures === 0 ? "CHECKED" : "REVIEW"} ${scenario.id}`);
}

console.log(`Synthetic regression checks: ${checks - failures}/${checks} passed across ${qualityScenarios.length} scenarios.`);
console.log("Local deterministic checks only; no AI model, network call, or real conversation data used.");
if (failures > 0) process.exitCode = 1;
