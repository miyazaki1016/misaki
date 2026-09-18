# 根本状態のサーバー正本化（基礎工事）

実装開始時に再取得した main: `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3`。
正式仕様は IMPLEMENTATION_OVERVIEW.md の0.8とWork引き渡し仕様。今回のPRは本番反映前のレビュー対象。

## 状態と成功ターン

恒久アカウントは `misaki_relationship_state.intimacy_points` がポイント正本、`misaki_user_conversation_state` が履歴・長期記憶・今日の記憶の正本。チャット生成前にサーバーから読み、成功後のサービス専用RPCで履歴・記憶・時刻・+1・監査イベント・利用記録の完了を一緒に確定する。生成中に別端末やBody Clockが会話を更新した場合は上書きせず失敗として扱い、Freeの利用回数を返す。

同じ利用 `request_id` の完了結果は再利用し、再生成・再課金・再加点しない。失敗時の返却は既存RPCを維持し、成功済みリクエストの返却をDBで拒否する。Premiumも成功+1のみ。旧30/80/160の4段階を維持する。

通常会話とBody Clockは恒久アカウントの同じ正本を読む。Pushの配送・予定・通知設定と写真selectorVersion 4、55〜210分の間隔は維持。既存conversation → emotion → action triggerを置き換えない。background_push_stateの旧ポイント・記憶列はサーバー生成の互換スナップショットで、ブラウザの値はDB triggerが上書きする。

localStorageのポイント・長期記憶・今日の記憶を撤去し、履歴は表示キャッシュのみ。キャッシュを自動でサーバーへ書き戻さない。記憶削除や履歴クリアは認証された明示操作としてサーバーに送る。認証・所有者・メール保存の制御マーカーは維持する。

## 合意済みの既存ユーザー移行

オーナーは「サーバー記録から一度だけ移行する」を選択した。移行時に、既存正本・旧サーバーPushポイント・保持履歴の完了したuser/misaki隣接ペア数の最大値を一度だけ設定する。失敗した末尾のuser発言はペアに含めない。ブラウザの数値は取り込まない。

確認時の恒久2アカウントは完了ペア20件／9件、旧サーバーポイント0。履歴は最大60件のため、過去のlocalStorageにだけあった正確な全期間ポイントは復元できない。この近似を承認した移行であり、旧値の完全復元を保証するものではない。移行済み印と監査イベントを残し、通常処理や再同期で移行値を再計算しない。

## 匿名とメール保存

匿名の現在状態は `misaki_temporary_roots` の暗号化トークン・世代・期限をサーバー正本とし、sessionStorageにもAES-GCM認証済みトークンを持つ。クライアントのポイント・記憶・履歴入力は信用しない。現在状態のある同一匿名ユーザーでは古いブラウザトークンよりサーバー状態を優先する。通常会話・明示ロード/編集は24時間の有効期限を更新し、期限切れ・改変を検出した場合はエラーで止める。黙って0へ戻さない。Safariの一時的な匿名ID差し替えでは有効なサーバー認証済みトークンで新IDの一時状態を開始できる。恒久アカウントはこのトークンを使用しない。一時状態テーブルはRLS有効、service_role専用で、ブラウザの読み書き権限を与えない。

応答紛失・同時再送を処理するため、既存daily_message_requestsに暗号化された期限付き応答とメッセージ・親トークンのハッシュを記録する。この不変レシートは再送の応答専用であり、編集・自発配送後の現在状態へ巻き戻すためには使わない。匿名チャットの通常完了はメール保存要求まで恒久的な平文会話・関係正本行を作らない。暗号化一時状態を別に保持する理由は、レシートだけでは通常会話後の明示編集・自発配送を含む現在状態を表せないため。

メール送信直前に `email_save_checkpoint` へ最新の検証済み状態を保存する。メール送信失敗後の再保存・確認待ち中の再保存も同じチェックポイントを更新する。以後の成功通常会話・明示編集・自発配送は、チェックポイントも同じトランザクション内で更新するため、確認前に続けた会話は再保存しなくても引き継がれる。応答紛失中のメール保存は完了記録を確認した上で最新の現在状態を読む。匿名→恒久変換は既存認証の同一ユーザーIDを維持する仕組みに従い、一度恒久化したアカウントへの匿名状態再取り込みを拒否する。

