# 全ブランチ追跡表（92枝）

> 2026-10-21 GitHub branches APIで取得したスナップショット。監査専用ブランチ上の管理表。

> **注意**：『台帳に記載あり』は調査完了・main反映済みを意味しない。全枝の最新コミット日時、mainとの比較、PR、Preview、未反映差分は今後この表で順次確定する。ブランチの作成日と最終コミット日は異なる。

- 母集団：92枝（mainと本監査ブランチを含む）。取得順は名称順であり時系列ではない。
- 作業順：この表で未確認項目を埋め、最終コミット日時の取得後に新しい順・古い順の表示を追加する。
- 判定基準：`main...branch` ahead/behindは分岐差分。PR統合履歴・本番反映・機能同等性は別途証拠が必要。

| ブランチ | 台帳での言及 | 最終コミット日時 | main差分・PR・Preview | 追加精査 |
|---|---|---|---|---|
| `chore/restore-relationship-rpc-migration` | 記載あり | 2026-10-14 11:49 UTC | 要照合 | 要完了判定 |
| `cleanup/legacy-proactive-tags` | 記載あり | 2026-09-17 13:59 UTC | 要照合 | 要完了判定 |
| `cleanup/remove-legacy-proactive-path` | 記載あり | 2026-09-18 00:13 UTC | 要照合 | 要完了判定 |
| `codex/legacy-maintenance-drain` | 記載あり | 2026-09-19 21:30 UTC | 要照合 | 要完了判定 |
| `codex/server-canonical-foundation` | 記載あり | 2026-10-02 08:11 UTC | 要照合 | 要完了判定 |
| `design/shared-conversation-engine-contract-20261015` | 記載あり | 2026-10-15 08:13 UTC | 要照合 | 要完了判定 |
| `docs/audit-overview-against-source` | 記載あり | 2026-09-17 23:35 UTC | 要照合 | 要完了判定 |
| `docs/development-registry-audit-20261020` | 監査作業ブランチ | 2026-10-21 01:26 UTC | 要照合 | 対象外または要確認 |
| `docs/multi-character-data-scope-inventory` | 記載あり | 2026-10-13 07:40 UTC | 要照合 | 要完了判定 |
| `docs/multi-character-rpc-caller-audit` | 記載あり | 2026-10-13 08:53 UTC | 要照合 | 要完了判定 |
| `docs/production-source-of-truth-reconciliation` | 記載あり | 2026-10-14 00:30 UTC | 要照合 | 要完了判定 |
| `docs/relationship-five-axis-design-review-20261015` | 記載あり | 2026-10-14 20:22 UTC | 要照合 | 要完了判定 |
| `docs/relationship-v1-2-stage-growth-principles` | 記載あり | 2026-10-04 04:41 UTC | 要照合 | 要完了判定 |
| `docs/update-implementation-overview` | 記載あり | 2026-09-17 23:29 UTC | 要照合 | 要完了判定 |
| `docs/update-overview-relationship-growth` | 記載あり | 2026-09-18 03:15 UTC | 要照合 | 要完了判定 |
| `experiment/conversation-lab-offline-v1-20261015` | 記載あり | 2026-10-20 11:36 UTC | 要照合 | 要完了判定 |
| `experiment/interpreter-gradual-acting-20261015` | 記載あり | 2026-10-19 01:46 UTC | 要照合 | 要完了判定 |
| `experiment/shared-conversation-history-v1-20261015` | 記載あり | 2026-10-16 21:02 UTC | 要照合 | 要完了判定 |
| `feature/proactive-derived-tags` | 記載あり | 2026-09-17 13:47 UTC | 要照合 | 要完了判定 |
| `fix/anonymous-chat-session-drop` | 記載あり | 2026-09-18 00:49 UTC | 要照合 | 要完了判定 |
| `fix/anonymous-email-history` | 記載あり | 2026-09-17 05:22 UTC | 要照合 | 要完了判定 |
| `fix/anonymous-session-cache-reset` | 記載あり | 2026-09-17 07:44 UTC | 要照合 | 要完了判定 |
| `fix/body-clock-claim-rpc` | 記載あり | 2026-09-17 14:35 UTC | 要照合 | 要完了判定 |
| `fix/chat-failure-recovery` | 記載あり | 2026-09-17 23:09 UTC | 要照合 | 要完了判定 |
| `fix/chat-network-reliability` | 記載あり | 2026-09-17 09:17 UTC | 要照合 | 要完了判定 |
| `fix/chat-reliability-cleanup` | 記載あり | 2026-09-17 09:04 UTC | 要照合 | 要完了判定 |
| `fix/chat-request-diagnostics` | 記載あり | 2026-09-17 08:30 UTC | 要照合 | 要完了判定 |
| `fix/chat-turn-dedupe` | 記載あり | 2026-09-17 16:47 UTC | 要照合 | 要完了判定 |
| `fix/expired-temporary-relationship-import` | 記載あり | 2026-10-05 23:35 UTC | 要照合 | 要完了判定 |
| `fix/gemini-chat-timeout` | 記載あり | 2026-09-18 01:23 UTC | 要照合 | 要完了判定 |
| `fix/gemini-json-retry` | 記載あり | 2026-09-17 06:38 UTC | 要照合 | 要完了判定 |
| `fix/grow-relationship-from-first-meeting` | 記載あり | 2026-09-18 03:01 UTC | 要照合 | 要完了判定 |
| `fix/legacy-safari-cache` | 記載あり | 2026-09-17 05:42 UTC | 要照合 | 要完了判定 |
| `fix/preserve-active-chat-history` | 記載あり | 2026-09-17 15:56 UTC | 要照合 | 要完了判定 |
| `fix/recall-history-grounding` | 記載あり | 2026-09-17 08:44 UTC | 要照合 | 要完了判定 |
| `fix/recall-keep-recent-history` | 記載あり | 2026-09-17 07:58 UTC | 要照合 | 要完了判定 |
| `fix/relationship-analyzer-bounded-retry` | 記載あり | 2026-10-05 23:50 UTC | 要照合 | 要完了判定 |
| `fix/safari-load-failed-message` | 記載あり | 2026-09-17 12:31 UTC | 要照合 | 要完了判定 |
| `fix/safari-load-failed-ui` | 記載あり | 2026-09-17 09:19 UTC | 要照合 | 要完了判定 |
| `fix/use-chat-proxy` | 記載あり | 2026-09-17 08:16 UTC | 要照合 | 要完了判定 |
| `fix/workday-grounding` | 記載あり | 2026-09-17 23:21 UTC | 要照合 | 要完了判定 |
| `main` | 基準ブランチ | 2026-10-14 11:57 UTC | 要照合 | 対象外または要確認 |
| `perf/chat-stage-timing` | 記載あり | 2026-09-18 02:31 UTC | 要照合 | 要完了判定 |
| `refine/proactive-action-tags` | 記載あり | 2026-09-17 14:05 UTC | 要照合 | 要完了判定 |
| `refine/sleepy-tag` | 記載あり | 2026-09-17 14:15 UTC | 要照合 | 要完了判定 |
| `sora/anonymous-history-get-noop` | 記載あり | 2026-10-02 08:34 UTC | 要照合 | 要完了判定 |
| `sora/canonical-relationship-integration` | 記載あり | 2026-10-02 13:09 UTC | 要照合 | 要完了判定 |
| `sora/cutover-cleanup` | 記載あり | 2026-10-02 09:08 UTC | 要照合 | 要完了判定 |
| `sora/drop-ungrounded-relationship-evidence` | 記載あり | 2026-10-03 14:20 UTC | 要照合 | 要完了判定 |
| `sora/fix-relationship-polarity-transport` | 記載あり | 2026-10-03 13:02 UTC | 要照合 | 要完了判定 |
| `sora/fix-waiting-reply-layout` | 記載あり | 2026-10-02 11:53 UTC | 要照合 | 要完了判定 |
| `sora/gemini-timeout-retry` | 記載あり | 2026-10-02 12:51 UTC | 要照合 | 要完了判定 |
| `sora/gemini-transient-retry` | 記載あり | 2026-10-02 11:43 UTC | 要照合 | 要完了判定 |
| `sora/history-edge-trace` | 記載あり | 2026-10-02 09:28 UTC | 要照合 | 要完了判定 |
| `sora/history-get-trace` | 記載あり | 2026-10-02 09:24 UTC | 要照合 | 要完了判定 |
| `sora/history-sync-source-proof` | 記載あり | 2026-10-02 09:18 UTC | 要照合 | 要完了判定 |
| `sora/lp-pwa-mobile-layout` | 記載あり | 2026-10-04 06:57 UTC | 要照合 | 要完了判定 |
| `sora/lp-relationship-story` | 記載あり | 2026-10-04 06:36 UTC | 要照合 | 要完了判定 |
| `sora/misaki-acting-lab` | 記載あり | 2026-10-03 06:18 UTC | 要照合 | 要完了判定 |
| `sora/profile-aware-life-events` | 記載あり | 2026-10-02 08:59 UTC | 要照合 | 要完了判定 |
| `sora/relationship-analyzer-stage-diagnostics` | 記載あり | 2026-10-03 13:17 UTC | 要照合 | 要完了判定 |
| `sora/relationship-analyzer-structured-output-hotfix` | 記載あり | 2026-10-03 10:55 UTC | 要照合 | 要完了判定 |
| `sora/relationship-control-rpcs-v1` | 記載あり | 2026-10-03 10:07 UTC | 要照合 | 要完了判定 |
| `sora/relationship-evidence-validation-diagnostics` | 記載あり | 2026-10-03 13:58 UTC | 要照合 | 要完了判定 |
| `sora/relationship-processing-error-diagnostics` | 記載あり | 2026-10-03 10:57 UTC | 要照合 | 要完了判定 |
| `sora/relationship-time-v2-design` | 記載あり | 2026-09-25 10:01 UTC | 要照合 | 要完了判定 |
| `sora/remove-false-busy-wait` | 記載あり | 2026-10-02 12:04 UTC | 要照合 | 要完了判定 |
| `sora/remove-relationship-stage-diagnostics` | 記載あり | 2026-10-03 15:25 UTC | 要照合 | 要完了判定 |
| `sora/remove-relationship-temporary-diagnostics` | 記載あり | 2026-10-03 12:37 UTC | 要照合 | 要完了判定 |
| `sora/remove-timestamp-history-poll` | 記載あり | 2026-10-02 09:35 UTC | 要照合 | 要完了判定 |
| `sora/sync-free-usage-with-history` | 記載あり | 2026-10-02 23:34 UTC | 要照合 | 要完了判定 |
| `sora/update-overview-relationship-v1-production` | 記載あり | 2026-10-03 15:36 UTC | 要照合 | 要完了判定 |
| `test/relationship-acting-state-comparison` | 記載あり | 2026-10-14 12:58 UTC | 要照合 | 要完了判定 |
| `work/ab-20-pair-dispatch` | 記載あり | 2026-10-08 02:49 UTC | 要照合 | 要完了判定 |
| `work/ab-blind-review-artifact-workflow` | 記載あり | 2026-10-08 07:41 UTC | 要照合 | 要完了判定 |
| `work/ab-http-diagnostics-dispatch` | 記載あり | 2026-10-08 03:41 UTC | 要照合 | 要完了判定 |
| `work/ab-long-fixture-dispatch` | 記載あり | 2026-10-08 03:35 UTC | 要照合 | 要完了判定 |
| `work/ab-manual-workflow-only` | 記載あり | 2026-10-08 02:41 UTC | 要照合 | 要完了判定 |
| `work/ab-paced-dispatch` | 記載あり | 2026-10-08 03:44 UTC | 要照合 | 要完了判定 |
| `work/ab-quality-diagnostics-workflow` | 記載あり | 2026-10-08 05:30 UTC | 要照合 | 要完了判定 |
| `work/ab-quality-manual-workflow` | 記載あり | 2026-10-08 04:52 UTC | 要照合 | 要完了判定 |
| `work/ab-quality-reply-schema-dispatch` | 記載あり | 2026-10-08 06:40 UTC | 要照合 | 要完了判定 |
| `work/context-no-duplicate-replies-ab` | 記載あり | 2026-10-13 05:09 UTC | 要照合 | 要完了判定 |
| `work/conversation-context-compression-spike` | 記載あり | 2026-10-08 01:25 UTC | 要照合 | 要完了判定 |
| `work/forget-control-v1` | 記載あり | 2026-10-06 21:20 UTC | 要照合 | 要完了判定 |
| `work/gemini-unit-cost-telemetry` | 記載あり | 2026-10-04 05:18 UTC | 要照合 | 要完了判定 |
| `work/quality-long-history-workflow` | 記載あり | 2026-10-08 09:12 UTC | 要照合 | 要完了判定 |
| `work/relationship-analyzer-diagnostics` | 記載あり | 2026-10-03 11:32 UTC | 要照合 | 要完了判定 |
| `work/relationship-engine-v1` | 記載あり | 2026-10-03 10:13 UTC | 要照合 | 要完了判定 |
| `work/relationship-error-diagnostics` | 記載あり | 2026-10-03 11:16 UTC | 要照合 | 要完了判定 |
| `work/relationship-identity-v1` | 記載あり | 2026-10-11 16:44 UTC | 要照合 | 要完了判定 |
| `work/relationship-polarity-integer` | 記載あり | 2026-10-03 12:29 UTC | 要照合 | 要完了判定 |

