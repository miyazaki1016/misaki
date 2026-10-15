import type { LabRun } from "./runner.ts";

export type LabQualityAxis =
  | "naturalness" | "context" | "persona" | "flow"
  | "emotion" | "distance" | "grounding" | "engagement";
export const QUALITY_AXES: readonly LabQualityAxis[] = [
  "naturalness", "context", "persona", "flow",
  "emotion", "distance", "grounding", "engagement",
] as const;
export type LabReview = {
  scenarioId: string;
  source: "human" | "ai-judge";
  reviewer: string;
  scores: Record<LabQualityAxis, 1 | 2 | 3 | 4 | 5>;
  notes: string[];
  flaggedTurns: number[];
};
export type LabComparison = {
  scenarioId: string;
  baseline: LabReview;
  candidate: LabReview;
  deltas: Record<LabQualityAxis, number>;
  regressions: LabQualityAxis[];
};

export function compareLabReviews(baseline: LabReview, candidate: LabReview): LabComparison {
  if (baseline.scenarioId !== candidate.scenarioId) throw Error("scenario mismatch");
  for (const review of [baseline, candidate]) {
    if (!review.reviewer.trim()) throw Error("reviewer required");
    for (const axis of QUALITY_AXES) {
      const score = review.scores[axis];
      if (!Number.isInteger(score) || score < 1 || score > 5) throw Error("invalid review score: " + axis);
    }
  }
  const deltas = {} as Record<LabQualityAxis, number>;
  const regressions: LabQualityAxis[] = [];
  for (const axis of QUALITY_AXES) {
    deltas[axis] = candidate.scores[axis] - baseline.scores[axis];
    if (deltas[axis] < 0) regressions.push(axis);
  }
  return { scenarioId: baseline.scenarioId, baseline, candidate, deltas, regressions };
}

export function serializeLabRecord(record: LabRun): string {
  // Explicitly label provenance: an offline fixture is never real Gemini output.
  return JSON.stringify({ schemaVersion: 1, provenance: "offline-synthetic", ...record });
}
