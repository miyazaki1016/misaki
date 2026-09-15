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
      {children}
    </>
  );
}
