"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

const CHAT_HISTORY_KEY = "misaki-chat-history";
const LONG_MEMORY_KEY = "misaki-long-term-memory";
const RESTORE_GUARD_KEY = "misaki-server-history-restored";
const SYNC_INTERVAL_MS = 10_000;

type ChatMessage = {
  role: "user" | "misaki";
  text: string;
};

type ServerState = {
  exists?: boolean;
  history?: unknown;
  memory?: unknown;
  messageCount?: number;
  userMessageCount?: number;
  memoryCount?: number;
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
    }))
    .slice(-60);
}

function sanitizeMemory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim().slice(0, 500))
    .slice(-30);
}

function fingerprint(history: ChatMessage[], memory: string[]) {
  const recent = history
    .slice(-20)
    .map((item) => `${item.role}:${item.text}`)
    .join("\n");

  return `${history.length}|${memory.length}|${recent}`;
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (data.session?.access_token) {
    return data.session.access_token;
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInAnonymously();

  if (signInError) throw signInError;

  const token = signInData.session?.access_token;
  if (!token) {
    throw new Error("Authentication session is unavailable.");
  }

  return token;
}

async function fetchServerState(token: string): Promise<ServerState> {
  const response = await fetch("/api/persona/history", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | ServerState
    | null;

  if (!response.ok) {
    throw new Error("Conversation state load failed.");
  }

  return data ?? {};
}

export default function ConversationHistorySync() {
  const lastFingerprintRef = useRef("");

  useEffect(() => {
    let stopped = false;
    let syncing = false;

    const restoreFromServerIfNeeded = async () => {
      const localHistory = sanitizeHistory(
        readJsonArray(CHAT_HISTORY_KEY)
      );

      if (localHistory.length > 0) {
        sessionStorage.removeItem(RESTORE_GUARD_KEY);
        return false;
      }

      if (sessionStorage.getItem(RESTORE_GUARD_KEY) === "1") {
        return false;
      }

      const token = await getAccessToken();
      const serverState = await fetchServerState(token);
      const serverHistory = sanitizeHistory(serverState.history);
      const serverMemory = sanitizeMemory(serverState.memory);

      if (serverHistory.length === 0) {
        return false;
      }

      localStorage.setItem(
        CHAT_HISTORY_KEY,
        JSON.stringify(serverHistory)
      );

      if (serverMemory.length > 0) {
        localStorage.setItem(
          LONG_MEMORY_KEY,
          JSON.stringify(serverMemory)
        );
      }

      sessionStorage.setItem(RESTORE_GUARD_KEY, "1");

      // ChatPage reads localStorage on mount.
      // Reload once so a newly signed-in device immediately displays
      // the restored server-side conversation.
      window.location.reload();
      return true;
    };

    const sync = async () => {
      if (stopped || syncing) return;

      syncing = true;

      try {
        const restored = await restoreFromServerIfNeeded();
        if (restored || stopped) return;

        const history = sanitizeHistory(
          readJsonArray(CHAT_HISTORY_KEY)
        );
        const memory = sanitizeMemory(
          readJsonArray(LONG_MEMORY_KEY)
        );

        if (history.length === 0) return;

        const nextFingerprint = fingerprint(history, memory);
        if (nextFingerprint === lastFingerprintRef.current) return;

        const token = await getAccessToken();

        const response = await fetch("/api/persona/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ history, memory }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.error || "Conversation history sync failed."
          );
        }

        lastFingerprintRef.current = nextFingerprint;
      } catch (error) {
        console.error("CONVERSATION HISTORY SYNC ERROR:", error);
      } finally {
        syncing = false;
      }
    };

    void sync();

    const intervalId = window.setInterval(() => {
      void sync();
    }, SYNC_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void sync();
      }
    };

    window.addEventListener("focus", sync);
    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    const { data: authListener } =
      supabase.auth.onAuthStateChange(() => {
        lastFingerprintRef.current = "";
        sessionStorage.removeItem(RESTORE_GUARD_KEY);
        window.setTimeout(() => {
          void sync();
        }, 50);
      });

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sync);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
