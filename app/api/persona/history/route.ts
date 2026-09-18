import { createClient } from "@supabase/supabase-js";
import { createServerSupabase, loadCanonicalState, openTemporaryState, sealTemporaryState, type RootState, loadTemporaryRoot, loadCompletedTemporaryTurn } from "../../../../lib/canonical-state";

async function authenticate(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const db = createClient("https://tzozajnwznxqgxnjikoy.supabase.co", "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}
function responseState(state: RootState, ephemeral = false) {
  const history = state.history ?? [];
  return { exists: true, history, memory: state.memory, relationshipPoints: state.relationshipPoints,
    misakiTodayMemory: state.todayMemory, ephemeral, messageCount: history.length,
    userMessageCount: history.filter((item: any) => item?.role === "user").length, memoryCount: state.memory.length, updatedAt: state.updatedAt ?? null };
}
export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (user.is_anonymous) return Response.json({ error: "Temporary state required." }, { status: 400 });
    return Response.json(responseState(await loadCanonicalState(user.id)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("CONVERSATION STATE READ FAILED", error);
    return Response.json({ error: "Conversation state could not be loaded." }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json();
    if (body.saveAnonymous === true) {
      if (!user.is_anonymous || body.expectedUserId !== user.id) {
        return Response.json({ error: "Anonymous account mismatch." }, { status: 409 });
      }
      let state = await loadTemporaryRoot(user.id, body.temporaryState);
      // A reply can have committed even if its transport response was lost.
      if (typeof body.pending?.requestId === "string" && typeof body.pending?.message === "string") {
        const replay = await loadCompletedTemporaryTurn(user.id, body.pending.requestId, body.pending.message, body.pending.temporaryState);
        if (replay) {
          const recovered = openTemporaryState(replay.temporaryState);
          if (recovered) state = recovered.state;
        }
      }
      const { data, error } = await createServerSupabase().rpc("save_misaki_temporary_state", {
        p_user_id: user.id, p_history: state.history ?? [], p_memory: state.memory,
        p_today_memory: state.todayMemory, p_points: state.relationshipPoints,
      });
      if (error) throw new Error("Email checkpoint failed");
      return Response.json({ synced: true, result: data });
    }
    if (body.action === "load") {
      if (user.is_anonymous && typeof body.pending?.requestId === "string" && typeof body.pending?.message === "string") {
        const replay = await loadCompletedTemporaryTurn(user.id, body.pending.requestId, body.pending.message, body.pending.temporaryState);
        if (replay) {
          const recovered = openTemporaryState(replay.temporaryState);
          if (recovered) return Response.json({ ...responseState(recovered.state, true), temporaryState: replay.temporaryState, recoveredTurn: true });
        }
      }
      const state = user.is_anonymous ? await loadTemporaryRoot(user.id, body.temporaryState) : await loadCanonicalState(user.id);
      return Response.json({ ...responseState(state, !!user.is_anonymous),
        ...(user.is_anonymous ? { temporaryState: sealTemporaryState(state, "load") } : {}) });
    }
    if (!["deleteMemory", "clearMemory", "clearHistory"].includes(body.action) ||
      (body.action === "deleteMemory" && typeof body.value !== "string")) {
      return Response.json({ error: "Explicit state operation required." }, { status: 400 });
    }
    if (user.is_anonymous) {
      const state = await loadTemporaryRoot(user.id, body.temporaryState);
      if (body.action === "clearHistory") state.history = [];
      else state.memory = body.action === "clearMemory" ? [] : state.memory.filter(item => item !== body.value);
      return Response.json({ ...responseState(state, true), temporaryState: sealTemporaryState(state, "edit") });
    }
    const { error } = await createServerSupabase().rpc("edit_misaki_conversation_state", {
      p_user_id: user.id, p_action: body.action, p_value: body.value ?? null,
    });
    if (error) throw new Error("Conversation edit failed");
    return Response.json(responseState(await loadCanonicalState(user.id)));
  } catch (error) {
    console.error("CONVERSATION STATE WRITE FAILED", error);
    return Response.json({ error: "Conversation state could not be saved." }, { status: 500 });
  }
}
