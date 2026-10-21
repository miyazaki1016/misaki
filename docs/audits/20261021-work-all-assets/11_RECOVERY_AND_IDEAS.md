# 未反映成果の回収計画と、設計にしかないアイデア

基本構想: `MISAKI_SYSTEM_VISION_20261021.md` Blob `572f96e6a291133b4ca246825b262d0ebfbf9c93`。提案の保全資料であり、実装・merge・DB変更の許可ではない。

## 設計だけにある重要資産

| ID | アイデア・根拠 | 現行mainとの照合と判断 | 競合・必要な試験 |
|---|---|---|---|
| IDEA01 | 記憶のtentative/confirmed/corrected/completed、人物×項目×対象期間、訂正provenance。`docs/memory-certainty-design.md` Blob `bdb68e25bd6791208dd9a762e682c39fb1bb8b6a`、#78枝 | 設計全文の中心仕様・追記を精査。mainのlife contextはconfidence/validUntil中心で、これらの明示状態契約と同じとは言えない。**未反映の設計候補**。 | Forget v1と責務を分け、古い記憶をconfirmedへ暗黙昇格しない。質問/伝聞/第三者/否定/取消/完了/日付境界/同名別人物、匿名→メール、Body Clockで同じ選択規則を試験。 |
| IDEA02 | Stageは深さ、5軸は方向、statusは成立事実。Stage0へ戻すのはfull reset、通常低下は既存関係ならfloor1。5-heartはread-only。`RELATIONSHIP_ENGINE_V1_2_WORK_HANDOFF.md` Blob `fd723767780d0e293c6dd71c1ac9ea929e856aa1`、#60 | 設計書を通読。mainで `resolveRelationshipStage` / `relationship_established_at` は見つからず、canonical actingは旧points由来stageを利用。**設計候補であり完成機能ではない**。文字列不存在だけで別名実装全否定はしない。 | 恋人=Stage5、課金/回数/日数=成長にしない。canonical過去turnの根拠、cross-user/same/future request拒否、import、エラー時Stage0点滅禁止。古い「3日実地確認後開始」の前提は受入証拠照合まで保留。 |
| IDEA03 | recent Momentumを長期5軸と分離し、成長実感を係数水増しで作らない。`RELATIONSHIP_FIVE_AXIS_GROWTH_PACE_20261015.md` Blob `e24294eea86a52c1b95796fa75c4fef0dd68aa73`、#85 | 単一typeで毎日適格Episodeという限定の3日/点計算。20/50/80に60/150/240日という表は全システムの絶対最短ではない。**設計・調査候補**。 | 複数type並行Pattern・認定なし・反復宣言key固定を区別。実分布未測定のまま加点係数を上げない。 |
| IDEA04 | 通常chat/Body Clockが同じcanonical Acting DTOを使う。source=permanent/temporary_verified、import/critical pendingを保護。`RELATIONSHIP_ACTING_DTO_CANONICAL_CONTRACT_20261015.md` Blob `73807f2cc4c73663212fa5382e32ad7ccf00c706`、#85 | main Body Clockの読取りはintimacy/emotion/action等。5軸/statusの通常chatとの共有契約は未完成。**未反映の設計候補**。 | score/status厳格検証、期限切れroot、古いActingStateの上書き、pending中の恋人断定禁止、relationship-only競合、同じ文面/写真前提。DTO追加だけで原子的配送安全とはしない。 |
| IDEA05 | 共通engineはpure snapshot→prompt/model/validate/expression。auth/quota/DB/commitを外側へ。`SHARED_CONVERSATION_ENGINE_DESIGN_20261015.md` Blob `7aed7ef22ef3025fa18e8b00561ebc2d77498bf1`、#87 | 設計を通読。#88には部品があるが全pipeline parityはない。**設計候補＋未完成実装部品**。 | byte parity、JSON/validation/conditional expression/retryの同等性、physical attempts予算、import graphでlabからwriter遮断。 |
| IDEA06 | 三層prompt: 共通安全・Character人格/生活・User×Character関係/記憶。`CONVERSATION_ENGINE_MULTICHARACTER_GAP_AUDIT_20261016.md` Blob `54c033dcf3549ed789175f59d966d34efcf2af0f`、#88 | layered builderは連結とscope guard。DB分離、weather/time、output schema、retry、commitまで完成したと扱わない。**未完成・要修正**。 | 別キャラに美咲の職業/休み/秘密が混ざらないnegative fixture。検索/保存/cache/import/削除/RPCのpair scopeは別途必要。 |
| IDEA07 | 既存 `relationship_state_version` を配送確定に再利用する案、欠損status=unknownをnoneと区別。既存version/import/prewiring監査3文書 | versionを新設する前に既存主要3writerの増分を活用できる。DTOの独立試験は `tests/relationship-acting-dto-contract-experiment.test.ts` Blob `7bcaf57300fd89e8d4d90809adb1e3b37b5bab75` 内のローカル関数で、runtimeモジュールとして完成したわけではない。 | 全writer、ロック順序、delivery同一transaction、旧signature、Node/Deno互換を検証。欠損時に交際を創作せず、既存交際を未成立とも断定しない。 |

