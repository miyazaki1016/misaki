"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

const CHAT_HISTORY_KEY = "misaki-chat-history";
const LONG_MEMORY_KEY = "misaki-long-term-memory";
const RESTORE_GUARD_KEY = "misaki-server-history-restored-user";
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

  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim().slice(0, 500))
    .slice(-30);
}

function mergeHistory(
  serverHistory: ChatMessage[],
  localHistory: ChatMessage[]
): ChatMessage[] {
  const merged: ChatMessage[] = [];
  const seen = new Set<string>();

  // まず本アカウント側の履歴を土台にし、その後に端末側の履歴を足す。
  for (const item of [...serverHistory, ...localHistory]) {
    const key = `${item.role}\u0000${item.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.slice(-60);
}

function mergeMemory(
  serverMemory: string[],
  localMemory: string[]
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  // サーバー側の長期記憶を必ず優先して残す。
  for (const item of [...serverMemory, ...localMemory]) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    merged.push(normalized);
  }

  return merged.slice(-30);
}

function fingerprint(history: ChatMessage[], memory: string[]) {
  const recent = history
    .slice(-20)
    .map((item) => `${item.role}:${item.text}`)
    .join("\n");

  return `${history.length}|${memory.length}|${recent}|${memory.join("\n")}`;
}

function arraysEqual(a: unknown[], b: unknown[]) {
  return JSON.stringify(a) === JSON.stringify(b);
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

async function fetchServerState(
  token: string
): Promise<ServerState> {
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

    const restoreAndMergeFromServer = async () => {
      const auth = await getAuthContext();

      const localHistory = sanitizeHistory(
        readJsonArray(CHAT_HISTORY_KEY)
      );
      const localMemory = sanitizeMemory(
        readJsonArray(LONG_MEMORY_KEY)
      );

      const serverState = await fetchServerState(
        auth.accessToken
      );

      const serverHistory = sanitizeHistory(
        serverState.history
      );
      const serverMemory = sanitizeMemory(
        serverState.memory
      );

      const mergedHistory = mergeHistory(
        serverHistory,
        localHistory
      );
      const mergedMemory = mergeMemory(
        serverMemory,
        localMemory
      );

      const historyChanged = !arraysEqual(
        localHistory,
        mergedHistory
      );
      const memoryChanged = !arraysEqual(
        localMemory,
        mergedMemory
      );

      if (mergedHistory.length > 0) {
        localStorage.setItem(
          CHAT_HISTORY_KEY,
          JSON.stringify(mergedHistory)
        );
      }

      // ここが重要:
      // 端末側memoryが空でも、サーバー側に記憶があれば必ず復元する。
      if (mergedMemory.length > 0) {
        localStorage.setItem(
          LONG_MEMORY_KEY,
          JSON.stringify(mergedMemory)
        );
      } else {
        localStorage.removeItem(LONG_MEMORY_KEY);
      }

      const restoredUserId =
        sessionStorage.getItem(RESTORE_GUARD_KEY);

      // ユーザーが変わった直後、またはサーバーから新しい内容を復元した時だけ
      // 1回リロードして ChatPage に確実に読み直させる。
      if (
        (historyChanged || memoryChanged) &&
        restoredUserId !== auth.userId
      ) {
        sessionStorage.setItem(
          RESTORE_GUARD_KEY,
          auth.userId
        );

        window.location.reload();
        return {
          reloaded: true,
          auth,
          history: mergedHistory,
          memory: mergedMemory,
        };
      }

      sessionStorage.setItem(
        RESTORE_GUARD_KEY,
        auth.userId
      );

      return {
        reloaded: false,
        auth,
        history: mergedHistory,
        memory: mergedMemory,
      };
    };

    const sync = async () => {
      if (stopped || syncing) return;

      syncing = true;

      try {
        const restored =
          await restoreAndMergeFromServer();

        if (restored.reloaded || stopped) {
          return;
        }

        const history = restored.history;
        const memory = restored.memory;

        if (history.length === 0) return;

        const nextFingerprint = fingerprint(
          history,
          memory
        );

        if (
          nextFingerprint ===
          lastFingerprintRef.current
        ) {
          return;
        }

        const response = await fetch(
          "/api/persona/history",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${restored.auth.accessToken}`,
            },
            body: JSON.stringify({
              history,
              memory,
            }),
          }
        );

        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => null);

          throw new Error(
            data?.error ||
              "Conversation history sync failed."
          );
        }

        lastFingerprintRef.current =
          nextFingerprint;
      } catch (error) {
        console.error(
          "CONVERSATION HISTORY SYNC ERROR:",
          error
        );
      } finally {
        syncing = false;
      }
    };

    void sync();

    const intervalId = window.setInterval(() => {
      void sync();
    }, SYNC_INTERVAL_MS);

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible"
      ) {
        void sync();
      }
    };

    window.addEventListener("focus", sync);
    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    const { data: authListener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          lastFingerprintRef.current = "";

          // ログイン先のユーザーが変わったら、
          // 次のsyncで必ずサーバー状態と統合し直す。
          const nextUserId =
            session?.user?.id ?? "";

          const restoredUserId =
            sessionStorage.getItem(
              RESTORE_GUARD_KEY
            );

          if (
            !nextUserId ||
            restoredUserId !== nextUserId
          ) {
            sessionStorage.removeItem(
              RESTORE_GUARD_KEY
            );
          }

          window.setTimeout(() => {
            void sync();
          }, 100);
        }
      );

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      window.removeEventListener(
        "focus",
        sync
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
