# 回収・設計思想・安全性の第2次追補

前提: 11の履歴と判断を保全する。本資料は提案で、実装/本番適用の承認ではない。全判断はmain `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` の静的照合と取得済み証拠に限定。

## 重点7成果群の回収条件

| 成果 | 判定と現main | 競合・修正 | 必須試験/順序 |
|---|---|---|---|
| Forget #66 | 回収候補/要修正。mainのRootState/route接続なし。枝HEAD `84d147ba5b46698d3b46fb727a9859f87f79f3d2`。batch評価は今回DOC-085で精査 | 現canonical保存/解析/匿名import/再提示と一体で選別。batchを本体より先に接続しない | 最優先の境界仕様確認→独立oracle→保存/検索/生成/再提示の横断試験。span曖昧時拒否、旧履歴復活、複数session/replay |
| Identity #67 | 回収候補/要修正。main resolver/gate未反映。枝 `9cbe2146d4a9ad09edd16100c27d950e95a8bcc4` | PRのDB適用済み/gate offは当時の報告。再適用しない。人物境界、Memory/Relationship status権限と競合させない | Forget・確実性契約と依存。訂正/同名/第三者/匿名import/撤回/別ユーザー混入。現DBは未確認 |
| Memory関連 #78 | 回収候補の設計。certainty/correctionはlife-context confidenceだけで代替されていない | Memory v1の進化にし、別engineを作らない。古い推測をconfirmedへ昇格しない | pure selector→訂正/主体/期間/完了→共通読取境界。総覧各版のMemory v1詳細は残件 |
| Conversation Lab #86 | 回収候補/要修正。offline比較資産。本番経路完成と扱わない | mock/fixture合格≠live品質。import経由のwriter排除、oracle独立性、persona parity | engine抽出前の基準線、blind人手評価、両側誤り注入、negative fixture |
| Shared Engine設計 #87 | 回収候補。pure snapshot/coreの設計、main全面共通化なし | auth/quota/commitは外側。prompt変更と抽出を同時にしない | 先にbyte/role/order/validation/retry/expression parity。正常/再試行/失敗を比較 |
| Shared Engine部品 #88 | 要修正/回収候補。layered prompt等があるが全pipeline parityなし | 連結guard≠DB pair隔離。美咲専用知識/生活と共通安全を分ける | single-Misakiを完成、将来のCharacter/User/Pair所有境界は保持。秘密混入/Node-Deno/physical attempts |
| Relationship Time #31 | 混在。storyと一部reducersはmain同等中核。urge/motiveは回収候補/要修正 | 枝 `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64`。urge `c07e24bc0c3416a760ab30f14ce3b644e27af664`、motive `7f6001e76c4e99126e64b2bdba661c0b9121036c`。plan/同意/Forget入力不足 | 共通Acting/context後に抑止/話題源を統合。Free制限、consent撤回、写真一致、quiet hours、送らない選択。story再実装不要 |

7群は追跡単位であり、7件とも採用可能/完成と数えていない。#86–88の全ファイル精査、#31残部は次回へ継続。

## IDEA01〜07の深掘りと追加

根拠Blobは11と13へ接続。現時点で採らない思想も消さない。

| ID / 解決したい問題 | 現在/未実装・依存 | 効果とリスク/採用前検証 |
|---|---|---|
| IDEA01 記憶の確実性と訂正 | mainはconfidence/期限等。tentative/confirmed/corrected/completedの明示契約は未反映候補。Forget/Identity/主体・対象期間に依存 | 言った覚えのない断定を防ぐ。状態分類自体が誤る、過剰忘却の危険。否定/質問/第三者/日付/同名/取消・再提示を独立期待値で試験 |
| IDEA02 Stageと関係成立 | mainはpoints-derived Stage。canonical established fact/floor1/read-only heartsは候補。過去canonical turn根拠とimportが依存 | 非恋愛の深さを育てる。点数や日数を別名にした自動進行へ戻す危険。Stage5親友/恋人Stage低/失敗時Stage0誤表示/課金非影響を試験 |
| IDEA03 Momentum分離 | 日単位Episode/3日Patternはmain。recent空気と永続5軸の完全な共有契約は未完。IDEA04と関係 | 成長実感と長期履歴保全。沈黙から孤独/嫉妬を創作する危険。長期不在/活動再開/複数type並行/反復宣言と本当に新しい出来事を比較。係数増で解決しない |
| IDEA04 canonical Acting DTO | 通常chatの5軸/statusとBody Clockの読取は未統一。pending/import/version検証と共通Coreが依存 | channelごとの別人格を防ぐ。DTO正規化だけで配送原子性まで保証する誤解に注意。同じsnapshotでchat/通知/写真、期限切れ/不明status/競合を試験 |
| IDEA05 pure共通Engine | 個別部品あり、全pipeline未完成。既存auth/quota/commitを保持、byte parityが先 | 比較可能な品質改善/重複削減。抽出ついでのprompt短縮やretry増で人格/費用が変わる危険。fixtureだけでなく例外/timeout/conditional expression parity |
| IDEA06 三層promptとデータ所有 | layered builderは実験。DB/cache/RPC隔離まで完成ではない。まず美咲一人、pair境界保持 | 将来キャラ固有知識と個別関係を守る。テンプレートを分けても検索から他pair漏洩し得る。Character/User/Pairのnegative fixture、削除/import/cacheまで追う |
| IDEA07 version再利用/unknown | 既存relationship_state_versionを活用する案。DTO実験test内関数はruntime実装ではない。全writerとdelivery transaction依存 | 二重version/誤った未交際断定を避ける。version非増分writer/ロック順序/旧signature抜けの危険。状態だけ変わる競合、unknownとnone、Node/Denoを検証 |
| **IDEA08 独立oracleと共通失敗注入** | 過去のDOC-085評価から保全。片側だけでなく両側false negativeを試す知見。Lab/共通Engine/Forget比較に依存 | A/B一致=正しいという誤判定を防ぐ。合成oracle自体の誤りは残る。仕様レビュー・人手blind評価・主体/訂正の固定期待値を併用 |
| **IDEA09 pending橋渡しの寿命と設計変更履歴** | DOC-066初期案と065/067後続案の差を保全。会話commitと重大Event/Statusを後処理で分離し、pendingで橋渡し。main canonical直近3turn観測あり | 会話可用性と境界保護を両立。pending作成前停止/3turnを越す滞留の保証は未確認。これは監査で抽出した検証課題で、過去に完成した新機能ではない |