## 更新ルール
1. 全枝の最終コミット日時をGitHubコミット情報から取得する。作成日時として扱わない。
2. mainとの差分、対応PR、Previewの有無、既存mainの同等機能、未反映作業、危険な移植条件を根拠とともに記入する。
3. 実装済み・テスト済み・本番反映済みはそれぞれ別の証拠で判断する。
4. 全92枝の棚卸し後、`docs/DEVELOPMENT_REGISTRY.md`を冒頭から再読し、Gemini軽量化の計測へ進む。

## 最終コミット日時取得ログ

2026-10-21: 先頭8枝についてGitHub commits APIの`commit.committer.date`を取得し、上表にUTCで記入。**作成日時ではない**。残り0枝は未取得。監査ブランチ自身は記録後に更新されるため日時は取得時点のスナップショット。

2026-10-21: 次の8枝（docs/multi-character-data-scope-inventory から experiment/conversation-lab-offline-v1-20261015）についてcommitter.dateを確認・反映。累計16/92枝、未取得76枝。時刻はUTC。`experiment/conversation-lab-offline-v1-20261015` は2026-10-20 11:36 UTCに更新されており、古い実験扱いせずPR86の現況を再確認する。

2026-10-21: 8枝の最終コミット日時を追加。累計24/92、未取得68。`experiment/interpreter-gradual-acting-20261015` は10/19、`experiment/shared-conversation-history-v1-20261015` は10/16に更新。`fix/*`の日時は9/17〜18に集中するが、古さだけでmain反映済みとは判定しない。UTC表記。

