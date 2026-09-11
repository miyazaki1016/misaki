"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

const STORAGE_KEY = "misaki-chat-history";
const MEMORY_KEY = "misaki-long-term-memory";
const MAX_MESSAGES = 60;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "misaki",
    text: "おかえり😊 今日は乗務？それとも明け？",
  },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] =
    useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [memory, setMemory] = useState<string[]>([]);
  const [showMemory, setShowMemory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedMessages =
        localStorage.getItem(STORAGE_KEY);
      const savedMemory =
        localStorage.getItem(MEMORY_KEY);

      if (savedMessages) {
        const parsedMessages =
          JSON.parse(savedMessages);

        if (
          Array.isArray(parsedMessages) &&
          parsedMessages.length > 0
        ) {
          setMessages(
            parsedMessages.slice(-MAX_MESSAGES)
          );
        }
      }

      if (savedMemory) {
        const parsedMemory =
          JSON.parse(savedMemory);

        if (Array.isArray(parsedMemory)) {
          setMemory(
            parsedMemory.filter(
              (item) =>
                typeof item === "string"
            )
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to load saved data:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      const limitedMessages =
        messages.slice(-MAX_MESSAGES);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(limitedMessages)
      );
    } catch (error) {
      console.error(
        "Failed to save chat history:",
        error
      );
    }
  }, [messages, loaded]);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memory)
      );
    } catch (error) {
      console.error(
        "Failed to save memory:",
        error
      );
    }
  }, [memory, loaded]);

  function resetChat() {
    const confirmed = window.confirm(
      "美咲との会話履歴をリセットしますか？"
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    setMessages(INITIAL_MESSAGES);
    setMessage("");
  }

  function deleteMemory(index: number) {
    const confirmed = window.confirm(
      "この記憶を削除しますか？"
    );

    if (!confirmed) return;

    setMemory((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  function resetMemory() {
    if (memory.length === 0) return;

    const confirmed = window.confirm(
      "美咲の長期記憶をすべて削除しますか？\n会話履歴は残ります。"
    );

    if (!confirmed) return;

    localStorage.removeItem(MEMORY_KEY);
    setMemory([]);
  }

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      text,
    };

    const newMessages = [
      ...messages,
      userMessage,
    ].slice(-MAX_MESSAGES);

    setMessages(newMessages);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: newMessages,
          memory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "通信に失敗しました"
        );
      }

      if (Array.isArray(data.memory)) {
        setMemory(
          data.memory.filter(
            (item: unknown) =>
              typeof item === "string"
          )
        );
      }

      setMessages((prev) =>
        [
          ...prev,
          {
            role: "misaki" as const,
            text:
              data.reply ||
              "返事を取得できませんでした。",
          },
        ].slice(-MAX_MESSAGES)
      );
    } catch (error: any) {
      setMessages((prev) =>
        [
          ...prev,
          {
            role: "misaki" as const,
            text:
              error?.message ||
              "今ちょっと調子が悪いみたい。もう一回話しかけてね。",
          },
        ].slice(-MAX_MESSAGES)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <div className="avatar">美</div>

        <div>
          <h1>美咲</h1>
          <p>タクドラの彼女・38歳</p>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <button
            onClick={() =>
              setShowMemory((prev) => !prev)
            }
            disabled={loading}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "12px",
              cursor: "pointer",
              opacity: 0.7,
            }}
          >
            美咲の記憶
          </button>

          <button
            onClick={resetChat}
            disabled={loading}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "12px",
              cursor: "pointer",
              opacity: 0.6,
            }}
          >
            会話をリセット
          </button>
        </div>
      </section>

      {showMemory && (
        <section
          style={{
            margin: "12px 0",
            padding: "14px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.8)",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              marginBottom: "10px",
            }}
          >
            <strong>
              美咲が覚えていること
            </strong>

            {memory.length > 0 && (
              <button
                onClick={resetMemory}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "12px",
                  cursor: "pointer",
                  opacity: 0.6,
                }}
              >
                すべて削除
              </button>
            )}
          </div>

          {memory.length === 0 ? (
            <p
              style={{
                fontSize: "14px",
                opacity: 0.6,
                margin: 0,
              }}
            >
              まだ覚えていることはないよ。
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {memory.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    padding: "10px",
                    borderRadius: "10px",
                    background:
                      "rgba(255,255,255,0.9)",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </div>

                  <button
                    onClick={() =>
                      deleteMemory(index)
                    }
                    style={{
                      border: "none",
                      background:
                        "transparent",
                      cursor: "pointer",
                      fontSize: "12px",
                      opacity: 0.6,
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="notice">
        運転中の画面操作はしないでね。安全な場所に停車してから話そう。
      </section>

      <section className="chat">
        {messages.map((item, index) => (
          <div
            key={index}
            className={`bubble ${
              item.role === "user"
                ? "user"
                : ""
            }`}
          >
            {item.text}
          </div>
        ))}

        {loading && (
          <div className="bubble">
            美咲が考え中…
          </div>
        )}
      </section>

      <section className="inputArea">
        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="美咲に話しかける..."
          disabled={loading}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
        >
          {loading
            ? "送信中..."
            : "送信"}
        </button>
      </section>
    </main>
  );
}
