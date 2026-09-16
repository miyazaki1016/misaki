import type { ReactNode } from "react";
import AnonymousSessionGuard from "./anonymous-session-guard";
import ConversationHistorySync from "./conversation-history-sync";
import AccountMenuLink from "./account-menu-link";
import ProactivePhotoDisplay from "./proactive-photo-display";
import ChatTimestampDisplay from "./chat-timestamp-display";
import InitialChatScroll from "./initial-chat-scroll";
import FloatingMenuButton from "./floating-menu-button";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnonymousSessionGuard />
      <ConversationHistorySync />
      <AccountMenuLink />
      <ProactivePhotoDisplay />
      <ChatTimestampDisplay />
      <InitialChatScroll />
      <FloatingMenuButton />

      <style>{`
        .shell .chat [data-misaki-proactive-photo="true"] {
          margin-left: 45px !important;
        }

        @media (display-mode: browser) {
          .shell .chat {
            padding-bottom: 106px !important;
          }
        }

        @media (display-mode: standalone) {
          .shell .chat {
            padding-bottom: 126px !important;
          }
        }

        .shell .misakiMenu {
          position: fixed !important;
          top: calc(64px + env(safe-area-inset-top)) !important;
          right: 12px !important;
          z-index: 1001 !important;
        }

        .shell .menuBackdrop {
          position: fixed !important;
          z-index: 1000 !important;
        }

        @media (min-width: 700px) and (max-width: 1399px) {
          .shell {
            max-width: min(90vw, 1040px) !important;
          }

          .shell .inputArea {
            width: min(90vw, 1040px) !important;
          }

          .shell .chat .bubble:not(.user):not(.typingBubble) {
            width: calc(100% - 90px);
            max-width: calc(100% - 90px);
          }

          .shell .chat [data-misaki-proactive-photo="true"] {
            width: min(460px, calc(100% - 45px)) !important;
            max-width: calc(100% - 45px) !important;
          }

          .shell .misakiMenu {
            right: calc((100vw - min(90vw, 1040px)) / 2 + 12px) !important;
          }
        }

        @media (min-width: 1400px) {
          .shell {
            max-width: 820px !important;
          }

          .shell .inputArea {
            width: 820px !important;
          }

          .shell .chat .bubble:not(.user):not(.typingBubble) {
            width: calc(100% - 90px);
            max-width: calc(100% - 90px);
          }

          .shell .chat [data-misaki-proactive-photo="true"] {
            width: min(500px, calc(100% - 45px)) !important;
            max-width: calc(100% - 45px) !important;
          }

          .shell .misakiMenu {
            right: calc((100vw - 820px) / 2 + 12px) !important;
          }
        }
      `}</style>

      {children}
    </>
  );
}
