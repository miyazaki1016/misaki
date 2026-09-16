import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

import { loadPersonaPrompt } from "../../../lib/persona/persona-store";
import {
  selectMisakiProactivePhoto,
  type MisakiPhotoTag,
} from "../../../lib/proactive-photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const MAX_PER_RUN = 10;
const MAX_HISTORY = 60;
const MAX_MEMORY = 30;
const MIN_DELAY_MINUTES = 45;
const MAX_DELAY_MINUTES = 210;

const PROACTIVE_TAGS: MisakiPhotoTag[] = [
  "soft",
  "cheerful",
  "calm",
  "romantic",
  "sleepy",
  "casual",
  "affectionate",
  "miss_you",
  "relax",
  "playful",
  "encouraging",
  "check_in",
  "selfie",
];

type BodyClockRow = {
  user_id: string;
  relationship_points: number;
  long_term_memory: unknown;
  today_memory: unknown;
  recent_history: unknown;
  notifications_enabled: boolean;
  timezone: string;
  pushes_today: number;
  push_date: string | null;
};

type ChatMessage = {
  role: "user" | "misaki";
  text: string;
  sentAt?: string;
};

type PushRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function randomDelayMs() {
  const min = MIN_DELAY_MINUTES * 60 * 1000;
  const max = MAX_DELAY_MINUTES * 60 * 1000;
  return Math.floor(min + Math.random() * (max - min));
}

function tokyoNowText() {
  return new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function tokyoDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function safeHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "misaki") &&
        typeof item.text === "string"
    )
    .map((item) => ({
      role: item.role as "user" | "misaki",
      text: String(item.text).trim(),
      ...(typeof item.sentAt === "string" ? { sentAt: item.sentAt } : {}),
    }))
    .filter((item) => item.text.length > 0)
    .slice(-MAX_HISTORY);
}

function safeMemory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim())
    .slice(-MAX_MEMORY);
}

function safeProactiveTags(value: unknown): MisakiPhotoTag[] {
  if (!Array.isArray(value)) return ["soft"];

  const allowed = new Set(PROACTIVE_TAGS);
  const unique = new Set<MisakiPhotoTag>();

  for (const item of value) {
    if (typeof item === "string" && allowed.has(item as MisakiPhotoTag)) {
      unique.add(item as MisakiPhotoTag);
    }

    if (unique.size >= 4) break;
  }

  return unique.size > 0 ? [...unique] : ["soft"];
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1));
    }
    throw new Error("Gemini returned invalid JSON");
  }
}

