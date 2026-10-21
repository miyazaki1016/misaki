# Memory開発史・設計判断台帳（第4次中間）
全overview版の全文精査が終わった開発史ではない。固定commit差分と現コード、今回全文のDOC-072等で確認した判断を保存する。日付はJSTを基本とし、文書見出しとGit日時の差を区別する。採用済み=GitHub mainのコードで存続を静的に確認、現在本番保証ではない。

| 判断ID/時点/根拠commit | 何を変更・構想したか | 確認できる理由 | 現在の採否・再利用・残件 |
|---|---|---|---|
| MH01 9/15 JST（Git 9/14 16:59Z）705057b63e0e059c5a3b94fceb87726ddde90b50 | natural-memory.ts。明示「覚えて」だけでなく安定情報を自然抽出、memoryは完全一覧、訂正/忘却、最大30、空出力で既存全消失を防ぐ | guide本文に本人の安定情報・重複統合・不確定なら追加しない意図。なぜ上限30かは不明 | main Blob bc77222bcf213f8ba0453368e882761b542add9eと当初版一致。最初の着想日やGit以前の構想は不明。Prompt方針だけでForget安全性は成立しない |
| MH02 9/18 661506b87c83033bb76eb8ec873bb1217f073584 | overview0.8にserver正本/localStorage表示cacheを明記 | 別端末でも同じ美咲、ブラウザ改変で親密度/記憶を変えないため。既存構造を整理し二重正本を避ける | main canonical-state/同期で存続。過去browser正本の方式へ戻さない |
| MH03 9/18 20276af77b984af07db229dbc8ef1022016e7c96、61569a9ba9808b79a32d5c29ee911a07266f07d8、DOC-072 | 正本history/memory/today、成功turn原子化、暗号temporary root、checkpoint/replayと現在root分離 | receiptだけでは編集・自発配送後の現在状態を表せない。正確な全期間旧値復元は不可能、サーバー記録の一度だけ移行という文書合意 | mainに中核存続。旧不変receiptで最新rootを巻戻さない。DB現在適用は未確認 |
| MH04 9/25 b2f4c0e5a6e139798c3778dfe8cd87a7eb7e8fc9 | [life:v1]構造化adapterを既存30枠内に追加。kind/fact/observedAt/validUntil/confidence/source | 期限切れを今と扱わず、固定profileと予定を分ける。narrow抽出は質問/第三者/不確実の昇格防止をコードcommentに明記 | main存続。確実性/訂正/完了statusは未実装。新規正本テーブルに移したとはしない |
| MH05 9/26 005000 migration / Relationship v2 | emotion/action旧triggerを廃止、関係signal由来の意味・trajectoryへ移行 | SQL commentが新pipelineによる二重適用回避を説明 | DOC-072の旧trigger維持は当時の仕様。Storyはsignalの意味集計でありShared Memoryとは異なる |
| MH06 10/7見出し（Git10/6 19:21Z）2c1cbaed1451d6c4e2e7a7affd1c087ed2cd35e8 | User/Shared/Relationship Memory分離。Shared独立領域、厳選、関連0–3件、全turn保存/自動圧縮しない | memory UI削除後もhistory→Recall/Profileで同事実再参照の余地。関係Episodeと「あのとき」のSharedは目的が違う | 設計合意。Shared table/検索/上限撤廃は未完成。固定30→100だけの改修案は不採用。消失防止・将来回収へ保全 |
| MH07 同見出し eb9ca4bec1a8a24afc58d4728f3c2bac3164bbf2 | 第1工事Forgetだけ。Soft/Hardの由来を分け、履歴全消去とはしない。Relationship semantics不変更 | Memory全体の一括工事を避け、復活防止を先行。古い履歴を再学習根拠にしない | #66未merge。履歴/関係state物理全削除は採用していない。28–30に下流未保証 |
| MH08 #66 HEAD84d147b / 10/7追補 | 確認付き再学習、released barrier保持、匿名checkpoint、原子保存、batch比較資産 | 単なる再提示で解除しない、両方式同じ誤りも検出、コスト計測は別 | scripted検証資産を保全。実Gemini意味精度・現在本番・全worker安全性は未認定 |
| MH09 10/10 #78 a849bec92059d326940ffc358635164ea7d391c9、certainty Blob bdb68e25bd6791208dd9a762e682c39fb1bb8b6a | tentative/confirmed/corrected/completed、人物×項目×期間、source/訂正関係。確実性を数値だけで昇格させない | 仮の予定/質問/伝聞/完了が現在の確定事項になるのを防ぐ | 未実装設計。Forgetと別責務。LifeFact拡張から段階化する案、旧文字列一括confirmedは禁止 |
| MH10 #67・19、基本構想10/21 | Relationship Identityは二人の自己認識、人物同一性ではない。Character共通とpair私的記憶を分離 | 同名別人と関係名を混ぜない、他user/characterの秘密混在を防ぐ | Identity/多キャラの全接続は未完成。今回#67版変遷は追加精読していない |

## 設計間の境界
- User Memory、Shared Memory、Relationship Memory、history、today_memoryは別の目的。Relationship Episodeを共有思い出へ自動コピーしない。
- 古い出来事を保持しつつ、機微事実の利用を失効させることは両立し得る。関係status/境界を忘却処理で勝手に解除しない。
- 現在の普通memoryのconfidence:1はMH09採用の証拠ではない。確実性/所有者/対象期間/利用権は独立に必要。
- 全overview版の全文/差分/理由の対応は未完。今回巨大overviewは該当節と固定commit差分の調査であり、新たな全文済み版に加算しない。
