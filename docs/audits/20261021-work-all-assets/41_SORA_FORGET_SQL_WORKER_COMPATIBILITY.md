# ソラ第5次精査：Forget #66 SQLとRelationship worker保存RPCの境界

2026-10-21。**監査未完了・静的コード照合のみ。** 今回はForget PR #66固定HEAD `84d147ba5b46698d3b46fb727a9859f87f79f3d2` とmain固定HEAD `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` のGitHub tree（両方 `truncated:false`）、SQL本文とWorkerを照合。38〜40の補足。DB接続/試験/新しい機能実装は行わない。新規の再現済み不具合0。

## SHA付き証拠

- Forget branch: `supabase/migrations/20261006200002_forget_control_v1.sql` Blob `78311ec1cfe16007c5f9e333b5b692da0b304e5a`（全297行を取得）。
- Forget branch/main共通: `lib/relationship-processing-v1.ts` Blob `bc89fbc00036b66b4f0b3d3500f853bf2bf38ed5`。同一Blobは、Forget branchでworker自体への保護改変がないことの証拠（外部guardやDBの効果まで否定しない）。
- main: `supabase/migrations/20261003094200_relationship_engine_v1_full_lease_fencing.sql` Blob `3fb57d1a6a3722a3ae481a1ade673cca8272e2d4`。
- main/Forget branch共通: `supabase/migrations/20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql` Blob `75033cfe8172dfef2e5058b8f65865fb4a86ae21`。
- main relationship writerコードとmigration詳細は40、push/evolution/body-clockは39を参照。

## 対照表：二つの独立した契約

| 関心 | #66 Forget SQLの具体的な処理 | Relationship writerの処理 | 現段階の結論 |
|---|---|---|---|
| 保存対象 | #66 SQL 4–20行：`misaki_forget_controls(user_id,payload,updated_at)`。本人ごとの暗号化payload、upsert時updated_at更新 | workerは元`chat_turn_completed` event、failed journal、保存済みEvidenceを参照（40） | controlは別表。workerへの自動的な内容遮断を示す参照は未確認 |
| Chat成功時 | 72–79行：canonical root updated_atをlock下照合後に`persist_misaki_forget_controls` | Workerはclaim・lease・processing version、各v2 RPCを使用 | 同一成功turnのcontrol保存と会話保存の原子性の設計はあるが、後続workerのcontrol照合とは別 |
| Memory削除時 | 116–139行：root updated_atの期待値を検査→control保存→memory/history更新→root updated_at更新 | evidence/episode/patternを直接削除するSQLではない | Memory削除起点のroot更新と別controlの失効を区別。Relationship派生物の利用許可は未証明 |
| 匿名Root | 255–289行：root revision確認、verified payload必要、checkpointがあればforget payloadを引き継ぐ | 匿名importは凍結snapshotから解析し、leaseで処理を保護 | revisionで古いRoot保存は拒めても、Forget後の古い解析情報の派生利用許可を別検証する必要 |
| Worker RPC | #66 migration全297行には`record_misaki_relationship_evidence_v2` / `upsert_misaki_relationship_episode_v2` / `upsert_misaki_relationship_pattern_v2` / `apply_misaki_relationship_state_v2` のCREATE/REPLACEがない | 10/03のv2 RPCはlease/processing versionなどを検査（40）。Forget/control version引数を観測していない | #66 migrationによって既存Relationship writerが自動的にForget-awareになるとは静的に認定できない |
| 保存された歴史 | SQL冒頭3行「historical chat, Relationship evidence, episodes, patterns or State are modified しない」と明示 | workerでは保存済みEventから派生・retry復元可能 | 物理保持を意図しており、安全性の要件は削除ではなく再利用・再提示制御の設計に移る |

## 細部の注意：いくつかのレースは一律ではない

- #66のedit RPCはroot updated_atとForget controlを同じtransactionで更新する設計（116–139行）。したがって、同じroot updated_atを照合する後続chat/Body Clockの経路では、**条件を満たせば競合を既存root versionで検出できる可能性**がある。ただし、必ず全Forget更新でroot世代が増加すること、全writerが同じlockとrevisionを使うこと、更新時刻の一意性などを別途確認する。これを「すべて無防備」と扱わない。
- #66の`misaki_forget_controls.updated_at`は時刻であり、SQLテーブルに単調増分の`forgetVersion`列は見えない。アプリケーション側のlogical versionや暗号payload内versionと同一視しない。旧39の「明示的Forget世代がない」は**SQLインターフェースに渡らない**という限定表現にする。
- Forget SQLはRelationship Evidence等を物理的に修正しないと宣言している。従って、Forgetの安全性を定義する際、保持・処理・再提示を分離し、既存関係statusを無条件に巻き戻さない。
- 本番DBへのmigration適用、旧overloadの現存、trigger/RLS/ACL実体、全外部job、現在のForget実装の動作は未確認。

## 次の調査・独立試験契約（未実行）

1. `misaki_forget_controls`を読むすべての入口（chat/Edge/worker/Persona/relay/UI）をGitHubの静的依存グラフで列挙し、各入口の**読取時／保存時／配送時**を分ける。
2. Forget成功後に処理が再開する `RW-01`〜`RW-05`（40）を隔離fixtureとして設計し、旧Eventとjournal、既存Evidenceを元情報span・依存requestで特定できるかを評価する。
3. Memory削除→root updated_at変更と、controlだけを更新する入口の有無、匿名importのrevision比較を合わせて確認する。
4. 最終RPCの全署名、他枝のrestore SQL、DB実体は別調査。legacyはBLOCKEDを維持。
5. 残45文書版と証拠不足30枝は未着手で、今回**進捗数に加算しない**。main外workflow参照のブランチは削除しない。

**結論：** #66のSQLはForget controlを会話の保存・削除・匿名checkpointへ接続する意図を持つ。一方、同一BlobのRelationship workerとmainのv2保存RPCに、古いsource情報の利用権を再評価する明示的契約は、この固定ソース範囲で確認できていない。**静的な保証不足の指摘であって、漏洩再現・本番脆弱性の断定ではない。**

禁止事項：main/本番Misaki/Supabase/アメふる変更、DB接続・migration、有料Gemini、実装、デプロイ、PR merge、ブランチ削除なし。
