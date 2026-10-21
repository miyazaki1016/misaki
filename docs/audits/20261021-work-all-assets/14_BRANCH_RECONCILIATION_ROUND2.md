# 第2次精査：ブランチと実行資産の接続

基準main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。旧44件のうち10件について、PR目的→後続変更→現在workflow→実行先コードを照合。**静的ソース上の目的の存続を解消した10/44、残34件。実行受入10件ではない。** 未実行/Preview未確認を保持。詳細ID/HEAD/merge SHAは17 JSONの旧台帳行を継承する。

## 10件の判定変更

main `.github/workflows/isolated-gemini-ab-manual.yml` Blob `edffcd3d81dffc084fb655a5014af901f33383a2` を通読。以下は全件このworkflowに限定した判定で、枝全体の全時代コードを本番機能として認定しない。

| ID | 枝 / PR | 現在も存在する目的 | 変更後分類 |
|---|---|---|---|
| BR-078 | work/ab-manual-workflow-only #68 | workflow_dispatchのみ、YES明示同意、key確認、実験checkout、persist-credentials:false | mainに同等機能が存在 |
| BR-074 | work/ab-20-pair-dispatch #69 | latencyの1/20回選択、論理2/40call | mainに同等機能が存在 |
| BR-077 | work/ab-long-fixture-dispatch #70 | short/long fixture選択 | mainに同等機能が存在 |
| BR-076 | work/ab-http-diagnostics-dispatch #71 | pinned latency runnerのHTTP/empty/JSON診断 | mainに同等機能が存在 |
| BR-079 | work/ab-paced-dispatch #72 | 0/10000ms間隔入力とpaced adapter | mainに同等機能が存在 |
| BR-081 | work/ab-quality-manual-workflow #73 | quality選択、4synthetic scenarioのA/B8call | mainに同等機能が存在 |
| BR-080 | work/ab-quality-diagnostics-workflow #74 | HTTPstatus/reply有無/期待値/禁止語のboolean診断 | mainに同等機能が存在 |
| BR-082 | work/ab-quality-reply-schema-dispatch #75 | JSON replyキーの明示schema | mainに同等機能が存在 |
| BR-075 | work/ab-blind-review-artifact-workflow #76 | blind responseと別keyをartifact、保存1日 | mainに同等機能が存在 |
| BR-087 | work/quality-long-history-workflow #77 | quality short/longと60message履歴、上記workflow同一Blob | main反映済み |

## 重要：mainのworkflow ≠ main内の実験実装

現workflowのcheckoutは固定commit `9a40d98c4ecec2f17eef1489a687acc1e24f338e`。そこから取得した `scripts/context-ab-live.ts` Blob `83e826d7651aa5b86ffc07b103fbf71a2b258de5` と `scripts/context-ab-quality-live.ts` Blob `198e58d82c40f0a7466f8fc1d9842a670a99056c` を通読した。qualityは直接fetch、retryなし、30秒timeout、明示live/key/model gate、schema/boolean診断、blind exportを保持。4case定義は `lib/context-ab-quality.ts` Blob `d44b3ef0ad6c25dd28a8971ddd5ce0b66b7e6895`、long拡張は `7af62404361f41309fb539745e25ed0e690b9632`。

compare APIでも旧pinから現pinがdescendantであることを確認。ただし祖先関係だけで目的存続を判定せず、上記コードを照合した。

追加で同pinのadapter Blob `9df871561fa3fb87fb17ab0d47ef8fe0ef49f474` とoffline harness `3a54b710057e83c5d68c15f9d773ac15a0e25700` を通読。latency側も1trial=1fetchでretryなし、明示allowLiveRequests、履歴+現在発言を一度ずつ送る。pair順はA/BとB/Aを交替する。一方quality側は固定A→Bであり順序biasに注意。latency値はbody parseまで含みDOC-017の本番計測と意味が違う。adapterのresponse.json失敗はcatchでhttpStatus:nullになり、非JSON HTTP応答のstatus保存まで保証しない。診断があることと完全な障害分類を区別する。

| 旧pin | 現pinまでahead/behind |
|---|---|
| c1a66ecc3d6e1c913311873e0f0096f23d1ecd02 | 11/0 |
| 02b9885772bc67fbdf0170e5284d63acdb264437 | 6/0 |
| f18b5ea58cc34f148d5bc08fc710f7a4606766a5 | 4/0 |
| c62cd88b72c81d4d85a40596f35d7dfe3db18091 | 3/0 |

別のmain workflow `.github/workflows/context-ab-live-manual.yml` Blob `a0629a27b36697524b94d5b04d774868da23a6ee` は **浮動枝 `work/context-no-duplicate-replies-ab`** をcheckoutする。「手動実行はこれだけ」というコメントは現存する複数workflowと一致しない。名称だけで不要枝と判断すると実行資産の参照を失う。削除/統合は行わない。固定commitもタグや保存方針を確認する前に到達可能性を失わせない。

これらは有料Geminiを呼べるworkflowだが、今回dispatchもAPI callもしていない。artifact保存1日は恒久証拠ではなく、blind keyは別ファイルなだけで暗号化/依頼者だけのアクセスを保証しない。synthetic合格は本番persona/長期記憶/人手品質の証明ではない。全import依存の将来実行可能性、現在key/model、実際のworkflow run/Preview受入は未確認。

## 予備照合したが解消数に含めない項目

- 初期匿名email保存→現main account/anonymous guardはサーバーroot検証へ強化。`app/chat/anonymous-session-guard.tsx` Blob `b8756ce6b0be5d45aaeb7172ceb0876b3b8601b6`、`lib/device-conversation.ts` `72247015ec7b6521ae461b1c468ee8cb6d44e97a`、account `2644e942ab9f52fe5429189d92b61069c86bf9db`。全早期PRの例外経路/現在受入は次回。
- recall #5/#6/#8: main `lib/chat-recall.ts` Blob `7728bdb25e72cd04cbbffed1e9e5de068d070b1c` とchat callsiteに履歴付きgroundingあり。診断prefixのフィルタが残るが、#7の診断応答機能自体の存続とは別。
- #3のwrapper再試行は現main `app/api/chat-proxy/route.ts` Blob `d1e9749fcb4d5b0e4e198d910c3214987f7280fe` で明示禁止。認証/usageを再実行する古いfixを復活させない。generator内部retryとは別。
- 旧Body Clock claim SQL Blob `a7bb06364807186eb42454f7df5982bf743a8b8b` がmainにあることは最終有効関数の証明ではない。不在だけでlonely/WAIT/PULLを作る旧定義と後続CREATE OR REPLACEの優先順を追う必要がある。DBへ接続/適用しない。
- 旧frontend proactive routes/photo helperはmainから消え、Edge decision/photoが存続。全旧tag仕様の後続置換を調べるまで残件に含める。
