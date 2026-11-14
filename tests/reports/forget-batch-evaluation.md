# Forget batch比較検証 — 2026-10-07 JST

検証専用実装。通常chat/Body Clock/personaの呼出経路、共通Forget policy、Relationship Engine、DB schema、再学習条件、atomic commitは変更していない。cacheも導入していない。PR #66はDraft・merge/Production適用なし。

## 実行方法と測定

```
node --experimental-strip-types tests/forget-batch-evaluate.ts
node --experimental-strip-types tests/forget-batch-evaluate.ts --live
```

通常実行は既存scripted semantic portとbatchの独立した期待応答portを使い、実行結果を `forget-batch-scripted.json` に保存する。`--live` は既存環境のGEMINI_API_KEYがある場合だけ両方をGeminiへ送り、`forget-batch-live.json` に保存する。秘密鍵の自動取得は行わない。今回キー未設定のためliveは未実行。

各シナリオ/armにcall数、inputTokens、outputTokens、latencyMsとcallごとの観測を保存する。live時のinputTokensは実usageMetadata.promptTokenCount、outputTokensはcandidatesTokenCount。思考tokenや請求額を推測して加算しない。latencyMsはresolver fetch所要時間の合計で、通常reply生成を含むchat全体の壁時計時間ではない。今回tokens/latencyはすべてnull（未測定）。scripted portのCPU実行時間をGemini latencyとは扱わない。

現行armは変更していないprepareForgetTurn/maskForgetRowsを実行。batch armのreoffer/target抽出も同じprepareForgetTurnを使い、独立callを維持。両armで同一fixture・control・日時・ユーザーturnを使う。固定ackは同じ実コードの結果を使い、モデルreply検証の対象とはしない。Soft Forget以外のfixtureも生成memory/today/replyまで比較するが、DBへのcommitは行わない（原子性の既存PGliteテストは別途全回帰に含む）。

## Batchの構造的保護

- 入力history/memory/Today Memory/traitを1 batch、生成memory/Today Memory/final replyを別batchとして判定する。
- 各row IDはfixtureの不変IDとbundle名の組合せ。並び替えでIDは変わらない。全送信IDの回答が必須で、barrierなしのrowも欠落を許さない。
- barrier/provenanceは現行maskForgetRowsへ検証用捕捉judgeを渡して取得する。モデルに対象選択やrelease時刻選択を委ねず、独自のbarrier計算を複製しない。
- 各rowにsource、対象集合、linkedTargets、出所を渡す。回答はid/spans/uncertainだけを許可し、barrier/provenanceの上書きや自由な書き換えtextは拒否。
- 欠落/重複/未知ID、不正span、parse失敗、曖昧判定、型不正をfail closed。spanは元のrowの一意な部分文字列に限定。barrierなしrowへのmaskは禁止。
- memory/todayは現行と同じspan削除を行い、replyは変更が必要なら出力全体を拒否する。モデルが書いた「安全な文章」への置換はしない。

この検証はbatch応答プロトコルと制御を確認するもので、モデルのfalse negativeを機械的に全検出できるという証明ではない。

## 20シナリオの結果

以下のcall数はscripted portの実呼出数。通常reply生成・Relationship workerは含まない。各fixtureの全raw結果、期待結果、エラー、call観測はJSONに保存した。

| シナリオ | 現行 | batch | 仕様期待との比較 |
|---|---:|---:|---|
| 同名人物 | 8 | 3 | 両方一致 |
| 部分一致（弟の隆紀郎） | 8 | 3 | batch側だけ一致 |
| 人物と関係性/職業の混在 | 8 | 3 | batch側だけ一致 |
| 現在turnの健太と旧historyの隆紀 | 7 | 3 | 両方一致、確認待ち |
| Soft Forget | 7 | 3 | 両方一致 |
| Hard Delete | 8 | 3 | 両方一致 |
| release後の旧historyと新history/旧trait | 4 | 2 | 両方一致 |
| 未来誤時刻の旧history fingerprint | 4 | 2 | 両方一致 |
| 再提示・確認質問 | 7 | 3 | 両方一致、active維持 |
| 確認肯定 | 5 | 3 | 両方一致、現在の肯定でrelease |
| 訂正 | 7 | 3 | 両方一致、旧値を遮断 |
| 複数Forget対象 | 8 | 3 | 両方一致 |
| active/released混在 | 9 | 3 | 両方一致 |
| Today Memory | 8 | 3 | 両方一致 |
| persona trait | 8 | 3 | 両方一致 |
| 曖昧な人物表現 | 2 | 2 | 両方入力拒否 |
| 名前だけの曖昧な再提示 | 8 | 3 | 両方一致、確認/releaseなし |
| final replyからの自発復活 | 8 | 3 | 両方出力拒否 |
| batchだけへの人工false negative | 8 | 3 | 現行側だけ一致 |
| 両方への人工false negative | 8 | 3 | 両方同じ誤り |

全シナリオのinput tokens/output tokens/Gemini latencyは**未測定**。

## 不一致の全分類

1. **部分一致**: 現行側の既存scripted portは「弟の隆紀郎」の「弟の隆紀」までを対象と誤認する。独立に定義した期待結果は無関係な別名を保持するためbatch側が仕様上妥当。これは既存test doubleのregexの誤判定であり、実Gemini/現行policyの誤判定を観測したものではない。
2. **人物と関係性の混在**: person-scopeの「弟の隆紀は教師。猫が好き」に対し、既存scripted portは名前部分しか除外しない。期待結果は弟の事実節全体を除外して猫の嗜好を保持するためbatch側が仕様上妥当。これもscripted portの不足で、実モデルの優劣を証明しない。
3. **batchだけの人工漏れ**: batchに旧historyの見逃しを意図的に注入。現行側だけが期待結果に一致することを分類できた。

別途、両方へ同じ旧history見逃しを注入したケースは「両者一致、両方誤り」に分類した。現行を正解扱いした比較では検出できないケースである。

実モデル実行時は全不一致をhuman_review_requiredにする。期待結果との機械的一致だけでbatchの正しさを確定せず、別の安全なspanや表記差も含め人間レビューが必要。人工故障2件はlive実行対象から除く。

## 結論と残件

検証基盤とfail-closedプロトコルは実装済。**実Geminiの意味判定同等性・batch化単体の意味判定安全性は未証明**。batch portは手で定義した期待応答を返すため、それが期待結果へ一致すること自体はsemantic proofではない。実Gemini両arm比較、全不一致の人間レビュー、token/latency実測が必要。本番3-call化・cache導入へ進まない。

検証専用テスト23/23成功、UTC/JST各full suite 284/284成功（fail/skip 0）。検証用TypeScriptの独立型検査と既存project型検査は成功。application/DDLは変更していないためproduction buildの再実行は行っていない。
