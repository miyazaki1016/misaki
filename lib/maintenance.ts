import { createClient } from "@supabase/supabase-js";

// This module is server-only by dependency direction: never import it in a client.
// A missing/unreadable control row fails closed; no browser input chooses the state.
export async function maintenanceResponse(): Promise<Response | null> {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("Maintenance credentials unavailable");
    const db = createClient("https://tzozajnwznxqgxnjikoy.supabase.co", key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(5000) }) },
    });
    const { data, error } = await db.from("misaki_maintenance_control").select("enabled").eq("id", 1).maybeSingle();
    if (error || typeof data?.enabled !== "boolean") throw new Error("Maintenance control unavailable");
    if (!data.enabled) return null;
    return unavailable("MAINTENANCE", "メンテナンス中です。会話や記憶は保存されています。しばらくしてから再送してください。");
  } catch {
    return unavailable("MAINTENANCE_UNAVAILABLE", "現在、送信の安全確認ができません。しばらくしてから再送してください。");
  }
}

function unavailable(code: string, error: string) {
  return Response.json({ code, maintenance: true, error }, {
    status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" },
  });
}
