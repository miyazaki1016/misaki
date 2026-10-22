# 通常会話 Gemini入力経路の読み取り監査（2026-10-22）

## 範囲・根拠
GitHub main固定コミット `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` の `app/api/chat/route.ts` を**読み取りのみ**で照合。行番号は当該コミット基準。実稼働と同等のprompt byte列やmodel tokenを測定したものではない。変更対象は**実験枝のこの報告書のみ**。

## 確認できた事実
1. **履歴は最大60件**：行101 `MAX_HISTORY=60`、1954–1971でsafeHistoryを末尾60件に制限し、2242–2258でrole付きGemini `contents` に変換。
2. **別経路で美咲の直近8発言を再掲**：2187–2207でsafeHistory内から `role === "misaki"` の直近8件を `recentTopicText` に加工。2361–2366で `【直近の美咲の発言】`としてsystem promptに挿入。一方で2242–2258のcontentsには同じ発言が残る。**同内容の意図的な重複送信可能性がソース上で確認できる**。ただし重複を安全に除いてよいかは反復抑制品質比較が必要。
3. **外部データを各リクエスト経路で取得している**：2159–2174で `getTokyoWeather()` と `getTokyoLifeEvents()` を同時に呼ぶ。天候取得のfetchは409–436で `revalidate: 600` を指定。**毎ターンの関数呼出しと毎ターンの外部ネットワーク送信は同義ではない**（cache効果は実測が必要）。
4. **天気と東京生活イベントは常にsystem prompt合成位置を持つ**：2176–2185で `weatherGuide` と `tokyoLifeEventsGuide` を生成し、2332–2336でsystem instruction内に両者を挿入。実際の文字量は情報なし/キャッシュ/イベント状態で変わるので未計測。
5. **プロンプトに含まれる保護すべき素材**：2260–2276にpersona、relationship、user profile、life/relationship time、taxi contextなど。2306にactivityGrounding。2359にtodayMemoryGuide、2368–2372にlong-term memory。これらをGemini節約のため無条件削除してはいけない。
6. **リクエスト毎の完成形**：2468–2477で `generateGeminiJson` へ `systemInstruction = baseSystemPrompt + retryGuide + supplementaryGuide`、`contents`、`userText = modelMessage` を送る。初回とretryでサイズが異なる。1830–1831で `modelMessage` がrecall awareに加工されており単純な `message` と同一ではない場合がある。
7. **常時残る説明文もある**：2308–2324の「リアルタイム情報の入手経路を作らない」、2338–2357の天気の最重要ルール等。外部データ本体とガード文の削除は別問題。安全ルールは維持。
8. **現状のオフライン実験**：`chat-input-metrics.ts` はUTF-8 byte/重複sourceを数える純粋関数。`chat-prompt-selection-diff.mjs` はsynthetic dataについて外部候補節のみ選択解除する比較器。**どちらも実際のbuilderと結合していないため、現在のモデル送信費削減にはまだ直結していない**。

## 検証可能な節の分割案（まだ実装・同等性証明なし）
- protected: persona, relationship + acting + pending, user profile, life/persona, relationship time & signals, taxi/user facts, activity grounding, safety/generation contract, today memory, long-term memory, temporal context, weather safety guard
- external candidates: weatherGuide, tokyoLifeEventsGuide（後者の内部にtrain/airport/warnings混在があり得るため事前分割とソース検証が必要）
- potentially redundant: recentTopicText（直近8美咲発言；contentsとの差分と品質試験が必要）
- retry-only: retryGuide, supplementaryGuide
- content roles: safeHistory末尾60件; current `modelMessage`

## 失敗させるべき検証ケース
- キャラ人格/関係/長期記憶/Forgetの許可対象がV0対比で変わった場合はreject。
- ユーザー現在地を職業や美咲の東京居住地から勝手に推定して地域情報を選んだ場合はreject。
- 天候や運航情報が未取得なのに観測済みとして応答した場合はreject。
- 天気や運航への明示的な質問を、選択解除で無根拠に答えさせた場合はreject。
- 初回とretryを混ぜたbyte比較、およびUTF-8 byteをGemini token単価で換算した数字を実費として記録することをreject。

## 次の最小作業
1. `createWeatherGuide`, `createTokyoLifeEventsGuide`, `createRecallAwareMessage` の内部を確認し、生成内容の種類と安全ガードを整理。
2. 実際のテンプレート文字列をsynthetic値で展開した**V0 byte parity**をテスト可能な形で切り出す。最初にリファクタだけをして、V0と差があれば不合格。
3. V0確定後に外部情報選別のV1を比較。可能ならGemini実リクエストの既存usage telemetryを個人情報なしで集計（課金API呼び出しは別許可）。

main、本番美咲、Supabase、アメふる未変更。legacy BLOCKED / Forget独立16テストNOT_RUNの扱いを維持。
