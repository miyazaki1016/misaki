import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import type { ProactiveLifeContext } from "./proactive-life-context.ts";

export type ProactiveDirection = "MISAKI" | "USER" | "US" | "MISAKI_TO_USER" | "MISAKI_TO_US";
export type RelationshipAction = "NORMAL" | "WAIT" | "TEASE" | "SULK" | "CHASE" | "PULL" | "RECONNECT";
export type RelationshipEmotion = "neutral" | "happy" | "affectionate" | "concerned" | "hurt" | "sulky" | "guarded";
export type ProactiveExpressionTag =
  | "soft"
  | "cheerful"
  | "calm"
  | "romantic"
  | "sleepy"
  | "casual"
  | "affectionate"
  | "miss_you"
  | "playful"
  | "encouraging"
  | "check_in";

export type ProactiveDecisionContext = {
  shouldSend: true;
  reason: "claimed_after_relationship_action_gate";
  direction: ProactiveDirection;
  action: RelationshipAction;
  emotion: RelationshipEmotion;
  emotionIntensity: number;
  intimacyLevel: number;
  relationshipPoints: number;
  timeBand: "recent" | "same_day" | "one_to_three_days" | "three_to_seven_days" | "seven_plus_days" | "unknown";
  situation: string;
  plan: string;
  lifeEvidence: string[];
  lifeConfidence: "none" | "explicit";
  tags: ProactiveExpressionTag[];
};