オーナーは匿名Body Clockについて「検証済みの一時状態がある間だけ続ける」を選択した。同じ暗号化一時状態からポイント・履歴・記憶を読み、期限切れ・未保存・改変の場合は文章生成・写真選択・配送を見送る。配送RPCは配送記録・次回予定・日次回数・更新された暗号化一時履歴・メールチェックポイントを原子的に確定する。Body Clockは一時状態の期限を延長せず、自発送信だけで匿名利用を無期限化しない。匿名はUUID世代、恒久は会話updated_atで生成中の変更を検出し、競合した配送は記録・回数・Pushを進めない。古いブラウザ由来スナップショットやレシートへ戻らない。Body Clockの既存配送記録は維持する。

匿名履歴には通常会話と自発メッセージを時系列で保持し、自発送信を通常チャットの次の生成にも使う。自発送信によるポイント加算や通常会話の利用回数消費は行わない。既存の恒久conversation→emotion→action triggerと、匿名チェックポイントでemotion推論を行わない互換動作は維持する。

## 検証と本番反映

回帰テストは認証・メール保存順序・ユーザー切替・別端末読み込み・クライアント改変拒否・Free返却・Premium+1・再送・匿名期限・Body Clockの文章/写真/Push経路を対象とする。DBの合成ユーザーテストは提案migrationと一緒にBEGIN/ROLLBACKで実行し、権限/RLS・一度だけ確定・返却・旧閾値・既存emotion trigger・メール変換を確認する。実際のメール送信・有料契約・端末Pushはテストで発生させない。

このPR作成時点では本番migration適用・Edge Functionデプロイ・mainへのmergeを行わない。VercelビルドのSuccessと、本番DBへ実際に新APIを接続した検証は別である。既存middlewareは.vercel.appを本番ドメインへ308転送するため、Previewを開いて本番の動作をPreview検証と誤認しない。

反映時は旧アプリが利用している書き込みRPCの権限撤去を含むため、DBだけ先行適用しない。下記の「停止設備先行導入→受付停止→drain→凍結→checkpoint→DB/アプリ/Edge整合→検証→再開」の順序を正式手順とする。service_roleキーはサーバー専用で、VercelとEdgeの同じSupabaseプロジェクトの設定を確認する。切替後は古いクライアントの再読み込みとiPhone実機確認が必要。

## 本番切替前の安全設備（2026-09-18）

開始時に再取得したmain/PR HEADはそれぞれ `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3` / `61569a9ba9808b79a32d5c29ee911a07266f07d8` と一致。Productionの固定API接続先は `tzozajnwznxqgxnjikoy`。バックアップ・SQL接続・Vercel・Edgeが同じ対象であることを切替直前にも再確認する。

### 正本・ON/OFF・書込み経路

`supabase/maintenance-gate.sql` は旧mainのDBに独立して導入する前提の設備SQLであり、今回本番へ適用しない。`misaki_maintenance_control(id=1)` はRLS有効、anon/authenticatedは読書き不可、service_roleもSELECTだけ。操作関数は非公開 `misaki_operations` に置き、postgres運用者だけが実行する。クライアントへservice_roleや操作権限を渡さない。毎リクエストAPIから非キャッシュで読む。未導入・欠落・読取り障害・5秒timeoutは `503 MAINTENANCE_UNAVAILABLE` で安全側に止まる。

以下は正式切替枠でのみ実行するSQL。各操作は短い独立トランザクションでCOMMITし、切替全体を一つの長いトランザクションにしない。

```sql
select misaki_operations.set_maintenance(true, false); -- 受付ON、開始済み処理のdrain
select misaki_operations.set_maintenance(true, true);  -- drain確認後、DB書込み凍結
select id,enabled,writes_frozen,changed_at from public.misaki_maintenance_control;
-- 正式検証後だけ解除する
select misaki_operations.set_maintenance(false, false);
```

