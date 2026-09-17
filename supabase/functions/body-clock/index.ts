import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

import { loadPersonaPrompt } from "./persona-store.ts";
import { selectMisakiProactivePhoto } from "./proactive-photo.ts";
import { buildProactiveDecisionContext, createProactiveDecisionGuide, type ProactiveDecisionContext } from "./proactive-decision.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const MAX_PER_RUN = 4;
const MAX_HISTORY = 60;
const MAX_MEMORY = 30;
const MIN_DELAY_MINUTES = 55;
const MAX_DELAY_MINUTES = 210;

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

type ChatMessage = { role: "user" | "misaki"; text: string; sentAt?: string };

function randomDelayMs() {
  const min = MIN_DELAY_MINUTES * 60 * 1000;
  const max = MAX_DELAY_MINUTES * 60 * 1000;
  return Math.floor(min + Math.random() * (max - min));
}

function tokyoNowText() {
  return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

function safeHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && (item.role === "user" || item.role === "misaki") && typeof item.text === "string")
    .map((item) => ({ role: item.role as "user" | "misaki", text: String(item.text).trim(), ...(typeof item.sentAt === "string" ? { sentAt: item.sentAt } : {}) }))
    .filter((item) => item.text.length > 0).slice(-MAX_HISTORY);
}

function safeMemory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).slice(-MAX_MEMORY);
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); }
  catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(trimmed.slice(first, last + 1));
    throw new Error("Gemini returned invalid JSON");
  }
}

async function generateMessage(apiKey: string, persona: string, history: ChatMessage[], memory: string[], decision: ProactiveDecisionContext) {
  const currentTime = tokyoNowText();
  const recent = history.slice(-20).map((m) => `${m.role === "user" ? "ユーザー" : "美咲"}: ${m.text}`).join("\n");
  const decisionGuide = createProactiveDecisionGuide(decision);

  const prompt = `
${persona}

${decisionGuide}

【美咲の体内時計からの自発メッセージ】
これはユーザーから話しかけられた返答ではありません。
美咲の側から、恋人に自然に一通だけ送る短いLINEです。

現在時刻（日本時間）:
${currentTime}

関係性ポイント:
${decision.relationshipPoints}

長期記憶:
${memory.length ? memory.map((x) => `・${x}`).join("\n") : "なし"}

最近の会話:
${recent || "なし"}

ルール:
・1〜2文を基本にする
・用事がなくても送る恋人らしい自然な一言でよい
・毎回質問で終わらせない
・ユーザーの現在地、勤務中、休み、体調などを根拠なく決めつけない
・過去の出来事を会話や記憶にないのに作らない
・AI、システム、通知、体内時計、タグ名、内部状態という言葉を出さない
・同じ文面を機械的に繰り返さない
・JSON以外は出力しない

出力:
{"reply":"美咲のメッセージ"}
`.trim();

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
    method: "POST", signal: AbortSignal.timeout(25000), headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.95, responseMimeType: "application/json" } }),
  });
  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part?.text || "").join("") || "";
  const parsed = extractJsonObject(raw);
  const reply = typeof parsed?.reply === "string" ? parsed.reply.trim() : "";
  if (!reply) throw new Error("Gemini reply was empty");
  return { reply, currentTime };
}

async function relayPush(deliveryId: string) {
  const timestamp = String(Date.now());
  const signer = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: {persistSession:false,autoRefreshToken:false}, global: {fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})} });
  const {data:hex,error} = await signer.rpc("sign_misaki_body_clock_relay", {p_timestamp:timestamp,p_delivery_id:deliveryId});
  if (error || typeof hex !== "string" || !/^[a-f0-9]{64}$/.test(hex)) throw new Error("relay_signing_unavailable");
  const response = await fetch("https://misaki38-ai.com/api/push/body-clock", { method:"POST", redirect:"error", signal:AbortSignal.timeout(45000), headers:{"Content-Type":"application/json","x-body-clock-time":timestamp,"x-body-clock-signature":hex}, body:JSON.stringify({deliveryId}) });
  const data = await response.json().catch(()=>({error:"invalid_relay_response"}));
  if (!response.ok) throw new Error(`push_relay_${response.status}:${data.error || "send_failed"}`);
  return data;
}

