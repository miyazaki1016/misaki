import type { EmotionReducerResult, RelationshipPatternContext } from "./relationship-emotion-reducer";
import type { RelationshipSignalAssessment } from "./relationship-signal";

export type RelationshipAction =
  | "NORMAL" | "WAIT" | "TEASE" | "SULK" | "CHASE" | "PULL" | "RECONNECT";

export type RelationshipDirection =
  | "steady" | "closer" | "gentle" | "repair" | "space" | "check_in";

export type ActionDecision = {
  action: RelationshipAction;
  direction: RelationshipDirection;
  reason: string;
};

export type ActionReducerInput = {
  previousAction: string;
  emotion: EmotionReducerResult;
  signals: RelationshipSignalAssessment;
  intimacyLevel: string;
  patterns?: RelationshipPatternContext;
};

const weight = (a: RelationshipSignalAssessment, names: string[]) =>
  a.signals.filter(s => names.includes(s.name))
    .reduce((n, s) => n + s.strength * s.confidence, 0);

export function reduceRelationshipAction(input: ActionReducerInput): ActionDecision {
  const { emotion, signals, intimacyLevel } = input;
  const repeatedHarm = Math.max(0, input.patterns?.repeatedHarm ?? 0);
  const reliableRepair = Math.max(0, input.patterns?.reliableRepair ?? 0);
  const sustainedCare = Math.max(0, input.patterns?.sustainedCare ?? 0);
  const repair = weight(signals, ["apology", "repair"]);
  const harm = weight(signals, ["hurtful", "rejection", "boundary"]);
  const warmth = weight(signals, ["warmth", "care", "trust", "romantic"]);
  const close = ["intimate", "very_intimate"].includes(intimacyLevel);

  if (emotion.afterglow === "repairing" && ["hurt", "sulky", "guarded"].includes(emotion.primary)) {
    return { action: "RECONNECT", direction: "repair", reason: "repair_afterglow_keeps_the_door_open" };
  }
  if (emotion.afterglow === "wary" && emotion.intensity >= 20) {
    return { action: "PULL", direction: "space", reason: "wary_afterglow_avoids_rushing_closeness" };
  }
  if (emotion.afterglow === "concerned" && emotion.primary === "concerned" && emotion.intensity >= 18) {
    return { action: "CHASE", direction: "check_in", reason: "concern_afterglow_still_invites_gentle_check_in" };
  }
  if (emotion.primary === "concerned" && emotion.intensity >= 30) {
    return { action: "CHASE", direction: "check_in", reason: "grounded_concern_invites_check_in" };
  }
  if (repair >= 0.4 && ["hurt", "sulky", "guarded"].includes(emotion.primary)) {
    if (repeatedHarm >= 2 && reliableRepair < 1) {
      return { action: "PULL", direction: "space", reason: "repeated_harm_needs_consistency_before_reconnection" };
    }
    return { action: "RECONNECT", direction: "repair", reason: reliableRepair >= 1 ? "demonstrated_repair_supports_reconnection" : "repair_is_underway" };
  }
  if (emotion.reason === "repair_resolved_hurt") {
    return { action: "RECONNECT", direction: "repair", reason: "repair_resolved_distance" };
  }
  if (emotion.primary === "guarded" && emotion.intensity >= 28) {
    return { action: "PULL", direction: "space", reason: "boundary_or_rejection_needs_space" };
  }
  if (emotion.primary === "hurt" && emotion.intensity >= 35) {
    return { action: "SULK", direction: "space", reason: "hurt_is_still_visible" };
  }
  if (harm >= 0.45) {
    return { action: "PULL", direction: "space", reason: "current_turn_created_distance" };
  }
  if (emotion.primary === "affectionate" && emotion.intensity >= 50 && close && warmth >= 0.45) {
    return { action: "TEASE", direction: "closer", reason: "grounded_affectionate_playfulness" };
  }
  if (emotion.afterglow === "warm" && emotion.primary === "happy" && close && warmth < 0.4) {
    return { action: "NORMAL", direction: "gentle", reason: "warm_afterglow_keeps_soft_connection" };
  }
  if (emotion.afterglow === "tender" && emotion.primary === "affectionate" && close && warmth >= 0.25) {
    return { action: "NORMAL", direction: "gentle", reason: "tender_afterglow_prefers_gentle_closeness" };
  }
  if (["happy", "affectionate"].includes(emotion.primary) && warmth >= 0.4) {
    if (sustainedCare >= 2) return { action: "NORMAL", direction: "closer", reason: "sustained_care_supports_natural_closeness" };
    return { action: "NORMAL", direction: "closer", reason: "warmth_moves_naturally_closer" };
  }
  return { action: "NORMAL", direction: "steady", reason: "no_action_pressure" };
}

export function createActionDecisionGuide(decision: ActionDecision) {
  const guide: Record<RelationshipDirection, string> = {
    steady: "普段どおり。内部状態を説明せず会話そのものを優先する。",
    closer: "少し近づく温度を自然ににじませる。甘さを義務化しない。",
    gentle: "柔らかく受け止める。過剰に慰めたり決めつけたりしない。",
    repair: "仲直りへ向かう余地を見せる。即座に全部なかったことにはしない。",
    space: "少し距離を置く。罰・無視・罪悪感を与える操作にはしない。",
    check_in: "根拠のある心配だけを短く気遣う。事故や体調を捏造しない。",
  };
  return `【今回の行動意図】\n行動: ${decision.action}\n方向: ${decision.direction}\n方針: ${guide[decision.direction]}\nこの内部名を台詞に出さないでください。`;
}
