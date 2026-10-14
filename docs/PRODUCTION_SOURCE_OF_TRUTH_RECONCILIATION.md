# 本番基準の管理差分・整合化台帳

最終確認日: 2026-10-13  
対象リポジトリ: `miyazaki1016/misaki`  
基準: **GitHub `main` の本番ソース + 接続先Supabase本番DBの実状態**  
状態: 管理差分の記録。アプリコード・DB・RPC・権限・本番設定を変更するものではない。

## 1. 正本の定義

管理上のずれを直す際は、以下の優先順位を使う。

1. **アプリケーションソースの正本:** GitHub `main`。ブランチ上の提案や未マージPRを、本番実装済みとして扱わない。
2. **DBの実状態の正本:** 接続先の本番Supabaseで読み取った現在のスキーマ、関数定義、GRANT/RLS、migration ledger。GitHubのSQLファイルだけから本番DBの状態を推測しない。
3. **ユーザーが実機で確認した受入結果:** Relationship Engine Ver2置換、メール保存、ログイン後の会話履歴、記憶復元、5軸、3日間の猶予、恋人確定は実機確認済み。これらを未検証扱いに戻さない。
4. **設計・監査ドキュメント:** 上記の正本に合わせて更新する。ドキュメントと実態が食い違う場合、まずドキュメント側を訂正する。ソースやDBの変更が必要な場合は、根拠と影響を分けてレビューする。

本書は、本番機能が正常であることを独自に再証明するものではない。また、読み取り調査の結果は、調査したプロジェクトと時点に限って有効。

## 2. Migration ledger と GitHub main の照合結果

2026-10-13の読み取り比較結果:

| 指標 | 結果 | 正しい解釈 |
|---|---:|---|
| GitHub `main` にあるSQL migrationファイル | 35 | 現在のソースツリー上のファイル数 |
| 本番Supabase migration ledger | 82 | DBが適用済みとして記録している履歴件数 |
| version・nameの組が完全一致 | 11 | ファイル名と台帳が一致する一部の履歴 |
| GitHub側にだけあるversion/nameの組 | 24 | 台帳と完全一致しないソース側エントリ |
| 台帳側にだけあるversion/nameの組 | 71 | 現在のファイル名と完全一致しない台帳エントリ |
| 両方にある同一migration名でversionが異なるもの | 19 | 名前をキーにした追加調査が必要 |
| 同じversion番号なのにnameが異なる組 | 0 | 今回の文字列比較では該当なし |
| GitHub側のmigration名のうち台帳に同名がないもの | 3 | 本番に未適用とは断定できない |
| 台帳側のmigration名のうちGitHubに同名ファイルがないもの | 50 | ファイルがない理由・由来を確認する必要がある |

これらは**migration ledgerと現在のファイル名の文字列比較**であり、スキーマ差分や適用SQLの完全比較ではない。件数差だけを根拠に、本番DBの破損・未適用・余計な適用と結論づけない。

### 確認できた履歴上の例

`20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql` は、GitHubの履歴上、最初に追加された時点ではレガシーv1の実行権限を取り消す内容が中心だった。その後、同じファイルにRelationship Engine v2の関数定義が追加され、コミット説明では本番に適用済みの変更を記録する趣旨が示されている。本番ledger上のversionは `20261003100549`。

この例では、**現在のファイル内容が、最初に台帳へ記録された時点の実行SQLと同一とは限らない**。ただし、これだけで他の差分の原因まで説明できるわけではない。

## 3. ずれの扱いと修正方針

| 差分 | 扱い | 修正方針 |
|---|---|---|
| 本番で確認済みの動作と古いドキュメントの記述が違う | ドキュメント差分 | 実機確認済みの受入記録を正としてドキュメントを更新する |
| 本番DBの定義と現行migrationファイルが違う | 履歴・再現性の差分 | Git履歴と本番定義を比較し、ファイルの後日変更・履歴の移動・別の適用元を特定する。台帳の書き換えや再適用はしない |
| 本番ledgerにあるがmainにSQLファイルがない | 由来未確定 | 旧コミット、ブランチ、過去のソーススナップショットを探索する。根拠が揃うまでは「未適用」「不要」と判定しない |
| mainにあるが本番ledgerと一致しない | 適用状況未確定 | migration名だけで未適用と判定しない。現在のDB定義とSQLの効果を比較してから分類する |
| PRの監査記述とmainの実装が違う | ブランチ／レビュー差分 | PRが未マージであることを明記し、mainを本番ソースとして参照する |
| アクセス権限・RLS・RPCの設計と実態が違う | セキュリティ／契約差分 | 読み取りで実態を確認し、修正案をレビューする。権限変更は別途承認と検証が必要 |

