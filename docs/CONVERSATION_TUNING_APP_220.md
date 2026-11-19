# 会話チューニングアプリ #220 — 最小契約・プレビュー・反映設計（Draft）

状態：設計案。実Gemini送信・DB変更・本番適用は未承認／未実装。

## 目的と所有境界
- #199：認可済みの発話意図、事実、必須・禁止制約、出典参照を選ぶ。会話をする／しない判断、質問要否、話題の自発性も原則ここ／各エンジンの責務。
- #220：**表現の調律**（親しみやすさ、ユーモア、語調、返答長、質問の表現の強さ）。#199が決めた「質問しない」を質問に変更しない。自発性の数値は新しい事実・発話意図の生成権限ではなく、許可された意図の表現にのみ作用する。
- #194：入力の最小化、モデル別費用・品質A/B。必須制約と根拠の意味を落とさない。
- 送信前検査：独立ゲート。所有者は統合担当と要確定。Gemini自身の自己採点に依存しない。

## 契約（例：フィールド名は#199/#194との調整で確定）
```ts
type Selection = {
  schemaVersion: string; selectionRulesVersion: string; snapshotId: string;
  scope: { characterId: string; verified: true };
  intent: { act: "comfort" | "acknowledge" | "ask" | "share" | "silence"; questionAllowed: boolean };
  selected: Array<{ factRef: string; permittedText: string }>;
  constraints: { required: string[]; forbidden: string[] };
};
type Tuning = {
  tuningVersion: string; scope: "preview" | "limited" | "production";
  warmth: number; humor: number; phrasingInitiative: number;
  questionTone: number; length: "short" | "medium" | "long";
};
type GenerationEnvelope = {
  snapshotId: string; selectionRulesVersion: string; tuningVersion: string;
  promptVersion: string; model: string; variant: string;
  sessionIdPseudonym: string; experiment: "tuning" | "prompt" | null;
};
```
`intent` や `scope` は確定済みの実コードの宣言ではない。既存 `ConversationSelectionHandoff` を読み取り専用で受け、正規のスコープ検証済み入口を経る。根拠と監査用制約はGeminiへの短い本文と**別経路**で保持。未知schema・未検証scope・制約欠落・版不整合は各境界でfail closed。

## 画面の構成
1. **調整**：承認済み版と編集下書きを明示。5項目のスライダーと短い自然言語説明。人格・記憶・感情・関係性は編集不可。初期値は実設定から取得し、推測で埋めない。
2. **プレビュー**：固定シナリオのA/B、自由試し会話、Geminiへ渡す最小指示と実出力の並列表示。選別根拠・失敗理由は権限付き監査パネルへ分離。デモ例文と実Gemini結果を明確に区別する。
3. **評価**：自然さ、美咲らしさ、質問連発、捏造、忘却・可視性違反、費用・遅延。品質の人手評価と機械判定を分ける。評価サンプル不足は未判定。
4. **版管理**：下書き保存→隔離プレビュー→限定適用→承認付き全体適用→復元。適用者（仮名化）、理由、版、時刻を記録。プレビューの記録は本番ログ・正本の状態と完全に隔離。

## 比較条件
- **調律A/B**：同じユーザー入力、会話文脈、#199選別snapshot、model、promptVersion、生成条件を固定し、調律だけを変更。
- **軽量化A/B**：同じ材料、履歴、model、tuningVersionを固定し、promptVersion/variantのみを変更。
- 複数シナリオと反復生成で判定。試し会話は本番の記憶・感情・関係性・Body Clockイベントを更新しない。

## 適用・安全条件
- 承認済み調律版を**会話セッション開始時に固定**し、ターン途中で切替えない。各生成ターンに版・snapshot・prompt・modelを紐付ける。本文や生IDを監査ログへ無制限保存しない。保存期間とアクセス権は実装前に決定。
- Geminiは新しい事実・評価・約束を追加しない。独立ゲートが固有名詞・数値・日付・禁止事項・他人/他キャラの混入を検査。意味判定は補助信号。
- NGは送信せず、回数上限付き再生成→安全な定型応答。ゲート自身が文章を勝手に書き換えない。
- ロールバックは最後の正常版への復帰を試験し、適用と同程度に迅速に実行可能にする。限定適用ができるまで全体適用しない。
- #194の費用ガード（モデル別単価、思考トークン予約）未解決のため**実Gemini試験は保留**。

## 実装順序と未決事項
1. 既存の雛形・UI・設定永続化を特定し再利用。既存の#199/#194のファイルを変更しない。
2. 純粋な調律スキーマ・入力検証・A/B固定条件のテストを先に作る。
3. 管理者用のローカル／隔離プレビューUIを作り、デモ出力と実出力を明示的に区別。
4. 統合担当と送信前ゲートの所有者、保存先・認可・保持期間・限定適用を確定後、別承認で本番接続。
5. 最新HEADのCI・実機・復旧テストを確認。マージ・デプロイ・DB・実Geminiは個別承認。

参照：[#220](https://github.com/miyazaki1016/misaki/issues/220)、[#219](https://github.com/miyazaki1016/misaki/pull/219)、[#199](https://github.com/miyazaki1016/misaki/pull/199)、[#194](https://github.com/miyazaki1016/misaki/pull/194)、[#100](https://github.com/miyazaki1016/misaki/pull/100)。

## マルチキャラ対応の設計原則（2026-11-20追記）
- **今は美咲のみ実装・検証、契約は複数キャラ対応**。キャラ追加や他キャラの本番有効化は別案件・別承認。
- キャラクターの識別子は自由表示名ではなく、不変の `characterId`。すべての設定・選別snapshot・会話セッション・監査・プレビュー・版履歴に含める。所有者認証と**対象キャラへの操作権限**を別々に検証する。
- 調律版の一意性は `(characterId, tuningVersion)`。セッション開始時に対象キャラと版を固定し、途中変更しない。A/Bの双方で同一characterId・同一snapshotを必須とする。
- キャラごとの人格、記憶、感情、関係性、Body Clock、忘却、生成用根拠は**厳密に分離**。共有できるのは汎用UI・検証ロジック・スキーマのみ。キャラAの材料・ログ・下書き・版をキャラBへ自動継承しない。
- 未知のcharacterId、未検証scope、異なるキャラのsnapshot、権限不明はfail closed。画面のキャラ切替時は未保存編集とプレビュー履歴を破棄または明示的に保留し、キャラ混線を防ぐ。
- 将来のキャラ選択UIは**サーバーが認可したキャラ一覧**から表示する。現時点では美咲以外を選択可能にしない。管理者認証だけで全キャラへの書込権限を与えない。
- 現在の `lib/conversation-tuning-preview.ts` の単一キャラfixtureは移行対象。#199のhandoff契約を確定した後、characterIdを含む検証へ移行し、異キャラA/B拒否テストを追加する。
