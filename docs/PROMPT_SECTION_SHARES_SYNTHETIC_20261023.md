# Gemini入力の区分別割合：合成データ比較（2026-10-23）

## 実施範囲
`lib/conversation-engine/prompt-share-audit.mjs` と `tests/prompt-share-audit.test.mjs` を隔離実験枝に追加した。人格・関係・記憶・過去履歴・外部情報・固定文言を**合成文字列**で独立計測する。Node標準テストで6ケースPASSをローカル作業環境で確認した。GitHub checkoutおよびCI実行は未確認。実際の美咲のデータは読み込まず、Gemini/DB/ネットワークを呼ばない。

## 合成fixtureの比較結果（絶対に実績値ではない）
| 履歴の合成件数 | 全体UTF-8 bytes | 履歴の比率 | 外部情報の比率 |
| ---: | ---: | ---: | ---: |
| 2 | 386 | 26.68% | 20.98% |
| 12 | 909 | 68.87% | 8.91% |
| 60 | 3453 | 91.80% | 2.35% |

全行とも固定文言/人格/関係/記憶/外部情報は同じ短い**架空のサンプル**。実際の美咲は固定プロンプトがはるかに大きく、記憶/各message長も変動する。上表の割合を本番送信量に一般化しない。

## 分かったことと限界
- どの区分の長さが増えると割合がどう変わるかを測れる土台を作った。
- 外部情報のみselect解除してもpersona/relationship/memory/history/scaffoldのbyte数は不変であることをテストした。
- 区分名重複、不正な区分、selected省略をエラーにする。
- `actualGeminiTokens=null`, `actualApiCost=null`, `productionParityEstablished=false` を明示。
- **未達**：実際のrouteで組み上がったpromptの区分別計測・byte parity・Gemini実トークンと料金・品質評価・CI確認。

## 次に調べること
実コードの完全なV0レンダリングと対応した合成fixtureを作り、30/60件の長さだけでなく1件の長文・記憶増加・0件イベント・recall質問の追加20件・再試行の差を別々に測る。実ユーザーの機微情報をログ保存せず、Forgetやプロンプトの安全ルールを削除しない。本番変更には別の安全検証が必要。

main、本番美咲、Supabase、アメふるは変更していない。
