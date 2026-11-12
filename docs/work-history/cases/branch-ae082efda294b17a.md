# experiment/conversation-lab-offline-v1-20261015

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** ブランチ差分（PR関連あり）

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

関連PR：[#86](https://github.com/miyazaki1016/misaki/pull/86)

根拠取得日時 (UTC)：2026-11-12T06:52:19.052618+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [app/api/conversation-review/smoke/route.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/app/api/conversation-review/smoke/route.ts)：同一HEADのPR案件に原文収録
- [app/conversation-review/page.tsx](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/app/conversation-review/page.tsx)：同一HEADのPR案件に原文収録
- [docs/CONVERSATION_LAB_PRODUCTION_PARITY_AUDIT_20261015.md](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/docs/CONVERSATION_LAB_PRODUCTION_PARITY_AUDIT_20261015.md)：同一HEADのPR案件に原文収録
- [docs/CONVERSATION_LAB_PROMPT_EXTRACTION_CONTRACT_20261015.md](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/docs/CONVERSATION_LAB_PROMPT_EXTRACTION_CONTRACT_20261015.md)：同一HEADのPR案件に原文収録
- [docs/CONVERSATION_LONG_TERM_PROBES_20261019.md](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/docs/CONVERSATION_LONG_TERM_PROBES_20261019.md)：同一HEADのPR案件に原文収録
- [docs/CONVERSATION_QUALITY_MULTITURN_GATE_20261017.md](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/docs/CONVERSATION_QUALITY_MULTITURN_GATE_20261017.md)：同一HEADのPR案件に原文収録
- [docs/CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/docs/CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md)：同一HEADのPR案件に原文収録
- [docs/CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/docs/CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md)：同一HEADのPR案件に原文収録
- [docs/IMPLEMENTATION_OVERVIEW.md](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/docs/IMPLEMENTATION_OVERVIEW.md)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/evaluation.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/evaluation.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/github-one-shot-claim.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/github-one-shot-claim.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/live-smoke-probe.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/live-smoke-probe.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/quality-assessment.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/quality-assessment.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/quality-probe-runner.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/quality-probe-runner.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/quality-probes.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/quality-probes.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/quality-review-packet.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/quality-review-packet.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/quality-reviewed-comparison.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/quality-reviewed-comparison.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/recorded-reply-import.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/recorded-reply-import.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/runner.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/runner.ts)：同一HEADのPR案件に原文収録
- [lib/conversation-lab/scenarios.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/lib/conversation-lab/scenarios.ts)：同一HEADのPR案件に原文収録
- [scripts/run-conversation-smoke.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/scripts/run-conversation-smoke.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-github-one-shot-claim.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-github-one-shot-claim.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-evaluation.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-evaluation.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-live-smoke-probe.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-live-smoke-probe.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-quality-assessment.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-quality-assessment.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-quality-probe-runner.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-quality-probe-runner.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-quality-probes.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-quality-probes.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-quality-review-packet.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-quality-review-packet.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-quality-reviewed-comparison.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-quality-reviewed-comparison.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-recorded-reply-import.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-recorded-reply-import.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-lab-runner.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-lab-runner.test.ts)：同一HEADのPR案件に原文収録
- [tests/conversation-live-smoke-mocked.test.ts](https://github.com/miyazaki1016/misaki/blob/f92250fc1ac79efa44c72468e00449d3fdc7ce6e/tests/conversation-live-smoke-mocked.test.ts)：同一HEADのPR案件に原文収録

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

