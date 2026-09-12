"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

import {
  registerPushSubscription,
  sendTestPushNotification,
} from "../../lib/push-notifications";

type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

type DailyUsage = {
  date: string;
  count: number;
};

type MisakiTodayMemory = {
  date: string;
  items: string[];
};

type Plan =
  | "free"
  | "premium";

type UsageRpcResult = {
  message_count?: number;
  remaining?: number;
  is_premium?: boolean;
};

type ApiUsage = {
  messageCount?: number;
  remaining?: number;
  isPremium?: boolean;
};

const STORAGE_KEY =
  "misaki-chat-history";

const MEMORY_KEY =
  "misaki-long-term-memory";

const PROACTIVE_KEY =
  "misaki-proactive-state";

const RELATIONSHIP_KEY =
  "misaki-relationship-points";

const MISAKI_TODAY_MEMORY_KEY =
  "misaki-today-memory";

const MAX_MESSAGES = 60;

// 無料版は1日20往復まで
const FREE_DAILY_LIMIT = 20;

// 5分ごとに、自発メッセージの予定時刻になったか確認
const PROACTIVE_CHECK_MS =
  5 * 60 * 1000;

// 自発メッセージ同士は最低45分空ける
const PROACTIVE_COOLDOWN_MS =
  45 * 60 * 1000;

// 次の自発メッセージは45分〜3時間30分の間でランダム
const PROACTIVE_MIN_DELAY_MS =
  45 * 60 * 1000;

const PROACTIVE_MAX_DELAY_MS =
  3.5 * 60 * 60 * 1000;

// 1日最大4回
const MAX_PROACTIVE_PER_DAY =
  4;

const INITIAL_MESSAGES:
  ChatMessage[] = [];

function getRandomProactiveDelayMs() {
  return Math.floor(
    PROACTIVE_MIN_DELAY_MS +
      Math.random() *
        (
          PROACTIVE_MAX_DELAY_MS -
          PROACTIVE_MIN_DELAY_MS
        )
  );
}

