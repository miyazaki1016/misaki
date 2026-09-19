import { createClient } from "@supabase/supabase-js";
import { admitOperation, operationClient, progressOperation, maintenanceResponse, type LegacyOperation } from '../../../../lib/legacy-drain';

const SUPABASE_URL = "https://tzozajnwznxqgxnjikoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

type ChatMessage = {
  role: "user" | "misaki";
  text: string;
  sentAt?: string;
};

function createAuthenticatedSupabase(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function sanitizeHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item: any) =>
        item &&
        (item.role === "user" || item.role === "misaki") &&
        typeof item.text === "string" &&
        item.text.trim()
    )
    .map((item: any) => ({
      role: item.role as "user" | "misaki",
      text: item.text.trim().slice(0, 2000),
      ...(typeof item.sentAt === "string" && Number.isFinite(Date.parse(item.sentAt))
        ? { sentAt: new Date(item.sentAt).toISOString() }
        : {}),
    }))
    .slice(-60);
}

function sanitizeMemory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item: unknown): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim().slice(0, 500))
    .slice(-30);
}

async function getAuthenticatedClient(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return { error: "Authentication required." as const };
  }

  const supabase = createAuthenticatedSupabase(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return { error: "Authentication required." as const };
  }

  return {
    supabase,
    userId: data.user.id,
    isAnonymous: data.user.is_anonymous === true,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedClient(request);
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

    const { data, error } = await auth.supabase
      .from("misaki_user_conversation_state")
      .select("history,memory,message_count,user_message_count,updated_at")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) {
      console.error("CONVERSATION STATE GET ERROR:", error);
      return Response.json(
        { error: "Conversation state could not be loaded." },
        { status: 500 }
      );
    }

    const history = sanitizeHistory(data?.history);
    const memory = sanitizeMemory(data?.memory);

    return Response.json({
      exists: Boolean(data),
      history,
      memory,
      messageCount:
        typeof data?.message_count === "number"
          ? data.message_count
          : history.length,
      userMessageCount:
        typeof data?.user_message_count === "number"
          ? data.user_message_count
          : history.filter((item) => item.role === "user").length,
      memoryCount: memory.length,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (error) {
    console.error("CONVERSATION STATE GET ROUTE ERROR:", error);
    return Response.json(
      { error: "Conversation state could not be loaded." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let operation: LegacyOperation | null = null;
  let completed = false;
  try {
    const auth = await getAuthenticatedClient(request);
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const history = sanitizeHistory(body?.history);
    const memoryWasProvided = Object.prototype.hasOwnProperty.call(
      body ?? {},
      "memory"
    );
    const memory = memoryWasProvided ? sanitizeMemory(body?.memory) : null;
    if (body?.saveAnonymous === true && (!auth.isAnonymous || body.expectedUserId !== auth.userId)) {
      return Response.json({ error: 'Anonymous account mismatch.' }, { status: 409 });
    }

    try {
      operation = await admitOperation(body?.saveAnonymous === true ? 'email_checkpoint' : 'history', auth.userId);
      const token = getBearerToken(request)!;
      auth.supabase = operationClient(token, operation);
    } catch { return maintenanceResponse(); }

    if (body?.saveAnonymous === true) {
      if (!auth.isAnonymous || body.expectedUserId !== auth.userId) {
        completed = await progressOperation(operation, 'failed');
        return Response.json({ error: "Anonymous account mismatch." }, { status: 409 });
      }
      const { data, error } = await auth.supabase.rpc("save_anonymous_conversation_state", {
        p_history: history,
        p_memory: memory ?? [],
      });
      if (error) {
        console.error("ANONYMOUS CONVERSATION SAVE ERROR:", error);
        return Response.json({ error: "Conversation could not be saved." }, { status: 500 });
      }
      completed = await progressOperation(operation, 'succeeded');
      if (!completed) throw new Error('operation finalization failed');
      return Response.json({ synced: true, result: data });
    }

    if (history.length === 0) {
      completed = await progressOperation(operation, 'failed');
      return Response.json(
        { error: "Conversation history is empty." },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase.rpc(
      "sync_user_conversation_state",
      {
        p_history: history,
        p_memory: memory,
      }
    );

    if (error) {
      console.error("CONVERSATION STATE SYNC RPC ERROR:", error);
      return Response.json(
        { error: "Conversation history could not be synchronized." },
        { status: 500 }
      );
    }

    completed = await progressOperation(operation, 'succeeded');
    if (!completed) throw new Error('operation finalization failed');
    return Response.json({
      synced: true,
      result: data,
    });
  } catch (error) {
    console.error("CONVERSATION STATE POST ROUTE ERROR:", error);
    return Response.json(
      { error: "Conversation history could not be synchronized." },
      { status: 500 }
    );
  } finally {
    if (operation && !completed) await progressOperation(operation, 'unknown');
  }
}
