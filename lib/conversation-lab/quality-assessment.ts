import type { LabRun } from "./runner.ts";
import type { QualityProbe } from "./quality-probes.ts";

/**
 * A human-auditable assessment of an observed transcript.
 * This module does not judge whether an utterance is good: the reviewer must
 * enter evidence and a verdict for each expectation/prohibition.
 */
export type QualityFinding = Readonly<{
  category: "expected" | "prohibited";
  criterionIndex: number;
  verdict: "pass" | "fail" | "uncertain";
  evidenceTurn: number | null;
  rationale: string;
}>;

export type QualityAssessment = Readonly<{
  schemaVersion: 1;
  probeId: string;
  runLabel: string;
  provenance: "offline-synthetic" | "recorded-model-output";
  reviewer: string;
  findings: readonly QualityFinding[];
  outcome: "pass" | "fail" | "needs-review";
}>;

export function assessQualityProbe(input: {
  probe: QualityProbe;
  run: LabRun;
  runLabel: string;
  provenance: QualityAssessment["provenance"];
  reviewer: string;
  findings: readonly QualityFinding[];
}): QualityAssessment {
  const { probe, run, runLabel, provenance, reviewer, findings } = input;
  if (run.scenarioId !== probe.id || run.status !== "complete" ||
      run.completedPairs !== probe.turns.length ||
      run.turns.length !== probe.turns.length * 2 ||
      !runLabel.trim() || !reviewer.trim()) {
    throw new Error("QUALITY_ASSESSMENT_RUN_INVALID");
  }
  for (let i = 0; i < probe.turns.length; i++) {
    if (run.turns[i * 2]?.role !== "user" ||
        run.turns[i * 2]?.text !== probe.turns[i] ||
        run.turns[i * 2 + 1]?.role !== "model" ||
        !run.turns[i * 2 + 1]?.text.trim()) {
      throw new Error("QUALITY_ASSESSMENT_TRANSCRIPT_MISMATCH");
    }
  }
  if (!["offline-synthetic", "recorded-model-output"].includes(provenance)) {
    throw new Error("QUALITY_ASSESSMENT_PROVENANCE_INVALID");
  }
  if (findings.length !== probe.expected.length + probe.prohibited.length) {
    throw new Error("QUALITY_ASSESSMENT_COVERAGE_MISSING");
  }
  const seen = new Set<string>();
  for (const finding of findings) {
    const count = finding.category === "expected" ? probe.expected.length : probe.prohibited.length;
    const key = finding.category + ":" + finding.criterionIndex;
    if (!["expected", "prohibited"].includes(finding.category) ||
        !Number.isInteger(finding.criterionIndex) || finding.criterionIndex < 0 ||
        finding.criterionIndex >= count || seen.has(key) ||
        !["pass", "fail", "uncertain"].includes(finding.verdict) ||
        (finding.evidenceTurn !== null && (!Number.isInteger(finding.evidenceTurn) ||
        finding.evidenceTurn < 1 || finding.evidenceTurn > run.completedPairs)) ||
        !finding.rationale.trim()) {
      throw new Error("QUALITY_ASSESSMENT_FINDING_INVALID");
    }
    seen.add(key);
  }
  const outcome = findings.some(f => f.verdict === "fail")
    ? "fail"
    : findings.some(f => f.verdict === "uncertain") ? "needs-review" : "pass";
  return { schemaVersion: 1, probeId: probe.id, runLabel, provenance, reviewer, findings: [...findings], outcome };
}

export function compareQualityAssessments(
  baseline: QualityAssessment,
  candidate: QualityAssessment,
): { probeId: string; baseline: QualityAssessment["outcome"]; candidate: QualityAssessment["outcome"]; reviewRequired: boolean } {
  if (baseline.probeId !== candidate.probeId ||
      baseline.provenance !== "recorded-model-output" ||
      candidate.provenance !== "recorded-model-output" ||
      baseline.runLabel === candidate.runLabel) {
    throw new Error("QUALITY_COMPARISON_INCOMPATIBLE");
  }
  // Human judgement is not reduced to fabricated improvement percentages.
  return {
    probeId: baseline.probeId,
    baseline: baseline.outcome,
    candidate: candidate.outcome,
    reviewRequired: baseline.outcome !== "pass" || candidate.outcome !== "pass",
  };
}
