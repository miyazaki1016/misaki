# 第5次静的棚卸しの到達点と第6次引き継ぎ

2026-10-21 JST。起点 `57be547b532e57fa1574e93e61df28f91d5deb7c`。**原85文書版の全文・意味精査と、旧44枝の証拠不足についての静的資産分類を完了。全開発資産監査は未完了。** 機能受入・現在の本番適用・安全性検証の完了を宣言しない。

## 最新の数と証拠強度

| 項目 | 今回 | 最新状態 |
|---|---|---|
| 原文書版 | 19版 | **85/85版、未精査0**。既読/部分閲覧の重複加算なし |
| 旧証拠不足枝 | BR-008の1件 | **44/44件を静的分類、証拠不足0**。全92枝の追跡行を保持 |
| 原PR・Preview | 新規受入0 | 原88PRと取得済Preview証拠を継承。全現在runtime/受入再検証ではない |
| 設計思想 | IDEA16追加 | **累計16件**、旧01〜15保持 |
| 重点未反映成果群 | 7群を保持 | 新たな本番検証済み認定0 |
| Forget独立試験 | 実行0 | **16件すべてNOT_RUN**、独立oracleは計画のまま |
| BLOCKED | 解除0 | **legacy1件継続**。他の未受入/保留はこの1件とは別 |

既存資料01〜69、README、分類JSON、原証拠の81pathを不変保持し、70〜76のみ追加。main・本番Misaki・Supabase・アメふる変更0。DB接続、migration、PR merge、枝削除、deploy、モデルAPI/課金実行、機能実装、安全性回避0。資料ファイルのhash/coverage検査だけを実行し、製品試験とは数えない。

## 必ず引き継ぐ安全性契約

38〜45と58を採用前の設計契約として継承。読取/実行leaseは内容利用権ではない。T0読取後T1 Forget→T2完了→T3保存/採用→T4再提示の各境界を分離する。source・owner/scope・用途・Forget世代・Processing Version・Relationship State Version・temporary revision・lease/token・receipt世代を代用し合わない。

失効sourceに依存しないと証明できる結果は現権限で再評価できる案を残す。具体情報や秘密を再推論できる理由/quote/metadataは保留・利用停止・安全sourceから再計算を検討。物理削除は別契約。既存抽象信頼や成立済statusをForgetだけで巻戻さず、全trait/人格の一律消去も前提にしない。

58の派生19種類は、Relationship Evidence / Episode / Pattern / Story / State / Status、Persona Traits / Evolution / Evolution Candidate / Approval、Life Facts、Memory Summary、Body Clock Context、Proactive Message、Photo Context、Notification Payload、Completed Receipt、Retry Journal、Browser Cache。**保持/再評価/利用停止/再計算/物理削除/判断保留は設計候補**で、実装済み分類とはしない。

## 16試験はすべて未実施

59の手順・初期fixture・独立oracle・DB/画面観測・retry/失敗条件・隔離環境をそのまま参照する。76はID/状態を68から完全一致で継承。

| 群 | ID | 第6次に観測する主境界 | 状態 |
|---|---|---|---|
| Worker | W-A/B/C/D/E | 解析中、保存済候補、採用済state/Story、journal再開、新旧lease競合 | 全NOT_RUN |
| Persona | P-A/B | candidate reason/evidence/list/approve、確定traitとglobal成長のscope | 全NOT_RUN |
| Body Clock/写真 | B-A/B | 生成後finish、本文/写真の同一認可snapshot | 全NOT_RUN |
| 通知 | N-A/B/C | finish→relay→外部handoff→open、同意・plan変更 | 全NOT_RUN |
| UI/receipt | U-A/B | mixed snapshot GET、遅着HTTP/receipt、cache復元 | 全NOT_RUN |
| 匿名 | A-A | root/checkpoint/importの世代とowner、retry | NOT_RUN |
| oracle | O-A | 同名別人/再学習/訂正/無関係保持、両方式が同じ誤りを出すfixture | NOT_RUN |

最初にoracle自体を独立に審査する。両armの一致だけで合格にせず、秘密の言換え・理由からの復元と、無関係情報/関係statusの過剰消去を両方検出する。実装案をfakeで先に満たした試験を現コードのPASSにしない。モデルfake/合成owner/ローカルDBとブラウザーmockで再現できる範囲から計画する。今回は試験コードも実装していない。

## 第6次の調査・受入ゲート

