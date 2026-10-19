import { assessQualityProbe, compareQualityAssessments, type QualityFinding } from "./quality-assessment.ts";
import { compareRecordedReplyManifests, type ImportedQualityTranscript } from "./recorded-reply-import.ts";
import type { QualityProbe } from "./quality-probes.ts";

/** Human-judged, fixture-matched comparison. No model, DB, network or scoring call. */
export function compareReviewedRecordedRuns(input: {
  probe: QualityProbe;
  baseline: ImportedQualityTranscript;
  candidate: ImportedQualityTranscript;
  baselineFindings: readonly QualityFinding[];
  candidateFindings: readonly QualityFinding[];
  reviewer: string;
}): Readonly<{
  probeId: string;
  baseline: "pass" | "fail" | "needs-review";
  candidate: "pass" | "fail" | "needs-review";
  reviewRequired: boolean;
  verification: "caller-attested-unverified";
  comparable: true;
}> {
  const { probe, baseline, candidate, reviewer } = input;
  const match = compareRecordedReplyManifests(baseline.manifest, candidate.manifest);
  if (!match.compatible ||
      baseline.run.scenarioId !== candidate.run.scenarioId ||
      baseline.run.scenarioId !== probe.id ||
      baseline.sourceClaim !== "recorded-model-output" ||
      candidate.sourceClaim !== "recorded-model-output" ||
      baseline.verification !== "caller-attested-unverified" ||
      candidate.verification !== "caller-attested-unverified" ||
      baseline.manifest.captureId === candidate.manifest.captureId ||
      !reviewer.trim()) {
    throw new Error("QUALITY_REVIEW_COMPARISON_INCOMPATIBLE");
  }
  const a = assessQualityProbe({
    probe, run: baseline.run, runLabel: baseline.manifest.captureId,
    provenance: baseline.sourceClaim, reviewer, findings: input.baselineFindings,
  });
  const b = assessQualityProbe({
    probe, run: candidate.run, runLabel: candidate.manifest.captureId,
    provenance: candidate.sourceClaim, reviewer, findings: input.candidateFindings,
  });
  return {
    ...compareQualityAssessments(a, b),
    verification: "caller-attested-unverified",
    comparable: true,
  };
}