停止対象:

| 経路 | 入口での扱い | DB凍結時の防壁 |
| --- | --- | --- |
| `/api/chat`、`/api/chat-proxy`、base routeの直接POST | 本文解析・認証・正本読取り・再送確認より前に503。Gemini、usage、relationship、conversation/memoryへ進まない | usage/requests、関係/イベント、会話の全書込みを拒否 |
| `/api/persona/history` POST | 匿名/恒久の明示編集、メールcheckpoint、匿名loadの期限更新と応答回収を503で止める | 同じ正本の書込みを拒否 |
| 旧ブラウザのsync/save/record/append RPC、直接DB更新、管理SQL以外のサービス書込み | 旧main互換の入口設備先行導入が必要。UIだけに依存しない | statement triggerがINSERT/UPDATE/DELETE/TRUNCATEを拒否。旧SECURITY DEFINER RPCでも元のSET ROLEを確認し、postgres所有者になったことで迂回しない |
| Body Clock claim、lazy silence evolution、配送 | 既存cronを別途停止し、開始済みEdge/Push relayをdrainする | relationship/background/deliveryへの書込みは凍結対象。cron停止の代替ではない |
| background通知設定、配送の既読更新 | 凍結中は対象テーブルの更新が拒否される | スナップショットを変えないための一時的制限 |

恒久GET履歴・ログイン・サイト閲覧は入口停止対象外。Authの既存新規ユーザーtriggerはuser_entitlementsへの初期化だけで、今回の凍結対象へ書かないことを確認。Push購読/relay署名・配送attempt、写真selector、emotion/action、evolution traits/candidatesは仕様変更しない。evolutionの管理編集は切替枠では運用上停止し、他の手動運用者/ジョブも正本更新を行わない。ブラウザの通知設定更新は凍結中に一時失敗しても、解除後の既存周期同期で復帰する。

ON開始前に受付済みの会話は完了/refundが必要なので、受付ONとDB凍結を分離する。DB防壁は共有advisory transaction lockを持ち、凍結関数は排他lockで実行中DBトランザクションの終了を待つ。制御行のFOR SHAREにより古いREPEATABLE READスナップショットでも更新済み制御を無視して書けない。これはGemini待ちやEdge実行の終了を自動追跡する仕組みではない。Vercel/Edgeの実行ログと設定された最大実行時間でdrainを確認し、確認できなければ凍結/checkpointへ進まない。待ち時間だけをdrain証明にしない。新規旧RPCは凍結完了後必ず拒否する。

クライアントは `503 {maintenance:true,code,error}` を独立sendError状態として表示し、美咲バブル・usage・memory・relationshipへ適用しない。新規の未受付楽観表示だけ除去して下書きを戻す。応答紛失済みの再送は完了している可能性があるため、既存履歴とpending復元マーカーを維持する。メール保存はmaintenanceを表示してメール送信前に止まる。明示編集も失敗時に正本や表示履歴をクリアしない。

### 未解消の切替前阻害事項

1. 現Production mainには入口gateがない。**このPRの新アプリをDB migration前にそのままProductionへ出して停止する案は不可**（新DB/RPC依存のため）。旧main互換で入口gateとmaintenance応答処理だけを先行導入し、同じ承認枠で設備SQLを導入する独立した作業が必要。今回その作業を勝手に実行しない。
2. 新設備は未導入なので、このHEADのPreviewも通常チャットを安全側503で止める。Preview ReadyはDB/Edgeとの完全連携試験を意味しない。middlewareの本番ドメイン転送も維持する。
3. バックアップ用Postgres接続、暗号化保管場所、隔離復元先と復元リハーサルが未成立なら正式migrationを禁止する。Free Planの自動backupがないことを逆SQLで代替しない。

### 変更対象と手動リカバリー地点

既存変更対象を全行退避する。履歴上限60件だけを取り出す方法や関係ポイントだけの退避は不可。

