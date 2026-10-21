# ソラ第5次：複数キャラクターPhase 0監査資料・文書2版の全文精査と差分保全

日付 2026-10-21 JST。前回51台帳では49/85版。第4次34台帳のpending_documentsにあるDOC-049とDOC-050を、**異なる固定Blobの原本2版**としてどちらも全文取得・内容対照し、main固定ソースを追加照合した。**監査未完了。main/Production/Supabase等への変更なし。**

## 1. 原本（2版）と差分の確定

- **DOC-049** `docs/MULTI_CHARACTER_PHASE0_AUDIT.md`、Blob `0baf4f28d863f6e075f745afd5c903145887274f`、15,159文字、242行（末尾の改行を含むsplit）。長い**第12章の本番基準との整合補記（2026-10-13）**あり。
- **DOC-050** 同名の別版、Blob `4de727956e52cc8eeccd772631671af69a13536f`、12,350文字、199行。第11章まで。
- 直接の行ごと比較では**冒頭199行のテキストは一致**し、DOC-049のみ第12章以降の本番照合報告を追加している。したがって「似た資料2件」ではなく、**一方にしか存在しない証拠の追補**を保全しなければならない。第12章を持たないDOC-050で上書き／差し戻しするのは不適切。
- DOC-049の「本番で確認済み」は**2026-10-13に当時の作成者が行った実機・本番DB読取の文書内報告**。今回ソラはDBに接続せず、その記録を直接追試していない。実装済みをmain名だけで判定することも、過去の受入報告を無かったものとして扱うこともしない。

## 2. 共通199行にある設計資産

1. **User / Character / Pairを分離**：共通profileと許可された共有情報、固定人格・生活設定、2人だけの関係状態・記憶・秘密を区別。現行美咲の関係履歴を新キャラクターへ自動複製しない。
2. **データ全経路のscope**：canonical会話・Relationship Event/Evidence/Episode/Pattern・persona traits/evolution候補・匿名root/import・Body Clock/通知/写真・replay・Forgetはペア境界を含む設計が必要。単にUIへキャラ切替を追加するのは不十分。
3. **既存保護維持**：canonical turn、DB保存RPC、user/request/processing version/lease token、失敗先行turnの順序制御、匿名rootの暗号化/expiry/revision、Body Clock配送原子性を迂回しない。交際成立をscoreやモデル演技だけで捏造しない。
4. **段階実装と品質**：まず現行美咲の品質実測、全RPC/呼出元・RLS/ACL・一意キーの台帳、論理ER・backfill/rollback/旧クライアント互換の審査、その後に明示承認で実装。設計書自体でgateや本番を変えない。

## 3. main固定コードと照合した範囲

固定main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。本文を直接取得し、以下を確認：

| サーフェス | 固定Blob SHA | 直接観測 |
|---|---|---|
| `supabase/migrations/20260917023000_phase1_relationship_state_and_events_foundation.sql` | `217daf4382ad16ec9cc341bfe6eb095c5dc7ee8a` | `misaki_relationship_state.user_id` PK（2行）、Eventはuser_id所有（27行） |
| `supabase/migrations/20261003081605_relationship_engine_v1_foundation.sql` | `83d92fdab7071aaaa7f8fa2c7c7c76930cb948c7` | Evidence一意キー `(user_id,request_id,evidence_key,analyzer_version)`（10行）、Episode `(user_id,episode_key,analyzer_version)`（18行）、Pattern `(user_id,pattern_key,pattern_version)`（31行）、critical pending PK `(user_id,request_id,candidate_type)`（39行） |
| `lib/canonical-state.ts` | `584989230ed0dc89a8aee961aa169e32d4646d3a` | canonical conversation history/memoryを`user_id`で取得（85–86行）；Relationship pending/importやturnもuser_id |
| `lib/persona/persona-store.ts` | `ada61b2bf5da0944d9870385cc1227b6fe887b9c` | user relationship traitsの読取がuser_id（167–173行） |
| `supabase/functions/body-clock/persona-store.ts` | `9a0e72fba0f0badf7a7db58b5a5d39e00f324836` | Body Clock側のuser traits取得もuser_id（160–166行） |
| `lib/persona/evolution-runner.ts` | `d2ac4b323f74d726c5c0fc172519b1263fd5c3d4` | traits読取はuser_id（32–34行）、候補保存は`create_user_evolution_candidate` RPC（89行） |
| `supabase/functions/body-clock/conversation-root.ts` | `9542912086152c0a51a68a70ea1329a72c14a4da` | Body Clock permanent rootも同じ`misaki_user_conversation_state`のhistory/memoryをuser_idで取得（21–22行） |

