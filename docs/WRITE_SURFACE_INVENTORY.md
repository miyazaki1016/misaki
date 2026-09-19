# PR #30 write surface inventory — 2026-09-19

**BLOCKED。これは取得済みcatalogと追加反例の監査記録であり、coverage修正の完成報告ではない。**

基準をGitHubから再取得：main `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`、PR30 `f09a6b5746274ab6e863515897d17cdd5ba50474`、PR29 `fd4b6e78e0a79dc05ebed46f82baf205f53cca23`。
PR30の106ファイルは公開tree `4e4c1fe9fa8854a4d6fe360f094ef7667f3c8bfe` とblob単位で照合。PR29の114ファイルも公開treeと照合した。

## 取得範囲と機械抽出

Productionには `BEGIN READ ONLY … COMMIT` のcatalog SELECTのみを実行した。ユーザー行、会話、メール、Push購読、Vaultの値、cron command、秘密を含み得る設定値は取得していない。

- `pg_class` / `pg_namespace`：system catalog / toastを除く79 relation（table、partitioned table、view、sequence等を含む）。79件すべてがMisaki業務write先という意味ではない。
- public：22通常テーブル、4 sequence。private：1通常テーブル。
- public/private `pg_proc`：26 routine（うちSECURITY DEFINER 20）。本文そのものを取得せず、owner、ACL、language、signature、本文hash、DML語・EXECUTE語の有無を取得。
- DML語あり18 routine。これは候補抽出であり、SQL parserでも完全な到達解析でもない。SELECTが副作用関数を呼ぶ場合などを除外できない。
- public上の業務trigger 5、auth.usersからpublicへのtrigger 1。全6件の接続先functionとenabled状態を取得。
- public/private policy 29、全role属性31、membership 24、default ACL 27。
- public/private routine、およびpublic/private/authの非internal triggerを起点にpg_depend 67行。PL/pgSQL本文内の依存をpg_dependだけで網羅できるとは扱わない。

後述の反例に限り、user_entitlementsの7 column、5 constraint、RLS/policy、ACL、2 trigger、2 function本文を追加取得し隔離DBに反映。その他全実schemaを再構成したわけではない。

## public tableと現行guardとの差分

対象はcatalogから列挙した22テーブル。guard欄はPR30 SQLの必須9＋存在時3と突き合わせた結果。手書きリストを発見母集団として使っていない。

| 分類 | テーブル | 現行guard |
|---|---|---|
| chat usage / refund | daily_message_usage, daily_message_requests | 2/2 |
| 関係・会話・trigger連鎖 | misaki_relationship_state, misaki_relationship_events, misaki_user_conversation_state | 3/3 |
| Body Clock / relay / Push | background_push_state, misaki_proactive_deliveries, misaki_body_clock_push_attempts, push_subscriptions | 4/4 |
| evolution | misaki_user_relationship_traits, misaki_evolution_candidates, misaki_evolution_history | 3/3 |
| evolution受付・旧proactive usage（前回反例） | misaki_evolution_analysis_state, proactive_message_usage | **0/2** |
| persona / prompt設定 | misaki_persona_versions, misaki_prompt_modules | **0/2** |
| entitlement・認証trigger（今回反例） | user_entitlements | **0/1** |
| 配送設定 | background_push_config | **0/1** |
| 到達性・現役用途をさらに分類すべき旧table | conversations, memories, profiles, work_logs | **0/4** |
| 合計 | public 22テーブル | **12/22、差分10** |

private.background_push_configも未guard。publicの4 sequence、auth/storage/realtime/net/cron/vault等のプラットフォーム関係も、未分類のまま安全な除外と見なさない。
public 22テーブルはすべてservice_roleへのDML権限がcatalog ACLに存在する。ただしこの数は、各API経由の実到達や全tableでの違反を実証した件数ではない。

アプリはpersona/prompt設定とentitlementを読み、会話・Body Clock・Free/Premiumの動作へ使う。旧tableの現行ソース参照がなくても、公開権限や旧RPC/旧deploymentからの到達性を調べずに対象外にしない。

## 新しい実DB反例：認証trigger

```
auth.users INSERT
  → on_auth_user_created_entitlement (AFTER INSERT FOR EACH ROW)
  → public.handle_new_user_entitlement() (SECURITY DEFINER / postgres)
  → public.user_entitlements INSERT (plan = 'free')
```

