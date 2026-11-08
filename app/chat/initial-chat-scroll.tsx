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
    let touchStartY: number | null = null;
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
      // Respect gestures made before the first history bubble appears.
      following = initialized ? distanceFromBottom() <= BOTTOM_THRESHOLD : false;
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY;
      if (touchStartY === null || currentY === undefined) return;
      if (Math.abs(currentY - touchStartY) < 8) return;
      userIntent();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) userIntent();
    };

    const onScroll = () => {
      if (!initialized || !userScrolling) return;
      following = distanceFromBottom() <= BOTTOM_THRESHOLD;
    };

    const onMutation = () => {
      const hasConversation = Boolean(chat.querySelector(".bubble:not(.typingBubble)"));
      if (!initialized && hasConversation) {
        initialized = true;
        if (!userScrolling) following = true;
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
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
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
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  return null;
}
