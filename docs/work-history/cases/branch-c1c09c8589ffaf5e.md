# sora/relationship-time-v2-design

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** ブランチ差分（PR関連あり）

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

関連PR：[#31](https://github.com/miyazaki1016/misaki/pull/31)

根拠取得日時 (UTC)：2026-11-09T09:51:44.382854+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [.github/workflows/relationship-v2-tests.yml](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/.github/workflows/relationship-v2-tests.yml)：同一HEADのPR案件に原文収録
- [app/api/chat/route.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/app/api/chat/route.ts)：同一HEADのPR案件に原文収録
- [app/api/dev/relationship-naturalness/route.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/app/api/dev/relationship-naturalness/route.ts)：同一HEADのPR案件に原文収録
- [docs/IMPLEMENTATION_OVERVIEW.md](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/docs/IMPLEMENTATION_OVERVIEW.md)：同一HEADのPR案件に原文収録
- [lib/persona/fallback-persona.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/persona/fallback-persona.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-action-reducer.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-action-reducer.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-conversation-generator.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-conversation-generator.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-conversation-preview.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-conversation-preview.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-conversation-prompt.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-conversation-prompt.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-emotion-reducer.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-emotion-reducer.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-emotion-store.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-emotion-store.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-life-context.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-life-context.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-naturalness-scenario.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-naturalness-scenario.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-patterns.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-patterns.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-signal.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-signal.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-time.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-time.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-turn-expression.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/lib/relationship-turn-expression.ts)：同一HEADのPR案件に原文収録
- [middleware.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/middleware.ts)：同一HEADのPR案件に原文収録
- [package.json](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/package.json)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/contact-timing.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/contact-timing.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/focus-guide.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/focus-guide.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/index.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/index.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/proactive-decision.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/proactive-decision.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/proactive-life-context.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/proactive-life-context.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/proactive-motive.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/proactive-motive.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/proactive-photo.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/proactive-photo.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/proactive-urge.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/functions/body-clock/proactive-urge.ts)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920070000_relationship_time_v2_no_silence_only_mutation.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920070000_relationship_time_v2_no_silence_only_mutation.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920073000_apply_relationship_emotion_v2_rpc.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920073000_apply_relationship_emotion_v2_rpc.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920073100_relationship_context_state_version.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920073100_relationship_context_state_version.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920080000_relationship_action_v2.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920080000_relationship_action_v2.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920083000_body_clock_no_action_finish.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920083000_body_clock_no_action_finish.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920084500_body_clock_v2_opportunity_claim.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920084500_body_clock_v2_opportunity_claim.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920085000_disable_legacy_keyword_emotion_trigger.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920085000_disable_legacy_keyword_emotion_trigger.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920085500_harden_relationship_v2_rpc_inputs.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920085500_harden_relationship_v2_rpc_inputs.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20260920085600_retire_superseded_relationship_emotion_v2_rpc.sql](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/supabase/migrations/20260920085600_retire_superseded_relationship_emotion_v2_rpc.sql)：同一HEADのPR案件に原文収録
- [tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/account-conversation.test.cjs)：同一HEADのPR案件に原文収録
- [tests/body-clock-contact-timing.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/body-clock-contact-timing.test.ts)：同一HEADのPR案件に原文収録
- [tests/body-clock-emotion-v2.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/body-clock-emotion-v2.test.ts)：同一HEADのPR案件に原文収録
- [tests/body-clock-focus-guide.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/body-clock-focus-guide.test.ts)：同一HEADのPR案件に原文収録
- [tests/body-clock-proactive-life-context-v2.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/body-clock-proactive-life-context-v2.test.ts)：同一HEADのPR案件に原文収録
- [tests/body-clock-proactive-motive.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/body-clock-proactive-motive.test.ts)：同一HEADのPR案件に原文収録
- [tests/body-clock-proactive-urge.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/body-clock-proactive-urge.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-action-reducer.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-action-reducer.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-conversation-generator.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-conversation-generator.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-conversation-preview.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-conversation-preview.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-conversation-prompt.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-conversation-prompt.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-emotion-reducer.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-emotion-reducer.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-life-context.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-life-context.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-life-extraction.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-life-extraction.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-life-memory-roundtrip.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-life-memory-roundtrip.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-naturalness-boundary.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-naturalness-boundary.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-naturalness-repair.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-naturalness-repair.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-naturalness-scenario.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-naturalness-scenario.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-patterns.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-patterns.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-scenario.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-scenario.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-signal.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-signal.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-story.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-story.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-turn-expression.test.ts](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tests/relationship-turn-expression.test.ts)：同一HEADのPR案件に原文収録
- [tsconfig.json](https://github.com/miyazaki1016/misaki/blob/e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64/tsconfig.json)：同一HEADのPR案件に原文収録

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

