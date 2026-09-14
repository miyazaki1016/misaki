"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

const CHAT_HISTORY_KEY =
  "misaki-chat-history";

const LONG_MEMORY_KEY =
  "misaki-long-term-memory";

const MEMORY_BASELINE_PREFIX =
  "misaki-server-memory-baseline:";

const MEMORY_DIRTY_KEY =
  "misaki-memory-dirty";

const SYNC_INTERVAL_MS =
  5_000;

type ChatMessage = {
  role:
    | "user"
    | "misaki";

  text:
    string;
};

type ServerState = {
  exists?:
    boolean;

  history?:
    unknown;

  memory?:
    unknown;
};

type AuthContext = {
  accessToken:
    string;

  userId:
    string;
};

declare global {
  interface Window {
    __misakiMemorySyncApplying?:
      boolean;
  }
}

function readJsonArray(
  key:
    string
): unknown[] {
  try {
    const raw =
      localStorage
        .getItem(
          key
        );

    if (
      !raw
    ) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array
      .isArray(
        parsed
      )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function sanitizeHistory(
  value:
    unknown
): ChatMessage[] {
  if (
    !Array
      .isArray(
        value
      )
  ) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is ChatMessage =>
        Boolean(
          item &&
          typeof item ===
            "object" &&
          (
            (
              item as ChatMessage
            ).role ===
              "user" ||
            (
              item as ChatMessage
            ).role ===
              "misaki"
          ) &&
          typeof (
            item as ChatMessage
          ).text ===
            "string" &&
          (
            item as ChatMessage
          ).text
            .trim()
        )
    )
    .map(
      (
        item
      ) => ({
        role:
          item.role,

        text:
          item.text
            .trim()
            .slice(
              0,
              2000
            ),
      })
    )
    .slice(
      -60
    );
}

function sanitizeMemory(
  value:
    unknown
): string[] {
  if (
    !Array
      .isArray(
        value
      )
  ) {
    return [];
  }

  const seen =
    new Set<
      string
    >();

  const result:
    string[] = [];

  for (
    const item
    of value
  ) {
    if (
      typeof item !==
      "string"
    ) {
      continue;
    }

    const normalized =
      item
        .trim()
        .slice(
          0,
          500
        );

    if (
      !normalized ||
      seen
        .has(
          normalized
        )
    ) {
      continue;
    }

    seen.add(
      normalized
    );

    result.push(
      normalized
    );
  }

  return result
    .slice(
      -30
    );
}

function arraysEqual(
  a:
    unknown[],

  b:
    unknown[]
) {
  return JSON
    .stringify(
      a
    ) ===
    JSON
      .stringify(
        b
      );
}

function memoryBaselineKey(
  userId:
    string
) {
  return (
    `${MEMORY_BASELINE_PREFIX}${userId}`
  );
}

function readMemoryBaseline(
  userId:
    string
): string[] | null {
  const raw =
    localStorage
      .getItem(
        memoryBaselineKey(
          userId
        )
      );

  if (
    raw ===
    null
  ) {
    return null;
  }

  try {
    return sanitizeMemory(
      JSON.parse(
        raw
      )
    );
  } catch {
    return null;
  }
}

function writeMemoryBaseline(
  userId:
    string,

  memory:
    string[]
) {
  localStorage
    .setItem(
      memoryBaselineKey(
        userId
      ),

      JSON.stringify(
        memory
      )
    );
}

function readMemoryDirty() {
  return (
    localStorage
      .getItem(
        MEMORY_DIRTY_KEY
      ) ===
      "1"
  );
}

function clearMemoryDirty() {
  localStorage
    .removeItem(
      MEMORY_DIRTY_KEY
    );
}

function writeLocalMemory(
  memory:
    string[]
) {
  window
    .__misakiMemorySyncApplying =
    true;

  try {
    localStorage
      .setItem(
        LONG_MEMORY_KEY,

        JSON.stringify(
          memory
        )
      );
  } finally {
    window
      .__misakiMemorySyncApplying =
      false;
  }
}

async function getAuthContext():
Promise<AuthContext> {
  const {
    data,
    error,
  } =
    await supabase
      .auth
      .getSession();

  if (
    error
  ) {
    throw error;
  }

  if (
    data
      .session
      ?.access_token &&
    data
      .session
      ?.user
      ?.id
  ) {
    return {
      accessToken:
        data
          .session
          .access_token,

      userId:
        data
          .session
          .user
          .id,
    };
  }

  const {
    data:
      signInData,

    error:
      signInError,
  } =
    await supabase
      .auth
      .signInAnonymously();

  if (
    signInError
  ) {
    throw signInError;
  }

  const accessToken =
    signInData
      .session
      ?.access_token;

  const userId =
    signInData
      .user
      ?.id;

  if (
    !accessToken ||
    !userId
  ) {
    throw new Error(
      "Authentication session is unavailable."
    );
  }

  return {
    accessToken,
    userId,
  };
}

async function fetchServerState(
  token:
    string
): Promise<ServerState> {
  const response =
    await fetch(
      "/api/persona/history",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      }
    );

  const data =
    await response
      .json()
      .catch(
        () =>
          null
      );

  if (
    !response.ok
  ) {
    throw new Error(
      "Conversation state load failed."
    );
  }

  return (
    data ??
    {}
  );
}