function getJapanDateKey() {
  return new Date()
    .toLocaleDateString(
      "ja-JP",
      {
        timeZone:
          "Asia/Tokyo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );
}

function getJapanCurrentTime() {
  return new Date()
    .toLocaleString(
      "ja-JP",
      {
        timeZone:
          "Asia/Tokyo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        weekday:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,
      }
    );
}

function createEmptyTodayMemory():
  MisakiTodayMemory {
  return {
    date:
      getJapanDateKey(),

    items: [],
  };
}

function isPremiumActive(
  plan:
    | string
    | null
    | undefined,

  premiumUntil:
    | string
    | null
    | undefined
) {
  if (
    plan !==
    "premium"
  ) {
    return false;
  }

  if (
    !premiumUntil
  ) {
    return true;
  }

  const expiresAt =
    new Date(
      premiumUntil
    ).getTime();

  if (
    !Number.isFinite(
      expiresAt
    )
  ) {
    return false;
  }

  return (
    expiresAt >
    Date.now()
  );
}

function getFirstRpcRow<T>(
  value: unknown
): T | null {
  if (
    Array.isArray(
      value
    ) &&
    value.length >
      0
  ) {
    return value[0] as T;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return value as T;
  }

  return null;
}

export default function ChatPage() {
  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    messages,
    setMessages,
  ] =
    useState<
      ChatMessage[]
    >(
      INITIAL_MESSAGES
    );

  const [
    memory,
    setMemory,
  ] =
    useState<
      string[]
    >([]);

  const [
    misakiTodayMemory,
    setMisakiTodayMemory,
  ] =
    useState<
      MisakiTodayMemory
    >(
      createEmptyTodayMemory()
    );

  const [
    relationshipPoints,
    setRelationshipPoints,
  ] =
    useState(0);

  const [
    dailyUsage,
    setDailyUsage,
  ] =
    useState<
      DailyUsage
    >({
      date:
        getJapanDateKey(),

      count:
        0,
    });

  const [
    plan,
    setPlan,
  ] =
    useState<
      Plan
    >(
      "free"
    );

  const [
    accountLoaded,
    setAccountLoaded,
  ] =
    useState(
      false
    );

  const [
    showPremium,
    setShowPremium,
  ] =
    useState(
      false
    );

  const [
    showMemory,
    setShowMemory,
  ] =
    useState(
      false
    );

  const [
    showMenu,
    setShowMenu,
  ] =
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    loaded,
    setLoaded,
  ] =
    useState(
      false
    );

  const [
    notificationPermission,
    setNotificationPermission,
  ] =
    useState<
      | "default"
      | "granted"
      | "denied"
      | "unsupported"
    >(
      "default"
    );

  const isPremium =
    plan ===
    "premium";

  const today =
    getJapanDateKey();

  const usageCountToday =
    dailyUsage.date ===
    today
      ? dailyUsage.count
      : 0;

  const freeRemaining =
    Math.max(
      0,
      FREE_DAILY_LIMIT -
        usageCountToday
    );

  const freeLimitReached =
    accountLoaded &&
    !isPremium &&
    usageCountToday >=
      FREE_DAILY_LIMIT;

  useEffect(
    () => {
      let active =
        true;

      async function loadEntitlement(
        userId:
          string
      ) {
        for (
          let attempt =
            0;
          attempt <
            5;
          attempt +=
            1
        ) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "user_entitlements"
              )
              .select(
                "plan,premium_until"
              )
              .eq(
                "user_id",
                userId
              )
              .maybeSingle();

          if (
            error
          ) {
            throw error;
          }

          if (
            data
          ) {
            return isPremiumActive(
              data.plan,
              data.premium_until
            );
          }

          await new Promise(
            (
              resolve
            ) =>
              window.setTimeout(
                resolve,
                350
              )
          );
        }

        return false;
      }

      async function loadDailyUsage() {
        const {
          data,
          error,
        } =
          await supabase.rpc(
            "get_daily_message_usage"
          );

        if (
          error
        ) {
          throw error;
        }

        const usage =
          getFirstRpcRow<
            UsageRpcResult
          >(
            data
          );

        return {
          count:
            typeof usage
              ?.message_count ===
              "number"
              ? Math.max(
                  0,
                  Math.floor(
                    usage
                      .message_count
                  )
                )
              : 0,

          isPremium:
            usage
              ?.is_premium ===
            true,
        };
      }

      async function initializeAccount() {
        try {
          const {
            data:
              sessionData,
            error:
              sessionError,
          } =
            await supabase
              .auth
              .getSession();

          if (
            sessionError
          ) {
            throw sessionError;
          }

          let user =
            sessionData
              .session
              ?.user ??
            null;

          if (
            !user
          ) {
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

            user =
              signInData
                .user ??
              null;
          }

          if (
            !user
          ) {
            throw new Error(
              "Supabase user was not created."
            );
          }

          const [
            entitlementPremium,
            usage,
          ] =
            await Promise
              .all([
                loadEntitlement(
                  user.id
                ),

                loadDailyUsage(),
              ]);

          if (
            !active
          ) {
            return;
          }

          const premium =
            entitlementPremium ||
            usage
              .isPremium;

          setPlan(
            premium
              ? "premium"
              : "free"
          );

          setDailyUsage({
            date:
              getJapanDateKey(),

            count:
              usage.count,
          });
        } catch (
          error
        ) {
          console.error(
            "Supabase account initialization failed:",
            error
          );

          if (
            active
          ) {
            setPlan(
              "free"
            );

            setDailyUsage({
              date:
                getJapanDateKey(),

              count:
                0,
            });
          }
        } finally {
          if (
            active
          ) {
            setAccountLoaded(
              true
            );
          }
        }
      }

      initializeAccount();

      return () => {
        active =
          false;
      };
    },
    []
  );

  useEffect(
    () => {
      if (
        !accountLoaded
      ) {
        return;
      }

      if (
        isPremium
      ) {
        setShowPremium(
          false
        );

        return;
      }

      if (
        usageCountToday >=
        FREE_DAILY_LIMIT
      ) {
        setShowPremium(
          true
        );
      }
    },
    [
      accountLoaded,
      isPremium,
      usageCountToday,
    ]
  );

  useEffect(
    () => {
      if (
        "serviceWorker" in
        navigator
      ) {
        navigator
          .serviceWorker
          .register(
            "/sw.js"
          )
          .then(
            (
              registration
            ) => {
              console.log(
                "Service Worker registered:",
                registration
              );
            }
          )
          .catch(
            (
              error
            ) => {
              console.error(
                "Service Worker registration failed:",
                error
              );
            }
          );
      }
    },
    []
  );

  useEffect(
    () => {
      if (
        !(
          "Notification" in
          window
        )
      ) {
        setNotificationPermission(
          "unsupported"
        );

        return;
      }

      setNotificationPermission(
        Notification
          .permission
      );
    },
    []
  );

  useEffect(
    () => {
      try {
        const savedMessages =
          localStorage
            .getItem(
              STORAGE_KEY
            );

        const savedMemory =
          localStorage
            .getItem(
              MEMORY_KEY
            );

        const savedRelationship =
          localStorage
            .getItem(
              RELATIONSHIP_KEY
            );

        const savedTodayMemory =
          localStorage
            .getItem(
              MISAKI_TODAY_MEMORY_KEY
            );

        let parsedMessages:
          | ChatMessage[]
          | null =
          null;

        if (
          savedMessages
        ) {
          const parsed =
            JSON.parse(
              savedMessages
            );

          if (
            Array.isArray(
              parsed
            )
          ) {
            parsedMessages =
              parsed
                .filter(
                  (
                    item
                  ) =>
                    item &&
                    (
                      item
                        .role ===
                        "user" ||
                      item
                        .role ===
                        "misaki"
                    ) &&
                    typeof item
                      .text ===
                      "string"
                )
                .slice(
                  -MAX_MESSAGES
                );

            setMessages(
              parsedMessages
            );
          }
        }

        if (
          savedMemory
        ) {
          const parsedMemory =
            JSON.parse(
              savedMemory
            );

          if (
            Array.isArray(
              parsedMemory
            )
          ) {
            setMemory(
              parsedMemory
                .filter(
                  (
                    item
                  ) =>
                    typeof item ===
                    "string"
                )
            );
          }
        }

        if (
          savedRelationship
        ) {
          const parsedPoints =
            Number(
              savedRelationship
            );

          if (
            Number
              .isFinite(
                parsedPoints
              ) &&
            parsedPoints >=
              0
          ) {
            setRelationshipPoints(
              Math.floor(
                parsedPoints
              )
            );
          }
        } else if (
          parsedMessages
        ) {
          const previousUserMessages =
            parsedMessages
              .filter(
                (
                  item
                ) =>
                  item.role ===
                  "user"
              )
              .length;

          setRelationshipPoints(
            previousUserMessages
          );
        }

        const currentDate =
          getJapanDateKey();

        if (
          savedTodayMemory
        ) {
          const parsedTodayMemory =
            JSON.parse(
              savedTodayMemory
            );

          if (
            parsedTodayMemory &&
            parsedTodayMemory
              .date ===
              currentDate &&
            Array.isArray(
              parsedTodayMemory
                .items
            )
          ) {
            setMisakiTodayMemory({
              date:
                currentDate,

              items:
                parsedTodayMemory
                  .items
                  .filter(
                    (
                      item:
                        unknown
                    ) =>
                      typeof item ===
                        "string" &&
                      item
                        .trim()
                        .length >
                        0
                  )
                  .map(
                    (
                      item:
                        string
                    ) =>
                      item
                        .trim()
                  )
                  .slice(
                    -12
                  ),
            });
          } else {
            setMisakiTodayMemory({
              date:
                currentDate,

              items:
                [],
            });
          }
        } else {
          setMisakiTodayMemory({
            date:
              currentDate,

            items:
              [],
          });
        }
      } catch (
        error
      ) {
        console.error(
          "Failed to load saved data:",
          error
        );

        const currentDate =
          getJapanDateKey();

        setMisakiTodayMemory({
          date:
            currentDate,

          items:
            [],
        });
      } finally {
        setLoaded(
          true
        );
      }
    },
    []
  );

  useEffect(
    () => {
      if (
        !loaded
      ) {
        return;
      }

      try {
        const limitedMessages =
          messages
            .slice(
              -MAX_MESSAGES
            );

        localStorage
          .setItem(
            STORAGE_KEY,

            JSON.stringify(
              limitedMessages
            )
          );
      } catch (
        error
      ) {
        console.error(
          "Failed to save chat history:",
          error
        );
      }
    },
    [
      messages,
      loaded,
    ]
  );

  useEffect(
    () => {
      if (
        !loaded
      ) {
        return;
      }

      try {
        localStorage
          .setItem(
            MEMORY_KEY,

            JSON.stringify(
              memory
            )
          );
      } catch (
        error
      ) {
        console.error(
          "Failed to save memory:",
          error
        );
      }
    },
    [
      memory,
      loaded,
    ]
  );

  useEffect(
    () => {
      if (
        !loaded
      ) {
        return;
      }

      try {
        const currentDate =
          getJapanDateKey();

        const safeTodayMemory =
          misakiTodayMemory
            .date ===
            currentDate
            ? misakiTodayMemory
            : {
                date:
                  currentDate,

                items:
                  [],
              };

        localStorage
          .setItem(
            MISAKI_TODAY_MEMORY_KEY,

            JSON.stringify(
              safeTodayMemory
            )
          );

        if (
          misakiTodayMemory
            .date !==
          currentDate
        ) {
          setMisakiTodayMemory(
            safeTodayMemory
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Failed to save Misaki today memory:",
          error
        );
      }
    },
    [
      misakiTodayMemory,
      loaded,
    ]
  );

  useEffect(
    () => {
      if (
        !loaded
      ) {
        return;
      }

      try {
        localStorage
          .setItem(
            RELATIONSHIP_KEY,

            String(
              relationshipPoints
            )
          );
      } catch (
        error
      ) {
        console.error(
          "Failed to save relationship points:",
          error
        );
      }
    },
    [
      relationshipPoints,
      loaded,
    ]
  );

  async function getAccessToken() {
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

    const accessToken =
      data
        .session
        ?.access_token;

    if (
      !accessToken
    ) {
      throw new Error(
        "ログイン情報を確認できませんでした。ページを再読み込みしてね。"
      );
    }

    return accessToken;
  }

  function applyApiUsage(
    value:
      unknown
  ) {
    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return;
    }

    const usage =
      value as
        ApiUsage;

    if (
      usage
        .isPremium ===
      true
    ) {
      setPlan(
        "premium"
      );
    }

    if (
      typeof usage
        .messageCount ===
        "number" &&
      Number.isFinite(
        usage
          .messageCount
      )
    ) {
      setDailyUsage({
        date:
          getJapanDateKey(),

        count:
          Math.max(
            0,

            Math.floor(
              usage
                .messageCount
            )
          ),
      });
    }
  }

  async function requestNotificationPermission() {
    if (
      !(
        "Notification" in
        window
      )
    ) {
      alert(
        "この環境では通知機能を利用できません。"
      );

      setNotificationPermission(
        "unsupported"
      );

      return;
    }

    if (
      !(
        "serviceWorker" in
        navigator
      )
    ) {
      alert(
        "この環境では通知機能を利用できません。"
      );

      setNotificationPermission(
        "unsupported"
      );

      return;
    }

    if (
      !(
        "PushManager" in
        window
      )
    ) {
      alert(
        "このブラウザはPush通知に対応していません。"
      );

      setNotificationPermission(
        "unsupported"
      );

      return;
    }

    try {
      await navigator
        .serviceWorker
        .ready;

      const permission =
        await Notification
          .requestPermission();

      setNotificationPermission(
        permission
      );

      if (
        permission ===
        "denied"
      ) {
        alert(
          "通知が許可されませんでした。端末の設定から美咲の通知を許可してください。"
        );

        return;
      }

      if (
        permission !==
        "granted"
      ) {
        return;
      }

      await registerPushSubscription();

      const accessToken =
        await getAccessToken();

      try {
        await sendTestPushNotification(
          accessToken
        );

        alert(
          "通知をONにしました。今、美咲からテスト通知を送ったよ。"
        );
      } catch (
        testError
      ) {
        console.error(
          "Test push notification failed:",
          testError
        );

        alert(
          "通知端末の登録はできました。テスト通知だけ送信できませんでした。"
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Push notification setup error:",
        error
      );

      const errorMessage =
        error instanceof
        Error
          ? error.message
          : "通知の設定に失敗しました。";

      alert(
        errorMessage
      );
    }
  }

  function resetChat() {
    const confirmed =
      window
        .confirm(
          "美咲との会話履歴をリセットしますか？"
        );

    if (
      !confirmed
    ) {
      return;
    }

    localStorage
      .removeItem(
        STORAGE_KEY
      );

    setMessages(
      []
    );

    setMessage(
      ""
    );

    setShowMenu(
      false
    );
  }

  function deleteMemory(
    index:
      number
  ) {
    const confirmed =
      window
        .confirm(
          "この記憶を削除しますか？"
        );

    if (
      !confirmed
    ) {
      return;
    }

    setMemory(
      (
        prev
      ) =>
        prev
          .filter(
            (
              _,
              i
            ) =>
              i !==
              index
          )
    );
  }

  function resetMemory() {
    if (
      memory.length ===
      0
    ) {
      return;
    }

    const confirmed =
      window
        .confirm(
          "美咲の長期記憶をすべて削除しますか？\n会話履歴は残ります。"
        );

    if (
      !confirmed
    ) {
      return;
    }

    localStorage
      .removeItem(
        MEMORY_KEY
      );

    setMemory(
      []
    );
  }

  function openPremium() {
    if (
      isPremium
    ) {
      return;
    }

    setShowPremium(
      true
    );
  }

  function startPremium() {
    alert(
      "プレミアム決済は次の工程で接続します。今はまだ料金は発生しません。"
    );
  }

  function applyTodayMemory(
    value:
      unknown
  ) {
    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return;
    }

    const data =
      value as {
        date?:
          unknown;

        items?:
          unknown;
      };

    const currentDate =
      getJapanDateKey();

    if (
      data.date !==
        currentDate ||
      !Array.isArray(
        data.items
      )
    ) {
      return;
    }

    const items =
      data
        .items
        .filter(
          (
            item:
              unknown
          ) =>
            typeof item ===
              "string" &&
            item
              .trim()
              .length >
              0
        )
        .map(
          (
            item
          ) =>
            (
              item as string
            )
              .trim()
        )
        .slice(
          -12
        );

    setMisakiTodayMemory({
      date:
        currentDate,

      items:
        Array.from(
          new Set(
            items
          )
        ),
    });
  }

  async function sendMessage() {
    const text =
      message
        .trim();

    if (
      !text ||
      loading ||
      !accountLoaded
    ) {
      return;
    }

    const currentDate =
      getJapanDateKey();

    if (
      !isPremium &&
      usageCountToday >=
        FREE_DAILY_LIMIT
    ) {
      setShowPremium(
        true
      );

      return;
    }

    setLoading(
      true
    );

    try {
      const accessToken =
        await getAccessToken();

      const userMessage:
        ChatMessage = {
          role:
            "user",

          text,
        };

      const newMessages =
        [
          ...messages,
          userMessage,
        ]
          .slice(
            -MAX_MESSAGES
          );

      setMessages(
        newMessages
      );

      setMessage(
        ""
      );

      const nextRelationshipPoints =
        relationshipPoints +
        1;

      const currentTime =
        getJapanCurrentTime();

      const todayMemoryForRequest =
        misakiTodayMemory
          .date ===
          currentDate
          ? misakiTodayMemory
          : {
              date:
                currentDate,

              items:
                [],
            };

      const res =
        await fetch(
          "/api/chat",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                message:
                  text,

                history:
                  messages
                    .slice(
                      -MAX_MESSAGES
                    ),

                memory,

                misakiTodayMemory:
                  todayMemoryForRequest,

                currentTime,

                relationshipPoints:
                  nextRelationshipPoints,
              }),
          }
        );

      const data =
        await res
          .json();

      applyApiUsage(
        data?.usage
      );

      if (
        res.status ===
        429
      ) {
        setShowPremium(
          true
        );

        setMessages(
          (
            prev
          ) =>
            prev
              .filter(
                (
                  item,
                  index
                ) =>
                  !(
                    index ===
                      prev.length -
                        1 &&
                    item.role ===
                      "user" &&
                    item.text ===
                      text
                  )
              )
        );

        return;
      }

      if (
        !res.ok
      ) {
        throw new Error(
          data?.error ||
            "通信に失敗しました"
        );
      }

      if (
        Array.isArray(
          data.memory
        )
      ) {
        setMemory(
          data.memory
            .filter(
              (
                item:
                  unknown
              ) =>
                typeof item ===
                "string"
            )
        );
      }

      applyTodayMemory(
        data
          .misakiTodayMemory
      );

      setRelationshipPoints(
        nextRelationshipPoints
      );

      setMessages(
        (
          prev
        ) =>
          [
            ...prev,

            {
              role:
                "misaki" as const,

              text:
                data.reply ||
                "返事を取得できませんでした。",
            },
          ]
            .slice(
              -MAX_MESSAGES
            )
      );
    } catch (
      error:
        any
    ) {
      setMessages(
        (
          prev
        ) =>
          [
            ...prev,

            {
              role:
                "misaki" as const,

              text:
                error
                  ?.message ||
                "今ちょっと調子が悪いみたい。もう一回話しかけてね。",
            },
          ]
            .slice(
              -MAX_MESSAGES
            )
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function sendProactiveMessage() {
    if (
      loading ||
      !loaded ||
      !accountLoaded
    ) {
      return;
    }

    if (
      document
        .visibilityState !==
      "visible"
    ) {
      return;
    }

    if (
      message
        .trim()
        .length >
      0
    ) {
      return;
    }

    const now =
      Date.now();

    const currentDate =
      getJapanDateKey();

    let state = {
      date:
        currentDate,

      count:
        0,

      lastSentAt:
        0,

      nextAttemptAt:
        0,
    };

    try {
      const saved =
        localStorage
          .getItem(
            PROACTIVE_KEY
          );

      if (
        saved
      ) {
        const parsed =
          JSON.parse(
            saved
          );

        if (
          parsed &&
          parsed.date ===
            currentDate
        ) {
          state = {
            date:
              currentDate,

            count:
              typeof parsed
                .count ===
                "number"
                ? parsed.count
                : 0,

            lastSentAt:
              typeof parsed
                .lastSentAt ===
                "number"
                ? parsed
                    .lastSentAt
                : 0,

            nextAttemptAt:
              typeof parsed
                .nextAttemptAt ===
                "number"
                ? parsed
                    .nextAttemptAt
                : 0,
          };
        }
      }
    } catch (
      error
    ) {
      console.error(
        "Failed to load proactive state:",
        error
      );
    }

    if (
      state.count >=
      MAX_PROACTIVE_PER_DAY
    ) {
      return;
    }

    if (
      state.lastSentAt >
        0 &&
      now -
        state.lastSentAt <
        PROACTIVE_COOLDOWN_MS
    ) {
      return;
    }

    if (
      state.nextAttemptAt <=
      0
    ) {
      const nextAttemptAt =
        now +
        getRandomProactiveDelayMs();

      localStorage
        .setItem(
          PROACTIVE_KEY,

          JSON.stringify({
            ...state,

            nextAttemptAt,
          })
        );

      return;
    }

    if (
      now <
      state.nextAttemptAt
    ) {
      return;
    }

    try {
      const accessToken =
        await getAccessToken();

      const currentTime =
        getJapanCurrentTime();

      const todayMemoryForRequest =
        misakiTodayMemory
          .date ===
          currentDate
          ? misakiTodayMemory
          : {
              date:
                currentDate,

              items:
                [],
            };

      const res =
        await fetch(
          "/api/proactive",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                history:
                  messages
                    .slice(
                      -MAX_MESSAGES
                    ),

                memory,

                misakiTodayMemory:
                  todayMemoryForRequest,

                currentTime,

                relationshipPoints,
              }),
          }
        );

      const data =
        await res
          .json();

      if (
        !res.ok
      ) {
        console.error(
          "Proactive message failed:",
          data
        );

        return;
      }

      if (
        data.sent ===
        false
      ) {
        return;
      }

      if (
        !data.reply ||
        typeof data
          .reply !==
          "string"
      ) {
        return;
      }

      if (
        Array.isArray(
          data.memory
        )
      ) {
        setMemory(
          data.memory
            .filter(
              (
                item:
                  unknown
              ) =>
                typeof item ===
                "string"
            )
        );
      }

      applyTodayMemory(
        data
          .misakiTodayMemory
      );

      setMessages(
        (
          prev
        ) =>
          [
            ...prev,

            {
              role:
                "misaki" as const,

              text:
                data.reply,
            },
          ]
            .slice(
              -MAX_MESSAGES
            )
      );

      const nextState = {
        date:
          currentDate,

        count:
          state.count +
          1,

        lastSentAt:
          now,

        nextAttemptAt:
          now +
          getRandomProactiveDelayMs(),
      };

      localStorage
        .setItem(
          PROACTIVE_KEY,

          JSON.stringify(
            nextState
          )
        );
    } catch (
      error
    ) {
      console.error(
        "Proactive message error:",
        error
      );
    }
  }

  useEffect(
    () => {
      if (
        !loaded ||
        !accountLoaded
      ) {
        return;
      }

      sendProactiveMessage();

      const timer =
        window
          .setInterval(
            () => {
              sendProactiveMessage();
            },

            PROACTIVE_CHECK_MS
          );

      return () => {
        window
          .clearInterval(
            timer
          );
      };
    },
    [
      loaded,
      accountLoaded,
      loading,
      message,
      messages,
      memory,
      misakiTodayMemory,
      relationshipPoints,
    ]
  );

  return (
    <main
      className="shell"
    >
      {/* =========================
          BRAND HEADER
      ========================== */}

      <header
        className="misakiChatHeader"
      >
        <a
          href="/"
          className="misakiHeaderProfile"
          aria-label="美咲のトップページへ"
        >
          <div
            className="avatar"
          >
            <img
              src="/icon-192.png"
              alt="美咲"
            />
          </div>

          <div
            className="misakiHeaderText"
          >
            <div
              className="misakiNameRow"
            >
              <h1>
                美咲
              </h1>

              <span
                className="misakiAge"
              >
                38
              </span>
            </div>

            <p>
              日常に、もうひとつの会話を。
            </p>
          </div>
        </a>

        <div
          className="misakiHeaderRight"
        >
          {notificationPermission ===
            "granted" && (
            <span
              className="notificationDot"
              title="通知ON"
            />
          )}

          <button
            className="menuButton"
            onClick={() =>
              setShowMenu(
                (
                  prev
                ) =>
                  !prev
              )
            }
            aria-label="メニュー"
            aria-expanded={
              showMenu
            }
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {showMenu && (
          <>
            <button
              className="menuBackdrop"
              aria-label="メニューを閉じる"
              onClick={() =>
                setShowMenu(
                  false
                )
              }
            />

            <div
              className="misakiMenu"
            >
              <div
                className="misakiMenuTop"
              >
                <span
                  className="misakiMenuTitle"
                >
                  美咲
                </span>

                <span
                  className="misakiMenuSignature"
                >
                  Misaki
                </span>
              </div>

              {notificationPermission !==
                "granted" &&
                notificationPermission !==
                  "unsupported" && (
                <button
                  className="menuItem"
                  onClick={
                    async () => {
                      await requestNotificationPermission();

                      setShowMenu(
                        false
                      );
                    }
                  }
                  disabled={
                    loading
                  }
                >
                  <span
                    className="menuIcon"
                  >
                    ♡
                  </span>

                  <span>
                    <strong>
                      通知をON
                    </strong>

                    <small>
                      美咲からのメッセージを受け取る
                    </small>
                  </span>
                </button>
              )}

              {notificationPermission ===
                "granted" && (
                <div
                  className="menuItem menuItemStatic"
                >
                  <span
                    className="menuIcon"
                  >
                    ♡
                  </span>

                  <span>
                    <strong>
                      通知ON
                    </strong>

                    <small>
                      美咲からの通知を受け取れます
                    </small>
                  </span>
                </div>
              )}

              <button
                className="menuItem"
                onClick={() => {
                  setShowMemory(
                    (
                      prev
                    ) =>
                      !prev
                  );

                  setShowMenu(
                    false
                  );
                }}
                disabled={
                  loading
                }
              >
                <span
                  className="menuIcon"
                >
                  ◌
                </span>

                <span>
                  <strong>
                    美咲の記憶
                  </strong>

                  <small>
                    覚えていることを見る
                  </small>
                </span>
              </button>

              <button
                className="menuItem"
                onClick={() => {
                  setShowMenu(
                    false
                  );

                  resetChat();
                }}
                disabled={
                  loading
                }
              >
                <span
                  className="menuIcon"
                >
                  ↻
                </span>

                <span>
                  <strong>
                    会話をリセット
                  </strong>

                  <small>
                    今までのチャットだけを消す
                  </small>
                </span>
              </button>

              <a
                href="/"
                className="menuItem"
              >
                <span
                  className="menuIcon"
                >
                  ←
                </span>

                <span>
                  <strong>
                    美咲のページへ
                  </strong>

                  <small>
                    トップページに戻る
                  </small>
                </span>
              </a>
            </div>
          </>
        )}
      </header>

      {/* =========================
          MEMORY
      ========================== */}

      {showMemory && (
        <section
          className="memoryPanel"
        >
          <div
            className="memoryPanelHeader"
          >
            <div>
              <span
                className="memoryEyebrow"
              >
                MEMORY
              </span>

              <h2>
                美咲が覚えていること
              </h2>
            </div>

            <button
              className="panelClose"
              onClick={() =>
                setShowMemory(
                  false
                )
              }
              aria-label="閉じる"
            >
              ×
            </button>
          </div>

          {memory.length ===
          0 ? (
            <div
              className="emptyMemory"
            >
              <span
                className="emptyMemoryHeart"
              >
                ♡
              </span>

              <p>
                まだ覚えていることはないよ。
              </p>

              <small>
                話していくうちに、
                少しずつ増えていきます。
              </small>
            </div>
          ) : (
            <>
              <div
                className="memoryList"
              >
                {memory.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`${item}-${index}`}
                      className="memoryItem"
                    >
                      <span
                        className="memoryBullet"
                      >
                        ♡
                      </span>

                      <div
                        className="memoryText"
                      >
                        {item}
                      </div>

                      <button
                        className="memoryDelete"
                        onClick={() =>
                          deleteMemory(
                            index
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>

              <button
                className="resetMemoryButton"
                onClick={
                  resetMemory
                }
              >
                すべての記憶を削除
              </button>
            </>
          )}
        </section>
      )}

      {/* =========================
          SAFETY
      ========================== */}

      <section
        className="notice"
      >
        運転中の画面操作はしないでね。
        安全な場所に停車してから話そう。
      </section>

      {/* =========================
          PLAN
      ========================== */}

      <section
        className="planBar"
      >
        <div
          className="planStatus"
        >
          <span
            className={`planDot ${
              isPremium
                ? "premium"
                : ""
            }`}
          />

          <span>
            {!accountLoaded
              ? "プラン確認中..."
              : isPremium
                ? "美咲プレミアム"
                : `無料版・今日あと${freeRemaining}回`}
          </span>
        </div>

        {!isPremium && (
          <button
            className="premiumLink"
            onClick={
              openPremium
            }
          >
            プレミアム
          </button>
        )}
      </section>

      {/* =========================
          PREMIUM
      ========================== */}

      {showPremium &&
        !isPremium && (
          <section
            className="premiumPanel"
          >
            <div
              className="premiumPanelTop"
            >
              <div>
                <p
                  className="premiumEyebrow"
                >
                  MISAKI PREMIUM
                </p>

                <h2>
                  もっと、
                  <br />
                  美咲と話したい日に。
                </h2>
              </div>

              <button
                className="panelClose"
                onClick={() =>
                  setShowPremium(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <p
              className="premiumDescription"
            >
              会話回数を気にせず、
              美咲との毎日の続きを
              楽しめるようにするプランです。
            </p>

            {freeLimitReached && (
              <div
                className="premiumLimitMessage"
              >
                今日は無料分の20回まで話したよ。
              </div>
            )}

            <button
              className="premiumButton"
              onClick={
                startPremium
              }
            >
              プレミアムを始める
            </button>

            <p
              className="premiumNote"
            >
              現在はテスト中のため、
              まだ料金は発生しません。
            </p>
          </section>
        )}

      {/* =========================
          CHAT
      ========================== */}

      <section
        className="chat"
      >
        {messages.length ===
          0 &&
          !loading && (
            <div
              className="emptyConversation"
            >
              <img
                src="/icon-192.png"
                alt=""
              />

              <p>
                なんでもない話でいいよ。
              </p>

              <span>
                Misaki
              </span>
            </div>
          )}

        {messages.map(
          (
            item,
            index
          ) => (
            <div
              key={
                index
              }
              className={`bubble ${
                item.role ===
                "user"
                  ? "user"
                  : ""
              }`}
            >
              {item.text}
            </div>
          )
        )}

        {loading && (
          <div
            className="bubble typingBubble"
          >
            <span />
            <span />
            <span />
          </div>
        )}
      </section>

      {/* =========================
          INPUT
      ========================== */}

      <section
        className="inputArea"
      >
        <input
          value={
            message
          }
          onChange={(
            e
          ) =>
            setMessage(
              e.target
                .value
            )
          }
          onKeyDown={(
            e
          ) => {
            if (
              e.key ===
              "Enter"
            ) {
              sendMessage();
            }
          }}
          placeholder={
            !accountLoaded
              ? "準備中..."
              : freeLimitReached
                ? "今日は無料分を使い切りました"
                : "美咲に話しかける..."
          }
          disabled={
            loading ||
            !accountLoaded ||
            freeLimitReached
          }
        />

        <button
          className="sendButton"
          aria-label={
            freeLimitReached
              ? "続きを話す"
              : "送信"
          }
          onClick={
            freeLimitReached
              ? openPremium
              : sendMessage
          }
          disabled={
            loading ||
            !accountLoaded
          }
        >
          {!accountLoaded
            ? "…"
            : loading
              ? "…"
              : freeLimitReached
                ? "続き"
                : "↑"}
        </button>
      </section>

      {/* =========================
          PAGE-SPECIFIC STYLE
      ========================== */}

      <style jsx>{`
        .misakiChatHeader {
          position: sticky;
          top: 0;
          z-index: 50;
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding:
            calc(
              10px +
              env(
                safe-area-inset-top
              )
            )
            14px
            10px;
          background:
            rgba(
              255,
              250,
              250,
              0.95
            );
          border-bottom:
            1px solid
            rgba(
              108,
              92,
              98,
              0.08
            );
          box-shadow:
            0 5px 24px
            rgba(
              82,
              55,
              64,
              0.055
            );
          backdrop-filter:
            blur(
              18px
            );
          -webkit-backdrop-filter:
            blur(
              18px
            );
        }

        .misakiHeaderProfile {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          color: inherit;
          text-decoration:
            none;
        }

        .misakiHeaderText {
          min-width: 0;
        }

        .misakiNameRow {
          display: flex;
          align-items:
            center;
          gap: 7px;
        }

        .misakiNameRow h1 {
          margin: 0;
          color:
            #49383e;
          font-size:
            18px;
          line-height:
            1.15;
          font-weight:
            800;
          letter-spacing:
            0.05em;
        }

        .misakiAge {
          min-width:
            25px;
          height:
            18px;
          display:
            inline-flex;
          align-items:
            center;
          justify-content:
            center;
          border-radius:
            999px;
          background:
            #ffd5de;
          color:
            #a45365;
          font-size:
            9px;
          font-weight:
            700;
        }

        .misakiHeaderText p {
          margin:
            4px 0 0;
          color:
            #9a8b90;
          font-size:
            10px;
          white-space:
            nowrap;
        }

        .misakiHeaderRight {
          display:
            flex;
          align-items:
            center;
          gap:
            9px;
        }

        .notificationDot {
          width:
            7px;
          height:
            7px;
          border-radius:
            50%;
          background:
            #ff6680;
          box-shadow:
            0 0 0 4px
            rgba(
              255,
              102,
              128,
              0.1
            );
        }

        .menuButton {
          width:
            40px;
          height:
            40px;
          padding:
            0;
          border:
            0;
          border-radius:
            50%;
          background:
            rgba(
              248,
              239,
              234,
              0.9
            );
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          gap:
            3px;
          cursor:
            pointer;
        }

        .menuButton span {
          width:
            4px;
          height:
            4px;
          border-radius:
            50%;
          background:
            #6c5c62;
        }

        .menuBackdrop {
          position:
            fixed;
          inset:
            0;
          z-index:
            70;
          padding:
            0;
          border:
            0;
          background:
            rgba(
              54,
              38,
              44,
              0.12
            );
          backdrop-filter:
            blur(
              2px
            );
          -webkit-backdrop-filter:
            blur(
              2px
            );
        }

        .misakiMenu {
          position:
            absolute;
          z-index:
            80;
          top:
            calc(
              64px +
              env(
                safe-area-inset-top
              )
            );
          right:
            12px;
          width:
            285px;
          overflow:
            hidden;
          border:
            1px solid
            rgba(
              108,
              92,
              98,
              0.08
            );
          border-radius:
            23px;
          background:
            rgba(
              255,
              250,
              250,
              0.99
            );
          box-shadow:
            0 24px
            60px
            rgba(
              67,
              44,
              52,
              0.18
            );
        }

        .misakiMenuTop {
          padding:
            17px
            18px
            13px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            space-between;
          border-bottom:
            1px solid
            rgba(
              108,
              92,
              98,
              0.07
            );
        }

        .misakiMenuTitle {
          color:
            #49383e;
          font-size:
            13px;
          font-weight:
            800;
        }

        .misakiMenuSignature {
          color:
            #ff6680;
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size:
            17px;
          transform:
            rotate(
              -4deg
            );
        }

        .menuItem {
          width:
            100%;
          min-height:
            59px;
          display:
            flex;
          align-items:
            center;
          gap:
            12px;
          padding:
            10px
            16px;
          border:
            0;
          border-bottom:
            1px solid
            rgba(
              108,
              92,
              98,
              0.055
            );
          background:
            transparent;
          color:
            #6c5c62;
          text-align:
            left;
          text-decoration:
            none;
          cursor:
            pointer;
        }

        .menuItem:last-child {
          border-bottom:
            0;
        }

        .menuItem:active {
          background:
            rgba(
              255,
              213,
              222,
              0.18
            );
        }

        .menuItemStatic {
          cursor:
            default;
        }

        .menuIcon {
          width:
            31px;
          height:
            31px;
          flex:
            0 0 31px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          border-radius:
            50%;
          background:
            #fff0f3;
          color:
            #e95872;
          font-size:
            15px;
        }

        .menuItem strong {
          display:
            block;
          color:
            #55454b;
          font-size:
            13px;
          font-weight:
            700;
        }

        .menuItem small {
          display:
            block;
          margin-top:
            3px;
          color:
            #a09297;
          font-size:
            9px;
          line-height:
            1.35;
        }

        .memoryPanel,
        .premiumPanel {
          margin:
            12px
            12px
            5px;
          padding:
            18px;
          border:
            1px solid
            rgba(
              108,
              92,
              98,
              0.06
            );
          border-radius:
            22px;
          background:
            rgba(
              255,
              255,
              255,
              0.91
            );
          box-shadow:
            0 13px
            35px
            rgba(
              75,
              52,
              60,
              0.07
            );
        }

        .memoryPanelHeader,
        .premiumPanelTop {
          display:
            flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap:
            15px;
        }

        .memoryEyebrow,
        .premiumEyebrow {
          display:
            block;
          margin:
            0 0 5px;
          color:
            #ff6680;
          font-size:
            8px;
          line-height:
            1;
          font-weight:
            900;
          letter-spacing:
            0.18em;
        }

        .memoryPanel h2,
        .premiumPanel h2 {
          margin:
            0;
          color:
            #49383e;
          font-size:
            17px;
          line-height:
            1.45;
        }

        .panelClose {
          width:
            32px;
          height:
            32px;
          flex:
            0 0 32px;
          border:
            0;
          border-radius:
            50%;
          background:
            #f8efea;
          color:
            #85757b;
          font-size:
            18px;
          cursor:
            pointer;
        }

        .emptyMemory {
          padding:
            30px
            10px
            16px;
          text-align:
            center;
        }

        .emptyMemoryHeart {
          display:
            block;
          color:
            #ff9eaf;
          font-size:
            25px;
        }

        .emptyMemory p {
          margin:
            10px
            0 0;
          color:
            #66565c;
          font-size:
            13px;
        }

        .emptyMemory small {
          display:
            block;
          margin-top:
            5px;
          color:
            #a09297;
          font-size:
            9px;
        }

        .memoryList {
          margin-top:
            15px;
          display:
            flex;
          flex-direction:
            column;
          gap:
            8px;
        }

        .memoryItem {
          display:
            flex;
          align-items:
            center;
          gap:
            9px;
          padding:
            11px
            10px;
          border-radius:
            13px;
          background:
            #fff7f8;
        }

        .memoryBullet {
          flex:
            0 0 auto;
          color:
            #ff8195;
          font-size:
            13px;
        }

        .memoryText {
          flex:
            1;
          min-width:
            0;
          color:
            #67575d;
          font-size:
            12px;
          line-height:
            1.55;
        }

        .memoryDelete {
          width:
            25px;
          height:
            25px;
          flex:
            0 0 auto;
          border:
            0;
          border-radius:
            50%;
          background:
            transparent;
          color:
            #ab9ca1;
          cursor:
            pointer;
        }

        .resetMemoryButton {
          margin-top:
            15px;
          padding:
            0;
          border:
            0;
          background:
            transparent;
          color:
            #a09297;
          font-size:
            10px;
          text-decoration:
            underline;
          cursor:
            pointer;
        }

        .planBar {
          margin:
            7px
            14px
            5px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            space-between;
          gap:
            10px;
          color:
            #96878c;
          font-size:
            10px;
        }

        .planStatus {
          display:
            flex;
          align-items:
            center;
          gap:
            6px;
        }

        .planDot {
          width:
            5px;
          height:
            5px;
          border-radius:
            50%;
          background:
            #d0c4c7;
        }

        .planDot.premium {
          background:
            #ff6680;
          box-shadow:
            0 0 0 3px
            rgba(
              255,
              102,
              128,
              0.1
            );
        }

        .premiumLink {
          padding:
            0;
          border:
            0;
          background:
            transparent;
          color:
            #e95872;
          font-size:
            10px;
          font-weight:
            700;
          cursor:
            pointer;
        }

        .premiumDescription {
          margin:
            14px
            0 0;
          color:
            #78686e;
          font-size:
            12px;
          line-height:
            1.75;
        }

        .premiumLimitMessage {
          margin-top:
            14px;
          padding:
            10px
            12px;
          border-radius:
            12px;
          background:
            #fff0f3;
          color:
            #a35364;
          font-size:
            11px;
          font-weight:
            700;
        }

        .premiumButton {
          width:
            100%;
          margin-top:
            16px;
          padding:
            13px
            15px;
          border:
            0;
          border-radius:
            15px;
          background:
            #ff6680;
          color:
            white;
          font-size:
            14px;
          font-weight:
            800;
          box-shadow:
            0 10px
            23px
            rgba(
              255,
              102,
              128,
              0.2
            );
          cursor:
            pointer;
        }

        .premiumNote {
          margin:
            9px
            0 0;
          color:
            #a6989d;
          text-align:
            center;
          font-size:
            9px;
        }

        .emptyConversation {
          margin:
            auto;
          padding:
            40px
            20px
            90px;
          text-align:
            center;
        }

        .emptyConversation img {
          width:
            69px;
          height:
            69px;
          margin:
            0 auto;
          border:
            3px solid
            white;
          border-radius:
            50%;
          box-shadow:
            0 9px
            25px
            rgba(
              92,
              61,
              72,
              0.12
            );
        }

        .emptyConversation p {
          margin:
            17px
            0 0;
          color:
            #78656d;
          font-family:
            "Bradley Hand",
            "Segoe Script",
            "Hiragino Sans",
            sans-serif;
          font-size:
            16px;
          letter-spacing:
            0.03em;
        }

        .emptyConversation span {
          display:
            inline-block;
          margin-top:
            7px;
          color:
            #ff6680;
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size:
            17px;
          transform:
            rotate(
              -4deg
            );
        }

        .sendButton {
          width:
            43px !important;
          min-width:
            43px !important;
          padding:
            0 !important;
          font-size:
            17px !important;
        }

        @media (
          max-width:
            390px
        ) {
          .misakiChatHeader {
            padding-left:
              11px;
            padding-right:
              11px;
          }

          .misakiHeaderText p {
            font-size:
              9px;
          }

          .misakiMenu {
            right:
              8px;
            width:
              calc(
                100vw -
                16px
              );
            max-width:
              285px;
          }
        }
      `}</style>
    </main>
  );
}
