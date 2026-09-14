import type { ReactNode } from "react";
import ConversationHistorySync from "./conversation-history-sync";
import AccountMenuLink from "./account-menu-link";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <ConversationHistorySync />
      <AccountMenuLink />
      {children}
    </>
  );
}
