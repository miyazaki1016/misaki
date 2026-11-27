# docs/conversation-maturity-218

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** ブランチ差分（PR関連あり）

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

関連PR：[#219](https://github.com/miyazaki1016/misaki/pull/219)

根拠取得日時 (UTC)：2026-11-27T00:47:12.805808+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [docs/CONVERSATION_MATURITY_REVIEW_218.md](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/docs/CONVERSATION_MATURITY_REVIEW_218.md)：同一HEADのPR案件に原文収録
- [tests/relationship-source-of-truth-contract.test.cjs](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/relationship-source-of-truth-contract.test.cjs)：同一HEADのPR案件に原文収録
- [tests/three-block-one-pass.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block-one-pass.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/one-pass.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/one-pass.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/lib/conversation-lab-comparison.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/lib/conversation-lab-comparison.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/lib/conversation-lab-decision.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/lib/conversation-lab-decision.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/lib/conversation-lab-handoff.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/lib/conversation-lab-handoff.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/lib/conversation-lab-pipeline.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/lib/conversation-lab-pipeline.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/lib/conversation-lab-scope.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/lib/conversation-lab-scope.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/tests/conversation-lab-comparison.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/tests/conversation-lab-comparison.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/tests/conversation-lab-decision.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/tests/conversation-lab-decision.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/tests/conversation-lab-handoff.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/tests/conversation-lab-handoff.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/tests/conversation-lab-pipeline.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/tests/conversation-lab-pipeline.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/selection/tests/conversation-lab-scope.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/selection/tests/conversation-lab-scope.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-approved-replay.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-approved-replay.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-balanced.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-balanced.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-blind-quality.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-blind-quality.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-offline-harness.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-offline-harness.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-prompt.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-prompt.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-quality-long-history.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-quality-long-history.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-quality.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-quality.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-replay-boundary.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-replay-boundary.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-replay-preflight.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-replay-preflight.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-replay-privacy.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-replay-privacy.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-results.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-results.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/lib/context-ab-reviewed-snapshot.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/lib/context-ab-reviewed-snapshot.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/scripts/run-synthetic-quality-checks.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/scripts/run-synthetic-quality-checks.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-approved-replay.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-approved-replay.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-balanced.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-balanced.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-blind-quality.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-blind-quality.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-offline-harness.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-offline-harness.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-prompt.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-prompt.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-quality-long-history.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-quality-long-history.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-quality.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-quality.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-replay-boundary.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-replay-boundary.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-replay-order.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-replay-order.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-replay-preflight.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-replay-preflight.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-replay-privacy.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-replay-privacy.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-results.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-results.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/slimming/tests/context-ab-reviewed-snapshot.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/slimming/tests/context-ab-reviewed-snapshot.test.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/tuning/lib/conversation-tuning-preview.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/tuning/lib/conversation-tuning-preview.ts)：同一HEADのPR案件に原文収録
- [tests/three-block/vendor/tuning/tests/conversation-tuning-preview.test.ts](https://github.com/miyazaki1016/misaki/blob/6dec8e6ba75a34f83f9fc413f4300a53b6c92be4/tests/three-block/vendor/tuning/tests/conversation-tuning-preview.test.ts)：同一HEADのPR案件に原文収録

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

