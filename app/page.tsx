"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

const STORAGE_KEY = "misaki-chat-history";
const MEMORY_KEY = "misaki-long-term-memory";
const PROACTIVE_KEY = "misaki-proactive-state";

const MAX_MESSAGES = 60;

// 10分ごとに、美咲から話しかける条件を確認
const PROACTIVE_CHECK_MS = 10 * 60 * 1000;

// 自発メッセージ同士は最低45分空ける
const PROACTIVE_COOLDOWN_MS = 45 * 60 * 1000;

// 1日最大4回
const MAX_PROACTIVE_PER_DAY = 4;

// 最初は空画面
const INITIAL_MESSAGES: ChatMessage[] = [];

function getJapanDateKey() {
  return new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getJapanCurrentTime() {
  return new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour:
