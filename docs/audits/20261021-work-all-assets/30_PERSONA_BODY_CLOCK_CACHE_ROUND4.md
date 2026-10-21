# 第4次精査：人格・自発配送・写真・cache
main c88cf7f、F=#66 84d147b。35にBlob一覧。静的コード確認のみ。確認済み漏洩・再現不具合0件。

## Persona Evolution
M evolution-analyzerは履歴・memory・既存traitsから候補を生成し、根拠quoteの存在やrisk/confidenceを検査する。runner:76–110はproposed_contentだけでなくreason/evidence.quotesをcandidate RPCへ渡す。autoApplied:falseはAPIの応答であり、全writerに対するDB強制の証明ではない。
F analyze route:80–110は匿名もverified rootを読む。runner:152–166は既存traitsと候補proposedContentをderived maskする。しかしreason/evidence全体を同じmaskへ渡す処理、生成中に変わったcontrolの再読・保存RPC内比較はこのrunnerにない。これは古い情報が保存された実測ではなく、不足する検証条件。
FとMのcandidate一覧・review routeは同一Blob。候補一覧はscope=user/user_idで絞るがreason/evidenceを返す。reviewはcandidate IDとapprove/rejectをRPCへ渡し、Forget世代は渡さない。Forget前候補を後日表示/承認するsequenceを試験する必要がある。RPCの現在実体は未確認。
DOC-051には10/13のSELECT調査報告が追補され、3RPCのauth.uid所有確認とtraits自己行INSERT/UPDATE可能性が書かれている。今回そのDB観測を再実施していない。「現時点でも同じ」と読み替えない。

## 共通人格と私的traits
M persona-store:46–147の5分globalCacheはactive persona versionとprompt modules。user traitsは:156以降でuser_idを指定して別読取。globalCacheがuser traitsを共通化しているとは認定しない。ただしglobal modulesへの管理更新・共有成長の全入力は今回未監査。将来キャラクターキーもcache key/RPC/job/消去へ一貫して必要。
本人の関係traitsを「このユーザーだけ」とPromptに書くことと、DBのpair隔離の完成は別。

## Body ClockとPush
M Edge index:18–22、F:19–23はroot→life→decision→persona→reply→photo→finish→decision event→relay。MとFのrelay routeは同一Blob。
- F forgetContextとreply完全一致のmaskは生成開始時controlsを使用する。
- finishは匿名revision/恒久conversation.updated_atをtransaction内で照合する。M追跡SQLの最終定義にrelationship_state_version比較はない。Fのforget migrationはfinishを置換していない。
- 関係stateにはrelationship_state_version/state_updated_atがあり、10/3 state/critical/import RPCで増加する。この存在だけではfinishが比較している証拠にならない。
- 会話rootを更新するForgetとの生成中競合は、同じrootのupdated_at/revisionが確実に進む前提なら既存finish保護を再利用できる。別control writerや関係だけの更新までは包含しない。
- 確定済みdelivery→Forget→relayの順は別問題。relay:43–79はsaved deliveryのstatus/source/1時間以内、現在notifications_enabled、subscription、attempt一意を確認しsaved messageを送る。Forget世代や内容の再検査はない。OSへ送信済みの通知はサーバー履歴失効だけで回収できるとは限らない。
- notifications_disabledでも履歴への自発配送は作られる既存契約。Push許可、会話内自発発信、記憶利用への同意を区別する。
- Free/Premiumの話題源制限は基本構想。M/F generateMessageにはhistory/memoryが渡り、ここにプラン別の話題源分岐は確認できない。課金・quotaの保護とは別の仕様差。
- 写真は生成画像ではなくproactive-photo selectorVersion 4による候補選択。reply/decision/recentPhotoIdsを使いphoto_contextにdecisionを保存する。秘密が写り込んだ事実は確認していない。古いlifeEvidence/写真contextの表示・再利用と文面世代を検証する。

## Cacheと画面
| 保存/処理 | 現在の保護 | 未検証条件 |
|---|---|---|
| localStorage履歴→React | device owner、misaki名キーcleanup、旧ownerless掃除 | Forgetが物理履歴消去ではないことを区別し、再表示の製品契約を決める |
| sessionStorage token/pending | 暗号root/revision/expiry、pending requestIdとowner | 別tabの送信・Forget中の古いreceipt、offline復帰 |
| conversation-history-sync:31–73 | no-store、owner/auth再確認、送信中/履歴変化時は棄却 | sameHistoryはrole/textのみ。memoryだけ削除され履歴不変なら古いroot-state応答の棄却世代がない。root-state dispatch後のusage await中も別競合窓 |
| page:730–757,1021–1037,1299–1371 | root load、所有者再確認、変更中のlocal pending制限 | 他tabのForgetは同tab pending制限では守れない。遅着responseの世代・最新control再照合 |
| HTTP/メモリ | no-store、private root/共通persona module cache分離 | no-storeは既存メモリ/UI/in-flightを無効化しない。再login・戻る・offline・複数tabを実機試験 |
| OS Push | relay attempt一回、TTL 3600 | Forget/同意撤回の確定と通知送信の間の競合。既送信の取消可能性は別調査 |

## IDEA13（未実装原則）
忘却・訂正・同意撤回の世代は生成時だけでなく、候補承認・配送確定・実際の外部送信・画面採用でも扱う。保存済みデータの存在は現在の再提示許可ではない。配信前照合と外部送信は別transactionなので「直前にSELECTすれば完全保証」としない。配送token、失効、outbox等の採否は未決で、この監査では実装しない。
