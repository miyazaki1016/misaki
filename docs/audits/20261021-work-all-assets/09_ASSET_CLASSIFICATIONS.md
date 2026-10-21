# 全資産の分類台帳（精査進捗を含む）

参照正本は9e3f787。92枝・原監査コホート85文書版・88 PRの全265資産に行を付ける。監査中に作成した資料は別管理。ブランチHEADや文書所属の確認と、全機能の意味照合を混同しない。

**この台帳は監査完了を意味しない。** merged/ancestorの分類は履歴上のmain収録という限定。文書の所在は設計された機能の実装完了を意味しない。未確認は明示的に「証拠不足」とする。

## 集計

```json
{
  "reference_commit": "9e3f7873a3ad5aca3638a7d7d6b76f6ac0835fe0",
  "source_main": "c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa",
  "counts": {
    "branches": 92,
    "document_versions": 85,
    "prs": 88
  },
  "branches_by_classification": {
    "mainに同等機能が存在": 2,
    "判断に必要な証拠が不足": 44,
    "安全性の問題でBLOCKED": 1,
    "main反映済み": 34,
    "未反映で今後の実装候補": 5,
    "未完成・要修正": 6
  },
  "documents_by_classification": {
    "判断に必要な証拠が不足": 69,
    "未完成・要修正": 2,
    "安全性の問題でBLOCKED": 2,
    "未反映で今後の実装候補": 12
  },
  "prs_by_classification": {
    "未完成・要修正": 6,
    "未反映で今後の実装候補": 4,
    "判断に必要な証拠が不足": 4,
    "main反映済み": 73,
    "安全性の問題でBLOCKED": 1
  },
  "document_semantic_pending": 69,
  "all_semantic_review_complete": false,
  "all_assets_have_tracking_rows": true
}
```

## 92ブランチ

