import type { CanonicalConversationTurn, GeminiConversationTurn } from "./history";
import { toGeminiConversationHistory } from "./history";
import {
  buildExpressionAdjustmentGuide,
  buildReplyRetryGuide,
} from "./retry-guides";

/**
 * Immutable resolved input for a single Gemini conversation attempt.
 *
 * baseSystemPrompt MUST come from the production-equivalent full prompt
 * builder (not yet extracted). No network, clock, DB or model calls here.
 */
export type ResolvedConversationAttempt = Readonly<{
  baseSystemPrompt: string;
  modelMessage: string;
  history: readonly CanonicalConversationTurn[];
  misakiDayType: string;
}>;

export type ConversationAttempt = Readonly<{
  systemInstruction: string;
  contents: GeminiConversationTurn[];
  userText: string;
}>;

export type ConversationAttemptOptions = Readonly<{
  retryProblems?: readonly string[];
  expressionActionGuide?: string;
}>;

/**
 * Production appends retry and supplementary guides to the base prompt.
 * This pure adapter mirrors that concatenation without invoking Gemini.
 * Passing an empty expression guide means no expression rewrite suffix.
 */
export function buildConversationAttempt(
  resolved: ResolvedConversationAttempt,
  options: ConversationAttemptOptions = {},
): ConversationAttempt {
  const retryGuide = buildReplyRetryGuide(
    options.retryProblems,
    resolved.misakiDayType,
  );
  const expressionGuide = options.expressionActionGuide
    ? buildExpressionAdjustmentGuide(options.expressionActionGuide)
    : "";
  return {
    systemInstruction:
      resolved.baseSystemPrompt + retryGuide + expressionGuide,
    contents: toGeminiConversationHistory(resolved.history),
    userText: resolved.modelMessage,
  };
}