| 対象 | migrationの変更 / 退避する内容 |
| --- | --- |
| misaki_relationship_state | intimacy_migrated_at追加、恒久全ユーザーの一度だけmax値移行。旧ポイント・level・emotion/action・全時刻を含む行全体 |
| misaki_relationship_events | request_id列・completed request index・email checkpoint index追加、移行監査行追加。既存全イベント/metadataとidentity sequence |
| misaki_user_conversation_state | today_memory追加、旧backgroundから移行。既存履歴・長期記憶・件数・updated_atの全行 |
| background_push_state | snapshot更新trigger追加。旧ポイント/記憶、通知設定、予定、最終配送、日次回数の全行 |
| daily_message_requests / daily_message_usage | completed_at/temporary_result/message_hash/parent_hash追加とindex、完了済refund guard追加。既存requestとrefund証拠・Free/Premium回数を全行退避。観測本番にrefunded_atは既にあり削除しない |
| misaki_proactive_deliveries | 既存配送履歴全行。旧7引数finish RPCを新11引数へ交換するので旧本文/ACLも退避 |
| misaki_temporary_roots | 新規暗号化期限付き正本とgate trigger。初回切替前に存在しないことを確認。既に存在する再工事ではバックアップ対象へ追加し、初回用復旧SQLをそのまま使わない |

追加RPC complete_misaki_chat_turn / complete_misaki_temporary_turn / save_misaki_temporary_state / edit_misaki_conversation_state / write_misaki_temporary_root と2つの新trigger関数、4つの旧RPCのauthenticated EXECUTE撤去、finish RPCの署名変更がスキーマ復旧対象。既存conversation→emotion→action triggerは残す。refund migrationの本文/ACLも現物を保存して復元する。新規gate設備は復旧後も残し、検証までONを維持する。

正式checkpoint手順（今回は実行しない）:

1. old-main互換gateを先行導入・OFF確認。接続projectとProduction/Edge SHA、secretの存在（値を出力しない）、cron job ID/active/予定、旧Edge bundle/configと旧アプリ復帰先を運用記録へ保存。SQL接続はConnect画面のdirectまたはsession poolerを使用し、pg_dumpとserver majorの互換を確認する。[Supabaseの論理backup案内](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)を参照する。
2. 既存Body Clock cronを停止して実行/relayを終了させる。入口ON→チャット/history POSTのdrainとFree失敗refund完了をログで確認→DB凍結ON。旧ブラウザ/恒久/匿名/API直接送信で503、旧直接書込みでMISAKI_MAINTENANCE、usage/ポイント/履歴不変を確認する。authログインと履歴閲覧は確認できる状態を保つ。
3. PGHOST/PGPORT/PGDATABASE/PGUSERと保護されたPGPASSFILEを運用者環境で用意。passwordを引数/ログへ出さない。BitLocker等の暗号化・アクセス制限のある**repo外**の新規ディレクトリを `supabase/canonical-backup.ps1 -CheckpointDirectory <絶対パス>` に渡す。このスクリプトは読取りのみで、schema.dump、7テーブルのdata.dump、展開restore-data.sql、旧6 routineの本文/owner/ACLを復元するrestore-routines.sql、manifest、migration-values、user-kinds、SHA256を生成する。実データはGitへ入れない。
4. `canonical-checkpoint.sql` は全行digest/件数、trigger/RPC/権限/RLS policy/sequence値と恒久ごとの移行前3値・expected maxを記録する。AuthはID/is_anonymousの判定だけでemail/password/tokenを退避しない。schema.dumpはpublic/operations/migration履歴のDDLだけ、data.dumpにはauth・vault・entitlement・Push購読データを含めない。別schemaの改変や追加FK/ジョブを発見した場合は対象を再設計して中止する。dumpに含まれる会話/関数本文も機微情報として扱う。
5. 隔離Postgresに既存auth IDだけの合成参照先と必要なroles/extensionsを用意し、archiveのTOCを確認して旧schema/dataの復元をリハーサルする。スキーマ内のauth/vault参照は隔離stubを使い、ネットワーク送信・cronは実行しない。7テーブルの件数/全行digest、routine owner/ACL、trigger/policy/sequenceを一致させる。続いて提案migration→下記復旧手順→旧manifest一致もリハーサルする。TOC確認だけで復元成功扱いにしない。
6. 凍結中にmanifestを別名で再取得して7テーブルdigestが不変であることを確認する。Authはログイン可能なのでID/is_anonymousは変わり得る。移行対象の変化があればcheckpointを取り直す。切替migrationと移行値検証を一つのDBトランザクションで実行し、migration-valuesにない恒久ユーザーや期待値不一致があればROLLBACKして再取得する。checkpoint完了時刻/ファイルhashと復元試験結果を施工開始条件にする。