## 4. 変更してはいけない境界

- migration ledgerの履歴を、現在のファイル名やversionに合わせて直接書き換えない。
- 本番migrationを無条件に再適用しない。DBのreset、rebase、履歴の削除もしない。
- Relationship Engine Ver2の本番関数、GRANT/RLS、lease fencing、canonical turn、再試行・重複防止を、管理差分の修正目的だけで変更しない。
- 既存のメール保存・ログイン後履歴・記憶復元・5軸・3日間の猶予・恋人確定を壊す変更をしない。
- 未マージPRの提案を、本番に存在する仕様として扱わない。
- マルチキャラクター用の新しいmigrationは、現行本番DBの状態と依存関係が照合できるまで作成・適用しない。

## 5. 次の整合作業

1. **本番基準の記録を固定:** mainのHEAD、調査対象Supabase project、調査日を記録する。
2. **migrationごとの由来を分類:** 同名・異versionの19件、台帳にだけある50件、mainにだけある3件を、Git履歴とSQL内容から「後日記録」「旧ソース欠落」「実際の定義差」「要調査」に分類する。
3. **重要なRPCの実態を照合:** 関数定義、実行権限、search_path、RLS、呼び出し元を、Relationship EngineとPersona Evolutionなど領域別に記録する。
4. **監査PRをmainに対して整理:** PR #79/#80は提案ブランチの資料であり、mainの正本ではない。内容の重複・古い表現を整理し、必要な結果だけをmain向けのレビュー可能な変更としてまとめる。
5. **差分台帳を継続更新:** それぞれに根拠、影響範囲、修正先、検証方法、完了条件を付け、修正済みと未解決を分離する。

## 6. 現在の状態

- この文書の作成・更新は文書管理のみ。
- 本番DB、migration ledger、アプリコード、RPC、権限、RLS、本番設定、デプロイは変更していない。
- ここに記載した件数は2026-10-13の調査時点のもの。再調査時は再取得する。


## 7. RPC定義とmigration台帳の具体照合（2026-10-13・読み取りのみ）

調査対象を広げたところ、単なるファイル名の不一致だけでなく、**同じRPCを定義する別名・別versionのmigrationがmainに併存するケース**を確認した。

### `get_relationship_time_context()`

GitHub `main` には次の2ファイルがある。

- `20260917023648_phase1_relationship_time_context_rpc.sql`
- `20260917024500_phase1_relationship_time_context_rpc.sql`

どちらも引数なしの `public.get_relationship_time_context()` を定義する。後者は `SECURITY INVOKER` を明示している。台帳には前者の `20260917023648` だけがある。接続先DBには引数なし関数があり、`SECURITY DEFINER=false`、`search_path=public`、実行ロールは `authenticated, postgres, service_role`。関数本文には本人の `auth.uid()` と匿名ユーザー拒否のチェックがある。本文の主な読取・返却ロジックは2ファイルで同系統だが、後者は `SECURITY INVOKER` を明示し、返却時間帯の条件表記などにも差がある。DBの実状態は後者のセキュリティ属性と整合するものの、本文の完全一致・適用経路は未確定。

### `record_relationship_chat_turn(timestamptz, timestamptz)`

GitHub `main` には次の2ファイルがある。

- `20260917023657_phase1_record_chat_turn_rpc.sql`
- `20260917024600_phase1_record_chat_turn_rpc.sql`

両方とも同じ署名のRPCを定義し、読み比べたところ、未来タイムスタンプ拒否、既存時刻を後退させない更新、通常チャットターンのイベント記録、経過秒数の返却という主要ロジックは**両方に含まれる**。したがって、以前の記述「前者には同じ更新ロジックがない」は誤りであり訂正する。2ファイルには整形・書き方とGRANTの差がある。前者は `authenticated, service_role` にEXECUTEを付与し、後者は `authenticated` のみを明示的に付与する。台帳には前者の `20260917023657` だけがある。

