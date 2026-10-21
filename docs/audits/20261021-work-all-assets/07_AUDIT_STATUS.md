# ⑦ 監査進捗・未完了報告（2026-10-21 JST）

**監査は未完了。完了条件を満たしたという報告ではない。** 列挙・本文取得・版識別・main比較・PR/Previewの照合基盤と主要所見を保存する中間成果。

## 取得・件数照合

| 対象 | 実測 | 範囲・限界 |
|---|---:|---|
| 全ブランチ | 92 | 開始時/保存前再確認ともpage1=92、page2=0。per_page=100。名前/HEADの途中変化なし。保存コミットで監査枝自身のみHEADが進む。 |
| 全Tree | 92 | recursive=1、全件truncated=false。以前の24枝も同一基準で再取得。 |
| 全ファイル所属 | 12,992 | 各枝のblobエントリ合計。ディレクトリを除く。 |
| 固有Blob | 613 | 同一SHAを重複識別。2つのpersona BlobはNode/Edgeの異なるpathでも共有されている。全ファイル索引は各pathを保持。 |
| 文書 | 61パス / 85版 / 504所属 | docs外のBODY_CLOCK・tests/reportsも含む。本文85版取得、Git blob SHA全85一致。設定/SQL/workflowの説明はコード側索引も対象。 |
| テキスト本文 | 596固有Blob | 文書85＋コード/設定等511。残17は画像16とdeno.lock 1で、path/SHA/sizeは索引あり。deno.lock本文未取得。 |
| main比較 | 92 | merge-base三点比較434ファイル所属。HEAD対main二点比較5,242ファイル所属。これらは機能数ではない。 |
| ancestry | behind33 / diverged51 / ahead7 / identical1 | ahead/behindだけで機能反映判定しない。Time v2の276コミット比較は100件×3ページも取得。 |
| PR | 88 | page1=88、page2=0。73 merged、15 open Draft。state/head/merge SHA/本文を取得。 |
| PR対話 | 88 PR / 96件 | Conversation comments、reviews、inline commentsをページング取得。取得エラー0。未保存ローカル/非公開チャット履歴は対象外。 |
| HEAD check-runs | 92枝 | per_page=100。total_count超過の有無は検証スクリプトで照合。CI successは本番受入の代替ではない。 |
| Vercel | 978件 / 10ページ | project misaki `prj_71NgSxGkNXkKECXc9jJRrJHdAkDS`、team `team_VIfp8TXktY4DegRNpPhFb5uT`。until cursorでnext消失まで取得。削除/保持切れ履歴の不存在証明ではない。 |
| Preview所在 | 62枝にdeployment履歴、61枝にHEAD該当 | Preview/production targetを個別記録。URLの実アクセス・機能受入は未実施。READYと動作検証を区別。 |

## 重要な確定所見

- RPC復元枝のSQLはmainと同一Blob。再適用不要・禁止。
- Gemini計測枝の主要13/16ファイルはmain同一。既存機能を新規に二重開発しない。
- Forget/Identity/Acting比較/会話ラボ/共通engine部品にはmain未収録の資産がある。CI・合成試験と実モデル品質を区別。
- legacy枝のBLOCKED記録と現在HEAD CI（PG17.6/18.4各56 pass）が食い違う。解除せず追加調査。
- 婚姻排他とFree/Premiumの自発話題源には古い総覧との時点差がある。

## 完了条件ごとの残件

1. **全文の意味内容精査：未完了。** 本文取得・SHA・見出し索引は済みだが、全85版の全段落を読み、設計変更理由・現在実装への対応を確定したわけではない。特に総覧24版と台帳の長文差分。機械抜粋を人による要約にしない。
2. **全コード差分の意味的照合：未完了。** 92枝の差分取得、全path/SHAの二点比較、主要成果のソース照合は済み。全434三点差分/5,242二点差分の個別意味的判断は残る。#31のmotive/urge/story等、#78と#67の重複、古いfixの後続置換を優先。
3. **全文書の最終変更履歴：一部。** 各Blobの代表所属枝でpath最新commitを取得。全所属枝ごとの完全履歴、消えたブランチ・到達不能commitにしかない文書は未確認。全開発史を復元したとはしない。
4. **書込みブロックの網羅：未証明。** GitHubに保存された資料・PRは調査可能だが、保存前に拒否された変更、別端末ローカル、過去チャットの承認拒否はGitHubに記録がない場合がある。ゼロと推測しない。
5. **Preview実機能検証：未実施。** API上の状態・SHA対応は確認。Preview画面や有料生成は呼び出していない。過去受入記録の全件裏付けは残る。
6. **本番DB/gateの現在実体：未確認。** 制限に従い接続なし。PR/文書の適用済み主張と今回の観測を分離。migrationを再実行しない。
7. **legacyのCI/文書矛盾：未解決。** run 35470658292のjob 105970897567 / 105970897363の実ログを取得。check annotationsは汎用Fetchが許可しないendpointとして拒否。専用job logs経路は成功。追加実験は行っていない。
8. **全過去資産の完全性：限定。** 今回の実測は現存92ブランチHEAD、関連比較commit、全88 PR、取得可能なVercel履歴。全ての祖先commitの全tree、削除枝、未追跡ファイルを網羅した証明ではない。

API取得が成功したことを精査完了の代用にせず、残件は上記のまま引き継ぐ。今回、API制限で全体監査を完了できなかったという虚偽の理由は付けない。主な残件は意味内容・同等性の継続調査。

## 再開入口

1. READMEと本報告、03〜06の主要所見を読む。
2. branches/documents/code-differencesの対象行から固定HEAD/Blob/PRを使う。対象枝が進んだら差分再取得。
3. 総覧24版の本文差分を時系列に読み、意味内容精査の対象段落/根拠/判定/残件を明記して続ける。
4. #31・#78・#67を機能単位でmain照合し、未反映と別名実装済みを確定する。
5. legacyはBLOCKED維持。別のソラも成功CIだけで許可と解釈しない。

## 変更制限の履行

監査用文書・索引だけを監査専用枝へ保存。main変更、本番Misaki/Supabase接続・変更、migration実行、PR merge、枝削除、本番deploy、有料Gemini実行、安全性回避、アメふる変更は実施しない。実ユーザーデータの抽出も行っていない。
