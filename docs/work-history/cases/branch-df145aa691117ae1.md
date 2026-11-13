# work/p0-engine-integration

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** ブランチ差分（PR関連あり）

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

関連PR：[#193](https://github.com/miyazaki1016/misaki/pull/193)

根拠取得日時 (UTC)：2026-11-13T07:56:54.305234+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [app/api/chat/route.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/app/api/chat/route.ts)：同一HEADのPR案件に原文収録
- [app/api/cron/emotion-recovery/route.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/app/api/cron/emotion-recovery/route.ts)：同一HEADのPR案件に原文収録
- [app/api/persona/evolution/analyze/route.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/app/api/persona/evolution/analyze/route.ts)：同一HEADのPR案件に原文収録
- [app/api/persona/history/route.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/app/api/persona/history/route.ts)：同一HEADのPR案件に原文収録
- [app/chat/page.tsx](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/app/chat/page.tsx)：同一HEADのPR案件に原文収録
- [docs/IMPLEMENTATION_OVERVIEW.md](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/docs/IMPLEMENTATION_OVERVIEW.md)：同一HEADのPR案件に原文収録
- [lib/anonymous-memory-evidence.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/lib/anonymous-memory-evidence.ts)：同一HEADのPR案件に原文収録
- [lib/canonical-state.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/lib/canonical-state.ts)：同一HEADのPR案件に原文収録
- [lib/persona/evolution-runner.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/lib/persona/evolution-runner.ts)：同一HEADのPR案件に原文収録
- [lib/persona/persona-store.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/lib/persona/persona-store.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-emotion-store.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/lib/relationship-emotion-store.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-runtime-v1.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/lib/relationship-runtime-v1.ts)：同一HEADのPR案件に原文収録
- [package-lock.json](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/package-lock.json)：同一HEADのPR案件に原文収録
- [package.json](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/package.json)：同一HEADのPR案件に原文収録
- [supabase/functions/_shared/anonymous-history-expiry.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/functions/_shared/anonymous-history-expiry.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/_shared/anonymous-memory-expiry.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/functions/_shared/anonymous-memory-expiry.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/_shared/forget-control.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/functions/_shared/forget-control.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/conversation-root.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/functions/body-clock/conversation-root.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/index.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/functions/body-clock/index.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/persona-store.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/functions/body-clock/persona-store.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/temporary-state.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/functions/body-clock/temporary-state.ts)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261006200002_forget_control_v1.sql](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/migrations/20261006200002_forget_control_v1.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261112081000_purge_expired_anonymous_root.sql](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/migrations/20261112081000_purge_expired_anonymous_root.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261112082000_relationship_emotion_resume.sql](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/migrations/20261112082000_relationship_emotion_resume.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261112083000_anonymous_confirmation_expiry.sql](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/migrations/20261112083000_anonymous_confirmation_expiry.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261112084000_relationship_emotion_recovery.sql](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/supabase/migrations/20261112084000_relationship_emotion_recovery.sql)：同一HEADのPR案件に原文収録
- [tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/account-conversation.test.cjs)：同一HEADのPR案件に原文収録
- [tests/anonymous-history-expiry.test.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/anonymous-history-expiry.test.ts)：同一HEADのPR案件に原文収録
- [tests/anonymous-root-purge.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/anonymous-root-purge.test.cjs)：同一HEADのPR案件に原文収録
- [tests/body-clock-canonical.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/body-clock-canonical.test.cjs)：同一HEADのPR案件に原文収録
- [tests/forget-batch-evaluate.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/forget-batch-evaluate.ts)：同一HEADのPR案件に原文収録
- [tests/forget-batch.test.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/forget-batch.test.ts)：同一HEADのPR案件に原文収録
- [tests/forget-call-count.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/forget-call-count.test.cjs)：同一HEADのPR案件に原文収録
- [tests/forget-control.test.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/forget-control.test.ts)：同一HEADのPR案件に原文収録
- [tests/forget-database.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/forget-database.test.cjs)：同一HEADのPR案件に原文収録
- [tests/forget-fixture.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/forget-fixture.cjs)：同一HEADのPR案件に原文収録
- [tests/forget-integration.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/forget-integration.test.cjs)：同一HEADのPR案件に原文収録
- [tests/helpers/canonical-harness.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/helpers/canonical-harness.cjs)：同一HEADのPR案件に原文収録
- [tests/helpers/forget-batch-evaluation.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/helpers/forget-batch-evaluation.ts)：同一HEADのPR案件に原文収録
- [tests/helpers/forget-batch-fixtures.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/helpers/forget-batch-fixtures.ts)：同一HEADのPR案件に原文収録
- [tests/helpers/forget-batch-runner.ts](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/helpers/forget-batch-runner.ts)：同一HEADのPR案件に原文収録
- [tests/maintenance.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/maintenance.test.cjs)：同一HEADのPR案件に原文収録
- [tests/recovery-admission.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/recovery-admission.test.cjs)：同一HEADのPR案件に原文収録
- [tests/relationship-runtime-v1.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/relationship-runtime-v1.test.cjs)：同一HEADのPR案件に原文収録
- [tests/reports/forget-batch-evaluation.md](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/reports/forget-batch-evaluation.md)：同一HEADのPR案件に原文収録
- [tests/reports/forget-batch-scripted.json](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/reports/forget-batch-scripted.json)：同一HEADのPR案件に原文収録
- [tests/server-canonical.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/server-canonical.test.cjs)：同一HEADのPR案件に原文収録
- [tests/sql/anonymous-root-purge-assertions.sql](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/sql/anonymous-root-purge-assertions.sql)：同一HEADのPR案件に原文収録
- [tests/sql/anonymous-root-purge.sql](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/sql/anonymous-root-purge.sql)：同一HEADのPR案件に原文収録
- [tests/temporary-continuity.test.cjs](https://github.com/miyazaki1016/misaki/blob/51172011f7fac44950a6aa68494771ecdfe2bd76/tests/temporary-continuity.test.cjs)：同一HEADのPR案件に原文収録

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

