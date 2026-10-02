"use client";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DEVICE_USER_KEY, EMAIL_SAVE_USER_KEY } from "../../lib/device-conversation";

const CHAT_HISTORY_KEY = "misaki-chat-history";
const AUTH_KIND_KEY = "misaki-auth-kind";
function readHistory(): any[] {
  try { const value = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function sameHistory(a: any[], b: any[]) {
  return a.length === b.length && a.every((item, i) => item?.role === b[i]?.role && item?.text === b[i]?.text);
}
export default function ConversationHistorySync() {
  useEffect(() => {
    let stopped = false, syncing = false, permanentlyDisabled = false;
    const sync = async () => {
      if (stopped || syncing || permanentlyDisabled || sessionStorage.getItem("misaki-chat-sending")) return;
      // Anonymous history is carried by the temporary canonical root. Never start
      // the permanent history GET path for a browser known to be anonymous.
      if (localStorage.getItem(AUTH_KIND_KEY) === "anonymous") return;
      syncing = true;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data.session;
        if (!session?.access_token || session.user.is_anonymous) return;
        const userId = session.user.id;
        if (localStorage.getItem(DEVICE_USER_KEY) !== userId) return;
        const before = readHistory();
        const response = await fetch("/api/persona/history?source=conversation-history-sync", {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
        });
        if (!response.ok) throw new Error("Conversation state load failed");
        const state = await response.json();
        if (state?.ephemeral === true) {
          permanentlyDisabled = true;
          localStorage.setItem(AUTH_KIND_KEY, "anonymous");
          return;
        }
        if (!state || state.exists !== true || !Array.isArray(state.history) || !Array.isArray(state.memory)) return;
        const { data: latest } = await supabase.auth.getSession();
        if (stopped || latest.session?.user.id !== userId || latest.session.user.is_anonymous ||
          localStorage.getItem(DEVICE_USER_KEY) !== userId || sessionStorage.getItem("misaki-chat-sending") ||
          !sameHistory(before, readHistory())) return;
        window.dispatchEvent(new CustomEvent("misaki-root-state", { detail: state }));
        const { data: usageData, error: usageError } = await supabase.rpc("get_daily_message_usage");
        if (usageError) throw usageError;
        const usage = Array.isArray(usageData) ? usageData[0] : usageData;
        if (usage && typeof usage === "object") {
          window.dispatchEvent(new CustomEvent("misaki-usage-state", { detail: {
            messageCount: typeof usage.message_count === "number" ? usage.message_count : undefined,
            remaining: typeof usage.remaining === "number" ? usage.remaining : undefined,
            isPremium: usage.is_premium === true,
          } }));
        }
        localStorage.removeItem(EMAIL_SAVE_USER_KEY);
        if (sameHistory(before, state.history)) return;
        // Keep a pending/failed local user bubble. Successful turns are already
        // committed by the server. A display cache is never uploaded as root state.
        if (before.length > state.history.length && sameHistory(before.slice(0, state.history.length), state.history)) return;
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(state.history));
        // Canonical history refresh must never hard-reload the chat page.
        // A reload remounts this sync component and can create a reload/fetch loop
        // while auth and the display cache are converging (especially on Chrome).
        window.dispatchEvent(new CustomEvent("misaki-history-state", { detail: state.history }));
      } catch (error) { console.error("CONVERSATION HISTORY SYNC ERROR", error); }
      finally { syncing = false; }
    };
    void sync();
    // Canonical history is refreshed on mount, foreground/focus and auth changes.
    // Do not poll every 5 seconds: normal chat updates locally after commit, while
    // Body Clock/background additions are picked up when the user returns.
    const visible = () => { if (document.visibilityState === "visible") void sync(); };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", visible);
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user || session.user.is_anonymous) return;
      window.setTimeout(() => void sync(), 100);
    });
    return () => { stopped = true; window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", visible); listener.subscription.unsubscribe(); };
  }, []);
  return null;
}