| ID | 枝 | 分類 | 確認範囲・残件 |
|---|---|---|---|
| BR-001 | chore/restore-relationship-rpc-migration | mainに同等機能が存在 | 復元SQLはmain同一Blob。再適用禁止。 |
| BR-002 | cleanup/legacy-proactive-tags | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-003 | cleanup/remove-legacy-proactive-path | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-004 | codex/legacy-maintenance-drain | 安全性の問題でBLOCKED | SQL3箇所FOR SHAREの修正と4回帰を対応付け。未guard3経路とpre-gate等は未解決。10参照。 |
| BR-005 | codex/server-canonical-foundation | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-006 | design/shared-conversation-engine-contract-20261015 | 未反映で今後の実装候補 | 設計のみ。pure pipelineとauth/quota/commit分離を保全。 |
| BR-007 | docs/audit-overview-against-source | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-008 | docs/development-registry-audit-20261020 | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-009 | docs/multi-character-data-scope-inventory | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-010 | docs/multi-character-rpc-caller-audit | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-011 | docs/production-source-of-truth-reconciliation | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-012 | docs/relationship-five-axis-design-review-20261015 | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-013 | docs/relationship-v1-2-stage-growth-principles | 未反映で今後の実装候補 | Stage/5-heart設計のみ。main旧points由来Stageと区別し採用前提を再照合。 |
| BR-014 | docs/update-implementation-overview | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-015 | docs/update-overview-relationship-growth | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| BR-016 | experiment/conversation-lab-offline-v1-20261015 | 未完成・要修正 | 多往復合成評価基盤。実モデル品質と真正なprovenanceは別ゲート。 |
| BR-017 | experiment/interpreter-gradual-acting-20261015 | 未反映で今後の実装候補 | guard保持候補と独立候補を区別。実モデル品質・閾値採用は保留。 |
| BR-018 | experiment/shared-conversation-history-v1-20261015 | 未完成・要修正 | pure部品は存在。layered promptは全生成/保存/DB分離parity未達。 |
| BR-019 | feature/proactive-derived-tags | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-020 | fix/anonymous-chat-session-drop | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-021 | fix/anonymous-email-history | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-022 | fix/anonymous-session-cache-reset | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-023 | fix/body-clock-claim-rpc | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-024 | fix/chat-failure-recovery | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-025 | fix/chat-network-reliability | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-026 | fix/chat-reliability-cleanup | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-027 | fix/chat-request-diagnostics | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-028 | fix/chat-turn-dedupe | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-029 | fix/expired-temporary-relationship-import | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-030 | fix/gemini-chat-timeout | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-031 | fix/gemini-json-retry | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-032 | fix/grow-relationship-from-first-meeting | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-033 | fix/legacy-safari-cache | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-034 | fix/preserve-active-chat-history | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-035 | fix/recall-history-grounding | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-036 | fix/recall-keep-recent-history | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-037 | fix/relationship-analyzer-bounded-retry | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-038 | fix/safari-load-failed-message | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-039 | fix/safari-load-failed-ui | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-040 | fix/use-chat-proxy | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-041 | fix/workday-grounding | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-042 | main | main反映済み | 基準main。個別機能の本番実測は別。 |
| BR-043 | perf/chat-stage-timing | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-044 | refine/proactive-action-tags | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-045 | refine/sleepy-tag | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-046 | sora/anonymous-history-get-noop | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-047 | sora/canonical-relationship-integration | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-048 | sora/cutover-cleanup | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-049 | sora/drop-ungrounded-relationship-evidence | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-050 | sora/fix-relationship-polarity-transport | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-051 | sora/fix-waiting-reply-layout | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-052 | sora/gemini-timeout-retry | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-053 | sora/gemini-transient-retry | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-054 | sora/history-edge-trace | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-055 | sora/history-get-trace | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-056 | sora/history-sync-source-proof | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-057 | sora/lp-pwa-mobile-layout | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-058 | sora/lp-relationship-story | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-059 | sora/misaki-acting-lab | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-060 | sora/profile-aware-life-events | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-061 | sora/relationship-analyzer-stage-diagnostics | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-062 | sora/relationship-analyzer-structured-output-hotfix | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-063 | sora/relationship-control-rpcs-v1 | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-064 | sora/relationship-evidence-validation-diagnostics | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-065 | sora/relationship-processing-error-diagnostics | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-066 | sora/relationship-time-v2-design | 未完成・要修正 | storyの中核はmainに同等あり。urge/motive候補は新プラン/Forget方針との統合設計が必要。11参照。 |
| BR-067 | sora/remove-false-busy-wait | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-068 | sora/remove-relationship-stage-diagnostics | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-069 | sora/remove-relationship-temporary-diagnostics | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-070 | sora/remove-timestamp-history-poll | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-071 | sora/sync-free-usage-with-history | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-072 | sora/update-overview-relationship-v1-production | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-073 | test/relationship-acting-state-comparison | 未反映で今後の実装候補 | 未反映の固定入力/正本status比較試験。実返答の改善証明ではない。 |
| BR-074 | work/ab-20-pair-dispatch | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-075 | work/ab-blind-review-artifact-workflow | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-076 | work/ab-http-diagnostics-dispatch | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-077 | work/ab-long-fixture-dispatch | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-078 | work/ab-manual-workflow-only | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-079 | work/ab-paced-dispatch | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-080 | work/ab-quality-diagnostics-workflow | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-081 | work/ab-quality-manual-workflow | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-082 | work/ab-quality-reply-schema-dispatch | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-083 | work/context-no-duplicate-replies-ab | 未完成・要修正 | 評価/圧縮/設計資産混在。memory certainty重要案を回収。全枝意味精査は保留。 |
| BR-084 | work/conversation-context-compression-spike | 未反映で今後の実装候補 | 計測優先研究。実運用の品質非劣化・コスト効果は未証明。 |
| BR-085 | work/forget-control-v1 | 未完成・要修正 | main未反映の実装・CIあり。モデル意味精度/隔離受入/rollback・現在mainとの保存境界は残件。 |
| BR-086 | work/gemini-unit-cost-telemetry | mainに同等機能が存在 | 主要13/16ファイルmain同一。残る3ファイルの後続差異は別確認。 |
| BR-087 | work/quality-long-history-workflow | 判断に必要な証拠が不足 | 関連PRと差分あり。merged記録だけでは現行機能の同等性を確定しない。 |
| BR-088 | work/relationship-analyzer-diagnostics | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-089 | work/relationship-engine-v1 | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-090 | work/relationship-error-diagnostics | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |
| BR-091 | work/relationship-identity-v1 | 未完成・要修正 | main未反映のresolver/consumer/gate。DB適用済みのPR主張と現在DB実体は分離。 |
| BR-092 | work/relationship-polarity-integer | main反映済み | HEADはmain祖先。コミット収録は確認、後続置換・現機能の存続は未判定。 |

