# 第5次：残19文書版の全文・意味精査

2026-10-21 JST。監査枝の最新HEAD `57be547b532e57fa1574e93e61df28f91d5deb7c` と一致することを確認して開始。main基準 `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。68のpending19版をすべて確認し、**原85版の全文・意味精査は85/85、未精査0**。これは文書の精査範囲であり、全資産監査、安全性試験、全PR/Preview受入、本番稼働の監査完了ではない。

## 全文確認の方法

DOC-015は原Blobの995行すべてを読み、冒頭からの判断を再評価した。総覧18版は既読DOC-042を出発点に、74に記録した比較順で**すべての追加・変更・削除箇所**を確認し、同一本文は既読版との行単位完全一致を引き継いだ。比較辺はGit親子関係や時系列そのものを意味しない。各版の所属枝・path最新変更commitは原inventoryを保持する。

全文の再構成とGit Blob SHA、全行のcoverage、比較元の読了順を検査。部分閲覧だけだったDOC-022/035は、今回は基底DOC-029と全追補を確認できたため初めて加算。既読66版の再加算なし。原文19版・全18差分は75、ID/Blob/coverageは74、累計の根拠は76に保存する。

75の `original-documents.json` は原IDをkey、原文全文をvalueとして格納する。JSON decode後にUTF-8へ戻すと元Blobと一致する。改行・末尾改行も維持し、原文の類似性を利用して圧縮するための格納形式であり、要約ではない。

## 各版の独自成果・置換・保全

SHAの完全値・全所属枝・path変更履歴は74を参照。表の比較元は読解用。

| 原ID / Blob先頭 | 比較元 | 新たに精査した意味・変更理由 | 現在mainとの関係と残す成果 |
|---|---|---|---|
| DOC-015 / ef27ea3 | 独立全文 | 原DEVELOPMENT_REGISTRY。91→92枝探索、A/B/C/D/U、main/DB/Preview/CIの区別、初期判断の逐次訂正、棚卸し後の冒頭再評価要求 | 本監査枝固有の開発史。PR/CI/DBの当時記録を今回の実測にしない。台帳内に古い結論が再登場する問題を71/72で照合。静的追補は既存台帳に上書きしない |
| DOC-037 / b488876 | DOC-042 | canonical foundation→Time接続→Life Facts→匿名trajectory→service-role境界→RPC二重呼出し除去→切替前監査。基礎工事時の+1/trigger維持からsemantic delta/trigger退役へ進む履歴 | mainのcanonical、temporary root、Story、server user-context RPCへ継承。旧legacy専用BLOCKED節がないことは解除ではない。実機受入と自動回帰を分けた記録を保全 |
| DOC-031 / 79708d0 | DOC-037 | 2ブラウザーでhistoryは収束するがquota表示が古い事例、PR44開始、表示60件とDB保持の区別、背景・理由を含む施工指示 | mainはusage更新best-effortとevent同期へ発展。元のthrowや5秒pollを復活させない。読取経路だけで全期間保持を断定しない |
| DOC-026 / 3eb6a94 | DOC-037 | shared-worldの自然な挿入、取得可能性と知り方の節度、home/current place分離。10/2 canonical cutover完了の当時記録 | mainの天気・地域情報は存続。Time枝の全自発性実装が統合された証明ではない。503回復実例とtimeout retryの未発火を区別。IDEA15の原文系統 |
| DOC-041 / f80f3fe | DOC-031 | PR44 best-effort修正、PR45 Interpreter、Evidence→Episode→Pattern→State思想、DB基盤、Work handoff。Geminiは俳優・観測者、数値正本の決定者ではない | mainの5軸・acting・worker・RPCに継承。設計済→DB施工報告→アプリ待ちという時点差を保存。Labの共有generation boundaryだけでfull parityとしない |
| DOC-023 / 343aca2 | DOC-041 | v1.1稼働記録、after()順序、lease fencing、3独立Tokyo日、exact substring、poison turnと不正候補drop、polarity transport、実走Evidence | 現mainに対応するworker/analyzer/processingがある。1回の好意・生成replyだけで加点しない。3日Pattern実走未完了という当時状態を後続受入と区別 |
| DOC-028 / 6a2f72c | DOC-023 | 物理attempt別原価telemetry、NULL/unknown、cohort、LPを最初から彼女前提から刷新。Premium50は未実装という訂正 | mainにtelemetry/LPがある。全経路計装や実原価集計完了は未認定。課金で関係の深さを買えない原則は現構想と一致 |
| DOC-033 / 98551ee | DOC-028 | PWA overflow修正、**隠し人物設定と段階的自己開示**。固定人生/生活設定と現在Episodeを分離、開示済みをPair共有史へ | LP修正はmain系統。自己開示契約の全保存経路は未完成・別設計。IDEA16として今回独立保全。日中勤務の固定候補を全キャラ仕様にしない |
| DOC-019 / 0715dd8 | DOC-033 | expired rootのskipと有効invalid rootのfail-closed、Analyzer bounded retry、Memory3層、Forget第1工事仕様とレビュー実装、確認再学習、追加call計測、batch/Shadow分離 | Forget候補は#66枝、main本線と異なる。6〜8等は固定fixtureの追加semantic callで全利用者quotaではない。scripted/PGliteの過去成功を今回16試験へ転記しない |
| DOC-034 / 9c36f6c | DOC-019 | 読解上はForget枝固有の後半を除き、World構想・Relationship Identity設計を追加。11候補、traits、hysteresis、breakup/rejection、第二層canonical、worker/import境界 | Forget追補がないのは取消の証拠ではない。Identityは#67候補でmain未統合。婚姻・複数キャラの当時未決は現在基本構想と日付を分ける |
| DOC-021 / 23c3a18 | DOC-034 | Identity4 migrationの順序/署名/ACL、source version/lock、anonymous provenance map、順序不変resolver、Preview lover→次turn自己認識の当時受入 | mainに同じIdentity read/worker/acting配線なし。DB適用済み/gate OFFは当時記録。Preview E2Eを「一切未検証」に戻さず、匿名v3 import・複数sessionは別残件 |
| DOC-038 / b6a73e4 | DOC-021 | Identity追加監査。source test、harness v2、PGlite v3、実機loverの証拠強度を分離。メール確認直後のimportは未保証、次恒久chatで再開 | #67枝限定追補。v2 harness成功をv3実アプリ受入へ流用しない。constraint/re-entry/multi-session/rollbackの未完了を保持 |
| DOC-030 / 779bcd2 | DOC-021 | 研究共有→確度設計→通常/匿名/checkpoint/Body Clock追跡。tentative/confirmed/訂正/取消/完了、未知形式の迂回禁止、最終gate候補 | Memory Certaintyは#78枝の設計資産。研究名・日付は共有要約の記録で、今回論文本体を照合していない。確度とForgetのgateを同一視せず、新正本を増設しない |
| DOC-029 / 711b767 | DOC-034 | 現main総覧。長期多キャラ構想、User/Character/Pair、仕事一般知識と私的経験、地域の用途別分離、外部情報取得、prompt重複、A/Bログの限界 | mainと同一Blob。目標設計は未実装を含む。DB persona成功時のTime guide重複とfallbackの差を現在ソースでも再照合。27.6/2.3/15.9/5.9%を同条件の指標としない |
| DOC-035 / aa91a9c | DOC-029 | 10/14新チャット引継ぎ、owner実機受入済みの基準線、全仕掛かり・依存・次の一手、品質と原価判断、婚姻・scope | #81文書枝固有。原文のキャラ側婚姻未決を10/21基本構想の一人制約へ無断で戻さない。UUID出所不明は復元SQLの後続証拠で精密化済み |
| DOC-022 / 29c5f78 | DOC-029 | 5軸成長速度、長期State/recent Momentum/Emotion分離、低中域guide、characterization testの意味、0→1人格急変と80まで無反応の双方を避ける | #84設計・感度試験資産。閾値/係数/新table未承認。当時affection0→1の実例報告を維持し、実返答への因果的効果まで認定しない |
| DOC-039 / c3c24b7 | DOC-029 | Body Clock version writer監査、会話育成と仕組み改善の並行、気にかける自発性、reactive/proactiveの選択分離、character差替え | #85の実験・未接続思想。Identity未実装という表現は#67実装/Preview受入記録と衝突し、72で限定訂正。通常chat/Edgeのfull core共有を完成扱いしない |
| DOC-027 / 55984ee | DOC-029 | Lab18→22品質probe、Q02 v1/v2、one-shot使用済、ログ期限、timeout/network診断、認可と費用、固定aliasのorigin別session、継続検証希望 | #86実験枝。初期の実Gemini0回と後の失敗試行を区別。失敗理由と物理件数は未確定。使用済marker削除や新枠・実課金・Preview Authを今回実行しない |
| DOC-040 / f551c2e | DOC-023 | Stage0→1はgrounded共有文脈再利用、2〜5はDepth/Breadth/History、自然低下floor1、read model/version/cache/UI、migrationとlegacy safeguard、telemetry設計 | 既存IDEA02/03の詳細原文。Stage Resolver/established fact/5-heartの完成機能ではない。Stageは新加点正本でなく、status・課金・日数とは別。履歴不足で高Stage捏造も無条件0戻しもしない |

## 今回の結論の範囲

文書の各版の固有内容・設計理由・main反映/候補/置換の位置を整理できた。75の比較順にない未読章を残したまま「全文済み」とはしていない。取得・機械的差分作成・章の部分閲覧だけで加算した版は0。製品試験の実行は0、本番確認の追加認定も0。

基本構想→72の変更履歴→73の第6次ゲートを優先し、過去総覧の命令文を今回の機能実装・課金・DB操作の承認に読み替えない。