接続先DBの同署名関数は `SECURITY DEFINER=true`、`search_path=public`、実行ロール `postgres, service_role`。本文の読み取り照合では、未来タイムスタンプ拒否、時刻の単調更新、`normal chat turn completed` イベント記録、経過秒数返却の4点が存在する。これらは後者だけでなく前者にも存在するため、本文の主要ロジックから後者の適用を推定することはできない。残る差は、本文の正規化比較・セキュリティ属性・GRANT・UUID overloadの出所と適用経路であり、台帳には後者のmigration versionが見当たらない。

### この差分の意味と安全な対応

これは**台帳versionとmain上の複数migration、および本番RPCのセキュリティ属性・GRANT・UUID overloadの由来を照合する必要がある具体例**。未来時刻拒否や単調更新などの主要ロジックは両方の2引数migrationに既に存在するため、それらを根拠に「後続migrationだけが本番へ反映された」とは言えない。どの定義がどの経路で本番へ反映されたかは未確定。

次の手順は、関連コミットの前後差分・適用履歴・本番関数本文を照合し、後続migrationが実際に適用されたことを裏付けられるか確認すること。証拠が揃うまではmigration repair、ledger更新、再適用を行わない。これらのRPCはRelationship Engineの時間コンテキストと会話履歴に関わるため、無条件の再実行はしない。



## 8. 現行mainの呼び出しと本番RPC overloadの不一致（2026-10-13・読み取りのみ）

### main側の呼び出し契約

lib/relationship-time.ts（GitHub main）を確認したところ、現行アプリは次の引数でRPCを呼び出している。

- get_relationship_time_context: { p_user_id: userId ?? null }
- record_relationship_chat_turn: { p_user_message_at, p_misaki_message_at, p_user_id: userId ?? null }

呼び出し契約は、引数なし／2引数版ではなく、p_user_id uuid を含むoverloadを前提にしている。関連変更コミット 269426c4ac6776425269aeb219bcbf99af1fb6bd（“Use explicit server user context for relationship time”、2026-09-30）で、userId が呼び出し元から渡されるようになったことも確認した。

### main migrationと本番DBの照合

現在mainにある関係時間migration 4ファイル（引数なし／2引数版を定義するファイル）には、p_user_id uuid 付きoverloadの定義が見当たらない。一方、接続先本番DBには次の関数が存在する。

| 本番DBの署名 | SECURITY DEFINER | search_path | EXECUTE |
|---|---|---|---|
| get_relationship_time_context() | false | public | authenticated, postgres, service_role |
| get_relationship_time_context(uuid) | true | 空（安全な空search_path） | postgres, service_role |
| record_relationship_chat_turn(timestamptz, timestamptz) | true | public | postgres, service_role |
| record_relationship_chat_turn(timestamptz, timestamptz, uuid) | true | 空（安全な空search_path） | postgres, service_role |

本番のUUID overloadは、呼び出しユーザーと p_user_id の不一致を拒否し、永続アカウントを確認する。UUID付きのchat-turn版には、未来時刻拒否、時刻の単調更新、chat_turn event記録、silence_before_seconds返却も確認できた。アプリはこのUUID付きoverloadを指定して呼ぶため、引数なし／2引数版だけを見て本番呼び出しの全経路を説明することはできない。

### 結論と未確定事項

これは、前節のmigration台帳差分より具体的な本番RPCの由来・再現性の不一致である。

- 確認済み：mainの呼び出し元はUUID付き引数を渡す。本番DBには対応するUUID overloadがあり、EXECUTEは postgres, service_role に限定されている。主要な本人照合・永続アカウント確認も関数本文に存在する。
- 確認済み：mainに存在する現行migrationファイル群は、UUID付きoverloadを再現するSQLの所在を説明できていない。
- 未確定：UUID overloadを作成した実際のSQL／コミット／適用経路、現在mainから新規環境を構築した場合に同じ契約が再現されるか。
- 未実施：DB・ledger・RPC・権限・アプリコードの変更、migrationの再適用。

次は、GitHub全履歴とPRブランチにあるUUID付き関数定義を探索し、実際に本番へ入ったSQLの出所を特定する。根拠を見つけるまでは、既存の関数を作り直したり、GRANTを広げたり、migration ledgerを書き換えたりしない。


