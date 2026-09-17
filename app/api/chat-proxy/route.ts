import { createClient } from "@supabase/supabase-js";
import { POST as baseChatPost } from "../chat/route";
import { recordRelationshipChatTurn } from "../../../lib/relationship-time";

const SUPABASE_URL = "https://tzozajnwznxqgxnjikoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";
const MAX_MEMORY = 30;
const PARSE_ERROR_MESSAGE =
  "美咲の返事をうまく読み取れなかったみたい。もう一度話しかけてね。";

function createAuthenticatedSupabase(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function sanitizeMemory(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(-MAX_MEMORY)
    : [];
}

function isMemoryRecallQuestion(message: unknown) {
  if (typeof message !== "string") return false;
  const normalized = message.replace(/\s+/g, "");
  return [
    "覚えてる",
    "覚えている",
    "覚えてた",
    "何覚えてる",
    "なに覚えてる",
    "何を覚えてる",
    "なにを覚えてる",
    "記憶してる",
    "記憶している",
    "私のこと覚えて",
    "俺のこと覚えて",
    "僕のこと覚えて",
    "好み覚えて",
    "何知ってる",
    "なに知ってる",
  ].some((pattern) => normalized.includes(pattern));
}

function createRecallAwareMessage(message: unknown, recallMode: boolean) {
  if (!recallMode || typeof message !== "string") return message;

  return `${message}\n\n【会話履歴の確認】\n回答する前に、渡されている直近の会話履歴を必ず確認してください。\n質問の答えが直近の会話履歴にある場合は、その内容を最優先で使って自然に答えてください。\n直近の会話履歴になければ長期記憶を確認し、どちらにも根拠がなければ知らないことを作らずに答えてください。`;
}

function createForwardedRequest(request: Request, body: unknown) {
  return new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(body),
  });
}

async function callBaseChatWithParseRetry(request: Request, body: unknown) {
  const firstResponse = await baseChatPost(createForwardedRequest(request, body));
  if (firstResponse.ok || firstResponse.status !== 500) return firstResponse;

  let retryParseFailure = false;
  try {
    const payload = await firstResponse.clone().json();
    retryParseFailure = payload?.error === PARSE_ERROR_MESSAGE;
  } catch {
    return firstResponse;
  }

  if (!retryParseFailure) return firstResponse;

  console.warn("CHAT JSON PARSE ERROR: retrying Gemini response once");
  return baseChatPost(createForwardedRequest(request, body));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authorization = request.headers.get("authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return Response.json(
        { error: "ログイン情報を確認できませんでした。ページを再読み込みしてね。" },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length).trim();
    const supabase = createAuthenticatedSupabase(accessToken);
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return Response.json(
        { error: "ログイン情報を確認できませんでした。ページを再読み込みしてね。" },
        { status: 401 }
      );
    }

    const isAnonymous = userData.user.is_anonymous === true;
    const recallMode = isMemoryRecallQuestion(body?.message);
    const messageForModel = createRecallAwareMessage(body?.message, recallMode);

    // 匿名利用ではSupabaseを会話・記憶・関係時間の保存先にしない。
    // ブラウザから届いた一時記憶と直近の会話履歴を、そのブラウザセッション中の回答に使う。
    if (isAnonymous) {
      const temporaryMemory = sanitizeMemory(body?.memory);
      const safeBody = {
        ...body,
        message: messageForModel,
        memory: temporaryMemory,
      };

      const baseResponse = await callBaseChatWithParseRetry(request, safeBody);
      if (!baseResponse.ok) return baseResponse;

      const result = await baseResponse.json();
      const returnedMemory = sanitizeMemory(result?.memory);

      return Response.json({
        ...result,
        memory: recallMode ? temporaryMemory : returnedMemory,
        memorySynced: false,
        relationshipTimeSynced: false,
        ephemeral: true,
      });
    }

    // 保存済みアカウントではSupabaseのmemoryを唯一の正本として使う。
    // 記憶確認の質問でも、正本memoryに加えてブラウザから届く直近の会話履歴を文脈として残す。
    const { data: state, error: stateError } = await supabase
      .from("misaki_user_conversation_state")
      .select("memory")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (stateError) {
      console.error("CANONICAL MEMORY READ ERROR:", stateError);
      return Response.json(
        { error: "美咲の記憶を確認できませんでした。少ししてからもう一度話しかけてね。" },
        { status: 500 }
      );
    }

    const canonicalMemory = sanitizeMemory(state?.memory);
    const safeBody = {
      ...body,
      message: messageForModel,
      memory: canonicalMemory,
    };

    const userMessageAt = new Date();
    const baseResponse = await callBaseChatWithParseRetry(request, safeBody);
    if (!baseResponse.ok) return baseResponse;

    const result = await baseResponse.json();
    const misakiMessageAt = new Date();
    const returnedMemory = sanitizeMemory(result?.memory);
    const nextMemory = recallMode ? canonicalMemory : returnedMemory;
    const historyForSync =
      typeof body?.message === "string" && typeof result?.reply === "string"
        ? [
            { role: "user", text: body.message },
            { role: "misaki", text: result.reply },
          ]
        : [];

    const { error: syncError } = await (supabase.rpc as any)(
      "sync_user_conversation_state",
      { p_history: historyForSync, p_memory: nextMemory }
    );

    if (syncError) {
      console.error("CANONICAL MEMORY WRITE ERROR:", syncError);
      return Response.json(
        { error: "美咲の記憶を保存できませんでした。もう一度話しかけてね。" },
        { status: 500 }
      );
    }

    // 会話と記憶の保存が成功した後にだけ関係時間を進める。
    // 関係時間の記録失敗で、すでに生成できた会話そのものは失敗扱いにしない。
    const relationshipTimeSynced = await recordRelationshipChatTurn(
      supabase,
      false,
      userMessageAt,
      misakiMessageAt
    );

    return Response.json({
      ...result,
      memory: nextMemory,
      memorySynced: true,
      relationshipTimeSynced,
    });
  } catch (error) {
    console.error("CHAT PROXY ERROR:", error);
    return Response.json(
      { error: "今ちょっと美咲とつながりにくいみたい。少ししてからもう一度話しかけてね。" },
      { status: 500 }
    );
  }
}
