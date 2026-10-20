import type { LabRun } from "./runner.ts";
import type { QualityProbe } from "./quality-probes.ts";

/**
 * Prepare an in-memory human-review worksheet without scoring the model.
 * This is NOT a record of a real model invocation and performs no I/O.
 * Callers own consent, redaction, storage, and provenance verification.
 */
export type QualityReviewPacket = Readonly<{
  schemaVersion: 1;
  probeId: string;
  focus: QualityProbe["focus"];
  context: string;
  sourceClaim: "offline-synthetic" | "recorded-model-output";
  runLabel: string;
  turns: readonly Readonly<{ turn: number; user: string; reply: string }>[];
  checklist: readonly Readonly<{
    category: "expected" | "prohibited";
    criterionIndex: number;
    criterion: string;
    verdict: "unreviewed";
    evidenceTurn: null;
    rationale: "";
  }>[];
  state: "awaiting-human-review";
}>;

export function prepareQualityReviewPacket(input: {
  probe: QualityProbe;
  run: LabRun;
  runLabel: string;
  sourceClaim: QualityReviewPacket["sourceClaim"];
}): QualityReviewPacket {
  const { probe, run, runLabel, sourceClaim } = input;
  if (run.scenarioId !== probe.id ||
      run.status !== "complete" ||
      run.completedPairs !== probe.turns.length ||
      run.turns.length !== probe.turns.length * 2 ||
      !runLabel.trim() ||
      !["offline-synthetic", "recorded-model-output"].includes(sourceClaim)) {
    throw new Error("QUALITY_PACKET_INVALID_RUN");
  }
  const turns: Array<{ turn: number; user: string; reply: string }> = [];
  for (let i = 0; i < probe.turns.length; i++) {
    const user = run.turns[i * 2];
    const model = run.turns[i * 2 + 1];
    if (user?.role !== "user" || user.text !== probe.turns[i] ||
        model?.role !== "model" || !model.text.trim()) {
      throw new Error("QUALITY_PACKET_TRANSCRIPT_MISMATCH");
    }
    turns.push({ turn: i + 1, user: user.text, reply: model.text });
  }
  const checklist = (["expected", "prohibited"] as const).flatMap(category =>
    probe[category].map((criterion, criterionIndex) => ({
      category, criterionIndex, criterion,
      verdict: "unreviewed" as const,
      evidenceTurn: null,
      rationale: "" as const,
    })),
  );
  return {
    schemaVersion: 1,
    probeId: probe.id,
    focus: probe.focus,
    context: probe.context,
    sourceClaim,
    runLabel,
    turns,
    checklist,
    state: "awaiting-human-review",
  };
}
