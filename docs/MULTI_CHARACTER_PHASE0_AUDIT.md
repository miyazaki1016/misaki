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


## 8. 追加監査：長期記憶・人格進化・Body Clockの実際のscope

以下はソースを追加確認した結果。前節の「完全なscope監査」は引き続き未完了だが、具体的な要注意箇所が判明した。

### 8.1 長期記憶と会話履歴は現在ユーザー単位

- `lib/persona/natural-memory.ts` は長期記憶を「ユーザー本人についての安定した情報」と定義し、最大30件へ統合する。キャラクター別の記憶scopeはこのガイド内にはない。
- `lib/canonical-state.ts` の `loadCanonicalState(userId)` は `misaki_user_conversation_state` を `user_id` で読み、`history`, `memory`, `today_memory` を一括で取得する。
- `supabase/functions/body-clock/conversation-root.ts` も同じ `misaki_user_conversation_state` を `user_id` で読む。恒久アカウントの通常会話とBody Clockは同じ会話正本を使う設計である。
- `app/api/persona/history/route.ts` の明示編集も、現行のユーザー状態を更新するRPCへつながる。複数キャラクター導入時は、記憶削除・履歴クリアの対象範囲もUIとAPIで明示しないと、意図しない一括削除／誤ったキャラクターへの適用が起こりうる。

**結論:** 今ある `memory` をそのまま「全キャラクター共有記憶」と見なすのは危険。ユーザー共通プロフィールとして許可する事実と、美咲との会話履歴・二人だけの思い出を分ける必要がある。現行データの全件を他キャラクターへ自動公開しない。

### 8.2 Persona Evolutionもユーザー単位

- `lib/persona/evolution-analyzer.ts` の分析対象は美咲との履歴・記憶・既存traitsで、プロンプトは「このユーザーとの関係だけに使う」調整候補を作る前提。
- `lib/persona/evolution-runner.ts` は `misaki_user_relationship_traits` を `user_id` で読み、候補保存を `create_user_evolution_candidate` RPC経由で行う。分析slotのclaimも履歴fingerprintとcadenceに基づく。
- `app/api/persona/evolution/analyze/route.ts` は恒久アカウントの保存済み履歴・記憶を優先して分析する。現行のリクエストにはcharacter IDがなく、candidate/reviewの所有権も現状のユーザー単位設計に沿っている。
- `lib/persona/persona-store.ts` と `supabase/functions/body-clock/persona-store.ts` はユーザー別traitsを人格プロンプトへ追加するが、character/pairキーによる分離は確認できない。

**結論:** キャラクターAとの関係で学習した「嫉妬しやすさ」「呼び方」「愛情表現」などをキャラクターBへ漏らさないため、trait・evolution candidate・review RPCにもpair scopeを通す必要がある。既存のGlobal Persona modulesと、ユーザー別の関係特性を同じスコープとして扱わない。

### 8.3 Body Clockは美咲固定のまま

- `supabase/functions/body-clock/index.ts` は会話rootから履歴・記憶を読み、`loadPersonaPrompt(supabase, userId, "proactive")` で人格をロードする。
- 自発文のプロンプトには「美咲」「美咲の体内時計」等の固定表現があり、写真選択・関係性判断・delivery ledgerもユーザー単位の配送フローに接続している。
- したがって、通常チャットにcharacter IDを追加するだけでは、通知で別キャラクターが送る／誤ったペアの記憶を参照する問題を防げない。キャラクター別通知設定、配送予約、送信時のpersona/state snapshot、retry時の同一性を一体で設計する必要がある。

### 8.4 会話品質の検証対象を明確化

実測評価では、少なくとも次を別々に判定する。

1. **関係状態反映:** 5軸、親密度、関係ステータス、感情・行動状態が返信の語調・距離感に実際に反映されるか。
2. **記憶の正確性:** 明示されたユーザー事実を保持し、訂正・忘却を反映し、存在しない思い出を作らないか。
3. **会話継続性:** 直前の話題、長期テーマ、生活イベントを必要なときに参照し、関係ないときは無理に持ち出さないか。
4. **人格一貫性:** 固定人格とユーザー別の関係特性を区別し、人格進化がコア設定を変えていないか。
5. **ペア間隔離:** Aとの恋愛・喧嘩・告白・秘密・思い出・進化traitsがBへ混入しないか。
6. **失敗時の安全性:** Gemini失敗、retry、二重送信、並列会話、通知とチャットの競合で、状態や記憶が巻き戻ったり二重適用されないか。
7. **コストとの比較:** 品質の合格を先に確認してから、token量・遅延・Gemini呼び出し数を比較する。コスト差だけで品質劣化を正当化しない。

