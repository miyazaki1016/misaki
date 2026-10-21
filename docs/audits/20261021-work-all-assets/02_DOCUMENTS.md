# ② 全ドキュメント索引

全92枝・504所属・61パス・85固有Blob版。本文取得とSHA全件一致。**全版の意味内容精査は未完了**。内容欄は本文冒頭の機械抜粋。全見出し・代表枝の最終更新履歴はdocuments.json。

## D001 docs/ALL_BRANCH_DOCUMENT_INVENTORY_20261021.md
- 文書名: 全ブランチ文書棚卸し・実測ログ（2026-10-21）
- Blob: `82ea5d4d8f4f8ae7d803e543cc6684758dfa3657` (5779 bytes)、同名1版、main同一=False
- 所属: `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `22a22826569fe06aa294b95afaac5e38cdc92642` / 2026-10-21T02:50:23Z / docs: inventory branch document trees 17-24 of 92
- 目的・主内容の本文抜粋: 目的：92ブランチそれぞれの全ドキュメント（.md/.mdx/.rst/.txt、docs/以外も含む）をGitHub Trees API recursive=1で列挙し、パスとblob SHAを照合する。これは進捗ログであり、全件完了の証明ではない。 - GitHub branches API: 92枝取得（per_page=100）。 - Trees APIによる個別検証：**24/92枝**。いずれも `truncated=false`。 - 監査基準HEAD: `b7ef7eb44bcf9d33bf4b091bf17ae8b409062a11`（
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D002 docs/AMAFURU_WEATHER_DISASTER_INTEGRATION_HANDOFF_20261016.md
- 文書名: アメふる × 美咲 気象・防災データ連携 — 美咲側引継ぎ（2026-10-16）
- Blob: `fcfab902743c4918813de44ad2d797bd466eda7a` (2323 bytes)、同名1版、main同一=False
- 所属: `experiment/shared-conversation-history-v1-20261015`
- 最新変更（代表枝）: `9ca4f4d0bef5c2a46142d3feec3d45aa20a380c0` / 2026-10-16T00:11:28Z / docs: cross-link Amahuru/Misaki shared weather integration contract
- 目的・主内容の本文抜粋: **状態: Draft設計。API接続・本番置換・DB変更は未実施。** アメふる側 Draft PR #60: https://github.com/miyazaki1016/emergencyalert/pull/60 - 契約案ファイル: `miyazaki1016/emergencyalert/docs/AMAFURU_MISAKI_INTEGRATION_CONTRACT_20261016.md`（PR #60のbranchに存在。**mainへ反映済みではない**） - アメふる総覧の索引: `docs/PROJECT_OVERVIEW.md
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D003 docs/BRANCH_AUDIT_TRACKER_20261021.md
- 文書名: 全ブランチ追跡表（92枝）
- Blob: `a69704982f4676ae7e1ca66712b32e924b8ecb99` (15809 bytes)、同名1版、main同一=False
- 所属: `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `cfe922f050d2ee36f4d14dccabdb19921afb0d9e` / 2026-10-21T02:28:41Z / docs: sort all 92 branch timestamps newest first
- 目的・主内容の本文抜粋: - 母集団：92枝（mainと本監査ブランチを含む）。表は最終コミット日時の新しい順（UTC）に並び替え済み。監査ブランチ自身の日時は記録時点のスナップショットで、監査コミットごとに更新される。 - 作業順：この表で未確認項目を埋め、全92枝の日時確認は完了。次にmain差分・PR・Preview・未反映作業を検証する。 - 判定基準：`main...branch` ahead/behindは分岐差分。PR統合履歴・本番反映・機能同等性は別途証拠が必要。 1. 全枝の最終コミット日時をGitHubコミット情報から取得する。作成日時として扱わない。 2. 
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D004 docs/CONTEXT_AB_EXPERIMENT.md
- 文書名: Context A/B experiment: acceptance criteria
- Blob: `8dc57e97acfdf931d875cecbb7ac39ad35fa72cb` (3992 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `ad86a8d565aa502f872b4a867584e2fa576659a4` / 2026-10-12T22:09:52Z / docs: define context A/B quality and release gates
- 目的・主内容の本文抜粋: Status: experimental only. This experiment does not change the production chat route and must not be merged into production based on token savings alone. - **A (control):** append the latest eight Misaki replies to the system instruction, even though those replies are already rep
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D005 docs/CONVERSATION_ENGINE_MULTICHARACTER_GAP_AUDIT_20261016.md
- 文書名: Production prompt vs three-layer multi-character prompt — gap audit (2026-10-16)
- Blob: `54c033dcf3549ed789175f59d966d34efcf2af0f` (4906 bytes)、同名1版、main同一=False
- 所属: `experiment/shared-conversation-history-v1-20261015`
- 最新変更（代表枝）: `45872c0fc4c335723be6579acc22ad64bacb47de` / 2026-10-15T23:51:16Z / docs: audit production-to-layered prompt gaps and multi-character migration gates
- 目的・主内容の本文抜粋: Status: Draft audit; **not** production-equivalent and **not** a migration approval. Source baseline: `app/api/chat/route.ts` on main; experimental `lib/conversation-engine/base-prompt.ts`, `layered-context.ts`, `layered-prompt.ts`. - The legacy `buildBaseSystemPrompt` preserves 
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D006 docs/CONVERSATION_ENGINE_PROMPT_EXTRACTION_GATE_20261015.md
- 文書名: Shared prompt builder — extraction gate (2026-10-15)
- Blob: `3232ab4753618f217efd1e78ed34ac1418dca4f9` (2800 bytes)、同名1版、main同一=False
- 所属: `experiment/shared-conversation-history-v1-20261015`
- 最新変更（代表枝）: `07dce6253d090770f4ee77c690269848ded101c5` / 2026-10-15T09:54:33Z / docs: establish exact prompt extraction parity gates and source order
- 目的・主内容の本文抜粋: Status: pre-extraction audit only. PR #88 remains Draft. Existing production chat route is unchanged. Production `app/api/chat/route.ts` constructs `baseSystemPrompt` after loading a **versioned persona** via `loadPersonaPrompt`, a canonical relationship state, life/profile/time/
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D007 docs/CONVERSATION_ENGINE_PROMPT_INSTRUCTION_INVENTORY_20261016.md
- 文書名: Base prompt instruction inventory — classification gate (2026-10-16)
- Blob: `eac5633f006e86792864a672483afeca5b70c8fb` (6196 bytes)、同名1版、main同一=False
- 所属: `experiment/shared-conversation-history-v1-20261015`
- 最新変更（代表枝）: `918abffbe341d9264ee161c28d5d2e3b8b1ceb41` / 2026-10-15T23:59:21Z / docs: add explicit JSON schema key checklist for prompt drift gate
- 目的・主内容の本文抜粋: **Scope:** complete current `lib/conversation-engine/base-prompt.ts` on Draft PR #88, extracted from `app/api/chat/route.ts`. This inventory is **classification only**; do not use it to replace the current production prompt. Existing byte-parity fixture is the compatibility basel
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D008 docs/CONVERSATION_LAB_PRODUCTION_PARITY_AUDIT_20261015.md
- 文書名: Conversation lab / production parity audit (2026-10-15)
- Blob: `2c0398dd17ee58c8b01e52b55abea195eee33dc0` (4270 bytes)、同名1版、main同一=False
- 所属: `experiment/conversation-lab-offline-v1-20261015`
- 最新変更（代表枝）: `2d5d2eddb5cabca44f50f3c498f64d7aa98160db` / 2026-10-15T08:00:09Z / docs: audit production chat versus isolated conversation lab and safety gates
- 目的・主内容の本文抜粋: Status: documentation-only audit; no Gemini invocation, DB reads or writes, production modification, or production parity claim. Source reviewed: main at c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa; PR #85 remains separate Draft. 1. **P1 preview access/cost risk**: acting-lab endpoi
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D009 docs/CONVERSATION_LAB_PROMPT_EXTRACTION_CONTRACT_20261015.md
- 文書名: Production prompt extraction: pre-change contract and regression gates
- Blob: `49122fdbd4436efbd9283387602c2a514077534e` (3364 bytes)、同名1版、main同一=False
- 所属: `experiment/conversation-lab-offline-v1-20261015`
- 最新変更（代表枝）: `f9f24a2f383855b2b4ec1437f929b5de4920579b` / 2026-10-15T08:02:12Z / docs: freeze production prompt parity contract before any extraction
- 目的・主内容の本文抜粋: Date: 2026-10-15. Source: `main` commit `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`, `app/api/chat/route.ts` around system prompt and reply generation. The production prompt is an interpolated template involving numerous dynamic guides and source-dependent values. Moving the templ
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D010 docs/CONVERSATION_LONG_TERM_PROBES_20261019.md
- 文書名: Long-term conversation evaluation additions
- Blob: `040a75d2e0e5b11a2bf2f447af67907533dff7ed` (819 bytes)、同名1版、main同一=False
- 所属: `experiment/conversation-lab-offline-v1-20261015`
- 最新変更（代表枝）: `817349b518e884012c6c7ee99dd3c56751a597ac` / 2026-10-19T02:05:54Z / docs: outline long-term relationship conversation probes
- 目的・主内容の本文抜粋: Draft scenarios for PR #86, not measured model quality. - Distinguish user facts from shared episodes; do not invent dates or events. - Compare newly established and mature relationships without score inflation. - Respect separation of memory-based proactive messages between Free
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D011 docs/CONVERSATION_QUALITY_MULTITURN_GATE_20261017.md
- 文書名: 美咲 会話育成：多往復品質評価ゲート（2026-10-17）
- Blob: `24c0c214054c0ea5e9a3c9c99aa7b5e21ca77133` (11316 bytes)、同名1版、main同一=False
- 所属: `experiment/conversation-lab-offline-v1-20261015`
- 最新変更（代表枝）: `cb9e01cd3bed34f0e2ae8627a50993b8cabc963b` / 2026-10-19T02:34:00Z / docs: link real-model readiness audit from quality gate
- 目的・主内容の本文抜粋: **状態:** Draft実験シナリオ追加のみ。実Gemini呼び出し・本番DB・本番会話ルート・PR mergeなし。 美咲の会話品質を、多様な性格・生活・関係・記憶を持つ合成ユーザーとの複数往復で評価する。単なる「自然そうな一言」ではなく、数ターン後の矛盾・先回り・記憶捏造・関係の飛躍・別キャラクター情報漏えいを検知する。 - `lib/conversation-lab/quality-probes.ts`: 12ケース、各2〜3のユーザー発話と既知コンテキスト、期待する性質、禁止するふるまい。8観点: context, memory, relati
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D012 docs/CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md
- 文書名: 2026-10-19 実モデル会話評価の実行前監査・停止ゲート
- Blob: `3b387da4876452a90eda5dca82c791be602de6c5` (17064 bytes)、同名1版、main同一=False
- 所属: `experiment/conversation-lab-offline-v1-20261015`
- 最新変更（代表枝）: `cf2ebe76d060a56422a33e70ba0a4b9019dd1933` / 2026-10-19T12:40:44Z / docs: record branch-pinned, readiness-gated iPhone Gemini test and outstanding GitHub setup
- 目的・主内容の本文抜粋: 状態：**静的ソース監査のみ。実Gemini未実施。オーナー承認待ち。** 対象：main の `app/api/acting-lab/route.ts`、`lib/gemini-json-generator.ts`、`lib/relationship-acting-guide.ts`、Draft PR #86 のオフライン評価器。 PR #86 の18ケースのオフライン試験・レビュー記録・比較ゲートは構造検証用として利用できる。しかし、現行 `/api/acting-lab` をそのまま「本番の美咲の会話品質が分かる検証口」として使うのは不適切。**現
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D013 docs/CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md
- 文書名: 美咲 Q02 実Gemini 2往復スモーク：オペレーター実行手順（2026-10-19）
- Blob: `804407c3dcbb0ca3e6a0d1e765be2d8a9a3cca4a` (3425 bytes)、同名1版、main同一=False
- 所属: `experiment/conversation-lab-offline-v1-20261015`
- 最新変更（代表枝）: `a901723a9573a1f6d7842c67f56d703ae782ca4a` / 2026-10-19T04:10:16Z / docs: give one-shot operator steps without extracting Vercel secrets
- 目的・主内容の本文抜粋: **実行状況：未実施。Gemini実測0回。** Draft PR #86 branch上のローカルCLIを使用。**公開Web APIを追加しない**。PreviewデプロイがREADYでも自動実行はされない。 - PR #86の同じcommitがCI成功していることを確認する。 - 作業はオーナーが認証済みの自身の開発端末、または保護された開発環境で行う。共有端末・公開CIの未保護ログで実行しない。 - 初回はQ02（架空ユーザーが過去の約束を尋ねる、2往復）だけ。**最大2物理API呼出し、再試行なし**。 - Google側の請求/使用量と支出ア
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D014 docs/CONVERSATION_TUNING_LAB_PLAN_20261015.md
- 文書名: 美咲 会話育成実験室 — 実装入口と初回実験計画（2026-10-15）
- Blob: `5ee661407d2da6d1bd50007bb6393d4d213fa86c` (5067 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `b471cf2e3f9f18a6a4d0b8657ab373605273d498` / 2026-10-15T07:31:46Z / docs: audit existing acting lab and establish conversation tuning plan
- 目的・主内容の本文抜粋: 美咲の人格・会話品質は、実際の Gemini 応答を観察し、反例を集め、調整する段階に未着手。既存の単体テスト・プロンプト差分・source audit は**会話品質の実測ではない**。仕組みの整合性改善と会話育成は並行する。 - `app/api/acting-lab/route.ts` は既に開発用の演技研究室。Supabase クライアントを作らず、`VERCEL_ENV=production` では 404、`GEMINI_API_KEY` がなければ 500。 - 同 API は `createRelationshipActingGuide`
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D015 docs/DEVELOPMENT_REGISTRY.md
- 文書名: Misaki 開発管理台帳 — 棚卸し中
- Blob: `ef27ea36622c0a3d40fad7e0b8c2391594184410` (150333 bytes)、同名1版、main同一=False
- 所属: `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `399f93472de181c5da254748767b6a97f7b2fed6` / 2026-10-21T01:23:11Z / docs: audit conversation lab and Free Premium memory design
- 目的・主内容の本文抜粋: 更新: 2026-10-20 JST 状態: **第1版／棚卸し途中。確認済みの証拠と未確認事項を分離。** 調査対象: `miyazaki1016/misaki`、全91ブランチ（main含む）のGit ancestry比較、主要ブランチのファイル差分・資料・PR。 この台帳の作成は専用docsブランチのみ。main・Production・Supabase・Gemini実呼出しは変更しない。 - **A**: mainに実装済み（機能の動作とコードを別途確認）。 - **B**: 作業ブランチに実装と検証記録があるが、main反映が確認できない。 - 
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D016 docs/GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md
- 文書名: Gemini Unit-Cost Telemetry — Work Handoff
- Blob: `ce90e641d80b74eb852df5f317cb7837c9cc2ab8` (3776 bytes)、同名1版、main同一=False
- 所属: `docs/relationship-v1-2-stage-growth-principles`
- 最新変更（代表枝）: `ed8359319181f20cf73aec87ab75c7a1405264f2` / 2026-10-04T04:41:44Z / Add Gemini unit cost telemetry Work handoff
- 目的・主内容の本文抜粋: Status: READY FOR WORK AS AN ISOLATED TELEMETRY-ONLY DRAFT PR. Do not merge without Sora review. Do not alter Relationship v1.1 behavior. Measure actual Gemini provider usage for Misaki so Free 20 / Premium 50 daily limits can be decided from Production unit economics rather than
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D017 docs/GEMINI_USAGE_TELEMETRY.md
- 文書名: Gemini provider usage telemetry
- Blob: `4e48f72678499ba1de0158e089c9e0a21e327cb7` (5636 bytes)、同名1版、main同一=True
- 所属: `test/relationship-acting-state-comparison`, `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/relationship-identity-v1`, `fix/expired-temporary-relationship-import`, `main`, `sora/lp-pwa-mobile-layout`, `sora/lp-relationship-story`, `fix/relationship-analyzer-bounded-retry`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/production-source-of-truth-reconciliation`, `docs/relationship-five-axis-design-review-20261015`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`, `work/forget-control-v1`, `work/gemini-unit-cost-telemetry`, `work/quality-long-history-workflow`, `chore/restore-relationship-rpc-migration`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `5422d450b843bc44137ce3938b419984e765acba` / 2026-10-04T05:22:51Z / Observe Gemini physical-call usage with server-only cost telemetry (#61)
- 目的・主内容の本文抜粋: Observability only. Source handoff: `docs/GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md` at commit `ed8359319181f20cf73aec87ab75c7a1405264f2` on `docs/relationship-v1-2-stage-growth-principles` (not yet on main when implemented). Each physical `generateContent` attempt produces its 
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D018 docs/HANDOFF_NEXT_SORA_2026-10-14.md
- 文書名: 次のソラへの引き継ぎ — Misaki
- Blob: `7e694b6a2fcc4b97c60612974109ae53abdd6511` (7333 bytes)、同名1版、main同一=False
- 所属: `docs/production-source-of-truth-reconciliation`
- 最新変更（代表枝）: `ce8e41f47af98f766c75e1f27787d0b585c452a7` / 2026-10-14T00:30:10Z / docs: add next Sora handoff for Oct 14
- 目的・主内容の本文抜粋: 最終更新: 2026-10-14 1. docs/IMPLEMENTATION_OVERVIEW.md — 正本の総覧。特に2026-10-14追補。 2. docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md — Main / production DB / migration ledger / RPC provenanceの照合台帳。 3. docs/MULTI_CHARACTER_PHASE0_AUDIT.md — 現行データ所有権・RPC caller・ACL・worker・Body Clock等の複
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D019 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `0715dd8a2e80829584525c639c79060eda89369c` (206759 bytes)、同名24版、main同一=False
- 所属: `work/forget-control-v1`
- 最新変更（代表枝）: `84d147ba5b46698d3b46fb727a9859f87f79f3d2` / 2026-10-06T21:20:42Z / Document Forget Control Preview acceptance gate
- 目的・主内容の本文抜粋: 最終更新: 2026-10-07 実装ソース照合基準: `main` @ `eb9ca4bec1a8a24afc58d4728f3c2bac3164bbf2` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D020 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `083dd5663fb7d3dc3961f302d290cc490eb33ac0` (16587 bytes)、同名24版、main同一=False
- 所属: `docs/update-overview-relationship-growth`
- 最新変更（代表枝）: `1d9db32ea15fbea950ac46090cb6e1a8bc750001` / 2026-09-18T03:15:09Z / Update overview for relationship growth and chat diagnostics
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 実装ソース照合基準: `main` @ `a87c0d753589d1014ff868cf5fe7c29581c11a0a` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D021 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `23c3a183fb9092f71d4ae762e2c4f8ea6e8478eb` (233506 bytes)、同名24版、main同一=False
- 所属: `work/conversation-context-compression-spike`
- 最新変更（代表枝）: `ece799c20d685f00c007cb2f897bdd6b2443a2d3` / 2026-10-07T23:23:35Z / docs: record Acting Guide lover acceptance
- 目的・主内容の本文抜粋: 最終更新: 2026-10-07 実装ソース照合基準: `main` @ `49a663258e93af88566be586d758442ad92dfaf1` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D022 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `29c5f78792cbab0803df52dd50e63ec2bb5900cb` (278273 bytes)、同名24版、main同一=False
- 所属: `docs/relationship-five-axis-design-review-20261015`
- 最新変更（代表枝）: `8a7f467761f9c5b42be4bb375d616eec67d47c7c` / 2026-10-14T20:22:04Z / docs: define incremental relationship interpreter design and acceptance gates
- 目的・主内容の本文抜粋: 最終更新: 2026-10-13 実装ソース照合基準: `main` の既存実装を読み取り照合（本追記前のHEAD。追記は文書のみ） この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 Misakiの中核価値は、単に質問に答えるチャットではなく、**「あなたの生活を覚えている人」**として、ユーザーの仕事、生活、過去の出来事、感情、相手との関係を継続して理解し、会話や適切なタイミングの働きかけに反映すること。 初期の市場仮説は、タクシー運転手向けAI彼女から開始し、仕事・生活の理解を軸に隣接領域へ展
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D023 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `343aca20f18654273bc54860d95cbcd2ca1cd0d9` (151139 bytes)、同名24版、main同一=False
- 所属: `sora/lp-relationship-story`, `sora/update-overview-relationship-v1-production`, `work/gemini-unit-cost-telemetry`
- 最新変更（代表枝）: `4a59cbc7b163b199ffcf9f975a969cbc254cbfe2` / 2026-10-03T15:36:07Z / Document Relationship Engine v1.1 behavior and backend contracts
- 目的・主内容の本文抜粋: 最終更新: 2026-10-04 実装ソース照合基準: `main` @ `b3811b4c91c37b567767b7c0294b524877c9ece9` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D024 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `3da8bad0e216589a006cb9862278e012c72f2dc3` (92511 bytes)、同名24版、main同一=False
- 所属: `sora/relationship-time-v2-design`
- 最新変更（代表枝）: `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64` / 2026-09-25T10:01:28Z / Document relationship story consistency and proactive safety gates
- 目的・主内容の本文抜粋: 最終更新: 2026-09-25 実装ソース照合基準: `main` @ `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3` / PR #31 head @ `26c864cfb0193121a31978274548019a33748385` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D025 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `3e5c58a25344e9042c9245b4873158a97237ffb5` (12773 bytes)、同名24版、main同一=False
- 所属: `fix/gemini-chat-timeout`, `fix/grow-relationship-from-first-meeting`, `perf/chat-stage-timing`, `fix/anonymous-chat-session-drop`, `cleanup/remove-legacy-proactive-path`
- 最新変更（代表枝）: `15cb968736c6c4b2442f9363b7c55f5b299ae5cb` / 2026-09-18T00:15:46Z / 旧ブラウザ自発メッセージ経路を削除する
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 実装ソース照合基準: `main` @ `7131c4775f295ff9438da38a72f6d69b022353f4` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D026 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `3eb6a94143ebd5c3dadf4a82a230c18f934be1bc` (111293 bytes)、同名24版、main同一=False
- 所属: `sora/canonical-relationship-integration`
- 最新変更（代表枝）: `0f10f0506c95fdf0aadf8d0fd7f4afa6ec14f359` / 2026-10-02T13:09:00Z / docs: record completed production canonical cutover
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 実装ソース照合基準: `main` @ `8339ee5fad7465e5e003b9877b2e0552ff144506` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D027 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `55984ee1349d457ddccaddd50cdf50e1620c4e6c` (287902 bytes)、同名24版、main同一=False
- 所属: `experiment/conversation-lab-offline-v1-20261015`
- 最新変更（代表枝）: `4efa62b017ca80fe79403a55c172f22a754f2d29` / 2026-10-20T11:17:21Z / docs: hand off October 20 conversation lab progress and unresolved smoke-test blockers
- 目的・主内容の本文抜粋: 最終更新: 2026-10-13 実装ソース照合基準: `main` の既存実装を読み取り照合（本追記前のHEAD。追記は文書のみ） この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 Misakiの中核価値は、単に質問に答えるチャットではなく、**「あなたの生活を覚えている人」**として、ユーザーの仕事、生活、過去の出来事、感情、相手との関係を継続して理解し、会話や適切なタイミングの働きかけに反映すること。 初期の市場仮説は、タクシー運転手向けAI彼女から開始し、仕事・生活の理解を軸に隣接領域へ展
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D028 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `6a2f72ccbf3daf957885f830977f47ec4d973c85` (159702 bytes)、同名24版、main同一=False
- 所属: `sora/lp-pwa-mobile-layout`
- 最新変更（代表枝）: `3c679a30952287371645cb3186f31aa9a0026e8b` / 2026-10-04T06:53:09Z / docs: record PR 62 landing page completion
- 目的・主内容の本文抜粋: 最終更新: 2026-10-04 実装ソース照合基準: `main` @ `bec0a134b6fdef43f554602c2b6e029c565eb0e2` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D029 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `711b7674d9fa8547f73137016030c2a10195d859` (267431 bytes)、同名24版、main同一=True
- 所属: `test/relationship-acting-state-comparison`, `main`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `experiment/shared-conversation-history-v1-20261015`, `chore/restore-relationship-rpc-migration`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `b45d083785bcb456c72c65e00a61af1b7c7a9b34` / 2026-10-13T07:19:11Z / docs: consolidate long-term Misaki product and architecture vision
- 目的・主内容の本文抜粋: 最終更新: 2026-10-13 実装ソース照合基準: `main` の既存実装を読み取り照合（本追記前のHEAD。追記は文書のみ） この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 Misakiの中核価値は、単に質問に答えるチャットではなく、**「あなたの生活を覚えている人」**として、ユーザーの仕事、生活、過去の出来事、感情、相手との関係を継続して理解し、会話や適切なタイミングの働きかけに反映すること。 初期の市場仮説は、タクシー運転手向けAI彼女から開始し、仕事・生活の理解を軸に隣接領域へ展
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D030 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `779bcd2bbedbfb4fbfb512278e3b8706ee91a14d` (265599 bytes)、同名24版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `b98733f159760560b8ababa80fcc35dc9f92fa76` / 2026-10-12T01:20:18Z / docs: clarify memory certainty handoff status
- 目的・主内容の本文抜粋: 最終更新: 2026-10-12 実装ソース照合基準: `main` @ `49a663258e93af88566be586d758442ad92dfaf1` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D031 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `79708d00e96fbcbc68b115fa5a2be0c81d75e4c1` (107211 bytes)、同名24版、main同一=False
- 所属: `sora/misaki-acting-lab`
- 最新変更（代表枝）: `1a8852b9fc42c7a337855156bd43ae1af4a683db` / 2026-10-02T23:00:44Z / docs: checkpoint multi-browser quota sync and Work handoff
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 実装ソース照合基準: `main` @ `8339ee5fad7465e5e003b9877b2e0552ff144506` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D032 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `936f61c6363da27b384e37b00f08aec6b999cd75` (12969 bytes)、同名24版、main同一=False
- 所属: `docs/audit-overview-against-source`
- 最新変更（代表枝）: `f6d8baf94d037057ec94deb87b156a713445d37f` / 2026-09-17T23:35:49Z / Audit implementation overview against latest source
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 実装ソース照合基準: `main` @ `7131c4775f295ff9438da38a72f6d69b022353f4` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D033 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `98551eeb0693a352aaf2c639babec34c95ff6484` (165138 bytes)、同名24版、main同一=False
- 所属: `fix/expired-temporary-relationship-import`, `fix/relationship-analyzer-bounded-retry`
- 最新変更（代表枝）: `3b06b33582c6651240f59acd5a4108c5cf39b34d` / 2026-10-05T15:43:05Z / docs: add hidden persona progressive self-disclosure plan
- 目的・主内容の本文抜粋: 最終更新: 2026-10-04 実装ソース照合基準: `main` @ `e51c3326357b6e6f12455d5063b00da88b703b23` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D034 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `9c36f6cee3565d81c46cea4aa9d8c8894f5705ea` (215571 bytes)、同名24版、main同一=False
- 所属: `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/quality-long-history-workflow`
- 最新変更（代表枝）: `18e2c0bdfa007c980858f85341eb8c78e0e5301a` / 2026-10-07T06:02:14Z / docs: freeze relationship identity persistence boundary
- 目的・主内容の本文抜粋: 最終更新: 2026-10-07 実装ソース照合基準: `main` @ `49a663258e93af88566be586d758442ad92dfaf1` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D035 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `aa91a9c9c7148a6b4fe8d219075ee711a873eff7` (275509 bytes)、同名24版、main同一=False
- 所属: `docs/production-source-of-truth-reconciliation`
- 最新変更（代表枝）: `11b0e771d81cb034fbc6595b3ae18de0856aea38` / 2026-10-14T00:30:00Z / docs: add Oct 14 handoff and work inventory
- 目的・主内容の本文抜粋: 最終更新: 2026-10-14 実装ソース照合基準: `main` の既存実装を読み取り照合（本追記前のHEAD。追記は文書のみ） この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 Misakiの中核価値は、単に質問に答えるチャットではなく、**「あなたの生活を覚えている人」**として、ユーザーの仕事、生活、過去の出来事、感情、相手との関係を継続して理解し、会話や適切なタイミングの働きかけに反映すること。 初期の市場仮説は、タクシー運転手向けAI彼女から開始し、仕事・生活の理解を軸に隣接領域へ展
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D036 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `b017757c16aa0435c8d39973da0f7f944247bfb5` (9518 bytes)、同名24版、main同一=False
- 所属: `docs/update-implementation-overview`
- 最新変更（代表枝）: `621dea871afc4dca517071cc79666d81cb69e29c` / 2026-09-17T23:29:33Z / Update Misaki implementation overview
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 基準: `main` @ `323048ccbb5cc34f40ac9873195d60119878e070` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 Misaki の原点は「すべては会話の中にある」。 目標は、会話を生成することではなく、**関係の続きを生きること**。 基本サイクル: 会話 → 知る → 覚える → 感じる → 行動する → また会話になる 実装判断の基準: --- - 関係状態の基盤 - 関係時間 / 無言時間の記録 - チャットタ
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D037 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `b48887633360762cb4821e0027893d30a92cde52` (100628 bytes)、同名24版、main同一=False
- 所属: `sora/fix-waiting-reply-layout`, `sora/gemini-timeout-retry`, `sora/gemini-transient-retry`, `sora/history-edge-trace`, `sora/history-get-trace`, `sora/history-sync-source-proof`, `sora/anonymous-history-get-noop`, `sora/cutover-cleanup`, `sora/profile-aware-life-events`, `sora/remove-false-busy-wait`, `sora/remove-timestamp-history-poll`, `sora/sync-free-usage-with-history`, `codex/server-canonical-foundation`
- 最新変更（代表枝）: `db5b6e17c77f94f54bb4764da3fcf01b764d313e` / 2026-10-02T08:07:11Z / Document production DB and Body Clock cutover audit
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 実装ソース照合基準: `main` @ `8339ee5fad7465e5e003b9877b2e0552ff144506` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D038 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `b6a73e406cc067e4a91f1de5e882dbc626b882bb` (238957 bytes)、同名24版、main同一=False
- 所属: `work/relationship-identity-v1`
- 最新変更（代表枝）: `6266cf8c367da4e822d33c92fae89a0588718962` / 2026-10-11T08:48:01Z / docs: distinguish preview deployment from acceptance
- 目的・主内容の本文抜粋: 最終更新: 2026-10-07 実装ソース照合基準: `main` @ `49a663258e93af88566be586d758442ad92dfaf1` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D039 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `c3c24b7429d89331f31d2abcbdf6f1a69710432c` (287334 bytes)、同名24版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `170f4d76d39c3521ff62a1bf032c066007a632d3` / 2026-10-15T14:42:17Z / docs: establish multi-character persona and state isolation as shared engine design gate
- 目的・主内容の本文抜粋: 最終更新: 2026-10-13 実装ソース照合基準: `main` の既存実装を読み取り照合（本追記前のHEAD。追記は文書のみ） この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 Misakiの中核価値は、単に質問に答えるチャットではなく、**「あなたの生活を覚えている人」**として、ユーザーの仕事、生活、過去の出来事、感情、相手との関係を継続して理解し、会話や適切なタイミングの働きかけに反映すること。 初期の市場仮説は、タクシー運転手向けAI彼女から開始し、仕事・生活の理解を軸に隣接領域へ展
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D040 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `f551c2e456743fd9681c9c3db40b349699a5ea0b` (199079 bytes)、同名24版、main同一=False
- 所属: `docs/relationship-v1-2-stage-growth-principles`
- 最新変更（代表枝）: `bc35eb6231ee93b9843f0bfbf967fde71fc97561` / 2026-10-04T04:39:37Z / Define Gemini unit cost telemetry contract
- 目的・主内容の本文抜粋: 最終更新: 2026-10-04 実装ソース照合基準: `main` @ `465075ce07c3b2129de51b14f790c54154521c49` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D041 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `f80f3fe0f505a07e8f2874381f2d9b6b16fc91f3` (126885 bytes)、同名24版、main同一=False
- 所属: `sora/drop-ungrounded-relationship-evidence`, `sora/fix-relationship-polarity-transport`, `work/relationship-engine-v1`, `work/relationship-error-diagnostics`, `work/relationship-polarity-integer`, `sora/relationship-analyzer-stage-diagnostics`, `sora/relationship-analyzer-structured-output-hotfix`, `sora/relationship-control-rpcs-v1`, `sora/relationship-evidence-validation-diagnostics`, `sora/relationship-processing-error-diagnostics`, `sora/remove-relationship-stage-diagnostics`, `sora/remove-relationship-temporary-diagnostics`, `work/relationship-analyzer-diagnostics`
- 最新変更（代表枝）: `112b158a947b71d693c28c50597f63278b11b84d` / 2026-10-03T08:25:32Z / Close Relationship Engine v1 DB work area and hand off to Work
- 目的・主内容の本文抜粋: 最終更新: 2026-10-03 実装ソース照合基準: `main` @ `db32989c48f09be43686b7e3f7aee4f539fe518f` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D042 docs/IMPLEMENTATION_OVERVIEW.md
- 文書名: Misaki 実装・修正 総覧
- Blob: `fc76ff0d9ecb076de4d01a005236f524c92c84d8` (50659 bytes)、同名24版、main同一=False
- 所属: `codex/legacy-maintenance-drain`
- 最新変更（代表枝）: `aa8a1cc4dedc0574f225faa0994efeaea0937cff` / 2026-09-19T16:19:36Z / test: retain Gate 1 barrier lifetime counterexamples and PG17 coverage
- 目的・主内容の本文抜粋: 最終更新: 2026-09-18 実装ソース照合基準: `main` @ `8339ee5fad7465e5e003b9877b2e0552ff144506` この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。 総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。 - チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在 - iPhone側の失敗表示は美咲の会話バブルでは
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D043 docs/INTERPRETER_GRADUAL_COMPARISON_20261015.md
- 文書名: Interpreter 5軸 比較レビュー（2026-10-15）
- Blob: `ca2b53562d061f8fa01cf803b940173b783da8bb` (3756 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `51e4eb157068bd26b05571f8222fc1e5003fbf96` / 2026-10-14T20:25:53Z / docs: compare baseline and gradual interpreter and record regression risks
- 目的・主内容の本文抜粋: 対象: 現行 `lib/relationship-acting-guide.ts` と隔離実験 `lib/relationship-acting-guide-gradual-experiment.ts`。**ソース上の演技指示を比較した静的レビューであり、実Gemini生成結果のA/Bではない。** 現行コードは変更しない。 条件固定: intimacyStage=2、relationshipStatus=none、他軸0、Memory・Emotion・Momentumは入力していない。 1. **実験版は「現行の完全な代替」ではない。** 現行ガイドに
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D044 docs/LEGACY_MAINTENANCE_DRAIN.md
- 文書名: 旧Production互換 maintenance / drain
- Blob: `f64a79e0fe4760641edcac636f1a4e06d3c4d261` (25533 bytes)、同名1版、main同一=False
- 所属: `codex/legacy-maintenance-drain`
- 最新変更（代表枝）: `aa8a1cc4dedc0574f225faa0994efeaea0937cff` / 2026-09-19T16:19:36Z / test: retain Gate 1 barrier lifetime counterexamples and PG17 coverage
- 目的・主内容の本文抜粋: - guardだけでなく、admit、require_operation、browser完了の冪等読取り、freezeのregistry/attempt判定まで対象にする。 - 候補はadvisory lock後の制御行locking read。`FOR SHARE`等はREPEATABLE READ/SERIALIZABLEでsnapshot後に更新済みの行に40001を返し得る。通常SELECTや`FOR KEY SHARE`を同等と見なさない。READ COMMITTEDの待機後再評価も検証が必要。 - 制御行だけのlocking readでは、c
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D045 docs/MISAKI_CHAT_HANDOFF_20261021.md
- 文書名: 美咲・新チャット引継ぎ（2026-10-21）
- Blob: `5d3b44267c489de0b225020b37b50959f2cfe75e` (5528 bytes)、同名1版、main同一=False
- 所属: `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `b7ef7eb44bcf9d33bf4b091bf17ae8b409062a11` / 2026-10-21T02:34:55Z / docs: require Misaki system vision in new-chat handoff
- 目的・主内容の本文抜粋: - **設計思想の独立した正本：`docs/MISAKI_SYSTEM_VISION_20261021.md`**（本監査ブランチ上）。 - 人格の一貫性と成長、Character共通とUser×Character専用データの境界、恋愛・結婚・離婚、Free/Premiumの公平性、Gemini費用と会話品質の両立、開発順序、未決事項を整理した文書。 - **新しいソラは実装・設計判断の前に必ず全文を読む。** 本書は構想であり、実装済みを意味しない。変更するときは理由と根拠を記録する。 - GitHub: `miyazaki1016/misaki`。 
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D046 docs/MISAKI_FREE_PREMIUM_MEMORY_PROACTIVE_BASELINE_20261019.md
- 文書名: 美咲 Free / Premium の長期関係・記憶・想い出・自発メッセージ：事業体験ベースライン
- Blob: `be34a96cd15fb1a819f6415c9895726afe8a1cfe` (7727 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `ef5bd23246a75b02a0df60302263f971de061843` / 2026-10-19T01:46:09Z / docs: record agreed Free/Premium proactive memory and shared-memories product baseline
- 目的・主内容の本文抜粋: 更新日: 2026-10-19 / 状態: **オーナー合意の基本方針**。料金・回数・保存期間・DB/API実装の確定仕様ではない。 登録者数や一時的な会話量だけではなく、「一人のユーザーが長期間、自分の意思で会話を楽しめる関係」を優先する。美咲は単なるアシスタントではなく、人格・話し方・関係性が時間の中で変化し、二人の歴史が自然に積み重なるキャラクター。恋人・結婚はエンディングではない。すれ違い、修復、別れ、復縁、離婚等の成立済みイベントも、事実と合意に基づく関係の履歴として扱い、一方向のレベルアップゲームにしない。 - **User Memory（
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D047 docs/MISAKI_SYSTEM_VISION_20261021.md
- 文書名: Misakiシステム基本構想 — 人格・関係性・記憶・成長（2026-10-21）
- Blob: `572f96e6a291133b4ca246825b262d0ebfbf9c93` (8804 bytes)、同名1版、main同一=False
- 所属: `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `48fc3af46d3624f73a8169cab4975f8ef4d1d2c7` / 2026-10-21T02:34:40Z / docs: capture Misaki system vision and design principles
- 目的・主内容の本文抜粋: - 美咲を、会話のたびにゼロから始まる単発のチャットボットではなく、継続した人格・生活感・価値観・記憶・人間関係を持つ**一貫したキャラクター**として育てる。 - 「人間そのもの」と偽るのではなく、AIキャラクターとして自然で一貫した存在感を実現する。 - キャラクターの性格・知識・生活上の出来事・会話の癖は、積み重ねによって変化し得る。ただし一度の会話で人格が唐突に変わる設計にはしない。 - 当面は**美咲一人の品質を最優先**にする。将来、同じシステム基盤に別のキャラクターを追加できる構造にする。 - 全ユーザーに対して、同一キャラクターとしての美
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D048 docs/MULTI_CHARACTER_DATA_SCOPE_INVENTORY.md
- 文書名: 複数キャラクター化：データ所有・スコープ棚卸し
- Blob: `949bd01677f83cd3bc88194697f30bb8dbc2a9fd` (12571 bytes)、同名1版、main同一=False
- 所属: `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`
- 最新変更（代表枝）: `ad51dfe248fdf9a6903f4ff193f437bf04b2d80c` / 2026-10-13T07:40:56Z / docs: add multi-character data scope inventory
- 目的・主内容の本文抜粋: 最終更新: 2026-10-13 対象: `main` のソース・migration 文面監査 状態: **設計レビュー用。DB変更・本番反映を承認する仕様ではない。** 美咲の現行運用を壊さず、将来のキャラクターごとに人格・記憶・関係性を分離するため、データの所有者と読み書き境界を明確にする。 現行実装は複数の重要データを `user_id` 単位で持ち、キャラクターを識別するキーが見当たらない。したがって、UIやプロンプトに `character_id` を追加するだけでは分離は成立しない。読み取り・書き込み・非同期処理・通知・削除・進化分析の各経路
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D049 docs/MULTI_CHARACTER_PHASE0_AUDIT.md
- 文書名: Misaki Phase 0 実装棚卸し：複数キャラクター拡張の非破壊監査
- Blob: `0baf4f28d863f6e075f745afd5c903145887274f` (27504 bytes)、同名2版、main同一=False
- 所属: `docs/production-source-of-truth-reconciliation`
- 最新変更（代表枝）: `a0c7e3d05fb386c1f4178e9db5fc2128dd9483bc` / 2026-10-13T09:28:09Z / docs: record live Relationship Engine v2 RPC catalog
- 目的・主内容の本文抜粋: 最終更新: 2026-10-13 対象: `main` 目的: 「美咲一人の現行運用を壊さず、将来はユーザー×キャラクターごとに独立した関係・記憶を持てる」構造へ進むための事実確認。 **この文書の作成ではアプリコード・DB・RPC・本番設定を変更していない。** 現状は「キャラクターを切り替えるだけ」の変更では複数キャラクター化できない。関係性のcanonical state、Relationship Engine v1の証拠・エピソード・パターン・処理台帳、人格プロンプトの取得、会話・一時状態、Body Clockがユーザー単位／美咲固定の前提で結び
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D050 docs/MULTI_CHARACTER_PHASE0_AUDIT.md
- 文書名: Misaki Phase 0 実装棚卸し：複数キャラクター拡張の非破壊監査
- Blob: `4de727956e52cc8eeccd772631671af69a13536f` (22233 bytes)、同名2版、main同一=True
- 所属: `test/relationship-acting-state-comparison`, `main`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/relationship-five-axis-design-review-20261015`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `chore/restore-relationship-rpc-migration`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `1fb508c224cb85a492973078ea2f27c5dc5042e6` / 2026-10-13T07:32:51Z / docs: audit relationship RPC and proactive delivery boundaries
- 目的・主内容の本文抜粋: 最終更新: 2026-10-13 対象: `main` 目的: 「美咲一人の現行運用を壊さず、将来はユーザー×キャラクターごとに独立した関係・記憶を持てる」構造へ進むための事実確認。 **この文書の作成ではアプリコード・DB・RPC・本番設定を変更していない。** 現状は「キャラクターを切り替えるだけ」の変更では複数キャラクター化できない。関係性のcanonical state、Relationship Engine v1の証拠・エピソード・パターン・処理台帳、人格プロンプトの取得、会話・一時状態、Body Clockがユーザー単位／美咲固定の前提で結び
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D051 docs/MULTI_CHARACTER_RPC_CALLER_AUDIT.md
- 文書名: Multi-Character RPC / Caller / Grant Audit
- Blob: `143f329c7ef4e5d17fee63c06978c658f2f70c80` (22468 bytes)、同名1版、main同一=False
- 所属: `docs/multi-character-rpc-caller-audit`
- 最新変更（代表枝）: `83476dd2d347687c253a471557d9c27b82e1caf7` / 2026-10-13T08:53:36Z / docs: refine migration ledger name and version comparison
- 目的・主内容の本文抜粋: Status: source-level audit of the current `main` branch and migration history. This is not a live-database grant inspection. No runtime, schema, or production setting was changed. Before introducing `character_id` / User×Character Pair scope, identify write paths that must remain
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D052 docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md
- 文書名: 本番基準の管理差分・整合化台帳
- Blob: `97fc43d139a2ce4b55b74d0613dffb8375a0e9af` (27963 bytes)、同名1版、main同一=False
- 所属: `docs/production-source-of-truth-reconciliation`
- 最新変更（代表枝）: `9e2b951defacad24a2cdb5aa3770b7022a908cee` / 2026-10-14T00:30:05Z / docs: correct migration version mismatch count
- 目的・主内容の本文抜粋: 最終確認日: 2026-10-13 対象リポジトリ: `miyazaki1016/misaki` 基準: **GitHub `main` の本番ソース + 接続先Supabase本番DBの実状態** 状態: 管理差分の記録。アプリコード・DB・RPC・権限・本番設定を変更するものではない。 管理上のずれを直す際は、以下の優先順位を使う。 1. **アプリケーションソースの正本:** GitHub `main`。ブランチ上の提案や未マージPRを、本番実装済みとして扱わない。 2. **DBの実状態の正本:** 接続先の本番Supabaseで読み取った現在の
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D053 docs/RELATIONSHIP_ACTING_DTO_CANONICAL_CONTRACT_20261015.md
- 文書名: Relationship Acting DTOの正本契約（2026-10-15、設計案）
- Blob: `73807f2cc4c73663212fa5382e32ad7ccf00c706` (4252 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `73189d53dff0bc4a26025a2b39c7beb03e94ded2` / 2026-10-14T22:49:56Z / docs: define canonical relationship acting DTO for permanent and anonymous Body Clock
- 目的・主内容の本文抜粋: **根拠:** main `lib/canonical-state.ts`、`lib/relationship-engine-v1.ts`、`lib/relationship-acting-guide.ts`、`lib/relationship-runtime-v1.ts`、`supabase/functions/body-clock/conversation-root.ts`、`proactive-decision.ts`。実装前のread-only契約。DB変更なし。 1. `RootState` は `relationshipEngine?: Sn
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D054 docs/RELATIONSHIP_BODY_CLOCK_ACTING_PARITY_AUDIT_20261015.md
- 文書名: Body Clock と通常チャットの関係演技入力差分（2026-10-15）
- Blob: `465f21fa358d21c6050212ecf622fa23b8e8fa41` (3150 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `5e2f30c0070754e890c24a2c8734cea97e7068b9` / 2026-10-14T22:46:32Z / docs: verify Body Clock relationship acting prompt gap against main
- 目的・主内容の本文抜粋: **照合対象（main）** `app/api/chat/route.ts`、`supabase/functions/body-clock/index.ts`、`app/api/push/body-clock/route.ts`、`docs/IMPLEMENTATION_OVERVIEW.md`。コード照合のみ。本番変更なし。 `supabase/functions/body-clock/index.ts` の `generateMessage` は `persona`、`decision`、`life`、時刻、ポイント、記憶、最近の会話を組み立て、Ge
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D055 docs/RELATIONSHIP_BODY_CLOCK_ACTING_WIRING_PLAN_20261015.md
- 文書名: Body Clock 5軸演技接続の差分計画（2026-10-15 / 設計のみ）
- Blob: `c91e7e695fa69c2094412810ba881800f6bcd43a` (3602 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `730208b04a95bf59dc47771fbabcf309b4eb824f` / 2026-10-15T03:32:23Z / docs: map Body Clock acting wiring and identify romantic tag consistency risk
- 目的・主内容の本文抜粋: PR #85の独立パリティテストを含むcommit `399b65a` は GitHub Actions success、Vercel success。これは本番Edge接続の証明ではない。 1. `supabase/functions/body-clock/temporary-state.ts`: `openTemporaryReceipt` の返却型にoptional `relationshipEngine` を含める。ただし復号成功とRootStateのスキーマ検証は別。5軸/statusは数値0..100整数、列挙値のみ許可し、欠損時は未取得とす
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D056 docs/RELATIONSHIP_BODY_CLOCK_CANONICAL_READ_CONTRACT_20261015.md
- 文書名: Body Clock正本読出しの詳細と統合契約（2026-10-15）
- Blob: `e27d88203966faf0d0a102c43a208db5ef784541` (3452 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `013f7609cab089ca933cf6c5c4c599cfdb571ccf` / 2026-10-14T22:48:14Z / docs: map permanent and anonymous canonical inputs for Body Clock acting parity
- 目的・主内容の本文抜粋: ソース: main `supabase/functions/body-clock/conversation-root.ts`、`proactive-decision.ts`、`temporary-state.ts`、`index.ts`。**読取監査のみ。** **恒久ユーザー:** `loadBodyClockRoot` は `misaki_user_conversation_state` からhistory/memory/today_memory/updated_atを読み、`buildProactiveDecisionContext` が `mis
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D057 docs/RELATIONSHIP_BODY_CLOCK_DTO_PREWIRING_REVIEW_20261015.md
- 文書名: Body Clock 関係性DTO 接続直前レビュー（2026-10-15）
- Blob: `91f0026a618d5bd9a0b4d07357baa45dfb2318f9` (2950 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `552267b9413cd26aa063a1870f9db2e0ee26f401` / 2026-10-15T05:58:24Z / docs: review Body Clock acting DTO pre-wiring consistency and concurrency risks
- 目的・主内容の本文抜粋: commit `3ee0bd3` は GitHub Actions `npm test` / `npx tsc --noEmit` / `npm run build` および Vercel 成功。独立した正規化テストは恒久・匿名で同じ5軸と交際状態から同じ演技ガイドを作ることを確認した。**実際のEdge配線・実Gemini応答・DB読み取りは未検証。** - 恒久：Body Clockの既存 `misaki_relationship_state` 読み取りを拡張し、5軸の `*_score` と `relationship_status` を取得。co
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D058 docs/RELATIONSHIP_BODY_CLOCK_EXISTING_VERSION_AUDIT_20261015.md
- 文書名: Body Clock関係性競合：既存versionの発見（2026-10-15／ソース監査）
- Blob: `3a8ea222b258a04f949b10e74f6da3f5db680a1e` (3008 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `98aa340084943ee33fa51dc35a431c9338f6a2e6` / 2026-10-15T06:19:42Z / docs: identify existing relationship state version and atomic delivery guard design
- 目的・主内容の本文抜粋: - `supabase/migrations/20261003081717_relationship_engine_v1_canonical_state_and_critical_event.sql`：`misaki_relationship_state.relationship_state_version bigint not null default 0` と `relationship_engine_version` が追加済み。交際statusのcritical event RPCは、rowを `FOR UPDATE` で取得して `relati
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D059 docs/RELATIONSHIP_BODY_CLOCK_IMPORT_VERSION_AUDIT_20261015.md
- 文書名: Relationship version：匿名→恒久import経路の追加監査（2026-10-15）
- Blob: `19110ec8cfa85091296f49b7d35385c384a7ecb2` (1878 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `dc8071e59a905ef6fae439ac33d8d7f06f4602ed` / 2026-10-15T06:22:20Z / docs: verify temporary import increments relationship version for Body Clock race design
- 目的・主内容の本文抜粋: - `20261003082001_relationship_engine_v1_temporary_import_boundary.sql`：`import_misaki_temporary_relationship_v1` は5軸と `relationship_status` を恒久rowへ取り込み、`relationship_state_version=relationship_state_version+1`。 - `20261003100600_relationship_engine_v1_remove_legacy_write_bypass.
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D060 docs/RELATIONSHIP_BODY_CLOCK_PROMPT_PRECEDENCE_20261015.md
- 文書名: Body Clock：関係性と感情タグの優先順位（2026-10-15／設計・未接続）
- Blob: `76adad02da0903d20bd88a7ea4da74c261e74c7d` (2534 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `b31c74c9b721000adfa0eb2cc6338d9f5544523d` / 2026-10-15T04:56:34Z / docs: define relationship status and emotion-tag prompt precedence after green tests
- 目的・主内容の本文抜粋: commit `23080d6` の独立プロンプト境界実験は GitHub Actions（npm test / tsc / build）およびVercel成功。**独立実験が通っただけで、Edge生成経路の動作確認ではない。** 1. **事実と安全境界**：認証済み正本の `relationshipStatus`、交際事実、既知の履歴。状態が欠損したら交際を推測しない。交際前の好意をゼロにするわけではない。 2. **直近の行動**：`PULL` は甘いタグを抑え、`SULK` は攻撃・罰を避け、`TEASE` は遊び心と文脈の両方を要求し、`CHA
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D061 docs/RELATIONSHIP_BODY_CLOCK_RACE_AUDIT_20261015.md
- 文書名: Body Clock 関係性の生成中変更：競合レビュー（2026-10-15／未実装）
- Blob: `bdc5a9b9ace3866149a0a536d1f64577dcc621bc` (3259 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `4e76a8e70f21acb69e30a81791d1a6ae8831cbc1` / 2026-10-15T06:11:36Z / docs: audit Body Clock relationship state race and atomic delivery guards
- 目的・主内容の本文抜粋: - `supabase/functions/body-clock/index.ts` の `processUser` は `loadBodyClockRoot` → `buildProactiveDecisionContext` → `generateMessage` → `finish_misaki_body_clock_delivery` RPC の順で処理する。 - RPCへ `p_expected_revision: canonical.temporaryRevision` と `p_expected_updated_at: canonical.
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D062 docs/RELATIONSHIP_BODY_CLOCK_RPC_VERIFICATION_GAP_20261015.md
- 文書名: Body Clock 配信確定RPCと関係性version：調査結果（2026-10-15）
- Blob: `4e9d2d2286073b20df480f021f1b85de932f8dbc` (2104 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `3f8278a4bf7627013fc2b2fc2bb05ca13d4189a7` / 2026-10-15T06:15:30Z / docs: record RPC migration verification gap without assuming relationship concurrency guard
- 目的・主内容の本文抜粋: - `supabase/functions/body-clock/index.ts` は `finish_misaki_body_clock_delivery` に `p_expected_revision`（匿名一時Rootのrevision）と `p_expected_updated_at`（会話Rootのupdated_at）を渡す。 - `supabase/functions/body-clock/conversation-root.ts` は恒久Rootの `updated_at` を `misaki_user_conversation_sta
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D063 docs/RELATIONSHIP_ENGINE_V1.md
- 文書名: Misaki Relationship Engine v1 — Design Freeze
- Blob: `f9f763eca7713424a3d15b15fe547a16e44cb5e5` (9962 bytes)、同名1版、main同一=True
- 所属: `sora/drop-ungrounded-relationship-evidence`, `sora/fix-relationship-polarity-transport`, `test/relationship-acting-state-comparison`, `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/relationship-engine-v1`, `work/relationship-error-diagnostics`, `work/relationship-identity-v1`, `work/relationship-polarity-integer`, `fix/expired-temporary-relationship-import`, `main`, `sora/lp-pwa-mobile-layout`, `sora/lp-relationship-story`, `sora/relationship-analyzer-stage-diagnostics`, `sora/relationship-analyzer-structured-output-hotfix`, `sora/relationship-control-rpcs-v1`, `sora/relationship-evidence-validation-diagnostics`, `sora/relationship-processing-error-diagnostics`, `sora/remove-relationship-stage-diagnostics`, `sora/remove-relationship-temporary-diagnostics`, `sora/update-overview-relationship-v1-production`, `fix/relationship-analyzer-bounded-retry`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/production-source-of-truth-reconciliation`, `docs/relationship-five-axis-design-review-20261015`, `docs/relationship-v1-2-stage-growth-principles`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`, `work/forget-control-v1`, `work/gemini-unit-cost-telemetry`, `work/quality-long-history-workflow`, `work/relationship-analyzer-diagnostics`, `chore/restore-relationship-rpc-migration`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `1937c316e9d3d4edcc11f1e447ee582ffc45357a` / 2026-10-03T08:05:12Z / Add Relationship Engine v1 design freeze
- 目的・主内容の本文抜粋: Date: 2026-10-03 Status: design freeze candidate. Implementation details are not yet frozen. - Intimacy means how much time and closeness the pair have accumulated. - Five hidden axes describe what kind of relationship grew: friendship, trust, playfulness, affection, romance. - R
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D064 docs/RELATIONSHIP_ENGINE_V1_2_WORK_HANDOFF.md
- 文書名: Relationship Engine v1.2 — Work Implementation Handoff
- Blob: `fd723767780d0e293c6dd71c1ac9ea929e856aa1` (11027 bytes)、同名1版、main同一=False
- 所属: `docs/relationship-v1-2-stage-growth-principles`
- 最新変更（代表枝）: `dcbabc6636dc0575e9bb1c56fc55c4a780cb82f3` / 2026-10-04T04:13:40Z / Add Relationship Engine v1.2 Work handoff
- 目的・主内容の本文抜粋: Date: 2026-10-04 Owner: せいちゃん Architecture / canonical contract: ソラ Implementation executor: Work Implement Relationship Engine v1.2 Stage / 5-heart on top of the existing v1.1 canonical relationship trunk. Do not redesign the relationship model. Do not create a second intimacy/p
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D065 docs/RELATIONSHIP_ENGINE_V1_APPLICATION.md
- 文書名: Relationship Engine v1 application integration
- Blob: `917837f70a6fe241ae8c3dc2a2268725d71a15c2` (13767 bytes)、同名1版、main同一=True
- 所属: `sora/drop-ungrounded-relationship-evidence`, `sora/fix-relationship-polarity-transport`, `test/relationship-acting-state-comparison`, `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/relationship-engine-v1`, `work/relationship-error-diagnostics`, `work/relationship-identity-v1`, `work/relationship-polarity-integer`, `fix/expired-temporary-relationship-import`, `main`, `sora/lp-pwa-mobile-layout`, `sora/lp-relationship-story`, `sora/relationship-analyzer-stage-diagnostics`, `sora/relationship-analyzer-structured-output-hotfix`, `sora/relationship-evidence-validation-diagnostics`, `sora/relationship-processing-error-diagnostics`, `sora/remove-relationship-stage-diagnostics`, `sora/remove-relationship-temporary-diagnostics`, `sora/update-overview-relationship-v1-production`, `fix/relationship-analyzer-bounded-retry`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/production-source-of-truth-reconciliation`, `docs/relationship-five-axis-design-review-20261015`, `docs/relationship-v1-2-stage-growth-principles`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`, `work/forget-control-v1`, `work/gemini-unit-cost-telemetry`, `work/quality-long-history-workflow`, `work/relationship-analyzer-diagnostics`, `chore/restore-relationship-rpc-migration`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `42c8eba3c92e0cbaeb0825717f122e2fb3f7364a` / 2026-10-03T10:13:57Z / Verify legacy Relationship mutation revocations against hardened DB contract
- 目的・主内容の本文抜粋: Status: review draft, not a production cutover. Uses updated Draft PR #46 at `e6bf2bc75aa5dd87e520724e5dbf3f4a5f0f6578` as the formal distributed-worker DB contract. No migration or DB definition changes are included. `app/api/chat/route.ts` loads canonical state, feeds the share
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D066 docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md
- 文書名: Relationship Engine v1 — DB & Processing Boundary Design
- Blob: `44aa021ec97d691e590354d7934851ad0de49e2a` (13321 bytes)、同名1版、main同一=True
- 所属: `sora/drop-ungrounded-relationship-evidence`, `sora/fix-relationship-polarity-transport`, `test/relationship-acting-state-comparison`, `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/relationship-engine-v1`, `work/relationship-error-diagnostics`, `work/relationship-identity-v1`, `work/relationship-polarity-integer`, `fix/expired-temporary-relationship-import`, `main`, `sora/lp-pwa-mobile-layout`, `sora/lp-relationship-story`, `sora/relationship-analyzer-stage-diagnostics`, `sora/relationship-analyzer-structured-output-hotfix`, `sora/relationship-control-rpcs-v1`, `sora/relationship-evidence-validation-diagnostics`, `sora/relationship-processing-error-diagnostics`, `sora/remove-relationship-stage-diagnostics`, `sora/remove-relationship-temporary-diagnostics`, `sora/update-overview-relationship-v1-production`, `fix/relationship-analyzer-bounded-retry`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/production-source-of-truth-reconciliation`, `docs/relationship-five-axis-design-review-20261015`, `docs/relationship-v1-2-stage-growth-principles`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`, `work/forget-control-v1`, `work/gemini-unit-cost-telemetry`, `work/quality-long-history-workflow`, `work/relationship-analyzer-diagnostics`, `chore/restore-relationship-rpc-migration`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `50585d71760b7ded6a75012f3f39e19bda1032c7` / 2026-10-03T08:12:24Z / Add Relationship Engine v1 DB processing design
- 目的・主内容の本文抜粋: Date: 2026-10-03 Status: implementation design candidate after Production/source audit. No migration is authorized by this document. The current Production architecture already provides useful canonical foundations: - `misaki_relationship_state` is the current relationship/intima
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D067 docs/RELATIONSHIP_ENGINE_V1_WORK_HANDOFF.md
- 文書名: Relationship Engine v1 — Work Implementation Handoff
- Blob: `d54729fc1ba0c7462f74bf4baebc33124ea38641` (12435 bytes)、同名1版、main同一=True
- 所属: `sora/drop-ungrounded-relationship-evidence`, `sora/fix-relationship-polarity-transport`, `test/relationship-acting-state-comparison`, `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/relationship-engine-v1`, `work/relationship-error-diagnostics`, `work/relationship-identity-v1`, `work/relationship-polarity-integer`, `fix/expired-temporary-relationship-import`, `main`, `sora/lp-pwa-mobile-layout`, `sora/lp-relationship-story`, `sora/relationship-analyzer-stage-diagnostics`, `sora/relationship-analyzer-structured-output-hotfix`, `sora/relationship-control-rpcs-v1`, `sora/relationship-evidence-validation-diagnostics`, `sora/relationship-processing-error-diagnostics`, `sora/remove-relationship-stage-diagnostics`, `sora/remove-relationship-temporary-diagnostics`, `sora/update-overview-relationship-v1-production`, `fix/relationship-analyzer-bounded-retry`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/production-source-of-truth-reconciliation`, `docs/relationship-five-axis-design-review-20261015`, `docs/relationship-v1-2-stage-growth-principles`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`, `work/forget-control-v1`, `work/gemini-unit-cost-telemetry`, `work/quality-long-history-workflow`, `work/relationship-analyzer-diagnostics`, `chore/restore-relationship-rpc-migration`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `32a9dfc4dd7afc0890f4997fe50a21eaf68fafad` / 2026-10-03T08:25:21Z / Add Relationship Engine v1 Work implementation handoff
- 目的・主内容の本文抜粋: Date: 2026-10-03 Owner: せいちゃん Architecture / DB authority: ソラ Implementation executor: Work Implement the application layer for Relationship Engine v1 on top of the already-deployed Production DB foundation. Do **not** redesign the DB or reinterpret the relationship model. The ar
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D068 docs/RELATIONSHIP_FIVE_AXIS_GROWTH_PACE_20261015.md
- 文書名: 5軸成長速度のソース照合と理論下限（2026-10-15）
- Blob: `e24294eea86a52c1b95796fa75c4fef0dd68aa73` (3791 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `569f2259971674d7fffcb954700635b51c7868f6` / 2026-10-14T22:40:22Z / docs: quantify conditional five-axis growth pace against actual pattern rules
- 目的・主内容の本文抜粋: **対象:** main の `lib/relationship-engine-v1.ts`、`lib/relationship-processing-v1.ts` と Draft PR #85のInterpreter実験。これはソースに基づく条件付き計算であり、実ユーザーの平均成長速度の測定ではない。 1. 直接のユーザー発話で、confidence≥0.8、strength≥50のEvidenceがEpisode候補。会話だけで無条件に点数は増えない。 2. 同じ `type:axis:polarity` について、**別々の東京日付3日**のEpi
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D069 docs/RELATIONSHIP_MOMENTUM_SOURCE_AUDIT_20261015.md
- 文書名: Momentum導出可能性のソース照合（2026-10-15）
- Blob: `9c66e4d76943e1678ce55e71adc3f38b91b7fb9e` (3893 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `ebf1715abbbe22c65559636559ac44cbe88e8803` / 2026-10-14T22:42:45Z / docs: audit canonical inputs and missing contracts for momentum derivation
- 目的・主内容の本文抜粋: 対象: main `docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md`、`lib/relationship-processing-v1.ts`、`lib/relationship-acting-guide.ts`。**設計調査であり、Momentum実装・実データ取得は行っていない。** - 設計書§9は長期State / Momentum / Emotion / Actionを分離し、初期v1では**recent Patterns/EventsからMomentumを導出する**ことを優先。欠席・時間
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D070 docs/RELATIONSHIP_PROMPT_WIRING_AUDIT_20261015.md
- 文書名: 通常チャットへのRelationship Guide接続監査（2026-10-15）
- Blob: `bc11962d6fd31751f5c8f101a57a331d9844cc4d` (2188 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `e44ae6456b6cf01be7a898c11a742d843bd4c1af` / 2026-10-14T22:44:44Z / docs: verify chat prompt relationship wiring and identify remaining proactive audit
- 目的・主内容の本文抜粋: **確認対象:** main の `app/api/chat/route.ts` と `lib/relationship-runtime-v1.ts`。本番コードへの変更なし。 - `app/api/chat/route.ts:2055–2067` は `canonicalRelationshipPoints` を利用し、`engineEnabled()` の場合は旧 `createRelationshipGuide` を空にする。 - 同箇所の `createRelationshipActingGuide` は、優先順位 `rootState.rela
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D071 docs/RELATIONSHIP_VERSION_LEGACY_WRITER_AUDIT_20261015.md
- 文書名: Relationship version 書き込み経路監査：旧RPCとの境界（2026-10-15）
- Blob: `0e6fd6be79d882b29055f3faabb3801b3009e7d6` (2588 bytes)、同名1版、main同一=False
- 所属: `experiment/interpreter-gradual-acting-20261015`
- 最新変更（代表枝）: `140b1b417bfc65bfa87cc35832fa27234f80486d` / 2026-10-15T06:25:58Z / docs: audit legacy relationship writers and distinguish five-axis version scope
- 目的・主内容の本文抜粋: mainのmigration treeを列挙し、36件のSQL migrationを確認対象として把握。旧Relationship/Emotion/Action/会話同期のmigration群14件を抽出して、`misaki_relationship_state` に対する書き込みを調査した。 - 2026-10-03の新Relationship Engine主要RPCは、5軸またはrelationship_status更新時に `relationship_state_version` を増分（critical event、bounded state a
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D072 docs/SERVER_CANONICAL_STATE.md
- 文書名: 根本状態のサーバー正本化（基礎工事）
- Blob: `d786df430526a4fe12abab61d0053c0af2f9f6fe` (26134 bytes)、同名1版、main同一=True
- 所属: `sora/drop-ungrounded-relationship-evidence`, `sora/fix-relationship-polarity-transport`, `sora/fix-waiting-reply-layout`, `sora/gemini-timeout-retry`, `sora/gemini-transient-retry`, `sora/history-edge-trace`, `sora/history-get-trace`, `sora/history-sync-source-proof`, `test/relationship-acting-state-comparison`, `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/relationship-engine-v1`, `work/relationship-error-diagnostics`, `work/relationship-identity-v1`, `work/relationship-polarity-integer`, `fix/expired-temporary-relationship-import`, `main`, `sora/anonymous-history-get-noop`, `sora/canonical-relationship-integration`, `sora/cutover-cleanup`, `sora/lp-pwa-mobile-layout`, `sora/lp-relationship-story`, `sora/misaki-acting-lab`, `sora/profile-aware-life-events`, `sora/relationship-analyzer-stage-diagnostics`, `sora/relationship-analyzer-structured-output-hotfix`, `sora/relationship-control-rpcs-v1`, `sora/relationship-evidence-validation-diagnostics`, `sora/relationship-processing-error-diagnostics`, `sora/remove-false-busy-wait`, `sora/remove-relationship-stage-diagnostics`, `sora/remove-relationship-temporary-diagnostics`, `sora/remove-timestamp-history-poll`, `sora/sync-free-usage-with-history`, `sora/update-overview-relationship-v1-production`, `fix/relationship-analyzer-bounded-retry`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/production-source-of-truth-reconciliation`, `docs/relationship-five-axis-design-review-20261015`, `docs/relationship-v1-2-stage-growth-principles`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`, `work/forget-control-v1`, `work/gemini-unit-cost-telemetry`, `work/quality-long-history-workflow`, `work/relationship-analyzer-diagnostics`, `chore/restore-relationship-rpc-migration`, `codex/server-canonical-foundation`, `design/shared-conversation-engine-contract-20261015`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `fd4b6e78e0a79dc05ebed46f82baf205f53cca23` / 2026-09-18T12:14:58Z / Add maintenance gate and manual cutover recovery equipment
- 目的・主内容の本文抜粋: 実装開始時に再取得した main: `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`。 正式仕様は IMPLEMENTATION_OVERVIEW.md の0.8とWork引き渡し仕様。今回のPRは本番反映前のレビュー対象。 恒久アカウントは `misaki_relationship_state.intimacy_points` がポイント正本、`misaki_user_conversation_state` が履歴・長期記憶・今日の記憶の正本。チャット生成前にサーバーから読み、成功後のサービス専用RPCで履歴・記憶・
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D073 docs/SHARED_CONVERSATION_ENGINE_DESIGN_20261015.md
- 文書名: Shared Conversation Engine — design contract v0 (2026-10-15)
- Blob: `7aed7ef22ef3025fa18e8b00561ebc2d77498bf1` (6856 bytes)、同名1版、main同一=False
- 所属: `design/shared-conversation-engine-contract-20261015`
- 最新変更（代表枝）: `daded504b1d2834ed4d7b4a6d0758e89841aed74` / 2026-10-15T08:13:52Z / design: define shared conversation engine contract and parity rollout gates
- 目的・主内容の本文抜粋: **Status: proposed design, not implemented or approved for production.** Isolated branch from `main`. No API calls, database access, runtime edits, or deployment. Both production chat and an offline conversation tuning lab invoke the **same pure reply pipeline**. The runtime supp
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D074 docs/WRITE_SURFACE_INVENTORY.md
- 文書名: PR #30 write surface inventory — 2026-09-19
- Blob: `a33806992107b31ddcacfd7c570a59f1b453d5e7` (17406 bytes)、同名1版、main同一=False
- 所属: `codex/legacy-maintenance-drain`
- 最新変更（代表枝）: `1867caed8dcd67f4d1f8bac275acd4f1834aef0c` / 2026-09-19T15:49:58Z / test: expose stale snapshot admission after freeze
- 目的・主内容の本文抜粋: **BLOCKED。新しい受付漏れを確認した時点で機能修正を停止。** GitHubでmain `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`、PR30 `375088c0ef14d5e9dd98ae3495d03f41da1eeaf5`、PR29 `fd4b6e78e0a79dc05ebed46f82baf205f53cca23` を再確認。総覧、旧設備運用文書、本書、PR29のSERVER_CANONICAL_STATEを再読した。 既知の業務table guard突破と同じMVCC原因が、受付集合そのものにも及
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D075 docs/context-ab-blind-review.md
- 文書名: Blinded A/B conversational quality review
- Blob: `66e283a33430cb7bc07dfd035122f60ba7482fd2` (4566 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `f1f48bd463643850561369ae31c6a95c4946a940` / 2026-10-12T23:42:12Z / Link blinded review scoring template
- 目的・主内容の本文抜粋: Status: protocol only. No model calls are made by this document. Do not use Production conversations or disclose real user content without separate explicit approval. Compare candidate and control replies for conversational quality without telling the reviewer which arm is A or B
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D076 docs/context-ab-execution-gate.md
- 文書名: Isolated Gemini A/B: execution gate
- Blob: `bb9da685cd80ca66db8e0771121304eda7d84949` (4582 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `84ceaf6cf42311b9d3db3d7fa0eeb6c79e9bd73b` / 2026-10-12T23:41:22Z / Link blinded quality review protocol from execution gate
- 目的・主内容の本文抜粋: **Status:** first live synthetic A/B smoke test completed successfully on 2026-10-13. This confirms the runner and Gemini response/usage parsing work for one short synthetic pair; it is **not** evidence of conversational quality or Production-equivalent savings. Preview build REA
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D077 docs/context-ab-real-history-quality-review.md
- 文書名: 実会話 A/B 品質評価手順（本番切替禁止）
- Blob: `effb8c7139303de6c92523439612b56b67aed160` (6837 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `d42d82515c04d2711d12afaa8bf9d4a14d2c1761` / 2026-10-09T02:09:57Z / docs: capture four weekly Misaki research findings as unimplemented design candidates
- 目的・主内容の本文抜粋: - 本人が同意した実会話60ターンから、最後のユーザー発話を入力にして、先行58ターンを履歴に使う。 - Previewの簡略実験プロンプトでA/B各3回の数値比較は成功。入力トークンはA=1922、B=1616で毎回306（15.9%）減少。 - レイテンシー（ms）はA=[729,805,918]、B=[2051,717,1051]。平均A≈817、B≈1273。順序は常にA→Bで、試行数が少なく速度優劣は不明。 - これらの試行は返答本文を返さず保存もしない。JSON妥当性は意味的品質の証拠ではない。 - 実験プロンプトはProductionと異な
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D078 docs/context-ab-validation-protocol.md
- 文書名: Conversation context A/B validation protocol
- Blob: `fc5f3fdd4a68f244015b666f826093ea30522d11` (2491 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `1c38296e8f8c5387333edb8e09934cf8877645bd` / 2026-10-08T01:46:09Z / docs: define controlled non-committing A/B benchmark and measured baseline
- 目的・主内容の本文抜粋: Status: experiment only; **no Production deployment or merge**. - A: `work/conversation-context-compression-spike` (recent eight Misaki replies repeated inside system prompt). - B: `work/context-no-duplicate-replies-ab` (same raw 60-message history, repetition instruction retaine
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D079 docs/conversation-context-compression-spike.md
- 文書名: Conversation context compression — measurement-first spike
- Blob: `b5a6296987c955879d540226f14c60d2ae8df9b2` (3523 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`
- 最新変更（代表枝）: `49fc3567f2171320236c1af739bf9367adc06852` / 2026-10-08T01:12:49Z / docs: establish measurement-first conversation context compression experiment
- 目的・主内容の本文抜粋: Status: research only; no runtime behavior changes. Branch: `work/conversation-context-compression-spike`. Base: `ece799c20d685f00c007cb2f897bdd6b2443a2d3`. - `app/api/chat/route.ts`: `MAX_HISTORY=60`; `safeHistory` keeps last 60 valid user/misaki messages. - `contents` sends tho
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D080 docs/memory-certainty-design.md
- 文書名: 記憶の確度・未確定の予定の扱いに関する設計書
- Blob: `bdb68e25bd6791208dd9a762e682c39fb1bb8b6a` (30211 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `94a117e072e765041217daaa1519640b8cd53c69` / 2026-10-10T23:34:59Z / docs: trace checkpoint and proactive memory paths
- 目的・主内容の本文抜粋: 状態：**設計のみ。未実装。本番適用の承認なし。** 作業ブランチ：work/context-no-duplicate-replies-ab 関連する別作業：PR #66「Forget Control」（ブランチ work/forget-control-v1）。この設計書の変更はPR #66やそのブランチには加えない。 仮の発言、質問、推測、古くなった予定が、美咲の返信や自発メッセージの中で、確定した現在の事実として扱われることを防ぐ。また、「予定」と「完了した出来事」を区別し、明示的な訂正があった場合は古い内容より新しい内容を優先する。 システムでは、
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D081 docs/misaki-blind-quality-evaluation-fixtures.md
- 文書名: Misaki Blind Quality Evaluation — Synthetic Fixtures
- Blob: `9ac57367ca4c4bf9c6a50f90658e8799ec0c23d7` (7229 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `b833c8d5741362f1de3aa88613026f40ae5bd48e` / 2026-10-13T04:50:37Z / Document local synthetic quality regression runner
- 目的・主内容の本文抜粋: Prepare a repeatable, low-risk rubric for comparing two candidate replies (X and Y) after an explicitly approved, minimized test run. The fixture scenarios can also be used for manual dry runs of the review UI. A dry run validates the workflow only; it does not establish which mo
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D082 docs/misaki-synthetic-live-evaluation-runbook.md
- 文書名: Synthetic-only live quality evaluation runbook
- Blob: `395b5a68e712404520d6ce03b8e5052f8c330207` (2740 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `fe81aa5f541f7b2d4ff7516d326fc07c811872fe` / 2026-10-13T05:01:19Z / Document isolated synthetic quality evaluation runbook
- 目的・主内容の本文抜粋: Status: prepared but NOT executed. This document is not a result report. The owner authorized one evaluation using fictional fixtures only, at most 14 Gemini requests and a hard estimated cost ceiling of USD 0.05. This authorization does not permit sending real conversation histo
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D083 docs/misaki-synthetic-reference-replies-and-self-scores.md
- 文書名: Misaki synthetic reference replies and initial self-scores
- Blob: `fb14a7a5422fb4b15a6478fa1cfad3625bd76d3f` (5247 bytes)、同名1版、main同一=False
- 所属: `work/context-no-duplicate-replies-ab`
- 最新変更（代表枝）: `d59a1ec8ba0c9cb4ea45bbad7479f6c5a0dd930a` / 2026-10-13T04:54:12Z / Add initial self-scored synthetic reference replies
- 目的・主内容の本文抜粋: Order: memory accuracy / relationship naturalness / conversational continuity / lack of repetition / naturalness & safety. Each axis is 1–5. Total is out of 25. A naturalness/safety score of 1–2 blocks acceptance regardless of total. **User:** 「私の好きな飲み物、覚えてる？」 **Reference reply:*
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D084 supabase/BODY_CLOCK.md
- 文書名: Body clock
- Blob: `085e5eb74c62641e972ee4c4c547bf60e9fd62fc` (3174 bytes)、同名1版、main同一=True
- 所属: `sora/drop-ungrounded-relationship-evidence`, `sora/fix-relationship-polarity-transport`, `sora/fix-waiting-reply-layout`, `sora/gemini-timeout-retry`, `sora/gemini-transient-retry`, `sora/history-edge-trace`, `sora/history-get-trace`, `sora/history-sync-source-proof`, `test/relationship-acting-state-comparison`, `work/ab-20-pair-dispatch`, `work/ab-blind-review-artifact-workflow`, `work/ab-http-diagnostics-dispatch`, `work/ab-long-fixture-dispatch`, `work/ab-manual-workflow-only`, `work/ab-paced-dispatch`, `work/ab-quality-diagnostics-workflow`, `work/relationship-engine-v1`, `work/relationship-error-diagnostics`, `work/relationship-identity-v1`, `work/relationship-polarity-integer`, `fix/chat-network-reliability`, `fix/chat-reliability-cleanup`, `fix/chat-request-diagnostics`, `fix/chat-turn-dedupe`, `fix/expired-temporary-relationship-import`, `fix/gemini-chat-timeout`, `fix/gemini-json-retry`, `fix/grow-relationship-from-first-meeting`, `fix/workday-grounding`, `main`, `perf/chat-stage-timing`, `refine/proactive-action-tags`, `refine/sleepy-tag`, `sora/anonymous-history-get-noop`, `sora/canonical-relationship-integration`, `sora/cutover-cleanup`, `sora/lp-pwa-mobile-layout`, `sora/lp-relationship-story`, `sora/misaki-acting-lab`, `sora/profile-aware-life-events`, `sora/relationship-analyzer-stage-diagnostics`, `sora/relationship-analyzer-structured-output-hotfix`, `sora/relationship-control-rpcs-v1`, `sora/relationship-evidence-validation-diagnostics`, `sora/relationship-processing-error-diagnostics`, `sora/relationship-time-v2-design`, `sora/remove-false-busy-wait`, `sora/remove-relationship-stage-diagnostics`, `sora/remove-relationship-temporary-diagnostics`, `sora/remove-timestamp-history-poll`, `sora/sync-free-usage-with-history`, `sora/update-overview-relationship-v1-production`, `fix/legacy-safari-cache`, `fix/preserve-active-chat-history`, `fix/recall-history-grounding`, `fix/recall-keep-recent-history`, `fix/relationship-analyzer-bounded-retry`, `fix/safari-load-failed-message`, `fix/safari-load-failed-ui`, `fix/use-chat-proxy`, `docs/multi-character-data-scope-inventory`, `docs/multi-character-rpc-caller-audit`, `docs/production-source-of-truth-reconciliation`, `docs/relationship-five-axis-design-review-20261015`, `docs/relationship-v1-2-stage-growth-principles`, `docs/update-implementation-overview`, `docs/update-overview-relationship-growth`, `experiment/conversation-lab-offline-v1-20261015`, `experiment/interpreter-gradual-acting-20261015`, `experiment/shared-conversation-history-v1-20261015`, `feature/proactive-derived-tags`, `fix/anonymous-chat-session-drop`, `fix/anonymous-email-history`, `fix/anonymous-session-cache-reset`, `fix/body-clock-claim-rpc`, `fix/chat-failure-recovery`, `work/ab-quality-manual-workflow`, `work/ab-quality-reply-schema-dispatch`, `work/context-no-duplicate-replies-ab`, `work/conversation-context-compression-spike`, `work/forget-control-v1`, `work/gemini-unit-cost-telemetry`, `work/quality-long-history-workflow`, `work/relationship-analyzer-diagnostics`, `chore/restore-relationship-rpc-migration`, `cleanup/legacy-proactive-tags`, `cleanup/remove-legacy-proactive-path`, `codex/legacy-maintenance-drain`, `codex/server-canonical-foundation`, `design/shared-conversation-engine-contract-20261015`, `docs/audit-overview-against-source`, `docs/development-registry-audit-20261020`
- 最新変更（代表枝）: `778f06088ffbc33d11618462c2c91487f052c18e` / 2026-09-16T01:33:03Z / Stop client proactive timer after successful server delivery test
- 目的・主内容の本文抜粋: Supabase pg_cron (every 5 minutes) calls the `body-clock` Edge Function. It uses `claim_misaki_body_clock_due_users`, the existing persona and photo selector, and an atomic completion RPC to save delivery, conversation history, and the daily count (maximum 4, Asia/Tokyo). Notific
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。

## D085 tests/reports/forget-batch-evaluation.md
- 文書名: Forget batch比較検証 — 2026-10-07 JST
- Blob: `fa3b7bcb6ea654f1777adff83c6481ca48af4fc9` (6820 bytes)、同名1版、main同一=False
- 所属: `work/forget-control-v1`
- 最新変更（代表枝）: `fb5768089494c62b35d11442d309bf3fe6df57fd` / 2026-10-06T21:04:07Z / Add verification-only Forget batch comparison and measurement harness
- 目的・主内容の本文抜粋: 検証専用実装。通常chat/Body Clock/personaの呼出経路、共通Forget policy、Relationship Engine、DB schema、再学習条件、atomic commitは変更していない。cacheも導入していない。PR #66はDraft・merge/Production適用なし。 node --experimental-strip-types tests/forget-batch-evaluate.ts node --experimental-strip-types tests/forget-batch-evalu
- 実装との関係: main同一Blobかどうかを上記に記録。全意味照合は未完了。
