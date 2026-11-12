# 開発棚卸し・未紐付けブランチ調査（2026-11-01）

## 調査範囲・証拠
- 週次棚卸しワークフロー: `.github/workflows/development-inventory.yml`。月曜10:17 JST、read-only、成果物保持30日。
- 初回手動実行: [Actions run 41238136733](https://github.com/miyazaki1016/misaki/actions/runs/41238136733)。109ブランチ、過去PR102件、open PR17件、open Issue1件、ブランチ要確認91件、長期未更新PR13件。これらは**削除候補の確定数ではない**。
- 91件の要確認ブランチのうち、過去PR紐付けが見つからないもの7件を `main...branch` の比較で静的調査。未実装・未統合と断定しない。

## PR履歴の見つからない7ブランチ
| ブランチ | mainとの関係 | 確認内容・判断 |
|---|---|---|
| `docs/development-registry-audit-20261020` | diverged、ahead 174 / behind 16 | 多数の監査資料。mainの総覧・台帳と照合し、未反映の証拠だけ移す。丸ごとmergeしない。 |
| `experiment/chat-input-metrics-offline-20261022` | diverged、ahead 94 / behind 16 | オフライン実験・テスト・素材。現在の実装と機能単位で照合。 |
| `experiment/transparent-lounge-20261027` | diverged、ahead 26 / behind 16 | `public/lab/transparent-lounge/index.html` はmainにも存在するがblob SHAが異なる。既存のラウンジ実機検証と重複しないよう確認。 |
| `fix/safari-load-failed-ui` | behind 371 / ahead 0 | mainの祖先、固有コミットなし。 |
| `preview/external-ai-review-20261028` | diverged、ahead 1 / behind 16 | `public/lab/external-ai-review/index.html` はブランチに存在、mainの同一パスには存在しない。別経路での資料保管を確認。 |
| `sora/relationship-processing-error-diagnostics` | behind 94 / ahead 0 | mainの祖先、固有コミットなし。 |
| `work/conversation-context-compression-spike` | diverged、ahead 85 / behind 40 | チャットAPI・関係性処理・DB migrationを含む古い実装。**直接merge禁止**。現行コード・テストとの精査が必要。 |

## 判断・次の一手
1. mainに祖先として含まれる2件は内容欠落の疑いが低いが、ブランチ削除は別途確認。
2. ラウンジ関連は現在の独立HTTPS静的UI検証と照合。外部AIレビュー画面は保存先・必要性を判断。
3. チャット圧縮実験はDB変更を伴い得るため、採用前に差分・テスト・権限を個別評価。
4. この資料は**静的なGitHub調査記録**。動作確認・本番検証・merge/deployは未実施。
