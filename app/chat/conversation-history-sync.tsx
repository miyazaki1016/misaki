"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

const CHAT_HISTORY_KEY = "misaki-chat-history";
const LONG_MEMORY_KEY = "misaki-long-term-memory";
const RESTORE_GUARD_KEY = "misaki-server-history-restored-user";
const MEMORY_BASELINE_PREFIX = "misaki-server-memory-baseline:";
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

type AuthContext = {
  accessToken: string;
  userId: string;
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

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;
    const normalized = item.trim().slice(0, 500);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result.slice(-30);
}

function mergeHistory(
  serverHistory: ChatMessage[],
  localHistory: ChatMessage[]
): ChatMessage[] {
  const merged: ChatMessage[] = [];
  const seen = new Set<string>();

  for (const item of [...serverHistory, ...localHistory]) {
    const key = `${item.role}\u0000${item.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.slice(-60);
}

function arraysEqual(a: unknown[], b: unknown[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function memoryBaselineKey(userId: string) {
  return `${MEMORY_BASELINE_PREFIX}${userId}`;
}

function readMemoryBaseline(userId: string): string[] | null {
  const key = memoryBaselineKey(userId);
  const raw = localStorage.getItem(key);
  if (raw === null) return null;

  try {
    return sanitizeMemory(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeMemoryBaseline(userId: string, memory: string[]) {
  localStorage.setItem(
    memoryBaselineKey(userId),
    JSON.stringify(memory)
  );
}

function writeLocalMemory(memory: string[]) {
  if (memory.length > 0) {
    localStorage.setItem(LONG_MEMORY_KEY, JSON.stringify(memory));
  } else {
    localStorage.removeItem(LONG_MEMORY_KEY);
  }
}

function fingerprint(
  history: ChatMessage[],
  memory: string[],
  shouldPushMemory: boolean
) {
  const recent = history
    .slice(-20)
    .map((item) => `${item.role}:${item.text}`)
    .join("\n");

  return `${history.length}|${recent}|${shouldPushMemory ? "M" : "H"}|${memory.join("\n")}`;
}

async function getAuthContext(): Promise<AuthContext> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (data.session?.access_token && data.session?.user?.id) {
    return {
      accessToken: data.session.access_token,
      userId: data.session.user.id,
    };
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInAnonymously();

  if (signInError) throw signInError;

  const accessToken = signInData.session?.access_token;
  const userId = signInData.user?.id;

  if (!accessToken || !userId) {
    throw new Error("Authentication session is unavailable.");
  }

  return { accessToken, userId };
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

    const prepareSyncState = async () => {
      const auth = await getAuthContext();

      const localHistory = sanitizeHistory(
        readJsonArray(CHAT_HISTORY_KEY)
      );
      const localMemory = sanitizeMemory(
        readJsonArray(LONG_MEMORY_KEY)
      );

      const serverState = await fetchServerState(auth.accessToken);
      const serverHistory = sanitizeHistory(serverState.history);
      const serverMemory = sanitizeMemory(serverState.memory);
      const mergedHistory = mergeHistory(serverHistory, localHistory);

      const baseline = readMemoryBaseline(auth.userId);
      let canonicalMemory = serverMemory;
      let shouldPushMemory = false;

      if (!serverState.exists) {
        // First save for a new account: local memory becomes the initial canonical set.
        canonicalMemory = localMemory;
        shouldPushMemory = true;
      } else if (baseline === null) {
        // First time this browser sees this account: server wins.
        // This prevents stale browser storage from resurrecting old memories.
        canonicalMemory = serverMemory;
      } else {
        const localChanged = !arraysEqual(localMemory, baseline);
        const serverChanged = !arraysEqual(serverMemory, baseline);

        if (localChanged && !serverChanged) {
          // The active chat changed memory locally (add/update/delete/forget).
          // Send the complete canonical list to the server.
          canonicalMemory = localMemory;
          shouldPushMemory = true;
        } else {
          // Server changed elsewhere, or both sides changed concurrently.
          // Prefer server so a stale browser cannot re-add deleted memory.
          canonicalMemory = serverMemory;
        }
      }

      const historyChanged = !arraysEqual(localHistory, mergedHistory);
      const memoryChanged = !arraysEqual(localMemory, canonicalMemory);

      if (mergedHistory.length > 0) {
        localStorage.setItem(
          CHAT_HISTORY_KEY,
          JSON.stringify(mergedHistory)
        );
      }

      writeLocalMemory(canonicalMemory);

      const restoredUserId =
        sessionStorage.getItem(RESTORE_GUARD_KEY);

      if (
        (historyChanged || memoryChanged) &&
        restoredUserId !== auth.userId
      ) {
        sessionStorage.setItem(RESTORE_GUARD_KEY, auth.userId);
        writeMemoryBaseline(auth.userId, canonicalMemory);
        window.location.reload();

        return {
          reloaded: true,
          auth,
          history: mergedHistory,
          memory: canonicalMemory,
          shouldPushMemory: false,
        };
      }

      sessionStorage.setItem(RESTORE_GUARD_KEY, auth.userId);

      return {
        reloaded: false,
        auth,
        history: mergedHistory,
        memory: canonicalMemory,
        shouldPushMemory,
      };
    };

    const sync = async () => {
      if (stopped || syncing) return;
      syncing = true;

      try {
        const state = await prepareSyncState();

        if (state.reloaded || stopped) return;
        if (state.history.length === 0) return;

        const nextFingerprint = fingerprint(
          state.history,
          state.memory,
          state.shouldPushMemory
        );

        if (nextFingerprint === lastFingerprintRef.current) return;

        const body: {
          history: ChatMessage[];
          memory?: string[];
        } = {
          history: state.history,
        };

        if (state.shouldPushMemory) {
          body.memory = state.memory;
        }

        const response = await fetch("/api/persona/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.auth.accessToken}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.error || "Conversation history sync failed."
          );
        }

        // After a successful canonical memory write (or history-only sync),
        // this browser's baseline is exactly the memory it now sees.
        writeMemoryBaseline(state.auth.userId, state.memory);
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
    document.addEventListener("visibilitychange", handleVisibility);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        lastFingerprintRef.current = "";

        const nextUserId = session?.user?.id ?? "";
        const restoredUserId =
          sessionStorage.getItem(RESTORE_GUARD_KEY);

        if (!nextUserId || restoredUserId !== nextUserId) {
          sessionStorage.removeItem(RESTORE_GUARD_KEY);
        }

        window.setTimeout(() => {
          void sync();
        }, 100);
      }
    );

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