### Cutoverと復旧判断

checkpoint成立後だけ、**受付ON/凍結ON/cron停止のまま**レビュー済migrationと期待値検証を原子的に実行し、同一HEADのアプリとBody Clock Edgeをそろえる。新RPC/権限、正本/移行値、旧閾値、履歴/記憶維持、auth/別端末読取りを検証する。通常入口は503のままなので、書込みスモークは隔離環境で済ませるか、別途承認した限定検証枠で凍結解除後に行う。公開入口のままgateをバイパスする秘密headerは作らない。再開枠では処理ログを監視しながらOFF、合成検証アカウントで1成功1加点/Free失敗refund/メール引継ぎ/Push/写真/実機を確認、最後にcronを再開する。

- migration COMMIT前の失敗: 同じトランザクションをROLLBACKし、旧manifest/7引数RPC/ACL不変を確認。旧アプリ/旧Edgeのまま、設備ONを保持して原因を報告する。
- COMMIT後、受付再開前の失敗: 凍結/cron停止を維持。まず失敗時点の追加snapshotを取る。前checkpointとの比較で成功したユーザー会話が存在しないことを確認し、監督承認の下で下記復旧を行う。
- 受付再開後/限定スモーク後の失敗: 即受付ON、drain、凍結、cron停止、障害時snapshot。**切替前dumpの全置換は禁止**。新しい会話・利用記録・匿名トークン・メール確認の差分を保存し、監督がforward fixまたは差分を保持する復旧を判断する。authユーザーを過去状態へ戻さない。スモークの成功データもこの境界に含む。

COMMIT後・未再開に限る具体的復旧（repoの逆SQLだけでは成立しない）:

```sql
-- psql、暗号化checkpointディレクトリから、停止状態を確認して運用者が実行
\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';
select misaki_operations.set_maintenance(true,true);
\i <レビュー済repo絶対パス>/supabase/canonical-recovery-schema.sql
\i restore-routines.sql
-- 復元データに既存emotion/action/snapshot triggerを再発火させない
set local session_replication_role=replica;
delete from public.misaki_relationship_events;
delete from public.misaki_relationship_state;
delete from public.misaki_user_conversation_state;
delete from public.background_push_state;
delete from public.daily_message_requests;
delete from public.daily_message_usage;
delete from public.misaki_proactive_deliveries;
\i restore-data.sql
\i restore-sequences.sql
set local session_replication_role=origin;
-- このトランザクション内で旧件数/digest/RPC/ACL/trigger/policyを照合。
-- sequence SETVALを含むdumpはトランザクションROLLBACKでもsequenceだけ戻らないため、
-- 検証失敗時は旧manifestのsequence値へ戻してから再施工する。
-- 一致しなければROLLBACK。FK整合/sequence next値も確認してからCOMMIT。
commit;
```

この手順は初回切替で新列/新RPCがなかった旧checkpoint専用。復元対象7テーブルの全行・旧routine/権限を退避から戻す。CASCADE/TRUNCATEやauth/vaultの復元を行わない。replica切替権限/追加FK/本番schema差異はリハーサルで事前確認し、失敗したら独断で権限を拡張しない。DDL復旧後もmaintenance設備とそのtriggerは残る。migration履歴は退避を根拠に今回の適用行だけ整合させ、全履歴を削除しない。旧main互換gate付きアプリと旧Edgeへ復帰し、旧RPC署名・Free/refund・認証/履歴を確認した後にだけOFF/cron再開する。生snapshotとroutine復元ファイルは保護保管し、問題解決後に定めた保持期限で破棄する。

