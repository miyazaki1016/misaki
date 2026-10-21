# ソラ第5次部分精査：Relationship worker / RPC / Forget利用権

2026-10-21。**監査未完了、静的ソース照合のみ。** 対象固定main: `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。前回ソラの38〜39に続く追補。新規テスト実行・DB接続・本番観測なし。今回の対象はRelationship worker 2ファイル＋main migration 3ファイルの固定Blobであり、全92枝・全migrationの完全検証ではない。

## 固定ソースと証拠

| ファイル | Blob SHA | 確認箇所 |
|---|---|---|
| `lib/relationship-processing-v1.ts` | `bc89fbc00036b66b4f0b3d3500f853bf2bf38ed5` | 37–52 lease check、69–77 event/journal、101–143 段階処理・再試行、205–242 v2 RPC呼出し |
| `lib/relationship-runtime-v1.ts` | `a5d2299769ae2d5bf9b2a7ecd7baae7afd5c203f` | 55–70 canonical event走査、107–109 匿名import |
| `supabase/migrations/20261003091800_relationship_engine_v1_distributed_worker_contract.sql` | `ccf3f43fd349ededcc1ba770eabc71ba75384bfc` | 34–115 lease/順序、120–230 apply/criticalの当時の定義 |
| `supabase/migrations/20261003094200_relationship_engine_v1_full_lease_fencing.sql` | `3fb57d1a6a3722a3ae481a1ade673cca8272e2d4` | 5–18 assertion、20–89 v2 wrapper、92–106権限 |
| `supabase/migrations/20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql` | `75033cfe8172dfef2e5058b8f65865fb4a86ae21` | 6–38 advance、39–103 Evidence/Episode/Pattern、104–177 pending/import、187前後 state version |

## 確認した動作境界

1. **Workerの実行権**：`relationship-processing-v1.ts` はclaim/renew、read/writeのlease checkを行い、RPCへ`p_processing_version`/`p_lease_token`を渡す。外部モデル前後でもleaseを確認する。これらは処理所有権のフェンスであり、Forgetの内容利用権そのものではない。
2. **旧入力の再利用**：同ファイルの`store.turn`は`chat_turn_completed`の`metadata.message` / `metadata.result.reply`を読む。失敗時のjournalには候補の`interpretation`・`subject`・`supportingTurn`が入り、再開時に復元され得る。現在Memoryをmaskするだけではこの入力の失効を保証しない。
3. **段階的な書込**：Evidence→Episode→Pattern→Apply/criticalは別のRPC段階として呼び出される。Forgetがどの段階に挟まるかで残存アーティファクトが変わる。既存の冪等・lease条件を失わせず、**元情報のForget状態を採用時にどう判定するか**を追加で定義する必要がある。
4. **SQL変遷の修正**：9:42のv2 routineは`assert_misaki_relationship_lease_v1`後に旧v1を呼ぶ形だが、10:06 migrationは同名のv2関数を直接処理へ`CREATE OR REPLACE`した。従って9:42版だけを現在のGitHub main上の最終意図として判断してはいけない。10:06版でも観測した呼出し引数・関数記述に`forgetVersion`比較はない。**他の後続定義や本番有効SQLまで未検証**。
5. **別のVersionは代用品でない**：`p_processing_version`は分析処理世代、`relationship_state_version`は関係状態世代、lease tokenはclaim所有。Forget controlとの一致を自動的には示さない。
6. **確認済みの情報漏洩は0件**。静的コード上で条件が未確認という観測であり、実環境での脆弱性・本番状態を断定しない。

## 次に調べるべき保証（テストは未実行）

| ケース | 介入点 | 独立期待値の候補 | 追加調査 |
|---|---|---|---|
| RW-01 | turn取得→Forget→Evidence保存 | 旧秘密に依存するEvidenceを無条件に採用しない。関係statusは別に保持判断 | 完了event自体のread/mask条件とRPC原子比較 |
| RW-02 | journal失敗保存→Forget→retry再開 | compact evidenceから旧情報を復活させない | source request/forget generationとjournalの追跡可能性 |
| RW-03 | Evidence保存→Forget→Episode/Pattern | 既存Evidenceを参照した派生再計算時にも権限を検査 | Episode evidence link / derived_fromの全writer |
| RW-04 | critical pending生成→Forget→validator/critical apply | 忘却情報を理由に古いcritical候補を確定しない。ただし交際/境界をForgetだけで勝手に解消しない | critical pending source、statusの意味、別transaction競合 |
| RW-05 | 匿名snapshot解析→Forget→恒久import | 凍結snapshotの旧情報を新しい所有状態へ無条件importしない | temporary revision、Forget control、import RPC |
| RW-06 | 既存抽象的Relationship Story→Forget→Acting | 秘密の具体的再提示を防ぎつつ、非機微な抽象関係を保持できる条件を定義 | Storyはsignal意味状態で自由文メモでない。独立人手oracle |

## 引継ぎ・進捗

- 38の9シナリオのうちRelationship/RPC系を固定mainコードと3 migrationで再照合。**新たな安全性受入や試験合格ではない**。
- 次はForget #66のSQLと上述RPCとの整合、後続migration/overload、現行reader/workerの再提示入口を照合する。過去の状態/派生の利用禁止と物理削除は区別。
- 旧監査の残り45文書・証拠不足30枝には、今回**加算ゼロ**。legacy BLOCKED維持。GitHub Actionsのmain外資産依存を保護。
- main、本番Misaki、本番Supabase、アメふる、DB、PR、ブランチ削除、deploy、Gemini課金を変更・実行していない。
