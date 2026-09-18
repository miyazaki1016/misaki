# 旧Production互換 maintenance / drain

基点: main `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`。
比較対象: PR #29 `fd4b6e78e0a79dc05ebed46f82baf205f53cca23`。
この設備は独立した先行設備であり、PR #29のmigration/RPCには依存しない。
今回、Production施工、cron操作、snapshot/restore、PR #29 mergeは禁止。

## 状態機械と設計理由

**maintenanceはON/OFFではない。受付集合を確定し、未解決処理をdrainした後にfreezeする状態機械である。**

`open → draining → writes_frozen → open`。drainingからの中止/reopenも可能。
reopenは未解決処理を削除・期限切れ扱いにしない。
停止応答は503の独立エラーであり、美咲の会話、記憶、関係イベントには保存しない。

DB正本はprivate schema `misaki_drain.control` の1行と `operations`。
`admit_misaki_legacy_operation` はservice_role専用で、認証済みサーバーが呼ぶ。
同じ排他transaction advisory lock `(1296646475,30)` の下で状態確認と登録を行う。
operation ID、capability、usage追跡キーはDBが生成する。ブラウザ指定request IDは受付権限にならない。
ブラウザへ返すcapabilityはそのユーザーの既受付chatを保存するための継続権限だけであり、
新規受付、成功状態の直接変更、operator操作には使えない。

業務write guardは同じキーの共有transaction lockを保持する。
別ユーザーの通常DB処理は並列実行できる。
停止/freeze/operationの終端確定は排他lockを取るので、先行DB transactionの終了を待つ。
長いGemini/Push待機中にはDB transactionを保持せず、永続operationを未解決にする。
受付済みcapabilityを持つ書込みはdraining中にも継続可能。writes_frozenでは拒否する。
旧definer RPCから到達するguardもprivate正本を読む。service_role・SQL operatorにもwrite guardは効く。

TTL、lease期限、HTTP timeout、経過時間、process再起動、cron停止だけでdrainedにしない。
停止前にusage消費した生成中chat、応答紛失、refund紛失、後続browser保存紛失はfreezeを止める。
これにより `usage commit → Gemini待機 → freeze → refund拒否` の順序を成立させない。

## operationの状態

| 状態 | 意味と次の遷移 |
|---|---|
| admitted | DB受付済み。usageより前に登録。生成/保存/配送が終わるまで未解決 |
| awaiting_browser | chat生成成功と旧usageのprocessed/allowedを確認。旧browserの後続保存待ち |
| refund_pending | Freeの失敗処理。refund RPC完了確認前は未解決 |
| unknown | クラッシュ、通信不明、失敗した保存/監査。operator reconciliation必須 |
| succeeded | history/email/Edge/relay等のhandler終了確認、またはbrowser保存transaction完了 |
| failed | chatではprocessed済みの利用拒否、またはPremium失敗。Free消費済みは不可 |
| refunded | 同じuser/DB生成usage追跡キーのrefunded_atをDBが確認 |
| reconciled | operatorが実結果を調査し、証拠を記録して終端確定 |

終端状態だけended_atを持つ。unknownは自動終端にしない。
processed=falseの仮usage行もfailedにできない。unknownと同様にfreezeを止める。
成功chatはFree/Premiumともbrowser保存前に終端へ進めない。
匿名chatは旧mainどおり会話正本へ自動保存しない。
継続保存は旧background snapshotを確定し、恒久ユーザーのみ旧history sync RPCを呼ぶ。
メール保存は別の明示checkpoint operationで、匿名→emailの既存認証を保持する。

## 書込み経路の調査と停止境界

| 経路 | drainの境界 |
|---|---|
| `/api/chat` base / middleware経由 `/api/chat-proxy` | baseがusageより前に登録。proxyのmemory sync、relationship時刻RPCも同じcapabilityで継続 |
| 成功後browser履歴/記憶/今日の記憶/ポイント、background snapshot | 正確なターンsnapshotをuser IDとcapabilityに結び付けてpendingへ保存。新RPCが旧保存と終端確定を1transactionで行う |
| 5秒history polling、旧browser POST追記同期 | 独立history operation。受付後にONとなっても保存まで継続。受付前ONなら503 |
| history POST / 匿名メールsave/checkpoint / 再保存 | historyまたはemail_checkpoint operation。保存RPCの結果不明はunknown。失敗checkpointでは確認メールを送らない |
| 旧browser背景upsert、直接sync/save/record/silence/usage/refund/append RPC | 同期DB transactionの共有lockが境界。新たな非登録writeはdrainingから拒否。旧definerも迂回不可 |
| relationship emotion/action trigger連鎖 | 親writeと同じDB transaction/lock。既存trigger本文を変更しない |
| Body Clock claim→silence進行→generation→delivery→decision event→relay | 認証済み旧Edge handlerがclaim前にbatch operationを登録。4 worker全部とrelay応答が終了するまで未解決 |
| Vercel `/api/push/body-clock` | Edge batch継続capabilityを伝播。独立した署名済みrelay呼出しはrelay operationを登録。attempt未完了も別のfreeze拒否条件 |
| Push購読upsert/所有者変更/削除 | synchronous DB guard。relay/testの配送後更新は各operationを保持して終了確認 |
| `/api/push/test` | 認証後、外部送信前にpush_testを登録。全通知/購読更新終了まで保持。不明結果はunknown |
| evolution analyze / review / 直接traits・候補・履歴更新 | analyzeは外部生成前にevolution登録。reviewは同期DB transaction guard。存在する関連3テーブルにもguard |

