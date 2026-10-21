# ⑥ 今後の開発優先順位案

これはレビュー用の提案。今回の範囲は調査と文書化であり、どの項目も自動実装・merge・本番適用しない。

| ID / 分類 | 課題・根拠 | 依存・リスク | 次に必要な検証・完了条件 |
|---|---|---|---|
| A01 最優先 | legacy #30のBLOCKED文書と現在HEAD成功CIの矛盾。`17449c7ec4e8ff50605ef931b04ae76584c6304f`、`LEGACY_MAINTENANCE_DRAIN.md`、`WRITE_SURFACE_INVENTORY.md`、DB試験Blob `68fea5e23b611ee13a2415b4d0addbe4fbbe1d15`、run 35470658292 | 成功表示で停止集合/安全性が証明されたと扱う危険。既知surface漏れ・pre-gate・旧処理引継ぎは別問題。 | 最新HEADに3か所FOR SHARE追加が入ったことを特定（08追補）。実行checkoutのSHA/tree、Node/PG版、実ログの各反例、現SQLと文書の反例条件を同じ証拠束で比較。保護要件を弱めず隔離環境で再現。BLOCKED解除は監査後の別判断。 |
| A02 最優先 | Forget v1未統合、#66 `84d147ba5b46698d3b46fb727a9859f87f79f3d2`、`lib/canonical-state.ts`/chat/Body Clock/専用SQL | 参照・保存・forget成立後のrollbackが一体。追加意味判定callでコストも増える。 | 現mainにrebase相当の差分設計のみを先に作る。古いhistory復活、明示削除、再学習同意、匿名checkpoint、別端末、出力検査、失敗時原子性の隔離試験計画。 |
| A03 最優先 | Body Clock関係性変更race、#85 @ `ef5bd23246a75b02a0df60302263f971de061843` のrace/RPC/version文書 | conversation updated_atだけではrelationship-only更新の検知を証明しない。全writerのversion更新と配送確定が依存。 | 実効SQLのCREATE/REPLACE順序と引数をソース上で解決し、status双方更新・旧emotion/action・匿名revision・二重Pushの競合試験を設計。未証明を即本番不具合と断定しない。 |
| A04 最優先 | IdentityのDB/main/gate三者、#67 @ `9cbe2146d4a9ad09edd16100c27d950e95a8bcc4` | PRは本番DB適用済みと主張、mainアプリ未収録。再適用・gate ONで既存状態を壊す恐れ。 | 既存4本SQLの署名/依存/台帳の記録とアプリconsumer契約を静的比較。現在DB照合は別範囲として未確認維持。 |
| B01 優先 | #83のcanonical acting比較試験、#85ガード保持候補、#86評価部品 | テストがあるだけで人格品質の改善とはしない。各PRの依存と責務を混ぜない。 | 同じpersona/履歴/正本statusでbaselineを固定。実モデルを使わず構造と期待/禁止項目を先にレビュー。 |
| B02 優先 | #31の未反映候補・main同等実装、#78と#67の重複資産 | 古い巨大枝の一括取り込みは退行・SQL衝突を招く。 | motive/urge/story等を機能ごとにmain検索・差分・試験・設計根拠へ対応付け、未反映と別名実装済みを確定。 |
| C01 開発効率 | #61計測を使い成功1turnの実コスト指標へ。main telemetry/generator/chat | HTTP200だけで分母を作らない。NULL、再試行、付随call、非同期解析、匿名/plan境界に注意。 | 記事本文を残さずphysical attemptsとcanonical completionの相関・欠落率を設計。Body Clock等の未計測経路を列挙。稼働データ抽出は今回未実施。 |
| C02 開発効率 | #78/圧縮spikeの履歴重複研究 | Summaryに訂正/否定/約束/関係事実を誤移植すると品質低下。 | 正本promptの純粋抽出とbyte parityを先に確立。重複除去を最小候補としてオフライン品質非劣化を確認。過去単発率を採用根拠にしない。 |
| C03 開発効率・安全 | Preview acting-labのアプリ内auth/予算ガード、main route Blob `b046873065f41d26e294f87c419c772b33806a21` | 外側deployment protectionと鍵設定は未確認。無制限profile並列・retryの課金リスク。 | 実呼出しなしに保護範囲・cap・secret依存を設計。匿名・不正入力・上限超過時の無課金拒否試験を用意。 |
| D01 将来構想 | #79/#80/#81と新visionのCharacter/User/Pair境界 | DB/RPC/RLS/lease/import/削除/通知をまとめて設計する必要。 | 秘密の別キャラ漏洩、request namespace、移行所有者、削除・rollbackを設計。UIだけの先行対応を避ける。 |
| D02 将来構想 | Free/Premium・婚姻排他の時点差 | 課金と好意、想い出と関係事実を混在させない。 | 10/19・21方針を優先した仕様差分をレビューし、未決事項と現在未実装を明示。 |
| E01 整理 | 旧総覧版・台帳・文書棚卸し・15 Draft | 名前/日時だけで不要と判断すると設計資産を失う。 | 本索引を入口に85版の本文差分精査を完了し、採用/保存/重複/保留を機能単位で決める。枝削除なし。 |
| E02 整理 | RPC復元SQLはmain収録済み、一部古い由来監査は未発見のまま | migration filename・ledger件数だけでDB修正しない。 | 旧未発見記録に現在の復元パス/Blob/PRを追記する案を作る。大文書は上書きせずレビュー後整理。 |

推奨順序: 監査残件とA01の証拠整理 → A02/A03/A04の安全境界と検証計画 → C01の既存計測活用 → #86/#88の評価・parity基盤 → C02/B01の小さな品質比較 → B02の資産救出 → D01/D02。Aの項目が存在することを理由に、現在の本番を無断で止めたり修正したりしない。
