"use client";

import { useEffect } from "react";

function scrollToLatest() {
  const scrollingElement =
    document.scrollingElement ??
    document.documentElement;

  scrollingElement.scrollTop =
    scrollingElement.scrollHeight;
}

export default function InitialChatScroll() {
  useEffect(() => {
    let active = true;
    let observer: MutationObserver | null = null;
    let settleTimer = 0;
    let hardStopTimer = 0;
    let attempts = 0;

    const finish = () => {
      observer?.disconnect();
      observer = null;
      window.clearTimeout(settleTimer);
      window.clearTimeout(hardStopTimer);
    };

    const run = () => {
      if (!active) return;

      const chat =
        document.querySelector<HTMLElement>(".shell .chat");

      if (!chat) return;

      const bubbles = chat.querySelectorAll(
        ".bubble:not(.typingBubble)"
      );

      if (bubbles.length === 0) return;

      attempts += 1;

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!active) return;

          scrollToLatest();

          window.clearTimeout(settleTimer);
          settleTimer = window.setTimeout(() => {
            if (!active) return;

            scrollToLatest();
            finish();
          }, 350);
        });
      });

      if (attempts >= 8) {
        finish();
      }
    };

    run();

    observer = new MutationObserver(() => {
      run();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    hardStopTimer = window.setTimeout(() => {
      if (!active) return;

      scrollToLatest();
      finish();
    }, 2500);

    return () => {
      active = false;
      finish();
    };
  }, []);

  return null;
}
