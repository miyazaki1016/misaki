# Misaki 全ブランチ・開発資産監査 2026-10-21

**中間成果。監査完了ではありません。** 全件取得と意味内容の精査を区別します。最初に [監査進捗・未完了報告](07_AUDIT_STATUS.md) を読んでください。

監査対象は `miyazaki1016/misaki`。main基準は `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`、保存前監査枝HEADは `22a22826569fe06aa294b95afaac5e38cdc92642`。既存大文書は上書きせず、この独立ディレクトリに保存します。

1. [全ブランチ一覧](01_BRANCHES.md)
2. [全ドキュメント索引](02_DOCUMENTS.md)
3. [未反映・別経路反映・BLOCKED](03_UNREFLECTED_RESULTS.md)
4. [設計思想と開発経緯](04_DESIGN_HISTORY.md)
5. [基本構想との整合性](05_VISION_ALIGNMENT.md)
6. [開発優先順位案](06_PRIORITIES.md)
7. [監査進捗・未完了報告](07_AUDIT_STATUS.md)
8. [追補：legacy未記載SQL修正](08_LEGACY_UNDOCUMENTED_CHANGE.md)

**最新追補を優先:** legacyのCI/文書の時点差は、BLOCKED記録後の `17449c7` にある3か所の行ロック修正で一部説明できた。安全性全体の解除ではない。

## 9e3f787以降の精査

- [09 全265資産の分類台帳](09_ASSET_CLASSIFICATIONS.md) — 92枝・85文書版・88 PRの確認/保留を追跡。
- [10 legacy安全性対応表](10_LEGACY_SAFETY_MATRIX.md) — 修正、4反例回帰、CI範囲、未guard/pre-gate残件。
- [11 回収計画・設計思想の保全](11_RECOVERY_AND_IDEAS.md) — IDEA01〜07と採用前の競合/試験/順序。
- [12 最新進捗・残件](12_REVIEW_PROGRESS.md) — 最新の確認範囲。初期の07より優先して読む。

分類JSON: [branches](09_BRANCH_CLASSIFICATIONS.json)、[documents](09_DOCUMENT_CLASSIFICATIONS.json)、[PRs](09_PR_CLASSIFICATIONS.json)、[coverage](09_CLASSIFICATION_COVERAGE.json)。文書16版は意味内容・確認範囲を記載、69版は意味精査保留。履歴上のmain収録を現在機能の完成に読み替えない。

[照合データ一式 evidence.zip](evidence.zip) の中に、本文書が参照する `branches.json`、`documents.json`、`all-files.json`、`code-differences.json`、`pull-requests.json`、`pr-discussions.json`、`previews.json`、`checks.json`、`coverage.json`、`legacy-ci-excerpts.json` を保存しています。ZIPを展開して参照してください。固定HEAD、全path/Blob、同名文書の版・所属、merge-base差分とHEAD差分、PR状態・merge SHA、Preview URL/状態/target/SHA、CIの観測を追跡できます。raw/には補助API記録・legacy実CIログを保存しています。

全92枝・全Treeを再取得し、文書85版の本文SHA一致を確認しました。**本文を取得したことは、全版を精読し実装との関係を確定したことを意味しません。** 全意味精査、旧巨大枝の全機能同等性、未保存・拒否作業の復元、Preview実機受入、DB/gateの現在実体は未完了・未確認です。

現在までの確定所見：RPC復元SQLはmain同一、計測主要13/16ファイルもmain同一。Forget/Identity/会話ラボ等には未収録成果あり。legacyはBLOCKED維持（文書と最新CI成功の不一致を追加調査）。婚姻排他・Free/Premium自発話題源には旧総覧との時点差あり。

main・本番・DB・他プロジェクトを変更せず、PR merge・枝削除・有料Gemini実行も行いません。監査資料の保存を機能採用・本番適用の承認と解釈しないでください。
