# ソラ第5次：未精査文書3版の全文確認とソース照合

2026-10-21。**新規全文精査3版。** 第4次累計40/85版からの継続。第4次 `34_ROUND4_LEDGER.json` のpending_documentsと照合し、以下3点はいずれも未精査ID・固定Blob。対象文書の全本文をBlob SHA指定で取得し、関連ソースを固定コミットで別途読んだ。監査は未完了。CI・本番・DB・有料Gemini・実モデルは呼んでいない。

## DOC-013 — Q02 実モデル2往復のoperator runbook
- 文書：`docs/CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md`、Blob `804407c3dcbb0ca3e6a0d1e765be2d8a9a3cca4a`。全文3,425 bytes（第4次inventory）。Draft PR #86のオフライン実験専用文書。
- source：`experiment/conversation-lab-offline-v1-20261015` の固定commit `cf2ebe76d060a56422a33e70ba0a4b9019dd1933`、`scripts/run-conversation-smoke.ts` Blob `e5461e780b616bb97e847cc0602c768aa86fd498`、`lib/conversation-lab/live-smoke-probe.ts` Blob `2fc170adfb12428a2a5e4f7cb2d24c6950d842f3`。
- **実際の静的照合**：CLIは `--approved-small-test` と `MISAKI_LIVE_SMOKE_APPROVED=yes` を要求、API key不在なら停止。Q02のみ実行し、probe側に2物理call hard limit・timeout15秒・auto retryなし・synthetic onlyのガード。DB、本番chat endpoint、原文ファイル保存の処理はこの2コードにない。キーの正規の取得・cost ceiling・請求設定はoperator責務。モデル自己申告のmanifestは認証済み実測の証明ではない。**runbookを実行してはいない。**
- **意味・資産価値**：品質観測への安全な最小入口と停止条件。mainの動作品質・共通Prompt完全再現の根拠にはしない。将来の実験実行は別途ユーザー承認、鍵・請求・review evidence確認が必須。分類：`unmerged-offline-evaluation-operator-procedure`、runtime_acceptance=false。

## DOC-014 — 会話育成実験室の最初の設計
- 文書：`docs/CONVERSATION_TUNING_LAB_PLAN_20261015.md`、Blob `5ee661407d2da6d1bd50007bb6393d4d213fa86c`。全文取得。
- source：固定main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` の `app/api/acting-lab/route.ts` Blob `b046873065f41d26e294f87c419c772b33806a21` と `lib/gemini-json-generator.ts` Blob `d080f365802edb91b90b1c45a381e03563b7597a`。
- **確認**：acting-labは`VERCEL_ENV === "production"`で抑止、Fallback Persona + Acting Guideを使用し`contents: []`で単発リクエスト。generatorは`gemini-3.1-flash-lite`、30秒既定timeout、複数retry設定を持つ。演技研究室は本番会話のMemory/Relation等の完全再現ではない。文書の「API公開・費用・認証・率制限を確認するまで自動化しない」というゲートは依然有意。ただし2026-10-15時点の「未着手」は時点付きの記述であり、後続のPR #86の実験機能追加や現mainにおける会話実測の有無を一律に決めない。
- **回収すべきIDEA/原則**：自然さ、質問連打、記憶捏造、境界尊重、関係成長を単発/5/20往復で比較。単体テスト成功やモデル応答の存在だけでは「美咲らしさ」を測れない。人手blind reviewを正本にする。分類：`unmerged-design-evaluation-plan`、runtime_acceptance=false。既存IDEA13件とは別の歴史上の設計原則で、重複番号を新規付与しない。

## DOC-079 — コンテキスト圧縮計測先行スパイク
- 文書：`docs/conversation-context-compression-spike.md`、Blob `b5a6296987c955879d540226f14c60d2ae8df9b2`。全文取得。
- source：固定mainの `app/api/chat/route.ts` Blob `5600ad37f2660049a570c4dd340e8ed140d9843b`：`MAX_HISTORY=60`（101行）、`safeHistory.slice(-MAX_HISTORY)`（1954–70）、`contents`組立（2242周辺）、最近の美咲発話反復（2187周辺）。`lib/gemini-json-generator.ts` Blob `d080f365802edb91b90b1c45a381e03563b7597a` のモデル/timeout/retryも確認。
- **意味・資産価値**：まずPrompt要素別token/latency費用の匿名統計測定、次にA現状60件/B20件/C20件+非正本summary/D重複発話省略、最後に人手blind評価という段階設計。Summaryには時系列、発話者、否定、訂正、約束、関係境界、出典、**Forget対象情報の再露出禁止**も後続の横断契約38〜45とともに必須。文書記載の単発Production時間・token観測は**文書からの履歴報告**であり今回の再計測値ではない。圧縮効果も未測定。現状はread-only計測の提案で、圧縮実装/Production有効化を承認しない。
- 分類：`unmerged-performance-research-plan`、runtime_acceptance=false。

## 横断した重要設計思想（新機能承認ではない）

1. **品質の実測と静的合格の違い**：Offline合成ケース／人工評価／本物のGemini応答／Production挙動は別の検証階層。各状態を混同しない。
2. **課金と品質の境界**：高品質を検証するためのモデルコールでも、Operatorの明示承認・鍵保護・請求上限確認が先。CLIの回数制限は金額上限ではない。
3. **圧縮と忘却の関係**：要約も派生データ。古いsummaryの利用権失効、修正/否定、sourceの権限が必要であり、Story/Memory/Relationshipの正本へ自動書込しない。
4. **美咲の体験要件**：自然さ、相手の仕事と生活の理解、親密さの飛躍を避けること、境界を尊重すること。トークン削減のために人格継続性を犠牲にしない。

## 集計と制約

- 今回の固定Blobに対する新規全文精査：**3版**（DOC-013, DOC-014, DOC-079）。
- 累計：**43/85文書版、残42版**。第4次40/85からの純増3。既存監査生成資料38〜45は母数外。
- Branch不足30件は**解消ゼロ**（本調査ではBR判定をしていない）。Legacy `codex/legacy-maintenance-drain` はBLOCKED継続。
- PR #86 Draftの実モデルrunは`NOT_RUN`、本番品質同等性なし。全265対象の完全監査は未完了。
- main/Production/DB/Supabase/アメふる/別枝/PR merge/CI・Deploy/有料Geminiの変更・実行なし。