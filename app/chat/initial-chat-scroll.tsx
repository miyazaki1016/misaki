"use client";

import { useEffect } from "react";

// The document (not .chat) is the scroll container on this page.
// Never use a timer that can pull someone away from older messages.
const BOTTOM_THRESHOLD = 100;

function scrollingElement(): Element {
  return document.scrollingElement ?? document.documentElement;
}

function distanceFromBottom(): number {
  const element = scrollingElement();
  return element.scrollHeight - element.clientHeight - element.scrollTop;
}

function toBottom(): void {
  const element = scrollingElement();
  element.scrollTop = element.scrollHeight;
}

export default function InitialChatScroll() {
  useEffect(() => {
    let disposed = false;
    let initialized = false;
    let following = true;
    let userScrolling = false;
    let frame = 0;
    let pending = false;
    let previousHeight = scrollingElement().scrollHeight;

    const chat = document.querySelector<HTMLElement>(".shell .chat");
    if (!chat) return;

    const schedule = () => {
      if (disposed || pending || !following) return;
      pending = true;
      frame = window.requestAnimationFrame(() => {
        pending = false;
        if (!disposed && following) toBottom();
      });
    };

    // Only a real user gesture cancels initial positioning. Programmatic
    // scrolls from images, font loading and Safari viewport resizing do not.
    const userIntent = () => {
      userScrolling = true;
      if (!initialized) {
        initialized = true;
        following = false;
      } else {
        following = distanceFromBottom() <= BOTTOM_THRESHOLD;
      }
    };

    const onScroll = () => {
      if (!initialized || !userScrolling) return;
      following = distanceFromBottom() <= BOTTOM_THRESHOLD;
    };

    const onMutation = () => {
      const hasConversation = Boolean(chat.querySelector(".bubble:not(.typingBubble)"));
      if (!initialized && hasConversation) {
        initialized = true;
        following = true;
        schedule();
      } else if (initialized && following) {
        schedule();
      }
    };

    // ResizeObserver handles text reflow, images and font metrics. Only keep
    // following if the reader was already at the latest messages.
    const resize = new ResizeObserver(() => {
      const height = scrollingElement().scrollHeight;
      if (height !== previousHeight) {
        previousHeight = height;
        if (initialized && following) schedule();
      }
    });
    resize.observe(chat);
    const mutation = new MutationObserver(onMutation);
    mutation.observe(chat, { childList: true, subtree: true, characterData: true });
    onMutation();

    const viewport = window.visualViewport;
    const onViewportResize = () => {
      if (initialized && following) schedule();
    };
    viewport?.addEventListener("resize", onViewportResize);
    window.addEventListener("resize", onViewportResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", userIntent, { passive: true });
    window.addEventListener("touchstart", userIntent, { passive: true });
    window.addEventListener("pointerdown", userIntent, { passive: true });
    window.addEventListener("keydown", userIntent);
    document.fonts?.ready.then(() => {
      if (!disposed && initialized && following) schedule();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      viewport?.removeEventListener("resize", onViewportResize);
      window.removeEventListener("resize", onViewportResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", userIntent);
      window.removeEventListener("touchstart", userIntent);
      window.removeEventListener("pointerdown", userIntent);
      window.removeEventListener("keydown", userIntent);
    };
  }, []);
  return null;
}