export default function
ConversationHistorySync() {
  const hydrationWriteIgnoredRef =
    useRef(
      false
    );

  useLayoutEffect(
    () => {
      const originalSetItem =
        Storage
          .prototype
          .setItem;

      const originalRemoveItem =
        Storage
          .prototype
          .removeItem;

      Storage
        .prototype
        .setItem =
        function (
          key:
            string,

          value:
            string
        ) {
          if (
            this ===
              localStorage &&
            key ===
              LONG_MEMORY_KEY &&
            !window
              .__misakiMemorySyncApplying
          ) {
            const current =
              localStorage
                .getItem(
                  LONG_MEMORY_KEY
                );

            if (
              !hydrationWriteIgnoredRef
                .current &&
              current ===
                null
            ) {
              hydrationWriteIgnoredRef
                .current =
                true;
            } else if (
              current !==
              value
            ) {
              originalSetItem
                .call(
                  localStorage,
                  MEMORY_DIRTY_KEY,
                  "1"
                );
            }
          }

          return originalSetItem
            .call(
              this,
              key,
              value
            );
        };

      Storage
        .prototype
        .removeItem =
        function (
          key:
            string
        ) {
          if (
            this ===
              localStorage &&
            key ===
              LONG_MEMORY_KEY &&
            !window
              .__misakiMemorySyncApplying &&
            localStorage
              .getItem(
                LONG_MEMORY_KEY
              ) !==
              null
          ) {
            originalSetItem
              .call(
                localStorage,
                MEMORY_DIRTY_KEY,
                "1"
              );
          }

          return originalRemoveItem
            .call(
              this,
              key
            );
        };

      return () => {
        Storage
          .prototype
          .setItem =
          originalSetItem;

        Storage
          .prototype
          .removeItem =
          originalRemoveItem;
      };
    },
    []
  );

  useEffect(
    () => {
      let stopped =
        false;

      let syncing =
        false;

      const sync =
        async () => {
          if (
            stopped ||
            syncing
          ) {
            return;
          }

          syncing =
            true;

          try {
            const auth =
              await getAuthContext();

            const localHistory =
              sanitizeHistory(
                readJsonArray(
                  CHAT_HISTORY_KEY
                )
              );

            const localMemory =
              sanitizeMemory(
                readJsonArray(
                  LONG_MEMORY_KEY
                )
              );

            let serverState =
              await fetchServerState(
                auth
                  .accessToken
              );

            let serverHistory =
              sanitizeHistory(
                serverState
                  .history
              );

            let serverMemory =
              sanitizeMemory(
                serverState
                  .memory
              );

            /*
             * HISTORY の正本ルール
             *
             * 既にサーバー状態が存在する場合、
             * localStorageの古い履歴を
             * サーバーへマージしない。
             *
             * chat-proxy が
             * user + misaki の会話差分を
             * サーバーへ直接保存するため、
             * 各ブラウザは
             * serverHistory を表示用に
             * 受け取るだけにする。
             */
            if (
              !serverState
                .exists &&
              localHistory
                .length >
                0
            ) {
              const bootstrap =
                await fetch(
                  "/api/persona/history",
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",

                      Authorization:
                        `Bearer ${auth.accessToken}`,
                    },

                    body:
                      JSON.stringify(
                        {
                          history:
                            localHistory,

                          ...(
                            localMemory
                              .length >
                              0
                              ? {
                                  memory:
                                    localMemory,
                                }
                              : {}
                          ),
                        }
                      ),
                  }
                );

              if (
                !bootstrap.ok
              ) {
                throw new Error(
                  "Initial conversation sync failed."
                );
              }

              serverState =
                await fetchServerState(
                  auth
                    .accessToken
                );

              serverHistory =
                sanitizeHistory(
                  serverState
                    .history
                );

              serverMemory =
                sanitizeMemory(
                  serverState
                    .memory
                );
            }

            /*
             * MEMORY は現在の
             * dirty/baseline方式を維持。
             */
            const baseline =
              readMemoryBaseline(
                auth
                  .userId
              );

            const dirty =
              readMemoryDirty();

            const localChanged =
              baseline !==
                null &&
              !arraysEqual(
                localMemory,
                baseline
              );

            const serverChanged =
              baseline !==
                null &&
              !arraysEqual(
                serverMemory,
                baseline
              );

            if (
              serverState
                .exists &&
              dirty &&
              localChanged &&
              !serverChanged
            ) {
              const response =
                await fetch(
                  "/api/persona/history",
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",

                      Authorization:
                        `Bearer ${auth.accessToken}`,
                    },

                    body:
                      JSON.stringify(
                        {
                          history:
                            serverHistory
                              .length >
                              0
                              ? serverHistory
                              : localHistory,

                          memory:
                            localMemory,
                        }
                      ),
                  }
                );

              if (
                !response.ok
              ) {
                throw new Error(
                  "Memory sync failed."
                );
              }

              serverMemory =
                localMemory;

              clearMemoryDirty();
            }

            const historyChanged =
              !arraysEqual(
                localHistory,
                serverHistory
              );

            const memoryChanged =
              !arraysEqual(
                localMemory,
                serverMemory
              );

            /*
             * 重要:
             * ここでマージしない。
             *
             * 各ブラウザは
             * Supabaseの末尾60件を
             * そのまま表示する。
             */
            localStorage
              .setItem(
                CHAT_HISTORY_KEY,

                JSON.stringify(
                  serverHistory
                )
              );

            writeLocalMemory(
              serverMemory
            );

            writeMemoryBaseline(
              auth
                .userId,

              serverMemory
            );

            if (
              !dirty ||
              !localChanged ||
              serverChanged
            ) {
              clearMemoryDirty();
            }

            if (
              (
                historyChanged ||
                memoryChanged
              ) &&
              !stopped
            ) {
              window
                .location
                .reload();
            }
          } catch (
            error
          ) {
            console.error(
              "CONVERSATION HISTORY SYNC ERROR:",
              error
            );
          } finally {
            syncing =
              false;
          }
        };

      void sync();

      const intervalId =
        window
          .setInterval(
            () => {
              void sync();
            },
            SYNC_INTERVAL_MS
          );

      const handleVisibility =
        () => {
          if (
            document
              .visibilityState ===
              "visible"
          ) {
            void sync();
          }
        };

      window
        .addEventListener(
          "focus",
          sync
        );

      document
        .addEventListener(
          "visibilitychange",
          handleVisibility
        );

      const {
        data:
          authListener,
      } =
        supabase
          .auth
          .onAuthStateChange(
            () => {
              window
                .setTimeout(
                  () => {
                    void sync();
                  },
                  100
                );
            }
          );

      return () => {
        stopped =
          true;

        window
          .clearInterval(
            intervalId
          );

        window
          .removeEventListener(
            "focus",
            sync
          );

        document
          .removeEventListener(
            "visibilitychange",
            handleVisibility
          );

        authListener
          .subscription
          .unsubscribe();
      };
    },
    []
  );

  return null;
}
