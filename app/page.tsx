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
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [memory, setMemory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      const savedMemory = localStorage.getItem(MEMORY_KEY);

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);

        if (
          Array.isArray(parsedMessages) &&
          parsedMessages.length > 0
        ) {
          setMessages(parsedMessages.slice(-MAX_MESSAGES));
        }
      }

      if (savedMemory) {
        const parsedMemory = JSON.parse(savedMemory);

        if (Array.isArray(parsedMemory)) {
          setMemory(
            parsedMemory.filter(
              (item) => typeof item === "string"
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      const limitedMessages = messages.slice(-MAX_MESSAGES);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(limitedMessages)
      );
    } catch (error) {
      console.error("Failed to save chat history:", error);
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
      console.error("Failed to save memory:", error);
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

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      text,
    };

    const newMessages = [...messages, userMessage].slice(
      -MAX_MESSAGES
    );

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
          data?.error || "通信に失敗しました"
        );
      }

      if (Array.isArray(data.memory)) {
        setMemory(
          data.memory.filter(
            (item: unknown) => typeof item === "string"
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

        <button
          onClick={resetChat}
          disabled={loading}
          style={{
            marginLeft: "auto",
            border: "none",
            background: "transparent",
            fontSize: "12px",
            cursor: "pointer",
            opacity: 0.6,
          }}
        >
          会話をリセット
        </button>
      </section>

      <section className="notice">
        運転中の画面操作はしないでね。安全な場所に停車してから話そう。
      </section>

      <section className="chat">
        {messages.map((item, index) => (
          <div
            key={index}
            className={`bubble ${
              item.role === "user" ? "user" : ""
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
          {loading ? "送信中..." : "送信"}
        </button>
      </section>
    </main>
  );
}