## 85文書版

| ID | path / Blob | 分類 | 精査状態 |
|---|---|---|---|
| DOC-001 | docs/ALL_BRANCH_DOCUMENT_INVENTORY_20261021.md / 82ea5d4d8f4f8ae7d803e543cc6684758dfa3657 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-002 | docs/AMAFURU_WEATHER_DISASTER_INTEGRATION_HANDOFF_20261016.md / fcfab902743c4918813de44ad2d797bd466eda7a | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-003 | docs/BRANCH_AUDIT_TRACKER_20261021.md / a69704982f4676ae7e1ca66712b32e924b8ecb99 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-004 | docs/CONTEXT_AB_EXPERIMENT.md / 8dc57e97acfdf931d875cecbb7ac39ad35fa72cb | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-005 | docs/CONVERSATION_ENGINE_MULTICHARACTER_GAP_AUDIT_20261016.md / 54c033dcf3549ed789175f59d966d34efcf2af0f | 未完成・要修正 | 全文精査。layered builderに欠ける生成/状態/プラン境界をIDEA06へ。 |
| DOC-006 | docs/CONVERSATION_ENGINE_PROMPT_EXTRACTION_GATE_20261015.md / 3232ab4753618f217efd1e78ed34ac1418dca4f9 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-007 | docs/CONVERSATION_ENGINE_PROMPT_INSTRUCTION_INVENTORY_20261016.md / eac5633f006e86792864a672483afeca5b70c8fb | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-008 | docs/CONVERSATION_LAB_PRODUCTION_PARITY_AUDIT_20261015.md / 2c0398dd17ee58c8b01e52b55abea195eee33dc0 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-009 | docs/CONVERSATION_LAB_PROMPT_EXTRACTION_CONTRACT_20261015.md / 49122fdbd4436efbd9283387602c2a514077534e | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-010 | docs/CONVERSATION_LONG_TERM_PROBES_20261019.md / 040a75d2e0e5b11a2bf2f447af67907533dff7ed | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-011 | docs/CONVERSATION_QUALITY_MULTITURN_GATE_20261017.md / 24c0c214054c0ea5e9a3c9c99aa7b5e21ca77133 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-012 | docs/CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md / 3b387da4876452a90eda5dca82c791be602de6c5 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-013 | docs/CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md / 804407c3dcbb0ca3e6a0d1e765be2d8a9a3cca4a | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-014 | docs/CONVERSATION_TUNING_LAB_PLAN_20261015.md / 5ee661407d2da6d1bd50007bb6393d4d213fa86c | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-015 | docs/DEVELOPMENT_REGISTRY.md / ef27ea36622c0a3d40fad7e0b8c2391594184410 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-016 | docs/GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md / ce90e641d80b74eb852df5f317cb7837c9cc2ab8 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-017 | docs/GEMINI_USAGE_TELEMETRY.md / 4e48f72678499ba1de0158e089c9e0a21e327cb7 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-018 | docs/HANDOFF_NEXT_SORA_2026-10-14.md / 7e694b6a2fcc4b97c60612974109ae53abdd6511 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-019 | docs/IMPLEMENTATION_OVERVIEW.md / 0715dd8a2e80829584525c639c79060eda89369c | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-020 | docs/IMPLEMENTATION_OVERVIEW.md / 083dd5663fb7d3dc3961f302d290cc490eb33ac0 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-021 | docs/IMPLEMENTATION_OVERVIEW.md / 23c3a183fb9092f71d4ae762e2c4f8ea6e8478eb | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-022 | docs/IMPLEMENTATION_OVERVIEW.md / 29c5f78792cbab0803df52dd50e63ec2bb5900cb | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-023 | docs/IMPLEMENTATION_OVERVIEW.md / 343aca20f18654273bc54860d95cbcd2ca1cd0d9 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-024 | docs/IMPLEMENTATION_OVERVIEW.md / 3da8bad0e216589a006cb9862278e012c72f2dc3 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-025 | docs/IMPLEMENTATION_OVERVIEW.md / 3e5c58a25344e9042c9245b4873158a97237ffb5 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-026 | docs/IMPLEMENTATION_OVERVIEW.md / 3eb6a94143ebd5c3dadf4a82a230c18f934be1bc | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-027 | docs/IMPLEMENTATION_OVERVIEW.md / 55984ee1349d457ddccaddd50cdf50e1620c4e6c | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-028 | docs/IMPLEMENTATION_OVERVIEW.md / 6a2f72ccbf3daf957885f830977f47ec4d973c85 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-029 | docs/IMPLEMENTATION_OVERVIEW.md / 711b7674d9fa8547f73137016030c2a10195d859 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-030 | docs/IMPLEMENTATION_OVERVIEW.md / 779bcd2bbedbfb4fbfb512278e3b8706ee91a14d | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-031 | docs/IMPLEMENTATION_OVERVIEW.md / 79708d00e96fbcbc68b115fa5a2be0c81d75e4c1 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-032 | docs/IMPLEMENTATION_OVERVIEW.md / 936f61c6363da27b384e37b00f08aec6b999cd75 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-033 | docs/IMPLEMENTATION_OVERVIEW.md / 98551eeb0693a352aaf2c639babec34c95ff6484 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-034 | docs/IMPLEMENTATION_OVERVIEW.md / 9c36f6cee3565d81c46cea4aa9d8c8894f5705ea | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-035 | docs/IMPLEMENTATION_OVERVIEW.md / aa91a9c9c7148a6b4fe8d219075ee711a873eff7 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-036 | docs/IMPLEMENTATION_OVERVIEW.md / b017757c16aa0435c8d39973da0f7f944247bfb5 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-037 | docs/IMPLEMENTATION_OVERVIEW.md / b48887633360762cb4821e0027893d30a92cde52 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-038 | docs/IMPLEMENTATION_OVERVIEW.md / b6a73e406cc067e4a91f1de5e882dbc626b882bb | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-039 | docs/IMPLEMENTATION_OVERVIEW.md / c3c24b7429d89331f31d2abcbdf6f1a69710432c | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-040 | docs/IMPLEMENTATION_OVERVIEW.md / f551c2e456743fd9681c9c3db40b349699a5ea0b | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-041 | docs/IMPLEMENTATION_OVERVIEW.md / f80f3fe0f505a07e8f2874381f2d9b6b16fc91f3 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-042 | docs/IMPLEMENTATION_OVERVIEW.md / fc76ff0d9ecb076de4d01a005236f524c92c84d8 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-043 | docs/INTERPRETER_GRADUAL_COMPARISON_20261015.md / ca2b53562d061f8fa01cf803b940173b783da8bb | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-044 | docs/LEGACY_MAINTENANCE_DRAIN.md / f64a79e0fe4760641edcac636f1a4e06d3c4d261 | 安全性の問題でBLOCKED | 反例/停止境界を精査。後続row-lock修正の時点差は08/10で補完。 |
| DOC-045 | docs/MISAKI_CHAT_HANDOFF_20261021.md / 5d3b44267c489de0b225020b37b50959f2cfe75e | 未反映で今後の実装候補 | 前回監査開始時に読了。監査枝への文書収録でありmain機能の完成判定ではない。 |
| DOC-046 | docs/MISAKI_FREE_PREMIUM_MEMORY_PROACTIVE_BASELINE_20261019.md / be34a96cd15fb1a819f6415c9895726afe8a1cfe | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-047 | docs/MISAKI_SYSTEM_VISION_20261021.md / 572f96e6a291133b4ca246825b262d0ebfbf9c93 | 未反映で今後の実装候補 | 全文再読。今回の設計基準。構想の所在と実装完成を分離。 |
| DOC-048 | docs/MULTI_CHARACTER_DATA_SCOPE_INVENTORY.md / 949bd01677f83cd3bc88194697f30bb8dbc2a9fd | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-049 | docs/MULTI_CHARACTER_PHASE0_AUDIT.md / 0baf4f28d863f6e075f745afd5c903145887274f | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-050 | docs/MULTI_CHARACTER_PHASE0_AUDIT.md / 4de727956e52cc8eeccd772631671af69a13536f | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-051 | docs/MULTI_CHARACTER_RPC_CALLER_AUDIT.md / 143f329c7ef4e5d17fee63c06978c658f2f70c80 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-052 | docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md / 97fc43d139a2ce4b55b74d0613dffb8375a0e9af | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-053 | docs/RELATIONSHIP_ACTING_DTO_CANONICAL_CONTRACT_20261015.md / 73807f2cc4c73663212fa5382e32ad7ccf00c706 | 未反映で今後の実装候補 | 全文精査。verified root/5軸/status/pendingと配送race保護をIDEA04へ。 |
| DOC-054 | docs/RELATIONSHIP_BODY_CLOCK_ACTING_PARITY_AUDIT_20261015.md / 465f21fa358d21c6050212ecf622fa23b8e8fa41 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-055 | docs/RELATIONSHIP_BODY_CLOCK_ACTING_WIRING_PLAN_20261015.md / c91e7e695fa69c2094412810ba881800f6bcd43a | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-056 | docs/RELATIONSHIP_BODY_CLOCK_CANONICAL_READ_CONTRACT_20261015.md / e27d88203966faf0d0a102c43a208db5ef784541 | 未反映で今後の実装候補 | 全文精査。恒久select不足と匿名verified rootの優先を区別。新table不要の可能性と実配線未完了を保持。 |
| DOC-057 | docs/RELATIONSHIP_BODY_CLOCK_DTO_PREWIRING_REVIEW_20261015.md / 91f0026a618d5bd9a0b4d07357baa45dfb2318f9 | 未完成・要修正 | 全文精査とDTO契約test本文照合。test内のローカル関数でありruntime export・Edge配線ではない。欠損statusをnone断定しない。 |
| DOC-058 | docs/RELATIONSHIP_BODY_CLOCK_EXISTING_VERSION_AUDIT_20261015.md / 3a8ea222b258a04f949b10e74f6da3f5db680a1e | 未反映で今後の実装候補 | 全文精査。既存relationship_state_versionを再利用する設計。新列が必要との古い推測を確定仕様にしない。 |
| DOC-059 | docs/RELATIONSHIP_BODY_CLOCK_IMPORT_VERSION_AUDIT_20261015.md / 19110ec8cfa85091296f49b7d35385c384a7ecb2 | 未反映で今後の実装候補 | 全文精査。主要3writeのversion増分を記録。全writer/配送確定の原子的保護は別。 |
| DOC-060 | docs/RELATIONSHIP_BODY_CLOCK_PROMPT_PRECEDENCE_20261015.md / 76adad02da0903d20bd88a7ea4da74c261e74c7d | 未反映で今後の実装候補 | 全文精査。事実境界→Action→5軸/Stage→Emotion/Tag。独立試験とEdge配線を区別。 |
| DOC-061 | docs/RELATIONSHIP_BODY_CLOCK_RACE_AUDIT_20261015.md / bdc5a9b9ace3866149a0a536d1f64577dcc621bc | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-062 | docs/RELATIONSHIP_BODY_CLOCK_RPC_VERIFICATION_GAP_20261015.md / 4e9d2d2286073b20df480f021f1b85de932f8dbc | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-063 | docs/RELATIONSHIP_ENGINE_V1.md / f9f763eca7713424a3d15b15fe547a16e44cb5e5 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-064 | docs/RELATIONSHIP_ENGINE_V1_2_WORK_HANDOFF.md / fd723767780d0e293c6dd71c1ac9ea929e856aa1 | 未反映で今後の実装候補 | 全文精査。Stageと恋愛事実の分離、established履歴、floor1、5-heartをIDEA02へ。 |
| DOC-065 | docs/RELATIONSHIP_ENGINE_V1_APPLICATION.md / 917837f70a6fe241ae8c3dc2a2268725d71a15c2 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-066 | docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md / 44aa021ec97d691e590354d7934851ad0de49e2a | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-067 | docs/RELATIONSHIP_ENGINE_V1_WORK_HANDOFF.md / d54729fc1ba0c7462f74bf4baebc33124ea38641 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-068 | docs/RELATIONSHIP_FIVE_AXIS_GROWTH_PACE_20261015.md / e24294eea86a52c1b95796fa75c4fef0dd68aa73 | 未反映で今後の実装候補 | 全文精査。日数表の限定とMomentum調査をIDEA03へ。絶対的最短日数としない。 |
| DOC-069 | docs/RELATIONSHIP_MOMENTUM_SOURCE_AUDIT_20261015.md / 9c66e4d76943e1678ce55e71adc3f38b91b7fb9e | 未反映で今後の実装候補 | 全文精査。episodes/patterns/critical events取得とact guide単体入力の違いを確認。main全体でMomentum相当の不存在とは断定しない。 |
| DOC-070 | docs/RELATIONSHIP_PROMPT_WIRING_AUDIT_20261015.md / bc11962d6fd31751f5c8f101a57a331d9844cc4d | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-071 | docs/RELATIONSHIP_VERSION_LEGACY_WRITER_AUDIT_20261015.md / 0e6fd6be79d882b29055f3faabb3801b3009e7d6 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-072 | docs/SERVER_CANONICAL_STATE.md / d786df430526a4fe12abab61d0053c0af2f9f6fe | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-073 | docs/SHARED_CONVERSATION_ENGINE_DESIGN_20261015.md / 7aed7ef22ef3025fa18e8b00561ebc2d77498bf1 | 未反映で今後の実装候補 | 全文精査。pure engine/immutable snapshot/physical attempts/import graphの設計をIDEA05へ。 |
| DOC-074 | docs/WRITE_SURFACE_INVENTORY.md / a33806992107b31ddcacfd7c570a59f1b453d5e7 | 安全性の問題でBLOCKED | 本文精査。旧table/RPC/auth-trigger反例とpre-gate要件を保全。最新3行修正は全surfaceを保護しない。 |
| DOC-075 | docs/context-ab-blind-review.md / 66e283a33430cb7bc07dfd035122f60ba7482fd2 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-076 | docs/context-ab-execution-gate.md / bb9da685cd80ca66db8e0771121304eda7d84949 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-077 | docs/context-ab-real-history-quality-review.md / effb8c7139303de6c92523439612b56b67aed160 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-078 | docs/context-ab-validation-protocol.md / fc5f3fdd4a68f244015b666f826093ea30522d11 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-079 | docs/conversation-context-compression-spike.md / b5a6296987c955879d540226f14c60d2ae8df9b2 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-080 | docs/memory-certainty-design.md / bdb68e25bd6791208dd9a762e682c39fb1bb8b6a | 未反映で今後の実装候補 | 中心仕様と後続監査を精査。未確定/訂正/完了/人物/期間とForget分離をIDEA01へ。 |
| DOC-081 | docs/misaki-blind-quality-evaluation-fixtures.md / 9ac57367ca4c4bf9c6a50f90658e8799ec0c23d7 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-082 | docs/misaki-synthetic-live-evaluation-runbook.md / 395b5a68e712404520d6ce03b8e5052f8c330207 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-083 | docs/misaki-synthetic-reference-replies-and-self-scores.md / fb14a7a5422fb4b15a6478fa1cfad3625bd76d3f | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-084 | supabase/BODY_CLOCK.md / 085e5eb74c62641e972ee4c4c547bf60e9fd62fc | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |
| DOC-085 | tests/reports/forget-batch-evaluation.md / fa3b7bcb6ea654f1777adff83c6481ca48af4fc9 | 判断に必要な証拠が不足 | 本文取得/SHA/版/所属は確認。全内容の意味精査・現在の実装との対応は保留。 |

