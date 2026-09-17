"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { bindDeviceUser, clearMisakiDeviceData, DEVICE_USER_KEY, EMAIL_SAVE_USER_KEY } from "../../lib/device-conversation";

const AUTH_KIND_KEY = "misaki-auth-kind";
const BROWSER_SESSION_KEY = "misaki-browser-session";

export default function AnonymousSessionGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useLayoutEffect(() => {
    let active = true;
    let initialized = false;

    async function reconcileAuth() {
      try {
        const hadBrowserSession = sessionStorage.getItem(BROWSER_SESSION_KEY) === "1";
        const lastAuthKind = localStorage.getItem(AUTH_KIND_KEY);
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;
        let user = data.session?.user ?? null;
        const pendingSave = user && localStorage.getItem(EMAIL_SAVE_USER_KEY) === user.id;

        // Supabase の匿名セッション自体は localStorage に残るため、
        // ブラウザを閉じた後の新規セッションでは匿名認証も作り直す。
        if (!user || (!hadBrowserSession && lastAuthKind === "anonymous" && user.is_anonymous && !pendingSave)) {
          clearMisakiDeviceData();
          if (user) {
            const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
            if (signOutError) throw signOutError;
          }
          if (!active) return;
          const { data: anonymousData, error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
          if (!active) return;
          user = anonymousData.user;
        }

        if (user) {
          if (!localStorage.getItem(DEVICE_USER_KEY) && !user.is_anonymous) clearMisakiDeviceData();
          bindDeviceUser(user.id);
          localStorage.setItem(
            AUTH_KIND_KEY,
            user.is_anonymous ? "anonymous" : "permanent"
          );
          sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
          initialized = true;
          setReady(true);
        }
      } catch (error) {
        console.error("ANONYMOUS SESSION GUARD ERROR:", error);
        if (active) setFailed(true);
      }
    }

    void reconcileAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !initialized) return;
      const user = session?.user;
      if (event === "SIGNED_OUT" || (user && localStorage.getItem(DEVICE_USER_KEY) !== user.id)) {
        clearMisakiDeviceData();
        window.location.reload();
        return;
      }
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

  if (!ready) return <main>{failed ? "アカウントを確認できませんでした。画面を再読み込みしてください。" : "アカウントを確認しています…"}</main>;
  return <>{children}</>;
}