## #31資産の分解：全部未反映でも全部採用でもない

対象 `sora/relationship-time-v2-design` HEAD `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64` / PR #31。

| 資産 | ソースで確認したこと | 回収判断 |
|---|---|---|
| emotion/action reducers、signal、life context | mainと同一Blobの部品あり（前回code-differences索引）。 | 同じ部品の再実装不要。現行依存・gateは別確認。 |
| relationshipStoryの傷→修復途中→実績/反復傷 | main `relationship-patterns.ts` Blob `51b44844a89adc1c17f7df774b3cfbe56d21b712` にderiveRelationshipStoryとloadRelationshipHistory、`relationship-turn-expression.ts` Blob `d7b2b66e987a67168adac0b922e7f9eaf146e77b`にstory演技guide。chatでload/使用。 | **mainに同等の中核あり**。#31の専用試験ファイルがmainにないだけでstory全体を未実装としない。 |
| urge: due時刻≠送信命令、WAIT/PULL/傷なら送らない | 枝 `proactive-urge.ts` Blob `c07e24bc0c3416a760ab30f14ce3b644e27af664`。shouldSend=falseを含みstory/grounded concernを参照。main `proactive-decision.ts`はshouldSend:true型で旧claim後の方向/タグを構築。 | **未反映候補、採用前修正・統合設計が必要**。mainのDB claim等にも抑止があり得るため全通知が無条件送信とは断定しない。 |
| motive: 自分/相手/二人の話題源、freshness、根拠と現在事実の区別 | 枝 `proactive-motive.ts` Blob `7f6001e76c4e99126e64b2bdba661c0b9121036c` を精査。recent conversation/eventから動機を作り、最後はmemoryからも取得。 | **未反映候補・現visionとの調整必須**。関数入力にplan・同意・Forget policyがなく、そのまま使うとFreeの記憶由来自発話題禁止を満たさない。呼出し前の同意/plan/forget選別が必要。 |
| Body Clockのstory/写真/urgeの一貫性 | mainのstory中核存在と、Body Clockへの未接続候補を分ける。 | 一括移植せず、chat/通知/写真で同じstatus/boundaryを使う契約を先に検証。 |

## 回収する場合の順序と条件

| 順序 | 対象 | なぜ必要か／既存との衝突 | 必須の検証 |
|---|---|---|---|
| 0 | legacy安全性記録と全資産台帳 | 他成果の採用許可とは切り離して保全。legacyはBLOCKEDのまま。 | 10の対応表・未guard/pre-gate残件を保持。 |
| 1 | Forget #66・Identity #67の境界設計 | main保存/解析/演技に跨る。DB適用主張とmainアプリ未反映を混ぜない。 | replay/rollback/匿名import/旧履歴復活/lease、複数session。現在DB再適用なし。 |
| 2 | IDEA01のpure parser/selector設計、#83と#86の評価資産 | 記憶の正確性と品質基準線を先にする。新しい並列Memory Engineを作らない。 | 人物/日付/否定/訂正、合成と実記録のprovenanceを区別。 |
| 3 | #87/#88のparityを満たす最小抽出案 | cost・acting比較の共通入力が必要。prompt変更と抽出を同時にしない。 | byte/role順序、no duplicate current message、retry/validation/expression。 |
| 4 | 既存telemetryの活用と重複除去候補 | 計測はmainにある。品質を落とす短縮を避ける。 | canonical成功turn単位のphysical attempts/NULL欠落、反復/否定/約束/人格の非劣化。 |
| 5 | #85段階Acting、IDEA02/03 | 係数水増しや攻略ゲージ化を防ぐ。既存status/intimacyガード保持。 | 非恋愛親友、高romance未交際、別れ/修復、反復Evidence、長期連続性。 |
| 6 | #31 urge/motiveとIDEA04のBody Clock統合案 | 自発性を保存しつつ新Free/Premium方針に合わせる。 | plan/同意/forget/quiet hours、status-only競合、写真整合、何もしない判断。 |
| 7 | Character/User/Pair拡張・婚姻排他 | まず美咲一人の完成。将来の所有境界だけ先に壊さない。 | 他ユーザー/他キャラ秘密、原子的排他、離婚/再婚、削除/import/cache。 |

どの順序も実装承認ではない。ブランチ削除・統合・main取り込みはユーザーが判断する。過去設計は廃棄せず、旧前提と現在の採否を分けて残す。
