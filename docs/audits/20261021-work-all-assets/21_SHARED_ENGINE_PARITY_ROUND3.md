# 第3次精査：Shared Conversation Engine移行条件

2026-10-21。#87 daded504、#88 2ae90d7、main c88cf7f。実装しない、接続しない、Prompt短縮しない。

## 時点差の訂正

DOC-006の「builder未抽出」は当時の状態。現在#88には `base-prompt.ts` と `conversation-engine-base-prompt.test.ts` がある。今回、main inline templateとbuilder templateを3つの式名だけ対応付けて**リテラル全文一致**を静的確認した（25）。テスト本文もこの対応付けとmarker包含を検査している。これは全dynamic値の解決、型実行、全pipeline同等性の証明ではない。旧文書を消さず現HEADへの追補とする。

| 項目 | 現行main | 実験資産 #87/#88 | 不足/移行条件 | 必要な比較試験 |
|---|---|---|---|---|
| Prompt内容/順序 | chat inline persona→legacy conditional→Acting→pending→profile/life/time/signals/taxi→生活/天気/当日/直近/長期/JSON | base-prompt 20入力、literal同等。retry-guides/attempt分離 | snapshot resolver全入力、空/欠損の扱い、persona versionまで同一 | 複数golden snapshotで生成結果byte一致。work/rest、未知/既知、pending、日跨ぎ、recall |
| history | canonical user/misaki最大60→Gemini user/model、generatorが現在発言append | history sanitizer/mapping、attempt.userText | timestamps等の別消費を消さない。recallの20件重複は現挙動として先に固定 | 0/1/60/61、invalid role、現在発言一度、recall message全文 |
| 三層 | 現mainはMisaki人格/ユーザー文脈混在 | layered-context scope guard、layered-prompt新形式、character/relationship部品 | layered promptは既存templateと別形式。DB/cache/RPC scopeまでは保証しない | Misaki互換と別キャラnegativeを別gateで検証 |
| model呼出し | generateGeminiJson、固定model、JSON mime、option schema | attemptは入力生成のみ | 抽出で既存generatorを二重ラップしない | request body/model/config/signal/timeout一致、mock fetchのみ |
| JSON解析 | generatorのHTTP JSON→text→route parseGeminiText | base/attemptに解析・保存なし | JSON MIME指定≠schema全検証。parserも同じ契約へ | 空候補/不正JSON/余計なtext/非string reply/response body parse失敗 |
| validation | getReplyProblems→retry、cleanFinalReply、finalProblemsはwarn | helperに全validator pipelineなし | 理想のfail-closedへ勝手に変えるのはparity変更。現挙動と改修提案を別記 | 初回問題/再生成不正/最終警告/cleaningでの差分 |
| retry | generator transient [2s,5s]、Abort [2s]の別counter。route品質再生成と表現調整は別call | retry suffix/attempt純粋化 | 最大論理turnと物理attemptを混同しない。proxy再呼出し禁止 | 429→Abort→success、連続timeout、非retry HTTP、各attempt計測/上限 |
| error | 初回無reply時500/refund等、後段例外はroute契約 | core全面のerror mapper未完成 | 成功commit後のtransport失敗を新turnとして再生成しない | timeout/不正reply/commit失敗/receipt再送、HTTP statusとrefund比較 |
| Acting | canonical guide+pending、signalsからpreview、条件付きexpression生成 | relationship-contextとattempt suffix部品 | 初回parsed signals/memoryとexpression reply採用の分離保持 | signalsなし/あり、空expression、失敗、別れ/pending/未知status |
| 応答保存 | temporary or canonical complete、request/revision/lease、保存後worker | pure部品にwriterなし | auth/quota/commit/workerは外側一回。二重Engine実行で二重保存しない | auth0/1、quota0/1、canonical commit0/1、worker重複/replay |
| usage計測 | physical fetch毎sink、NULL≠0、best effort、normal/analyzer/critical分類 | 新しい計測器不要 | outer呼出しとinner sink二重発行を避ける | 物理attemptごと一件、HTTP200後DB失敗、sink timeoutで会話継続 |
| 認証/利用制限 | bearer user検証、root/usage消費、proxy一回委譲 | pure coreに含めない設計 | labからprod route/auth/usage/writerをimportしない。直/推移依存を監査 | 拒否ならmodel0/write0、quota拒否、異user/pair、静的import graph |

## 受入の順序

1. main snapshotを固定し既存挙動のoracleを別保存。Prompt・model・retry・validatorの改善はこの段階で混ぜない。
2. resolved snapshot→base/attempt入力とoutputsを比較。今回のliteral一致に加えdynamic contextの一致が必要。
3. mock transportで正常/全失敗/timeout/retry/conditional expressionを比較、call traceと副作用countを照合。
4. outer adapterのauth/quota/commitは既存を一回だけ呼ぶ。shadow比較で生成を二回呼んで課金・DB書込を増やす設計にしない。
5. parity受入後にのみ、別変更で短縮や三層化を比較する。今回実装・有料実験は行わない。

再利用候補はhistory/memory/context formatting/base prompt/retry guides/attempt/layer scopes。#87設計のpure snapshot境界は維持する。完成Engineの発見0件。すべてmain未接続の部品/設計として追跡する。
