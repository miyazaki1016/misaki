"use client";

import { useState } from "react";

type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "misaki",
      text: "おかえり😊 今日は乗務？それとも明け？",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text,
      },
    ]);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const details = [
          data?.error,
          data?.type ? `type: ${data.type}` : "",
          data?.code ? `code: ${data.code}` : "",
          data?.status ? `status: ${data.status}` : "",
        ]
          .filter(Boolean)
          .join(" / ");

        throw new Error(details || `HTTP ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "misaki",
          text: data.reply || "返事を取得できませんでした。",
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "misaki",
          text: `エラー: ${error?.message || "不明なエラー"}`,
        },
      ]);
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

        {loading && (
          <div className="bubble">
            美咲が考え中…
          </div>
        )}
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
