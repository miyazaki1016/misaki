# 第3次精査：Memory・Forget・Identityの境界と全参照経路

2026-10-21。起点8d4050f、main c88cf7f。固定HEAD・Blobは25、旧判断は09/17を保持。**静的監査の中間成果。全経路の安全性認定ではない。** DB・実モデル・実ブラウザーは未実行。

## 結論と責務

既存canonical Memoryを進化させる。並列のMemory Engineを新設する前提にしない。mainの保存正本は `misaki_user_conversation_state` と匿名の暗号化temporary root。通常記憶は `memory: string[]`、キャラ当日記憶はtodayMemory、生活事実は同じmemory中の `[life:v1]`。Relationship Evidence/Episode/Pattern/Statusは別の意味と権限を持つ。

**#67 Relationship Identityは人物照合器ではない。** `relationship-identity-resolver.ts` の入力は5軸、関係status/version、現在Identity、criticalEvent等。出力はacquaintance/partner_in_crime/best_friend/lover等の関係名とtraits/constraint。人名・entity IDを入力にして同名別人を判別する機能ではない。同名別人は#66 semantic targetと#78確実性設計の主体/provenanceで別途扱う必要がある。

mainはuser_idで読取を絞る。Character IDを含む全層のpair隔離は未完成。現在一人用の境界があることを、将来複数キャラの秘密隔離が完成した証拠としない。Character共通人格とUser×Characterの私的記憶を分ける基本構想を維持する。

## 保存から再提示までの対応表

M=main、F=#66、I=#67。pathは各固定snapshotに対するもの。表は確認した参照入口の全体索引であり、trigger/外部job/本番有効SQLまでの網羅性は未確定。

| 経路・保存→読取→再提示 | 現在の保護・再利用資産 | 欠けている保証/競合 | 必要な検証 |
|---|---|---|---|
| 1. POST chat→auth→loadCanonicalState/loadTemporaryRoot | M `app/api/chat/route.ts:1799–1831`、`lib/canonical-state.ts:72–132`。auth user IDで正本取得、body memory/historyを正本にしない | user×character複合境界なし。匿名bearerはSafari auth ID交換を許す設計で、token自体の所有は別課題 | 他user、別character、盗用/期限切れtoken、認証切替、古いrevision |
| 2. 正本memory→safeMemory→LifeFact/profile→Prompt | M chat:1973–2004。30件、文字列整形、ordinary/[life:v1]分離、期限付きselector | ordinary memoryをlifeFactsへconfidence:1として渡す。確定状態/provenanceの検証ではなく既存文字列への信用。#78の状態契約は未反映 | 質問/伝聞/推測/否定が保存された場合、古い情報の暗黙昇格、訂正前後の優先順位 |
| 3. history→safeHistory→contents | M chat:1953、最大60件、user/misaki roleのみ。generatorが現在発言を一度追加 | 型/件数制限は意味の正しさや忘却を保証しない。MにはFのbarrierなし | 古い秘密・assistant誤答・訂正・第三者、現在発言の二重投入 |
| 4. recall→直近20件をmodelMessageへ再提示 | M `lib/chat-recall.ts`、chat:1830。診断文除外、根拠なし創作禁止。#5/#8の目的は現在も存続 | 「事実の会話履歴」は発話事実であり、内容の真偽ではない。誤発話までconfirmedへ昇格させない必要。MはForget未接続 | 忘却後recall、引用/伝聞/否定/訂正、assistantの誤った人物認識を継承しない |
| 5. persona traits/evolution→persona store→Prompt | M persona store、F同pathはmaskForgetRows(...,"derived")、chatはcontrolsを渡す | Fでderivedの読取保護候補はあるが共通人格成長と私的記憶の分離は全保証未確認。要約専用の独立storeを本調査で確定していない | traitsに旧秘密が残る、キャラ共通化、user切替、進化入力の正本性。未発見の要約/cache入口も探索 |
| 6. generate→retry→expression→reply/更新memory/today | M chat:2405–2784。getReplyProblems/cleanFinalReply、recall時はordinary memory維持。F入力forgetContext、出力memory/today/replyをmask | M natural-memoryはPrompt指示中心。finalProblemsは警告で一律保存拒否ではない。F判定はsemantic judge依存、scripted成功≠実モデル正解 | 各生成段階で忘却情報注入、否定/訂正、両方式同じ見逃し、malformed/timeout、誤削除 |
| 7. 成功reply→completeCanonicalTurn→履歴/記憶/receipt | M `complete_misaki_chat_turn` RPCへ一回。F control payloadと結果を同じ保存境界へ送る | SQLファイル存在≠DB適用。Fと現行Mの協調更新/rollback、同時UI削除が残る | control失敗時全rollback、二重要求、旧writer、忘却成立後の旧app rollback禁止条件 |
| 8. 匿名暗号root→checkpoint→メール保存→恒久化 | M temporary root/revision、history POST saveAnonymous/expectedUserId、pending receipt回収。F同入口にforget payload | 認証ID交換可という既存契約と所有境界を両立する必要。F/Iを別々に移植するとcheckpoint不整合の恐れ | 忘却前token再送、追加会話後の保存再試行、別端末、expiry、Iと関係versionの整合 |
| 9. UI deleteMemory/clearMemory/clearHistory→再読取 | M history route:88–100はmemoryとhistoryを別操作。Fは対象特定とhard delete control追加 | Mでmemoryだけ消してもhistory由来の再提示抑止は保証されない。clearHistory≠memory消去。F hard_deleteも全物理履歴消去という意味ではない | UI削除直後/40turn後/再login/Body Clock、無関係な同名人物を残す、曖昧targetは確認へ |
| 10. completed receipt/cache→HTTP再試行結果 | M completed turnはuser/request/message hash等で整合。F chat:1809/1817/1825は最新forgetVersion比較→409 | MにはForget versionなし。Fでも同時更新と応答送信の間のrace、browser表示cacheは別問題 | Forget前成功responseを再試行、削除と再試行同時、released後も旧履歴barrier維持 |
| 11. relationship worker→events/evidence/pattern/story→Acting | M保存後resumeRelationshipProcessing、lease/idempotency、pending guide。FはRelationship Engine意味論を変更しない方針 | Fのchat入力maskだけで、workerが元canonical eventから読む旧秘密・derived storyを全遮断したとは言えない。全worker読取とstory生成の照合は残件 | Forget後retry/oldest-first backlog、名前/関係訂正、過去事実と現status、storyでの秘密再提示 |
| 12. Identity worker→canonical Identity→次turn Acting | I resolver/履歴/hysteresis、source relationship version、status/critical優先。main未接続 | 人物同一性は扱わない。古いIdentity、境界解除、匿名importをMemoryの訂正と混同しない | 同version二重確認、別れ後旧高romance、pending中先取り、撤回/訂正、source遅延 |
| 13. Body Clock root→life/context/persona→生成→写真/配送 | M `body-clock/conversation-root.ts` user_id選別、index.ts:18、期限付きlife根拠。FはforgetContext→persona derived mask→reply完全一致検査→finish RPC | Mは通常memory/historyをPromptに渡す。新Free話題源制限/Forgetは未接続。Fと配送途中のcontrol更新・写真根拠を横断確認する必要 | Forgetと配送race、同意撤回、Free/Premium、古いlife fact、別user、返信/写真/通知一致 |
| 14. browser履歴cache/復元→正本load | M device-conversation/anonymous guard、正本stateと表示cacheを分離する方針 | no-storeや暗号化だけでは既存画面/旧responseの忘却を保証しない。全cache invalidationは未確認 | 複数tab、logout/login、戻る操作、offline復帰、遅着した古い同期response |

