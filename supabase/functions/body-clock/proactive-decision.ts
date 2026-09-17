import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

export type ProactiveDirection = "MISAKI" | "USER" | "US" | "MISAKI_TO_USER" | "MISAKI_TO_US";
export type RelationshipAction = "NORMAL" | "WAIT" | "TEASE" | "SULK" | "CHASE" | "PULL" | "RECONNECT";
export type RelationshipEmotion = "neutral" | "happy" | "lonely" | "sulky" | "concerned" | "affectionate";

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
  situation: "none";
  plan: "none";
};

type RelationshipRow = {
  intimacy_level?: number | null;
  emotion_state?: { primary?: string; intensity?: number } | null;
  action_state?: string | null;
  last_interaction_at?: string | null;
};

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

function timeBand(lastInteractionAt?: string | null): ProactiveDecisionContext["timeBand"] {
  if (!lastInteractionAt) return "unknown";
  const elapsedHours = Math.max(0, (Date.now() - new Date(lastInteractionAt).getTime()) / 3_600_000);
  if (elapsedHours < 6) return "recent";
  if (elapsedHours < 24) return "same_day";
  if (elapsedHours < 72) return "one_to_three_days";
  if (elapsedHours < 168) return "three_to_seven_days";
  return "seven_plus_days";
}

function normalizeAction(value: unknown): RelationshipAction {
  const action = String(value || "NORMAL").toUpperCase();
  return ["NORMAL", "WAIT", "TEASE", "SULK", "CHASE", "PULL", "RECONNECT"].includes(action) ? action as RelationshipAction : "NORMAL";
}

function normalizeEmotion(value: unknown): RelationshipEmotion {
  const emotion = String(value || "neutral").toLowerCase();
  return ["neutral", "happy", "lonely", "sulky", "concerned", "affectionate"].includes(emotion) ? emotion as RelationshipEmotion : "neutral";
}

function chooseDirection(action: RelationshipAction, emotion: RelationshipEmotion): ProactiveDirection {
  if (emotion === "concerned") return "USER";
  if (action === "RECONNECT" || action === "CHASE") return "MISAKI_TO_USER";
  if (action === "TEASE" || emotion === "happy") return "US";
  if (emotion === "affectionate") return "MISAKI_TO_US";
  return "MISAKI";
}

export async function buildProactiveDecisionContext(supabase: SupabaseClient, userId: string, relationshipPoints: number): Promise<ProactiveDecisionContext> {
  const { data, error } = await supabase
    .from("misaki_relationship_state")
    .select("intimacy_level,emotion_state,action_state,last_interaction_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const row = (data || {}) as RelationshipRow;
  const action = normalizeAction(row.action_state);
  const emotion = normalizeEmotion(row.emotion_state?.primary);

  // The database claim RPC is the single source of truth for send/defer.
  // Re-evaluating WAIT/SULK/PULL here would create contradictory decisions after a lease is claimed.
  return {
    shouldSend: true,
    reason: "claimed_after_relationship_action_gate",
    direction: chooseDirection(action, emotion),
    action,
    emotion,
    emotionIntensity: clamp(Number(row.emotion_state?.intensity) || 0, 0, 100),
    intimacyLevel: Math.max(0, Number(row.intimacy_level) || 0),
    relationshipPoints: Math.max(0, relationshipPoints),
    timeBand: timeBand(row.last_interaction_at),
    situation: "none",
    plan: "none",
  };
}

export function createProactiveDecisionGuide(context: ProactiveDecisionContext) {
  return `
【今回の自発行動コンテキスト】
方向: ${context.direction}
感情: ${context.emotion}（強さ ${context.emotionIntensity}）
行動傾向: ${context.action}
親密度: ${context.intimacyLevel}
関係時間帯: ${context.timeBand}

このコンテキストは文章と写真の共通の原因です。
・方向と感情を返事の温度へ自然ににじませる
・タグ名や内部状態を本文に書かない
・USER方向でも、根拠のない現在地・勤務・体調・予定を作らない
・MISAKI方向では、美咲自身の今の気分や短い一言を優先してよい
・US方向では、二人の関係の空気を優先するが、存在しない出来事を作らない
`.trim();
}
