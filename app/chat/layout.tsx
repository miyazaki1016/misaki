import type { ReactNode } from "react";
import ConversationHistorySync from "./conversation-history-sync";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <ConversationHistorySync />
      {children}
    </>
  );
}
