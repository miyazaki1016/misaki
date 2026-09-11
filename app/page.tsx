"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

type Plan = "free" | "premium";

const STORAGE_KEY = "misaki-chat-history";
const MEMORY_KEY = "misaki-long-term-memory";
const PROACTIVE_KEY = "misaki-proactive-state";
const RELATIONSHIP_KEY = "misaki-relationship-points";
const DAILY_USAGE_KEY = "misaki-daily-usage";
const MISAKI_TODAY_MEMORY_KEY =
  "misaki-today-memory";

const MAX_MESSAGES = 60;

// 無料版は1日20往復まで
const FREE_DAILY_LIMIT = 20;

// 10分ごとに、美咲から話しかける条件を確認
const PROACTIVE_CHECK_MS =
  10 * 60 * 1000;

// 自発メッセージ同士は最低45分空ける
const PROACTIVE_COOLDOWN_MS =
  45 * 60 * 1000;

// 1日最大4回
const MAX_PROACTIVE_PER_DAY = 4;

const INITIAL_MESSAGES: ChatMessage[] =
  [];

function getJapanDateKey() {
  return new Date().toLocaleDateString(
    "ja-JP",
    {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );
}

function getJapanCurrentTime() {
  return new Date().toLocaleString(
    "ja-JP",
    {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

function createEmptyTodayMemory():
  MisakiTodayMemory {
  return {
    date: getJapanDateKey(),
    items: [],
  };
}

function isPremiumActive(
  plan: string | null | undefined,
  premiumUntil:
    | string
    | null
    | undefined
) {
  if (plan !== "premium") {
    return false;
  }

  if (!premiumUntil) {
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

  return expiresAt > Date.now();
}

export default function Home() {
  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messages,
    setMessages,
  ] =
    useState<ChatMessage[]>(
      INITIAL_MESSAGES
    );

  const [
    memory,
    setMemory,
  ] = useState<string[]>([]);

  const [
    misakiTodayMemory,
    setMisakiTodayMemory,
  ] =
    useState<MisakiTodayMemory>(
      createEmptyTodayMemory()
    );

  const [
    relationshipPoints,
    setRelationshipPoints,
  ] = useState(0);

  const [
    dailyUsage,
    setDailyUsage,
  ] =
    useState<DailyUsage>({
      date:
        getJapanDateKey(),
      count: 0,
    });

  const [
    plan,
    setPlan,
  ] =
    useState<Plan>("free");

  const [
    accountLoaded,
    setAccountLoaded,
  ] = useState(false);

  const [
    showPremium,
    setShowPremium,
  ] = useState(false);

  const [
    showMemory,
    setShowMemory,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loaded,
    setLoaded,
  ] = useState(false);

  const [
    notificationPermission,
    setNotificationPermission,
  ] = useState<
    | "default"
    | "granted"
    | "denied"
    | "unsupported"
  >("default");

  const isPremium =
    plan === "premium";

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

  //
  // Supabaseユーザー初期化
  //
  useEffect(() => {
    let active = true;

    async function loadEntitlement(
      userId: string
    ) {
      for (
        let attempt = 0;
        attempt < 5;
        attempt += 1
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

        if (error) {
          throw error;
        }

        if (data) {
          return isPremiumActive(
            data.plan,
            data.premium_until
          );
        }

        await new Promise(
          (resolve) =>
            window.setTimeout(
              resolve,
              350
            )
        );
      }

      return false;
    }

    async function initializeAccount() {
      try {
        const {
          data:
            sessionData,
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

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

        if (!user) {
          const {
            data:
              signInData,
            error:
              signInError,
          } =
            await supabase.auth.signInAnonymously();

          if (
            signInError
          ) {
            throw signInError;
          }

          user =
            signInData.user ??
            null;
        }

        if (!user) {
          throw new Error(
            "Supabase user was not created."
          );
        }

        const premium =
          await loadEntitlement(
            user.id
          );

        if (!active) {
          return;
        }

        setPlan(
          premium
            ? "premium"
            : "free"
        );
      } catch (error) {
        console.error(
          "Supabase account initialization failed:",
          error
        );

        if (active) {
          setPlan(
            "free"
          );
        }
      } finally {
        if (active) {
          setAccountLoaded(
            true
          );
        }
      }
    }

    initializeAccount();

    return () => {
      active = false;
    };
  }, []);

  //
  // プレミアム状態
  //
  useEffect(() => {
    if (
      !accountLoaded
    ) {
      return;
    }

    if (isPremium) {
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
  }, [
    accountLoaded,
    isPremium,
    usageCountToday,
  ]);

  //
  // Service Worker
  //
  useEffect(() => {
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
          (error) => {
            console.error(
              "Service Worker registration failed:",
              error
            );
          }
        );
    }
  }, []);

  //
  // 通知権限確認
  //
  useEffect(() => {
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
      Notification.permission
    );
  }, []);

  //
  // 保存データ読み込み
  //
  useEffect(() => {
    try {
      const savedMessages =
        localStorage.getItem(
          STORAGE_KEY
        );

      const savedMemory =
        localStorage.getItem(
          MEMORY_KEY
        );

      const savedRelationship =
        localStorage.getItem(
          RELATIONSHIP_KEY
        );

      const savedDailyUsage =
        localStorage.getItem(
          DAILY_USAGE_KEY
        );

      const savedTodayMemory =
        localStorage.getItem(
          MISAKI_TODAY_MEMORY_KEY
        );

      let parsedMessages:
        | ChatMessage[]
        | null = null;

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
                  (item.role ===
                    "user" ||
                    item.role ===
                      "misaki") &&
                  typeof item.text ===
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
            parsedMemory.filter(
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
          Number.isFinite(
            parsedPoints
          ) &&
          parsedPoints >= 0
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
          parsedMessages.filter(
            (
              item
            ) =>
              item.role ===
              "user"
          ).length;

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
          parsedTodayMemory.date ===
            currentDate &&
          Array.isArray(
            parsedTodayMemory.items
          )
        ) {
          setMisakiTodayMemory({
            date:
              currentDate,
            items:
              parsedTodayMemory.items
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
                    item.trim()
                )
                .slice(
                  -12
                ),
          });
        } else {
          setMisakiTodayMemory({
            date:
              currentDate,
            items: [],
          });
        }
      } else {
        setMisakiTodayMemory({
          date:
            currentDate,
          items: [],
        });
      }

      if (
        savedDailyUsage
      ) {
        const parsedUsage =
          JSON.parse(
            savedDailyUsage
          );

        if (
          parsedUsage &&
          parsedUsage.date ===
            currentDate &&
          typeof parsedUsage.count ===
            "number" &&
          Number.isFinite(
            parsedUsage.count
          )
        ) {
          const count =
            Math.max(
              0,
              Math.floor(
                parsedUsage.count
              )
            );

          setDailyUsage({
            date:
              currentDate,
            count,
          });
        } else {
          setDailyUsage({
            date:
              currentDate,
            count: 0,
          });
        }
      } else {
        setDailyUsage({
          date:
            currentDate,
          count: 0,
        });
      }
    } catch (error) {
      console.error(
        "Failed to load saved data:",
        error
      );

      const currentDate =
        getJapanDateKey();

      setDailyUsage({
        date:
          currentDate,
        count: 0,
      });

      setMisakiTodayMemory({
        date:
          currentDate,
        items: [],
      });
    } finally {
      setLoaded(true);
    }
  }, []);

  //
  // 会話履歴保存
  //
  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      const limitedMessages =
        messages.slice(
          -MAX_MESSAGES
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          limitedMessages
        )
      );
    } catch (error) {
      console.error(
        "Failed to save chat history:",
        error
      );
    }
  }, [
    messages,
    loaded,
  ]);

  //
  // 長期記憶保存
  //
  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(
          memory
        )
      );
    } catch (error) {
      console.error(
        "Failed to save memory:",
        error
      );
    }
  }, [
    memory,
    loaded,
  ]);

  //
  // 美咲の今日の記憶保存
  //
  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      const currentDate =
        getJapanDateKey();

      const safeTodayMemory =
        misakiTodayMemory.date ===
        currentDate
          ? misakiTodayMemory
          : {
              date:
                currentDate,
              items: [],
            };

      localStorage.setItem(
        MISAKI_TODAY_MEMORY_KEY,
        JSON.stringify(
          safeTodayMemory
        )
      );

      if (
        misakiTodayMemory.date !==
        currentDate
      ) {
        setMisakiTodayMemory(
          safeTodayMemory
        );
      }
    } catch (error) {
      console.error(
        "Failed to save Misaki today memory:",
        error
      );
    }
  }, [
    misakiTodayMemory,
    loaded,
  ]);

  //
  // 関係性ポイント保存
  //
  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        RELATIONSHIP_KEY,
        String(
          relationshipPoints
        )
      );
    } catch (error) {
      console.error(
        "Failed to save relationship points:",
        error
      );
    }
  }, [
    relationshipPoints,
    loaded,
  ]);

  //
  // 無料利用回数保存
  //
  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        DAILY_USAGE_KEY,
        JSON.stringify(
          dailyUsage
        )
      );
    } catch (error) {
      console.error(
        "Failed to save daily usage:",
        error
      );
    }
  }, [
    dailyUsage,
    loaded,
  ]);

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

      return;
    }

    try {
      await navigator
        .serviceWorker.ready;

      const permission =
        await Notification.requestPermission();

      setNotificationPermission(
        permission
      );

      if (
        permission ===
        "granted"
      ) {
        alert(
          "通知を許可しました。美咲から通知を受け取れる準備ができました。"
        );
      }

      if (
        permission ===
        "denied"
      ) {
        alert(
          "通知が許可されませんでした。iPhoneの設定から通知を許可してください。"
        );
      }
    } catch (error) {
      console.error(
        "Notification permission error:",
        error
      );

      alert(
        "通知の設定に失敗しました。"
      );
    }
  }

  function resetChat() {
    const confirmed =
      window.confirm(
        "美咲との会話履歴をリセットしますか？"
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      STORAGE_KEY
    );

    setMessages([]);
    setMessage("");
  }

  function deleteMemory(
    index: number
  ) {
    const confirmed =
      window.confirm(
        "この記憶を削除しますか？"
      );

    if (!confirmed) {
      return;
    }

    setMemory(
      (prev) =>
        prev.filter(
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
      memory.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "美咲の長期記憶をすべて削除しますか？\n会話履歴は残ります。"
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      MEMORY_KEY
    );

    setMemory([]);
  }

  function incrementDailyUsage() {
    if (isPremium) {
      return;
    }

    const currentDate =
      getJapanDateKey();

    setDailyUsage(
      (prev) => {
        if (
          prev.date !==
          currentDate
        ) {
          return {
            date:
              currentDate,
            count: 1,
          };
        }

        return {
          date:
            currentDate,
          count:
            prev.count +
            1,
        };
      }
    );
  }

  function openPremium() {
    if (isPremium) {
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
    value: unknown
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
        date?: unknown;
        items?: unknown;
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
      data.items
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
            ).trim()
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
      message.trim();

    if (
      !text ||
      loading
    ) {
      return;
    }

    const currentDate =
      getJapanDateKey();

    const currentUsage =
      dailyUsage.date ===
      currentDate
        ? dailyUsage.count
        : 0;

    if (
      !isPremium &&
      currentUsage >=
        FREE_DAILY_LIMIT
    ) {
      setShowPremium(
        true
      );
      return;
    }

    const userMessage:
      ChatMessage = {
        role: "user",
        text,
      };

    const newMessages =
      [
        ...messages,
        userMessage,
      ].slice(
        -MAX_MESSAGES
      );

    setMessages(
      newMessages
    );

    setMessage("");

    setLoading(true);

    const nextRelationshipPoints =
      relationshipPoints +
      1;

    try {
      const currentTime =
        getJapanCurrentTime();

      const todayMemoryForRequest =
        misakiTodayMemory.date ===
        currentDate
          ? misakiTodayMemory
          : {
              date:
                currentDate,
              items: [],
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
            },

            body:
              JSON.stringify({
                message:
                  text,

                history:
                  messages.slice(
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
        await res.json();

      if (!res.ok) {
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
          data.memory.filter(
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
        data.misakiTodayMemory
      );

      setRelationshipPoints(
        nextRelationshipPoints
      );

      incrementDailyUsage();

      setMessages(
        (prev) =>
          [
            ...prev,
            {
              role:
                "misaki" as const,

              text:
                data.reply ||
                "返事を取得できませんでした。",
            },
          ].slice(
            -MAX_MESSAGES
          )
      );
    } catch (
      error: any
    ) {
      setMessages(
        (prev) =>
          [
            ...prev,
            {
              role:
                "misaki" as const,

              text:
                error?.message ||
                "今ちょっと調子が悪いみたい。もう一回話しかけてね。",
            },
          ].slice(
            -MAX_MESSAGES
          )
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendProactiveMessage() {
    if (
      loading ||
      !loaded
    ) {
      return;
    }

    if (
      document.visibilityState !==
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
      count: 0,
      lastSentAt: 0,
    };

    try {
      const saved =
        localStorage.getItem(
          PROACTIVE_KEY
        );

      if (saved) {
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
              typeof parsed.count ===
              "number"
                ? parsed.count
                : 0,

            lastSentAt:
              typeof parsed.lastSentAt ===
              "number"
                ? parsed.lastSentAt
                : 0,
          };
        }
      }
    } catch (error) {
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

    const hiddenInstruction:
      ChatMessage = {
        role: "user",

        text:
          "【これは画面には表示されない自発会話のきっかけです】ユーザーからメッセージが来たわけではありません。美咲のほうから、今の時間帯・今日の美咲自身の生活・今日すでに起きた美咲自身の出来事・直近の会話・長期記憶を参考にして、恋人へ自然にひとことLINEしてください。質問を無理につけず、1〜2文程度にしてください。話すことが特になければ、美咲自身の今の様子や気分を短く話してください。",
      };

    try {
      const currentTime =
        getJapanCurrentTime();

      const todayMemoryForRequest =
        misakiTodayMemory.date ===
        currentDate
          ? misakiTodayMemory
          : {
              date:
                currentDate,
              items: [],
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
            },

            body:
              JSON.stringify({
                message:
                  hiddenInstruction.text,

                history:
                  messages.slice(
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
        await res.json();

      if (!res.ok) {
        console.error(
          "Proactive message failed:",
          data
        );

        return;
      }

      if (
        !data.reply ||
        typeof data.reply !==
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
          data.memory.filter(
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
        data.misakiTodayMemory
      );

      setMessages(
        (prev) =>
          [
            ...prev,
            {
              role:
                "misaki" as const,

              text:
                data.reply,
            },
          ].slice(
            -MAX_MESSAGES
          )
      );

      const nextState = {
        date:
          currentDate,

        count:
          state.count + 1,

        lastSentAt:
          now,
      };

      localStorage.setItem(
        PROACTIVE_KEY,
        JSON.stringify(
          nextState
        )
      );
    } catch (error) {
      console.error(
        "Proactive message error:",
        error
      );
    }
  }

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          sendProactiveMessage();
        },
        PROACTIVE_CHECK_MS
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    loaded,
    loading,
    message,
    messages,
    memory,
    misakiTodayMemory,
    relationshipPoints,
  ]);

  return (
    <main className="shell">
      <section className="card">
        <div className="avatar">
          <img
            src="/icon-192.png"
            alt="美咲"
          />
        </div>

        <div>
          <h1>美咲</h1>

          <p>
            タクドラの彼女・38歳
          </p>
        </div>

        <div
          style={{
            marginLeft:
              "auto",
            display:
              "flex",
            gap:
              "8px",
            alignItems:
              "center",
            flexWrap:
              "wrap",
            justifyContent:
              "flex-end",
          }}
        >
          {notificationPermission !==
            "granted" &&
            notificationPermission !==
              "unsupported" && (
              <button
                onClick={
                  requestNotificationPermission
                }
                disabled={
                  loading
                }
                style={{
                  border:
                    "none",
                  background:
                    "#ff6b81",
                  color:
                    "#ffffff",
                  borderRadius:
                    "999px",
                  padding:
                    "7px 10px",
                  fontSize:
                    "12px",
                  cursor:
                    "pointer",
                }}
              >
                通知をON
              </button>
            )}

          {notificationPermission ===
            "granted" && (
            <span
              style={{
                fontSize:
                  "12px",
                opacity:
                  0.6,
              }}
            >
              通知ON
            </span>
          )}

          <button
            onClick={() =>
              setShowMemory(
                (prev) =>
                  !prev
              )
            }
            disabled={
              loading
            }
            style={{
              border:
                "none",
              background:
                "transparent",
              fontSize:
                "12px",
              cursor:
                "pointer",
              opacity:
                0.7,
            }}
          >
            美咲の記憶
          </button>

          <button
            onClick={
              resetChat
            }
            disabled={
              loading
            }
            style={{
              border:
                "none",
              background:
                "transparent",
              fontSize:
                "12px",
              cursor:
                "pointer",
              opacity:
                0.6,
            }}
          >
            会話をリセット
          </button>
        </div>
      </section>

      {showMemory && (
        <section
          style={{
            margin:
              "12px 0",
            padding:
              "14px",
            borderRadius:
              "14px",
            background:
              "rgba(255,255,255,0.8)",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              marginBottom:
                "10px",
            }}
          >
            <strong>
              美咲が覚えていること
            </strong>

            {memory.length >
              0 && (
              <button
                onClick={
                  resetMemory
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  fontSize:
                    "12px",
                  cursor:
                    "pointer",
                  opacity:
                    0.6,
                }}
              >
                すべて削除
              </button>
            )}
          </div>

          {memory.length ===
          0 ? (
            <p
              style={{
                fontSize:
                  "14px",
                opacity:
                  0.6,
                margin: 0,
              }}
            >
              まだ覚えていることはないよ。
            </p>
          ) : (
            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap:
                  "8px",
              }}
            >
              {memory.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item}-${index}`}
                    style={{
                      display:
                        "flex",
                      gap:
                        "8px",
                      alignItems:
                        "center",
                      padding:
                        "10px",
                      borderRadius:
                        "10px",
                      background:
                        "rgba(255,255,255,0.9)",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        fontSize:
                          "14px",
                        lineHeight:
                          1.5,
                      }}
                    >
                      {item}
                    </div>

                    <button
                      onClick={() =>
                        deleteMemory(
                          index
                        )
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "transparent",
                        cursor:
                          "pointer",
                        fontSize:
                          "12px",
                        opacity:
                          0.6,
                      }}
                    >
                      削除
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}

      <section className="notice">
        運転中の画面操作はしないでね。安全な場所に停車してから話そう。
      </section>

      <section
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap:
            "10px",
          margin:
            "8px 12px 10px",
          fontSize:
            "12px",
          opacity:
            0.7,
        }}
      >
        <span>
          {!accountLoaded
            ? "プラン確認中..."
            : isPremium
              ? "プレミアム利用中"
              : `無料版・今日あと${freeRemaining}回`}
        </span>

        {!isPremium && (
          <button
            onClick={
              openPremium
            }
            style={{
              border:
                "none",
              background:
                "transparent",
              padding: 0,
              fontSize:
                "12px",
              fontWeight:
                700,
              cursor:
                "pointer",
              textDecoration:
                "underline",
            }}
          >
            プレミアム
          </button>
        )}
      </section>

      {showPremium &&
        !isPremium && (
        <section
          style={{
            margin:
              "10px 12px 14px",
            padding:
              "18px",
            borderRadius:
              "18px",
            background:
              "#ffffff",
            boxShadow:
              "0 4px 18px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              gap:
                "12px",
              alignItems:
                "flex-start",
            }}
          >
            <div>
              <strong
                style={{
                  fontSize:
                    "17px",
                }}
              >
                美咲プレミアム
              </strong>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  fontSize:
                    "14px",
                  lineHeight:
                    1.6,
                }}
              >
                もっと美咲と話したい人向けのプランです。
                会話回数を気にせず、美咲との関係を続けられるようにします。
              </p>
            </div>

            <button
              onClick={() =>
                setShowPremium(
                  false
                )
              }
              style={{
                border:
                  "none",
                background:
                  "transparent",
                cursor:
                  "pointer",
                fontSize:
                  "18px",
              }}
            >
              ×
            </button>
          </div>

          {freeLimitReached && (
            <p
              style={{
                margin:
                  "14px 0 0",
                fontSize:
                  "13px",
                fontWeight:
                  700,
              }}
            >
              今日は無料分の20回まで話したよ。
            </p>
          )}

          <button
            onClick={
              startPremium
            }
            style={{
              width:
                "100%",
              marginTop:
                "16px",
              border:
                "none",
              borderRadius:
                "14px",
              padding:
                "13px 16px",
              background:
                "#ff6b81",
              color:
                "#ffffff",
              fontSize:
                "15px",
              fontWeight:
                700,
              cursor:
                "pointer",
            }}
          >
            プレミアムを始める
          </button>

          <p
            style={{
              margin:
                "9px 0 0",
              textAlign:
                "center",
              fontSize:
                "11px",
              opacity:
                0.55,
            }}
          >
            現在はテスト中のため、まだ料金は発生しません。
          </p>
        </section>
      )}

      <section className="chat">
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
          <div className="bubble typingBubble">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </section>

      <section className="inputArea">
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
            freeLimitReached
              ? "今日は無料分を使い切りました"
              : "美咲に話しかける..."
          }
          disabled={
            loading ||
            freeLimitReached
          }
        />

        <button
          onClick={
            freeLimitReached
              ? openPremium
              : sendMessage
          }
          disabled={
            loading
          }
        >
          {loading
            ? "入力中"
            : freeLimitReached
              ? "続きを話す"
              : "送信"}
        </button>
      </section>
    </main>
  );
}