## 9. UUID overloadの出所探索・途中結果（2026-10-13）

関連する既存ブランチのmigration一覧も追加で確認した。

- `main`
- `sora/canonical-relationship-integration`（PR #32の統合系ブランチ）
- `sora/relationship-time-v2-design`
- `codex/server-canonical-foundation`
- `sora/relationship-control-rpcs-v1`
- `work/relationship-engine-v1`
- `docs/audit-overview-against-source`

これらのmigration一覧では、関係時間の主要ファイルは引数なし／2引数版の同系統で、`p_user_id uuid` 付きの `get_relationship_time_context(uuid)` と `record_relationship_chat_turn(timestamptz, timestamptz, uuid)` を作るSQLはまだ発見できていない。`sora/relationship-time-v2-design` の `20260920073100_relationship_context_state_version.sql` も引数なし版の再定義であり、UUID overloadの出所ではなかった。

したがって、現時点で有力な仮説は「本番で使うUUID overloadが、現在確認できたmigration群の外から本番DBに追加されたか、SQLの出所を含む履歴がmain／調査済みブランチに残っていない」というもの。ただし、これは未発見に基づく仮説であって確定原因ではない。GitHubの全ブランチ・全コミットを網羅的に証明できたわけではないため、「手動SQL適用」と断定しない。

### PR change-setの追加確認（2026-10-14）

PR #31（関係時間v2）とPR #32（canonical memory統合）の変更ファイル一覧も確認した。PR #31には関係時間のアプリコードと後続のRelationship v2 migrationが含まれるが、`get_relationship_time_context(uuid)` または `record_relationship_chat_turn(timestamptz,timestamptz,uuid)` を定義するmigrationは含まれない。PR #32にもUUID overload定義は含まれない。これは出所探索の範囲を狭める追加証拠だが、手動SQLで作成された証明ではない。別PR、SQL適用記録、他の変更経路を引き続き確認する。

### 次の切り分け

1. 本番DBのUUID overload本文を保存し、該当関数の全定義とACLを署名単位で照合できる記録を作る。
2. 過去PR・workflow・デプロイ／SQL適用記録を検索し、DB変更の実行経路を探す。
3. 由来が特定できない場合は、現在の本番定義を根拠に、別途レビュー可能な再現用migrationを作る案を検討する。ただし、本番適用・ledger修正・既存RPCの置換は、依存関係と新規環境での検証が終わるまで行わない。


## 10. 本番UUID overloadの定義・権限を実体記録（2026-10-13・読み取りのみ）

本番DBから `pg_get_functiondef`、`prosecdef`、`proconfig`、`proacl` を取得し、UUID付き2関数の実定義を確認した。完全な定義は調査記録として保持し、ここでは重要な契約と差分を要約する。

### `get_relationship_time_context(uuid)`

- 署名：`public.get_relationship_time_context(p_user_id uuid DEFAULT NULL)`
- 戻り値：`jsonb`
- `SECURITY DEFINER`、`search_path TO ''`（空search_path）
- EXECUTE：`postgres`, `service_role` のみ（`PUBLIC` / `anon` / `authenticated` への付与なし）
- ユーザーIDは `coalesce(auth.uid(), p_user_id)` で決定。認証済みユーザーと引数の不一致を拒否し、匿名JWTと非永続アカウントを拒否する。
- `misaki_relationship_state` から経過秒数・時間帯・親密度・感情／行動状態・最終会話時刻を読み取り、状態がない場合も初期値を返す。読み取り専用の関数本文で、ここから状態更新は行わない。

### `record_relationship_chat_turn(timestamptz, timestamptz, uuid)`

- 署名：`public.record_relationship_chat_turn(p_user_message_at timestamptz, p_misaki_message_at timestamptz, p_user_id uuid DEFAULT NULL)`
- 戻り値：`jsonb`
- `SECURITY DEFINER`、`search_path TO ''`（空search_path）
- EXECUTE：`postgres`, `service_role` のみ（`PUBLIC` / `anon` / `authenticated` への付与なし）
- 同様に本人IDの不一致、匿名JWT、非永続アカウントを拒否し、5分を超える未来時刻を拒否する。
- 対象状態を `FOR UPDATE` でロックし、会話時刻を既存値より後退させず更新する。更新後状態と `chat_turn` イベントを記録し、`silence_before_seconds` を返す。
- 書込み経路なので、正本の会話時刻・イベント履歴に影響する重要RPC。現在の本文を根拠なく置換・再実行しない。

