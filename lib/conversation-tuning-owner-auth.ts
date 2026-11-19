import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Owner-only authorization boundary for a future #220 route.
 * Do not mount an admin route until the owner UID is configured privately.
 * Never trust client-provided owner flags, email, or user IDs.
 */
export type OwnerAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 | 503 };

export async function verifyTuningOwnerBearer(
  authorization: string | null,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<OwnerAuthResult> {
  const ownerId = env.MISAKI_TUNING_OWNER_USER_ID?.trim();
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "https://tzozajnwznxqgxnjikoy.supabase.co";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";
  // An unconfigured owner is NOT public access.
  if (!ownerId || !/^[0-9a-f]{8}-[0-9a-f-]{28,36}$/i.test(ownerId)) {
    return { ok: false, status: 503 };
  }
  const match = /^Bearer ([^\s]+)$/.exec(authorization ?? "");
  if (!match) return { ok: false, status: 401 };
  try {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.getUser(match[1]);
    if (error || !data.user || data.user.is_anonymous === true) {
      return { ok: false, status: 401 };
    }
    if (data.user.id !== ownerId) return { ok: false, status: 403 };
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, status: 503 };
  }
}