## 9. 監査の更新ステータス

- [x] 自然記憶ガイドとcanonical conversation stateを確認
- [x] 通常チャットとBody Clockが同じ恒久会話正本を読むことを確認
- [x] Persona Evolutionのuser単位traits/candidate処理を確認
- [x] Body Clockの人格・文面が美咲固定であることを確認
- [ ] 各RPCの全署名・grant・RLS・一意制約・呼び出し元を完全照合
- [ ] Persona Evolution review/candidateのDB側所有権とスコープを照合
- [ ] 通知予約・配送台帳・写真選択・retryを含むpair scopeの設計
- [ ] 評価用会話セット作成と現行品質ベースライン実測
- [ ] 論理ER図・backfill・compatibility window・rollback案をレビュー


## 10. 追加監査：DB書き込み境界と配送の原子性

2026-10-13に関連migrationのDDL/RPC本体を追加確認。これはmigrationファイル上の契約確認であり、接続先本番DBに対する実テーブル状態・実grant・実データの検査ではない。

### 10.1 Relationship state / eventの既存キー

- `20260917023000_phase1_relationship_state_and_events_foundation.sql` では `misaki_relationship_state.user_id` が主キーで、関係状態は1ユーザー1行。RLSを有効化し、`public/anon/authenticated` の書き込みを剥奪、authenticatedにはSELECT、service_roleにはCRUDを付与する構成。
- `misaki_relationship_events` は `user_id` を所有者とし、`source_message_id` と `source_delivery_id` にFKを持つ。これらのイベントはペアIDを明示しないため、既存行は現行美咲の履歴として保持する移行候補が自然だが、実データの意味づけはソラのレビューで確定する。
- `20261003081605_relationship_engine_v1_foundation.sql` では evidenceの一意制約が `(user_id, request_id, evidence_key, analyzer_version)`、episodeが `(user_id, episode_key, analyzer_version)`、patternが `(user_id, pattern_key, pattern_version)`、critical pendingが `(user_id, request_id, candidate_type)`。character/pair scopeを導入する場合、各一意制約と関連インデックス・参照テーブルをまとめて設計する必要がある。

### 10.2 Canonical turn / lease fencingは書き込みの前提

- `20261003081902_relationship_engine_v1_analysis_write_surface.sql` のv1 evidence/episode/pattern等の書き込み経路はcanonical chat turnの存在確認や、参照するevidence/episodeが同じuser所有であることの確認を行う。
- `20261003094200_relationship_engine_v1_full_lease_fencing.sql` はv2 RPCの書き込み前に `assert_misaki_relationship_lease_v1` を呼び、`user_id + request_id + processing_version + lease_token` に対応する有効期限内leaseをDBトランザクション内で確認する。またprocessing/analyzer versionの整合性も検証する。
- `20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql` はv2の書き込み処理を直接実装し、旧v1の書き込みbypassを廃止する方向のmigration。したがってpair scope化は「新しい列を追加するだけ」では済まず、全v2署名・内部所有権検証・grant/revoke・worker leaseのスコープを揃える必要がある。
- 今後の変更では、旧RPCの直接呼び出しが残っていないか、service_roleのEXECUTE grantが意図どおりかを、migrationと実DBの双方で確認する。migrationテキストだけでは現在の本番grantを断定しない。

### 10.3 Body Clock配送は状態・履歴・日次上限を一括確定

- `20260916002657_misaki_body_clock_atomic_delivery_and_vault_auth.sql` の `finish_misaki_body_clock_delivery` は、`background_push_state` のlease時刻を検証して行ロックを取得し、日次送信上限を確認した後、proactive deliveryの作成、`misaki_user_conversation_state.history` への追加、message count更新、次回送信時刻と日次回数更新を1トランザクションで行う。
- 同migrationはcron secretをVaultで保持・検証し、関数の実行権限も制限する。 `20260916010326_misaki_body_clock_push_relay_attempts.sql` はdelivery IDを主キーとするpush attempt台帳を持つ。
- pair scope導入時は、deliveryだけにcharacter IDを足すのでは不十分。lease/予約キー、会話履歴の保存先、日次上限の適用単位、写真選択、push attemptの再送・同一性をまとめて設計し、現行の原子性と秘密管理を維持する必要がある。

### 10.4 この時点での設計上の帰結

