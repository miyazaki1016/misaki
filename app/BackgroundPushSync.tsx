"use client";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { registerPushSubscription } from "../lib/push-notifications";

export default function BackgroundPushSync() {
  useEffect(() => {
    let stopped = false, syncing = false, pushOwner: string | null = null;
    async function sync() {
      if (stopped || syncing) return;
      syncing = true;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user;
        if (!user) { pushOwner = null; return; }
        const permission = "Notification" in window ? Notification.permission : "unsupported";
        if (permission === "granted" && pushOwner !== user.id) {
          try { await registerPushSubscription(); pushOwner = user.id; }
          catch (error) { console.error("BACKGROUND PUSH OWNER SYNC ERROR", error); }
        }
        if (stopped) return;
        const { data: latest } = await supabase.auth.getSession();
        if (latest.session?.user.id !== user.id) return;
        // The browser owns notification preferences, never Misaki's root state.
        const { error: writeError } = await supabase.from("background_push_state").upsert({
          user_id: user.id, notifications_enabled: permission === "granted",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo",
        }, { onConflict: "user_id" });
        if (writeError) throw writeError;
      } catch (error) { console.error("BACKGROUND STATE SYNC ERROR", error); }
      finally { syncing = false; }
    }
    const visible = () => { if (document.visibilityState === "hidden") void sync(); };
    void sync();
    const timer = window.setInterval(() => void sync(), 60_000);
    const { data: listener } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void sync(), 0));
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pagehide", sync);
    return () => { stopped = true; window.clearInterval(timer); listener.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", visible); window.removeEventListener("pagehide", sync); };
  }, []);
  return null;
}
