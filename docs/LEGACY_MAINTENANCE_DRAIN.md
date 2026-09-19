# 旧Production互換 maintenance / drain

> **最新判定：BLOCKED（2026-09-20 MVCC受付監査）。**
> freeze完了後に停止前snapshotから新規operationを登録・COMMITできる反例を追加確認。
> controlはwrites_frozen/epoch=1のまま、古いepoch=0の未解決operationが永続化する。
> 排他advisory lockによる受付集合確定も未成立。機能修正は停止し、拒否を要求する回帰テストを追加した。
> 既存snapshot反例と併せて安全性2件FAIL。下記の状態機械説明は保証済みの仕様ではない。
> 詳細はWRITE_SURFACE_INVENTORY.mdの2026-09-20監査を参照。

## MVCC再設計の必須条件（未実装・未証明）

- guardだけでなく、admit、require_operation、browser完了の冪等読取り、freezeのregistry/attempt判定まで対象にする。
- 候補はadvisory lock後の制御行locking read。`FOR SHARE`等はREPEATABLE READ/SERIALIZABLEでsnapshot後に更新済みの行に40001を返し得る。通常SELECTや`FOR KEY SHARE`を同等と見なさない。READ COMMITTEDの待機後再評価も検証が必要。
- 制御行だけのlocking readでは、controlを変更せず終端化するoperationの古いsnapshotを安全に扱えると証明できない。operation状態・epoch・権限の読取りも一体で扱う。
- 既に保護writeを実行したtransactionはtransaction advisory lockで待つ。まだwriteしていない古いsnapshotはlock待ち一覧だけでは検出できないため、次回write/受付時に拒否する仕組みが必要。pg_stat_activityの一度の走査を証明の代用にしない。
- 共有→排他lock昇格、業務行lockとの順序、複数接続の同時BEGIN/COMMIT/ROLLBACK、starvation、接続切断・再起動、poolでのtransaction再利用、40001後のtransaction全体の再試行を検証する。今回これらの安全性を証明していない。
- freeze完了はCOMMITを境界とする。registry=0、cron停止、timeoutだけではpre-gate処理をdrainedにしない。observable server evidenceとoperator reconciliationを停止epochへ結び付け、未確認なら拒否する要件を維持する。

