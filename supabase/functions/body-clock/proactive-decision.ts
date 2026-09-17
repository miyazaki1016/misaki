import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import type { ProactiveLifeContext } from "./proactive-life-context.ts";

export type ProactiveDirection = "MISAKI" | "USER" | "US" | "MISAKI_TO_USER" | "MISAKI_TO_US";
export type RelationshipAction = "NORMAL" | "WAIT" | "TEASE" | "SULK" | "CHASE" | "PULL" | "RECONNECT";
export type RelationshipEmotion = "neutral" | "happy" | "lonely" | "sulky" | "concerned" | "affectionate";
export type ProactiveExpressionTag =
  | "soft"
  | "cheerful"
  | "calm"
  | "romantic"
  | "sleepy"
  | "casual"
  | "affectionate"
  | "miss_you"
  | "relax"
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

function action(value: unknown): RelationshipAction {
  const normalized = String(value || "NORMAL").toUpperCase();
  return ["NORMAL", "WAIT", "TEASE", "SULK", "CHASE", "PULL", "RECONNECT"].includes(normalized)
    ? normalized as RelationshipAction
    : "NORMAL";
}

function emotion(value: unknown): RelationshipEmotion {
  const normalized = String(value || "neutral").toLowerCase();
  return ["neutral", "happy", "lonely", "sulky", "concerned", "affectionate"].includes(normalized)
    ? normalized as RelationshipEmotion
    : "neutral";
}

function direction(
  currentAction: RelationshipAction,
  currentEmotion: RelationshipEmotion,
  life: ProactiveLifeContext
): ProactiveDirection {
  if (currentEmotion === "concerned" && life.confidence === "explicit") return "USER";
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
}): ProactiveExpressionTag[] {
  const tags = new Set<ProactiveExpressionTag>();

  switch (input.emotion) {
    case "happy":
      tags.add("cheerful");
      break;
    case "lonely":
      tags.add("miss_you");
      tags.add("romantic");
      break;
    case "sulky":
      tags.add("soft");
      tags.add("calm");
      break;
    case "concerned":
      tags.add("soft");
      tags.add("check_in");
      tags.add("encouraging");
      break;
    case "affectionate":
      tags.add("affectionate");
      tags.add("romantic");
      break;
    default:
      tags.add("soft");
  }

  switch (input.action) {
    case "TEASE":
      tags.add("playful");
      tags.add("cheerful");
      break;
    case "CHASE":
      tags.add("miss_you");
      tags.add("check_in");
      break;
    case "RECONNECT":
      tags.add("miss_you");
      tags.add("check_in");
      tags.add("soft");
      break;
    case "WAIT":
    case "PULL":
      tags.add("calm");
      tags.add("soft");
      break;
    case "SULK":
      tags.add("calm");
      tags.add("soft");
      break;
    default:
      tags.add("casual");
  }

  if (input.direction === "USER" || input.direction === "MISAKI_TO_USER") {
    tags.add("check_in");
  }

  if (input.direction === "MISAKI_TO_US") {
    tags.add("affectionate");
  }

  if (input.timeBand === "seven_plus_days") {
    tags.add("miss_you");
  }

  if (input.lifeConfidence === "explicit" && input.direction === "USER") {
    tags.add("encouraging");
  }

  return [...tags];
}

export async function buildProactiveDecisionContext(
  supabase: SupabaseClient,
  userId: string,
  points: number,
  life: ProactiveLifeContext
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
  return `【今回の自発行動コンテキスト】\n方向: ${context.direction}\n感情: ${context.emotion}（強さ ${context.emotionIntensity}）\n行動傾向: ${context.action}\n親密度: ${context.intimacyLevel}\n関係時間帯: ${context.timeBand}\n生活根拠の確度: ${context.lifeConfidence}\n表現タグ: ${context.tags.join(", ")}\n\nこのコンテキストは文章と写真の共通の原因です。\n・方向、感情、行動、表現タグを返事の温度へ自然ににじませる\n・タグ名や内部状態を本文に書かない\n・USER方向でも、根拠のない現在地・勤務・体調・予定を作らない\n・MISAKI方向では、美咲自身の今の気分や短い一言を優先してよい\n・US方向では、二人の関係の空気を優先するが、存在しない出来事を作らない`;
}