async function generateMessage(
  apiKey: string,
  persona: string,
  history: ChatMessage[],
  memory: string[],
  relationshipPoints: number
) {
  const currentTime = tokyoNowText();

  const recent = history
    .slice(-20)
    .map((m) => `${m.role === "user" ? "ユーザー" : "美咲"}: ${m.text}`)
    .join("\n");

  const prompt = `
${persona}

【美咲の体内時計からの自発メッセージ】
これはユーザーから話しかけられた返答ではありません。
美咲の側から、今の関係性に合った自然な短いLINEを一通だけ送ります。

現在時刻（日本時間）:
${currentTime}

関係性ポイント:
${relationshipPoints}

長期記憶:
${memory.length ? memory.map((x) => `・${x}`).join("\n") : "なし"}

最近の会話:
${recent || "なし"}

今回のメッセージ方向タグ:
次の候補から、今回の雰囲気に合うタグを2〜4個選んでから、その方向性でメッセージを書いてください。
soft=やわらかい
cheerful=明るい
calm=落ち着いた
romantic=恋愛寄り
affectionate=甘め・愛情表現
miss_you=会いたい・思い出した
relax=まったり
playful=いたずらっぽい・軽い冗談
encouraging=ねぎらい・応援
check_in=様子を気にかける
sleepy=眠い・おやすみ寄り
casual=何気ない日常
selfie=写真を添えても自然な雰囲気

タグは文章を縛るためではなく、今回の方向性を決めるためのものです。
毎回同じ組み合わせにせず、現在時刻・関係性・最近の会話を見て自然に変化させてください。
関係が浅い場合は、romantic / affectionate / miss_you を無理に選ばず、関係性が育っている場合だけ自然に使ってください。
写真の有無は別処理で決まるので、selfie を選んでも「写真送るね」など写真添付を断定する文章にはしないでください。

最上位の事実性ルール:
・美咲は、ユーザーについて知らないことを「知っている事実」として話さない
・ユーザーの行動、発言、返信、連絡、現在地、勤務、休み、体調、予定、好み、過去の出来事を断定するには、最近の会話または長期記憶に明確な根拠が必要
・最近の会話は文脈資料であって「今ユーザーから新しい返信が来た」という意味ではない。このメッセージは常に美咲側から始める
・実際の根拠がないのに「返信ありがとう」「連絡くれて嬉しい」「さっき連絡きた」「今日は○○してたよね」など、ユーザーが何かした前提の表現を作らない
・根拠がない内容に触れる必要がある場合は「〜かな？」「もしかして〜？」など、質問または推測だと明確に分かる表現にする
・不明なことは不明のまま扱い、自然さのためにユーザー側の事実を補完しない
・美咲自身の気持ち（「話したくなった」「ふと思い出した」等）は自由に表現してよいが、その理由としてユーザーの未確認行動を捏造しない

ルール:
・1〜2文を基本にする
・用事がなくても送る自然な一言でよい
・毎回質問で終わらせない
・AI、システム、通知、体内時計、タグという言葉を出さない
・同じ文面を機械的に繰り返さない
・選んだタグを全部そのまま文章化する必要はない
・JSON以外は出力しない

出力:
{"tags":["soft","casual"],"reply":"美咲のメッセージ"}
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.95,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`);
  }

  const data = await response.json();
  const raw =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || "")
      .join("") || "";

  const parsed = extractJsonObject(raw);
  const reply =
    typeof parsed?.reply === "string" ? parsed.reply.trim() : "";
  const tags = safeProactiveTags(parsed?.tags);

  if (!reply) {
    throw new Error("Gemini reply was empty");
  }

  return { reply, currentTime, tags };
}

async function appendConversation(
  supabase: SupabaseClient,
  userId: string,
  reply: string
) {
  const { data, error } = await supabase
    .from("misaki_user_conversation_state")
    .select("history,message_count")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const conversationState = data as {
    history?: unknown;
    message_count?: number | null;
  } | null;

  const history = safeHistory(conversationState?.history ?? null);
  const sentAt = new Date().toISOString();

  const nextHistory = [
    ...history,
    { role: "misaki" as const, text: reply, sentAt },
  ].slice(-MAX_HISTORY);

  const { error: upsertError } = await supabase
    .from("misaki_user_conversation_state")
    .upsert(
      {
        user_id: userId,
        history: nextHistory,
        message_count:
          Math.max(
            0,
            Number(conversationState?.message_count) || history.length
          ) + 1,
        updated_at: sentAt,
      },
      { onConflict: "user_id" }
    );

  if (upsertError) throw upsertError;
}

async function sendPush(
  supabase: SupabaseClient,
  userId: string,
  message: string
) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT || "mailto:misaki@example.com";

  if (!publicKey || !privateKey) {
    return { sent: 0, removed: 0, skipped: "vapid_missing" };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", userId);

  if (error) throw error;

  const subscriptions = (data || []) as PushRow[];
  if (!subscriptions.length) {
    return { sent: 0, removed: 0, skipped: "no_subscription" };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const payload = JSON.stringify({
    title: "美咲",
    body: message,
    url: "/chat",
  });

  let sent = 0;
  let removed = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
        { TTL: 60 * 60 }
      );

      sent += 1;

      await supabase
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", subscription.id);
    } catch (error: any) {
      const statusCode = Number(error?.statusCode);
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
        removed += 1;
      } else {
        console.error("BODY CLOCK PUSH ERROR:", error);
      }
    }
  }

  return { sent, removed };
}

