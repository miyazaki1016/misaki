/** Offline A/B aggregation only. No network access, DB writes, or chat calls. */
export type ContextTrial = {
  variant: "A" | "B";
  latencyMs: number;
  promptTokens: number | null;
  outputTokens: number | null;
  success: boolean;
  jsonValid: boolean;
  timedOut: boolean;
};
export function summarizeContextTrials(trials: readonly ContextTrial[]) {
  const summarize = (variant: "A" | "B") => {
    const rows = trials.filter((row) => row.variant === variant);
    const percentile = (values: number[], p: number) => {
      if (!values.length) return null;
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.ceil(p * sorted.length) - 1];
    };
    const mean = (values: number[]) =>
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const successful = rows.filter((row) => row.success);
    return {
      count: rows.length,
      successes: successful.length,
      timeouts: rows.filter((row) => row.timedOut).length,
      invalidJson: rows.filter((row) => !row.jsonValid).length,
      latencyP50Ms: percentile(rows.map((row) => row.latencyMs), 0.5),
      latencyP95Ms: percentile(rows.map((row) => row.latencyMs), 0.95),
      meanPromptTokens: mean(rows.flatMap((row) => row.promptTokens === null ? [] : [row.promptTokens])),
      meanOutputTokens: mean(rows.flatMap((row) => row.outputTokens === null ? [] : [row.outputTokens])),
    };
  };
  return { A: summarize("A"), B: summarize("B") };
}
