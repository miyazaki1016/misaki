/** Provider facts only. Never accept a prompt, response body, or pricing here. */
export type GeminiCallKind = "normal_reply" | "relationship_analyzer" | "critical_validator"
  | "proactive_reply" | "body_clock" | "image_generation";
export type GeminiUsage = {
  prompt_tokens: number | null;
  candidate_tokens: number | null;
  thoughts_tokens: number | null;
  total_tokens: number | null;
  cached_tokens: number | null;
};
export type GeminiAttempt = GeminiUsage & {
  model: string;
  attempt_no: number;
  http_status: number | null;
  success: boolean;
  latency_ms: number | null;
  occurred_at: string;
};
export type GeminiTelemetrySink = (attempt: GeminiAttempt, usage?: Promise<GeminiUsage>) => void | Promise<void>;
export type GeminiTelemetryRow = GeminiAttempt & {
  user_id: string | null;
  request_id: string | null;
  call_kind: GeminiCallKind;
};

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function normalizeGeminiUsage(metadata: unknown): GeminiUsage {
  const value = metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : {};
  return {
    prompt_tokens: count(value.promptTokenCount),
    candidate_tokens: count(value.candidatesTokenCount),
    thoughts_tokens: count(value.thoughtsTokenCount),
    total_tokens: count(value.totalTokenCount),
    cached_tokens: count(value.cachedContentTokenCount),
  };
}

/** Explicit allowlist, including when a caller accidentally supplies extra properties. */
export function telemetryRow(attempt: GeminiAttempt, context: {
  callKind: GeminiCallKind; userId?: string | null; requestId?: string | null;
}): GeminiTelemetryRow {
  return {
    user_id: context.userId ?? null, request_id: context.requestId ?? null, call_kind: context.callKind,
    model: attempt.model, attempt_no: attempt.attempt_no,
    prompt_tokens: attempt.prompt_tokens, candidate_tokens: attempt.candidate_tokens,
    thoughts_tokens: attempt.thoughts_tokens, total_tokens: attempt.total_tokens,
    cached_tokens: attempt.cached_tokens, http_status: attempt.http_status,
    success: attempt.success, latency_ms: attempt.latency_ms, occurred_at: attempt.occurred_at,
  };
}

export function telemetryFailure() {
  // Never log the thrown value: even transport errors can include secrets/body text.
  console.error("GEMINI TELEMETRY WRITE FAILED");
}

/** Detached observation: even a slow/rejected sink cannot affect retry or lease timing. */
export function observeGeminiAttempt(sink: GeminiTelemetrySink | undefined, attempt: GeminiAttempt, usage?: Promise<GeminiUsage>) {
  if (!sink) return;
  try { Promise.resolve(sink(attempt, usage)).catch(telemetryFailure); }
  catch { telemetryFailure(); }
}
