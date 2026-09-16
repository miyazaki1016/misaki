import type { ReactNode } from "react";
import AnonymousSessionGuard from "./anonymous-session-guard";
import ConversationHistorySync from "./conversation-history-sync";
import AccountMenuLink from "./account-menu-link";
import ProactivePhotoDisplay from "./proactive-photo-display";
import ChatTimestampDisplay from "./chat-timestamp-display";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnonymousSessionGuard />
      <ConversationHistorySync />
      <AccountMenuLink />
      <ProactivePhotoDisplay />
      <ChatTimestampDisplay />

      <style>{`
        .shell .chat [data-misaki-proactive-photo="true"] {
          margin-left: 45px !important;
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
        }
      `}</style>

      {children}
    </>
  );
}
