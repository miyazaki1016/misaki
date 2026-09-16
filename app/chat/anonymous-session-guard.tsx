"use client";

import { useLayoutEffect } from "react";
import { supabase } from "../../lib/supabase";

const AUTH_KIND_KEY = "misaki-auth-kind";
const BROWSER_SESSION_KEY = "misaki-browser-session";

function clearMisakiLocalData() {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("misaki-") && key !== AUTH_KIND_KEY) {
      localStorage.removeItem(key);
    }
  }

  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith("misaki-")) {
      sessionStorage.removeItem(key);
    }
  }
}

export default function AnonymousSessionGuard() {
  useLayoutEffect(() => {
    let active = true;

    const hadBrowserSession = sessionStorage.getItem(BROWSER_SESSION_KEY) === "1";
    const lastAuthKind = localStorage.getItem(AUTH_KIND_KEY);

    // 前回が匿名利用で、ブラウザセッションが終了している場合は
    // 匿名会話・記憶・進化キャッシュを新しいセッションへ持ち越さない。
    if (!hadBrowserSession && lastAuthKind === "anonymous") {
      clearMisakiLocalData();
      localStorage.removeItem(AUTH_KIND_KEY);
    }

    sessionStorage.setItem(BROWSER_SESSION_KEY, "1");

    async function reconcileAuth() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const user = data.session?.user ?? null;

      // Supabase の匿名セッション自体は localStorage に残るため、
      // ブラウザを閉じた後の新規セッションでは匿名認証も作り直す。
      if (!hadBrowserSession && lastAuthKind === "anonymous" && user?.is_anonymous) {
        await supabase.auth.signOut({ scope: "local" });
        if (!active) return;
        const { data: anonymousData } = await supabase.auth.signInAnonymously();
        if (!active) return;
        if (anonymousData.user) {
          localStorage.setItem(AUTH_KIND_KEY, "anonymous");
        }
        return;
      }

      if (user) {
        localStorage.setItem(
          AUTH_KIND_KEY,
          user.is_anonymous ? "anonymous" : "permanent"
        );
      }
    }

    void reconcileAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user;
      if (user) {
        localStorage.setItem(
          AUTH_KIND_KEY,
          user.is_anonymous ? "anonymous" : "permanent"
        );
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
