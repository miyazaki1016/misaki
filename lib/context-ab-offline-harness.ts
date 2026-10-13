import { makePromptVariants } from "./context-ab-prompt.ts";
import { summarizeContextTrials, type ContextTrial } from "./context-ab-results.ts";

/**
 * Offline-only benchmark harness. Caller supplies a *frozen*, already
 * anonymized snapshot and a read-only model adapter. This module does not
 * import Supabase, perform fetch, write usage, or touch relationship state.
 *
 * IMPORTANT: This is not an HTTP route. Do not expose it via /api/chat.
 */
export type FrozenContextSnapshot = Readonly<{
  systemPromptTemplate: string;
  recentReplies: readonly string[];
  history: readonly Readonly<{ role: "user" | "model"; text: string }>[];
  userText: string;
}>;

export type ModelTrialResult = {
  latencyMs: number;
  promptTokens: number | null;
  outputTokens: number | null;
  success: boolean;
  jsonValid: boolean;
  timedOut: boolean;
  httpStatus?: number | null;
  emptyCandidate?: boolean;
};

export type ReadOnlyModelAdapter = (request: Readonly<{
  systemInstruction: string;
  history: FrozenContextSnapshot["history"];
  userText: string;
}>) => Promise<ModelTrialResult>;

export async function runOfflineContextComparison(
  snapshot: FrozenContextSnapshot,
  adapter: ReadOnlyModelAdapter,
  runsPerVariant = 20,
) {
  if (!Number.isSafeInteger(runsPerVariant) || runsPerVariant < 1 || runsPerVariant > 100) {
    throw new Error("runsPerVariant must be between 1 and 100");
  }
  const prompts = makePromptVariants(
    snapshot.systemPromptTemplate,
    snapshot.recentReplies,
  );
  const trials: ContextTrial[] = [];
  // Alternate A/B order across pairs to reduce systematic warmup bias.
  for (let index = 0; index < runsPerVariant; index++) {
    const order = index % 2 === 0 ? (["A", "B"] as const) : (["B", "A"] as const);
    for (const variant of order) {
      const response = await adapter({
        systemInstruction: prompts[variant],
        history: snapshot.history,
        userText: snapshot.userText,
      });
      trials.push({ variant, ...response });
    }
  }
  return {
    promptChars: prompts.metrics,
    summary: summarizeContextTrials(trials),
    trials,
  };
}
