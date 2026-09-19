import type { SupabaseClient } from "@supabase/supabase-js";

export type RelationshipTimeContext = {
  exists: boolean;
  elapsedSeconds: number;
  elapsedHours: number;
  timeBand: string;
  intimacyLevel: string;
  intimacyPoints: number;
  emotionPrimary: string;
  emotionIntensity: number;
  actionState: string;
  lastInteractionAt: string | null;
  stateUpdatedAt: string | null;
};

function numberOr(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function loadRelationshipTimeContext(
  supabase: SupabaseClient,
  isAnonymous: boolean
): Promise<RelationshipTimeContext | null> {
  if (isAnonymous) return null;

  // v2: loading context must be read-only. Time is evidence for the reducer,
  // not permission to mutate emotion merely because the app was closed.
  const { data, error } = await (supabase.rpc as any)(
    "get_relationship_time_context"
  );

  if (error || !data || typeof data !== "object") {
    if (error) console.error("RELATIONSHIP TIME LOAD ERROR:", error);
    return null;
  }

  const emotion =
    data.emotion_state && typeof data.emotion_state === "object"
      ? data.emotion_state
      : {};

  return {
    exists: data.exists === true,
    elapsedSeconds: numberOr(data.elapsed_seconds),
    elapsedHours: numberOr(data.elapsed_hours),
    timeBand: typeof data.time_band === "string" ? data.time_band : "new",
    intimacyLevel:
      typeof data.intimacy_level === "string" ? data.intimacy_level : "initial",
    intimacyPoints: numberOr(data.intimacy_points),
    emotionPrimary:
      typeof emotion.primary === "string" ? emotion.primary : "neutral",
    emotionIntensity: numberOr(emotion.intensity),
    actionState:
      typeof data.action_state === "string" ? data.action_state : "NORMAL",
    lastInteractionAt:
      typeof data.last_interaction_at === "string" ? data.last_interaction_at : null,
    stateUpdatedAt:
      typeof data.state_updated_at === "string" ? data.state_updated_at : null,
  };
}

export function createRelationshipTimeGuide(
  context: RelationshipTimeContext | null
) {
  if (!context) return "";

  if (!context.exists || !context.lastInteractionAt) {
    return `
【関係時間】

保存済みアカウントとしての関係時間は、まだ始まったばかりです。
経過時間を想像で作らないでください。
`.trim();
  }

  const elapsed =
    context.elapsedHours < 24
      ? `約${Math.max(0, Math.round(context.elapsedHours))}時間`
      : `約${Math.max(1, Math.floor(context.elapsedHours / 24))}日`;

  return `
【関係時間】

最後の保存済みのやり取りから：${elapsed}
関係時間帯：${context.timeBand}
親密度：${context.intimacyLevel}
現在の感情状態：${context.emotionPrimary}（強さ ${context.emotionIntensity}）
現在の行動状態：${context.actionState}

重要：
・経過時間だけで感情を決めない
・3日なら寂しい、7日なら拗ねる、のような固定ルールは禁止
・最後の会話、長期記憶、親密度、現在の感情と一緒に解釈する
・ユーザーが忙しい、仕事だった、旅行していた等を根拠なく作らない
・時間が空いていても、毎回そのことを口に出す必要はない
・関係時間は返答の温度や距離感に自然に反映する
`.trim();
}

export async function recordRelationshipChatTurn(
  supabase: SupabaseClient,
  isAnonymous: boolean,
  userMessageAt: Date,
  misakiMessageAt: Date
): Promise<boolean> {
  if (isAnonymous) return false;

  const { error } = await (supabase.rpc as any)(
    "record_relationship_chat_turn",
    {
      p_user_message_at: userMessageAt.toISOString(),
      p_misaki_message_at: misakiMessageAt.toISOString(),
    }
  );

  if (error) {
    console.error("RELATIONSHIP TURN RECORD ERROR:", error);
    return false;
  }

  return true;
}
