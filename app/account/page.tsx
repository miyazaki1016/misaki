"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";

type Mode = "save" | "login";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isExistingAccountError(error: any) {
  const rawMessage =
    typeof error?.message === "string" ? error.message.trim() : "";
  const code =
    typeof error?.code === "string" ? error.code.trim().toLowerCase() : "";
  const text = `${code} ${rawMessage}`.toLowerCase();

  return (
    text.includes("already registered") ||
    text.includes("already exists") ||
    text.includes("user already registered") ||
    text.includes("email exists") ||
    text.includes("email_exists") ||
    text.includes("email_conflict") ||
    text.includes("identity_already_exists") ||
    text.includes("identity already exists") ||
    text.includes("already associated") ||
    text.includes("already linked") ||
    text.includes("user with this email") ||
    text.includes("email address is already") ||
    text.includes("email is already")
  );
}

function getAuthErrorMessage(
  error: any,
  action: "save" | "send" | "verify"
) {
  const rawMessage =
    typeof error?.message === "string" ? error.message.trim() : "";
  const code =
    typeof error?.code === "string" ? error.code.trim().toLowerCase() : "";
  const status = typeof error?.status === "number" ? error.status : null;
  const text = `${code} ${rawMessage}`.toLowerCase();

  if (
    text.includes("over_email_send_rate_limit") ||
    text.includes("email rate limit") ||
    text.includes("rate limit") ||
    text.includes("too many requests") ||
    status === 429
  ) {
    return "メール送信回数の上限に達しています。時間をおいてからもう一度お試しください。何度も連続して押さないでください。";
  }

  if (
    text.includes("email_address_not_authorized") ||
    text.includes("email address not authorized") ||
    text.includes("not authorized")
  ) {
    return "このメールアドレスには現在メールを送信できません。SMTP設定またはSupabaseの認証設定を確認してください。";
  }

  if (
    text.includes("manual linking") ||
    text.includes("identity linking")
  ) {
    return "Supabase側で匿名ユーザーのアカウント化設定を確認してください。";
  }

  if (isExistingAccountError(error)) {
    return "このメールアドレスには、すでに保存済みの美咲があります。「既存アカウントでログイン」を使ってください。";
  }

  if (
    text.includes("otp_expired") ||
    text.includes("token has expired") ||
    text.includes("expired")
  ) {
    return action === "verify"
      ? "ログインコードまたはリンクの有効期限が切れています。新しいログインメールを送り直してください。"
      : "認証リンクの有効期限が切れています。新しいメールを送り直してください。";
  }

  if (
    text.includes("otp_disabled") ||
    text.includes("email provider is disabled")
  ) {
    return "Supabase側でメール認証が無効になっています。Authentication の Email provider 設定を確認してください。";
  }

  if (
    text.includes("smtp") ||
    text.includes("sending email") ||
    text.includes("email sending")
  ) {
    return "メール送信処理でエラーが発生しました。少し時間をおいてもう一度お試しください。";
  }

  if (
    text.includes("for security purposes") ||
    text.includes("only request this after")
  ) {
    return "短時間に続けて送信しようとしたため、一時的に制限されています。少し待ってから1回だけ再送してください。";
  }

  if (
    text.includes("invalid otp") ||
    text.includes("invalid token") ||
    text.includes("token is invalid")
  ) {
    return "ログインコードが正しくないか、すでに無効になっています。最新のメールに記載されたコードを確認してください。";
  }

  if (action === "save") {
    return "今の美咲を保存できませんでした。すでに保存済みのメールアドレスなら「既存アカウントでログイン」を使ってください。";
  }

  if (action === "verify") {
    return "ログインを確認できませんでした。最新の6桁コードを確認してください。";
  }

  return "ログインメールを送れませんでした。少し時間をおいてもう一度お試しください。";
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
  const accountEmail = user?.email ?? "";

  const statusText = useMemo(() => {
    if (!user) return "ログイン状態を確認できません";
    if (isAnonymous) return "現在は端末だけに紐づく仮アカウントです";
    return accountEmail
      ? `${accountEmail} で保存されています`
      : "保存済みアカウントです";
  }, [user, isAnonymous, accountEmail]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        let currentUser = data.session?.user ?? null;

        if (!currentUser) {
          const {
            data: signInData,
            error: signInError,
          } = await supabase.auth.signInAnonymously();

          if (signInError) throw signInError;
          currentUser = signInData.user ?? null;
        }

        if (active) {
          setUser(currentUser);

          if (currentUser && !currentUser.is_anonymous) {
            setMode("login");
          }
        }
      } catch (error) {
        console.error("ACCOUNT INIT ERROR:", error);

        if (active) {
          setMessage(
            "アカウント状態を確認できませんでした。少し時間をおいてもう一度お試しください。"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function saveCurrentMisaki() {
    const nextEmail = normalizeEmail(email);

    if (!nextEmail) {
      return setMessage("メールアドレスを入力してください。");
    }

    if (!isAnonymous) {
      return setMessage("この美咲はすでに保存済みです。");
    }

    setWorking(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser(
        { email: nextEmail },
        {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/account`
              : undefined,
        }
      );

      if (error) throw error;

      setMessage(
        "確認メールを送りました。メールの案内に従って確認すると、今の美咲のユーザーIDをそのまま残してアカウント化できます。"
      );
    } catch (error: any) {
      console.error("ACCOUNT SAVE ERROR:", {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        name: error?.name,
      });

      // すでに本アカウントで使われているメールなら、
      // エラー表示だけで終わらせずログイン側へ安全に誘導する。
      if (isExistingAccountError(error)) {
        setMode("login");
        setEmail(nextEmail);
        setOtp("");
        setOtpSent(false);
        setMessage(
          "このメールアドレスには、すでに保存済みの美咲があります。下の「ログインメールを送る」から既存アカウントでログインしてください。今の仮アカウントを新しく保存する必要はありません。"
        );
        return;
      }

      setMessage(getAuthErrorMessage(error, "save"));
    } finally {
      setWorking(false);
    }
  }

  async function sendLoginOtp() {
    const nextEmail = normalizeEmail(email);

    if (!nextEmail) {
      return setMessage("メールアドレスを入力してください。");
    }

    setWorking(true);
    setMessage("");
    setOtpSent(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: nextEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/account`
              : undefined,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      setMessage(
        "ログイン認証コードをメールに送りました。最新のメールに記載された6桁コードを下に入力してください。"
      );
    } catch (error: any) {
      console.error("OTP SEND ERROR:", {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        name: error?.name,
      });

      setMessage(getAuthErrorMessage(error, "send"));
    } finally {
      setWorking(false);
    }
  }

  async function verifyLoginOtp() {
    const nextEmail = normalizeEmail(email);
    const token = otp.replace(/\D/g, "").slice(0, 6);

    if (!nextEmail) {
      return setMessage("メールアドレスを入力してください。");
    }

    if (token.length !== 6) {
      return setMessage("メールに記載された6桁のコードを入力してください。");
    }

    setWorking(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: nextEmail,
        token,
        type: "email",
      });

      if (error) throw error;

      setUser(data.user ?? data.session?.user ?? null);
      setMessage(
        "ログインしました。この端末でも同じ美咲の会話・記憶・進化データを読み込めます。"
      );

      window.setTimeout(() => {
        window.location.href = "/chat";
      }, 700);
    } catch (error: any) {
      console.error("OTP VERIFY ERROR:", {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        name: error?.name,
      });

      setMessage(getAuthErrorMessage(error, "verify"));
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    setWorking(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setOtpSent(false);
      setOtp("");

      setMessage(
        "ログアウトしました。別の保存済み美咲を呼び戻す場合は「既存アカウントでログイン」を使ってください。"
      );
    } catch (error: any) {
      setMessage(
        typeof error?.message === "string"
          ? error.message
          : "ログアウトできませんでした。"
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.small}>アカウントを確認しています…</div>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.eyebrow}>MISAKI ACCOUNT</div>

        <h1 style={styles.title}>美咲をこの先も覚えておく</h1>

        <p style={styles.lead}>
          アカウントにすると、端末を変えても同じ美咲の会話・記憶・進化状態を引き継げます。
        </p>

        <div style={styles.statusBox}>
          <strong>現在の状態</strong>
          <div style={{ marginTop: 6 }}>{statusText}</div>
        </div>

        {isPermanent ? (
          <>
            <div style={styles.successBox}>
              この美咲は保存済みです。別端末では同じメールアドレスでログインしてください。
            </div>

            <a href="/chat" style={styles.primaryLink}>
              美咲とのトークへ戻る
            </a>

            <button
              type="button"
              onClick={signOut}
              disabled={working}
              style={styles.secondaryButton}
            >
              ログアウト
            </button>
          </>
        ) : (
          <>
            <div style={styles.tabs}>
              <button
                type="button"
                onClick={() => {
                  setMode("save");
                  setMessage("");
                  setOtpSent(false);
                  setOtp("");
                }}
                style={{
                  ...styles.tabButton,
                  ...(mode === "save" ? styles.tabActive : {}),
                }}
              >
                今の美咲を保存
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage("");
                  setOtpSent(false);
                  setOtp("");
                }}
                style={{
                  ...styles.tabButton,
                  ...(mode === "login" ? styles.tabActive : {}),
                }}
              >
                既存アカウントでログイン
              </button>
            </div>

            {mode === "save" ? (
              <>
                <p style={styles.note}>
                  この端末で初めて話し始めた美咲を、新しいメールアドレスに保存するときだけ使います。
                  すでに別端末で保存した美咲がある場合は「既存アカウントでログイン」を使ってください。
                </p>

                <label style={styles.label}>
                  メールアドレス
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    style={styles.input}
                  />
                </label>

                <button
                  type="button"
                  disabled={working}
                  onClick={saveCurrentMisaki}
                  style={styles.primaryButton}
                >
                  {working ? "送信中…" : "この美咲を保存する"}
                </button>
              </>
            ) : (
              <>
                <p style={styles.note}>
                  すでに保存した美咲を、この端末に呼び戻します。
                  別端末で使っていた美咲はこちらを選んでください。
                </p>

                <label style={styles.label}>
                  メールアドレス
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    style={styles.input}
                  />
                </label>

                <button
                  type="button"
                  disabled={working}
                  onClick={sendLoginOtp}
                  style={styles.primaryButton}
                >
                  {working ? "送信中…" : "ログインメールを送る"}
                </button>

                {otpSent ? (
                  <div style={{ marginTop: 18 }}>
                    <label style={styles.label}>
                      6桁のログイン認証コード
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          )
                        }
                        placeholder="123456"
                        style={{
                          ...styles.input,
                          letterSpacing: 6,
                          fontSize: 22,
                          textAlign: "center",
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      disabled={working || otp.length !== 6}
                      onClick={verifyLoginOtp}
                      style={styles.primaryButton}
                    >
                      このコードでログイン
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}

        {message ? <div style={styles.message}>{message}</div> : null}

        <div style={styles.footerLinks}>
          <a href="/chat" style={styles.textLink}>
            トークに戻る
          </a>

          <a href="/admin/evolution" style={styles.textLink}>
            進化候補レビュー
          </a>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px 16px",
    background: "linear-gradient(180deg, #fff8f6 0%, #f8efec 100%)",
    color: "#392d29",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif',
  },

  card: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "28px 22px",
    background: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    boxShadow: "0 16px 50px rgba(82, 51, 42, 0.10)",
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    color: "#a56d5f",
  },

  title: {
    margin: "8px 0 10px",
    fontSize: 28,
    lineHeight: 1.35,
  },

  lead: {
    margin: 0,
    color: "#6c5c57",
    lineHeight: 1.8,
  },

  statusBox: {
    marginTop: 22,
    padding: "14px 16px",
    borderRadius: 16,
    background: "#f7f0ed",
    lineHeight: 1.7,
  },

  successBox: {
    marginTop: 18,
    padding: "14px 16px",
    borderRadius: 16,
    background: "#f0f7f1",
    color: "#35533b",
    lineHeight: 1.7,
  },

  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 22,
    padding: 5,
    borderRadius: 16,
    background: "#f3ebe8",
  },

  tabButton: {
    border: 0,
    borderRadius: 12,
    padding: "11px 8px",
    background: "transparent",
    color: "#735d56",
    fontWeight: 700,
    cursor: "pointer",
  },

  tabActive: {
    background: "#ffffff",
    color: "#4b3731",
    boxShadow: "0 4px 14px rgba(65, 43, 35, 0.08)",
  },

  note: {
    margin: "18px 0",
    color: "#6c5c57",
    lineHeight: 1.8,
    fontSize: 14,
  },

  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    marginTop: 8,
    padding: "13px 14px",
    border: "1px solid #ddcfca",
    borderRadius: 13,
    background: "#fff",
    color: "#332824",
    outline: "none",
  },

  primaryButton: {
    width: "100%",
    marginTop: 14,
    padding: "14px 16px",
    border: 0,
    borderRadius: 14,
    background: "#7a4d43",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  primaryLink: {
    display: "block",
    marginTop: 18,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#7a4d43",
    color: "#fff",
    textDecoration: "none",
    textAlign: "center",
    fontWeight: 800,
  },

  secondaryButton: {
    width: "100%",
    marginTop: 10,
    padding: "12px 16px",
    border: "1px solid #ddcfca",
    borderRadius: 14,
    background: "#fff",
    color: "#5d4841",
    fontWeight: 700,
    cursor: "pointer",
  },

  message: {
    marginTop: 18,
    padding: "13px 14px",
    borderRadius: 14,
    background: "#fff2df",
    color: "#6d4d22",
    lineHeight: 1.7,
    fontSize: 14,
  },

  footerLinks: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    marginTop: 24,
    flexWrap: "wrap",
  },

  textLink: {
    color: "#87665d",
    fontSize: 14,
  },

  small: {
    color: "#78655e",
  },
};