**観測から言えること**：固定mainの主要な現行経路は単一美咲に結び付いたuser単位のスコープであり、新キャラクターを導入する場合にpair境界を設計する必要がある。**mainにpairモデルを実装した／cross-character leakが実際に発生している、とは言わない**。pairを作るDB・RPC・UI実装は行っていない。

## 4. DOC-049だけの本番基準追補（絶対に埋没させない）

DOC-049第12章、201–240行：

- **過去の利用者実機受入記録（207行）**：Relationship Engine Ver2、メール保存・再ログイン後の履歴・記憶復元、5軸、3日間猶予、交際の確定を、2026-10-13時点の「受入済み」として記載。今回実機追試していないが、回帰防止の歴史的要求として保全する。
- **用語の注意（211行）**：`relationship_engine_v1_*`というmigration/表の名前だけで、当時の本番ランタイムがVer1だったと扱わない。v1 RPC bypassの再導入を避ける。
- **DB migration ledger読取の過去報告（215行）**：本番82件とGitHub main35件の文字列比較では一致11件/同名異version21件などと記録。これは当時のレポートであり今の本番SQL状態の証拠ではない。filename/version差の存在だけで不正なDBとして扱わず、ledger修復・resetなどを行わない。
- **Evolution所有者（216–217行）**：`claim_user_evolution_analysis`, `create_user_evolution_candidate`, `review_user_evolution_candidate`について2026-10-13時点のDB読取では`auth.uid()`に基づく本人所有者チェックを確認。ただしtraitsへのauthenticated直接INSERT/UPDATE政策も報告され、**review RPCだけがtraits書込口だとはしない**。変更前に全entrypoint確認。
- **Relationship v2 ACL（232–239行）**：leaseつきv2主要関数のカタログではpostgres/service_roleのみEXECUTE、security definer=false、空search_pathと記録。旧critical pending v1の一部はpostgres限定、`apply_relationship_emotion_action_v2`は別署名/definer=true・search_path=publicと記録。これは「当時のカタログ照合」であって**今回の本番権限確認やセキュリティ合格ではない**。別経路と最終実効関数を優先調査する。
- **古い文章の「未確認」と後日第12章の「確認済み」の整合**：同一版内でも時系列の追記がある。証拠の階層と日付を添えて伝える。原文の報告を静的照合の結果で上書きしない。

## 5. この2版から次に残る未解決事項

- `apply_relationship_emotion_action_v2`を含むEmotion/Actionの直接書き込み面、review RPCとtraits RLSの双方、pair移行後のACLやlease/user所有権の不変条件。
- Body Clock配送予約・外部Push・写真選択・Forget後の派生再利用、すべてのpair scopeの設計。
- 全migration・全RPCと本番実体を最新状態で同一視しない。過去報告は根拠を付して保管し、必要時に**読み取り調査の別承認**を受ける。
- `docs/MULTI_CHARACTER_DATA_SCOPE_INVENTORY.md`、`docs/MULTI_CHARACTER_RPC_CALLER_AUDIT.md`は第4次で既読（DOC-048/051）。その監査を今回2版へ重複加算しない。
- 後続のShared Conversation Engine設計PR #87/#88やForget PR #66とのscope/利用権の相互依存は未採用の設計候補として継続。

## 6. 進捗と禁止事項

今回の新規全文・変遷・main固定コード照合＝**DOC-049とDOC-050の2版**。第5次51台帳で49/85から**51/85版、残34版**。ブランチ判定の不足30件は未解消、legacy BLOCKED維持。第5次監査成果（38以降）を原文85版に混入させない。**実モデル・DB・UIテスト未実行、再現不具合の追加0、全資産監査未完了**。

GitHub変更先は既存監査ブランチ `docs/development-registry-audit-20261020` 上のこの新規文書のみ。main・本番Misaki・Supabase・アメふる、PR、deploy、branch削除、CI、課金Geminiに触れない。