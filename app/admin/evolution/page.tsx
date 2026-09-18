"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type CandidateStatus = "pending" | "approved" | "rejected";

type EvolutionCandidate = {
  id: string;
  trait_key: string;
  current_content: string | null;
  proposed_content: string;
  reason: string;
  confidence: number;
  risk_level: "low" | "medium" | string;
  status: CandidateStatus;
  evidence:
    | { quotes?: string[]; source?: string; analyzer?: string }
    | Record<string, unknown>
    | null;
  created_at: string;
  reviewed_at: string | null;
};

type ChatMessage = {
  role?: string;
  text?: string;
};

type AnalyzeResult = {
  analyzed?: boolean;
  skipped?: boolean;
  reason?: string;
  saved?: number;
  error?: string;
  historySource?: "browser" | "server";
  historyCount?: number;
  userMessageCount?: number;
  memoryCount?: number;
};

type ServerHistoryState = {
  exists?: boolean;
  messageCount?: number;
  userMessageCount?: number;
  memoryCount?: number;
  updatedAt?: string | null;
  error?: string;
};

const CHAT_HISTORY_KEY = "misaki-chat-history";

const TRAIT_LABELS: Record<string, string> = {
  affection_level: "甘さ・愛情表現",
  teasing_level: "からかい方",
  jealousy_level: "嫉妬・拗ね方",
  question_frequency: "質問する頻度",
  name_call_frequency: "名前を呼ぶ頻度",
  directness: "率直さ",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readJsonStorage(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getAccessToken() {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (sessionData.session?.access_token) {
    return sessionData.session.access_token;
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInAnonymously();

  if (signInError) throw signInError;
  const accessToken = signInData.session?.access_token;
  if (!accessToken) {
    throw new Error("ログインセッションを作成できませんでした。");
  }
  return accessToken;
}

export default function EvolutionAdminPage() {
  const [status, setStatus] = useState<CandidateStatus>("pending");
  const [candidates, setCandidates] = useState<EvolutionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [historyCount, setHistoryCount] = useState(0);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);
  const [serverHistoryCount, setServerHistoryCount] = useState(0);
  const [serverUserMessageCount, setServerUserMessageCount] = useState(0);
  const [serverMemoryCount, setServerMemoryCount] = useState(0);
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null);

  const refreshStorageCounts = useCallback(() => {
    const history = readJsonStorage(CHAT_HISTORY_KEY) as ChatMessage[];
    const memory: unknown[] = [];
    setHistoryCount(history.length);
    setUserMessageCount(
      history.filter(
        (item) =>
          item?.role === "user" &&
          typeof item?.text === "string" &&
          item.text.trim().length > 0
      ).length
    );
    setMemoryCount(memory.length);
  }, []);

  const loadServerHistoryState = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/persona/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as ServerHistoryState;

      if (!response.ok) {
        throw new Error(data?.error || "サーバー履歴を確認できませんでした。");
      }

      setServerHistoryCount(
        typeof data.messageCount === "number" ? data.messageCount : 0
      );
      setServerUserMessageCount(
        typeof data.userMessageCount === "number"
          ? data.userMessageCount
          : 0
      );
      setServerMemoryCount(
        typeof data.memoryCount === "number" ? data.memoryCount : 0
      );
      setServerUpdatedAt(data.updatedAt ?? null);
    } catch (error) {
      console.error("Server history state load failed:", error);
      setServerHistoryCount(0);
      setServerUserMessageCount(0);
      setServerMemoryCount(0);
      setServerUpdatedAt(null);
    }
  }, []);

  const loadCandidates = useCallback(async (targetStatus: CandidateStatus) => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `/api/persona/evolution/candidates?status=${targetStatus}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "候補を読み込めませんでした。");
      }
      setCandidates(Array.isArray(data?.candidates) ? data.candidates : []);
    } catch (error) {
      console.error("Evolution candidate load failed:", error);
      setCandidates([]);
      setMessage(
        error instanceof Error ? error.message : "候補を読み込めませんでした。"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorageCounts();
    loadServerHistoryState();
    loadCandidates(status);
  }, [
    status,
    loadCandidates,
    loadServerHistoryState,
    refreshStorageCounts,
  ]);

  const pendingCount = useMemo(
    () => (status === "pending" ? candidates.length : null),
    [status, candidates]
  );

  async function reviewCandidate(
    candidateId: string,
    action: "approve" | "reject"
  ) {
    if (actionId) return;
    setActionId(candidateId);
    setMessage("");

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/persona/evolution/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidateId, action }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "レビューに失敗しました。");
      }

      setCandidates((current) =>
        current.filter((candidate) => candidate.id !== candidateId)
      );
      setMessage(
        action === "approve"
          ? "承認しました。次の美咲の会話からこのユーザー専用traitとして使われます。"
          : "却下しました。人格には反映されません。"
      );
    } catch (error) {
      console.error("Evolution review failed:", error);
      setMessage(
        error instanceof Error ? error.message : "レビューに失敗しました。"
      );
    } finally {
      setActionId(null);
    }
  }

  async function analyzeNow() {
    if (analyzing) return;

    const history = readJsonStorage(CHAT_HISTORY_KEY) as ChatMessage[];
    const memory: unknown[] = [];
    const userCount = history.filter(
      (item) =>
        item?.role === "user" &&
        typeof item?.text === "string" &&
        item.text.trim().length > 0
    ).length;

    setHistoryCount(history.length);
    setUserMessageCount(userCount);
    setMemoryCount(memory.length);

    setAnalyzing(true);

    if (history.length > 0 && userCount > 0) {
      setMessage(
        `分析中です… このブラウザの会話 ${history.length}件（あなた ${userCount}件）を読み込みました。`
      );
    } else if (serverUserMessageCount > 0) {
      setMessage(
        `分析中です… サーバー保存済みの会話 ${serverHistoryCount}件（あなた ${serverUserMessageCount}件）を使います。`
      );
    } else {
      setMessage(
        "分析中です… このブラウザには履歴がないため、サーバー保存履歴を確認しています。"
      );
    }

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/persona/evolution/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ history, memory }),
      });

      const data = (await response.json()) as AnalyzeResult;
      if (!response.ok) {
        throw new Error(data?.error || "分析に失敗しました。");
      }

      const saved = typeof data.saved === "number" ? data.saved : 0;
      const sourceLabel =
        data.historySource === "server" ? "サーバー保存履歴" : "このブラウザ";
      const analyzedHistoryCount =
        typeof data.historyCount === "number" ? data.historyCount : 0;
      const analyzedUserCount =
        typeof data.userMessageCount === "number"
          ? data.userMessageCount
          : 0;

      if (
        data.skipped &&
        data.reason === "insufficient_history"
      ) {
        setMessage(
          "分析できる会話履歴が見つかりませんでした。この匿名ログインには、まだサーバー保存履歴がありません。"
        );
      } else {
        setMessage(
          saved > 0
            ? `分析完了。${sourceLabel}の会話 ${analyzedHistoryCount}件（あなた ${analyzedUserCount}件）から、${saved}件の進化候補を作成しました。`
            : `分析完了。${sourceLabel}の会話 ${analyzedHistoryCount}件（あなた ${analyzedUserCount}件）を確認しましたが、今回は承認待ちにするほど強い進化候補はありませんでした。`
        );
      }

      setStatus("pending");
      await Promise.all([
        loadCandidates("pending"),
        loadServerHistoryState(),
      ]);
    } catch (error) {
      console.error("Evolution manual analysis failed:", error);
      setMessage(
        error instanceof Error ? `分析エラー：${error.message}` : "分析に失敗しました。"
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const buttonStyle = (active = false): React.CSSProperties => ({
    border: active ? "1px solid #2b2624" : "1px solid #ddd3ce",
    borderRadius: 999,
    padding: "10px 15px",
    background: active ? "#2b2624" : "#fff",
    color: active ? "#fff" : "#5f504b",
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f3f1",
        color: "#2b2624",
        padding: "32px 16px 64px",
      }}
    >
      <div style={{ width: "min(980px, 100%)", margin: "0 auto" }}>
        <section
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 16px 50px rgba(42, 31, 27, 0.08)",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 12,
              letterSpacing: "0.08em",
              color: "#8b7770",
              fontWeight: 700,
            }}
          >
            MISAKI PERSONA
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(24px, 5vw, 38px)" }}>
            進化候補レビュー
          </h1>
          <p style={{ margin: "12px 0 0", color: "#74645e", lineHeight: 1.7 }}>
            このブラウザでログイン中のユーザーについて、美咲が提案した関係性の変化を確認します。
            承認した候補だけがユーザー別人格に反映されます。
          </p>

          <div
            style={{
              marginTop: 18,
              padding: "14px 16px",
              borderRadius: 16,
              background: "#f7f2ef",
              lineHeight: 1.7,
              color: "#5e4d47",
            }}
          >
            <strong>このブラウザの会話データ</strong>
            <div>
              会話履歴：{historyCount}件 ／ あなたの発言：{userMessageCount}件 ／ 長期メモ：{memoryCount}件
            </div>
            {userMessageCount === 0 ? (
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                ⚠️ このブラウザには分析できる会話履歴がありません。
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={analyzeNow}
            disabled={analyzing}
            style={{
              marginTop: 18,
              border: 0,
              borderRadius: 999,
              padding: "13px 20px",
              background: "#2b2624",
              color: "#fff",
              fontWeight: 700,
              cursor: analyzing ? "default" : "pointer",
              opacity: analyzing ? 0.65 : 1,
            }}
          >
            {analyzing ? "分析中…" : "今すぐ分析"}
          </button>

          <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
            {(
              [
                ["pending", "承認待ち"],
                ["approved", "承認済み"],
                ["rejected", "却下済み"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                style={buttonStyle(status === value)}
              >
                {label}
                {value === "pending" && pendingCount !== null
                  ? ` (${pendingCount})`
                  : ""}
              </button>
            ))}
          </div>

          {message ? (
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 14,
                background: "#eee6e2",
                color: "#4f403b",
                lineHeight: 1.7,
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          ) : null}
        </section>

        <section style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {loading ? (
            <div style={{ padding: 28, borderRadius: 20, background: "#fff", color: "#7a6963", textAlign: "center" }}>
              読み込み中…
            </div>
          ) : candidates.length === 0 ? (
            <div style={{ padding: 28, borderRadius: 20, background: "#fff", color: "#7a6963", textAlign: "center" }}>
              {status === "pending"
                ? "現在、承認待ちの進化候補はありません。"
                : status === "approved"
                  ? "承認済みの進化候補はありません。"
                  : "却下済みの進化候補はありません。"}
            </div>
          ) : (
            candidates.map((candidate) => {
              const quotes =
                candidate.evidence &&
                "quotes" in candidate.evidence &&
                Array.isArray(candidate.evidence.quotes)
                  ? candidate.evidence.quotes.filter((q): q is string => typeof q === "string")
                  : [];

              return (
                <article
                  key={candidate.id}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    padding: 20,
                    boxShadow: "0 8px 28px rgba(42, 31, 27, 0.05)",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {TRAIT_LABELS[candidate.trait_key] ?? candidate.trait_key}
                  </div>
                  <div style={{ marginTop: 12, lineHeight: 1.7 }}>
                    <strong>現在：</strong>{candidate.current_content || "未設定"}
                  </div>
                  <div style={{ marginTop: 8, lineHeight: 1.7 }}>
                    <strong>提案：</strong>{candidate.proposed_content}
                  </div>
                  <div style={{ marginTop: 8, color: "#6e5c56", lineHeight: 1.7 }}>
                    {candidate.reason}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, color: "#8a7770" }}>
                    confidence {Math.round(candidate.confidence * 100)}% ／ risk {candidate.risk_level} ／ 作成 {formatDateTime(candidate.created_at)}
                  </div>

                  {quotes.length > 0 ? (
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "#f7f3f1" }}>
                      <strong>根拠</strong>
                      {quotes.map((quote, index) => (
                        <div key={`${candidate.id}-quote-${index}`} style={{ marginTop: 6, lineHeight: 1.6 }}>
                          「{quote}」
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {status === "pending" ? (
                    <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={Boolean(actionId)}
                        onClick={() => reviewCandidate(candidate.id, "approve")}
                        style={{ ...buttonStyle(true), opacity: actionId ? 0.6 : 1 }}
                      >
                        {actionId === candidate.id ? "処理中…" : "承認する"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(actionId)}
                        onClick={() => reviewCandidate(candidate.id, "reject")}
                        style={{ ...buttonStyle(false), opacity: actionId ? 0.6 : 1 }}
                      >
                        却下する
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, fontSize: 13, color: "#8a7770" }}>
                      レビュー：{formatDateTime(candidate.reviewed_at)}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
