"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

const STORAGE_KEY = "misaki-chat-history";
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
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-MAX_MESSAGES));
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
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

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      text,
    };

    const newMessages = [...messages, userMessage].slice(-MAX_MESSAGES);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "通信に失敗しました");
      }

      setMessages((prev) =>
        [
          ...prev,
          {
            role: "misaki" as const,
            text: data.reply || "返事を取得できませんでした。",
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
      </section>

      <section className="notice">
        運転中の画面操作はしないでね。安全な場所に停車してから話そう。
      </section>

      <section className="chat">
        {messages.map((item, index) => (
          <div
            key={index}
            className={`bubble ${item.role === "user" ? "user" : ""}`}
          >
            {item.text}
          </div>
        ))}

        {loading && <div className="bubble">美咲が考え中…</div>}
      </section>

      <section className="inputArea">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="美咲に話しかける..."
          disabled={loading}
        />

        <button onClick={sendMessage} disabled={loading}>
          {loading ? "送信中..." : "送信"}
        </button>
      </section>
    </main>
  );
}
