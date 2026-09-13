"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../../../lib/supabase";

type CandidateStatus =
  | "pending"
  | "approved"
  | "rejected";

type EvolutionCandidate = {
  id: string;
  trait_key: string;
  current_content:
    | string
    | null;
  proposed_content: string;
  reason: string;
  confidence: number;
  risk_level:
    | "low"
    | "medium"
    | string;
  status: CandidateStatus;
  evidence:
    | {
        quotes?: string[];
        source?: string;
        analyzer?: string;
      }
    | Record<string, unknown>
    | null;
  created_at: string;
  reviewed_at:
    | string
    | null;
};

type AnalyzeResult = {
  analyzed?: boolean;
  skipped?: boolean;
  reason?: string;
  saved?: number;
  error?: string;
};

const CHAT_HISTORY_KEY =
  "misaki-chat-history";

const LONG_MEMORY_KEY =
  "misaki-long-term-memory";

const TRAIT_LABELS:
  Record<string, string> = {
  affection_level:
    "甘さ・愛情表現",
  teasing_level:
    "からかい方",
  jealousy_level:
    "嫉妬・拗ね方",
  question_frequency:
    "質問する頻度",
  name_call_frequency:
    "名前を呼ぶ頻度",
  directness:
    "率直さ",
};

function formatDateTime(
  value:
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "ja-JP",
    {
      timeZone:
        "Asia/Tokyo",
      year:
        "numeric",
      month:
        "2-digit",
      day:
        "2-digit",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  );
}

