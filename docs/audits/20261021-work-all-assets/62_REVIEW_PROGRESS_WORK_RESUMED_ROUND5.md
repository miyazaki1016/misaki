# 第5次再開：最新進捗・次回引継ぎ（監査未完了）

2026-10-21 JST。起点 `52c53fec066323e75cd15ddf5495f6f3ed6d442a`。第4次保存 `2e66367dce1887d3e6d2f944ab1405ae44148372` が祖先であることを確認。起点はその18commit後。38〜55を読み、Forget契約・文書54/85版・証拠不足30枝を引き継いだ。固定mainは `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` のまま。

## 今回の集計

| 項目 | 今回再開分 | 累計・残件 |
|---|---|---|
| 原文書の新規全文精査 | 6版：DOC-004/012/020/032/082/083 | 60/85版。残25版。第5次全体はソラ追補14版＋今回6版＝20版 |
| 証拠不足枝の静的分類 | 6件：BR-007/014/015/025/028/031 | 旧44件中20件静的分類、証拠不足24件。動作受入ではない |
| 設計思想 | 新番号0 | IDEA01〜13を保持。利用権のsource別再評価、抽象状態の継続条件はIDEA11〜13の具体化 |
| 本番検証済みの新成果 | 0 | 重点7群の認定追加なし |
| BLOCKED | 解除0 | legacy1件を継続 |

## Forget競合で確認済み／未確認

39〜44の固定ソース事実を引き継ぐ。workerはcanonical event、failed journal、保存済みEvidenceから再開し、lease/processing versionとForget利用権は別。#66 SQLは会話control保存を原子化するが、Relationship writerを自動でForget対応へ置換しない。candidate reason/evidence、確定済みdelivery、遅着HTTP/画面採用が個別の境界。これらは**再現済み漏洩の認定ではない**。

58では派生19種の所有・元source・失効・保持・安全な再計算・不明時保留を設計候補として列挙した。具体的出来事・再推論可能な私的詳細を利用停止しつつ、独立した関係status/拒絶/非機微な人格・信頼を一律resetしない。全世代差を無条件破棄とせず、用途と依存sourceが無関係なら再評価を可能にする案。現在の実装済み仕様ではない。

59にはworker A〜E、候補生成→承認、既存traitsと共有境界、生成/写真/finish/relay/外部handoff、同意・plan、遅着UI/replay、匿名import、両方式の共通誤りを検出する独立oracleを含む16試験を記載。全NOT_RUN。初期状態・介入順・期待／禁止・DB/HTTP/UI/通知観測・retry・失敗安全性・隔離環境を定義した。未実施を合格扱いしない。

## Relationship・Persona・Body Clockの未解決

- Relationship：全source依存と失効範囲、stage間の原子性、leaseとは別の採用認可、既存抽象stateの再推論基準、匿名import。成立済みstatusをForgetだけで巻き戻さない。
- Persona：candidate理由/quoteの一覧・保存・承認、確定Traitの保持条件、review RPCの現DB本文と直接writer、Character共通成長とPair私的経験の分離。共通cacheが私的traitを漏らしたと今回認定していない。
- Body Clock：root revision/updated_atとcontrol変更の全writer対応、写真と本文の同一認可snapshot、finish後relay、同意撤回・plan変更と送信の線形化。外部通知を必ず回収できる保証はしない。
- Browser：history APIの複数query snapshot、同owner/historyでMemoryのみ失効、usage await後、初期load、古いcompleted HTTP、offline/多端末の制御限界。

## DB/RPCの今回範囲

GitHub SQLの静的照合のみ。旧 `sync_user_conversation_state` のdelta重複抑止→9/18 canonical成功turn＋旧RPC authenticated権限撤去→9/26同署名のsemantic deltaを追跡した。request/event冪等性、auth row lock後の再確認、root競合と保存原子性の足場を確認。旧v1の関数本文だけを現仕様にしない。#66との比較、全最終signature/trigger/ACL/RLS/復元SQL、本番適用状況の未確認は31/41を継承。

Supabaseへの接続・SQL実行・migrationは0。現在本番DBを検証したとは言わない。SQL上のREVOKEがあることと、現在の全role/overloadの実効権限は別。

## 未反映7成果群・保護資産

Forget #66、Relationship Identity #67、Memory Certainty、Conversation Lab #86、Shared Engine設計 #87、Shared Engine部品 #88、Relationship Timeを継続保全。56でLab/readinessの後続v2 route、合成14call handlerの所在と制限を追加したが、実行・受入・採用とはしない。14callはPOST内のローカル上限で、再POST込みの一回限り保証ではない。過去の承認文を今回の課金承認にしない。

legacy `codex/legacy-maintenance-drain` はBLOCKED。CIだけでは解除不可。18/23/48のmain外workflow参照資産は変更・削除・統合せず保持。main/本番Misaki/本番Supabase/アメふるの変更、PR merge、枝削除、deploy、課金Gemini、機能実装は0。

## 次回

1. **61のpending_documents25版を使う**。巨大overviewは残20版。未精査IDはDOC-019/021/022/023/024/026/027/028/029/030/031/033/034/035/037/038/039/040/041/042。全文＋親版差分＋対応sourceを区切って進める。部分参照を全文加算しない。
2. その他pending5版はDOC-001/002/003/015/052。DOC-002はMisaki内の連携引継ぎ資料で、アメふる変更の許可ではない。棚卸し途中の資料と最終全取得の報告は時点を区別する。
3. **61のpending_branches24件**。匿名session/email/cache、history保持、claim、action tags、診断/timeout/計測の全変更pathと後続置換を優先。mainのmerge履歴だけで現機能を合格にしない。
4. Forget契約は38〜45→58→59を読む。設計提案を承認済み実装としない。世代真正性、全writer、DBと外部handoffの原子性・制御限界が残件。DB/モデルの試験は今回範囲外のまま。
5. 文書54のMemory certaintyとBody Clock送信直前の確度も保持。利用権が有効でも不確定予定を確定に昇格しない。

## 保存ファイル

- 56：今回6版の全文・差分・設計理由・source対応・main採否。
- 57：今回6枝の全変更pathと後続置換、静的分類の限定。
- 58：派生19種の失効／保持契約案。
- 59：独立oracle付き16試験、全NOT_RUN。
- 60：固定原本文・追加source・PR patch・全枝差分・旧01〜55のBlob一覧。
- 61：55までの台帳を継承した差分、未精査25版・証拠不足24枝。
- 62：本引継ぎ。README冒頭へ最新案内を追加。

01〜55、旧分類JSON、evidence.zip、固定ソース証拠を保持。今回の保存SHAはcommit作成後に報告する（commit自身へ自己SHAを埋めない）。全資産・全SQL・動作受入・本番状態の監査は未完了。
