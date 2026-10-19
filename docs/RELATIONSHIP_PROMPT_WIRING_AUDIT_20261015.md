# 通常チャットへのRelationship Guide接続監査（2026-10-15）

**確認対象:** main の `app/api/chat/route.ts` と `lib/relationship-runtime-v1.ts`。本番コードへの変更なし。

## 確認できた接続

- `app/api/chat/route.ts:2055–2067` は `canonicalRelationshipPoints` を利用し、`engineEnabled()` の場合は旧 `createRelationshipGuide` を空にする。
- 同箇所の `createRelationshipActingGuide` は、優先順位 `rootState.relationshipActingState` → `rootState.relationshipEngine.state` にlegacy points由来のintimacyStageを補完 → `createLegacyRelationshipActingState(safeRelationshipPoints)` で入力を組み立てる。
- `app/api/chat/route.ts:2260–2266` の `baseSystemPrompt` に `relationshipActingGuide` と `pendingRelationshipGuide(rootState)` が実際に挿入される。つまり**通常チャットの生成プロンプトへの接続は確認済み**。
- ここで呼ばれる `createRelationshipActingGuide` は5軸、Status、intimacyStageの関数。Momentumを別引数で渡す実装は確認できない。
- **注意:** `rootState.relationshipActingState` が存在する場合はそれを優先するため、当該Stateがどのタイミングで更新されるか、永続化と匿名の両経路を別途確認する必要がある。上記の読み順だけで正本との完全整合は断定できない。

## 自発/Body Clock

今回のソース照合では、自発/Body Clockの生成プロンプトのcall-siteは**未特定・未検証**。通常チャットで接続済みという事実を、そのまま他の生成経路に外挿しない。次に該当routeとprompt builderを特定して、同じ状態を参照するか照合する。

## 実験版への示唆

PR #85の `createIntegratedActingGuideExperiment` は本番call-siteで未使用。将来導入する場合も、通常チャットだけに足すのではなく、自発・Body Clockの正本読出し経路と整合させる必要がある。Momentumについても同様に、既存Stateの正本と独立したローカル正本を作らない。

**状態:** Draft / 未merge / 本番未変更 / Gemini未実行。
