import { createClient } from "@supabase/supabase-js";
import { runUserEvolutionAnalysis } from "../../../../../lib/persona/evolution-runner";
import type { ChatMessage } from "../../../../../lib/user-profile";

const SUPABASE_URL = "https://tzozajnwznxqgxnjikoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

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

function sanitizeHistory(value: unknown): ChatMessage[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item: any) =>
            item &&
            (item.role === "user" || item.role === "misaki") &&
            typeof item.text === "string" &&
            item.text.trim()
        )
        .map((item: any) => ({
          role: item.role,
          text: item.text.trim().slice(0, 2000),
        }))
        .slice(-60)
    : [];
}

function sanitizeMemory(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item: unknown): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
        .map((item) => item.trim().slice(0, 500))
        .slice(-30)
    : [];
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return Response.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length).trim();
    const supabase = createAuthenticatedSupabase(accessToken);
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return Response.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    let safeHistory = sanitizeHistory(body?.history);
    let safeMemory = sanitizeMemory(body?.memory);
    let historySource: "browser" | "server" = "browser";

    const browserUserMessageCount = safeHistory.filter(
      (item) => item.role === "user"
    ).length;

    if (userData.user.is_anonymous !== true || browserUserMessageCount === 0) {
      const { data: storedState, error: storedError } = await supabase
        .from("misaki_user_conversation_state")
        .select("history,memory")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (storedError) {
        console.error("EVOLUTION STORED HISTORY LOAD ERROR:", storedError);
        if (userData.user.is_anonymous !== true) return Response.json({ error: "Canonical context unavailable." }, { status: 500 });
      } else if (!storedState && userData.user.is_anonymous !== true) {
        safeHistory = []; safeMemory = []; historySource = "server";
      } else if (storedState) {
        const storedHistory = sanitizeHistory(storedState.history);
        const storedMemory = sanitizeMemory(storedState.memory);

        if (userData.user.is_anonymous !== true || storedHistory.some((item) => item.role === "user")) {
          safeHistory = storedHistory;
          safeMemory = storedMemory;
          historySource = "server";
        }
      }
    }

    const userMessageCount = safeHistory.filter(
      (item) => item.role === "user"
    ).length;

    if (safeHistory.length === 0 || userMessageCount === 0) {
      return Response.json({
        analyzed: false,
        skipped: true,
        reason: "insufficient_history",
        saved: 0,
        historySource,
        historyCount: safeHistory.length,
        userMessageCount,
        memoryCount: safeMemory.length,
        autoApplied: false,
      });
    }

    const result = await runUserEvolutionAnalysis(
      supabase,
      userData.user.id,
      apiKey,
      safeHistory,
      safeMemory,
      { force: true }
    );

    return Response.json({
      ...result,
      historySource,
      historyCount: safeHistory.length,
      userMessageCount,
      memoryCount: safeMemory.length,
      autoApplied: false,
    });
  } catch (error) {
    console.error("EVOLUTION ANALYZE ROUTE ERROR:", error);
    return Response.json(
      {
        analyzed: false,
        error: "Evolution analysis failed.",
      },
      { status: 500 }
    );
  }
}
