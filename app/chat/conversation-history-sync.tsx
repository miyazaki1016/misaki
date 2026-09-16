"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

const CHAT_HISTORY_KEY = "misaki-chat-history";
const LONG_MEMORY_KEY = "misaki-long-term-memory";
const SYNC_INTERVAL_MS = 5_000;

type ChatMessage = {
  role: "user" | "misaki";
  text: string;
  sentAt?: string;
};

type ServerState = {
  exists?: boolean;
  history?: unknown;
  memory?: unknown;
};

function readJsonArray(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is ChatMessage =>
        Boolean(
          item &&
            typeof item === "object" &&
            ((item as ChatMessage).role === "user" ||
              (item as ChatMessage).role === "misaki") &&
            typeof (item as ChatMessage).text === "string" &&
            (item as ChatMessage).text.trim()
        )
    )
    .map((item) => ({
      role: item.role,
      text: item.text.trim().slice(0, 2000),
      ...(typeof item.sentAt === "string" &&
      Number.isFinite(new Date(item.sentAt).getTime())
        ? { sentAt: new Date(item.sentAt).toISOString() }
        : {}),
    }))
    .slice(-60);
}

function sanitizeMemory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 500))
    .filter(Boolean)
    .slice(-30);
}

function arraysEqual(a: unknown[], b: unknown[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function fetchServerState(token: string): Promise<ServerState> {
  const response = await fetch("/api/persona/history", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Conversation state load failed.");
  return (await response.json().catch(() => null)) ?? {};
}

export default function ConversationHistorySync() {
  useEffect(() => {
    let stopped = false;
    let syncing = false;

    const sync = async () => {
      if (stopped || syncing) return;
      syncing = true;

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;

        // 匿名利用中は会話・記憶をSupabaseへ永続化しない。
        // ブラウザ内の一時データだけで会話を続ける。
        if (!session?.access_token || !session.user || session.user.is_anonymous) {
          return;
        }

        const localHistory = sanitizeHistory(readJsonArray(CHAT_HISTORY_KEY));
        const localMemory = sanitizeMemory(readJsonArray(LONG_MEMORY_KEY));
        let serverState = await fetchServerState(session.access_token);

        // 匿名で話していた美咲をメール保存した直後だけ、
        // その時点の一時会話・記憶を保存済みアカウントへ初回登録する。
        if (!serverState.exists && (localHistory.length > 0 || localMemory.length > 0)) {
          const bootstrap = await fetch("/api/persona/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              history: localHistory,
              memory: localMemory,
            }),
          });

          if (!bootstrap.ok) throw new Error("Initial conversation sync failed.");
          serverState = await fetchServerState(session.access_token);
        }

        const serverHistory = sanitizeHistory(serverState.history);
        const serverMemory = sanitizeMemory(serverState.memory);
        const historyChanged = !arraysEqual(localHistory, serverHistory);
        const memoryChanged = !arraysEqual(localMemory, serverMemory);

        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(serverHistory));
        localStorage.setItem(LONG_MEMORY_KEY, JSON.stringify(serverMemory));

        if ((historyChanged || memoryChanged) && !stopped) {
          window.location.reload();
        }
      } catch (error) {
        console.error("CONVERSATION HISTORY SYNC ERROR:", error);
      } finally {
        syncing = false;
      }
    };

    void sync();
    const intervalId = window.setInterval(() => void sync(), SYNC_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void sync();
    };

    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", handleVisibility);

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void sync(), 100);
    });

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", handleVisibility);
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
