"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * Mobile-only local review workspace.
 * Manual review is local-only. Explicit opt-in can call the guarded Preview smoke endpoint.
 * Text is held in component state and not sent to any service.
 */
const TURNS = ["この前の約束、覚えてる？", "本当に覚えてないの？"] as const;
const CHECKS = [
  { heading: "記憶の正確さ", detail: "覚えていない約束を勝手に作っていない" },
  { heading: "自然さ", detail: "不確実でも冷たい定型文だけで終わらない" },
  { heading: "聞き方", detail: "相手に必要な情報を一度だけ優しく尋ねる" },
  { heading: "会話の連続性", detail: "2ターン目が直前の返答と矛盾していない" },
] as const;

export default function ConversationReviewPage() {
  const [replies, setReplies] = useState<[string, string]>(["", ""]);
  const [ratings, setRatings] = useState<Record<number, "ok" | "ng" | "pending">>({});
  const [note, setNote] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState("");
  const [smokeReady, setSmokeReady] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<"checking" | "available" | "used" | "unknown" | "unconfigured">("checking");
  const [identityStatus, setIdentityStatus] = useState<"checking" | "signed-in" | "missing">("checking");
  const [ownerUid, setOwnerUid] = useState("");
  const [copiedUid, setCopiedUid] = useState(false);
  const [creatingTestIdentity, setCreatingTestIdentity] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");
  const createTestIdentity = async () => {
    if (creatingTestIdentity || !window.confirm("検証用の匿名ユーザーを1つ作成します。美咲の既存Supabase Authに匿名アカウントが追加されますが、会話履歴・記憶には書き込みません。続けますか？")) return;
    setCreatingTestIdentity(true);
    setIdentityMessage("");
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user || !data.session) {
        setIdentityMessage("匿名ログインに失敗しました。認証設定を確認してください。");
        return;
      }
      setOwnerUid(data.user.id);
      setIdentityStatus("signed-in");
      setIdentityMessage("テスト用ユーザーIDができたよ。IDをコピーして、このチャットに貼ってね（認証トークンは貼らないで）。");
    } catch {
      setIdentityMessage("通信に失敗しました。もう一度画面を開き直して確認してね。");
    } finally {
      setCreatingTestIdentity(false);
    }
  };
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      const uid = error ? "" : data.session?.user?.id || "";
      setOwnerUid(uid);
      setIdentityStatus(uid ? "signed-in" : "missing");
    }).catch(() => {
      if (active) setIdentityStatus("missing");
    });
    return () => { active = false; };
  }, []);
  const copyOwnerUid = async () => {
    if (!ownerUid) return;
    try {
      await navigator.clipboard.writeText(ownerUid);
      setCopiedUid(true);
    } catch {
      setCopiedUid(false);
    }
  };
  useEffect(() => {
    let active = true;
    fetch("/api/conversation-review/smoke", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (active) { setSmokeReady(data?.ready === true); setQuotaStatus(["available", "used", "unknown", "unconfigured"].includes(data?.quota) ? data.quota : "unknown"); } })
      .catch(() => { if (active) { setSmokeReady(false); setQuotaStatus("unknown"); } });
    return () => { active = false; };
  }, []);
  const runOneShot = async () => {
    if (running || !smokeReady || !window.confirm("隔離PreviewでGeminiの2往復テストを1回だけ試しますか？最大2リクエストで、費用が発生する場合があります。")) return;
    setRunning(true);
    setRunMessage("");
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        setRunMessage("このPreviewにはログイン情報がありません。設定が整うまでは実行できません。");
        return;
      }
      const response = await fetch("/api/conversation-review/smoke", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        setRunMessage(response.status === 404 ? "安全設定がまだ未完了なので、Geminiは実行されていません。" :
          response.status === 429 ? "実験枠が未設定、または使用済みです。" :
          response.status === 403 ? "このアカウントには実験権限がありません。" :
          "実験が完了しませんでした。実験枠が消費された可能性があります。");
        return;
      }
      const result: { probeId?: string; turns?: {role: string; text: string}[] } = await response.json();
      const modelReplies = result.turns?.filter(turn => turn.role === "model").map(turn => turn.text);
      if (result.probeId !== "Q02" || modelReplies?.length !== 2 || modelReplies.some(text => typeof text !== "string")) {
        throw new Error("INVALID_RESULT");
      }
      setReplies([modelReplies[0], modelReplies[1]]);
      setRatings({});
      setRunMessage("実Geminiの研究用返答を取得したよ。4項目を評価してね。※本番美咲と同一条件ではありません。");
    } catch {
      setRunMessage("通信に失敗しました。実験枠が消費された可能性があります。");
    } finally {
      // A POST may have reserved the one-shot slot, even if the model failed.
      // Always disable locally; a fresh GET displays the durable GitHub status.
      setSmokeReady(false);
      setQuotaStatus("used");
      setRunning(false);
    }
  };

  const ready = replies.every(text => text.trim().length > 0);
  const copy = async () => {
    const text = [
      "美咲 Q02 会話レビュー（手入力または研究用実験）",
      "※入力された返答の出所は、このコピーからは検証できない。",
      ...TURNS.flatMap((turn, i) => [
        `ユーザー${i + 1}: ${turn}`,
        `美咲${i + 1}: ${replies[i] || "未入力"}`,
      ]),
      ...CHECKS.map((item, i) => `${item.heading}: ${ratings[i] === "ok" ? "問題なし" : ratings[i] === "ng" ? "要改善" : "未評価"}`),
      `メモ: ${note || "なし"}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setShowCopied(true);
    } catch {
      setShowCopied(false);
      window.prompt("コピーしてください", text);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 18px 70px", fontFamily: "system-ui, sans-serif", color: "#242235", lineHeight: 1.65 }}>
      <div style={{ color: "#8b4776", fontWeight: 700, fontSize: 13 }}>美咲・会話育成研究室 / Q02</div>
      <h1 style={{ fontSize: 27, margin: "12px 0" }}>記憶の自然さを確かめる</h1>
      <p style={{ marginBottom: 12 }}>iPhoneで、2往復の会話を確認できる評価画面だよ。</p>
      <p style={{ fontSize: 13, background: "#edf4fa", border: "1px solid #bdd2e6", padding: 12, borderRadius: 10 }}>
        この研究室は<b>固定のPreviewアドレス</b>で開いてね。異なるvercel.appアドレス間では匿名ログインが引き継がれません。アカウントを作ったら同じアドレスを使い続けてください。
      </p>
      <div role="status" style={{ padding: 16, borderRadius: 12, background: "#fff3dd", border: "1px solid #d49e54", marginBottom: 24 }}>
        <strong>手入力レビューと実験用の入口</strong>
        <div style={{ fontSize: 14 }}>手入力レビューは無料。実験ボタンはPreview・本人認証・別の専用GitHubリポジトリでの1回限りの利用制限が揃うまでサーバー側で無効です。未設定ならGeminiは呼び出されません。</div>
      </div>
      <section style={{ border: "1px solid #ddd4e1", borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <strong>実験の準備状況</strong>
        <p style={{ margin: "6px 0" }}>{quotaStatus === "used" ? "今回の実験枠は使用済みです。Geminiの再実行はできません。" : quotaStatus === "unknown" ? "利用枠の状態を確認できません。安全のため実験は停止中です。" : smokeReady ? "未使用の実験枠があります（実行前に最終確認あり）" : "未設定・実験は停止中"}</p>
        {identityStatus === "checking" && <p>iPhoneのログイン情報を確認中…</p>}
        {identityStatus === "missing" && <>
          <p>このPreviewにはログイン情報がないよ。チャット画面は開かずに、ここからテスト専用の匿名ユーザーを作成できるよ。</p>
          <p style={{ fontSize: 13 }}>※美咲の既存Supabase Authに新しい匿名アカウントが1つ追加されます。既存の会話履歴・記憶は変更しません。作成は確認後のみ。</p>
          <button type="button" disabled={creatingTestIdentity} onClick={createTestIdentity}
            style={{ padding: "12px 16px", border: 0, borderRadius: 10, background: "#6d3f67", color: "white", fontWeight: 700 }}>
            {creatingTestIdentity ? "作成中…" : "テスト用ログインを作る"}
          </button>
        </>}
        {identityMessage && <p role="status">{identityMessage}</p>}
        {identityStatus === "signed-in" && <>
          <p style={{ fontSize: 13, margin: "8px 0" }}>このブラウザーのログインユーザーID（秘密のトークンではありません。むやみに公開しないでください）</p>
          <code style={{ display: "block", overflowWrap: "anywhere", fontSize: 13 }}>{ownerUid}</code>
          <button type="button" onClick={copyOwnerUid} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#fff" }}>IDをコピー</button>
          {copiedUid && <span role="status" style={{ marginLeft: 10 }}>コピーしたよ</span>}
        </>}
      </section>
      <button type="button" disabled={running || !smokeReady || identityStatus !== "signed-in"} onClick={runOneShot}
        style={{ width: "100%", border: 0, borderRadius: 12, padding: 15, background: "#6d3f67", color: "white", fontSize: 16, fontWeight: 700, marginBottom: 12, opacity: running || !smokeReady || identityStatus !== "signed-in" ? 0.55 : 1 }}>
        {running ? "実験を確認中…" : smokeReady && identityStatus === "signed-in" ? "実Geminiの2往復を試す" : "実験準備中（まだ押せません）"}
      </button>
      <p style={{ fontSize: 13, marginTop: 0 }}>安全設定が全て揃うとボタンが有効になります。有効になった場合も、押す前に確認が表示されます。成功した場合だけ返答が自動入力されます。</p>
      {runMessage && <p role="status" style={{ padding: 12, background: "#f1e9f0", borderRadius: 8 }}>{runMessage}</p>}
      {TURNS.map((turn, i) => (
        <section key={turn} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>会話 {i + 1} / 2</h2>
          <div style={{ background: "#eae8ef", borderRadius: 14, padding: 15, marginBottom: 10 }}>
            <small>架空ユーザー</small><br />{turn}
          </div>
          <label htmlFor={`reply-${i}`} style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>美咲の実際の返答を貼り付け</label>
          <textarea id={`reply-${i}`} aria-label={`会話${i+1}の美咲の返答`}
            placeholder="まだ返信は取得していません"
            value={replies[i]} maxLength={4000}
            onChange={event => setReplies(current => {
              const next: [string, string] = [...current]; next[i] = event.target.value; return next;
            })}
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #bbb0be", borderRadius: 12, padding: 14, fontSize: 16, minHeight: 110 }} />
        </section>
      ))}
      <h2 style={{ fontSize: 20 }}>人が確認する4項目</h2>
      {CHECKS.map((item, i) => (
        <fieldset key={item.heading} style={{ border: "1px solid #ded7e0", borderRadius: 12, padding: 14, marginBottom: 12 }} disabled={!ready}>
          <legend style={{ fontWeight: 700 }}>{item.heading}</legend>
          <div style={{ fontSize: 14 }}>{item.detail}</div>
          <div style={{ display: "flex", gap: 18, marginTop: 9 }}>
            <label><input type="radio" name={`rating-${i}`} checked={ratings[i] === "ok"} onChange={() => setRatings(x => ({...x, [i]: "ok"}))}/> 問題なし</label>
            <label><input type="radio" name={`rating-${i}`} checked={ratings[i] === "ng"} onChange={() => setRatings(x => ({...x, [i]: "ng"}))}/> 要改善</label>
          </div>
        </fieldset>
      ))}
      <label htmlFor="review-note" style={{ display: "block", fontWeight: 700, margin: "20px 0 8px" }}>気になったこと（任意）</label>
      <textarea id="review-note" value={note} maxLength={4000} onChange={e => setNote(e.target.value)}
        placeholder="この返答は少し機械的、など" style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, padding: 14, fontSize: 16, minHeight: 100 }} />
      <button type="button" onClick={copy} style={{ marginTop: 16, width: "100%", padding: "14px", border: 0, borderRadius: 12, background: "#6d3f67", color: "white", fontSize: 16, fontWeight: 700 }}>
        評価内容をコピー
      </button>
      {showCopied && <p role="status">コピーできたよ。このチャットに貼り付けてね。</p>}
      <p style={{ color: "#666", fontSize: 12, marginTop: 20 }}>手入力・評価内容は送信・保存しません。実験ボタンを押した場合に限り認証情報をサーバーに送信し、設定が揃えば固定の架空会話でGeminiを呼びます。ページを閉じると評価内容は消えます。評価は主観的な記録であり、実モデル出力の真正性や品質改善の証明ではありません。</p>
    </main>
  );
}