async function processUser(
  supabase: SupabaseClient,
  apiKey: string,
  row: BodyClockRow
) {
  const history = safeHistory(row.recent_history);
  const memory = safeMemory(row.long_term_memory);

  const persona = await loadPersonaPrompt(
    supabase,
    row.user_id,
    "proactive"
  );

  const { reply, currentTime, tags } = await generateMessage(
    apiKey,
    persona.text,
    history,
    memory,
    Math.max(0, Number(row.relationship_points) || 0)
  );

  const { data: recentPhotos } = await supabase
    .from("misaki_proactive_deliveries")
    .select("photo_id")
    .eq("user_id", row.user_id)
    .not("photo_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);

  const recentPhotoIds = Array.isArray(recentPhotos)
    ? recentPhotos
        .map((x) => (typeof x?.photo_id === "string" ? x.photo_id : ""))
        .filter(Boolean)
    : [];

  const selectedPhoto = selectMisakiProactivePhoto({
    currentTime,
    relationshipPoints: Math.max(
      0,
      Number(row.relationship_points) || 0
    ),
    reply,
    context: { tags },
    recentPhotoIds,
  });

  const deliveredAt = new Date().toISOString();

  const { data: delivery, error: deliveryError } = await supabase
    .from("misaki_proactive_deliveries")
    .insert({
      user_id: row.user_id,
      message: reply,
      photo_id: selectedPhoto?.id ?? null,
      photo_src: selectedPhoto?.src ?? null,
      photo_context: {
        currentTime,
        relationshipPoints: Math.max(
          0,
          Number(row.relationship_points) || 0
        ),
        tags,
        selectorVersion: 2,
        source: "body_clock",
      },
      status: "delivered",
      delivered_at: deliveredAt,
    })
    .select("id,message,photo_id,photo_src,status,delivered_at")
    .single();

  if (deliveryError) throw deliveryError;

  await appendConversation(supabase, row.user_id, reply);

  const nextPushAt = new Date(Date.now() + randomDelayMs()).toISOString();
  const today = tokyoDateKey();
  const previousCount =
    row.push_date === today ? Math.max(0, row.pushes_today || 0) : 0;
  const nextCount = previousCount + 1;

  const { error: stateError } = await supabase
    .from("background_push_state")
    .update({
      last_push_at: deliveredAt,
      next_push_at: nextPushAt,
      push_date: today,
      pushes_today: nextCount,
      last_background_message: reply,
      updated_at: deliveredAt,
    })
    .eq("user_id", row.user_id);

  if (stateError) throw stateError;

  const push = row.notifications_enabled
    ? await sendPush(supabase, row.user_id, reply)
    : { sent: 0, removed: 0, skipped: "notifications_disabled" };

  return {
    userId: row.user_id,
    deliveryId: delivery?.id ?? null,
    photoId: selectedPhoto?.id ?? null,
    tags,
    nextPushAt,
    pushesToday: nextCount,
    push,
  };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!serviceRoleKey || !apiKey) {
    return Response.json(
      {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY or GEMINI_API_KEY is missing.",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.rpc(
    "claim_misaki_body_clock_due_users",
    { p_limit: MAX_PER_RUN }
  );

  if (error) {
    console.error("BODY CLOCK CLAIM ERROR:", error);
    return Response.json(
      { ok: false, error: "Failed to claim due users." },
      { status: 500 }
    );
  }

  const rows = (Array.isArray(data) ? data : []) as BodyClockRow[];
  const results: unknown[] = [];

  for (const row of rows) {
    try {
      results.push({
        ok: true,
        ...(await processUser(supabase, apiKey, row)),
      });
    } catch (error) {
      console.error("BODY CLOCK USER ERROR:", row.user_id, error);
      results.push({
        ok: false,
        userId: row.user_id,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return Response.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    claimed: rows.length,
    results,
  });
}
