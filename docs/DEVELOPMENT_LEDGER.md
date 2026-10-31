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
