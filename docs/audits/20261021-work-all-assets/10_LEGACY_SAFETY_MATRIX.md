# legacy修正・以前の反例・試験範囲の対応表

基準: `9e3f787` の08追補。対象枝HEAD `17449c7ec4e8ff50605ef931b04ae76584c6304f`。**BLOCKED維持。本番適用・SQL実行・安全性コード変更なし。**

## 修正の射程

`supabase/legacy-maintenance-drain.sql` Blob `258a2a90c9f16f4ba77545601af20de07f48a18d`。変更はcontrol行SELECTの3か所に `FOR SHARE` を加えたもの。advisory lockの取得自体がsnapshotを刷新するようになったわけではない。

| 以前の問題 | 修正との対応 | 対応試験・現在の証拠 | 未検証・留保 |
|---|---|---|---|
| 停止前REPEATABLE READからguard付き業務writeが通る | `guard_write` のcontrol読取りがlocking SELECTへ | `freeze rejects a protected write from a pre-stop REPEATABLE READ snapshot`。同じtable/roleのfresh接続は55000拒否、stale接続も55000又は40001で拒否を要求しROLLBACK後の値0を確認。PG17.6/18.4のHEAD実CIでok。 | stale側で実際にどちらのSQLSTATEが発生したか、成功ログは出力していない。40001だったと断定しない。全table・全isolationの証明ではない。 |
| 凍結後に古いepochで新規operationをCOMMITできる | `admit_misaki_legacy_operation` のcontrol読取りを変更 | `freeze rejects new operation admission from a pre-stop REPEATABLE READ snapshot`。fresh55000対照、stale55000/40001要求。旧反例ならCOMMITされた行もcleanupする試験。両PGでok。 | 全入口・全旧runtime・実PostgRESTからの到達を検証したものではない。 |
| transaction barrierがCOMMITで消え、古いsnapshotからwrite/受付 | 候補barrierを追加したfixtureでも、現行のrow-lock修正が共通で効く構造 | `candidate transaction barrier must reject late stale write AND admission`。fresh接続対照、write/受付両者の55000/40001、rollback後データ不変を要求。両PGでok。 | transaction barrier方式全体の採用承認ではない。成功の要因を候補barrierだけに帰属させない。 |
| session barrierが接続終了で消える | 同上。行ロック修正後の試験で拒否条件を維持 | `candidate session-disconnect barrier must reject late stale write AND admission`。session lockのCOMMIT/ROLLBACK後保持、holder終了後の消失、古い接続からの2入口拒否を要求。両PGでok。 | 正常disconnectはbackend crash・サーバー再起動と異なる。専用sessionを保つだけで安全という設計にはしない。 |
| require_operationによる継続処理の古い制御読取り | `require_operation` もFOR SHARE化 | capability/owner、old browser保存、refund、unknown継続の既存試験は同じSQLを利用。 | 専用のstale snapshot require_operation試験を今回特定していない。3か所すべてを独立に網羅したとの表現を避ける。 |
| Evolution受付の未guard write | 今回3行修正はtable guardの対象を追加しない | SQLの必須9＋optional3の対象に `misaki_evolution_analysis_state` なし。旧inventoryに反例記録あり。 | 現在の本番での発生は再検証なし。最新CIによる解消証拠なし。 |
| 旧proactive usage RPCの未guard write | 同上 | `proactive_message_usage` はguard対象なし。旧consume RPC定義が枝に残る。 | ソースのGRANT/実到達/実DB状態は別照合。 |
| auth.users→SECURITY DEFINER→entitlement作成 | 同上 | `user_entitlements` はguard対象なし。旧inventoryの認証trigger反例を保存。 | signup/loginとの製品境界も未決。一律guardを足すと認証を止め得るため今回修正しない。 |
| pre-gateの旧処理がregistryにいない | FOR SHAREは未知処理の棚卸しを追加しない | 初期phase=open。`verify_body_clock` は20文字以上の証拠とdrainingを確認するが、全経路inventoryを強制しない。 | epoch付き証拠、旧browser遅延保存/refund、旧deployment/Edge/relayの終端確認は未完了。 |

## CIが示す範囲

run `35470658292`、job `105970897567`（17.6）/`105970897363`（18.4）。各56 pass / 0 fail / 0 skip。workflowは `node --test tests/*.test.cjs`、TypeScript、Deno checkを実行。今回それを再実行したわけではなく、保存された実ログと固定HEADのソースを照合した。

56はDB試験だけの数ではない。ブラウザのメール保存/切替/復旧14件、maintenance browser3件、DB22件、Edge stub3件、route stub14件の構成として、試験コード・実ログの名前を対応付けた。入れ子suiteの見出しを余分な実ケースに数えない。

DB fixture `tests/legacy-schema.fixture.sql` Blob `bc88403fa9f22920ed13d70bc252e187d1ac89ee` は簡略化された旧schema。全testsを文字列検索しても上記3つの未guard対象テーブル名は出現しない。したがって、56件成功はその3反例の修復確認ではない。

## 残る制御読取りと運用操作

`freeze` のcontrol SELECTは通常SELECTのまま。ほかにstop/verify/reopen/reconcile等の運用書込みがある。すべてadvisory lockとSQLトランザクションの組合せを持つが、これだけで古いoperator snapshot、二重freeze/resume、lock順序、pool再利用、deadlock/starvationを安全と判定しない。別の反例を実証したとも主張しない。

40001を通常利用に自動retryする設計も今回追加していない。usage/refund/Push等の副作用を再実行するなら、冪等性と終端証拠の検討が先。

## 後続監査の完了条件

1. row-lockで拒否される4ケースのSQLSTATEを、安全な隔離試験で個別記録できる計画を作る。
2. 全write surfaceを対象/明示除外/未分類へ分け、旧3反例を含む最終table到達を検証する計画を作る。
3. pre-gate inventory、停止epoch、継続保存/refund、reconciliationの契約を文書化。
4. 初期schemaやruntimeの違いを揃えたAPI→DB→Edge→relay統合、crash/pool/isolationを別ゲートとして残す。
5. 全条件をレビューするまでBLOCKEDを解除せず、ブランチ統合・削除はユーザー承認を得る。
