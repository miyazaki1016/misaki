# Relationship version：匿名→恒久import経路の追加監査（2026-10-15）

## 今回確認したソース
- `20261003082001_relationship_engine_v1_temporary_import_boundary.sql`：`import_misaki_temporary_relationship_v1` は5軸と `relationship_status` を恒久rowへ取り込み、`relationship_state_version=relationship_state_version+1`。
- `20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql`：後続のimport定義でも5軸/statusとversion増分を同じUPDATEで行う。
- 前回確認済み：`20261003081717...` critical event と `20261003081813...` bounded state application もversionを増分。

## ここまでの確認範囲
**主要3種類の関係性書き込み**（Patternによる5軸更新、交際状態のcritical event、匿名→恒久import）でversion増分が見つかった。versionは、Body Clockの配信競合を検知する候補として妥当。

## なお未確定
- すべてのmigration・RPC・直接UPDATEを網羅した証明ではない。既存のlegacy writeと関係性以外のrow更新でversionが変わるか、追加監査が必要。
- DB本番にどのmigrationが適用済みか未確認。
- 配信確定RPCにversion引数と行ロックが存在するわけではない。
- Edge生成前のsnapshotと配信確定RPCが同じversionを扱う接続は未実装。

## 次の設計ゲート
1. 関係性stateを更新する全経路の洗い出し（migration + runtime + Edge）。
2. 既存RPCのロック順序と関係性更新RPCのロック順序を比較。
3. 関係性versionが不一致なら配送・履歴・カウントを同一トランザクションで中止する回帰テストを先行。
4. 旧signature互換性とanonymous pathを守った独立PRを別途作成する。

**状態：** PR #85 Draftの監査文書のみ。本番DB/Edge/アプリ変更なし。