## 88 PR

| PR | head branch | 分類 | 判定の射程 |
|---|---|---|---|
| #88 | experiment/shared-conversation-history-v1-20261015 | 未完成・要修正 | pure部品は存在。layered promptは全生成/保存/DB分離parity未達。 |
| #87 | design/shared-conversation-engine-contract-20261015 | 未反映で今後の実装候補 | 設計のみ。pure pipelineとauth/quota/commit分離を保全。 |
| #86 | experiment/conversation-lab-offline-v1-20261015 | 未完成・要修正 | 多往復合成評価基盤。実モデル品質と真正なprovenanceは別ゲート。 |
| #85 | experiment/interpreter-gradual-acting-20261015 | 未反映で今後の実装候補 | guard保持候補と独立候補を区別。実モデル品質・閾値採用は保留。 |
| #84 | docs/relationship-five-axis-design-review-20261015 | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| #83 | test/relationship-acting-state-comparison | 未反映で今後の実装候補 | 未反映の固定入力/正本status比較試験。実返答の改善証明ではない。 |
| #82 | chore/restore-relationship-rpc-migration | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #81 | docs/production-source-of-truth-reconciliation | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| #80 | docs/multi-character-rpc-caller-audit | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| #79 | docs/multi-character-data-scope-inventory | 判断に必要な証拠が不足 | 文書版の所在は確認。全内容・現構想との照合は保留。 |
| #78 | work/context-no-duplicate-replies-ab | 未完成・要修正 | 評価/圧縮/設計資産混在。memory certainty重要案を回収。全枝意味精査は保留。 |
| #77 | work/quality-long-history-workflow | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #76 | work/ab-blind-review-artifact-workflow | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #75 | work/ab-quality-reply-schema-dispatch | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #74 | work/ab-quality-diagnostics-workflow | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #73 | work/ab-quality-manual-workflow | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #72 | work/ab-paced-dispatch | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #71 | work/ab-http-diagnostics-dispatch | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #70 | work/ab-long-fixture-dispatch | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #69 | work/ab-20-pair-dispatch | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #68 | work/ab-manual-workflow-only | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #67 | work/relationship-identity-v1 | 未完成・要修正 | main未反映のresolver/consumer/gate。DB適用済みのPR主張と現在DB実体は分離。 |
| #66 | work/forget-control-v1 | 未完成・要修正 | main未反映の実装・CIあり。モデル意味精度/隔離受入/rollback・現在mainとの保存境界は残件。 |
| #65 | fix/relationship-analyzer-bounded-retry | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #64 | fix/expired-temporary-relationship-import | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #63 | sora/lp-pwa-mobile-layout | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #62 | sora/lp-relationship-story | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #61 | work/gemini-unit-cost-telemetry | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #60 | docs/relationship-v1-2-stage-growth-principles | 未反映で今後の実装候補 | Stage/5-heart設計のみ。main旧points由来Stageと区別し採用前提を再照合。 |
| #59 | sora/update-overview-relationship-v1-production | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #58 | sora/update-overview-relationship-v1-production | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #57 | sora/remove-relationship-stage-diagnostics | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #56 | sora/drop-ungrounded-relationship-evidence | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #55 | sora/relationship-evidence-validation-diagnostics | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #54 | sora/relationship-analyzer-stage-diagnostics | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #53 | sora/fix-relationship-polarity-transport | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #52 | sora/remove-relationship-temporary-diagnostics | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #51 | work/relationship-polarity-integer | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #50 | work/relationship-analyzer-diagnostics | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #49 | work/relationship-error-diagnostics | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #48 | sora/relationship-analyzer-structured-output-hotfix | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #47 | work/relationship-engine-v1 | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #46 | sora/relationship-control-rpcs-v1 | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #45 | sora/misaki-acting-lab | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #44 | sora/sync-free-usage-with-history | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #43 | sora/gemini-timeout-retry | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #42 | sora/remove-false-busy-wait | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #41 | sora/fix-waiting-reply-layout | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #40 | sora/gemini-transient-retry | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #39 | sora/remove-timestamp-history-poll | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #38 | sora/history-edge-trace | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #37 | sora/history-get-trace | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #36 | sora/history-sync-source-proof | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #35 | sora/cutover-cleanup | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #34 | sora/profile-aware-life-events | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #33 | sora/anonymous-history-get-noop | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #32 | sora/canonical-relationship-integration | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #31 | sora/relationship-time-v2-design | 未完成・要修正 | storyの中核はmainに同等あり。urge/motive候補は新プラン/Forget方針との統合設計が必要。11参照。 |
| #30 | codex/legacy-maintenance-drain | 安全性の問題でBLOCKED | SQL3箇所FOR SHAREの修正と4回帰を対応付け。未guard3経路とpre-gate等は未解決。10参照。 |
| #29 | codex/server-canonical-foundation | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #28 | docs/update-overview-relationship-growth | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #27 | fix/grow-relationship-from-first-meeting | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #26 | perf/chat-stage-timing | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #25 | fix/gemini-chat-timeout | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #24 | fix/anonymous-chat-session-drop | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #23 | cleanup/remove-legacy-proactive-path | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #22 | docs/audit-overview-against-source | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #21 | docs/update-implementation-overview | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #20 | fix/workday-grounding | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #19 | fix/chat-failure-recovery | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #18 | fix/chat-turn-dedupe | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #17 | fix/preserve-active-chat-history | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #16 | fix/body-clock-claim-rpc | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #15 | refine/sleepy-tag | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #14 | refine/proactive-action-tags | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #13 | cleanup/legacy-proactive-tags | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #12 | feature/proactive-derived-tags | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #11 | fix/safari-load-failed-message | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #10 | fix/chat-network-reliability | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #9 | fix/chat-reliability-cleanup | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #8 | fix/recall-history-grounding | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #7 | fix/chat-request-diagnostics | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #6 | fix/use-chat-proxy | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #5 | fix/recall-keep-recent-history | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #4 | fix/anonymous-session-cache-reset | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #3 | fix/gemini-json-retry | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #2 | fix/legacy-safari-cache | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |
| #1 | fix/anonymous-email-history | main反映済み | GitHub merged_at/merge SHAを確認。現在の各機能存続・実稼働は別途精査。 |

## 読み方

JSON版には完全SHA、review_state、scope、現行存続未確認、根拠PR/merge履歴、次の精査を保存。文書の精査済み判定は対象範囲をreasonに限定し、原資産の機能を完成扱いにしない。証拠不足は無価値という意味ではなく、内容・採否を失わず後続調査へ渡すための保留。

今回の重点は10のlegacy安全性対応、11の設計案保全・回収順序。今後はDOCのpendingを本文差分ごとに減らし、BRのhistorical反映から現行機能の存続/置換まで順次照合する。
