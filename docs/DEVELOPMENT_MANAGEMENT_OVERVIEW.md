# 美咲 × アメふる 開発管理システム総覧

**更新日：2026-11-05／管理入口（正本となる各資料への案内）**

このページは、二つのプロジェクトの**自動棚卸し・開発台帳・承認ボード・担当ソラへの引き継ぎ**を一か所からたどるための索引です。既存の監査・台帳・開発記録を置き換えません。個別案件の最新状態や本番稼働の判断は、GitHubの現在のPR・Actions・関連資料と照合してください。

## まず開く場所

**担当AIの最初の作業は[既存成果の自動照合](WORK_HISTORY_PREFLIGHT.md)。** 依頼文を渡すだけで、類似する過去の実装・未統合研究・数値結論を提示する。原本を確認して再利用判断を記録するまで新規実装・再測定を開始しない。Issue／PRでも自動チェックする。

> [!CAUTION]
> **開発・調査・検証・修正・再測定を始める前に、必ず[日本語開発履歴検索](https://miyazaki1016.github.io/misaki/history.html)を確認すること。** 機能名・日本語キーワード・コード名・過去の数値で検索し、未統合ブランチも含めた過去の実装、検証結果、根拠リンク、残課題を読む。**同じ作業を繰り返す前に、既存成果から再開できるか判断する。** 手順は[日本語開発履歴の運用](WORK_HISTORY_OPERATIONS.md)。検索結果がない・不十分なときは原本のPR・ソース差分・テスト・Actionsを確認し、未確認は未確認のまま扱う。main統合／CI成功／本番反映は区別する。

| 何をしたい？ | 入口 |
| --- | --- |
| **着手前の必須確認：過去の日本語開発履歴** | [美咲・アメふる共通検索](https://miyazaki1016.github.io/misaki/history.html) · [運用手順](WORK_HISTORY_OPERATIONS.md) |
| スマホで自分の判断案件を見る | [❤️ 美咲 × ☔ アメふる承認ボード](https://miyazaki1016.github.io/misaki/) の「あなたの判断待ち」 |
| 案件を担当ソラに渡す | 同じ画面の「ソラへの引き継ぎ」→ 対象案件の**引き継ぎ指示をコピー** → 既存の担当ソラのチャットまたはWorkに貼り付ける |
| ダッシュボードの仕様・運用を確認 | [承認ボード運用マニュアル](approval-dashboard/README.md) |
| 2026-11-04時点の全36件の一次仕分けを見る | [一次仕分け結果](approval-dashboard/OWNER_TRIAGE_20261104.md) |
| **美咲の過去の作業内容・検証結果を探す** | [美咲の履歴索引](WORK_HISTORY_INDEX.md) → 日次棚卸しの `work-history.md`（全PR・作業ブランチ） |
| 自動棚卸し・開発案件管理を調べる | [美咲の運用索引](DEVELOPMENT_OPERATIONS_INDEX.md)、[美咲の開発台帳](DEVELOPMENT_LEDGER.md)、[アメふるの運用索引](https://github.com/miyazaki1016/emergencyalert/blob/main/docs/DEVELOPMENT_OPERATIONS_INDEX.md) |
| マージボタンの準備状況を調べる | [安全な直接マージAPIの設計・準備状況](../services/approval-merge-edge/README.md) |

## 全体の流れ

```text
GitHub（美咲／アメふる）
  ├─ 日次・push時の自動棚卸し → GitHub Actionsの読み取り専用成果物
  ├─ main更新時の台帳「事実」更新提案 → レビュー用PR（自動マージなし）
  └─ 開発状況と担当の一次仕分け
           ├─ 本人の判断が必要 → 承認ボード「あなたの判断待ち」
           ├─ 技術調査・実装・検証 → 「ソラへの引き継ぎ」→ 指示をコピーして手動で担当へ
           └─ 台帳・管理作業 → 棚卸し担当ソラが照合
                                ↓
           必要なCI・実機・本番確認を行い、判断理由を残してレビュー
                                ↓
           GitHub上でマージ（ボード直接マージはまだ無効）
```

## いま動いているものと、まだ動いていないもの

| 機能 | 状態 | 注意 |
| --- | --- | --- |
| GitHub Actionsの自動棚卸し | **稼働中** | 両リポジトリの `.github/workflows/development-inventory.yml` に `17 1 * * *`（**毎日10:17 JST**）を設定。GitHub Actionsのスケジュール実行は遅延する可能性がある。mainへのpush・手動起動等でも実行する |
| 自動棚卸しの結果 | **Actions成果物で閲覧可能** | 差分や候補を報告するもので、実装完了・本番適用・不要ブランチを自動認定しない |
| 台帳の事実更新案 | **ワークフロー稼働中** | `ledger-facts-proposal.yml` がmain push/手動起動時に候補を生成・更新。台帳の判断欄は自動書換えせず、PRでレビューする。**日次スケジュール自体は設定されていない** |
| 承認ボードの閲覧 | **公開・利用可能** | GitHub Pagesから両リポジトリのopen PRを取得。承認待ちは専用ラベルと具体的な判断理由がある案件のみ |
| 「ソラへの引き継ぎ」タブ | **公開・利用可能** | 2026-11-04の一次仕分け（35件）を起点とする**固定スナップショット**。開いているPRと照合するが、自動再分類はしない |
| 担当ソラへの作業指示 | **コピー機能あり／送信は手動** | GitHubからChatGPTの他チャットへ自動起動・自動送信・着手する機能はない |
| 承認ボード上の直接マージ | **基盤コードのみ・無効** | PR #158により準備コードあり。GitHub OAuth／オーナー本人照合／最小権限トークン／Edge Functionの安全な設定・実運用試験は未完了。現時点はGitHubのPR画面からマージ |
| 自動マージ、DB・通知・本番操作 | **実施しない** | PRや台帳の状態だけで安全な本番反映を断定しない |

**確認済み実行について**：2026-11-05に両リポジトリの自動棚卸しと台帳提案ワークフローの成功履歴を確認済み。ただし**毎回必ず成功する保証ではない**。最新は下記のActionsで再確認すること。

- [美咲：GitHub Actions](https://github.com/miyazaki1016/misaki/actions)
- [アメふる：GitHub Actions](https://github.com/miyazaki1016/emergencyalert/actions)
- [美咲：台帳・運用索引](DEVELOPMENT_OPERATIONS_INDEX.md)
- [アメふる：台帳・運用索引](https://github.com/miyazaki1016/emergencyalert/blob/main/docs/DEVELOPMENT_OPERATIONS_INDEX.md)

## 美咲の直近案件（2026-11-05時点）

- [チャット表示・履歴読み込み改善：Draft PR #151](https://github.com/miyazaki1016/misaki/pull/151) — 未マージ。実機確認・実測は未完了。
- [記憶・関係性のバックアップと復元：Issue #159](https://github.com/miyazaki1016/misaki/issues/159) — 調査中。既存バックアップの対象網羅性に課題あり。自動実行・復元成功は未確認。

詳細な状態・次の一手は[美咲の開発台帳](DEVELOPMENT_LEDGER.md)を正本とします。

## 判断・引き継ぎ・マージのルール

1. **まず最新PRを確認。** PR番号、head SHA、変更ファイル、関連Issue・ブランチ、CI、既存の台帳・成果を照合する。似た案件を新規作成して最初からやり直さない。
2. **本人判断が必要なものだけ**、PRに `owner-decision` 等の専用ラベルと「変更概要／判断してほしいこと／推奨と理由」を記載して承認ボードに出す。ラベルは**マージ許可を意味しない**。
3. **開発担当の作業**は、既存PRを起点としてソラへ指示をコピーする。**Draft、マージ禁止、送信禁止、認証・DB・Push・本番への制約を尊重**し、試験結果がないものを完了扱いしない。
4. **台帳の事実だけで判断欄を上書きしない。** 既存の詳細監査や過去の結論は保全し、時点が古い記録は日付を示す。
5. **直接マージ機能はまだ有効化しない。** 認証や秘密情報をGitHub Pagesに置かない。既存のGitHubレビューを使う。

## 正本・参照先と担当

| 領域 | 主な資料 | 管理単位 |
| --- | --- | --- |
| 両プロジェクト共通の承認・引き継ぎ | [承認ボードREADME](approval-dashboard/README.md)、[一次仕分け](approval-dashboard/OWNER_TRIAGE_20261104.md)、[引き継ぎ一覧データ](approval-dashboard/handoff-queue.json) | このGitHubリポジトリ（美咲）。アメふるの実装正本ではない |
| 美咲の開発全体 | [開発台帳](DEVELOPMENT_LEDGER.md)、[運用索引](DEVELOPMENT_OPERATIONS_INDEX.md)、[実装総覧](IMPLEMENTATION_OVERVIEW.md) | `miyazaki1016/misaki` |
| 美咲の詳細な過去監査 | ブランチ `docs/development-registry-audit-20261020` の `docs/DEVELOPMENT_REGISTRY.md` | 過去の監査原本。**ブランチ全体をmainへマージしない** |
| アメふるの開発全体 | [開発総覧](https://github.com/miyazaki1016/emergencyalert/blob/main/docs/PROJECT_OVERVIEW.md)、[運用索引](https://github.com/miyazaki1016/emergencyalert/blob/main/docs/DEVELOPMENT_OPERATIONS_INDEX.md)、[開発台帳](https://github.com/miyazaki1016/emergencyalert/blob/main/docs/DEVELOPMENT_LEDGER.md) | `miyazaki1016/emergencyalert` |
| 自動棚卸しの実装 | 両リポジトリの `scripts/development_inventory.py` と `.github/workflows/development-inventory.yml` | GitHub Actions。読み取り専用 |
| 台帳更新提案 | 両リポジトリの `.github/workflows/ledger-facts-proposal.yml` | main更新時の提案PR。自動マージなし |
| 直接マージの将来設計 | [認証・安全ゲート・設定方法](../services/approval-merge-edge/README.md) | **無効・未接続** |

## 引き継ぐソラへの最初の指示

このページと対象リポジトリの開発台帳を先に読む。**「mainだけではなく既存ブランチ・PR・Issue・関連文書を確認し、既存成果を再利用する」**。承認ボードに出た数字は固定の一次仕分けや現在のopen PRの集計であり、作業完了や本番稼働の認定ではない。次の1件を進めるときは「ソラへの引き継ぎ」から対象の指示をコピーし、最新head/CIを確認してから続行する。

---

**この総覧の役割は入口の一本化だけ。** 元の設計、運用規約、作業台帳、監査ログ、ブランチ、PR、CI結果を削除・置換しない。

## 過去の開発・検証を再利用する

[日本語開発履歴のスマートフォン検索](https://miyazaki1016.github.io/misaki/history.html)から、全PR・作業ブランチのコード、検証結果、過去の結論へ進めます。新規着手前に検索し、未統合の研究成果も確認してください。[運用・確度・制約](WORK_HISTORY_OPERATIONS.md)。承認判断や現在の作業優先順位は、従来どおり承認ボード・台帳を正本とします。
