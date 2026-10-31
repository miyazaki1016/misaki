# 美咲 開発台帳（mainから辿るための索引）

> **このファイルは詳細台帳の代替ではない。** 2026-10-31時点の管理入口を追加するためのもの。実装・統合・本番反映を新たに認定しない。

[実装・修正総覧](IMPLEMENTATION_OVERVIEW.md) · [共通運用規約](DEVELOPMENT_MANAGEMENT_STANDARD.md)

## 既存棚卸しの正本

- 専用ブランチ: `docs/development-registry-audit-20261020`
- 詳細台帳: `docs/DEVELOPMENT_REGISTRY.md`（**この専用ブランチから取得すること**）
- 追加の監査資料: 同ブランチの `docs/audits/20261021-work-all-assets/` ほか。
- 継続更新規約: 同ブランチの `docs/development-ledger-continuous-update-rule-20261023.md`。
- 詳細台帳は2026-10-20開始の棚卸し途中の記録。記載の91ブランチは当時の調査母集団であり、現在の総数ではない。
- 専用ブランチはmainと分岐しており、監査ファイルや未公開実装が混在する可能性がある。**ブランチ全体をmainへマージしないこと。**

## 判定区分

A: main実装確認 / B: ブランチ実装・main未確認 / C: 実験・検証不足 / D: 設計・監査のみ / U: 未判定。

**Aも本番反映の保証ではない。** Preview・CI・過去のPR説明だけで本番状態を確定しない。

## 優先して照合する作業（過去の棚卸しに記録あり）

| 作業 | 過去記録の所在 | 次の確認 |
| --- | --- | --- |
| Forget Control v1 | `work/forget-control-v1`, PR #66 | 現行main・関連migration・本番適用の実体を再照合 |
| Relationship Identity | PR #67、詳細台帳 | 保存・復元・migrationの実体と統合状態を再照合 |
| Conversation Lab | PR #86、詳細台帳 | 実験結果と本番利用の区別を確認 |
| 共通会話エンジン | PR #88、詳細台帳 | main依存経路と検証の実体を確認 |
| 美咲単独版入口・ラウンジ・チャット | 過去のローカルコミット `7f42677` | リモート存在、Preview、公開前レビューを確認。ここでは本番反映を認定しない |
| 全ブランチ棚卸し | `docs/development-registry-audit-20261020` | 最新ブランチ・open/closed PRと照合して追加分を分類 |

※ この表は既存資料への入口であり、最新実装の判定結果ではない。

## 自動棚卸し

- 実装案: `scripts/development_inventory.py`
- 週次ワークフロー案: `.github/workflows/development-inventory.yml`
- レポートは**未登録・放置の可能性を示す候補**。PRのないブランチを未完了と断定しない。
- 詳細は[共通運用規約](DEVELOPMENT_MANAGEMENT_STANDARD.md)を参照。

## 次の一手

1. 詳細台帳と全ブランチの最新head・PR状態を突き合わせ、前回棚卸し以降の変更を分類する。
2. 既存の詳細証拠を消さずに、作業ID／状態／証拠／未確認／次の一手の索引を拡充する。
3. 自動レポートの誤検知を検証し、ユーザー承認後にワークフローをmainへ統合する。

## 2026-11-01 差分棚卸しの起点（読み取り確認）

- GitHubブランチ検索で **109ブランチ（main含む）** を取得。過去の詳細台帳に記載された91ブランチは当時の母集団であり、差分の厳密な件数ではない。削除・改名・追加の可能性を区別してから照合する。
- 現行の新しい作業候補として `feat/lounge-chat-handoff-20261030`、`feat/lounge-opening-fullscreen-20261029`、`feat/lounge-muse-v3-official-20261030`、`fix/lounge-transition-flash-20261030`、`experiment/transparent-lounge-20261027` を確認。**ブランチ存在のみ確認済み、main統合・実機・本番は未判定（U）**。
- 既存の詳細台帳 `docs/DEVELOPMENT_REGISTRY.md` は専用ブランチのまま保持し、上記の新規候補との重複と証拠を確認してから索引へ正式登録する。
- 管理用PR #103 のオフライン回帰テストは2026-11-01確認時点で成功。これはGitHub実データ棚卸しの実行成功を意味しない。
- 次の一手：詳細台帳の記載済み作業IDと現在の109ブランチを照合し、追加・更新・所在不明を分類。ラウンジ系の詳細資料とPRを確認し、未確認項目を勝手に完了扱いしない。

## 2026-11-01 証拠付き作業索引（初回・暫定）

以下は作業単位の入口。2026-11-01のGitHub読み取り結果であり、状態の最終認定ではない。詳細は `docs/audits/DEVELOPMENT_INVENTORY_DIFF_20261101.md`。main・本番・DB・実機は個別の確認がない限り**未確認**。

| ID | 作業 | 状態 | 所在・証拠 | main / 本番 / 実機 | 次の一手 |
| --- | --- | --- | --- | --- | --- |
| M-LNG-01 | ラウンジ・オープニング・チャット遷移（関連ブランチを1作業群として管理） | C暫定 | `feat/lounge-chat-handoff-20261030`, `feat/lounge-opening-fullscreen-20261029`, `feat/lounge-muse-v3-official-20261030`, `fix/lounge-transition-flash-20261030`; `docs/LOUNGE_SHORTCUT_PREVIEW_20261030.md`, `docs/LOUNGE_VIDEO_INTEGRATION_LEDGER_20261029.md` | 未確認 / 未確認 / 未確認 | mainとの差分と素材・遷移を統合的に確認。既存チャットや本番を変更しない |
| M-MEM-01 | 匿名情報単位24時間記憶 | D | `design/anonymous-per-item-24h-memory-20261030`; `docs/ANONYMOUS_MEMORY_24H_DESIGN_20261030.md` | 未確認 / 未確認 / 未確認 | 実装着手時は時刻境界と既存記憶の互換を検証 |
| M-MEM-02 | 記憶の公開方針・台帳補足 | D暫定 | `docs/misaki-memory-public-final-20261030` | 未確認 / 未確認 / 未確認 | 既存詳細台帳との記載差分のみ照合 |
| M-CONV-01 | Conversation Lab | C暫定 | Draft PR #86（open、未マージ、2026-11-01確認） | 未確認 / 未確認 / 未確認 | 実験と本番採用を区別して検証 |
| M-CONV-02 | 共通会話エンジンの接続基盤 | C暫定 | Draft PR #88（open、未マージ、2026-11-01確認） | 未確認 / 未確認 / 未確認 | 現行mainの依存経路を検証 |

※ PR #103は管理用Draft PRであり、機能実装の採用とは別。未確認を未実施と読み替えない。