async function processUser(supabase: SupabaseClient, apiKey: string, row: BodyClockRow) {
  const { data: lease, error: leaseError } = await supabase.from("background_push_state").select("next_push_at").eq("user_id",row.user_id).single();
  if (leaseError || !lease?.next_push_at) throw new Error("lease_missing");

  const history = safeHistory(row.recent_history);
  const memory = safeMemory(row.long_term_memory);
  const relationshipPoints = Math.max(0, Number(row.relationship_points) || 0);
  const decision = await buildProactiveDecisionContext(supabase, row.user_id, relationshipPoints);
  const persona = await loadPersonaPrompt(supabase, row.user_id, "proactive");
  const { reply, currentTime } = await generateMessage(apiKey, persona.text, history, memory, decision);

  const { data: recentPhotos, error: photoError } = await supabase.from("misaki_proactive_deliveries").select("photo_id").eq("user_id", row.user_id).not("photo_id", "is", null).order("created_at", { ascending: false }).limit(8);
  if (photoError) throw photoError;
  const recentPhotoIds = Array.isArray(recentPhotos) ? recentPhotos.map((x) => typeof x?.photo_id === "string" ? x.photo_id : "").filter(Boolean) : [];

  const selectedPhoto = selectMisakiProactivePhoto({ currentTime, reply, decision, recentPhotoIds });
  const photoContext = { ...decision, currentTime, selectorVersion: 2, source: "body_clock" };

  const { data: finished, error: finishError } = await supabase.rpc("finish_misaki_body_clock_delivery", {
    p_user_id: row.user_id, p_lease_until: lease.next_push_at, p_message: reply,
    p_photo_id: selectedPhoto?.id ?? null, p_photo_src: selectedPhoto?.src ?? null,
    p_photo_context: photoContext, p_delay_minutes: Math.floor(randomDelayMs()/60000),
  });
  if (finishError) throw finishError;

  const { error: eventError } = await supabase.from("misaki_relationship_events").insert({
    user_id: row.user_id,
    event_type: "proactive_decision",
    reason: decision.reason,
    metadata: { decision, delivery_id: finished.deliveryId, photo_id: selectedPhoto?.id ?? null, selector_version: 2 },
  });
  if (eventError) console.error("PROACTIVE_DECISION_EVENT_FAILED", row.user_id);

  const push = row.notifications_enabled ? await relayPush(finished.deliveryId) : { sent: 0, removed: 0, skipped: "notifications_disabled" };
  return { userId: row.user_id, deliveryId: finished.deliveryId, direction: decision.direction, action: decision.action, emotion: decision.emotion, photoId: selectedPhoto?.id ?? null, nextPushAt: finished.nextPushAt, pushesToday: finished.pushesToday, push };
}

export async function handler(request: Request) {
  if (request.method !== "POST") return Response.json({error:"method_not_allowed"},{status:405});
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret.length !== 64) return Response.json({error:"unauthorized_header",version:4},{status:401});
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey || !SUPABASE_URL) return Response.json({error:"admin_config_missing"},{status:503});
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, { auth:{persistSession:false,autoRefreshToken:false}, global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})} });
  const {data: authorized,error: authError} = await supabase.rpc("verify_misaki_body_clock_secret",{p_secret:secret});
  if (authError) return Response.json({error:"auth_unavailable"},{status:503});
  if (authorized !== true) return Response.json({error:"unauthorized_secret",version:4},{status:401});
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  let relayReady = false;
  let relayError: string | null = null;
  try { relayReady = (await relayPush("health")).ok === true; } catch (error) { relayError = error instanceof Error ? error.message : "relay_unavailable"; }
  const ready = {gemini:!!apiKey,pushRelay:relayReady};
  if (new URL(request.url).searchParams.get("mode")==="health") return Response.json({ok:Object.values(ready).every(Boolean),ready,relayError,version:"body-clock-decision-context-v2"});
  if (!Object.values(ready).every(Boolean)) return Response.json({error:"configuration_not_ready",ready,relayError},{status:503});
  const limit = Math.max(1,Math.min(MAX_PER_RUN,Number(new URL(request.url).searchParams.get("limit"))||MAX_PER_RUN));
  const {data,error} = await supabase.rpc("claim_misaki_body_clock_due_users",{p_limit:limit});
  if (error) return Response.json({error:"claim_failed"},{status:500});
  const rows = (data || []) as BodyClockRow[];
  const results: any[] = [];
  let cursor=0;
  const worker=async()=>{ while(cursor<rows.length) { const row=rows[cursor++]; try { const result = await processUser(supabase,apiKey!,row); results.push({ok: !("failed" in result.push) || result.push.failed === 0, ...result}); } catch(error) { console.error("BODY_CLOCK_USER_FAILED",row.user_id); results.push({ok:false,userId:row.user_id,error:error instanceof Error ? error.message : "delivery_failed"}); } } };
  await Promise.all([worker(),worker(),worker(),worker()]);
  return Response.json({ok:results.every(r=>r.ok),checkedAt:new Date().toISOString(),claimed:rows.length,results},{status:results.every(r=>r.ok)?200:500});
}
Deno.serve(handler);
