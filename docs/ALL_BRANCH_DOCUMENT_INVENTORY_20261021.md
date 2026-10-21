# 全ブランチ文書棚卸し・実測ログ（2026-10-21）

目的：92ブランチそれぞれの全ドキュメント（.md/.mdx/.rst/.txt、docs/以外も含む）をGitHub Trees API recursive=1で列挙し、パスとblob SHAを照合する。これは進捗ログであり、全件完了の証明ではない。

## 実測状況
- GitHub branches API: 92枝取得（per_page=100）。
- Trees APIによる個別検証：**24/92枝**。いずれも `truncated=false`。
- 監査基準HEAD: `b7ef7eb44bcf9d33bf4b091bf17ae8b409062a11`（調査開始時）。
- 残り68枝：未列挙。文書本文の精査・mainとの差分照合は未完了。

| ブランチ | 文書数 | 特記 |
|---|---:|---|
| chore/restore-relationship-rpc-migration | 9 | 復元用、再適用禁止 |
| cleanup/legacy-proactive-tags | 1 | supabase/BODY_CLOCK.md |
| cleanup/remove-legacy-proactive-path | 2 | overview旧版 |
| codex/legacy-maintenance-drain | 4 | **BLOCKED**、LEGACY_MAINTENANCE_DRAIN.md・WRITE_SURFACE_INVENTORY.mdを含む |
| codex/server-canonical-foundation | 3 | overview旧版 |
| design/shared-conversation-engine-contract-20261015 | 10 | SHARED_CONVERSATION_ENGINE_DESIGN_20261015.mdを含む |
| docs/audit-overview-against-source | 2 | overview別SHA |
| docs/development-registry-audit-20261020 | 13 | 引継ぎ・基本構想・台帳・追跡表を含む |

## 初期の文書差分・取りこぼし候補
- `docs/LEGACY_MAINTENANCE_DRAIN.md` と `docs/WRITE_SURFACE_INVENTORY.md` は、少なくとも監査ブランチHEADの13文書に含まれない。BLOCKED理由の保存・検証が必要。
- `docs/SHARED_CONVERSATION_ENGINE_DESIGN_20261015.md` は監査ブランチHEADに含まれない。設計文書として要全文確認。
- `docs/IMPLEMENTATION_OVERVIEW.md` は複数のblob SHAが存在し、同名でも内容が異なる。最新版だけを読んで全履歴を把握したとは扱わない。
- `supabase/BODY_CLOCK.md` も文書に含める。ただし本番Supabaseへの接続・変更は行わない。

## 次の作業
残り84枝のTreeを列挙し、全ファイルのpath/blob SHA、固有文書、版違いを一覧化する。その後、固有文書・差分文書を読み、実装総覧・開発台帳と突合する。main、Production、Supabase、デプロイ、PRマージ、ブランチ削除は変更しない。

## 追加調査：9〜16枝（2026-10-21）
GitHub Trees APIで次の8枝を列挙。いずれも `truncated=false`。**累計16/92枝**、残り76枝。文書数は各枝の全パス（docs外含む）に対する拡張子フィルタ。

| ブランチ | 文書数 | 監査ブランチ未収録の文書候補 |
|---|---:|---|
| docs/multi-character-data-scope-inventory | 10 | MULTI_CHARACTER_DATA_SCOPE_INVENTORY.md |
| docs/multi-character-rpc-caller-audit | 11 | MULTI_CHARACTER_DATA_SCOPE_INVENTORY.md、MULTI_CHARACTER_RPC_CALLER_AUDIT.md |
| docs/production-source-of-truth-reconciliation | 11 | HANDOFF_NEXT_SORA_2026-10-14.md、PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md |
| docs/relationship-five-axis-design-review-20261015 | 9 | IMPLEMENTATION_OVERVIEW.md別SHA |
| docs/relationship-v1-2-stage-growth-principles | 9 | GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md、RELATIONSHIP_ENGINE_V1_2_WORK_HANDOFF.md |
| docs/update-implementation-overview | 2 | IMPLEMENTATION_OVERVIEW.md旧版 |
| docs/update-overview-relationship-growth | 2 | IMPLEMENTATION_OVERVIEW.md旧版 |
| experiment/conversation-lab-offline-v1-20261015 | 15 | CONVERSATION_LAB_PRODUCTION_PARITY_AUDIT_20261015.md、CONVERSATION_LAB_PROMPT_EXTRACTION_CONTRACT_20261015.md、CONVERSATION_LONG_TERM_PROBES_20261019.md、CONVERSATION_QUALITY_MULTITURN_GATE_20261017.md、CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md、CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md |

この段階で判明したのは**監査ブランチHEADに存在しない文書パス**であり、台帳本文への転記済みか、内容が同等か、mainに統合済みかは未判定。特にPR #86関連の実験文書6件は全文精査対象。既存文書を勝手に上書きしない。

## 追加調査：17〜24枝（2026-10-21）
Trees APIで8枝を確認。全件 `truncated=false`。**累計24/92枝**、残り68枝。

| ブランチ | 文書数 | 特記事項 |
|---|---:|---|
| experiment/interpreter-gradual-acting-20261015 | 26 | Relationship / Body Clock / Actingのrace・RPC・prompt・version監査群、Free/Premium記憶基準、長期会話調整計画など固有文書多数 |
| experiment/shared-conversation-history-v1-20261015 | 13 | CONVERSATION_ENGINE_MULTICHARACTER_GAP_AUDIT、PROMPT_EXTRACTION_GATE、PROMPT_INSTRUCTION_INVENTORYなど |
| feature/proactive-derived-tags | 1 | BODY_CLOCK.mdのみ |
| fix/anonymous-chat-session-drop | 2 | overview旧版とBODY_CLOCK.md |
| fix/anonymous-email-history | 1 | BODY_CLOCK.mdのみ |
| fix/anonymous-session-cache-reset | 1 | BODY_CLOCK.mdのみ |
| fix/body-clock-claim-rpc | 1 | BODY_CLOCK.mdのみ |
| fix/chat-failure-recovery | 1 | BODY_CLOCK.mdのみ |

**注意：** `experiment/shared-conversation-history-v1-20261015` 内に `AMAFURU_WEATHER_DISASTER_INTEGRATION_HANDOFF_20261016.md` が存在する。これはMisakiリポジトリ内の文書として存在確認のみ行った。別プロジェクト「アメふる」の調査・変更はしない。

新たな精査対象：`RELATIONSHIP_BODY_CLOCK_RACE_AUDIT_20261015.md`、`RELATIONSHIP_BODY_CLOCK_RPC_VERIFICATION_GAP_20261015.md`、`RELATIONSHIP_VERSION_LEGACY_WRITER_AUDIT_20261015.md`、`MISAKI_FREE_PREMIUM_MEMORY_PROACTIVE_BASELINE_20261019.md`。安全性とデータ境界に関わる可能性があるため、main統合の判断前に全文と実コードの照合が必要。
