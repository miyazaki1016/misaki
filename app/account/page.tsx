"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type Mode = "save" | "login";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function clearMisakiDeviceData() {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("misaki-")) localStorage.removeItem(key);
  }
  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith("misaki-")) sessionStorage.removeItem(key);
  }
}

function isExistingAccountError(error: any) {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return [
    "already registered",
    "already exists",
    "email exists",
    "email_exists",
    "email_conflict",
    "identity_already_exists",
    "already associated",
    "already linked",
  ].some((value) => text.includes(value));
}

function authError(error: any) {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (text.includes("rate limit") || error?.status === 429) {
    return "メール送信回数の上限に達しています。少し時間をおいてからもう一度お試しください。";
  }
  if (text.includes("expired")) return "コードの有効期限が切れています。新しいメールを送り直してください。";
  if (text.includes("invalid otp") || text.includes("invalid token")) {
    return "ログインコードが正しくないか、すでに無効です。最新のメールを確認してください。";
  }
  return typeof error?.message === "string"
    ? error.message
    : "処理できませんでした。少し時間をおいてもう一度お試しください。";
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode>("save");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const isAnonymous = user?.is_anonymous === true;
  const isPermanent = Boolean(user && !user.is_anonymous);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        let currentUser = data.session?.user ?? null;

        if (!currentUser) {
          const { data: anonymous, error: anonymousError } =
            await supabase.auth.signInAnonymously();
          if (anonymousError) throw anonymousError;
          currentUser = anonymous.user ?? null;
        }

        if (active) {
          setUser(currentUser);
          setMode(currentUser && !currentUser.is_anonymous ? "login" : "save");
        }
      } catch (error) {
        console.error("ACCOUNT INIT ERROR:", error);
        if (active) setMessage("アカウント状態を確認できませんでした。");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function saveByEmail() {
    const nextEmail = normalizeEmail(email);
    if (!nextEmail) return setMessage("メールアドレスを入力してください。");
    if (!isAnonymous) return setMessage("この美咲はすでに保存されています。");

    setWorking(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser(
        { email: nextEmail },
        { emailRedirectTo: `${window.location.origin}/account` }
      );
      if (error) throw error;
      setMessage(
        "確認メールを送りました。確認が完了すると、ここまでの会話・記憶をこのメールアドレスの美咲として保存します。"
      );
    } catch (error: any) {
      if (isExistingAccountError(error)) {
        setMode("login");
        setMessage("このメールアドレスには保存済みの美咲があります。ログインしてください。");
      } else {
        setMessage(authError(error));
      }
    } finally {
      setWorking(false);
    }
  }

  async function sendLoginOtp() {
    const nextEmail = normalizeEmail(email);
    if (!nextEmail) return setMessage("メールアドレスを入力してください。");

    setWorking(true);
    setMessage("");
    setOtpSent(false);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: nextEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw error;
      setOtpSent(true);
      setMessage("ログイン認証コードをメールに送りました。");
    } catch (error: any) {
      setMessage(authError(error));
    } finally {
      setWorking(false);
    }
  }

  async function verifyLoginOtp() {
    const nextEmail = normalizeEmail(email);
    const token = otp.replace(/\D/g, "").slice(0, 6);
    if (!nextEmail || token.length !== 6) {
      return setMessage("メールアドレスと6桁のコードを確認してください。");
    }

    setWorking(true);
    setMessage("");
    try {
      // 別の匿名美咲の一時データを、既存アカウントへ混ぜない。
      clearMisakiDeviceData();
      const { error } = await supabase.auth.verifyOtp({
        email: nextEmail,
        token,
        type: "email",
      });
      if (error) throw error;
      window.location.href = "/chat";
    } catch (error: any) {
      setMessage(authError(error));
      setWorking(false);
    }
  }

  async function signOut() {
    setWorking(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      clearMisakiDeviceData();
      window.location.href = "/chat";
    } catch (error: any) {
      setMessage(authError(error));
      setWorking(false);
    }
  }

  if (loading) {
    return <main style={styles.page}><section style={styles.card}>アカウントを確認しています…</section></main>;
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.eyebrow}>MISAKI ACCOUNT</div>
        <h1 style={styles.title}>美咲を保存・ログイン</h1>
        <p style={styles.lead}>
          未ログイン中の美咲は一時利用です。メールで保存すると、ブラウザを閉じても会話や記憶を引き継げます。
        </p>

        <div style={styles.statusBox}>
          <strong>現在の状態</strong>
          <div style={{ marginTop: 6 }}>
            {isPermanent
              ? `${user?.email ?? "保存済みアカウント"} でログイン中`
              : "未ログイン・一時利用中"}
          </div>
        </div>

        {isPermanent ? (
          <>
            <a href="/chat" style={styles.primaryLink}>美咲とのトークへ戻る</a>
            <button type="button" onClick={signOut} disabled={working} style={styles.secondaryButton}>
              {working ? "ログアウト中…" : "ログアウト"}
            </button>
            <p style={styles.note}>ログアウトすると、この端末に残っている美咲の会話・記憶・キャッシュを消去します。保存済みデータは再ログインすれば戻ります。</p>
          </>
        ) : (
          <>
            <div style={styles.tabs}>
              <button type="button" onClick={() => { setMode("save"); setMessage(""); setOtpSent(false); }} style={{ ...styles.tabButton, ...(mode === "save" ? styles.tabActive : {}) }}>
                メールで保存
              </button>
              <button type="button" onClick={() => { setMode("login"); setMessage(""); setOtpSent(false); }} style={{ ...styles.tabButton, ...(mode === "login" ? styles.tabActive : {}) }}>
                ログイン
              </button>
            </div>

            <p style={styles.note}>
              {mode === "save"
                ? "今の一時的な美咲を残したい場合は、メールアドレスで保存してください。"
                : "すでに保存している美咲を呼び戻します。"}
            </p>

            <label style={styles.label}>
              メールアドレス
              <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={styles.input} />
            </label>

            {mode === "save" ? (
              <button type="button" disabled={working} onClick={saveByEmail} style={styles.primaryButton}>
                {working ? "送信中…" : "メールで保存する"}
              </button>
            ) : (
              <>
                <button type="button" disabled={working} onClick={sendLoginOtp} style={styles.primaryButton}>
                  {working ? "送信中…" : "ログインメールを送る"}
                </button>
                {otpSent ? (
                  <div style={{ marginTop: 18 }}>
                    <label style={styles.label}>
                      6桁のログイン認証コード
                      <input type="text" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" style={{ ...styles.input, letterSpacing: 6, fontSize: 22, textAlign: "center" }} />
                    </label>
                    <button type="button" disabled={working || otp.length !== 6} onClick={verifyLoginOtp} style={styles.primaryButton}>このコードでログイン</button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}

        {message ? <div style={styles.message}>{message}</div> : null}
        <div style={styles.footerLinks}><a href="/chat" style={styles.textLink}>トークに戻る</a></div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", padding: "32px 16px", background: "linear-gradient(180deg, #fff8f6 0%, #f8efec 100%)", color: "#392d29", fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif' },
  card: { maxWidth: 560, margin: "0 auto", padding: "28px 22px", background: "rgba(255,255,255,0.92)", borderRadius: 24, boxShadow: "0 16px 50px rgba(82, 51, 42, 0.10)" },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#a56d5f" },
  title: { margin: "8px 0 10px", fontSize: 28, lineHeight: 1.35 },
  lead: { margin: 0, color: "#6c5c57", lineHeight: 1.8 },
  statusBox: { marginTop: 22, padding: "14px 16px", borderRadius: 16, background: "#f7f0ed", lineHeight: 1.7 },
  tabs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 22, padding: 5, borderRadius: 16, background: "#f3ebe8" },
  tabButton: { border: 0, borderRadius: 12, padding: "11px 8px", background: "transparent", color: "#735d56", fontWeight: 700, cursor: "pointer" },
  tabActive: { background: "#ffffff", color: "#4b3731", boxShadow: "0 4px 14px rgba(65, 43, 35, 0.08)" },
  note: { margin: "18px 0", color: "#6c5c57", lineHeight: 1.8, fontSize: 14 },
  label: { display: "block", fontSize: 14, fontWeight: 700 },
  input: { boxSizing: "border-box", width: "100%", marginTop: 8, padding: "13px 14px", border: "1px solid #ddcfca", borderRadius: 13, background: "#fff", color: "#332824", outline: "none" },
  primaryButton: { width: "100%", marginTop: 14, padding: "14px 16px", border: 0, borderRadius: 14, background: "#7a4d43", color: "#fff", fontWeight: 800, cursor: "pointer" },
  primaryLink: { display: "block", marginTop: 18, padding: "14px 16px", borderRadius: 14, background: "#7a4d43", color: "#fff", textDecoration: "none", textAlign: "center", fontWeight: 800 },
  secondaryButton: { width: "100%", marginTop: 10, padding: "12px 16px", border: "1px solid #ddcfca", borderRadius: 14, background: "#fff", color: "#5d4841", fontWeight: 700, cursor: "pointer" },
  message: { marginTop: 18, padding: "13px 14px", borderRadius: 14, background: "#fff2df", color: "#6d4d22", lineHeight: 1.7, fontSize: 14 },
  footerLinks: { display: "flex", justifyContent: "center", marginTop: 24 },
  textLink: { color: "#87665d", fontSize: 14 },
};
