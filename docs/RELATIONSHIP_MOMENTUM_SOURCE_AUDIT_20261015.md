# Momentum導出可能性のソース照合（2026-10-15）

対象: main `docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md`、`lib/relationship-processing-v1.ts`、`lib/relationship-acting-guide.ts`。**設計調査であり、Momentum実装・実データ取得は行っていない。**

## 確認済み

- 設計書§9は長期State / Momentum / Emotion / Actionを分離し、初期v1では**recent Patterns/EventsからMomentumを導出する**ことを優先。欠席・時間経過だけで長期5軸を減衰させない。
- `CanonicalRelationshipStore.episodes()` はversion一致のEpisodeをユーザー単位で読める。`patterns()` と `appliedPatterns()` はPatternと適用済みを読める。`events()` は現状、critical type（proposal / acceptance / rejection / relationship_end / boundary / reconciliation）に**限定**している。
- `turn()` は特定requestIdの `chat_turn_completed` を読むが、**直近Nターンをまとめて取得するMomentum用インターフェースではない**。
- `createRelationshipActingGuide` の入力はIntimacy、5軸、relationshipStatusのみ。**Momentum、recent episodes、current Emotion/Actionは引数にない。** したがってこの関数単独では「昨日仲直りした」「今日は気まずい」といった直近の空気を明示的に解釈できない。
- `processRelationshipTurn` は保存済みターンを起点にEvidence→Episode→Pattern→Stateを更新するが、Momentumの導出・保存・Interpreterへの引き渡しはこのファイルに見当たらない。

## 実装可能性と欠けている契約

| 入力 | 現行の取得可能性 | 未解決点 |
|---|---|---|
| 長期5軸とStatus | canonical state / acting guide入力あり | 正本状態との統合経路は別途call-site確認 |
| recent Episodes | Storeで取得可（全件、version一致） | 日付・種類・極性を安全に絞るread-only helper |
| recent Patterns | Storeで取得可 | patternの時系列・適用状態と解釈の境界 |
| critical Events | Storeで取得可（限定6種） | 同じイベントを長期状態と短期空気に二重解釈しない |
| recent chat turns | requestId単位の読出しのみ確認 | 直近N件のcanonical read契約が必要 |
| 現在のEmotion/Action | acting guideには未入力 | 他の生成経路との整合確認が必要 |

## 安全な最小案（未承認）

1. **最初は新DBテーブルを作らず**、直近のcanonical Events/Episodes/Patternsを読み取り専用で集約できるか確認する。ユーザー発話の根拠・時刻・種類・極性・Statusとの整合がない場合はMomentumを「不明」にする。
2. Momentumは一時的な会話の空気（例: calm / playful / tense / repairing）として表現し、**長期scoreやStatusを直接変更しない**。これは候補語彙であり正式schemaではない。
3. 確実なreconciliation/boundary等のcritical Eventsがあれば優先度を検討する。ただし直近の一回の出来事で「喧嘩した事実」や「仲直り成立」を推測しない。
4. 将来のResolverがMomentumをInterpreterへ渡す場合、**同一のcanonical source**から取り、通常chat/自発/Body Clock間で矛盾しないようにする。正本の取得失敗時はfail-closedし、架空の思い出を補完しない。

## 次に必要なコード照合

- 本番chat routeで `createRelationshipActingGuide` がどのStateと合成されているか。
- 自発・Body Clockのプロンプト構築経路と関係ガイドの共有状況。
- Canonical turn履歴を読む既存helperがあるか。**これらを確認するまではMomentumが既存コードで未実装だと全体断定しない。**

**変更境界:** 調査文書のみ。Draft PR #85。本番コード・DB・migration・環境変数変更なし。
