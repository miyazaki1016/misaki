import { runLabScenario, type LabReply, type LabRun } from "./runner.ts";
import type { LabScenario } from "./scenarios.ts";
import { QUALITY_PROBES, type QualityProbe } from "./quality-probes.ts";

/**
 * Replay fixed synthetic user turns against a caller-supplied reply function.
 * Never call a model or database directly. This returns transcripts for review,
 * NOT numeric quality scores, factual correctness, or evidence of model parity.
 */
function assertValidProbeTurns(probe: QualityProbe): void {
  if (!probe.turns.length || probe.turns.length > 20 || probe.turns.some(t => !t.trim())) {
    throw new Error("INVALID_PROBE_TURNS");
  }
}

export async function runQualityProbe(
  probe: QualityProbe,
  reply: LabReply,
): Promise<LabRun> {
  assertValidProbeTurns(probe);
  const maxTurns: 5 | 20 = probe.turns.length <= 5 ? 5 : 20;
  const scenario: LabScenario = {
    id: probe.id,
    label: probe.focus,
    userPersona: probe.context,
    opening: probe.turns[0],
    maxTurns,
    tags: [probe.focus, "quality-probe", "offline"],
  };
  return runLabScenario({
    scenario,
    pairs: probe.turns.length,
    reply,
    nextUser: async ({ turnIndex }) => {
      const turn = probe.turns[turnIndex];
      if (turn === undefined) throw new Error("PROBE_TURN_NOT_FOUND");
      return turn;
    },
  });
}

export async function runQualityProbeSuite(
  reply: LabReply,
  probes: readonly QualityProbe[] = QUALITY_PROBES,
): Promise<LabRun[]> {
  // Validate the entire batch before invoking any reply callback.
  for (const probe of probes) assertValidProbeTurns(probe);
  const runs: LabRun[] = [];
  for (const probe of probes) runs.push(await runQualityProbe(probe, reply));
  return runs;
}