PostgreSQL 17の根拠：[Transaction Isolation](https://www.postgresql.org/docs/17/transaction-iso.html)、[Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html)。
これらは設計候補の根拠であり、Misakiの実装検証やProductionへの施工許可ではない。

> **最新判定：BLOCKED（2026-09-19追加inventory監査）**
> public 22テーブルと現行guard 12の差分10を確認し、auth.usersのSECURITY DEFINER triggerから
> user_entitlementsへwrites_frozen中に書ける新たな反例を隔離DBで実証した。
> 下記の「認証・ログインを一律停止しない」とfreezeの境界も未解決。
> 本文の必須9＋存在時3は現行実装の説明であり、全write surfaceの正本ではない。
> 詳細は[write surface inventory監査](WRITE_SURFACE_INVENTORY.md)。停止条件に従い、この追加監査では機能コードを修正していない。

**次回の必須設計:** write surface inventoryを正本としてcoverage差分を検査する。
SECURITY DEFINERもfreeze境界の外ではない。pre-gate証拠未確認ならfreeze禁止。
旧RPCや認証triggerのwriteはアプリ側の受付だけでは捕捉できず、導入前処理は新registryにも存在しないためである。
coverage自動検査と停止epochに結び付くpre-gate証拠機構は、現時点では未実装。

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


## 2026-09-19 再監査結果：BLOCKED（実装変更を停止）

### 基準と隔離実証

main `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`、PR #30 `69e7d5c679548f9fd4d29ff90e73850f2d643930`、PR #29 `fd4b6e78e0a79dc05ebed46f82baf205f53cca23` をGitHubから再取得。PR30公開tree `a4d5053db482a1ae270f4a85afb7c1528166b3cb` とローカル検証treeは一致。
本番PostgreSQL 17.6のcatalogをBEGIN READ ONLYで取得。ユーザー行は取得・更新しない。隔離試験はloopbackのみのPostgreSQL18.4。

公開旧RPCの到達先2テーブルが `aaa_misaki_legacy_drain` の対象にない：

| RPC | 対象テーブル | 実稼働の権限 |
|---|---|---|
| claim_user_evolution_analysis(text,integer) | misaki_evolution_analysis_state | postgres所有SECURITY DEFINER、authenticated/service_role EXECUTE |
| consume_proactive_message() | proactive_message_usage | postgres所有SECURITY DEFINER、authenticated/service_role EXECUTE |

両テーブルはRLS有効、authenticatedはSELECT policyのみでINSERT権限なし。しかし上記RPCは所有者権限で書き込む。
取得したcolumn/type/default、NOT NULL、PK/FK/CHECK、RLS、policy、ACL、RPC本文をこの2対象へ再現した。
既存PR30設備をinstallし、stop_admission→fixtureのBody Clock証拠→freezeを実行。
別のBEGINでauthenticatedの恒久ユーザーcontextを設定し、直接INSERTのpermission deniedを確認後、両RPCを呼んだ結果：

```json
{"evolution_rows":1,"consumed":1,"registered":0,"phase":"writes_frozen"}
```

観測後ROLLBACK。これは凍結違反2件の再現であり、安全性テスト2件のPASSではない。
他のテーブル/authは既存の合成fixtureであり、PostgREST実配送・全trigger・Edge/relay連携の合格を主張しない。
PostgreSQL major versionも本番17と隔離18で異なる。完全な実旧schema統合試験は引き続き未完了。

### pre-gate引継ぎの再評価

現実装は初期open／body_clock_verified=false。verify_body_clock(text)はdrainingと20文字以上の証拠だけを確認し、chat/history/email/evolution/push_testを含む網羅的なpre-gate inventoryをDBで要求しない。
したがってregistry 0件だけでは「導入前処理が残らない」を証明できない。この再監査では新引継ぎ機構を実装・実証していない。

次の設計・試験が必要（未実装、施工許可ではない）：

1. 初期値未確認のpre-gate barrierと、停止epochに結び付くinventory／証拠／未解決項目を持たせる。Body Clock証拠だけで解除しない。
2. 旧chat・browser後続保存・history/email・Edge・relay・evolution・push_testごとにruntime/deployment識別、観測区間、受付遮断の証拠、invocation/requestとusage/delivery/attemptの対応を記録する。
3. cron inactiveは必要条件に限定。古いdeployment URLや既開始実行、ログ保持切れ／識別不能／遅延browser保存の存在可能性を除外できないときはinventory未完了のままにする。
4. 各項目の保存・refund・配送等の実結果を確認して終了／operator reconciliationを記録する。経過時間、空のログ、lease切れを終了証拠にしない。
5. freezeは同一lock下でpre-gate確認・未解決0・新registry・cron・attemptを確認。reopenと新たな停止で古い確認証拠を無効化する。
6. 旧処理がdraining中にheaderなしでrefund/saveへ戻るとguardに拒否されるため、受付遮断と継続権限の安全な引継ぎ、または証拠付きoperator修復まで具体化する。証拠登録だけで失われた保存/refundを解決扱いにしない。

### この再監査で完了した検証と停止理由

- PR30既存52/52成功。実PostgreSQLの18件（複数接続lock競合・BEGIN/ROLLBACKを含む）、実handler＋安全stub、browser試験を再実行。
- PR29既存52実テスト成功（Node表示53のうち1件は空module）。PR29は変更なし。
- PR30 TypeScript、Deno check（キャッシュ利用・no-remote）成功。
- 追加監査2件で凍結違反を再現。既存104実テストの成功と追加2反例を混同しない。
- 実旧emotion/action/cadence trigger定義、RLS/policy/ACLは取得したが、それら全体を接続したAPI→DB→Edge→relay試験は未完了。

依頼の「指定テストgreenでも全体矛盾を見つけたらBLOCKEDで停止」に該当するため、実装の追加・修正を停止。今回のbranch変更は総覧と本文書の監査記録のみ。
Production migration/deploy/merge/cron、PR29変更、実Gemini/Push/メール、有料資源作成は実施していない。
CI/Previewが成功しても上記反例は消えない。guard到達先の再棚卸しと2 BLOCKERの実証が終わるまで先行導入不可。

## 2026-09-19 続行監査：guardのsnapshot整合性もBLOCKED

PR30 `fb25649e836a3fa9681fa0bbe168cbae42018abf` から再開。main/PR29のHEADは変化なし。
停止前のREPEATABLE READの読取りsnapshotから、freeze完了後・registry=0でもguard付きbackground_push_stateをservice_roleが更新できた。fresh snapshotの同一writeは拒否される。隔離DBでROLLBACKして初期値0へ戻ることを確認。

共有advisory lock取得だけでは古いMVCC snapshotの制御行openを更新できない。guard設置数を保護済みsurface数と扱わない。停止前snapshotを含む複数sessionの実write拒否もcoverageの成立条件に追加する。
要件の停止条件に従い機能修正は中止。追加の `tests/legacy-drain.db.test.cjs（末尾のsnapshot回帰）` は拒否を要求するため現実装でFAILし、CIの既存globにも含まれる。既存104実テストとTypeScript/Deno成功を上書きする安全性BLOCKERとして扱う。

既知3漏れ、全surface coverage diff、停止epochに結び付くpre-gate証拠、旧browser save/refund引継ぎ、全旧Production境界の統合検証は未完了。新たなallowlistやfreeze解除策は追加しない。詳細な順序・対照試験・限界はWRITE_SURFACE_INVENTORY.mdの続行監査を参照。
Productionはversion/profiles定義のREAD ONLY取得のみ。施工・mergeは行っていない。

## 2026-09-20 GATE 1限定：barrier寿命の反例で停止

**GATE 1：BLOCKED。PR #30を本番へ先行導入する準備：BLOCKED。**

開始時にGitHubのmain `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`、PR30
`1867caed8dcd67f4d1f8bac275acd4f1834aef0c`（tree `38caf5e6faeb35374b49bf38cbb5084ef1925954`）、
PR29 `fd4b6e78e0a79dc05ebed46f82baf205f53cca23` を再確認した。
総覧・本運用文書を再読。GATE 2以降には進んでいない。

### 候補実装と実証

`tests/legacy-drain.db.test.cjs` の候補2件は、隔離DBに限ってguard/admitの先頭へ
共通のshared transaction advisory barrier `(1296646475,31)` を挿入する。
既存の内部lock `(1296646475,30)` より先に取得し、operatorはdrain後、競合するexclusive
barrierを取ってからfreezeする。controlはphase/epoch/監査の記録を維持する。
これは不採用候補の最小破壊試験であり、配布用SQL・API・Edgeの実装変更ではない。
協調callerがsnapshot前にsharedを取得する経路の完成を主張しない。

非協調callerの必須攻撃を、別々の物理connectionで実行した：
`BEGIN REPEATABLE READ → background SELECTでsnapshot確定（barrier未取得） →
別connectionでfreezeをCOMMIT → 初めてguard/admitへ到達してshared取得`。

| 候補 | 物理lockの観測 | 古いsnapshotの結果 |
|---|---|---|
| transaction exclusive | freeze中は保持、COMMIT後は0件 | UPDATEで99へ変更、新規operation受付も成功 |
| session exclusive | freeze COMMIT後・別transactionのROLLBACK後も保持。別connectionのtry-sharedはfalse。保持connection切断後は0件 | phaseはwrites_frozen/epoch=1のまま、UPDATEと新規受付が成功 |

新規READ COMMITTED接続からの同じUPDATE/受付はどちらも55000で拒否される。
新規候補試験のwrite/受付はそれぞれROLLBACKし、observerでpoints=0、operations=0、
phase/epoch不変をassertした。候補試験はCOMMIT後の永続化までは主張しない。
既存受付回帰は引き続き合成operationのCOMMITと古いepoch=0を実証し、削除後0件を確認する。
既存2件の拒否期待値は変更・削除していない。新候補2件も拒否を期待しFAILにする。

**新しい反例はsession保持接続喪失で物理閉鎖だけが消え、古いsnapshotから両入口へ
侵入できること。** 接続喪失を安全なresumeと扱えない。発見時停止条件に従い、
機能修正を停止し、回帰テスト・文書・PG17比較用CIのみを残した。

### 設計上の結論と未証明事項

- xact exclusiveのCOMMITはfreeze期間全体の閉鎖ではない。通常SELECTのopen判定へ戻すだけでは不十分。
- session exclusiveも接続切断後のfail-closedを証明できず不採用。専用connection維持だけで安全とはしない。
- poolのphysical connection再利用、二重freezeの再帰lock回数、unlock漏れ、別connectionからのresume、stale operatorのepoch/所有権検査は未実装・未検証。
- session lockはROLLBACKで解放されないため失敗したfreezeでも残り得る。今回は保持の事実だけ確認し、復旧protocolは実装していない。
- 新barrier→既存lifecycle lockという試験順序は全体のdeadlock-free証明ではない。業務行lock、共有→排他昇格、待機transaction、deadlock/starvation、二重freeze/resumeの検証は残る。
- backend crash/サーバー再起動は未実行。今回の接続終了は正常切断であり、強制crash試験と同一視しない。
- SERIALIZABLE比較、snapshot前shared取得あり、freeze待機中/解除後の全組合せは停止条件により未実施。
- controlのMVCC可視phaseを最後の安全境界に戻さない。永続的なfencing/古いtransactionの拒否と物理barrierの組合せを次回設計する。40001の自動retryをusage/refund/Pushに導入していない。

根拠：[PostgreSQL 17 Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS)。
session lockの寿命はtransactionから独立し、session終了で解放される。文献だけを安全証明にしない。

### 検証範囲

ローカルは利用可能な隔離PostgreSQL 18.4・loopbackのみ。既存52件PASS、既存安全性2件FAIL、
候補安全性2件FAIL。17系のローカル実行環境はなく、CIに17.6/18.4の独立matrixを追加し、
一方の失敗で他方をcancelしない。CI結果はcommit後に別途確認する。
Productionへの接続・変更、有料branch、実Gemini/Push/emailは一切なし。
GATE 2（既知3漏れ・全surface監査）以降、pre-gate、統合実証は未着手。

