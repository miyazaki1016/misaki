# 美咲 総覧

ラウンジからキャラクターと会話し、記憶・想い出・関係が育つ体験をつくる。

> [!IMPORTANT]
> **担当ソラはここから [開発台帳](DEVELOPMENT_LEDGER.md) へ。** 案件の状態・担当・次の一手は台帳を更新する。再開前に、該当PR・ブランチ・詳細資料を実際に確認する。

| 知りたいこと | 開く場所 |
| --- | --- |
| 案件の現在地・証拠・次の一手 | [開発台帳](DEVELOPMENT_LEDGER.md) |
| 自分の判断待ち・担当への引き継ぎ | [美咲 × アメふる承認ボード](https://miyazaki1016.github.io/misaki/) |
| PR・ブランチの自動棚卸し | [GitHub Actions](https://github.com/miyazaki1016/misaki/actions) → 最新成功の `development-inventory` |
| 開発・確認・リリースの規約 | [共通運用規約](DEVELOPMENT_MANAGEMENT_STANDARD.md) · [Vercelビルド運用](VERCEL_BUILD_POLICY.md) |
| 過去の判断・未統合研究・詳細な開発史 | [整理前の総覧・全文保存版](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/IMPLEMENTATION_OVERVIEW.md) · [旧開発台帳・全文保存版](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/DEVELOPMENT_LEDGER.md) |

## 主な領域

ラウンジと会話、記憶・関係性、開発の引き継ぎ。 案件の進捗は[開発台帳](DEVELOPMENT_LEDGER.md)を参照。

[記憶・自律性の設計](MEMORY_AUTONOMY_PUBLIC_OVERVIEW_20261030.md) · [共通の開発管理総覧](DEVELOPMENT_MANAGEMENT_OVERVIEW.md)

## 守る運用ルール

- ユーザー間の記憶は分離。キャラクター間は参加・目撃・明示共有の範囲だけ参照する。
- 匿名の記憶は作成から24時間を基準にし、再会話で延長しない。登録への移行は同意を前提にする。現行実装の状態は案件の証拠を確認する。
- ラウンジ、匿名セッション、会話、記憶の変更では既存の設計と回帰条件を先に確認する。
- 検討・研究がmainにない場合は、ブランチとファイルの所在を台帳に登録する。詳細が別ブランチにある場合は、そのブランチを取得して確認する。
- 自動棚卸しは差分と確認候補を出す。完了・本番反映・実機確認を自動認定しない。
- **Vercelの自動プレビューは停止中。** 画面修正は必要に応じて手動で確認する。mainのアプリ変更は本番ビルド、判定できる資料だけの更新はビルド処理を省略する。省略でも回数枠に数えられる場合がある。詳しくは[運用ルール](VERCEL_BUILD_POLICY.md)。
- 修正は **テスト → 必要なプレビュー → main → 本番READY → 実機確認** を区別して記録する。未確認は未確認のまま残す。

整理日：2026-11-05。全文保存版には旧見出し・相対リンク・履歴をその時点のまま残している。
