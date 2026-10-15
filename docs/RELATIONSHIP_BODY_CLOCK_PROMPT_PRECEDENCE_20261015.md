# Body Clock：関係性と感情タグの優先順位（2026-10-15／設計・未接続）

## 現状
commit `23080d6` の独立プロンプト境界実験は GitHub Actions（npm test / tsc / build）およびVercel成功。**独立実験が通っただけで、Edge生成経路の動作確認ではない。**

## 推奨するプロンプト優先順位
1. **事実と安全境界**：認証済み正本の `relationshipStatus`、交際事実、既知の履歴。状態が欠損したら交際を推測しない。交際前の好意をゼロにするわけではない。
2. **直近の行動**：`PULL` は甘いタグを抑え、`SULK` は攻撃・罰を避け、`TEASE` は遊び心と文脈の両方を要求し、`CHASE` は交際事実を作らない。
3. **5軸＋intimacyStage**：友情・信頼・じゃれ合い・親愛・恋愛を表現の距離感に反映。段階・数値は表示しない。
4. **Emotion/Tag**：候補として使い、上位の事実・行動・5軸と衝突する場合は従属させる。タグ自体は交際の証拠ではない。
5. **会話目的と生活文脈**：ユーザーに伝える理由・生活情報を優先し、毎回恋愛台詞を添えない。

## 必須ケース
- status=none + romance=90 + `romantic,miss_you`: 交際前の好意は許すが恋人としての既成事実は禁止。
- status=romantic_partner + romance=10: 交際事実は維持、強い甘さは強制しない。
- status欠損 + romantic: 恋人だと補完しない。
- action=PULL + romantic: 甘さを控える指示が勝つ。
- playfulness=10 + action=TEASE: 文脈がなければからかい禁止。
- action=SULK + romantic: 交際推定、罰、攻撃を避ける。

## 次の実装境界
- `proactive-decision.ts` の既存タグ導出ロジックを無条件に改変しない。
- **検証済みDTO → 純粋な演技ガイド → 最終プロンプト**を独立モジュールとして検証し、実Edgeへ配線するのは別PR/明示レビュー。
- 匿名はverified temporary rootの5軸/statusのみ、恒久はcanonical rowのみ。欠損時は関係事実を作らない。
- EdgeへのDeno互換性、実Gemini生成、匿名revision/恒久updated_at競合、配信内容の一致は未検証。
- 文面評価では、単なる禁止語検出ではなく「交際を成立した事実として語っていないか」を人手で確認する。

**変更境界：** PR #85 Draftの設計資料のみ。本番コード、DB、Edge Function、デプロイなし。
