import type { SupabaseClient } from "@supabase/supabase-js";
import type { RelationshipTimeContext } from "./relationship-time";
import {
  reduceRelationshipEmotion,
  type EmotionPrimary,
  type EmotionReducerResult,
  type RelationshipPatternContext,
} from "./relationship-emotion-reducer";
import type { RelationshipSignalAssessment } from "./relationship-signal";
import { reduceRelationshipAction, type ActionDecision } from "./relationship-action-reducer";
import { loadRelationshipPatterns } from "./relationship-patterns";

const EMOTIONS = new Set<EmotionPrimary>([
  "neutral", "happy", "affectionate", "concerned", "hurt", "sulky", "guarded",
]);

function previousEmotion(context: RelationshipTimeContext | null) {
  const primary = EMOTIONS.has(context?.emotionPrimary as EmotionPrimary)
    ? (context?.emotionPrimary as EmotionPrimary)
    : "neutral";
  return {
    primary,
    intensity: Math.max(0, Math.min(100, Math.round(context?.emotionIntensity ?? 0))),
  };
}

export async function persistRelationshipEmotionFromSignals(
  supabase: SupabaseClient,
  isAnonymous: boolean,
  context: RelationshipTimeContext | null,
  assessment: RelationshipSignalAssessment,
  patterns?: RelationshipPatternContext
): Promise<{ applied: boolean; conflict: boolean; emotion: EmotionReducerResult; action: ActionDecision }> {
  const learnedPatterns = patterns ?? await loadRelationshipPatterns(supabase as any, isAnonymous);
  const emotion = reduceRelationshipEmotion({
    previous: previousEmotion(context),
    signals: assessment,
    elapsedHours: context?.elapsedHours ?? 0,
    intimacyLevel: context?.intimacyLevel ?? "initial",
    patterns: learnedPatterns,
  });

  const action = reduceRelationshipAction({
    previousAction: context?.actionState ?? "NORMAL",
    emotion,
    signals: assessment,
    intimacyLevel: context?.intimacyLevel ?? "initial",
    patterns: learnedPatterns,
  });

  if (isAnonymous) return { applied: false, conflict: false, emotion, action };

  const signalSummary = assessment.signals.map((signal) => ({
    name: signal.name,
    strength: signal.strength,
    confidence: signal.confidence,
  }));

  const { data, error } = await (supabase.rpc as any)(
    "apply_relationship_emotion_action_v2",
    {
      p_primary: emotion.primary,
      p_intensity: emotion.intensity,
      p_action: action.action,
      p_direction: action.direction,
      p_emotion_reason: emotion.reason,
      p_action_reason: action.reason,
      p_evidence: emotion.evidence,
      p_signal_summary: signalSummary,
      p_expected_state_updated_at: context?.stateUpdatedAt ?? null,
    }
  );

  if (error) {
    console.error("RELATIONSHIP EMOTION V2 WRITE ERROR:", error);
    return { applied: false, conflict: false, emotion, action };
  }

  const result = data && typeof data === "object" ? data : {};
  return {
    applied: result.ok === true,
    conflict: result.conflict === true,
    emotion,
    action,
  };
}
