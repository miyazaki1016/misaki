"use client";

import { useMemo, useState } from "react";
import { createTuningPreviewPair, type TuningSettings } from "../lib/conversation-tuning-preview";

/**
 * Preview-only component. Deliberately NOT routed or linked from public pages.
 * An authenticated owner-only route must be provided before mounting this UI.
 * No network calls, Gemini, persistence, or production application.
 */
const initial: TuningSettings = {
  warmth: 65, humor: 25, phrasingInitiative: 40, questionTone: 25, length: "short",
};
const dimensions = [
  { key: "warmth", title: "親しみやすさ", description: "言葉の柔らかさ" },
  { key: "humor", title: "ユーモア", description: "冗談の混ぜ方" },
  { key: "phrasingInitiative", title: "自発性の表現", description: "許可された話題の切り出し方のみ" },
  { key: "questionTone", title: "質問の表現", description: "質問するかどうかは材料選別側が決定" },
] as const;
const fixture = {
  characterId: "synthetic-misaki", snapshotId: "synthetic-220-1", selectionRulesVersion: "synthetic-1",
  promptVersion: "synthetic-1", model: "not-connected",
  userInput: "今日は疲れちゃった",
  selectedFacts: [] as string[], requiredConstraints: ["新しい事実を作らない"],
  forbiddenConstraints: ["質問の追加", "過去の会話の捏造"],
  questionAllowed: false,
};

export default function ConversationTuningPreview() {
  const [settings, setSettings] = useState<TuningSettings>(initial);
  const [version, setVersion] = useState(1);
  const [saved, setSaved] = useState<TuningSettings | null>(null);
  const [error, setError] = useState("");
  const preview = useMemo(() => {
    try {
      return createTuningPreviewPair(fixture,
        { scope: "preview", characterId: fixture.characterId, tuningVersion: "baseline-1", settings: initial },
        { scope: "preview", characterId: fixture.characterId, tuningVersion: "draft-" + version, settings });
    } catch (e) {
      return null;
    }
  }, [settings, version]);

  function change<K extends keyof TuningSettings>(key: K, value: TuningSettings[K]) {
    setSettings(previous => ({ ...previous, [key]: value }));
    setVersion(v => v + 1);
    setError("");
  }
  function saveDraft() {
    if (!preview) { setError("設定が不正なため保存できません"); return; }
    setSaved({ ...settings }); // only in this component's memory
    setError("");
  }

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>美咲 会話チューニング</h1>
      <p role="status" style={{ color: "#8b4513" }}>
        隔離デモ・実Gemini未接続・本番反映なし。サンプルの会話は生成結果ではありません。
      </p>
      <section aria-label="調整">
        <h2>話し方を調整</h2>
        {dimensions.map(d => (
          <div key={d.key} style={{ marginBottom: 18 }}>
            <label htmlFor={d.key}>{d.title}：{settings[d.key]}</label>
            <p style={{ margin: "4px 0", fontSize: 13 }}>{d.description}</p>
            <input id={d.key} type="range" min={0} max={100} step={5}
              value={settings[d.key]} onChange={e => change(d.key, Number(e.target.value))}
              style={{ width: "100%" }} />
          </div>
        ))}
        <label htmlFor="reply-length">返答の長さ</label>{" "}
        <select id="reply-length" value={settings.length}
          onChange={e => change("length", e.target.value as TuningSettings["length"])}>
          <option value="short">短め</option>
          <option value="medium">普通</option>
          <option value="long">長め</option>
        </select>
      </section>
      <section aria-label="比較プレビュー">
        <h2>A/B比較（設定値のみ）</h2>
        <p>固定シナリオ：「{fixture.userInput}」</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          <article style={{ border: "1px solid #aaa", borderRadius: 12, padding: 16 }}>
            <h3>A 現在の基準設定（デモ）</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(preview?.baseline.settings, null, 2)}</pre>
          </article>
          <article style={{ border: "1px solid #aaa", borderRadius: 12, padding: 16 }}>
            <h3>B 調整中（デモ）</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(preview?.candidate.settings, null, 2)}</pre>
          </article>
        </div>
        <h3>Geminiに渡す内容（未接続・模擬）</h3>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f4f4f4", padding: 12 }}>
          {JSON.stringify({ intent: "comfort", facts: fixture.selectedFacts,
            questionAllowed: fixture.questionAllowed, constraints: fixture.requiredConstraints,
            tuning: preview?.candidate.settings }, null, 2)}
        </pre>
        <p>生成文章：未接続（GeminiによるA/B文章比較は未実装）</p>
      </section>
      <section aria-label="下書き">
        <h2>下書き</h2>
        <button type="button" disabled={!preview} onClick={saveDraft}>この端末の画面内に一時保存</button>
        <button type="button" onClick={() => { setSettings(initial); setVersion(v => v + 1); }}>初期値に戻す</button>
        {saved && <p role="status">一時保存済み（画面を閉じると消えます）。本番には反映されません。</p>}
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