2026-10-21: `fix/chat-network-reliability`〜`fix/grow-relationship-from-first-meeting` の8枝のcommitter.dateを取得。累計32/92、未取得60。チャット信頼性/重複防止/Gemini timeout・JSON retryの枝は9/17〜18、期限切れ一時関係のimportは10/05最終更新。日時だけではmain反映・テスト通過・本番安全性を判定しない。UTC表記。

2026-10-21: 8枝のcommitter.dateを取得し反映。累計40/92、未取得52。Safari表示・cache、会話履歴維持・recall、chat proxyは9/17、relationship analyzerのbounded retryは10/05最終更新。時系列のみではmain反映や実装の安全性を判定しない。UTC表記。

2026-10-21: 8枝のcommitter.dateを取得。累計48/92、未取得44。`main`は10/14 11:57 UTC時点のHEAD日時であり本表を更新するたび最新確認が必要。canonical relationship、anonymous history、cutover関連は10/02、proactive action/sleepy tagsは9/17。`main`の日時は本番デプロイ日時ではない。UTC表記。

2026-10-21: 8枝のcommitter.dateを取得。累計56/92、未取得36。Gemini timeout/transient retryとhistory edge/get/sync source proofは10/02、relationship polarity/ungrounded evidenceは10/03最終更新。Gemini費用評価時はリトライ回数と履歴整合の回帰を別途調べる。UTC表記。

