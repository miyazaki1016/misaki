import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "../../../../lib/canonical-state";

const RATINGS = new Set(["good", "bad"]);
const REASONS = new Set(["unnatural", "too_cold", "distance_wrong", "forgot_context", "repetitive", "other"]);

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

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });

    const body = await request.json();
    if (typeof body.requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.requestId) || !RATINGS.has(body.rating)) {
      return Response.json({ error: "Invalid feedback." }, { status: 400 });
    }
    const reason = body.rating === "bad" && REASONS.has(body.reason) ? body.reason : null;
    const { error } = await createServerSupabase().from("misaki_reply_feedback").upsert({
      user_id: user.id,
      request_id: body.requestId,
      rating: body.rating,
      reason,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,request_id" });
    if (error) throw error;
    return Response.json({ saved: true });
  } catch (error) {
    console.error("REPLY FEEDBACK FAILED", error);
    return Response.json({ error: "Feedback could not be saved." }, { status: 500 });
  }
}
