import assert from "node:assert/strict";
import test from "node:test";
import { assessQualityProbe, compareQualityAssessments, type QualityFinding } from "../lib/conversation-lab/quality-assessment.ts";
import { runQualityProbe } from "../lib/conversation-lab/quality-probe-runner.ts";
import { QUALITY_PROBES } from "../lib/conversation-lab/quality-probes.ts";

const probe = QUALITY_PROBES[0];
const findings: QualityFinding[] = [
  ...probe.expected.map((_, criterionIndex) => ({ category: "expected" as const, criterionIndex, verdict: "pass" as const, evidenceTurn: 1, rationale: "Reviewer checked utterance" })),
  ...probe.prohibited.map((_, criterionIndex) => ({ category: "prohibited" as const, criterionIndex, verdict: "pass" as const, evidenceTurn: 1, rationale: "Reviewer checked full transcript" })),
];
async function run() {
  return runQualityProbe(probe, async () => "Synthetic response for structure test");
}
test("fully covered human finding record preserves provenance and pass verdict", async () => {
  const record = assessQualityProbe({ probe, run: await run(), runLabel: "baseline", reviewer: "tester", provenance: "offline-synthetic", findings });
  assert.equal(record.outcome, "pass");
  assert.equal(record.findings.length, probe.expected.length + probe.prohibited.length);
  assert.equal(record.provenance, "offline-synthetic");
});

test("failed or uncertain criteria never produce pass", async () => {
  const result = await run();
  const make = (verdict: "fail" | "uncertain") => assessQualityProbe({
    probe, run: result, runLabel: "candidate", reviewer: "tester", provenance: "offline-synthetic",
    findings: [{ ...findings[0], verdict }, ...findings.slice(1)],
  });
  assert.equal(make("fail").outcome, "fail");
  assert.equal(make("uncertain").outcome, "needs-review");
});

test("incomplete assessment and mismatched user turn are rejected", async () => {
  const result = await run();
  assert.throws(() => assessQualityProbe({
    probe, run: result, runLabel: "baseline", reviewer: "tester", provenance: "offline-synthetic", findings: findings.slice(1),
  }), /COVERAGE_MISSING/);
  const forged = { ...result, turns: result.turns.map((t, i) => i === 0 ? { ...t, text: "different question" } : t) };
  assert.throws(() => assessQualityProbe({
    probe, run: forged, runLabel: "baseline", reviewer: "tester", provenance: "offline-synthetic", findings,
  }), /TRANSCRIPT_MISMATCH/);
  assert.throws(() => assessQualityProbe({
    probe, run: result, runLabel: "baseline", reviewer: "tester", provenance: "offline-synthetic",
    findings: [{ ...findings[0], evidenceTurn: 99 }, ...findings.slice(1)],
  }), /FINDING_INVALID/);
});

test("offline synthetic assessments cannot be compared as measured model improvement", async () => {
  const result = await run();
  const baseline = assessQualityProbe({ probe, run: result, runLabel: "baseline", reviewer: "tester", provenance: "offline-synthetic", findings });
  const candidate = { ...baseline, runLabel: "candidate" };
  assert.throws(() => compareQualityAssessments(baseline, candidate), /INCOMPATIBLE/);
});

test("recorded-model-output review comparison only reports status, not invented quality percentage", async () => {
  const result = await run();
  const baseline = assessQualityProbe({ probe, run: result, runLabel: "baseline", reviewer: "tester", provenance: "recorded-model-output", findings });
  const candidate = { ...baseline, runLabel: "candidate", outcome: "fail" as const };
  assert.deepEqual(compareQualityAssessments(baseline, candidate), {
    probeId: probe.id, baseline: "pass", candidate: "fail", reviewRequired: true,
  });
});
