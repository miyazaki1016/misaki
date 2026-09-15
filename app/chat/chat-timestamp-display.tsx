"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

type ServerMessage = {
  role: "user" | "misaki";
  text: string;
  sentAt?: string | null;
};

const POLL_MS = 5_000;
const TOKYO_TZ = "Asia/Tokyo";

function sanitizeHistory(value: unknown): ServerMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is ServerMessage =>
        Boolean(
          item &&
            typeof item === "object" &&
            (((item as ServerMessage).role === "user") ||
              ((item as ServerMessage).role === "misaki")) &&
            typeof (item as ServerMessage).text === "string"
        )
    )
    .map((item) => ({
      role: item.role,
      text: item.text.trim(),
      sentAt:
        typeof item.sentAt === "string" && item.sentAt.trim()
          ? item.sentAt
          : null,
    }))
    .slice(-60);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function dateKey(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TZ,
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getBubbles() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      ".chat .bubble:not(.typingBubble)"
    )
  ).filter(
    (bubble) =>
      bubble.getAttribute("data-misaki-timestamp-helper") !== "true"
  );
}

function clearDecorations() {
  document
    .querySelectorAll('[data-misaki-message-time="true"]')
    .forEach((node) => node.remove());

  document
    .querySelectorAll('[data-misaki-date-divider="true"]')
    .forEach((node) => node.remove());
}

function createTimeLabel(time: string, isUser: boolean) {
  const label = document.createElement("span");
  label.setAttribute("data-misaki-message-time", "true");
  label.textContent = time;

  Object.assign(label.style, {
    display: "block",
    marginTop: "4px",
    color: "#a99ca1",
    fontSize: "9px",
    lineHeight: "1",
    textAlign: isUser ? "right" : "left",
    opacity: "0.9",
  });

  return label;
}

function createDateDivider(text: string) {
  const divider = document.createElement("div");
  divider.setAttribute("data-misaki-date-divider", "true");
  divider.textContent = text;

  Object.assign(divider.style, {
    alignSelf: "center",
    margin: "14px auto 10px",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(108, 92, 98, 0.07)",
    color: "#9a8b90",
    fontSize: "9px",
    lineHeight: "1.3",
    textAlign: "center",
  });

  return divider;
}

function decorate(history: ServerMessage[]) {
  clearDecorations();

  const bubbles = getBubbles();
  if (bubbles.length === 0 || history.length === 0) return;

  let historyCursor = 0;
  let previousDate = "";

  for (const bubble of bubbles) {
    const role: ServerMessage["role"] = bubble.classList.contains("user")
      ? "user"
      : "misaki";
    const text = (bubble.textContent ?? "").trim();

    let matchedIndex = -1;

    for (let i = historyCursor; i < history.length; i += 1) {
      if (history[i].role === role && history[i].text === text) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex < 0) continue;

    const item = history[matchedIndex];
    historyCursor = matchedIndex + 1;

    if (!item.sentAt) continue;

    const time = formatTime(item.sentAt);
    const currentDate = dateKey(item.sentAt);

    if (currentDate && currentDate !== previousDate) {
      const dateText = formatDate(item.sentAt);
      if (dateText) {
        bubble.insertAdjacentElement(
          "beforebegin",
          createDateDivider(dateText)
        );
      }
      previousDate = currentDate;
    }

    if (time) {
      bubble.appendChild(createTimeLabel(time, role === "user"));
    }
  }
}

async function loadHistory() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) return [];

  const response = await fetch("/api/persona/history", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json().catch(() => null);
  return sanitizeHistory(data?.history);
}

export default function ChatTimestampDisplay() {
  useEffect(() => {
    let active = true;
    let renderTimer = 0;

    const refresh = async () => {
      const history = await loadHistory();
      if (!active) return;
      decorate(history);
    };

    const schedule = () => {
      window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(() => {
        void refresh();
      }, 180);
    };

    void refresh();

    const observer = new MutationObserver((mutations) => {
      const onlyOurDecorations = mutations.every((mutation) =>
        Array.from(mutation.addedNodes).every(
          (node) =>
            !(node instanceof HTMLElement) ||
            node.getAttribute("data-misaki-message-time") === "true" ||
            node.getAttribute("data-misaki-date-divider") === "true"
        )
      );

      if (!onlyOurDecorations) schedule();
    });

    const chat = document.querySelector(".chat");
    if (chat) {
      observer.observe(chat, {
        childList: true,
        subtree: true,
      });
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(renderTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearDecorations();
    };
  }, []);

  return null;
}
