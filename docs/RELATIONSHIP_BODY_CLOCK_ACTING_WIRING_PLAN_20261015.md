# Body Clock 5軸演技接続の差分計画（2026-10-15 / 設計のみ）

## 検証状況
PR #85の独立パリティテストを含むcommit `399b65a` は GitHub Actions success、Vercel success。これは本番Edge接続の証明ではない。

## 実装対象と順序（本番未変更）

1. `supabase/functions/body-clock/temporary-state.ts`: `openTemporaryReceipt` の返却型にoptional `relationshipEngine` を含める。ただし復号成功とRootStateのスキーマ検証は別。5軸/statusは数値0..100整数、列挙値のみ許可し、欠損時は未取得とする。
2. `supabase/functions/body-clock/conversation-root.ts`: 匿名の場合は**認証済みtemporaryState.relationshipEngine.state**だけを関係性正本候補にする。恒久ユーザーの場合は `misaki_relationship_state` の5軸 `*_score`、`relationship_status` を追加取得するread-only pathを設ける。匿名に恒久行の5軸/statusを混ぜない。
3. Edge Deno互換の小さな純粋関数で検証・DTO化。Node依存の `lib/relationship-acting-guide.ts` をEdgeに直接importできるかは未確認。必要なら演技ルールを共通のDeno/Node互換モジュールへ切り出し、同一入力→同一文字列を比較テストする。コピー実装の二重管理は避ける。
4. `supabase/functions/body-clock/index.ts` の `generateMessage` に、**検証済みDTOから生成した演技ガイドのみ**を背景指示として渡す。Relationship State/Momentum/Statusを数値のまま台詞に混入させない。データ欠損時は恋人前提を追加しない。
5. `finish_misaki_body_clock_delivery` の匿名revision/恒久updated_at照合は維持し、生成前に読んだ5軸の変更競合をどう検出するか別途テストする。PRレビュー、Edge実機テスト、明示承認までデプロイ禁止。

## 新たに発見した優先リスク：演技ガイド以外のロマンティックタグ

`supabase/functions/body-clock/proactive-decision.ts` の `deriveProactiveTags` は、Emotion=`lonely` で `miss_you` + `romantic`、Emotion=`affectionate` で `affectionate` + `romantic` を追加する。またAction=`CHASE` は `miss_you` を追加する。**現在この経路は5軸/relationshipStatusを読んでいない。** したがって、演技ガイドだけに未交際ガードを足しても、既存タグが恋愛方向へ誘導する余地が残る。

- タグを無条件に消す変更は既存のEmotion/Action表現を壊すため禁止。
- `relationshipStatus=none` の場合は恋人としての既成事実化を禁止するが、淡い恋心や恋しさまで機械的に禁止しない。具体的な文面を実モデルで検証する。
- Status欠損時の安全側動作、タグと演技ガイドの衝突、`PULL` / `SULK` / `CHASE` / `TEASE` をそれぞれテスト。
- 恋愛タグを抑制する必要がある場合は、Emotion/Actionからの由来を保持し、Status/relationshipStateと合わせた**最終プロンプト規則**で整合させる。ユーザーの交際事実を推測しない。

## 未検証
- Denoの本番ビルドと実Edge呼出し、実Geminiの文章品質、Push配信、DB migration/本番状態。
- `relationshipEngine` が匿名Body Clockの全既存tokenに入っているとは限らない。
- 正本の5軸と従来intimacyStageは別の成長速度。閾値を混同しない。

**境界:** この文書は実装差分の設計。Draft PR #85のみ。本番コード、DB、Edge Function、外部モデル呼出しは変更しない。