1. 最初の実装はDB変更ではなく、現行Misakiに対する会話品質ベースラインとRPC呼び出し元一覧を作ること。
2. 既存Misakiデータの移行は、pair IDを機械的に付けるだけでなく、canonical chat turn・event・deliveryの関連性と一意制約を維持して検証すること。
3. 将来のcharacter IDは、request context、conversation state/memory、relationship engine、persona evolution、proactive deliveryの各境界で必須扱いにする範囲を設計する。未指定時に別キャラクターへ暗黙fallbackしない。
4. 本番DBの実状態・RLS/grants・データ件数・バックフィル可能性はまだ未確認。接続DBへクエリを実行したかのように扱わない。

## 11. 次の実作業

- [x] 関係状態/evidence/episode/pattern/critical pendingの主要キーと一意制約をmigrationで確認
- [x] canonical turn、lease fencing、legacy write bypass廃止の契約を確認
- [x] Body Clock deliveryの履歴・日次上限・予約時刻更新が原子的であることをmigrationで確認
- [ ] 全RPCの署名とGRANT/REVOKEの一覧を作り、実際の呼び出し元と照合
- [ ] Persona Evolution candidate/reviewのRPC所有権・grant・scopeを確認
- [ ] 通常チャット、履歴編集、Evolution、Body Clock、push relayを横断する「データ所有者／スコープ／書き込み境界」表を完成
- [ ] 既存Misakiの会話ケースで品質ベースラインを実測
- [ ] Soraレビュー用の論理ER・backfill・rollback案を作成


## 12. 本番基準との整合補記（2026-10-13）

この節は、上記のソース監査時点から更新された本番情報を反映する。過去の節は当時の確認範囲を示す記録として残し、現在の本番状態の説明としては本節を優先する。

### 本番で確認済みの受入結果

ユーザーによる実機確認済み: Relationship Engine Ver2への置換、メール保存、ログイン後の会話履歴、記憶の復元、5軸の関係性判定、3日間の猶予、恋人関係の確定。これらは未検証項目へ戻さず、今後の変更の回帰テスト対象とする。

### バージョン表記の注意

`relationship_engine_v1_*` はmigration名・テーブル・旧書き込み経路の名称を示すことがあり、それだけで「本番ランタイムがVer1である」と結論づけない。現在の本番ランタイムの基準はGitHub `main` のソースと本番DBの実定義であり、ユーザーによるVer2の実機確認結果も受入記録として保持する。pair-scope監査では、旧v1 mutation RPCへのbypassが再導入されないことと、現行Ver2の契約を維持することを確認する。

### 本番DBを読み取り照合した結果

- 2026-10-13に接続先本番DBのmigration ledgerを読み取り、82件を確認した。GitHub `main` のmigrationファイル35件との単純なversion/name照合では一致11件、同名で異version 21件などの差がある。詳細と解釈ルールは `docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md` を参照。
- Persona Evolutionの `claim_user_evolution_analysis`、`create_user_evolution_candidate`、`review_user_evolution_candidate` は本番DB上で確認した。3関数はいずれも `auth.uid()` を利用して利用者を特定し、候補作成・レビューの所有者を本人に限定する実装を確認した。今回の照合範囲では、この3関数について他ユーザーの候補を操作できる問題は確認されなかった。
- `misaki_user_relationship_traits` には本人の行を対象とするauthenticated INSERT/UPDATEポリシーが存在する。したがって、レビューRPCだけがtrait書き込み経路だとは断定できない。直接更新を許す仕様が意図どおりか、全呼び出し元の棚卸しと合わせて別途判断する。
- migration ledgerとファイル名の差は、文字列差だけではDB不整合の証拠にならない。適用履歴の直接修正、reset、再適用は行わない。

### 更新後の作業状態

- [x] 本番migration ledgerを読み取り、mainのmigrationファイル名・versionと比較
- [x] Persona Evolutionの3 RPCの実定義・実行ロール・所有者チェックを読み取り確認
- [ ] 全migrationの履歴由来を分類し、mainに存在しない履歴のソースを追跡
- [ ] traitsへの直接書き込み経路をリポジトリ全体で特定し、RPC専用にすべきか仕様判断
- [ ] Relationship Engine Ver2の現行DB関数・権限・呼び出し元の照合結果を、実機受入項目と合わせて記録
- [ ] pair scopeの論理ER・backfill・rollback案は、履歴由来と書き込み境界の棚卸し完了後にレビューへ回す

本節の追加も文書変更のみであり、本番DB・アプリコード・RPC・権限・本番設定は変更していない。
