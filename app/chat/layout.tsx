import type { ReactNode } from "react";
import ConversationHistorySync from "./conversation-history-sync";
import AccountMenuLink from "./account-menu-link";
import ProactivePhotoDisplay from "./proactive-photo-display";
import ChatTimestampDisplay from "./chat-timestamp-display";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
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
        }

        @media (min-width: 1400px) {
          .shell {
            max-width: 820px !important;
          }

          .shell .inputArea {
            width: 820px !important;
          }
        }
      `}</style>

      {children}
    </>
  );
}
