# Misaki 全ブランチ・開発資産監査 2026-10-21

## 8d4050f以降：第3次精査（最新・未完了）

- [19 Memory・Forget・Identity全参照経路](19_MEMORY_FORGET_IDENTITY_ROUND3.md)：保存/再提示14経路、現在の保護・不足・検証。#67は人物識別器ではない。
- [20 Lab品質基準線](20_LAB_QUALITY_BASELINE_ROUND3.md)：期待結果・合格条件・既存試験、独立oracle/共通誤り注入。
- [21 Shared Engine同等性条件](21_SHARED_ENGINE_PARITY_ROUND3.md)：現行/部品/不足/必要試験。現在#88のbase builderはmainのliteral templateと一致、全pipeline未検証。
- [22 文書精査](22_DOCUMENT_REVIEW_ROUND3.md)：今回8版、累計32/85版、残53版。総覧2版の変遷。
- [23 ブランチ・資産保護・pending・legacy](23_BRANCH_ASSET_SAFETY_ROUND3.md)：今回静的2件解消、旧44件中残32件。legacy BLOCKED維持。
- [24 差分台帳](24_ROUND3_LEDGER.json)、[25 固定HEAD/Blob証拠](25_ROUND3_SOURCE_EVIDENCE.json)、[26 PR観測](26_ROUND3_PR_SNAPSHOT.json)。旧09/17/18を保持し重ねて読む。
- [27 最新進捗と次回引継ぎ](27_REVIEW_PROGRESS_ROUND3.md)：新チャットは基本構想→本README→27→24 pending一覧を読む。

実装/本番受入/全資産監査の完了ではない。実Gemini、DB、デプロイなし。以下は過去時点の記録。

## f55f6fe以降：第2次精査

- [13 文書本文・実装照合](13_DOCUMENT_REVIEW_ROUND2.md)：今回8版、累計24/85版。残61版。
- [14 ブランチ・実行資産の照合](14_BRANCH_RECONCILIATION_ROUND2.md)：旧証拠不足10/44件を静的照合、残34件。workflowが参照するmain外資産を保全。
- [15 回収・設計思想・安全性・優先順位](15_RECOVERY_SAFETY_PRIORITIES_ROUND2.md)：重点7群、IDEA01〜09、legacy BLOCKED継続。
- [16 最新進捗・未完了引継ぎ](16_REVIEW_PROGRESS_ROUND2.md)：現在の確認済み/未確認を記載。
- [17 第2次差分台帳](17_ROUND2_LEDGER.json)：旧265資産台帳に重ねる追補。旧記録は削除しない。
- [18 main外固定runner証拠](18_PINNED_RUNNER_EVIDENCE.json)：workflowから辿った固定commitの取得済み本文。実行はしていない。

以下は過去時点の記録として保持。最新進捗は16を優先。監査完了・全機能受入とはしない。

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
