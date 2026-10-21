# 第2次精査：文書本文と実装の対応

2026-10-21。起点 `f55f6feb9a425a4d3ad4c9fa98bdd667a32e93f9`、main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。09の旧判定を削除せず追補する。今回8版、累計24/85版。残61版。精査済みとは本文を読んで設計・対応実装・未解決事項を記録した意味であり、仕様の全実装・本番受入の完了ではない。総覧24版の全本文/全差分は依然未精査。

以下の文書ID、所属全枝、最終変更日時は09_DOCUMENT_CLASSIFICATIONS.jsonに接続する。括弧内SHAは文書の最終path変更コミットであり、所属枝HEADと混同しない。

## DOC-016 — Gemini単価計測の引継ぎ

`docs/GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md` Blob `ce90e641d80b74eb852df5f317cb7837c9cc2ab8`、変更 `ed8359319181f20cf73aec87ab75c7a1405264f2`、枝 `docs/relationship-v1-2-stage-growth-principles`。

1. **目的・思想:** 品質やgateを変えず、成功turnではなく物理API試行を測り、単価判断の基礎にする。
2. **仕様:** optional sink、欠測NULL≠0、opaque ID、本文/キー非記録、best-effort。normal/analyzer/criticalを現対象、Body Clock等は予約分類。価格・為替は観測と分離。
3. **実装:** main `lib/gemini-usage-telemetry.ts` Blob `a1ef34771b7e61671d12f637c69f0959159670a2`、server sink `0a3898beb90b8e0def5d7aaa5521f69d59a63148`、generator `d080f365802edb91b90b1c45a381e03563b7597a`、#61。11の13/16同一Blob照合を再利用。
4. **main:** 中核あり。計測を新規再実装しない。手順書が枝にしかないことと、計測機能の未反映を混同しない。
5. **基本構想:** 人格・記憶・品質を維持した最適化に整合。
6. **未解決:** 本番欠測率、成功canonical turnとのjoin、予約call kindの接続、実単価。100–300turn、7/30日という記述は計測計画で、実測結果ではない。
7. **採用候補:** sink変更前に、既存観測の完全性と分母を監査。
8. **試験:** sink失敗時会話継続、retry各試行、NULL扱い、匿名IDとプランの分離、canonical成功との照合。

## DOC-017 — Gemini usage観測の意味と限界

`docs/GEMINI_USAGE_TELEMETRY.md` Blob `4e48f72678499ba1de0158e089c9e0a21e327cb7`、変更 `5422d450b843bc44137ce3938b419984e765acba`、main含む所属枝は旧JSON。

1. **目的・思想:** usage値を請求書や会話成功率と誤解させない、観測契約の保存。
2. **仕様:** successはHTTP成功でturn完了ではない。latencyはfetchからheadersまででbody/待機/DB保存を含まない。user_idは匿名も含みプラン分類ではない。afterの2秒DB timeout、retry cloneの2秒/1M文字上限、非永続sink。
3. **実装:** DOC-016のmain計測モジュールとSQL `20261004045307_gemini_usage_telemetry.sql` Blob `28fd96fbeb848c58afd6ea5a3da8920f60c2b6ee`。SQL存在は現在DB適用の確認ではない。
4. **main:** 文書も同一Blob、中核コードあり。「レビュー後deployから開始」という初期記述は現在運用の証拠にしない。
5. **整合:** 品質劣化を隠さないコスト指標として有用。
6. **未解決:** Body Clock/画像等の網羅、durableでないことによる偏り、請求との整合、turn単位のphysical attempts。
7. **候補:** 欠測率込みでP50/P95と品質を併記。NULLを0円と集計しない。
8. **試験:** HTTP200後commit失敗、失敗/再試行、sink timeout、匿名/永続の別集計。ライブAPI未実行。

## DOC-046 — Free/Premiumと記憶・自発話題源

`docs/MISAKI_FREE_PREMIUM_MEMORY_PROACTIVE_BASELINE_20261019.md` Blob `be34a96cd15fb1a819f6415c9895726afe8a1cfe`、変更 `ef5bd23246a75b02a0df60302263f971de061843`、枝 `experiment/interpreter-gradual-acting-20261015`。