実Production定義のuser_entitlements、RLSの本人SELECT policy、ACL、trigger/functionを隔離PostgreSQL18.4に再現した。auth.users自体とその他tableは合成fixture。
旧PR30設備をinstallし、stop_admission、隔離fixture用Body Clock証拠、freezeの順でwrites_frozenへ進めた。
新しいBEGIN内でローカルoperatorが合成auth.usersへ1行追加した観測：

```json
{"phase":"writes_frozen","operations":0,"entitlements":1}
```

ROLLBACK後のentitlement 0件もassertした。実GoTrue/signup/PostgRESTは呼んでいない。本番ユーザーでは再現していない。
SECURITY DEFINER関数のEXECUTEをauthenticatedに許可していなくても、authからのtrigger経由で書ける点が重要。最終書込先のguardが必要である。

一方、user_entitlementsに一律guardを付けるだけでは、freeze中のauth.users INSERTも同じtransactionで失敗する。「認証・ログインを一律停止しない」という既存要件との境界を設計する必要がある。
既存ユーザーのログイン、匿名ユーザー新規作成、メールアカウント新規作成を区別し、entitlement作成を拒否するのか、業務状態から明示的に除外するのか、別の受付/終端ルールにするのかを未決定のまま施工しない。

要件8の「別のwrite漏れや全体矛盾を見つけたらBLOCKEDで停止」に該当するため、この反例確認後は機能修正を停止し、監査文書だけを追記した。前回2経路も未修正。

## coverage自動検査の必要設計（未実装）

**write surface inventoryを正本としてcoverage差分を検査する。SECURITY DEFINERもfreeze境界の外ではない。**

理由：人が記憶しているテーブル名の追加方式では、旧RPC、認証trigger、別schema、後日追加されるroutineを見落とす。DBの到達先と権限を母集団にし、各対象の分類、guard、明示除外理由、実行証拠を突き合わせる必要がある。

次回実装で必要な検査：

1. relation/routine/trigger/policy/ACL/default ACL/membership/依存のsnapshotと承認済み分類を比較。新規・変更・消失を未確認としてfail closedにする。
2. guardは名前の存在だけで判定しない。正しいfunction、BEFORE STATEMENT、INSERT/UPDATE/DELETE/TRUNCATE全event、無条件、enabled状態、partition/FK連鎖の実動作を検査する。
3. 他schema・view/rule・sequence・extension副作用・DDL/trigger無効化権限は別分類し、対象外なら理由と脅威境界を明記。安全を未証明の対象を便宜的allowlistへ入れない。
4. SECURITY DEFINER/RLS bypassはDML trigger自体を自動で無効化する意味ではない。実owner/role/headerで最終table guardが発火することを隔離DBで検証する。
5. CIは隔離schema＋metadata fixtureで、運用検査は新たなREAD ONLY snapshotでcoverage driftを拒否する。snapshotの陳腐化も検査対象にする。

現時点では上記の自動検査・CIゲートを実装していない。12/22の照合だけで将来driftを検知できるとは主張しない。

## pre-gate evidence（未実装）

**pre-gate証拠未確認ならfreeze禁止。** 初期状態は未確認。停止epochが変わる/reopenするたび、以前の確認を無効化する。
registry=0、cron停止、timeout/lease期限、空ログを証拠の代用にしない。導入前処理がregistryに存在しないことこそ、この別barrierが必要な理由である。

必要な証拠は、runtime/deploymentと受付遮断・観測可能区間、invocation/requestとusage/delivery/attempt/evolutionの対応、保存/refund/配送の終端、未確認項目とoperator reconciliation。
旧browserの後続save/refundをdrainingで単純拒否して解決済みにしない。安全な継続権限引継ぎまたは実結果を確認した修復が必要。識別不能な旧処理はfreeze拒否を維持する。
現在のverify_body_clock(text)だけでは全経路を強制確認できず、pre-gate BLOCKERは残る。

## 検証結果と未完了範囲

- PR30既存52/52成功。DB18件に複数物理sessionの競合とBEGIN/ROLLBACKを含む。
- PR29既存52実テスト成功（runner表示53には従来の空module項目1件を含む）。PR29変更なし。
- TypeScript / Deno check成功。追加監査1件は新たな違反の再現であり、安全性PASS件数に足さない。
- 本番はPostgreSQL17.6、隔離は18.4。全旧RLS/RPC/emotion/action/cadence triggerの再構成、実PostgREST header境界、実API→DB→Edge→relay、全phase横断の統合実証は未完了。
- 既存handler試験の外部stub成功と実DB連携成功を混同しない。CI/Previewがgreenでも、この反例は解消しない。

Productionへのmigration/deploy/merge/cron操作、実Gemini/Push/email、有料資源作成は行っていない。

