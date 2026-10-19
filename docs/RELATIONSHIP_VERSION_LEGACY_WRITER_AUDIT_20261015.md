# Relationship version 書き込み経路監査：旧RPCとの境界（2026-10-15）

## 今回の実施
mainのmigration treeを列挙し、36件のSQL migrationを確認対象として把握。旧Relationship/Emotion/Action/会話同期のmigration群14件を抽出して、`misaki_relationship_state` に対する書き込みを調査した。

## 確認結果
- 2026-10-03の新Relationship Engine主要RPCは、5軸またはrelationship_status更新時に `relationship_state_version` を増分（critical event、bounded state application、temporary import、後続import置換）。
- **旧RPCは `misaki_relationship_state` のemotion_state、action_state、intimacy_points、last_interaction_atなどを更新するが、version増分を伴わない経路がある。** 例：
  - `20260917025500_phase3_chat_emotion_continuity_foundation.sql`：emotion_state更新。
  - `20260917030000_phase4_lazy_silence_evolution_rpc.sql`：emotion_state更新。
  - `20260917030000_phase4_relationship_action_state_engine.sql`：action_state更新。
  - `20260926000000_semantic_relationship_point_delta.sql`：intimacy_points/last_interaction_at更新。
  - `20260926003000_relationship_emotion_action_v2_rpc.sql`：emotion_state/action_state更新。
  - `20260930131930_relationship_server_rpc_user_context.sql`：interaction timestamps更新。

## 重要な区別
これら旧経路は**5軸またはrelationship_statusを直接変更している証拠ではない**。したがってversion非増分だけで「5軸更新の抜け道」とは断定しない。一方、Body ClockのEmotion/Action・親密度にも演技上の意味があるため、5軸versionだけでは旧Emotion/Action更新の競合を検知できない。関係性DTOに何を含めるかに応じて保護範囲を定義する必要がある。

## 追加確認事項
- mainのmigration全36件について、5軸/status列への書き込みを最終的に機械的に全検索し、後続の関数置換・トリガーを含めて実効定義を確認する。
- アプリ/Edgeの直接UPDATE経路と既存の旧RPCの呼び出し元を監査。
- 旧Emotion/ActionをBody Clockの生成条件に含める場合は、専用version/再読条件または更新ロックの必要性を別途判断する。
- 本番DB適用状況は未確認。

## 現時点の判断
**5軸/statusの主要更新経路はversion増分あり。ただしEmotion/Action等の旧関係性フィールドは同じversionでは保護されない。** PR #85 Draftの監査記録のみ。本番コード・DB・Edge未変更。
