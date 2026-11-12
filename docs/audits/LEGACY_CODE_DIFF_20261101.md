# 旧実験コードの現行main照合（2026-11-01）

GitHubのcompareと同一パスのblob存在確認のみを行った。**同一パスなしは機能未実装の証明ではない**。

| 旧ブランチ・ファイル | main同一パス | 判断 |
|---|---|---|
| `work/conversation-context-compression-spike:lib/context-size-measurement.ts` | なし | コンテキストサイズ測定の旧補助コード。実験資産として保全し、現行の計測機構と比較。 |
| `work/conversation-context-compression-spike:lib/context-overlap-analysis.ts` | なし | 重複文脈分析の旧補助コード。現行設計と比較するまで採用しない。 |
| `work/conversation-context-compression-spike:supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql` | なし | DB migration。**取り込み・実行禁止**、現行schema/認可と照合。 |
| `experiment/chat-input-metrics-offline-20261022:lib/conversation-engine/chat-input-metrics.ts` | なし | 入力計測用の旧実験資産。現行計測と重複確認。 |
| `experiment/chat-input-metrics-offline-20261022:lib/conversation-engine/chat-external-relevance.ts` | なし | 外部情報の関連度判定の旧実験資産。現行会話品質・安全ゲートと比較。 |

比較時点: 会話圧縮ブランチ ahead85/behind44（27差分ファイル）、入力計測ブランチ ahead94/behind20（多数のdocs/offlineコード）。旧ブランチのアプリ本体・migrationを一括mergeしない。次工程は現行mainの同等機能探索、旧実験の独立テスト再現、DB/忘却/関係性の互換性確認。

関連: [初回調査](INVENTORY_RECONCILIATION_20261101.md) / [一次分類](BRANCH_TRIAGE_20261101.md)。アプリコード・DB・デプロイ変更なし。
