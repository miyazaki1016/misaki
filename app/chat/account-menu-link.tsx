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

      if (oldLink) {
        oldLink.remove();
      }

      const accountLink =
        document.createElement("a");

      accountLink.href = "/account";
      accountLink.setAttribute(
        ACCOUNT_LINK_ATTR,
        "true"
      );
      accountLink.setAttribute(
        "aria-label",
        "アカウント・ログイン画面へ"
      );

      // page.tsx のメニューCSSはReact側の要素にだけ効くため、
      // この追加項目は既存メニューと同じ見た目をinline styleで再現する。
      Object.assign(accountLink.style, {
        display: "flex",
        alignItems: "center",
        gap: "18px",
        width: "100%",
        minHeight: "82px",
        padding: "14px 28px",
        background: "transparent",
        border: "0",
        borderTop: "1px solid rgba(108, 92, 98, 0.10)",
        color: "#49383e",
        textDecoration: "none",
        textAlign: "left",
        boxSizing: "border-box",
        WebkitTapHighlightColor: "transparent",
      });

      const icon =
        document.createElement("span");

      icon.textContent = "◎";

      Object.assign(icon.style, {
        width: "48px",
        height: "48px",
        flex: "0 0 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#fff0f3",
        color: "#ff6680",
        fontSize: "25px",
        lineHeight: "1",
      });

      const text =
        document.createElement("span");

      Object.assign(text.style, {
        minWidth: "0",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      });

      const title =
        document.createElement("strong");

      title.textContent =
        "アカウント・ログイン";

      Object.assign(title.style, {
        display: "block",
        color: "#49383e",
        fontSize: "17px",
        lineHeight: "1.35",
        fontWeight: "800",
        textDecoration: "none",
      });

      const description =
        document.createElement("small");

      description.textContent =
        "美咲の保存・ログイン・端末引き継ぎ";

      Object.assign(description.style, {
        display: "block",
        color: "#9a8b90",
        fontSize: "12px",
        lineHeight: "1.45",
        fontWeight: "400",
        textDecoration: "none",
      });

      text.append(title, description);
      accountLink.append(icon, text);

      const topPageLink =
        Array.from(
          menu.querySelectorAll<HTMLAnchorElement>(
            ":scope > a"
          )
        ).find(
          (link) =>
            link.getAttribute("href") === "/"
        );

      if (topPageLink) {
        menu.insertBefore(
          accountLink,
          topPageLink
        );
      } else {
        menu.appendChild(accountLink);
      }
    };

    ensureAccountLink();

    const observer =
      new MutationObserver(() => {
        const menu =
          document.querySelector(".misakiMenu");

        if (
          menu &&
          !menu.querySelector(
            `[${ACCOUNT_LINK_ATTR}="true"]`
          )
        ) {
          ensureAccountLink();
        }
      });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