**PR #30を本番へ先行導入する準備：BLOCKED**

## 2026-09-19 続行監査：guard済みtableの古いMVCC snapshotから凍結迂回

**新しい反例を再現したためBLOCKED。機能修正は停止し、失敗する安全性回帰テストを追加した。**

再取得したmainは `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`、PR30開始HEADは `fb25649e836a3fa9681fa0bbe168cbae42018abf`、PR29は `fd4b6e78e0a79dc05ebed46f82baf205f53cca23`。総覧・本書・LEGACY_MAINTENANCE_DRAIN・PR29のSERVER_CANONICAL_STATEを再確認した。

### 再現した順序と証拠

`tests/legacy-drain.db.test.cjs（末尾のsnapshot回帰）` はloopback専用の使い捨てDBを作り、PR30の設備SQLをそのまま適用する。合成旧schemaのguard対象 `background_push_state` に初期値0を作る。

1. service_roleの接続Aで `BEGIN ISOLATION LEVEL REPEATABLE READ`。通常のSELECTで停止前snapshotを確定する。この時点では業務writeも共有advisory lock取得もない。
2. operator接続Bでstop_admission → 隔離fixture用verify_body_clock → freezeをそれぞれ確定。
3. Bから `phase=writes_frozen, epoch=1, operations=0` を確認。
4. 新しい接続Cの同じservice_role・同じtableへのUPDATEは55000で拒否される（guard存在の対照試験）。
5. Aの古いsnapshotからのUPDATEは拒否されず、`relationship_points=99` をRETURNINGで観測。
6. AをROLLBACKし、Bから値が0のままであることをassert。

```json
{"current":{"phase":"writes_frozen","epoch":"1","operations":0},"changed":[{"relationship_points":99}],"rollbackConfirmed":true}
```

これは未guard tableの追加漏れとは別の反例。`guard_write()` は共有advisory lock取得後、制御行を通常SELECTで読む。lock取得はMVCC snapshotを更新しないため、Aでは過去の `phase=open` が見える。停止前に書込みをしていなかったAはfreezeのlock待ち対象にもならない。

### 判定・分類への影響

- 既存の「guard付き12/22」は設置数であり、安全性を証明した12件という意味ではない。この反例によりguard設置・event・enabled確認だけでcoverage済みに分類するのは不十分。
- 将来のcoverage承認には、停止前snapshot、READ COMMITTED / REPEATABLE READ / SERIALIZABLE、別sessionのstop/freeze/reopenと実writeを含むguard動作証拠が必要。
- 制御行のlocking read等による対策は候補であり、この監査では実装も安全証明もしていない。operation検証やbrowser完了を含む全制御読取りを再点検する必要がある。
- 実PostgRESTのtransaction isolation設定やHTTPでの到達性は未検証。今回証明したのは複数の実PostgreSQL接続・service_roleによるDB境界の反例であり、本番HTTPでの発生を主張しない。
- Productionは17.6、今回の隔離DBは18.4。auth/users、RLS等の全Production定義再構成ではない。この反例はPR30の制御行読取りとlock順序に対する試験。

### 追加取得と未完了範囲

ProductionにはBEGIN READ ONLYによるversionとprofilesのcolumn/constraint/owner/ACL/RLS/policy/triggerのSELECTだけを実行。ユーザー行・秘密・会話を取得していない。profilesにはauthenticatedのDML権限と本人を条件にしたALL policy、業務triggerなしを確認したが、profiles書込みの実再現は新反例による停止後には実施していない。これを追加の実証済み違反件数へ足さない。全catalogの最新再抽出・全write surface分類は未完了。

既知3反例、coverage diff自動ゲート、停止epoch付きpre-gate証拠、旧browser save/refund継承、実PostgREST/API→DB→Edge→relayの統合検証は未解消。allowlistは追加していない。

### 回帰ゲートと既存検証

追加テストは「拒否されるべき」をassertし、反例をPASS扱いにしない。既存CIの `node --test tests/*.test.cjs` に自動で含まれ、現在の設備ではFAILする。これは全surfaceのcoverage diff完成ではなく、今回の既知反例を見逃さないための回帰ゲート。

PR30既存52件、PR29既存52実テスト（runner表示53には空module1件を含む）、TypeScript、Denoは今回も成功。DB18件には既存multi-session/concurrencyが含まれる。追加snapshot回帰は1件FAIL、ROLLBACK確認済み。実外部Gemini/Push/emailは呼ばず、Production migration/deploy/Edge/cron/merge、paid branch作成は行っていない。

**PR #30を本番へ先行導入する準備：BLOCKED**
