"use client";

import { useEffect } from "react";
import { selectMisakiProactivePhoto } from "../../lib/proactive-photo";

const PROACTIVE_KEY = "misaki-proactive-state";
const RELATIONSHIP_KEY = "misaki-relationship-points";
const PHOTO_STATE_KEY = "misaki-proactive-photo-state";
const RECENT_PHOTO_KEY = "misaki-recent-proactive-photo-ids";

type ProactiveState = {
  lastSentAt?: number;
};

type PhotoState = {
  lastSentAt: number;
  photoId: string;
  src: string;
};

function getLastMisakiBubble() {
  const bubbles = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".chat .bubble:not(.user):not(.typingBubble)"
    )
  );

  return bubbles.at(-1) ?? null;
}

function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readRelationshipPoints() {
  const raw = localStorage.getItem(RELATIONSHIP_KEY);
  const value = Number(raw);

  return Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function readRecentPhotoIds() {
  const parsed = loadJson<unknown>(RECENT_PHOTO_KEY);

  return Array.isArray(parsed)
    ? parsed.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      ).slice(-4)
    : [];
}

function saveRecentPhotoId(photoId: string) {
  const next = [
    ...readRecentPhotoIds().filter((id) => id !== photoId),
    photoId,
  ].slice(-4);

  localStorage.setItem(
    RECENT_PHOTO_KEY,
    JSON.stringify(next)
  );
}

function createPhotoElement(src: string, photoId: string) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-misaki-proactive-photo", "true");
  wrapper.setAttribute("data-photo-id", photoId);

  Object.assign(wrapper.style, {
    width: "min(72%, 330px)",
    margin: "6px 0 14px 0",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(73, 56, 62, 0.10)",
  });

  const image = document.createElement("img");
  image.src = src;
  image.alt = "美咲";
  image.loading = "lazy";

  Object.assign(image.style, {
    display: "block",
    width: "100%",
    height: "auto",
  });

  wrapper.appendChild(image);

  return wrapper;
}

export default function ProactivePhotoDisplay() {
  useEffect(() => {
    let timer = 0;

    const renderIfNeeded = () => {
      const proactive =
        loadJson<ProactiveState>(PROACTIVE_KEY);

      const lastSentAt =
        typeof proactive?.lastSentAt === "number"
          ? proactive.lastSentAt
          : 0;

      if (!lastSentAt) {
        return;
      }

      // 直近2分以内の自発メッセージだけ対象。
      // 通常会話や古い履歴への誤挿入を防ぐ。
      if (Date.now() - lastSentAt > 2 * 60 * 1000) {
        return;
      }

      const savedPhoto =
        loadJson<PhotoState>(PHOTO_STATE_KEY);

      if (
        savedPhoto?.lastSentAt === lastSentAt &&
        document.querySelector(
          `[data-misaki-proactive-photo="true"][data-photo-id="${savedPhoto.photoId}"]`
        )
      ) {
        return;
      }

      const bubble = getLastMisakiBubble();

      if (!bubble) {
        return;
      }

      const reply = bubble.textContent?.trim() ?? "";

      if (!reply) {
        return;
      }

      let selected =
        savedPhoto?.lastSentAt === lastSentAt
          ? {
              id: savedPhoto.photoId,
              src: savedPhoto.src,
            }
          : null;

      if (!selected) {
        selected = selectMisakiProactivePhoto({
          currentTime: new Date().toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          relationshipPoints: readRelationshipPoints(),
          reply,
          recentPhotoIds: readRecentPhotoIds(),
        });

        if (!selected) {
          localStorage.setItem(
            PHOTO_STATE_KEY,
            JSON.stringify({
              lastSentAt,
              photoId: "",
              src: "",
            })
          );
          return;
        }

        const state: PhotoState = {
          lastSentAt,
          photoId: selected.id,
          src: selected.src,
        };

        localStorage.setItem(
          PHOTO_STATE_KEY,
          JSON.stringify(state)
        );

        saveRecentPhotoId(selected.id);
      }

      if (!selected.id || !selected.src) {
        return;
      }

      document
        .querySelectorAll(
          '[data-misaki-proactive-photo="true"]'
        )
        .forEach((node) => node.remove());

      const photoElement = createPhotoElement(
        selected.src,
        selected.id
      );

      bubble.insertAdjacentElement(
        "afterend",
        photoElement
      );
    };

    renderIfNeeded();

    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        renderIfNeeded,
        120
      );
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const interval = window.setInterval(
      renderIfNeeded,
      1000
    );

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