2026-10-21: 8枝のcommitter.dateを取得。累計64/92、未取得28。PWA/mobile layout・LP関係性ストーリーは10/04、acting lab・relationship analyzer diagnostics/RPCは10/03、profile-aware life eventsは10/02最終更新。main反映・本番反映・実品質の判断は別途証拠が必要。UTC表記。

2026-10-21: 8枝のcommitter.dateを取得。累計72/92、未取得20。relationship time v2設計は9/25、relationship診断・診断除去・Free usage/history同期は10/02〜03に最終更新。診断削除の枝は既存mainのログ/観測と照合して採否判断する。UTC表記。

2026-10-21: 8枝のcommitter.dateを取得。累計80/92、未取得12。`test/relationship-acting-state-comparison` は10/14、Gemini A/B dispatch/quality/manual workflow系7枝は10/08最終更新。日時は実Gemini実行や課金発生の証拠ではない。UTC表記。

2026-10-21: 8枝のcommitter.dateを取得。累計88/92、未取得4。Gemini単価テレメトリは10/04、会話圧縮は10/08、返信重複除去A/Bは10/13、forget controlは10/06、長履歴品質workflowは10/08。費用改善の判断は実行回数・トークン・品質の検証が必要。UTC表記。

2026-10-21: 最終4枝のcommitter.dateを取得。累計92/92、未取得0（取得時点のGitHub branch listに基づく）。`work/relationship-identity-v1` は10/11、その他の関係性エンジン関連3枝は10/03。日時確認の完了はmainへの統合やPR・Preview精査の完了を意味しない。UTC表記。