type RelationshipRow = {
  intimacy_level?: number | null;
  emotion_state?: { primary?: string; intensity?: number } | null;
  action_state?: string | null;
  last_interaction_at?: string | null;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function timeBand(last?: string | null): ProactiveDecisionContext["timeBand"] {
  if (!last) return "unknown";
  const hours = Math.max(0, (Date.now() - new Date(last).getTime()) / 3600000);
  if (hours < 6) return "recent";
  if (hours < 24) return "same_day";
  if (hours < 72) return "one_to_three_days";
  if (hours < 168) return "three_to_seven_days";
  return "seven_plus_days";
}

function currentHour(currentTime: string) {
  const match = currentTime.match(/(\d{1,2}):(\d{2})/);
  const hour = Number(match?.[1]);
  return Number.isFinite(hour) ? Math.max(0, Math.min(23, hour)) : 18;
}

function action(value: unknown): RelationshipAction {
  const normalized = String(value || "NORMAL").toUpperCase();
  return ["NORMAL", "WAIT", "TEASE", "SULK", "CHASE", "PULL", "RECONNECT"].includes(normalized)
    ? normalized as RelationshipAction
    : "NORMAL";
}

function emotion(value: unknown): RelationshipEmotion {
  const normalized = String(value || "neutral").toLowerCase();
  return ["neutral", "happy", "affectionate", "concerned", "hurt", "sulky", "guarded"].includes(normalized)
    ? normalized as RelationshipEmotion
    : "neutral";
}

function direction(
  currentAction: RelationshipAction,
  currentEmotion: RelationshipEmotion,
  life: ProactiveLifeContext
): ProactiveDirection {
  if (currentEmotion === "concerned" && life.confidence === "explicit") return "USER";
  if (currentEmotion === "hurt" || currentEmotion === "guarded" || currentAction === "PULL" || currentAction === "SULK") return "MISAKI";
  if (currentAction === "RECONNECT" || currentAction === "CHASE") return "MISAKI_TO_USER";
  if (currentAction === "TEASE" || currentEmotion === "happy") return "US";
  if (currentEmotion === "affectionate") return "MISAKI_TO_US";
  return "MISAKI";
}

export function deriveProactiveTags(input: {
  direction: ProactiveDirection;
  action: RelationshipAction;
  emotion: RelationshipEmotion;
  timeBand: ProactiveDecisionContext["timeBand"];
  lifeConfidence: ProactiveDecisionContext["lifeConfidence"];
  currentTime: string;
}): ProactiveExpressionTag[] {
  const tags = new Set<ProactiveExpressionTag>();

  // Emotion describes what Misaki feels. Action describes how much of that
  // feeling should be shown. Start from emotion, then let action shape or
  // suppress incompatible expression tags.
  switch (input.emotion) {
    case "happy":
      tags.add("cheerful");
      break;
    case "hurt":
    case "guarded":
      tags.add("calm");
      tags.add("casual");
      break;
    case "sulky":
      tags.add("soft");
      tags.add("calm");
      break;
    case "concerned":
      tags.add("soft");
      if (input.lifeConfidence === "explicit") {
        tags.add("check_in");
        tags.add("encouraging");
      }
      break;
    case "affectionate":
      tags.add("affectionate");
      tags.add("romantic");
      break;
    default:
      tags.add("soft");
  }

  switch (input.action) {
    case "WAIT":
      // Waiting should feel gentle and slightly expectant, not detached.
      tags.delete("calm");
      tags.add("soft");
      tags.add("casual");
      break;
    case "TEASE":
      tags.add("playful");
      tags.add("cheerful");
      break;
    case "SULK":
      // A light pout is quieter, but should not become punishment or hostility.
      tags.delete("cheerful");
      tags.delete("playful");
      tags.add("calm");
      tags.add("casual");
      break;
    case "CHASE":
      // Moving one step closer does not automatically justify asking about
      // the user's current condition. Use check-in only with explicit evidence.
      tags.add("miss_you");
      tags.add("soft");
      if (input.lifeConfidence === "explicit" || input.emotion === "concerned") {
        tags.add("check_in");
      } else {
        tags.delete("check_in");
        tags.delete("encouraging");
      }
      break;
    case "PULL":
      // Pull means reducing sweetness, not ignoring the user. Emotional tags
      // that would make the message warmer than the action are suppressed.
      tags.delete("affectionate");
      tags.delete("romantic");
      tags.delete("cheerful");
      tags.delete("playful");
      tags.delete("check_in");
      tags.delete("encouraging");
      tags.delete("miss_you");
      tags.add("calm");
      tags.add("casual");
      break;
    case "RECONNECT":
      // Reconnection should show relief and warmth without repeatedly forcing
      // the gap itself into the conversation.
      tags.delete("check_in");
      tags.delete("encouraging");
      tags.delete("miss_you");
      tags.add("soft");
      tags.add("cheerful");
      break;
    default:
      tags.add("casual");
  }

  if (input.direction === "USER") {
    // USER direction is only chosen for concerned + explicit life evidence.
    tags.add("check_in");
    tags.add("encouraging");
  }

  if (input.direction === "MISAKI_TO_US") {
    tags.add("affectionate");
  }

  // Relationship time never manufactures longing by itself. If "miss_you" is
  // appropriate, it must already be supported by persisted emotion/action or
  // by a future grounded relationship event, not merely seven days of silence.

  // sleepy is a body-state expression, not an emotion. Keep it conservative:
  // only deep at night, only when Misaki is not actively chasing/checking in,
  // teasing, sulking, pulling away, or reconnecting. This lets late-night
  // messages feel physically lived-in without making every night message sleepy.
  const hour = currentHour(input.currentTime);
  const sleepyEligibleEmotion = input.emotion === "neutral" || input.emotion === "affectionate";
  const sleepyEligibleAction = input.action === "NORMAL" || input.action === "WAIT";
  const sleepyEligibleDirection = input.direction !== "USER" && input.direction !== "MISAKI_TO_USER";
  if (hour >= 0 && hour < 5 && sleepyEligibleEmotion && sleepyEligibleAction && sleepyEligibleDirection) {
    tags.add("sleepy");
    tags.add("calm");
    tags.delete("cheerful");
    tags.delete("playful");
  }

  return [...tags];
}

export async function buildProactiveDecisionContext(
  supabase: SupabaseClient,
  userId: string,
  points: number,
  life: ProactiveLifeContext,
  currentTime: string
): Promise<ProactiveDecisionContext> {
  const { data, error } = await supabase
    .from("misaki_relationship_state")
    .select("intimacy_level,emotion_state,action_state,last_interaction_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const row = (data || {}) as RelationshipRow;
  const currentAction = action(row.action_state);
  const currentEmotion = emotion(row.emotion_state?.primary);
  const currentTimeBand = timeBand(row.last_interaction_at);
  const currentDirection = direction(currentAction, currentEmotion, life);
  const tags = deriveProactiveTags({
    direction: currentDirection,
    action: currentAction,
    emotion: currentEmotion,
    timeBand: currentTimeBand,
    lifeConfidence: life.confidence,
    currentTime,
  });

  return {
    shouldSend: true,
    reason: "claimed_after_relationship_action_gate",
    direction: currentDirection,
    action: currentAction,
    emotion: currentEmotion,
    emotionIntensity: clamp(Number(row.emotion_state?.intensity) || 0, 0, 100),
    intimacyLevel: Math.max(0, Number(row.intimacy_level) || 0),
    relationshipPoints: Math.max(0, points),
    timeBand: currentTimeBand,
    situation: life.situation,
    plan: life.plan,
    lifeEvidence: life.evidence,
    lifeConfidence: life.confidence,
    tags,
  };
}

export function createProactiveDecisionGuide(context: ProactiveDecisionContext) {
  return `【今回の自発行動コンテキスト】\n方向: ${context.direction}\n感情: ${context.emotion}（強さ ${context.emotionIntensity}）\n行動傾向: ${context.action}\n親密度: ${context.intimacyLevel}\n関係時間帯: ${context.timeBand}\n生活根拠の確度: ${context.lifeConfidence}\n表現タグ: ${context.tags.join(", ")}\n\nこのコンテキストは文章と写真の共通の原因です。\n・方向、感情、行動、表現タグを返事の温度へ自然ににじませる\n・sleepy は深夜の身体状態として弱くにじませ、毎回「眠い」と説明しない\n・タグ名や内部状態を本文に書かない\n・USER方向でも、根拠のない現在地・勤務・体調・予定を作らない\n・MISAKI方向では、美咲自身の今の気分や短い一言を優先してよい\n・US方向では、二人の関係の空気を優先するが、存在しない出来事を作らない\n・hurt / guarded / PULL / SULK のときも、罰・無視・罪悪感を与える表現にはしない\n・長く会っていないという時間だけを理由に miss_you / romantic を作らない`;
}
