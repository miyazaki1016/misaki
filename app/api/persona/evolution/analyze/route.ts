import { createClient } from "@supabase/supabase-js";
import { runUserEvolutionAnalysis } from "../../../../../lib/persona/evolution-runner";
import type { ChatMessage } from "../../../../../lib/user-profile";

const SUPABASE_URL = "https://tzozajnwznxqgxnjikoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Gemini API key is missing." }, { status: 500 });
    }

    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const accessToken = authorization.slice("Bearer ".length).trim();
    const supabase = createAuthenticatedSupabase(accessToken);
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();

    const safeHistory: ChatMessage[] = Array.isArray(body?.history)
      ? body.history
          .filter((item: any) =>
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

    const safeMemory: string[] = Array.isArray(body?.memory)
      ? body.memory
          .filter((item: unknown) => typeof item === "string" && item.trim())
          .map((item: string) => item.trim().slice(0, 500))
          .slice(-30)
      : [];

    const result = await runUserEvolutionAnalysis(
      supabase,
      userData.user.id,
      apiKey,
      safeHistory,
      safeMemory,
      { force: true }
    );

    return Response.json({ ...result, autoApplied: false });
  } catch (error) {
    console.error("EVOLUTION ANALYZE ROUTE ERROR:", error);
    return Response.json(
      { analyzed: false, error: "Evolution analysis failed." },
      { status: 500 }
    );
  }
}
