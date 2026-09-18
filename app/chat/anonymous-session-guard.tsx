"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { bindDeviceUser, clearMisakiDeviceData, DEVICE_USER_KEY, EMAIL_SAVE_USER_KEY } from "../../lib/device-conversation";

const AUTH_KIND_KEY = "misaki-auth-kind";
const BROWSER_SESSION_KEY = "misaki-browser-session";
// This marker intentionally does not use the misaki- prefix because
// clearMisakiDeviceData() removes every misaki-* key.
const LEGACY_OWNERLESS_CLEANUP_KEY = "legacy-ownerless-cache-cleanup-v1";

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
        const deviceOwner = localStorage.getItem(DEVICE_USER_KEY);
        const pendingOwner = localStorage.getItem(EMAIL_SAVE_USER_KEY);
        const legacyCleanupDone = localStorage.getItem(LEGACY_OWNERLESS_CLEANUP_KEY) === "1";
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;
        let user = data.session?.user ?? null;
        const pendingSave = Boolean(user && pendingOwner === user.id);

        // Old builds could leave conversation/memory behind without an owner marker.
        // Clean that legacy state only once. After this browser has been migrated,
        // a temporarily missing owner marker must never erase a live conversation.
        if (!legacyCleanupDone) {
          if (!deviceOwner && !pendingSave) {
            clearMisakiDeviceData();
          }
          localStorage.setItem(LEGACY_OWNERLESS_CLEANUP_KEY, "1");
        }

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

    let recoveringAnonymous = false;

    async function recoverAnonymousSessionPreservingCache() {
      if (!active || recoveringAnonymous) return;
      recoveringAnonymous = true;

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;

        let user = data.session?.user ?? null;

        if (!user) {
          const { data: anonymousData, error: signInError } =
            await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
          if (!active) return;
          user = anonymousData.user;
        }

        if (user?.is_anonymous) {
          // Safari などで匿名セッションが一時的に外れても、
          // 進行中の会話・記憶はブラウザ内に残す。
          // bindDeviceUser() は owner 差分時にキャッシュを消すため、
          // この回復経路では owner だけを安全に付け替える。
          localStorage.setItem(DEVICE_USER_KEY, user.id);
          localStorage.setItem(AUTH_KIND_KEY, "anonymous");
          sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
        }
      } catch (error) {
        console.error("ANONYMOUS SESSION RECOVERY ERROR:", error);
      } finally {
        recoveringAnonymous = false;
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !initialized) return;
      const user = session?.user;
      const authKind = localStorage.getItem(AUTH_KIND_KEY);
      const owner = localStorage.getItem(DEVICE_USER_KEY);

      if (event === "SIGNED_OUT") {
        if (authKind === "anonymous") {
          // 匿名利用中の一時的な SIGNED_OUT でページを再読み込みすると、
          // 送信中の返答とブラウザ内だけの会話が失われる。
          // 明示的な恒久アカウントのログアウトは account/page.tsx 側で
          // clear + navigation しているので、ここでは匿名だけ回復させる。
          window.setTimeout(() => {
            void recoverAnonymousSessionPreservingCache();
          }, 0);
          return;
        }

        clearMisakiDeviceData();
        window.location.reload();
        return;
      }

      if (user && owner !== user.id) {
        if (user.is_anonymous && authKind === "anonymous") {
          // 匿名セッションが同一ブラウザ内で差し替わった場合も、
          // 会話を消さず新しい匿名 owner に付け替える。
          localStorage.setItem(DEVICE_USER_KEY, user.id);
        } else {
          clearMisakiDeviceData();
          window.location.reload();
          return;
        }
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
