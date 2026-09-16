"use client";

import { useEffect, useState } from "react";

export default function FloatingMenuButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let retryTimer = 0;

    const setup = () => {
      const header = document.querySelector<HTMLElement>(".misakiChatHeader");

      if (!header) {
        retryTimer = window.setTimeout(setup, 150);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        {
          threshold: 0.15,
        }
      );

      observer.observe(header);
    };

    setup();

    return () => {
      observer?.disconnect();
      window.clearTimeout(retryTimer);
    };
  }, []);

  const openMenu = () => {
    const originalButton =
      document.querySelector<HTMLButtonElement>(
        ".misakiChatHeader .menuButton"
      );

    originalButton?.click();
  };

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="メニュー"
      onClick={openMenu}
      style={{
        position: "fixed",
        top: "calc(12px + env(safe-area-inset-top))",
        right: "max(14px, calc((100vw - min(100vw, 820px)) / 2 + 14px))",
        zIndex: 60,
        width: 44,
        height: 44,
        padding: 0,
        border: "1px solid rgba(108, 92, 98, 0.08)",
        borderRadius: "50%",
        background: "rgba(255, 250, 250, 0.96)",
        boxShadow: "0 8px 24px rgba(73, 48, 57, 0.16)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#6c5c62",
        }}
      />
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#6c5c62",
        }}
      />
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#6c5c62",
        }}
      />
    </button>
  );
}