### 今回の追加検証と限界

既存42件＋maintenance追加10件、計52件成功。OFF/ON/解除、匿名/恒久×Free/Premium、生成/消費/加点/履歴/記憶への不進行、全history POST停止、欠落制御のfail closed、実sendMessageの既存履歴/下書き/pending保持と美咲返信非保存、メール送信前停止を確認した。アプリTypeScriptを確認した。

設備SQLと `tests/maintenance.rollback.sql` をBEGIN/ROLLBACKで実行し、制御のRLS/SELECT専用権限/操作不可、drain→freeze→解除、service_role/旧definer迂回拒否、旧backgroundのゼロ行UPDATE拒否を確認。書込みは合成temporary probeとトランザクション内設備に限定し、既存本番ユーザーデータは更新しなかった。ROLLBACK後control/operations schemaは不存在、guard trigger 0件、auth 197件・relationship 0件を確認。advisory lockの複数セッション競合と実際のpg_dump復元は未検証で、正式先行導入/リハーサル時の必須チェック。本番snapshot取得、migration、Edge更新、merge、Production切替、cron操作は未実施。

6段階、新ハート、内容ベース加減算、恋愛感情モデル、emotion/actionキーワードtrigger置換、Premium親密度倍率は今回実装しない。

## PR #29 P1修正の検証記録（2026-09-18）

- 既存29件＋追加13件、計42件の自動テストが成功。メール送信失敗→会話追加→saveByEmail再試行、確認待ち→会話追加→再保存→恒久化、通常会話→自発配送→通常会話→次の自発配送→メール保存→恒久化を検証した。
- 応答紛失後に自発配送が進んだ場合の復元・メール保存、チェックポイント後に再保存しない場合の会話/自発配送引継ぎ、明示編集、古い世代の拒否、期限切れ/欠落時に旧レシートへ戻らないこと、Body Clockが期限を延長しないこと、明示ロードが利用回数/ポイントを増やさず期限を更新することも検証した。
- アプリTypeScriptとEdge TypeScript（固定Supabase SDK 2.57.4、Denoグローバルの型定義で確認）が成功。Edgeの暗号化出力を通常チャット側のNode実装で復号し、次の生成のプロンプトに自発メッセージが含まれることを確認した。
- 提案migration、`tests/canonical-state.rollback.sql`、`tests/temporary-continuity.rollback.sql` を合成ユーザーとBEGIN/ROLLBACKで実行し成功。サービス専用権限/RLS、再送が現在状態を巻き戻さないこと、通常会話/配送/チェックポイントの原子性、古い配送で配送件数/予定/日次回数が変わらないこと、古い通常会話のFree refund一度だけ、恒久化後の再取り込み拒否、既存emotion/action trigger・旧閾値、恒久配送の世代チェックと55分下限を確認した。
- ROLLBACK後は一時状態テーブル・新しい完了列・新しい書込みRPCが存在せず、旧配送RPCが残ることを確認。関係行0件・認証ユーザー197件は検証前後で一致した。本番migration適用は行っていない。
- 横断差分レビューで認証/匿名→メール/別端末/Free-Premiumとrefund/会話・長期記憶・今日の記憶/relationship-intimacy/Body Clock/Push/emotion-action/写真selectorVersion 4/55〜210分間隔を確認。自発配送が匿名期限を延長する矛盾は発見して修正し、回帰テストへ追加した。未解消の新しい阻害事項は見つかっていない。
- ローカルNext.js本番ビルドは環境の子プロセス起動制限（spawn EPERM）で実行できない。Vercelビルド結果はPRの最新コミットで確認する。実メール・端末Push・未適用DBと新APIの実動作確認は自動テストの成功とは別で、上記の本番切替手順と実機確認を引き続き必要とする。