必須guard対象は旧7正本テーブルに、relay attempts、push subscriptionsを加えた9テーブル。
追加で存在するtraits/candidates/evolution historyをguardする。
認証・ログイン・読取り・サイト表示を一律停止しない。
旧schemaにはcanonical/temporary rootsの新テーブル、revision、completion列を要求しない。
旧mainのポイント計算、30/80/160、記憶処理、emotion/action、写真selector 4、55–210分を変更しない。

## freeze成立条件

`misaki_drain.freeze()` が同じ排他lock下で、以下をすべて確認する。

1. controlがdraining。欠落/不正状態なら拒否。
2. 未解決operationが0件。stateや日時による期限切れ除外はしない。
3. 旧Edge/旧Vercel invocationsを含むBody Clockのdrain確認証拠がoperatorにより記録済み。
4. `cron.job` が存在する環境では、`misaki-body-clock` / `misaki-background-push` がinactive。
5. `misaki_body_clock_push_attempts.completed_at IS NULL` が0件。
6. 共有lockを保持する既受付の同期DB transactionがすべて終了。

cronの状態変更はこのRPCに含まない。制御APIからも自動停止しない。
admit/progressにservice_role権限を付けるが、停止/freeze/reopen/verify/reconcileは付けない。
操作用UI/APIは公開しない。private schemaのoperator SQLのみとする。

## 将来の施工手順（今回は実行禁止）

この文書は許可ではない。以下は別枠の施工計画である。

1. 隔離環境で実旧schema/RLS/triggerを含むAPI→DB→Edge→relayの非外部送信リハーサルを行う。
2. 別途許可後、先行SQL設備をinstallする。初期phaseはopen、Body Clock verificationはfalse。
   旧アプリは旧schemaのまま動ける。SQL設備だけで未知の旧HTTP/Gemini処理が消えたとは判断しない。
3. 旧schema互換Vercel gate・旧Edge trackingを別の承認枠で導入する。
   それ以前の旧deployment/Edge実行をinventoryし、各処理の終了またはreconciliationを確認する。
   調査不能ならBLOCKED。単なる待機時間/lease expiryで確認を代替しない。
4. cron停止を別操作で実行し、旧/new Edge invocation・relayの残存を確認する。
5. `select misaki_drain.stop_admission();` で受付集合を確定する。
   `select * from misaki_drain.unresolved;` とattempt未完了を監査する。
6. 既受付chatのbrowser保存、Free refund、Edge/relayを待つ。
   旧browserはcapabilityを返せないので自動完了できない場合がある。正本結果とusageを調査する。
   保存不明・応答紛失・クラッシュはunknownのまま。運用者が確認不能ならfreeze禁止。
7. 既実行の結果を確定してから `verify_body_clock(証拠)`。
   証拠には旧/new runtimeの識別、全invocation/relay終了確認、cron状態、未解決監査を含める。
   `reconcile(ID,証拠)` は失敗を無視する操作ではない。Free refund、保存、配送の実結果を先に解決する。
8. `select misaki_drain.freeze();`。拒否されたら未解決処理を調査し、時間で強行しない。
9. snapshot/restoreリハーサルとPR #29切替はさらに別工程・別許可。今回実行しない。
10. 中止/解除は `select misaki_drain.reopen();`。未解決記録は保持、verificationはリセット。
    cron再開も別操作。失われた会話を古いdumpで上書きしない。

operator viewはcapabilityを公開しない。秘密キー・会話・メール・Push購読本文をlogsやPRへ出さない。
復旧DDL等のtrusted施工もwrite guardの解除/施工手順を別途設計してから行う。
PR #29の旧maintenance制御は別設計なので、将来併用する際は制御正本を一本化する変更が必要。

## 検証と限界

- 新branch: 52テスト（旧main回帰14 + browser3 + DB18 + Edge3 + routes14）。
- 実PostgreSQL18.4の複数物理接続でlock待ちを直接assert。旧sync/save/refundの実SQLを実行。
- DB fixtureは合成旧schema。既存本番データ、実メール、実Push、実Geminiは使わない。
- API/Edgeの実handlerを外部生成/配送stubとbarrierで検証し、順序とoperation保持を確認。
- 匿名/恒久×Free/Premium、OFF/ON、受付/停止/freeze race、refund、unknown、後続保存、relay orphanを検証。
- DB BEGIN/ROLLBACKで設備再作成を試験。fixtureのscheduler metadata試験は実cron操作ではない。
- 別checkoutのPR #29既存52実テストを再実行（Node表示53は空module項目1件を含む）。
- アプリTypeScriptと旧Edge Deno check。CIでも隔離PostgreSQL serviceで同じ試験を行う。

これらはPostgREST実配送、旧Productionの全RLS/trigger、稼働中旧runtimeの引継ぎ確認を代替しない。
Preview READY/CI greenだけでProductionのfreeze安全を証明しない。
**本番へ入れる準備の最終判定には上記隔離連携と旧runtimeの引継ぎ計画の検証が必要。**
