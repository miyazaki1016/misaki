import { BASELINE_SCENARIOS, toGeminiHistory, validateLabTranscript, type LabScenario, type LabTurn } from "./scenarios.ts";

/**
 * Offline conversation harness. Callers supply a reply function; this module
 * never imports a network client, server endpoint, DB, or production writer.
 * Synthetic outputs are NOT evidence of production Misaki quality.
 */
export type LabReply = (input: {
  scenario: LabScenario;
  message: string;
  history: ReturnType<typeof toGeminiHistory>;
  turnIndex: number;
}) => Promise<string>;
export type LabUser = (input: {
  scenario: LabScenario;
  transcript: readonly LabTurn[];
  turnIndex: number;
}) => Promise<string>;
export type LabRun = {
  scenarioId: string;
  turns: LabTurn[];
  completedPairs: number;
  status: "complete" | "stopped" | "error";
  error?: string;
};
export type LabSink = (record: LabRun) => Promise<void> | void;

export async function runLabScenario(input: {
  scenario: LabScenario;
  reply: LabReply;
  nextUser: LabUser;
  pairs?: number;
  sink?: LabSink;
}): Promise<LabRun> {
  const { scenario, reply, nextUser, sink } = input;
  const pairs = input.pairs ?? scenario.maxTurns;
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > scenario.maxTurns) {
    throw new Error("pairs exceed scenario budget");
  }
  const turns: LabTurn[] = [];
  const result: LabRun = { scenarioId: scenario.id, turns, completedPairs: 0, status: "stopped" };
  try {
    for (let index = 0; index < pairs; index++) {
      const message = index === 0
        ? scenario.opening
        : await nextUser({ scenario, transcript: turns.map(turn => ({ ...turn })), turnIndex: index });
      if (typeof message !== "string" || !message.trim() || message.length > 4000) {
        throw new Error("invalid user turn");
      }
      const history = turns.length ? toGeminiHistory(turns) : [];
      turns.push({ role: "user", text: message });
      const answer = await reply({ scenario, message, history, turnIndex: index });
      if (typeof answer !== "string" || !answer.trim() || answer.length > 4000) {
        throw new Error("invalid model reply");
      }
      turns.push({ role: "model", text: answer });
      validateLabTranscript(turns, scenario.maxTurns);
      result.completedPairs++;
    }
    result.status = "complete";
  } catch (error) {
    result.status = "error";
    result.error = error instanceof Error ? error.message : "unknown error";
  }
  if (sink) await sink({ ...result, turns: turns.map(turn => ({ ...turn })) });
  return result;
}

export async function runOfflineBaseline(input: {
  reply: LabReply;
  nextUser: LabUser;
  sink?: LabSink;
  scenarios?: readonly LabScenario[];
}): Promise<LabRun[]> {
  const results: LabRun[] = [];
  for (const scenario of input.scenarios ?? BASELINE_SCENARIOS) {
    results.push(await runLabScenario({ ...input, scenario }));
  }
  return results;
}
