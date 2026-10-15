# Body Clock 関係性の生成中変更：競合レビュー（2026-10-15／未実装）

## 実コードで確認したこと
- `supabase/functions/body-clock/index.ts` の `processUser` は `loadBodyClockRoot` → `buildProactiveDecisionContext` → `generateMessage` → `finish_misaki_body_clock_delivery` RPC の順で処理する。
- RPCへ `p_expected_revision: canonical.temporaryRevision` と `p_expected_updated_at: canonical.updatedAt` を渡す。
- `conversation-root.ts` の `canonical.updatedAt` は恒久の **`misaki_user_conversation_state.updated_at`**。**`misaki_relationship_state` の更新を監視しているとは限らない。**
- 匿名の `temporaryRevision` は一時Rootのrevisionであり、そのRootへ正しく反映された関係性更新なら競合検知できる可能性がある。ただし実RPCの比較条件と全更新経路は未検証。

## 具体的な競合
T0: Body Clockが交際status=noneの5軸を読む。
T1: ユーザーとの通常会話でstatusがromantic_partnerへ変化する（または逆）。
T2: 古いstatus=noneを前提にGeminiが文面生成する。
T3: 会話のupdated_atは変わらず、関係性行だけ更新された場合、既存の `p_expected_updated_at` では関係性の変化を検知できない可能性がある。
T4: 古い関係性の自発メッセージを配信してしまう。

## 対策案（検討、未適用）
1. 関係性正本に**確実に更新されるversionまたはupdated_at**があるかmigration/書き込みRPCを監査する。なければ日時を推測せず、単調増加versionか同等の比較可能な識別子を設計する。
2. 生成開始時にstatus・5軸と識別子をread-only取得し、送信確定の直前に同じ正本の識別子を比較する。**アプリ側の直前再読だけでは比較と配送確定の間にTOCTOUが残る**ので、可能なら配送確定RPC内で原子的に検証する。
3. 既存 `p_expected_updated_at` / `p_expected_revision` は維持し、関係性識別子の追加検証と併用する。競合なら配送を見送り、古い生成文を再利用しない。無限再試行・二重送信を避ける。
4. 匿名は検証済みRootとrevisionを正本にし、恒久rowのstatusと混ぜない。匿名Rootの更新経路がrevisionを進めるか確認する。
5. 関係性識別子が存在しない／比較できないとき、交際statusを断定する新機能を本番に接続しない。既存のBody Clock配信を止める判断は別途検討する。

## 必須テスト（今後）
- 恒久：関係性だけ更新、会話updated_at不変 → 古い文面を確定しない。
- 恒久：会話だけ更新 → 既存競合保護を維持。
- 匿名：verified Root更新 → revision競合で配送を見送り。
- status=none ↔ romantic_partner 双方向変更。
- 競合時にdeliveryとPushが二重作成されない。
- read失敗時に古いstatusで配信しない。

## 結論
**既存の `p_expected_updated_at` が関係性正本の更新まで守るとは証明できない。** migration/RPCと全更新経路の監査が次の作業。PR #85 Draftの資料のみで、本番コード・DB・Edgeは変更していない。
