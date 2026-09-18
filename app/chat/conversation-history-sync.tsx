"use client";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DEVICE_USER_KEY, EMAIL_SAVE_USER_KEY } from "../../lib/device-conversation";

const CHAT_HISTORY_KEY = "misaki-chat-history";
function readHistory(): any[] {
  try { const value = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function sameHistory(a: any[], b: any[]) {
  return a.length === b.length && a.every((item, i) => item?.role === b[i]?.role && item?.text === b[i]?.text);
}
export default function ConversationHistorySync() {
  useEffect(() => {
    let stopped = false, syncing = false;
    const sync = async () => {
      if (stopped || syncing || sessionStorage.getItem("misaki-chat-sending")) return;
      syncing = true;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data.session;
        if (!session?.access_token || session.user.is_anonymous) return;
        const userId = session.user.id;
        if (localStorage.getItem(DEVICE_USER_KEY) !== userId) return;
        const before = readHistory();
        const response = await fetch("/api/persona/history", {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
        });
        if (!response.ok) throw new Error("Conversation state load failed");
        const state = await response.json();
        if (!state || state.exists !== true || !Array.isArray(state.history) || !Array.isArray(state.memory)) return;
        const { data: latest } = await supabase.auth.getSession();
        if (stopped || latest.session?.user.id !== userId || latest.session.user.is_anonymous ||
          localStorage.getItem(DEVICE_USER_KEY) !== userId || sessionStorage.getItem("misaki-chat-sending") ||
          !sameHistory(before, readHistory())) return;
        window.dispatchEvent(new CustomEvent("misaki-root-state", { detail: state }));
        localStorage.removeItem(EMAIL_SAVE_USER_KEY);
        if (sameHistory(before, state.history)) return;
        // Keep a pending/failed local user bubble. Successful turns are already
        // committed by the server. A display cache is never uploaded as root state.
        if (before.length > state.history.length && sameHistory(before.slice(0, state.history.length), state.history)) return;
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(state.history));
        window.location.reload();
      } catch (error) { console.error("CONVERSATION HISTORY SYNC ERROR", error); }
      finally { syncing = false; }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 5_000);
    const visible = () => { if (document.visibilityState === "visible") void sync(); };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", visible);
    const { data: listener } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void sync(), 100));
    return () => { stopped = true; window.clearInterval(timer); window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", visible); listener.subscription.unsubscribe(); };
  }, []);
  return null;
}
