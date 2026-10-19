"use client";

import { useState } from "react";

/**
 * Mobile-only local review workspace.
 * Never triggers /api/chat, /api/acting-lab, or Gemini.
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

  const ready = replies.every(text => text.trim().length > 0);
  const copy = async () => {
    const text = [
      "美咲 Q02 実会話レビュー（手入力・未検証）",
      "※このページはGeminiを呼び出さない。入力した返答の出所は検証していない。",
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
      <div role="status" style={{ padding: 16, borderRadius: 12, background: "#fff3dd", border: "1px solid #d49e54", marginBottom: 24 }}>
        <strong>現在は手入力レビュー専用</strong>
        <div style={{ fontSize: 14 }}>この画面は実Geminiを呼び出さず、課金も発生しないよ。美咲の実際の返答を自動生成するボタンは、安全な認証・総回数制限が整うまで設置していない。未入力の内容を実測と表示しないよ。</div>
      </div>
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
      <p style={{ color: "#666", fontSize: 12, marginTop: 20 }}>入力内容は送信・保存しません。ページを閉じると消えます。評価は主観的な記録であり、実モデル出力の真正性や品質改善の証明ではありません。</p>
    </main>
  );
}
