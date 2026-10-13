# Misaki Phase 0 実装棚卸し：複数キャラクター拡張の非破壊監査

最終更新: 2026-10-13  
対象: `main`  
目的: 「美咲一人の現行運用を壊さず、将来はユーザー×キャラクターごとに独立した関係・記憶を持てる」構造へ進むための事実確認。  
**この文書の作成ではアプリコード・DB・RPC・本番設定を変更していない。**

## 1. 結論

現状は「キャラクターを切り替えるだけ」の変更では複数キャラクター化できない。関係性のcanonical state、Relationship Engine v1の証拠・エピソード・パターン・処理台帳、人格プロンプトの取得、会話・一時状態、Body Clockがユーザー単位／美咲固定の前提で結び付いているためである。

ただし、現行のcanonical state保存、RPC経由のRelationship Engine書き込み、lease fencing、匿名一時状態の暗号化境界は重要な安全契約であり、これらを迂回したり、今回の構想だけを理由に直接変更したりしてはならない。

**推奨順序:** ①現行の会話品質と関係性反映を測定 → ②データ所有権と参照依存表を完成 → ③後方互換を保つ論理モデル／移行案をレビュー → ④明示承認後に最小の実装変更。初期リリースは美咲のみを維持する。

## 2. ソース確認済みの現状

| 領域 | ソースで確認したこと | 複数キャラクター化への意味 | 扱い |
|---|---|---|---|
| Canonical relationship state | `20260917023000_phase1_relationship_state_and_events_foundation.sql` で `misaki_relationship_state.user_id` が主キー。親密度・感情・行動状態を1ユーザー1行で保持する。 | ユーザー×キャラクターの独立状態をそのまま表せない。 | ブロッカー。即時変更しない。 |
| Relationship events | 同migrationで `misaki_relationship_events` は `user_id` を中心に記録。後続migrationでは `request_id` を使った重複防止やcanonical turnとの順序依存がある。 | イベントの対象ペアが明示されていない。過去イベントを別キャラクターへ誤帰属させない移行方針が必要。 | 全RPC・FK・一意制約の依存監査が必要。 |
| Relationship Engine v1 Evidence / Episode / Pattern | `20261003081605_relationship_engine_v1_foundation.sql` の `misaki_relationship_evidence`, `episodes`, `patterns`, `critical_pending` は `user_id` とユーザー単位の一意制約が中心。Evidenceのsubject既定値は `user_to_misaki`。 | キャラクターを変えても同じ証拠・分析結果へ混入するリスクがある。 | pair/character scope設計が必要。 |
| Canonical critical event | `20261003081717_relationship_engine_v1_canonical_state_and_critical_event.sql` はユーザー単位のstateをロックし、canonical chat turnの存在確認後に関係イベントを適用する。 | 対象ペアを足すならロック単位、重複防止キー、状態遷移をまとめて再設計・検証する必要がある。 | 既存RPC契約を保ち、移行設計後に扱う。 |
| Lease fencing | `20261003094200_relationship_engine_v1_full_lease_fencing.sql` では各v2書き込みRPCが同一トランザクション内でユーザー・request・processing version・lease tokenを検証する。 | 将来のpair scope変更でlease所有権とfencingを弱めてはいけない。 | 必須不変条件。 |
| Relationship worker | `lib/relationship-runtime-v1.ts` はユーザー単位でworkerをdedupeし、canonical turnを時系列処理。匿名rootのtrajectory importも同じper-user leaseの中で処理する。 | 同一ユーザーの複数キャラクターを並列・独立処理するにはworkerキー、台帳、import契約の影響確認が必要。 | 要設計。既存処理のキーだけ先に変えない。 |
| Persona store（chat） | `lib/persona/persona-store.ts` は `misaki_persona_versions` のactive版を1件取得し、`misaki_prompt_modules` を全体プロンプトとしてキャッシュ。関係特性も `user_id` のみで取得。関数引数にcharacter IDがない。 | キャラクター選択、character別persona、ペア特性のスコープがまだ汎用化されていない。 | 追加設計が必要。 |
| Persona store（Body Clock） | `supabase/functions/body-clock/persona-store.ts` にも同様のactive global persona取得とuser_id単位の関係特性がある。 | chatだけ切り替えても通知側で人格・関係が不一致になる。 | chatとBody Clockを一体で監査する。 |
| Chat route | `app/api/chat/route.ts` は `loadPersonaPrompt(supabase, userId, channel, relationshipTimeContext)` を使い、関係性処理・canonical turn保存・後処理workerを接続。東京の天気・東京生活イベントもルートに含む。 | character IDは現行の主要なリクエストコンテキストとして見当たらず、キャラクターの地域とユーザー地域も分離されていない。 | request context / context selection設計が必要。 |
| User profile / work context | `lib/user-profile.ts` は名前、居住地、職業、勤務形態を抽出するが、タクシー運転手・東京タクシーの特別判定と専門語ガイドを持つ。 | 現在の対象には合っているが、複数職業・全国対応では共通profileと職業別知識を分離する必要がある。 | 会話品質を落とさず段階的に一般化。 |
| Anonymous temporary root | `lib/canonical-state.ts` は一時状態をAES-256-GCMで封印し、期限とサーバー側root/revisionを検証。永久アカウントと匿名rootの境界を持つ。 | pair scopeを導入しても、匿名状態の暗号化・改ざん防止・email checkpoint/import境界を保持する必要がある。 | 必須不変条件。 |
| Body Clock / proactive delivery | Body Clockは独立したSupabase FunctionとRPC・delivery ledger・temporary stateを持つ。 | 通知の「送信理由」と「どのキャラクターがどう話すか」を分離し、pair関係を参照できるようにする必要がある。 | chatと別々に実装しない。 |