### 調査上の意味

本番に存在するUUID overloadは、単に同名関数があるだけでなく、mainの呼び出し引数と合致し、サービス専用の実行権限と空search_pathを持つことを確認できた。一方、現在のmainのmigration群からこの2 overloadを再現する定義元は依然見つかっていない。これは**実行時に壊れていると確認した事実ではなく、履歴再現性のギャップ**である。ユーザーによる本番実機受入結果を否定する根拠ではない。

次の調査は、関数の作成元を探すだけでなく、PR #32など統合ブランチのレビュー・コメントと、production migration/deployの記録を追い、DBへの投入経路を裏付けること。もし出所を特定できなくても、即座に本番修正は行わず、別途新規環境再現用SQLと安全な検証手順をレビュー対象として作成する。今回も本番DB・ledger・アプリコード・権限・デプロイは変更していない。


## 11. 感情・行動状態RPC：初回コミットと現在mainの定義を区別（2026-10-14・読み取りのみ）

### mainの現行呼び出しとmigration

GitHub main の `lib/relationship-emotion-store.ts` は、会話後の感情・行動状態を `apply_relationship_emotion_action_v2` に保存する。呼び出し引数には `p_user_id` を含む10引数の契約があり、`app/api/chat/route.ts` からサーバー側Supabaseクライアントと認証済みユーザーIDが渡される。

ここは前回の記録を訂正する。コミット `6136daad1b8beacebea88c471a9b9f85e760f1d1` の**初回追加時のdiff**は9引数・`SECURITY INVOKER`・`authenticated, service_role` へのEXECUTE付与だった。しかし、**現在のmainにある同じmigrationファイル** `supabase/migrations/20260926003000_relationship_emotion_action_v2_rpc.sql` は、すでに次の10引数定義になっている。

- 10引数：上記9引数に `p_user_id uuid default null` を追加
- `SECURITY DEFINER`、空 `search_path`
- EXECUTE：`service_role` のみ（`PUBLIC, anon, authenticated` をrevoke）
- `coalesce(auth.uid(), p_user_id)` によるユーザー決定と、service role以外のID不一致拒否
- 対象ユーザーが存在し、匿名アカウントでないことを検証
- 感情／行動値、状態バージョン競合を検証し、状態更新と `emotion_action_v2_after_chat` イベント記録を同じ関数内で実施

したがって、「現在のmain migrationは9引数のまま」「mainから新規環境を構築しても10引数契約を再現できない」とした前回の判定は誤りだった。初回コミットのdiffを現在のファイル内容として扱ってしまったため、訂正する。

### 本番DBとの照合結果

本番DBの読み取り専用カタログ照会で確認した定義も、署名は10引数、`SECURITY DEFINER`、空 `search_path`、EXECUTEは `postgres, service_role` のみであり、主要なユーザーID検証・永続アカウント確認・状態競合検出・状態とイベントの記録という契約は現在mainのmigrationと整合している。

本番DBの `pg_get_functiondef` と現在main migrationの関数定義を照合したところ、関数本文も一致した（関数本文の空白・改行差を正規化して比較）。署名・主要なセキュリティ契約だけでなく、関数ロジックも同一であることを確認した。migration ledger上の適用履歴を含む適用経路は、なお未確認。

- 確認済み：現行main callerは10引数を渡す。現行main migrationと本番DBは、10引数・SECURITY DEFINER・空 search_path・service-only EXECUTEという主要契約が一致する。
- 確認済み：main migrationと本番関数本文は、空白・改行差を除いて一致する。
- 訂正：初回コミット時の9引数定義を、現在mainのmigration定義と誤認していた。
- 未確認：migration ledger／適用ログによる本番への反映経路の証跡。
- 未実施：本番DB、migration ledger、RPC、ACL、アプリコード、デプロイの変更。

次はmigration ledger／適用ログを照合し、本番で同じ定義が稼働していることと、履歴上の適用記録を切り分けて整理する。関数本文の差は確認されていないため、既存RPCの置換やGRANT変更、ledger修正は行わない。


