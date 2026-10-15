# Body Clock 関係性DTO 接続直前レビュー（2026-10-15）

## 検証済み
commit `3ee0bd3` は GitHub Actions `npm test` / `npx tsc --noEmit` / `npm run build` および Vercel 成功。独立した正規化テストは恒久・匿名で同じ5軸と交際状態から同じ演技ガイドを作ることを確認した。**実際のEdge配線・実Gemini応答・DB読み取りは未検証。**

## 接続時の最小差分（まだ適用しない）
- 恒久：Body Clockの既存 `misaki_relationship_state` 読み取りを拡張し、5軸の `*_score` と `relationship_status` を取得。conversation-rootの `updated_at` と同じトランザクションのスナップショットではないため、競合の検証が必要。
- 匿名：`loadBodyClockRoot` が検証済み `temporaryState` を返す。そこに `relationshipEngine.state` が存在する場合のみ5軸/statusを読む。匿名ユーザーに恒久行の5軸を混ぜない。既存トークンに5軸がなければfail-closed。
- `intimacyStage` は5軸の値から計算しない。既存のポイント→段階の正規ルールを再利用し、恒久と匿名で同じ入力なら同じ段階を使う。
- `relationshipImportPending` / `relationshipCriticalPending` は欠損扱いとする。匿名トークンの型アサーションは正当性検証ではない。
- 5軸・statusを確認できなければ、交際済みを推測しない。**ただし既存の確定事実を新たに「交際未成立」と断定しない**。欠損はunknownとして扱う。

## 競合と優先度の未解決点
1. **交際statusの新鮮さ**：生成前のread-only取得と送信時の関係性変更の競合。匿名revisionの一致だけでは、恒久関係性rowの更新を保証しない。恒久の関係性更新時刻/版を取得できるか確認し、既存の `finish_misaki_body_clock_delivery` の整合条件を壊さず検討する。
2. **タグの衝突**：`proactive-decision.ts` のEmotion/Action由来タグはstatusを知らない。既存タグの抑制を無差別に行わず、最終演技ガイドでstatusを優先する。
3. **Edge互換**：Denoの `npm:` importを含むモジュールをNextのテストから直接importすると型チェックが失敗した。Node/Edge共通の純粋モジュール化と双方のビルド確認が必要。
4. **プロンプトの指示強度**：高恋愛スコアと未交際statusの組み合わせを実モデルで確認するまで「恋人のような文章が絶対出ない」とは言わない。
5. **適用判断**：PR #85はDraftで、本番経路は未変更。実配線は新しい独立PRに切り分け、CI・匿名/恒久回帰・実Edge Shadowの安全な入口を確認してからレビューする。

## 判定
**設計と独立テストは前進。Body Clock本番接続は保留。** 現時点で本番に安全に適用できると断定しない。
