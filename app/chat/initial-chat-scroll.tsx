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

    const imageLoadHandler = () => {
      if (!active) return;

      window.requestAnimationFrame(() => {
        if (!active) return;
        scrollToLatest();
      });
    };

    const bindPendingImages = () => {
      document
        .querySelectorAll<HTMLImageElement>(
          '.shell .chat img'
        )
        .forEach((image) => {
          if (image.complete) {
            return;
          }

          image.addEventListener(
            "load",
            imageLoadHandler,
            { once: true }
          );
        });
    };

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
      bindPendingImages();

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!active) return;

          scrollToLatest();

          window.clearTimeout(settleTimer);
          settleTimer = window.setTimeout(() => {
            if (!active) return;

            scrollToLatest();
          }, 350);
        });
      });

      if (attempts >= 12) {
        observer?.disconnect();
        observer = null;
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

      bindPendingImages();
      scrollToLatest();
      finish();
    }, 4000);

    return () => {
      active = false;
      finish();

      document
        .querySelectorAll<HTMLImageElement>(
          '.shell .chat img'
        )
        .forEach((image) => {
          image.removeEventListener(
            "load",
            imageLoadHandler
          );
        });
    };
  }, []);

  return null;
}