IDEA09は旧案を誤りとして削除するものではない。Event+Status原子性、会話commitとの一体性、モデル実行をtransaction外に出す要請は異なる保証として残す。

## legacy: BLOCKED維持、解除条件の具体化

対象HEAD `17449c7ec4e8ff50605ef931b04ae76584c6304f`、SQL Blob `258a2a90c9f16f4ba77545601af20de07f48a18d`。10の根拠と、evidence.zip raw/legacy-job-105970897567.json・105970897363.jsonを再利用。3か所FOR SHARE変更、4種類の回帰とPG17.6/18.4各56成功は既存証拠。今回DB試験を実行していない。CI成功は解除条件を満たさない。

| 残件 | 今回確認範囲/限界 | 解除判断前に必要な証拠（実施は別承認） |
|---|---|---|
| 未guard write経路 | 既知3テーブル misaki_evolution_analysis_state/proactive_message_usage/user_entitlements がguard/fixture対象外 | 全テーブル/直接SQL/RPC/Edge/triggerを読み書きsurface表にし、各入口でdrain/freeze拒否又は明示安全根拠。3表を含む旧処理競合試験 |
| pre-gate | 初期open確認はtext/length20とdraining中心、freeze control読取はplain SELECT | gate前に開始した全writerの終了/引継ぎ/排他と、受付→freezeのraceをbarrier試験。単に新規guardを足すだけで既存処理が排出されたとしない |
| transaction境界 | FOR SHAREの3箇所はsnapshot/read-write競合への部分対処 | 全mutationでcheck/write同一transaction、lock順序、isolation別、timeout/deadlock、途中abort/rollback、stale worker。許容SQLSTATE55000/40001と実際観測を区別 |
| operator isolation | 4回帰で運用者間/connection pool全体を保証しない | 別operator/session、connection reuse、commit後持越し、権限ロール、同時drain/resume、crash/reconnect/retry。操作所有権を他sessionが借用しない |
| 既存処理/実統合 | CI fixtureは本番全schema/trigger/cronの再現ではない | 実schemaを秘匿情報なしで照合した隔離fixture、旧処理と同時実行、権限/検索path/外部job一覧、復旧手順、owner安全性レビュー |

最終解除は安全性レビュー後の別判断。監査文書、テスト数、特定SQL差分の存在だけでは解除しない。復元RPC migrationも本番再適用しない。

## 開発優先順位案（実装未着手）

| 順位/区分 | 目的・利用資産 | 新規作業と依存/リスク | 必要な受入 |
|---|---|---|---|
| 0/A | legacy・匿名/所有境界・pendingの保護。10/13/本表 | まず不足証拠と試験設計。安全性変更は別承認、BLOCKED維持 | 全surface/旧worker/operator/pendingの保証 |
| 1/A-B | 忘却・訂正・Identity。#66/#67/#78/IDEA01 | 統一したMemory v1仕様と全参照入口。DB現状不明の再適用禁止 | 主体/確実性/訂正/再提示/匿名import/他ユーザー漏洩 |
| 2/B-C | 品質基準線。#86、DOC-085、既存telemetry | 独立oracleと欠測を含む指標、既存計測を再実装しない | 人格/文脈/長期記憶/反復/境界、canonical turn当りphysical attempts |
| 3/B-C | #87/#88 pure共通Core | prompt短縮を混ぜず最小抽出。auth/usage/commitは外側 | byte/role/順序/validation/retry/expression parity、失敗経路 |
| 4/B-D | Stage/5軸/MomentumとActing。IDEA02/03/04/07/09 | 係数でなく自然な成長と説明可能性。pendingの寿命を先に確認 | 非恋愛親友/交際事実/別れ/修復/不在/未解決critical |
| 5/B-D | Body Clockの自然な自発性。#31 urge/motive、DOC-046 | 共通Acting後、topic源/consent/Forget/planを統合 | 何もしない、写真一致、Freeの個人記憶由来話題禁止、撤回/quiet hours |
| 6/D-E | 将来Character/User/Pair・婚姻排他、資産参照保全 | 美咲一人を先に完成。削除/統合せずworkflow外部参照を記録 | 他pair秘密隔離/原子的排他/削除/import/cache、全実行資産の到達可能性 |

各段階は提案。main取り込み/枝統合・削除はユーザー承認を得る。
