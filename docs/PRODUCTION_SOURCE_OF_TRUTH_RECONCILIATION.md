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
| 両方にある同一migration名でversionが異なるもの | 21 | 名前をキーにした追加調査が必要 |
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
2. **migrationごとの由来を分類:** 同名・異versionの21件、台帳にだけある50件、mainにだけある3件を、Git履歴とSQL内容から「後日記録」「旧ソース欠落」「実際の定義差」「要調査」に分類する。
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

どちらも引数なしの `public.get_relationship_time_context()` を定義する。後者は `SECURITY INVOKER` を明示している。台帳には前者の `20260917023648` だけがある。接続先DBには引数なし関数があり、`SECURITY DEFINER=false`、`search_path=public`、実行ロールは `authenticated, postgres, service_role`。関数本文には本人の `auth.uid()` と匿名ユーザー拒否のチェックがある。DB定義の意味はinvokerであることと整合するが、本文全体の同一性まではこの確認だけで断定しない。

### `record_relationship_chat_turn(timestamptz, timestamptz)`

GitHub `main` には次の2ファイルがある。

- `20260917023657_phase1_record_chat_turn_rpc.sql`
- `20260917024600_phase1_record_chat_turn_rpc.sql`

両方とも同じ署名のRPCを定義するが、内容は同一ではない。後者には、両タイムスタンプの未来値拒否、既存時刻を後退させない更新、通常チャットターンのイベント記録、経過秒数の返却が含まれる。前者には同じ更新ロジックがない。台帳には前者の `20260917023657` だけがある。

接続先DBの同署名関数は `SECURITY DEFINER=true`、`search_path=public`、実行ロール `postgres, service_role`。本文の読み取り照合では、未来タイムスタンプ拒否、時刻の単調更新、`normal chat turn completed` イベント記録、経過秒数返却の4点が存在する。つまり、DBの現在の関数は後者の主要な動作特性と整合している一方、台帳には後者のmigration versionが見当たらない。

### この差分の意味と安全な対応

これは**台帳に記録されたversionと、mainにある後続migration・本番RPC定義の由来を照合する必要がある具体例**。現在の本番DBの関数が、mainの後続migrationで意図した動作を含んでいることは部分的に確認できたが、どの経路で本番へ反映されたかはまだ確定していない。

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