function readJsonStorage(
  key: string
) {
  try {
    const raw =
      localStorage.getItem(
        key
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

async function getAccessToken() {
  const {
    data:
      sessionData,
    error:
      sessionError,
  } =
    await supabase.auth
      .getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (
    sessionData.session
      ?.access_token
  ) {
    return sessionData
      .session
      .access_token;
  }

  const {
    data:
      signInData,
    error:
      signInError,
  } =
    await supabase.auth
      .signInAnonymously();

  if (signInError) {
    throw signInError;
  }

  const accessToken =
    signInData.session
      ?.access_token;

  if (!accessToken) {
    throw new Error(
      "ログインセッションを作成できませんでした。"
    );
  }

  return accessToken;
}

export default function EvolutionAdminPage() {
  const [
    status,
    setStatus,
  ] =
    useState<
      CandidateStatus
    >(
      "pending"
    );

  const [
    candidates,
    setCandidates,
  ] =
    useState<
      EvolutionCandidate[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    actionId,
    setActionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    analyzing,
    setAnalyzing,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const loadCandidates =
    useCallback(
      async (
        targetStatus:
          CandidateStatus
      ) => {
        setLoading(true);
        setMessage("");

        try {
          const token =
            await getAccessToken();

          const response =
            await fetch(
              `/api/persona/evolution/candidates?status=${targetStatus}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data?.error ||
                "候補を読み込めませんでした。"
            );
          }

          setCandidates(
            Array.isArray(
              data?.candidates
            )
              ? data.candidates
              : []
          );
        } catch (
          error
        ) {
          console.error(
            "Evolution candidate load failed:",
            error
          );

          setCandidates(
            []
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : "候補を読み込めませんでした。"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      loadCandidates(
        status
      );
    },
    [
      status,
      loadCandidates,
    ]
  );

  const pendingCount =
    useMemo(
      () =>
        status ===
        "pending"
          ? candidates.length
          : null,
      [
        status,
        candidates,
      ]
    );

  async function reviewCandidate(
    candidateId: string,
    action:
      | "approve"
      | "reject"
  ) {
    if (actionId) {
      return;
    }

    setActionId(
      candidateId
    );

    setMessage("");

    try {
      const token =
        await getAccessToken();

      const response =
        await fetch(
          "/api/persona/evolution/review",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                candidateId,
                action,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "レビューに失敗しました。"
        );
      }

      setCandidates(
        (
          current
        ) =>
          current.filter(
            (
              candidate
            ) =>
              candidate.id !==
              candidateId
          )
      );

      setMessage(
        action ===
          "approve"
          ? "承認しました。次の美咲の会話からこのユーザー専用traitとして使われます。"
          : "却下しました。人格には反映されません。"
      );
    } catch (
      error
    ) {
      console.error(
        "Evolution review failed:",
        error
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "レビューに失敗しました。"
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  async function analyzeNow() {
    if (analyzing) {
      return;
    }

    setAnalyzing(
      true
    );

    setMessage("");

    try {
      const token =
        await getAccessToken();

      const history =
        readJsonStorage(
          CHAT_HISTORY_KEY
        );

      const memory =
        readJsonStorage(
          LONG_MEMORY_KEY
        );

      const response =
        await fetch(
          "/api/persona/evolution/analyze",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                history,
                memory,
              }),
          }
        );

      const data =
        await response.json() as
          AnalyzeResult;

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "分析に失敗しました。"
        );
      }

      const saved =
        typeof data.saved ===
          "number"
          ? data.saved
          : 0;

      setMessage(
        saved > 0
          ? `${saved}件の進化候補を作成しました。`
          : "今回は承認待ちにするほど強い進化候補はありませんでした。"
      );

      setStatus(
        "pending"
      );

      await loadCandidates(
        "pending"
      );
    } catch (
      error
    ) {
      console.error(
        "Evolution manual analysis failed:",
        error
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "分析に失敗しました。"
      );
    } finally {
      setAnalyzing(
        false
      );
    }
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",
        background:
          "#f6f3f1",
        color:
          "#2b2624",
        padding:
          "32px 16px 64px",
      }}
    >
      <div
        style={{
          width:
            "min(980px, 100%)",
          margin:
            "0 auto",
        }}
      >
        <section
          style={{
            background:
              "#fff",
            borderRadius:
              24,
            padding:
              "24px",
            boxShadow:
              "0 16px 50px rgba(42, 31, 27, 0.08)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap:
                16,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin:
                    "0 0 6px",
                  fontSize:
                    12,
                  letterSpacing:
                    "0.08em",
                  color:
                    "#8b7770",
                  fontWeight:
                    700,
                }}
              >
                MISAKI PERSONA
              </p>

              <h1
                style={{
                  margin:
                    0,
                  fontSize:
                    "clamp(24px, 5vw, 38px)",
                }}
              >
                進化候補レビュー
              </h1>

              <p
                style={{
                  margin:
                    "12px 0 0",
                  color:
                    "#74645e",
                  lineHeight:
                    1.7,
                }}
              >
                このブラウザでログイン中のユーザーについて、
                美咲が提案した関係性の変化を確認します。
                承認した候補だけがユーザー別人格に反映されます。
              </p>
            </div>

            <button
              type="button"
              onClick={
                analyzeNow
              }
              disabled={
                analyzing
              }
              style={{
                border:
                  0,
                borderRadius:
                  999,
                padding:
                  "12px 18px",
                background:
                  "#2b2624",
                color:
                  "#fff",
                fontWeight:
                  700,
                cursor:
                  analyzing
                    ? "default"
                    : "pointer",
                opacity:
                  analyzing
                    ? 0.65
                    : 1,
              }}
            >
              {analyzing
                ? "分析中…"
                : "今すぐ分析"}
            </button>
          </div>

          <div
            style={{
              display:
                "flex",
              gap:
                8,
              marginTop:
                24,
              flexWrap:
                "wrap",
            }}
          >
            {(
              [
                [
                  "pending",
                  "承認待ち",
                ],
                [
                  "approved",
                  "承認済み",
                ],
                [
                  "rejected",
                  "却下済み",
                ],
              ] as const
            ).map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={
                    () =>
                      setStatus(
                        value
                      )
                  }
                  style={{
                    border:
                      status ===
                      value
                        ? "1px solid #2b2624"
                        : "1px solid #ddd3ce",
                    borderRadius:
                      999,
                    padding:
                      "9px 14px",
                    background:
                      status ===
                      value
                        ? "#2b2624"
                        : "#fff",
                    color:
                      status ===
                      value
                        ? "#fff"
                        : "#5f504b",
                    fontWeight:
                      700,
                    cursor:
                      "pointer",
                  }}
                >
                  {label}
                  {value ===
                    "pending" &&
                  pendingCount !==
                    null
                    ? ` (${pendingCount})`
                    : ""}
                </button>
              )
            )}
          </div>

          {message ? (
            <div
              style={{
                marginTop:
                  18,
                padding:
                  "12px 14px",
                borderRadius:
                  14,
                background:
                  "#f2ece9",
                color:
                  "#5e4d47",
                lineHeight:
                  1.6,
              }}
            >
              {message}
            </div>
          ) : null}
        </section>

        <section
          style={{
            marginTop:
              18,
            display:
              "grid",
            gap:
              14,
          }}
        >
          {loading ? (
            <div
              style={{
                padding:
                  28,
                borderRadius:
                  20,
                background:
                  "#fff",
                color:
                  "#7a6963",
                textAlign:
                  "center",
              }}
            >
              読み込み中…
            </div>
          ) : candidates.length ===
            0 ? (
            <div
              style={{
                padding:
                  32,
                borderRadius:
                  20,
                background:
                  "#fff",
                color:
                  "#7a6963",
                textAlign:
                  "center",
                lineHeight:
                  1.7,
              }}
            >
              {status ===
              "pending"
                ? "現在、承認待ちの進化候補はありません。"
                : status ===
                    "approved"
                  ? "まだ承認済み候補はありません。"
                  : "まだ却下済み候補はありません。"}
            </div>
          ) : (
            candidates.map(
              (
                candidate
              ) => {
                const quotes =
                  Array.isArray(
                    candidate
                      .evidence
                      ?.quotes
                  )
                    ? candidate
                        .evidence
                        ?.quotes ??
                      []
                    : [];

                const confidence =
                  Number(
                    candidate.confidence
                  );

                return (
                  <article
                    key={
                      candidate.id
                    }
                    style={{
                      background:
                        "#fff",
                      borderRadius:
                        22,
                      padding:
                        22,
                      boxShadow:
                        "0 10px 35px rgba(42, 31, 27, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap:
                          14,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize:
                              12,
                            color:
                              "#9a837b",
                            marginBottom:
                              5,
                          }}
                        >
                          {
                            candidate.trait_key
                          }
                        </div>

                        <h2
                          style={{
                            margin:
                              0,
                            fontSize:
                              21,
                          }}
                        >
                          {TRAIT_LABELS[
                            candidate
                              .trait_key
                          ] ??
                            candidate
                              .trait_key}
                        </h2>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            8,
                          alignItems:
                            "center",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={{
                            borderRadius:
                              999,
                            padding:
                              "6px 10px",
                            background:
                              "#f4efec",
                            fontSize:
                              12,
                            fontWeight:
                              700,
                          }}
                        >
                          confidence{" "}
                          {Number.isFinite(
                            confidence
                          )
                            ? `${Math.round(
                                confidence *
                                  100
                              )}%`
                            : "—"}
                        </span>

                        <span
                          style={{
                            borderRadius:
                              999,
                            padding:
                              "6px 10px",
                            background:
                              candidate.risk_level ===
                              "medium"
                                ? "#fff1dc"
                                : "#edf6ed",
                            fontSize:
                              12,
                            fontWeight:
                              700,
                          }}
                        >
                          risk:{" "}
                          {
                            candidate.risk_level
                          }
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(240px, 1fr))",
                        gap:
                          12,
                        marginTop:
                          18,
                      }}
                    >
                      <div
                        style={{
                          padding:
                            14,
                          borderRadius:
                            14,
                          background:
                            "#f7f4f2",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              12,
                            fontWeight:
                              700,
                            color:
                              "#8b7770",
                            marginBottom:
                              7,
                          }}
                        >
                          現在
                        </div>

                        <div
                          style={{
                            lineHeight:
                              1.65,
                            whiteSpace:
                              "pre-wrap",
                          }}
                        >
                          {
                            candidate.current_content ||
                            "まだユーザー別設定なし"
                          }
                        </div>
                      </div>

                      <div
                        style={{
                          padding:
                            14,
                          borderRadius:
                            14,
                          background:
                            "#fff2ed",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              12,
                            fontWeight:
                              700,
                            color:
                              "#9a6754",
                            marginBottom:
                              7,
                          }}
                        >
                          提案
                        </div>

                        <div
                          style={{
                            lineHeight:
                              1.65,
                            whiteSpace:
                              "pre-wrap",
                            fontWeight:
                              700,
                          }}
                        >
                          {
                            candidate.proposed_content
                          }
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop:
                          14,
                        lineHeight:
                          1.7,
                      }}
                    >
                      <strong>
                        理由：
                      </strong>{" "}
                      {
                        candidate.reason
                      }
                    </div>

                    {quotes.length >
                    0 ? (
                      <div
                        style={{
                          marginTop:
                            14,
                          padding:
                            14,
                          borderLeft:
                            "4px solid #d7b9ac",
                          background:
                            "#faf7f5",
                          borderRadius:
                            "0 12px 12px 0",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              12,
                            fontWeight:
                              700,
                            color:
                              "#8b7770",
                            marginBottom:
                              7,
                          }}
                        >
                          根拠になったユーザー発言
                        </div>

                        {quotes.map(
                          (
                            quote,
                            index
                          ) => (
                            <div
                              key={`${candidate.id}-${index}`}
                              style={{
                                lineHeight:
                                  1.7,
                              }}
                            >
                              「
                              {
                                quote
                              }
                              」
                            </div>
                          )
                        )}
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop:
                          14,
                        fontSize:
                          12,
                        color:
                          "#9a8d88",
                      }}
                    >
                      作成：
                      {formatDateTime(
                        candidate.created_at
                      )}
                      {candidate.reviewed_at
                        ? ` ／ レビュー：${formatDateTime(
                            candidate.reviewed_at
                          )}`
                        : ""}
                    </div>

                    {status ===
                    "pending" ? (
                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            10,
                          marginTop:
                            18,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            actionId !==
                            null
                          }
                          onClick={
                            () =>
                              reviewCandidate(
                                candidate.id,
                                "approve"
                              )
                          }
                          style={{
                            border:
                              0,
                            borderRadius:
                              999,
                            padding:
                              "11px 18px",
                            background:
                              "#2f6d45",
                            color:
                              "#fff",
                            fontWeight:
                              700,
                            cursor:
                              actionId
                                ? "default"
                                : "pointer",
                            opacity:
                              actionId
                                ? 0.6
                                : 1,
                          }}
                        >
                          {actionId ===
                          candidate.id
                            ? "処理中…"
                            : "承認する"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionId !==
                            null
                          }
                          onClick={
                            () =>
                              reviewCandidate(
                                candidate.id,
                                "reject"
                              )
                          }
                          style={{
                            border:
                              "1px solid #cabcb6",
                            borderRadius:
                              999,
                            padding:
                              "11px 18px",
                            background:
                              "#fff",
                            color:
                              "#6c5952",
                            fontWeight:
                              700,
                            cursor:
                              actionId
                                ? "default"
                                : "pointer",
                            opacity:
                              actionId
                                ? 0.6
                                : 1,
                          }}
                        >
                          却下する
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              }
            )
          )}
        </section>
      </div>
    </main>
  );
}
