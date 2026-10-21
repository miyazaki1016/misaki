# 追補：legacy枝のBLOCKED記録後の未記載SQL修正を発見

**結論：最新CIと文書の時点差には具体的な原因がある。安全上のBLOCKEDは解除しない。**

## 確認済みの事実

- 枝: `codex/legacy-maintenance-drain` / PR #30 open Draft。
- 親コミット: `aa8a1cc4dedc0574f225faa0994efeaea0937cff`（2026-09-19 16:19:36 UTC）。GATE 1のbarrier反例とPG17比較CIを追加し、文書はBLOCKEDを記録。
- 最新コミット: `17449c7ec4e8ff50605ef931b04ae76584c6304f`（2026-09-19 21:30:53 UTC / 2026-09-20 06:30:53 JST）。メッセージ: `Make freeze control reads MVCC-safe with row locks`。
- 最新コミットが変更したファイルは **`supabase/legacy-maintenance-drain.sql` の1件のみ**。関連する総覧・運用文書・PR本文はこのコミットで更新されていない。
- 最新SQL Blob: `258a2a90c9f16f4ba77545601af20de07f48a18d`。

## 実際の変更

次の3関数内の `misaki_drain.control` 読取りに `FOR SHARE` が追加された。コメント整理だけではなく、制御行をロックする実行上の変更。

1. `public.admit_misaki_legacy_operation` のcontrol行読取り。
2. `misaki_drain.require_operation` のphase読取り。
3. `misaki_drain.guard_write` のphase読取り。

変更前は通常SELECT、変更後はlocking SELECT。最新コミットのAPI差分と現行Blob本文で一致を確認した。

## 最新HEADに対応する検証記録

GitHub Actions run `35470658292` はこの最新HEADに対応。

| PG | job | 実ログの結果 |
|---|---|---|
| 17.6 | `105970897567` | tests 56 / pass 56 / fail 0 / skipped 0 |
| 18.4 | `105970897363` | tests 56 / pass 56 / fail 0 / skipped 0 |

ログでは `candidate transaction barrier`、`candidate session-disconnect barrier`、停止前REPEATABLE READからの新規受付、保護writeの拒否試験も `ok`。単にcheck一覧の緑だけを読んだ判断ではない。一方、これらは**過去CIログの確認**であり、今回テストを再実行した結果ではない。

## 監査上の判定

- 03/06/07の初期記録にある「文書と現在HEAD CIの食い違い」の原因の一部を特定した。最後の文書化以後に、SQLの行ロック修正が入っていた。
- **未記載の実装・検証資産を発見した事例**として保持する。過去のソラが何を意図したかは、コミット説明を越えて推測しない。
- PR本文の「locking readは未実装候補」「最新テスト失敗」等を、最新HEADの現状として引用してはいけない。履歴時点を付けて読む。
- ただしこの3行変更と56件成功だけでは、既知の未保護surface、pre-gate inventory、旧browser save/refund引継ぎ、全API→DB→Edge→relay、pool/crash/deadlock等の未完了課題を解決したとは言えない。
- ユーザーの制限に従いBLOCKEDを維持。mainへの適用、SQL実行、PR merge、既存環境への再適用はしない。

## 次の調査

1. 各反例がどの保護条件によって拒否されたかを、最新SQLとCIの具体的なerror codeまで対応付ける。
2. 最新3関数以外のcontrol読取り・write surface・権限到達先を洗い出し、56件のcoverageと未検証範囲を分ける。
3. 既存大文書とPR本文は無断上書きせず、本追補を根拠にした訂正案をレビュー対象にする。

根拠: GitHub commit API `17449c7ec4e8ff50605ef931b04ae76584c6304f`、SQL Blob、run/job実ログ。原API記録は `legacy-latest-commit.json`。
