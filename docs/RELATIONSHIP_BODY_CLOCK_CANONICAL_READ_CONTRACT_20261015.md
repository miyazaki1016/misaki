# Body Clock正本読出しの詳細と統合契約（2026-10-15）

ソース: main `supabase/functions/body-clock/conversation-root.ts`、`proactive-decision.ts`、`temporary-state.ts`、`index.ts`。**読取監査のみ。**

## 現状の正確なデータ経路

**恒久ユーザー:** `loadBodyClockRoot` は `misaki_user_conversation_state` からhistory/memory/today_memory/updated_atを読み、`buildProactiveDecisionContext` が `misaki_relationship_state` の `intimacy_level,intimacy_points,emotion_state,action_state,last_interaction_at` を読む。**5軸scoreとrelationship_statusはselect対象外**。

**匿名ユーザー:** `misaki_temporary_roots` の認証済みtokenを開き、history/memory/`relationshipPoints` を使用。 `buildProactiveDecisionContext` は同じrelationship stateを読みつつ、匿名tokenのverified pointsでintimacy_points/levelを上書きする。tokenの状態には他のフィールドが存在する可能性があるが、`openTemporaryReceipt` の型定義と `loadBodyClockRoot` の返却値からは5軸/Statusは**明示的に取り出されていない**。

**生成:** `generateMessage` はdecisionのEmotion/Action/Direction/Tags、生活根拠、最近20件の会話、長期記憶と関係ポイントを使用。通常チャットの `createRelationshipActingGuide` と同等の5軸・Status演技指示は渡されない。

## 具体的な統合契約の未決事項

1. **恒久:** `misaki_relationship_state` から5軸scoreと`relationship_status`をread-onlyで読む。列名・制約・現在の正本書込経路はmigration/RPCで再確認する。既存のEmotion/Action/intimacy読出しを壊さない。
2. **匿名:** 認証済みtemporary rootの `relationshipEngine.state` / `relationshipActingState` が存在するか、サーバー正本と世代整合するか確認する。**恒久テーブル値で匿名の5軸を無条件に上書きしない**。
3. **Interpreter:** Node用の関数をEdgeにそのままimportする前にDeno互換性・共有モジュール配置を確認。関係ガイドを足す場合も既存のemotion/action/tagと競合しない優先順位を定める。
4. **欠損:** 5軸が未整備/読出し失敗の場合は恋人化やスコアを推測しない。自発送信の安全なskipか明示的に検証したfallbackを設計する。
5. **一貫性:** Body Clockの生成→配送の間にはrevision/updated_atチェックが既にある。追加の5軸/Status読出しが配送時の状態と競合しないよう、スナップショット整合を検討する。
6. **検証:** 恒久/匿名、交際成立/解消、5軸低/中/高、直近Emotionと長期Stateの矛盾、Push写真タグ、同時通常チャットによる配送競合を合成ケースでテスト。

## 発見した重要な設計上の差

`buildProactiveDecisionContext` は親密度・Emotion・Actionの正本読出しをすでに持つ。よって**新DBテーブル不要で恒久5軸/Statusの取得を追加できる可能性が高い**。ただし匿名経路はtemporary rootの検証済み状態を優先すべきで、単純なselect列追加だけでは完了しない。

**次の作業:** migration/schemaとtemporary rootの構造を照合して、読み取り専用DTOと優先順位を明文化。まだコード接続は行わない。

**変更境界:** Draft PR #85の文書のみ。本番・DB・Edge Function未変更。
