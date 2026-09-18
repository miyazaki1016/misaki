import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import { openTemporaryReceipt } from "./temporary-state.ts";

export async function loadBodyClockRoot(s: SupabaseClient, userId: string) {
  const { data: account, error: accountError } = await s.auth.admin.getUserById(userId);
  if (accountError || !account.user) throw new Error("body_clock_account_unavailable");
  if (account.user.is_anonymous) {
    const { data, error } = await s.from("daily_message_requests").select("temporary_result")
      .eq("user_id", userId).not("temporary_result", "is", null).order("completed_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    const state = await openTemporaryReceipt(data?.temporary_result, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (!state) return null;
    return { history: state.history, memory: state.memory, temporaryPoints: state.relationshipPoints };
  }
  const { data, error } = await s.from("misaki_user_conversation_state")
    .select("history,memory,today_memory").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return { history: data?.history, memory: data?.memory, temporaryPoints: undefined };
}
