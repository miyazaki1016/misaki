# Body Clock関係性競合：既存versionの発見（2026-10-15／ソース監査）

## 確認したmigration
- `supabase/migrations/20261003081717_relationship_engine_v1_canonical_state_and_critical_event.sql`：`misaki_relationship_state.relationship_state_version bigint not null default 0` と `relationship_engine_version` が追加済み。交際statusのcritical event RPCは、rowを `FOR UPDATE` で取得して `relationship_state_version=relationship_state_version+1`、`state_updated_at=v_now` を更新する。
- `supabase/migrations/20261003081813_relationship_engine_v1_bounded_state_application.sql`：5軸を反映する `apply_misaki_relationship_state_v1` もrowを `FOR UPDATE` で取得し、`relationship_state_version=relationship_state_version+1` を更新する。
- `supabase/migrations/20260918073918_canonical_misaki_root_state.sql`：配信確定 `finish_misaki_body_clock_delivery` は会話Rootの `updated_at` または匿名Root revisionを照合するが、関係性versionの引数・比較はない。

## 設計上の結論
**関係性の変更検知に利用できる既存の単調増加versionが存在する。** 5軸・交際statusを変更する上記2つのRPCはversionを進める。新しいversion列を追加する必要は、少なくともこの2経路のためにはない。

ただし**全書き込み経路がversionを更新するとは未確認**。旧RPC・匿名import・管理系の直接UPDATEなどを列挙し、versionの更新漏れを確認するまで原子的な保護が完成したとは判断しない。

## 接続の提案（未実装）
1. Body Clockの恒久関係性DTO読取時、5軸/statusに加え `relationship_state_version` を同じ行から取得。
2. 配信確定RPCへ `p_expected_relationship_version bigint` を追加した新しいsignatureを設計する（既存呼出元・関数overloadに注意）。
3. 同じトランザクション内で関係性rowを `FOR UPDATE` で読み、version一致を検査する。不一致なら例外でdelivery/history/count更新をロールバック。
4. 既存の会話 `p_expected_updated_at`、匿名 `p_expected_revision` は維持する。匿名には恒久関係性versionを混入しない。
5. RPC側の行ロック順序が既存の通常会話の更新経路と衝突しないか検証。デッドロック・遅延・リトライ・冪等性のテストを先行する。
6. 実際のmigration適用状況と本番関数定義は未照合。コード上の存在と本番での稼働は区別する。

## 次に必要な検証
- migration全体の `misaki_relationship_state` 書き込み経路でversionの増分が保証されるか。
- 匿名→恒久import時にstatus/5軸のversionが進むか。
- 関係性更新だけで会話updated_atが変わらない回帰ケース。
- 同時実行時のロック順序・delivery重複防止・旧signature互換。

**変更境界**：PR #85 Draftの設計資料のみ。本番DB/Edge/コード未変更。
