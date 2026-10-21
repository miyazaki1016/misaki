# 第3次精査：ブランチ照合・参照保護・pending・legacy

2026-10-21、main c88cf7f。今回2件を静的照合で解消、旧44件中累計12件、残32件。動作受入ではない。元記録09、追補17を削除しない。

## 分類変更と予備照合

| ID/枝/PR | 変更前→変更後 | 目的と現在の本文証拠 | 限界 |
|---|---|---|---|
| BR-036 fix/recall-keep-recent-history #5 HEAD 1fdd4d4 | 証拠不足→mainに同等機能が存在 | 旧diffはrecall時history=[]を除去。現main chat:1826–1831はcanonical root.historyを保持、1953以降で60件contents、recall時も空にしない。匿名も検証済rootを読む | 元のbrowser履歴信用方式は採用しない。静的な目的存続に限定。忘却/実モデル精度は未受入 |
| BR-035 fix/recall-history-grounding #8 HEAD 4754105 | 証拠不足→mainに同等機能が存在 | 旧diffのhistory付きcreateRecallAwareMessageは現在lib/chat-recall.tsにあり、直近20件・role文字列・根拠提示をchat:1831からmodelMessage→generator userTextへ渡す。診断文除外等は後続強化 | 旧proxyファイルの不存在を機能消失としない。訂正/忘却/人物照合の正確性まで認定しない |

BR-031 #3のproxy parse-retryは旧diffにbaseChatPost二回呼出し。現在proxyは一回委譲で「Never retry」明示。旧fixを復活させないが、現在JSON失敗回復の全契約/置換根拠を未照合のため解消数に含めない。BR-003は旧自発経路削除目的を予備確認したが全差分・タグ移行が未完のため残件。匿名系BR-020/021/022はroot/revision/checkpointまで確認したが全frontend例外を未精査、残件維持。docs-only各枝も所在だけで解消しない。

## main外workflow資産の保護

| main参照元 | 参照先/使用コード | 削除・整理の影響と条件 |
|---|---|---|
| `.github/workflows/isolated-gemini-ab-manual.yml` | commit `9a40d98c4ecec2f17eef1489a687acc1e24f338e`。scripts/context-ab-live.ts、context-ab-quality-live.ts、tests/context-ab-*.test.ts、importするadapter/harness/fixture/prompt/quality/long-history、package lock | 固定SHAなので枝削除が直ちにcheckout失敗するとは断定しない。ただし到達可能性/永続性を失わせる整理は禁止。全依存・lock/runtime・保管方針を検証してから参照移行案を作る。18は主要本文証拠、全依存の将来実行保証ではない |
| `.github/workflows/context-ab-live-manual.yml` | 浮動 `work/context-no-duplicate-replies-ab`、現在HEAD a849bec。scripts/context-ab-live.ts、tests/context-ab-*.test.ts、依存コード/lock | 枝削除/renameでcheckout失敗し得る。枝更新でも実行内容が変わる。mainにworkflowがあることだけで安全に削除しない。固定参照/依存保全と承認された移行の後に整理判断 |

workflowのlive手動承認入力やsecret有無は実行可能性の一部。今回はdispatch/モデル呼出し/設定変更なし。mainの両workflow本文を再確認し、18を継承。全import graph/再現ビルド、失効artifactは残件。ブランチ削除・統合は行わない。

## 重大関係イベントpending

main canonical-state.ts:90–100はpending/processing/failed行を全件照会し、さらに未作成区間を直近3 chat_turn_completedとprocessing(applied)の照合で橋渡しする。runtimeのpendingRelationshipGuideはroot.relationshipCriticalPending又はtemporary snapshot.pending中critical候補で発火する。**「pendingは3件しか守らない」は誤り**。3件制限はpending行作成前の橋渡しにある。

| 条件 | 現在確認した保護 | 未保証・必要な再現試験 |
|---|---|---|
| commit後worker起動前停止 | 直近3turnの未applied critical候補でpending guide | 4turn以上進みpending行未作成のまま古いcriticalが窓外になった場合。故障注入で読取/guideを観測 |
| pending行作成後の停止/failed/長時間滞留 | pending/processing/failed照会にはlimit3なし | 再試行再開/解決/永久滞留、stale lease、現DB全writer/削除条件を検証 |
| retry/処理順 | 保存後worker、processing version/lease、temporary pending保持 | oldest-first失敗時後続進行、重複claim、expiry/importの全sequence |
| 古いstatus/Identity再提示 | pending guide、canonical statusとIdentity source versionを優先する設計 | 通常chat/Body Clock/写真/receiptが同じsnapshotを見る保証、別れ後旧reply再送 |

本表は静的に抽出した未確認条件。**今回再現した不具合は0件**。3turn超滞留の欠陥を実証済みとは記載しない。必要な隔離fault-injection設計を残す。

## legacy

`codex/legacy-maintenance-drain` HEAD 17449c7、BLOCKED 1件を維持。10/15の対応表・既存PG17.6/18.4各56 CI/4反例回帰と未guard3経路を引き継ぐ。CI成功で解除しない。未guard全writer、pre-gate開始済worker、check/write transaction、operator/session隔離、旧cron/trigger/権限/既存処理との競合を隔離環境で確認する必要がある。今回DB接続・migration・SQL試験なし。
