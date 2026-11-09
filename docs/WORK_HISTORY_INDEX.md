# 美咲：過去作業・検証の履歴索引

> 2026-11-09。「ブランチがある」だけでなく、「そのブランチで何を試したか」を探すための入口。**本番の完了状況の正本ではない**。

## 全PRと作業ブランチの内容を探す

[美咲 Development inventory（GitHub Actions）](https://github.com/miyazaki1016/misaki/actions/workflows/development-inventory.yml) → 最新の成功した**スケジュール／手動／main push**の実行 → Artifacts `development-inventory` → **`work-history.md`**。

`work-history.md` には、全PR（open/closed/merged）のタイトル、PR本文冒頭の説明、当時の作業ブランチ、PRリンク、および全現存ブランチとPR関連履歴を記録する。ブラウザーのページ内検索でキーワードを探せる。従来の棚卸しで蓄積した `report.json` を読み取るので、別のAPI権限・スケジュールは追加しない。**mainへの統合後の次回棚卸しから生成**され、成果物は従来どおり30日保存。

**注意：** PRの説明の抜粋は作者の申告であり、実験結果の保証や本番反映の認定ではない。結論は原本のPR・コード差分・CIログと照合する。PRがないブランチの作業内容は自動で推定しない。

## 分野別の過去作業の入口

| 分野 | 詳細を探す場所 | 意味 |
| --- | --- | --- |
| 美咲全体の実装・構想 | [実装総覧](IMPLEMENTATION_OVERVIEW.md) | 長期の機能全体像 |
| 開発中案件・担当・次の一手 | [開発台帳](DEVELOPMENT_LEDGER.md) | 今の判断・引継ぎの正本 |
| 記憶・自律性 | [記憶・自律性の総覧](MEMORY_AUTONOMY_PUBLIC_OVERVIEW_20261030.md) | 過去の設計と既存実装の照合 |
| ラウンジ・演出 | [ラウンジ開発記録](LOUNGE_VIDEO_INTEGRATION_LEDGER_20261029.md) | 既存演出の履歴 |
| 関係性エンジン | [引継ぎ資料](RELATIONSHIP_ENGINE_V1_WORK_HANDOFF.md) | 設計・作業の起点 |
| 会話表示と履歴 | [PR #151](https://github.com/miyazaki1016/misaki/pull/151) | 過去の表示改善・計測。現状はPRから再確認 |
| 記憶バックアップ／安全な復元 | [Issue #159](https://github.com/miyazaki1016/misaki/issues/159) | 要求と未解決事項。実装済みとは限らない |
| 全ブランチの内容・差分 | [棚卸し](https://github.com/miyazaki1016/misaki/actions/workflows/development-inventory.yml) | ブランチとPRを照合 |
| 詳細な旧監査 | [旧開発資産台帳](https://github.com/miyazaki1016/misaki/blob/docs/development-registry-audit-20261020/docs/DEVELOPMENT_REGISTRY.md) | 未統合ブランチの原本。ブランチごと取り込まない |

## 他プロジェクトとの共通運用

- [アメふる／サキくるの履歴索引](https://github.com/miyazaki1016/emergencyalert/blob/main/docs/WORK_HISTORY_INDEX.md)
- [美咲 × アメふる 開発管理総覧](DEVELOPMENT_MANAGEMENT_OVERVIEW.md)
- 両プロジェクトとも履歴索引は**過去の検索**、開発台帳は**現時点の意思決定**、既存のPR・Actions・本番記録は**事実の確認**として使う。

## 引継ぎの際の約束

1. 新規着手前に `work-history.md` と本索引を検索し、同種の実装・検証がないか調べる。
2. 該当するPR・研究ブランチ・CI・関連資料を確認してから、既存成果を流用する。
3. **mainにある／ブランチにある／本番にある／実機で動いた**を別々に扱う。
4. 新しい重要な検証結果は、単なるPRタイトルだけでなく、ここに**数値・前提・結論・一次証拠リンク**を追記して再発見できるようにする。