## 確実性・人物の検証契約（未実装仕様の保全）

#78 `docs/memory-certainty-design.md`（IDEA01、旧11を継承）のtentative/confirmed/corrected/completed、人物×項目×対象期間を既存LifeFactの上にどう適用するかを設計する。質問「弟は医者？」、伝聞「友達がそう言った」、否定「弟は医者じゃない」、訂正「医者は兄だった」、完了「退院した」、撤回「さっきの話は取り消す」を独立fixtureへ。名前一致だけで人を統合しない。

FのPOLICYには同名≠同一人物、曖昧ならabstain、exact evidence/span、質問/引用/仮定はreoffer不可がある。これは**人物台帳の完成ではなくsemantic judgeへの契約**。validateControls/identifyForgetTargetsは形・根拠substringを検証するが、人物の意味的同一性そのものを決定論的に証明しない。Iでこの不足を解消したと数えない。

## 回収順と残件

既存正本/全入口を固定→#66の忘却barrierとreceipt/importを統合設計→#78のcertainty/主体selector→#67の関係Identityとのprecedence→同じfixtureで通常chat/recall/Body Clock/worker再試行を比較。今回の表は入口レベルまで。SQL全CREATE OR REPLACEの最終順序、全RLS/trigger、persona evolution全経路、ブラウザー全cache、worker/storyのForget接続は未完了。

新規設計思想 **IDEA10：人物IdentityとRelationship Identityを区別する**。既存#67を捨てず関係のcontinuityに再利用し、人物識別の不足を隠さない。**IDEA11：忘却は保存行の削除だけでなく再提示権限の失効**。history/derived/receipt/import/通知を同じbarrier世代で扱う。どちらも今回の監査で整理した原則であり、完成機能の発見数ではない。
