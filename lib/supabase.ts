import { recoveryScope } from "./recovery-session";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const supabasePublishableKey =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      ...(recoveryScope ? { storageKey: `misaki-recovery-auth-${recoveryScope}`, storage: window.sessionStorage } : {}),
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
