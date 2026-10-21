# ソラ第5次追加：A/B評価関連3文書版の全文・ソース精査

日付：2026-10-21。第4次40/85→第5次前半43/85（46・47）に続き、未精査の3文書版をBlob固定取得・全文読解し、関連実装と照合。対象レジストリは固定85文書**版**。**監査未完了**。Gemini呼出し、CI実行、DB/Productionアクセス、PR更新はしていない。

## DOC-075：盲検A/Bレビュー
- `docs/context-ab-blind-review.md` Blob `66e283a33430cb7bc07dfd035122f60ba7482fd2`（全文取得）。`Status: protocol only`。
- 同一シナリオの左右回答について、どちらがA/Bか明かさず、Memory fidelity・Relationship boundaries・Continuity・Repetition・Naturalnessを各0–2点評価。個人情報・Production会話は明示許可と最小化なしに使用せず、raw回答はCIに出さない。重大な捏造／関係境界／プライバシー違反は総点と独立して停止。複数reviewerの独立採点・ロック後開示を要求。
- 静的照合：`work/context-no-duplicate-replies-ab` HEADの`lib/context-ab-blind-quality.ts` Blob `b52aca38c29c1efe282f37e73a38261a9039b309`はreplyの形式decode・エラー分類を行い、**品質の合格を自動決定する根拠ではない**。文書の「rawを保持しなかった初回ペアは後追い採点不可」を尊重。
- 判定：`review-protocol-unmerged-not-run`。採点結果なし。品質同等性なし。

## DOC-076：隔離実モデルA/B実行ゲートと過去の報告
- `docs/context-ab-execution-gate.md` Blob `bb9da685cd80ca66db8e0771121304eda7d84949`（全文取得）。
- 2026-10-13の**文書に記載された過去実行報告**：合成短文でA/B各1物理リクエスト、双方HTTP200/JSON成功、prompt tokens A=322/B=233（Bは89少ない）、所要時間A=639ms/B=837ms。**今この監査でモデルを呼んで再確認した数字ではない**。一組の比較をProductionの費用・速度・会話品質と一般化できない。
- 静的照合：`work/context-no-duplicate-replies-ab` の`scripts/context-ab-live.ts` Blob `83e826d7651aa5b86ffc07b103fbf71a2b258de5`は`MISAKI_AB_LIVE=YES`、キー、モデル名、runs 1–20、synthetic fixtureを要求。手動workflow `.github/workflows/context-ab-live-manual.yml` Blob `a0629a27b36697524b94d5b04d774868da23a6ee`は`confirm_two_billable_requests=YES`、`MISAKI_AB_RUNS=1`、隔離branch checkoutで2回の課金呼出しを想定。**workflowの記述確認はその実行履歴を再検証した証拠ではない**。main配置とmain外checkout依存の保全が必要。費用上限の別途確認、再実行の明示承認が必要。
- 文書には固定commit `19cc84667a1a205a6b4b7193f74637197ba938df` の過去CI成功も記載。**今回CI履歴を再取得していない**ため過去報告の扱い。
- 判定：`historical-one-pair-smoke-report+unmerged-gate`。合成runnerの成立に限定。品質合格・本番parityなし。

## DOC-078：コンテキストA/Bの安全性比較手順
- `docs/context-ab-validation-protocol.md` Blob `fc5f3fdd4a68f244015b666f826093ea30522d11`（全文取得）。
- A: 最近の美咲発話8件をsystem prompt内にも反復、B: 同じ60件raw historyを維持して重複リストのみ省略（反復回避の指示は残す）。比較はstateと設定を固定した非正本・隔離ハーネスが必要。普通の`/api/chat`連続実行はMemory/Relationship/usageを汚染するので禁止。
- 記録された異なる入力でのsystem prompt文字数12,719→12,224（495文字減、約3.9%）。時刻・tokenの因果比較はできず、実測性能向上としない。20回/arm計測は**将来のゲート条件**であり完了ではない。
- 静的照合：`lib/context-ab-prompt.ts` Blob `7ae35c209ce5378b830bc9d36c656b39b1e99f7b`は`makeRecentReplySection("A")`で最近発話をリスト化、Bで`REPEAT_GUIDANCE`のみ挿入。`makePromptVariants`はネットワーク/DB書込みのない決定的変換。これは**プロンプト構造の差の根拠であり実運用品質の等価性ではない**。
- 判定：`unmerged-experimental-validation-protocol`。実用化提案ではない。

## 三文書を通じて保全する考え方

1. **数字の種類を混同しない**：文字数の差 ≠ token差 ≠ latency因果 ≠ 人間が感じる会話品質。単発合成成功はrunnerの接続・集計の限定的な根拠。
2. **独立の人手oracle**：メモリ捏造・境界越えを重要フラグとし、A/B両方で同じ不具合が出たら「同等なので安全」としない。Forgetの独立oracle原則（38・45）と整合。
3. **実験は隔離**：本番chat状態・正本memory・Relationship・quotaの書込を避ける。live再実行・課金には明示承認が必要。
4. **ワークフローの別枝依存**：mainの手動workflowが`work/context-no-duplicate-replies-ab`をcheckoutするため、ブランチ整理やPR管理で実験資産を埋没させない。これは実行承認ではない。
5. **今後の拡張**：A/Bのquality reviewにはscenario ID・固定fixture・モデル/Prompt版・independent scores・critical flags・record provenanceを残す。実会話原文をCIへ載せない。

## 台帳集計と制限

今回新規全文精査：DOC-075, DOC-076, DOC-078の**3版**。以前の43版と重複なし。**累計46/85版、残39版**。不足ブランチ30件は今回解消ゼロ（branch分類を実施せず）。IDEAは既存13件を維持、重複案を新規IDEAとして加算しない。legacy BLOCKED継続。新たに再現した不具合0（実行試験なし）。現本番DB、CI最新状態、モデル品質、安全性の全経路の完成は未確認。

監査専用ブランチに資料だけ保存。main、Production、Supabase、アメふる、PR、deploy、branch削除、Gemini課金、実行テストには触れない。
