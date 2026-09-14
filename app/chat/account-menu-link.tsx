"use client";

import { useEffect } from "react";

const ACCOUNT_LINK_ATTR = "data-misaki-account-link";

export default function AccountMenuLink() {
  useEffect(() => {
    const ensureAccountLink = () => {
      const menu =
        document.querySelector<HTMLElement>(".misakiMenu");

      if (!menu) return;

      const oldLink =
        menu.querySelector<HTMLElement>(
          `[${ACCOUNT_LINK_ATTR}="true"]`
        );

      if (oldLink) oldLink.remove();

      const accountLink = document.createElement("a");
      accountLink.href = "/account";
      accountLink.className = "menuItem";
      accountLink.setAttribute(ACCOUNT_LINK_ATTR, "true");
      accountLink.setAttribute("aria-label", "アカウント・ログイン画面へ");

      Object.assign(accountLink.style, {
        width: "100%",
        minHeight: "59px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        border: "0",
        borderBottom: "1px solid rgba(108, 92, 98, 0.055)",
        background: "transparent",
        color: "#6c5c62",
        textAlign: "left",
        textDecoration: "none",
        cursor: "pointer",
        boxSizing: "border-box",
        WebkitTapHighlightColor: "transparent",
      });

      const icon = document.createElement("span");
      icon.className = "menuIcon";
      icon.textContent = "◎";
      Object.assign(icon.style, {
        width: "31px",
        height: "31px",
        flex: "0 0 31px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#fff0f3",
        color: "#e95872",
        fontSize: "15px",
      });

      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = "アカウント・ログイン";
      Object.assign(title.style, {
        display: "block",
        color: "#55454b",
        fontSize: "13px",
        fontWeight: "700",
        lineHeight: "normal",
        textDecoration: "none",
      });

      const description = document.createElement("small");
      description.textContent = "美咲の保存・ログイン・端末引き継ぎ";
      Object.assign(description.style, {
        display: "block",
        marginTop: "3px",
        color: "#a09297",
        fontSize: "9px",
        lineHeight: "1.35",
        fontWeight: "400",
        textDecoration: "none",
      });

      text.append(title, description);
      accountLink.append(icon, text);

      const topPageLink =
        Array.from(menu.querySelectorAll<HTMLAnchorElement>(":scope > a"))
          .find((link) => link.getAttribute("href") === "/");

      if (topPageLink) {
        menu.insertBefore(accountLink, topPageLink);
      } else {
        menu.appendChild(accountLink);
      }
    };

    ensureAccountLink();

    const observer = new MutationObserver(() => {
      const menu = document.querySelector(".misakiMenu");
      if (
        menu &&
        !menu.querySelector(`[${ACCOUNT_LINK_ATTR}="true"]`)
      ) {
        ensureAccountLink();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
