import assert from "node:assert/strict";
import test from "node:test";
import { compareReviewedRecordedRuns } from "../lib/conversation-lab/quality-reviewed-comparison.ts";
import { importRecordedQualityReplies, type RecordedReplyManifest } from "../lib/conversation-lab/recorded-reply-import.ts";
import { QUALITY_PROBES } from "../lib/conversation-lab/quality-probes.ts";
import type { QualityFinding } from "../lib/conversation-lab/quality-assessment.ts";

const probe = QUALITY_PROBES.find(p => p.id === "Q14")!;
const base: RecordedReplyManifest = {
  captureId: "baseline-001", modelName: "fixture", modelVersion: "1",
  promptRevision: "p1", personaRevision: "persona-1",
  relationshipFixtureId: "relationship-1", memoryFixtureId: "memory-1",
  timeFixture: "2026-10-19T08:00:00+09:00", externalContextFixtureId: "none",
  userConsentOrSyntheticFixture: "synthetic-fixture",
};
const record = (manifest: RecordedReplyManifest) => importRecordedQualityReplies({
  probe, manifest, replies: probe.turns.map((_, i) => "Synthetic reply " + i),
});
const findings: QualityFinding[] = [
  ...probe.expected.map((_, criterionIndex) => ({
    category: "expected" as const, criterionIndex, verdict: "pass" as const,
    evidenceTurn: 1, rationale: "Explicit fixture review only",
  })),
  ...probe.prohibited.map((_, criterionIndex) => ({
    category: "prohibited" as const, criterionIndex, verdict: "pass" as const,
    evidenceTurn: 1, rationale: "Explicit fixture review only",
  })),
];
const candidateManifest: RecordedReplyManifest = {
  ...base, captureId: "candidate-001", promptRevision: "p2",
};
const inputs = () => ({
  probe, baseline: record(base), candidate: record(candidateManifest),
  baselineFindings: findings, candidateFindings: findings, reviewer: "fixture-reviewer",
});

test("compatible snapshots produce only reviewed outcomes, never numeric improvement", () => {
  const result = compareReviewedRecordedRuns(inputs());
  assert.deepEqual(result, {
    probeId: probe.id, baseline: "pass", candidate: "pass",
    reviewRequired: false, verification: "caller-attested-unverified", comparable: true,
  });
  assert.ok(!("score" in result));
});

test("refuses comparison across different memory or relationship fixtures", () => {
  for (const key of ["memoryFixtureId", "relationshipFixtureId"] as const) {
    const input = inputs();
    assert.throws(() => compareReviewedRecordedRuns({
      ...input,
      candidate: record({ ...candidateManifest, [key]: "changed" }),
    }), /INCOMPATIBLE/);
  }
});

test("refuses same capture id or unreviewed criteria", () => {
  const input = inputs();
  assert.throws(() => compareReviewedRecordedRuns({
    ...input, candidate: record({ ...candidateManifest, captureId: base.captureId }),
  }), /INCOMPATIBLE/);
  assert.throws(() => compareReviewedRecordedRuns({
    ...input, candidateFindings: findings.slice(1),
  }), /COVERAGE_MISSING/);
});

test("failure remains failure and never turns into fictitious percentage", () => {
  const result = compareReviewedRecordedRuns({
    ...inputs(), candidateFindings: [{ ...findings[0], verdict: "fail" }, ...findings.slice(1)],
  });
  assert.equal(result.candidate, "fail");
  assert.equal(result.reviewRequired, true);
});
