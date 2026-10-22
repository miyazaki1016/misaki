# 通常会話：空港/鉄道の対象を限定する実験（2026-10-22）

## 背景と実装
外部情報をGeminiに常時渡さない方針。前段V1の `topic="transport"` は空港か鉄道か、また羽田か成田か、路線を区別できず、広すぎる。そこで**既存V1の関数とテストは温存**したまま、`selectChatExternalFactsForQuery` を追加した。

隔離ブランチ `experiment/chat-input-metrics-offline-20261022`:
- `lib/conversation-engine/chat-external-relevance.ts`: `transportKind:"airport"|"rail"` と**確認済みの** `targetId`、候補側の `targetId` が一致するものだけ採用。指定なしなら採用しない。許可・source確認・鮮度・地域の既存ガードを先に判定する。
- `tests/chat-external-targeted-offline.test.ts`: 羽田を尋ねても成田と山手線を選ばない、山手線を尋ねても中央線や羽田を選ばない、曖昧な交通質問で全件を入れない、候補target欠落、権限・鮮度の優先、通常天気質問との互換の6ケース。

## ローカル検証
GitHubコネクタからコードを読み、同等の関数とテストを `/tmp/misaki-targeted/` に**手元再構成**し、Node.js v22.16.0で `node --test --experimental-strip-types tests/chat-external-targeted-offline.test.ts` を実行。

**6 tests / 6 pass / 0 fail**。GitHub branchの実checkoutでもCIでもないため、それらが通過したとの記載はしない。コード内容の再構成一致保証・repo全体のTS型検査、既存全テスト、本番とGemini連携の検証は未実施。

## 設計上の残課題
1. `topic`/`transportKind`/`targetId` は呼び出し側が認識して渡す値。実ユーザー発言からの分類、表記ゆれ、同一航空施設名の曖昧性は未実装。
2. ID（`HND`、`JR-YAMANOTE`等）は合成fixture用。運用時に使う各providerの正規ID/種別は正式仕様と突き合わせる必要がある。**任意の自由文をtargetIdに信用して渡さない。**
3. 同じ発言で「羽田への電車」と言われる複数対象の質問は今回の単一target方式では十分でない。複数の明示した候補ターゲットを安全に解決する契約が必要。
4. 出典/provenanceと位置情報の利用許可や有効期限は依然として入力側で保証すべき。地震情報は重要度が高ければ通常会話の文脈候補にできるが、自発Pushの送信許可ではない。
5. V0現行mainとのプロンプト一致、実Geminiトークン費用/人格品質の比較は未実施。今回の2関数はいずれも**通常チャット本番に未接続**。

次はV0プロンプト再構成・節分割とオフライン比較。人格、記憶、関係性の根拠ルールを削らない。

## 安全範囲
実験ブランチの純粋関数とテストのみ。main、本番美咲、Supabase、Body Clock、アメふる、課金API呼び出しは不変更。legacy BLOCKED／Forget独立16試験NOT_RUNを維持。
