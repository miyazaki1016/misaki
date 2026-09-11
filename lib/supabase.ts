import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const supabasePublishableKey =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
