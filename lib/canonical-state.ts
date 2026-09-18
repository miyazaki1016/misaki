import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type RootState = {
  history?: unknown[];
  memory: string[];
  todayMemory: { date: string; items: string[] };
  relationshipPoints: number;
  updatedAt?: string | null;
  temporaryRevision?: string | null;
};

export function createServerSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Canonical state server credentials missing");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tzozajnwznxqgxnjikoy.supabase.co", key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function encryptionKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Temporary state server credentials missing");
  return createHash("sha256").update(`misaki-temporary-state-v1:${key}`).digest();
}

export function sealTemporaryState(state: RootState, requestId: string, result?: Record<string, unknown>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const payload = Buffer.from(JSON.stringify({ state, requestId, result, expires: Date.now() + 24 * 60 * 60 * 1000 }));
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

// Anonymous state is a server-authenticated, temporary browser-session token.
// It is not a permanent account state and clients cannot choose its points/memory.
// Do not bind to the anonymous auth ID: Safari's transient auth recovery replaces
// that ID while preserving this live browser session. Permanent accounts ignore it.
export function openTemporaryState(token: unknown): { state: RootState; requestId: string; result?: Record<string, unknown> } | null {
  if (typeof token !== "string" || token.length > 512_000) return null;
  try {
    const buffer = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    const parsed = JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString());
    if (!Number.isFinite(parsed.expires) || parsed.expires <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function loadCanonicalState(userId: string): Promise<RootState & { history: unknown[] }> {
  const db = createServerSupabase();
  const [relationship, conversation] = await Promise.all([
    db.from("misaki_relationship_state").select("intimacy_points").eq("user_id", userId).maybeSingle(),
    db.from("misaki_user_conversation_state").select("history,memory,today_memory,updated_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (relationship.error || conversation.error) throw new Error("Canonical state read failed");
  return {
    relationshipPoints: relationship.data?.intimacy_points ?? 0,
    history: conversation.data?.history ?? [],
    memory: conversation.data?.memory ?? [],
    todayMemory: conversation.data?.today_memory ?? { date: "", items: [] },
    updatedAt: conversation.data?.updated_at ?? null,
  };
}

export async function loadTemporaryRoot(userId: string, token: unknown): Promise<RootState> {
  const temporary = openTemporaryState(token);
  if (token && !temporary) throw new Error("Temporary state token is invalid or expired");
  const { data: root, error: rootError } = await createServerSupabase().from("misaki_temporary_roots")
    .select("token,revision,expires_at").eq("user_id", userId).maybeSingle();
  if (rootError) throw new Error("Temporary root read failed");
  if (root) {
    const verified = openTemporaryState(root.token);
    if (!verified || Date.parse(root.expires_at) <= Date.now()) throw new Error("Temporary root expired");
    return { ...verified.state, temporaryRevision: root.revision };
  }
  // A valid bearer state can seed a replacement Safari anonymous auth ID.
  // Once this ID has a server root, browser snapshots cannot overwrite it.
  if (temporary) return { ...temporary.state, temporaryRevision: null };
  // Only an explicit email checkpoint is eligible for fresh-tab restoration.
  // Ordinary anonymous chat creates no plaintext permanent conversation root.
  const { data, error } = await createServerSupabase().from("misaki_relationship_events")
    .select("id").eq("user_id", userId).eq("event_type", "email_save_checkpoint").maybeSingle();
  if (error) throw new Error("Temporary checkpoint read failed");
  return data ? loadCanonicalState(userId) : { history: [], memory: [], todayMemory: { date: "", items: [] }, relationshipPoints: 0 };
}

export async function loadCompletedTurn(userId: string, requestId: string, message: string) {
  const { data, error } = await createServerSupabase().from("misaki_relationship_events")
    .select("metadata").eq("user_id", userId).eq("request_id", requestId)
    .eq("event_type", "chat_turn_completed").maybeSingle();
  if (error) throw new Error("Completed turn read failed");
  if (!data) return null;
  if (data.metadata.message !== message) throw new Error("Request ID reused for another message");
  return data.metadata.result as Record<string, unknown>;
}

export async function completeCanonicalTurn(userId: string, requestId: string, message: string,
  userMessageAt: string, result: Record<string, unknown>) {
  const { data, error } = await createServerSupabase().rpc("complete_misaki_chat_turn", {
    p_user_id: userId, p_request_id: requestId, p_message: message,
    p_user_message_at: userMessageAt, p_result: result,
  });
  if (error || !data) throw new Error("Canonical turn commit failed");
  return data as Record<string, unknown>;
}

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }

function temporaryResponse(token: string, message: string) {
  const temporary = openTemporaryState(token);
  if (!temporary?.result || temporary.result.originalMessage !== message) throw new Error("Temporary replay unavailable");
  const { originalMessage, ...result } = temporary.result;
  return { ...result, temporaryState: token };
}

export async function loadCompletedTemporaryTurn(userId: string, requestId: string, message: string, parent: unknown) {
  const { data, error } = await createServerSupabase().from("daily_message_requests")
    .select("completed_at,temporary_result,message_hash,parent_hash")
    .eq("user_id", userId).eq("request_id", requestId).maybeSingle();
  if (error) throw new Error("Temporary receipt read failed");
  if (!data?.completed_at) return null;
  if (data.message_hash !== digest(message) || data.parent_hash !== digest(typeof parent === "string" ? parent : "")) {
    throw new Error("Request ID reused for another temporary turn");
  }
  return temporaryResponse(data.temporary_result, message);
}

export async function completeTemporaryTurn(userId: string, requestId: string, message: string, parent: unknown,
  token: string, revision: string | null = null) {
  const verified = openTemporaryState(token);
  if (!verified) throw new Error("Temporary commit state invalid");
  const { data, error } = await createServerSupabase().rpc("complete_misaki_temporary_turn", {
    p_user_id: userId, p_request_id: requestId, p_message_hash: digest(message),
    p_parent_hash: digest(typeof parent === "string" ? parent : ""), p_token: token,
    p_expected_revision: revision, p_state: verified.state,
  });
  if (error || typeof data !== "string") throw new Error("Temporary receipt commit failed");
  return temporaryResponse(data, message);
}

export async function editTemporaryRoot(userId: string, state: RootState, purpose = "edit") {
  const token = sealTemporaryState(state, purpose);
  const { error } = await createServerSupabase().rpc("write_misaki_temporary_root", {
    p_user_id: userId, p_token: token, p_state: state, p_expected_revision: state.temporaryRevision ?? null,
  });
  if (error) throw new Error("Temporary edit commit failed");
  return token;
}
