# Relationship Acting DTOの正本契約（2026-10-15、設計案）

**根拠:** main `lib/canonical-state.ts`、`lib/relationship-engine-v1.ts`、`lib/relationship-acting-guide.ts`、`lib/relationship-runtime-v1.ts`、`supabase/functions/body-clock/conversation-root.ts`、`proactive-decision.ts`。実装前のread-only契約。DB変更なし。

## ソースで確定した事実

1. `RootState` は `relationshipEngine?: Snapshot` と `relationshipActingState?: RelationshipActingState` を持つ。Snapshot.stateには5軸、Status、intimacyStageがある。
2. 恒久 `loadCanonicalState` は `misaki_relationship_state.select("*")` の行から `canonicalActingState` を構築する。スコア列は `friendship_score/trust_score/playfulness_score/affection_score/romance_score`、Statusは `relationship_status`。5軸/Statusは**既存DB行で取得可能**。
3. 匿名 `loadTemporaryRoot` は暗号化・認証済み `misaki_temporary_roots.token` からRootStateを復元する。Relationship Engineの一時正本は `root.relationshipEngine.state`。現行通常チャットの優先順は `root.relationshipActingState` → `root.relationshipEngine.state` + intimacyStage補完 → legacy fallback。
4. Body Clockの `openTemporaryReceipt` は復号した `payload.state` を返すが、TypeScript返却型は `history/memory/todayMemory/relationshipPoints` のみを明記している。**実際のtokenのJSONがRootStateならrelationshipEngineも暗号化内に含まれ得る**。現行 `loadBodyClockRoot` はこれを返却していないため、型と読出し契約の拡張が必要。
5. Body Clockの恒久relationship state読出しは現状intimacy/emotion/action/last_interactionのみで、5軸/Statusを取得していない。

## 共通のread-only DTO候補

```ts
type RelationshipActingSnapshotV1 = {
  intimacyStage: 0 | 1 | 2 | 3 | 4 | 5;
  friendship: number; trust: number; playfulness: number;
  affection: number; romance: number;
  relationshipStatus: "none" | "romantic_partner";
  source: "permanent_canonical" | "temporary_verified";
};
```

- `source` は**出所の監査用メタデータ**。AIへ数値・出所をそのまま露出させず、演技ガイドへ変換する。
- **恒久:** canonical rowを厳格検証してDTO化。scoreは0–100の整数、Statusは列挙型、intimacyStageは既存 `createLegacyRelationshipActingState(intimacy_points)` と同じ関数的対応を使用。欠損時に匿名/legacy値を勝手に優先しない。
- **匿名:** authenticated temporary rootの `relationshipEngine.state` を優先し、親密度だけ同じrootのverified `relationshipPoints` から導出する。もし `relationshipActingState` がある場合は生成時点と一致するかを検証し、古い状態で新しいSnapshotを覆わない。Root不正・期限切れはskip。
- **移行中:** 匿名→恒久import pendingは関係性の確定前。通常チャットの `relationshipCriticalPending` 等と整合するまで、Statusを推測して自発送信しない。
- **同期:** Body Clockの `finish_misaki_body_clock_delivery` のrevision/updated_at照合を維持。5軸/Status読出しの前後で正本が変わるraceについて、必要な世代/状態整合の検証を追加検討する。
- **演技:** DTOから `createRelationshipActingGuide` と同義の規則を共有し、既存Emotion/Action/Direction/Tagsの瞬間表現を上書きしない。特にStatus=noneなら高romanceでも恋人として話さない。

## 実装前の検証条件

- 匿名tokenをEdgeで復号した時の型とRootStateの互換性をテスト。
- 恒久の5軸/Status正本列とintimacyStageの既存補完規則を検証。
- 関係Critical Pending/Import Pending中に自発送信しないか、適切な中立表現へ制限する。
- 通常/Body Clockで同じDTO入力に同じ演技規則を出せること、低/中/高スコアと非恋愛親友/恋人のテスト。
- 競合・期限切れ・DB読出し失敗はfail-closed。Push本文と写真が異なる関係の前提を使わない。

**重要:** 本文書は仕様案であって、DTOの実装やPRマージ承認ではない。PR #85 Draft、本番コード・DB・Edge未変更。
