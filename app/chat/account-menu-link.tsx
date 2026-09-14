"use client";

import { useEffect } from "react";

const ACCOUNT_LINK_ATTR = "data-misaki-account-link";

export default function AccountMenuLink() {
  useEffect(() => {
    const ensureAccountLink = () => {
      const menu =
        document.querySelector<HTMLElement>(
          ".misakiMenu"
        );

      if (!menu) {
        return;
      }

      if (
        menu.querySelector(
          `[${ACCOUNT_LINK_ATTR}="true"]`
        )
      ) {
        return;
      }

      const accountLink =
        document.createElement("a");

      accountLink.href = "/account";
      accountLink.className = "menuItem";
      accountLink.setAttribute(
        ACCOUNT_LINK_ATTR,
        "true"
      );
      accountLink.setAttribute(
        "aria-label",
        "アカウント・ログイン画面へ"
      );

      const icon =
        document.createElement("span");

      icon.className = "menuIcon";
      icon.textContent = "◎";

      const text =
        document.createElement("span");

      const title =
        document.createElement("strong");

      title.textContent =
        "アカウント・ログイン";

      const description =
        document.createElement("small");

      description.textContent =
        "美咲の保存・ログイン・端末引き継ぎ";

      text.append(
        title,
        description
      );

      accountLink.append(
        icon,
        text
      );

      const topPageLink =
        Array.from(
          menu.querySelectorAll<HTMLAnchorElement>(
            ":scope > a.menuItem"
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
        menu.appendChild(
          accountLink
        );
      }
    };

    ensureAccountLink();

    const observer =
      new MutationObserver(() => {
        ensureAccountLink();
      });

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
      }
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