## 12. 旧統合PRのProduction記述は時点を分けて読む（2026-10-13）

PR #32「統合検証: canonical memory × relationship life context」の本文には、作成当時の状態として「Production Web appは未切替」「Production DBにはPreview用support migrationsが先行適用済み」と記載されている。これは2026年9月末時点の統合PRの切替判断を記録した歴史資料であり、2026-10-13時点のProduction runtimeが何を動かしているかを単独で決める根拠にはしない。

現時点の運用上の正本は、ユーザーが明示したとおりGitHub `main` と現在の本番DB、そして実機受入結果である。旧PRのDraft/未切替という記述を理由に、現在の本番Relationship Engine v2の稼働や実機確認を否定しない。一方、旧PRにある「support migrations先行適用済み」という記述も、個々の本番関数の作成元や、現在mainからの新規環境再現性を証明するものではない。

したがって本調査では、PR本文・Vercel Preview・CIは当時の履歴証拠として扱い、現在のProduction契約は本番DBの読み取り結果とmainの現行caller/migrationを直接照合して判断する。履歴の時点が異なること自体を、Production runtimeの不具合と混同しない。


## 13. PR #32のrelationship-time 403記録と呼び出し履歴を照合（2026-10-14・読み取りのみ）

### PR #32に残る当時の主張

PR #32の本文には、次の検証結果が記載されている。

- “relationship-time duplicate RPC 403” はPreview実機とSupabase runtime logまで確認して解消済み。
- Production DBにはPreviewを支えるsupport migrationが先行適用済み。
- PR本文では、Production Web appは未切替とされている（これは当時の状態記録であり、現在の本番状態を示すものではない）。

ただし、PR #32の取得可能な会話タイムラインには、この403の原因・実行したSQL・対象RPC署名・runtime logの具体的な抜粋は見つからなかった。PR本文は「解消確認があった」ことの履歴証拠にはなるが、UUID overloadを作成したmigrationや適用経路を特定する証拠にはならない。

### 関連コミットから分かったこと

- `2d6f18a506a8eb02e8a66c3bd0e0e4a8d3972691`（2026-09-17, “Record relationship time after saved chat turns”）は、`record_relationship_chat_turn` を引数2つで呼ぶコードを追加した。ここでは `p_user_id` を渡していない。
- `269426c4ac6776425269aeb219bcbf99af1fb6bd`（2026-09-30, “Use explicit server user context for relationship time”）は、`get_relationship_time_context` と `record_relationship_chat_turn` の両方に `p_user_id: userId ?? null` を渡す変更を追加した。この呼び出し形は、現在本番に存在するUUID付きoverloadを必要とする。
- `7827f5f1f216a1ae6767fcba8559b9831a561eb0`（“Avoid duplicate relationship time RPC in persona load”）は、persona load内で関係時間RPCを再度呼ばず、先に読み込んだcontextを渡す構造へ変更した。これは重複呼び出しを減らす変更であり、UUID overloadのSQL作成・適用を説明するものではない。
- `7b46b996c492711cf45971fad71016dc0724b10a` のmigration diffは `get_relationship_time_context()` の引数なし版を定義している。UUID付きoverloadの定義ではない。

### 結論

PR #32に「403解消をPreview実機とSupabase runtime logで確認した」との記録がある一方、現在確認できたPRコメント・関連コミット差分からは、UUID付きoverloadを作成したSQL、変更コミット、または本番適用の実行記録までは特定できなかった。現時点では、これを「手動SQLだった」と断定しない。

ここで分けて扱うべき点は次のとおり。

- **現在のruntime契約：** main callerと本番UUID overloadは対応しており、本番の実機受入もユーザー確認済み。
- **残っている管理差分：** UUID overloadをmainのmigrationから再現するための定義元・適用履歴の証跡が見つかっていない。
- **未実施：** 本番DB、migration ledger、RPC、ACL、アプリコード、デプロイの変更。

次は、当時のPreview deployment/runtime evidenceや別のSQL適用記録が接続済みツールで取得可能かを確認する。追加証拠が見つからない場合は、原因を断定せず「履歴再現性のギャップ」として残す。403を再現させる目的で権限を広げたり、既存RPCを置換したり、migration ledgerを変更したりしない。
