"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    "おかえり😊 今日は乗務？それとも明け？",
  ]);

  function sendMessage() {
    if (!message.trim()) return;

    setMessages([...messages, message]);
    setMessage("");
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
        運転中の画面操作はしないでね。
        安全な場所に停車してから話そう。
      </section>

      <section className="chat">
        {messages.map((text, index) => (
          <div className="bubble" key={index}>
            {text}
          </div>
        ))}
      </section>

      <section className="inputArea">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="美咲に話しかける..."
        />

        <button onClick={sendMessage}>送信</button>
      </section>
    </main>
  );
}
