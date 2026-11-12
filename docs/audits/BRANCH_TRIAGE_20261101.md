# 未整理ブランチ13件の分類 — 美咲（2026-11-01）

調査対象は2026-11-01の棚卸しでPR履歴が見つからなかった7ブランチ。GitHub compare `main...branch` の再照会に基づく**一次分類**。PR未紐付けは「過去にPRが一度もなかった」ことの証明ではない。変更ファイル一覧・ahead/behindは照会時点の値であり、**内容の機能同等性・本番反映・削除安全性の証明ではない**。

| ブランチ | ahead / behind | 分類 | 理由・次の確認 |
|---|---:|---|---|
| `docs/development-registry-audit-20261020` | 174 / 18 | **保全** | 98差分ファイル、過去の設計/監査根拠。現行台帳へ有効な結論を抽出するが一括mergeしない。 |
| `experiment/chat-input-metrics-offline-20261022` | 94 / 18 | **照合** | 78差分ファイル。入力計測・offlineテスト資料を現行の会話設計・テストと突合。 |
| `experiment/transparent-lounge-20261027` | 26 / 18 | **照合** | 5差分ファイル。既存ラウンジ→オープニング→合成チャットの独立実機検証と競合させない。 |
| `fix/safari-load-failed-ui` | 0 / 373 | **整理候補（未削除）** | compareでmainに対する固有コミット/ファイル差分なし。ただし参照中の外部リンク・保全要件を確認してから削除判断。 |
| `preview/external-ai-review-20261028` | 1 / 18 | **保全** | mainに同一パスがないpreview HTML 1件。意図的な実験隔離の可能性あり。 |
| `sora/relationship-processing-error-diagnostics` | 0 / 96 | **整理候補（未削除）** | compareで固有コミット/ファイル差分なし。参照状況を確認してから判断。 |
| `work/conversation-context-compression-spike` | 85 / 42 | **保全・高リスク照合** | 27差分ファイル、chat route・状態管理・テスト等。古いコードの一括mergeは禁止。 |

## 次の確認ゲート
1. 整理候補2件は他PR・文書・外部Previewからの参照を確認する。**本資料は削除承認ではない**。
2. offline入力計測・ラウンジは現在進行中の開発チャットの実装と衝突しない範囲で機能単位比較する。
3. 高リスク会話圧縮は認証・忘却・関係性・DB互換性・CIを確認し、採否は別PRで判断する。
4. 過去の旧監査記録: [追加調査](LEGACY_AUDIT_FOLLOWUP_20261101.md)、[初回13件調査](INVENTORY_RECONCILIATION_20261101.md)。

**実施範囲**: GitHubの比較結果確認と文書作成のみ。ブランチ削除・コード変更・merge・deploy・DB操作なし。
