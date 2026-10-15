# Body Clock 配信確定RPCと関係性version：調査結果（2026-10-15）

## 確認できた事実
- `supabase/functions/body-clock/index.ts` は `finish_misaki_body_clock_delivery` に `p_expected_revision`（匿名一時Rootのrevision）と `p_expected_updated_at`（会話Rootのupdated_at）を渡す。
- `supabase/functions/body-clock/conversation-root.ts` は恒久Rootの `updated_at` を `misaki_user_conversation_state` から取得する。
- したがって、**これらの引数だけを根拠に** `misaki_relationship_state` の更新競合まで検知すると主張できない。
- GitHubのコード検索で `finish_misaki_body_clock_delivery`、`p_expected_updated_at`、`misaki_relationship_state updated_at` を検索したが、該当結果を取得できなかった。想定した2件のmigrationパスも存在せず、**SQL関数本体の確認には至っていない**。

## 未確定事項（断定しない）
1. `finish_misaki_body_clock_delivery` がDB側で関係性テーブルもロック・照合しているか。
2. `misaki_relationship_state` に更新時刻またはversionがあるか、全ての書き込み経路で更新されるか。
3. 匿名RootのrelationshipEngine更新が全経路でrevisionを更新するか。
4. delivery確定とPush relayが競合時にどう振る舞うか。

## 次の正しい調査
- GitHubの実際の `supabase/migrations` 配下をtree/listで列挙し、`CREATE OR REPLACE FUNCTION ... finish_misaki_body_clock_delivery` と関係性state更新RPCの定義を読む。
- DB本番を変更せずmigrationを読み、関係性行の版と更新処理を確認する。
- RPC内で**同一トランザクション**の条件検査が可能か設計する。単なるEdge側の再読ではTOCTOUを解消できない。
- 既存delivery/Pushの冪等性を壊さないテストを先に用意する。

## 判定
**現段階で既存RPCが関係性競合を防げる／防げないと確定しない。** 関係性版の追加migrationや本番接続は未承認・未実施。PR #85 Draftの調査記録のみ。
