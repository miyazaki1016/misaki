import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import { openTemporaryReceipt } from "./temporary-state.ts";

export async function loadBodyClockRoot(s: SupabaseClient, userId: string) {
  const { data: account, error: accountError } = await s.auth.admin.getUserById(userId);
  if (accountError || !account.user) throw new Error("body_clock_account_unavailable");
  if (account.user.is_anonymous) {
    const { data: root, error: rootError } = await s.from("misaki_temporary_roots")
      .select("token,revision,expires_at").eq("user_id", userId).maybeSingle();
    if (rootError) throw rootError;
    if (root) {
      const state = await openTemporaryReceipt(root.token, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      if (!state || Date.parse(root.expires_at) <= Date.now()) return null;
      return { history: state.history, memory: state.memory, temporaryPoints: state.relationshipPoints,
        temporaryState: state, temporaryRevision: root.revision, temporaryExpiresAt: root.expires_at, updatedAt: null };
    }
    // An immutable replay receipt can be older than an edit or delivery.
    // Never reconstruct a shared root from that separate source.
    return null;
  }
  const { data, error } = await s.from("misaki_user_conversation_state")
    .select("history,memory,today_memory,updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return { history: data?.history, memory: data?.memory, temporaryPoints: undefined,
    temporaryState: undefined, temporaryRevision: null, temporaryExpiresAt: null, updatedAt: data?.updated_at ?? null };
}