| 領域 | 静的に分かったこと | 未確認・次の判断材料 |
|---|---|---|
| Relationship worker | canonical後分析、retry stage、lease-fenced RPC、Pattern once-onlyの足場あり | Forget source権限を保存/採用と同じ直列化境界で検査する契約。旧journal/candidate/Story再提示。16試験と現在最終RPCを照合 |
| Persona | 私的traitsとglobal modulesは別経路。candidate reason/quoteも派生内容 | candidate/review RPC本体・ACLの完全なGit由来が不足。承認時とtrait利用時の権限、共通成長への抽象化/共有許可、IDEA16との整合を設計 |
| Body Clock/通知/写真 | 現mainにcanonical revision/updated_at、claim/cadence/lease、既存タグと写真。Time枝のurge/motive/no-actionは残存差 | 関係versionだけでも全Emotion/Action/Forget/planを覆えない。finish/relay/openの再検証、外部handoff後の撤回限界、本文と写真の世代を評価 |
| DB/RPC | Git上の最終定義・旧signature・callerの根拠は31/40/41/60/66を継承。UUID復元SQLはmainに存在 | 現本番適用を今回確認していない。legacy baseline欠落/同timestamp、trigger/RLS/ACL、multi-session、rollbackは別受入。migration実行や本番照会へ自動的に進まない |
| Identity | #67の実装/テストとPreview lover→次turn受入の当時記録を保持 | anonymous v3 import直後/次chat、constraint/re-entry、同時source更新/二重apply、rollback。Production gate ON/再適用/mergeなし |
| Time/Stage/多キャラ | main存続部品と旧枝独自成果を分離。Character/User/Pair、home/current、disclosureを保全 | 旧Edgeの丸移植を避け、source/権限/今話す理由とDB claimを整合。Stageは新ポイント正本にしない。婚姻排他は設計方針で未実装 |
| legacy | FOR SHAREと2反例のPG17/18fixture局所回帰の過去根拠あり | 全write surface、definer/auth trigger、pre-gate/drain/運用証明、現在canonical互換は不足。**BLOCKED維持** |

## 開発再開の判断材料

ユーザーの優先順は、棚卸し→冒頭再評価→Gemini軽量化→複数キャラ基盤→美咲一人の成長。今回前二者の文書・静的分類を進めたが、全本番受入が完了した意味ではない。

次に提案できる最小単位は、**許可された合成snapshotでのprompt構成量・物理call計測設計とオフライン品質比較計画**。DB有効moduleや実会話を無断取得せず、文字数とtoken/実費を分け、fallback/DB persona、validation、retry、expressionを同じ条件で比較する。現在確認したTime guideの重複候補を起点に、人格・根拠・status/境界・Forgetを失わない変更案を作る。今回の承認は調査・文書化のみで、この資料が製品変更の承認を追加することはない。

安全性試験の設計/隔離準備とコスト調査は並行候補。Forget全研究が終わるまで全てを無期限停止する提案ではない。一方、失効情報を扱う新writer/採用/配送に進む場合は、該当安全性契約と独立試験を実装レビューの条件へ含める。実モデル課金、実装、Previewの本番DB書込、main/DB/merge/deployは別判断。

7重点群は65/72を引継ぎ、未反映の設計・部品・テスト・失敗知見を保存。main外workflow参照commit/実験枝とQ02使用済markerは変更しない。新しい未反映成果の重複登録はせず、IDEA16だけを思想として追加した。

## 次のチャットの読み順と保存物

SYSTEM_VISION→**73→76**→70〜72→74/75→38〜45/58/59→必要な旧追補。原総覧/原台帳を上書きせず、72の訂正履歴と76を適用する。

- [70 残19文書版の全文・意味精査](70_REMAINING_DOCUMENTS_FULL_REVIEW_ROUND5.md)
- [71 BR-008と監査資産の棚卸し](71_AUDIT_BRANCH_SELF_INVENTORY_ROUND5.md)
- [72 冒頭再評価・変更履歴・IDEA16](72_DESIGN_HISTORY_REEVALUATION_ROUND5.md)
- 73 本引継ぎ
- [74 全文coverage・原本ID・固定source索引](74_FINAL_SOURCE_COVERAGE_ROUND5.json)
- [75 原文・全差分・固定証拠](75_FINAL_FIXED_EVIDENCE_ROUND5.zip)
- [76 最新累計台帳](76_ROUND5_FINAL_INVENTORY_LEDGER.json)

今回の保存コミットSHAは生成後の報告を参照。以後のBR-008 HEADは新しい資料保存で動くため、履歴上の対象snapshotと混同しない。
