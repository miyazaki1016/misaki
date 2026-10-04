import "server-only";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { telemetryRow, telemetryFailure, type GeminiCallKind, type GeminiTelemetrySink } from "./gemini-usage-telemetry";

/**
 * userId is the server-verified auth UUID for this Gemini call context, including
 * anonymous authenticated users; it need not identify a permanent/billing account.
 * It alone cannot determine Free/Premium. Future analysis must safely join
 * canonical account/subscription information for the call time.
 * No browser/API write endpoint exists.
 */
export function createGeminiTelemetrySink(callKind: GeminiCallKind, userId: string | null, requestId: string | null): GeminiTelemetrySink {
  return (attempt, usage) => {
    const row = telemetryRow(attempt, { callKind, userId, requestId });
    // Register while inside the request/after lifecycle; do no DB work on the model path.
    after(async () => {
      try {
        if (usage) Object.assign(row, await usage);
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!key) throw new Error("telemetry_credentials_unavailable");
        const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tzozajnwznxqgxnjikoy.supabase.co", key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(2_000) }) },
        });
        const { error } = await db.from("misaki_gemini_usage_telemetry").insert(row);
        if (error) telemetryFailure();
      } catch { telemetryFailure(); }
    });
  };
}