1. **目的・思想:** ユーザー合意の製品基準。料金で愛情を買わせず、ダウングレードで人格的に罰しない。
2. **仕様:** User/Shared/Relationship Memoryを分離。既存Memory v1を利用し並列engineを作らない。Free自発話題はキャラ自身の日常、ユーザー記憶/履歴を源泉にしない。Premiumは同意/Forgetを通した共有記憶0–3件。Freeの保存・通常会話参照範囲は未決。
3. **実装:** 11の#31 motive入力にはplan/同意/Forgetがない。main Body Clockと通常chatの共有canonical Acting契約も未完成。課金quotaだけで本仕様を満たさない。
4. **main:** この文書は未収録。製品仕様の実装完了は未確認、回収すべき設計候補。
5. **整合:** 現visionに整合。旧総覧の「Free/Premiumは回数だけ」とは時点差/矛盾あり。両方を残し、通常会話の記憶権限まで勝手に決めない。
6. **未解決:** 同意の撤回、既存記憶の扱い、プラン変更中、Forget/通知/写真の同一選択境界。
7. **候補:** 発話前のtopic-source policyとpair scopeを先に定義。料金でStageを進めない。
8. **試験:** Freeにユーザー由来話題が漏れない、Premium同意なし/撤回、downgrade後も温かさ維持、他ユーザー混入、抑止=何もしない。

## DOC-063 — Relationship Engine v1の設計凍結候補

`docs/RELATIONSHIP_ENGINE_V1.md` Blob `f9f763eca7713424a3d15b15fe547a16e44cb5e5`、変更 `1937c316e9d3d4edcc11f1e447ee582ffc45357a`。

1. **目的・思想:** 数値5列ではなく、根拠→Episode→Pattern→bounded Stateと明示的Event/Statusで関係の歴史を説明可能にする。
2. **仕様:** Resolver優先順位=Event/Status→境界→5軸→Momentum→Stage→Memory。生成文だけで加点しない。高romance≠交際、Stage5親友を許容。不在だけで感情/恋愛を創作しない。重大事実はValidatorが扱う。model更新で昨日を改変しない。
3. **実装:** main domain `lib/relationship-engine-v1.ts` Blob `969f26a2c02e823a298e88f7908b60cfc7871553`、processing `bc89fbc00036b66b4f0b3d3500f853bf2bf38ed5`、runtime `a5d2299769ae2d5bf9b2a7ecd7baae7afd5c203f`、canonical `584989230ed0dc89a8aee961aa169e32d4646d3a`。
4. **main:** domain/保存後分析は存在。episodeForはdirect user→Misaki、confidence≥.8、strength≥50、一意key/日、宣言は日跨ぎ同一key。patternsForは3独立日batch、boundedDelta±3。全意味Episode認識や全channel共通化の完成ではない。
5. **整合:** 基本構想の中心。ただし実装の保守的日単位集約は「意味を理解した継続性」と同義ではない。
6. **未解決:** semantic noveltyの過結合/過分割、旧points Stage、全channel parity、Momentum、実モデル品質。
7. **候補:** 日数/係数を増やす前に物語fixtureと誤認率・成長停滞を検証。
8. **試験:** 引用/第三者/否定/冗談、同義反復、別れと修復、高romance未交際、長期不在、version/replay。設計上のstress testと実行試験を区別。

## DOC-065 — アプリ統合と分散worker

`docs/RELATIONSHIP_ENGINE_V1_APPLICATION.md` Blob `917837f70a6fe241ae8c3dc2a2268725d71a15c2`、変更 `42c8eba3c92e0cbaeb0825717f122e2fb3f7364a`。

1. **目的・思想:** 会話成功を分析失敗で取り消さず、lease/token/oldest-firstで分散更新を守る。
2. **仕様:** post-save after、各RPC transactionでv2 token検査、Pattern一回消費、pending重大イベント、匿名暗号root、lease下の一回import。opportunistic retry最大3turnで、常駐queueではない。
3. **実装:** DOC-063各Blob。chat `5600ad37f2660049a570c4dd340e8ed140d9843b` はcompleteTemporaryTurn/completeCanonicalTurn成功後afterで旧emotion/turn更新、resume処理。runtimeは有効gateとSTART_AT境界、turn時系列走査、import leaseを使用。
4. **main:** 同一文書/中核コードあり。文書の「Draft、enablement off」は当時の記録で、現在の本番環境変数を証明しない。
5. **整合:** 単一の関係史と匿名privacyに整合。stage旧points、Body Clock共通化未完は残る。
6. **未解決:** 文書報告249test/rollbackは歴史的証拠。今回再実行していない。live multi-instance、モデル品質、cross-device、再訪しないユーザーのpending回復は未確認。
7. **候補:** autonomous retryを即追加せず、pending滞留観測と失敗復旧の受入条件を定義。
8. **試験:** lost lease後全write拒否、oldest ordering、失敗journal再開、import境界、post-save失敗隔離。legacy-maintenanceの別BLOCKEDを本書の解決宣言で解除しない。

## DOC-066 — DB境界設計と後続設計の差

`docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md` Blob `44aa021ec97d691e590354d7934851ad0de49e2a`、変更 `50585d71760b7ded6a75012f3f39e19bda1032c7`。

1. **目的・思想:** 既存State/Eventsを保全し、Evidenceの観測とcanonical重大事実を混ぜない。schema convenienceに人格仕様を従わせない。
2. **仕様:** 保存順、request冪等性、canonical順序、RLS明示/匿名平文禁止、Momentum分離、削除境界。初期案は可能なら会話commitと重大Event/Statusを同一unitにし、Validator失敗時はpending橋渡し。
3. **実装:** 後続DOC-065/067とmainは会話保存後にvalidator/重大event RPC。canonical loaderはpendingテーブルに加え直近3turnの未処理critical候補を橋渡し。単一の巨大transactionと主張しない。
4. **main:** 基盤中核ありだが初期案の全保証とは別。EventとStatusのRPC内原子性と、会話保存から後処理までの原子性は区別。
5. **整合:** 履歴保全と非恋愛関係に整合。後続変更の判断材料は会話可用性と外部Validatorをtransaction外へ出す必要。
6. **未解決:** 3turn橋渡し範囲外/worker未起動/再試行滞留で境界を維持できるか。これは追加調査条件で、今回再現済み不具合とは断定しない。
7. **候補:** IDEA09として、この設計差とpending橋渡しの寿命を保全。
8. **試験:** commit直後停止、pending作成前次turn、4件以上滞留、validator停止、再訪なし、import pending、解決時の次reply。

## DOC-067 — 初代Work引継ぎの権限境界

`docs/RELATIONSHIP_ENGINE_V1_WORK_HANDOFF.md` Blob `d54729fc1ba0c7462f74bf4baebc33124ea38641`、変更 `32a9dfc4dd7afc0890f4997fe50a21eaf68fafad`。

1. **目的・思想:** DB再設計/再適用せずアプリを接続、契約不一致なら止める。応答は関係性を参照するが自身の生成文で事実を作らない。
2. **仕様:** 保存後更新、ValidatorはDB外、pending保護、匿名暗号trajectory、同じReply Core、18受入journey、owner受入後cutover。
3. **実装:** 文書の初期v1 RPC名は後続DOC-065でlease-fenced v2へ更新された。main runtimeはimport v2を呼ぶ。古い引継ぎをそのまま再実装しない。
4. **main:** 文書と中核あり。5件のDB適用/rollback済みという文中の報告は現在DB実体の確認ではない。復元migrationの再実行は禁止。
5. **整合:** 人格・記憶・履歴の一貫性に整合。
6. **未解決:** 18受入すべての現在実装/現在運用の達成、Body Clock共通化、現在の本番gate。
7. **候補:** 既存pure関数、lease、匿名importを守り、契約差を先に確認する手順を継続。
8. **試験:** 複数channel/匿名→永続/長期不在/別れ・修復を横断したjourney。今回DB/モデル/Previewの動作試験なし。

## DOC-085 — Forget batch比較報告

`tests/reports/forget-batch-evaluation.md` Blob `fa3b7bcb6ea654f1777adff83c6481ca48af4fc9`、変更 `fb5768089494c62b35d11442d309bf3fe6df57fd`、枝 `work/forget-control-v1`。

1. **目的・思想:** runtimeを変えない検証専用のbatch案。モデルにForget権限・barrier・provenance変更を許さない。
2. **仕様:** history/memory/today/traitsを一括入力、stable ID・全ID/重複/未知ID・一意span厳格検証、曖昧時fail closed。memoryはspan mask、replyは違反があれば全rejectしモデル書換えで安全化しない。再提示は独立の既存policy。
3. **実装:** #66検証用harness/report。mainにForget本体のRootState/route接続はない（11の固定HEAD照合）。batchは本体採用済みを意味しない。
4. **main:** 未反映の評価資産/回収候補。スクリプト20scenario、23/23、UTC/JST284/284は報告上の結果。今回再実行なし。
5. **整合:** 忘却と品質を優先して費用を測る方針に整合。
6. **未解決:** token/latency実測NULL、live未実行、部分名/person-factの一部差はscript regexの不足でモデル品質の証拠ではない。7–9→3は論理call案で課金実測ではない。
7. **候補:** IDEA08: A/B一致率ではなく、独立した仕様oracleと片側/両側故障注入。両側false negativeの一致を成功にしない。
8. **試験:** 固定期待値、人手blind review、batch欠落/重複/曖昧span、共通失敗、訂正/再提示/主体別、日付境界、会話非劣化。費用削減のためForgetを弱めない。