## 3. 設計上の重要な区別

複数キャラクター対応で、最低限以下を混同しない。

- **User**: ユーザー共通プロフィール。共有可否と出所を持つ。
- **Character**: 固定人格・生活設定・恋愛方針・地域。
- **Pair (User × Character)**: 親密度、関係軸、感情、関係ステータス、ペア固有の記憶。
- **Relationship event**: 告白・交際成立・拒否・別れ・結婚等の検証された履歴。
- **Memory scope**: user-shared / character-private / pair-private / external-shared 等。スコープは検索時に適用する。
- **Work knowledge**: 職業一般の知識とユーザー固有の経験を分離する。
- **External context**: キャラクターの生活圏とユーザーの居住地・勤務地域・登録地点を分離する。
- **Reply Core**: 共通の生成・検証・保存処理。人格やペア状態そのものを複製しない。

## 4. 既存の安全契約（変更禁止の前提）

1. Relationship Engineの永続書き込みは既存RPC契約を通し、テーブルへの直接INSERT/UPDATE/mergeで迂回しない。
2. lease token、processing version、request ID、replay/idempotency、canonical turn完了条件を維持する。
3. 匿名temporary rootは暗号化・期限・revision・サーバー側検証を維持し、ユーザー入力でcanonicalな関係状態を指定させない。
4. 失敗した先行turnを飛ばして後続turnだけ適用しない。
5. 交際・婚姻の成立をGeminiの演技やスコアだけで確定しない。
6. 既存の美咲の記憶・関係履歴を他キャラクターへ自動コピーしない。
7. gate OFF / production enablement等の既存運用判断を、この文書だけを根拠に変更しない。

## 5. 次の作業順

### A. 依存関係インベントリを完成させる
- migration全件を時系列に並べ、テーブル・列・主キー・FK・一意制約・RLS・grant・RPCを一覧化。
- 各RPCの呼び出し元、worker lease、processing ledger、canonical turn、temporary importの対応を照合。
- `misaki_user_conversation_state`、memory/retrieval、relationship traits、persona version/module、Body Clockの所有者とscopeを明示。
- chat、Body Clock、persona evolution、push deliveryの各入口を同じ表に載せる。

### B. 会話品質の現状を測る
- 親密度、5軸、関係ステータス、感情、記憶、仕事文脈が実際に返信へ反映されるケースを作る。
- 正確性、継続性、自然さ、繰り返し、根拠のない関係昇格、キャラクター間の情報漏えいを評価する。
- コストは品質合格を前提に比較し、わずかな節約のみで品質低下を受け入れない。

### C. 論理モデルと移行計画をレビューする
- 現行データをMisakiとの関係として保持する方針を候補に、backfill・rollback・互換期間を設計。
- pair IDをどこに持たせるか、旧RPCをどう維持／version upするか、lease・一意制約・処理順序をどう保つかを設計図で提示。
- migration順序、バックフィル検証、旧クライアント互換、ロールバック、競合・再試行テストを明記。
- **ソラの設計レビューと明示承認が出るまでDB・RPC実装へ進まない。**

## 6. 現時点のステータス

- [x] 長期構想を既存総覧へ統合
- [x] 主要なstate / event / Engine v1 migrationをソース確認
- [x] persona store（chat / Body Clock）、chat route、canonical state、workerの主要境界を確認
- [x] lease fencingと匿名root境界を重要不変条件として明記
- [ ] 全migrationの列・制約・RLS・grant・RPC依存一覧
- [ ] memory/retrievalとpersona evolutionの完全なscope監査
- [ ] Body Clock deliveryとchatの関係・記憶参照の照合
- [ ] 会話品質評価セットと実測結果
- [ ] pair scopeの論理ER図・移行・rollback案
- [ ] 明示承認後の実装・テスト

## 7. 参照ソース

- `docs/IMPLEMENTATION_OVERVIEW.md`
- `docs/RELATIONSHIP_ENGINE_V1.md`
- `docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md`
- `docs/SERVER_CANONICAL_STATE.md`
- `supabase/migrations/20260917023000_phase1_relationship_state_and_events_foundation.sql`
- `supabase/migrations/20261003081605_relationship_engine_v1_foundation.sql`
- `supabase/migrations/20261003081717_relationship_engine_v1_canonical_state_and_critical_event.sql`
- `supabase/migrations/20261003094200_relationship_engine_v1_full_lease_fencing.sql`
- `lib/persona/persona-store.ts`
- `supabase/functions/body-clock/persona-store.ts`
- `app/api/chat/route.ts`
- `lib/canonical-state.ts`
- `lib/relationship-runtime-v1.ts`
- `lib/user-profile.ts`
