# 通常会話 外部情報セレクタ：ローカル再構成テスト報告（2026-10-22）

## テスト対象・方法
- GitHub実験ブランチ `experiment/chat-input-metrics-offline-20261022` の `lib/conversation-engine/chat-external-relevance.ts` と `tests/chat-external-relevance-offline.test.ts` を基に、同等のコードをローカル一時領域 `/tmp/misaki_relevance` に再構成した。
- Node.js v22.16.0、`node --test --experimental-strip-types tests/chat-external-relevance-offline.test.ts` で実行。
- **結果 7 tests / 7 pass / 0 fail**。テストログの主なケース：あいさつでは東京天気・羽田・鉄道の不採用、天気質問の選別、期限切れ/エリア不一致、受信/利用権不足、地域に関連する大きな地震の文脈候補、未検証/期限切れ、重複イベントIDの拒否。

## 重要な実行範囲
- **GitHub実験枝の完全checkoutをしたわけではない**。接続先の該当ファイル内容に基づくローカル同等コードを実行した結果であり、CI成功・repo全体の型検査・runtime統合を保証しない。
- 実Gemini、Supabase、Vercel、本番の自発メッセージ/配信/会話ルートを呼び出さなかった。
- 実token、料金、会話の自然さ、V0既存prompt parity、通信費、実データの情報正確性はまだ測っていない。

## テストで見えた設計上の未解決

1. `topic="transport"` では地域内の鉄道と空港候補をどちらも選べる。**羽田の質問で、同地域の鉄道情報が無条件に同梱され得る**ため、transportをairport/rail/路線/便名などに細分化する前に本番には接続しない。
2. `location="user"` に付随する`relevantRegion=true`は呼び出し元による申告であり、現在地が許可済み・新鮮・観測地域に一致していると**この関数だけで証明できない**。
3. `severity="high"`も入力値であり、実際の気象庁発表から地域震度や警報を検証するパーサー、event同一性や発表更新順の扱いは未実装。高重要度の雑談割込みが適切か、品質A/Bが必要。
4. `permitted`は外部情報をチャット文脈へ含める許可だけ。地震きっかけ自発メッセージに必要な位置情報/通知オプトインやRelationship動機判断・Delivery Gateの代用には**ならない**。
5. 相対日時や記憶の訂正/Forgetの状態はこのプロトタイプ外。独立Forget16試験NOT_RUN、legacy BLOCKEDはそのまま。

## 次の実行順
- `transport`を対象種別と具体的な施設/路線識別子で絞る純粋fixtureを増やし、正確なweather user/character区分、earthquakeのregion granularity、同意の入力境界を設計。
- 現mainの`app/api/chat/route.ts`からV0 promptを再構成してbyte-level parityを確かめる。それまで既存処理の置換はしない。
- 実験枝以外へのコード反映、有料モデル実験、Supabase/本番改修は別の明示承認が必要。

関連：監査資料81（測定契約）・82（イベント動機の将来構想）／実験枝 `docs/CHAT_EXTERNAL_RELEVANCE_OFFLINE_V1_20261022.md`。 
