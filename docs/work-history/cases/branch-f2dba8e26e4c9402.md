# work/context-no-duplicate-replies-ab

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** ブランチ差分（PR関連あり）

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

関連PR：[#78](https://github.com/miyazaki1016/misaki/pull/78)

根拠取得日時 (UTC)：2026-11-09T08:56:52.743400+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [.github/workflows/context-ab-live-manual.yml](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/.github/workflows/context-ab-live-manual.yml)：同一HEADのPR案件に原文収録
- [.github/workflows/context-ab-validation.yml](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/.github/workflows/context-ab-validation.yml)：同一HEADのPR案件に原文収録
- [.github/workflows/isolated-replay-tests.yml](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/.github/workflows/isolated-replay-tests.yml)：同一HEADのPR案件に原文収録
- [.github/workflows/manual-synthetic-quality-evaluation.yml](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/.github/workflows/manual-synthetic-quality-evaluation.yml)：同一HEADのPR案件に原文収録
- [app/api/chat/route.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/app/api/chat/route.ts)：同一HEADのPR案件に原文収録
- [app/api/experiments/blind-quality/route.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/app/api/experiments/blind-quality/route.ts)：同一HEADのPR案件に原文収録
- [app/api/experiments/replay-ab/route.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/app/api/experiments/replay-ab/route.ts)：同一HEADのPR案件に原文収録
- [app/api/experiments/synthetic-quality-run/route.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/app/api/experiments/synthetic-quality-run/route.ts)：同一HEADのPR案件に原文収録
- [app/experiments/blind-quality-review/page.tsx](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/app/experiments/blind-quality-review/page.tsx)：同一HEADのPR案件に原文収録
- [app/experiments/replay-self-check/page.tsx](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/app/experiments/replay-self-check/page.tsx)：同一HEADのPR案件に原文収録
- [docs/CONTEXT_AB_EXPERIMENT.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/CONTEXT_AB_EXPERIMENT.md)：同一HEADのPR案件に原文収録
- [docs/IMPLEMENTATION_OVERVIEW.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/IMPLEMENTATION_OVERVIEW.md)：同一HEADのPR案件に原文収録
- [docs/context-ab-blind-review-template.csv](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/context-ab-blind-review-template.csv)：同一HEADのPR案件に原文収録
- [docs/context-ab-blind-review.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/context-ab-blind-review.md)：同一HEADのPR案件に原文収録
- [docs/context-ab-execution-gate.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/context-ab-execution-gate.md)：同一HEADのPR案件に原文収録
- [docs/context-ab-real-history-quality-review.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/context-ab-real-history-quality-review.md)：同一HEADのPR案件に原文収録
- [docs/context-ab-validation-protocol.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/context-ab-validation-protocol.md)：同一HEADのPR案件に原文収録
- [docs/conversation-context-compression-spike.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/conversation-context-compression-spike.md)：同一HEADのPR案件に原文収録
- [docs/memory-certainty-design.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/memory-certainty-design.md)：同一HEADのPR案件に原文収録
- [docs/misaki-blind-quality-evaluation-fixtures.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/misaki-blind-quality-evaluation-fixtures.md)：同一HEADのPR案件に原文収録
- [docs/misaki-synthetic-live-evaluation-runbook.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/misaki-synthetic-live-evaluation-runbook.md)：同一HEADのPR案件に原文収録
- [docs/misaki-synthetic-reference-replies-and-self-scores.md](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/docs/misaki-synthetic-reference-replies-and-self-scores.md)：同一HEADのPR案件に原文収録
- [lib/canonical-state.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/canonical-state.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-approved-replay.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-approved-replay.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-balanced.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-balanced.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-blind-quality.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-blind-quality.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-gemini-adapter.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-gemini-adapter.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-long-fixture.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-long-fixture.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-offline-harness.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-offline-harness.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-prompt.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-prompt.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-quality-long-history.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-quality-long-history.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-quality.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-quality.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-replay-boundary.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-replay-boundary.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-replay-preflight.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-replay-preflight.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-replay-privacy.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-replay-privacy.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-results.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-results.ts)：同一HEADのPR案件に原文収録
- [lib/context-ab-reviewed-snapshot.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-ab-reviewed-snapshot.ts)：同一HEADのPR案件に原文収録
- [lib/context-overlap-analysis.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-overlap-analysis.ts)：同一HEADのPR案件に原文収録
- [lib/context-size-measurement.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/context-size-measurement.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-acting-guide.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/relationship-acting-guide.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-analyzer-v1.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/relationship-analyzer-v1.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-engine-v1.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/relationship-engine-v1.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-identity-resolver.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/relationship-identity-resolver.ts)：同一HEADのPR案件に原文収録
- [lib/relationship-runtime-v1.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/lib/relationship-runtime-v1.ts)：同一HEADのPR案件に原文収録
- [package-lock.json](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/package-lock.json)：同一HEADのPR案件に原文収録
- [package.json](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/package.json)：同一HEADのPR案件に原文収録
- [scripts/context-ab-live.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/scripts/context-ab-live.ts)：同一HEADのPR案件に原文収録
- [scripts/context-ab-quality-live.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/scripts/context-ab-quality-live.ts)：同一HEADのPR案件に原文収録
- [scripts/context-ab-smoke.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/scripts/context-ab-smoke.ts)：同一HEADのPR案件に原文収録
- [scripts/run-live-synthetic-quality-eval.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/scripts/run-live-synthetic-quality-eval.ts)：同一HEADのPR案件に原文収録
- [scripts/run-synthetic-quality-checks.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/scripts/run-synthetic-quality-checks.ts)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql)：同一HEADのPR案件に原文収録
- [supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql)：同一HEADのPR案件に原文収録
- [tests/context-ab-approved-replay.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-approved-replay.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-balanced.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-balanced.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-blind-quality.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-blind-quality.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-gemini-adapter.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-gemini-adapter.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-offline-harness.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-offline-harness.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-prompt.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-prompt.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-quality-long-history.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-quality-long-history.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-quality.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-quality.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-replay-boundary.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-replay-boundary.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-replay-order.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-replay-order.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-replay-preflight.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-replay-preflight.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-replay-privacy.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-replay-privacy.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-results.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-results.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-ab-reviewed-snapshot.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-ab-reviewed-snapshot.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-overlap-analysis.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-overlap-analysis.test.ts)：同一HEADのPR案件に原文収録
- [tests/context-size-measurement.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/context-size-measurement.test.ts)：同一HEADのPR案件に原文収録
- [tests/fixtures/relationship-identity-baseline.sql](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/fixtures/relationship-identity-baseline.sql)：同一HEADのPR案件に原文収録
- [tests/relationship-identity-anonymous-runtime.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/relationship-identity-anonymous-runtime.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-identity-audit.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/relationship-identity-audit.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-identity-persistence.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/relationship-identity-persistence.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-identity-resolver.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/relationship-identity-resolver.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-identity-sql.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/relationship-identity-sql.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-identity-temporary-import.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/relationship-identity-temporary-import.test.ts)：同一HEADのPR案件に原文収録
- [tests/relationship-mutual-acceptance.test.ts](https://github.com/miyazaki1016/misaki/blob/a849bec92059d326940ffc358635164ea7d391c9/tests/relationship-mutual-acceptance.test.ts)：同一HEADのPR案件に原文収録

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

