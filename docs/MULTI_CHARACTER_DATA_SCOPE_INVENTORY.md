# 複数キャラクター化：データ所有・スコープ棚卸し

最終更新: 2026-10-13  
対象: `main` のソース・migration 文面監査  
状態: **設計レビュー用。DB変更・本番反映を承認する仕様ではない。**

## 1. 目的と結論

美咲の現行運用を壊さず、将来のキャラクターごとに人格・記憶・関係性を分離するため、データの所有者と読み書き境界を明確にする。

現行実装は複数の重要データを `user_id` 単位で持ち、キャラクターを識別するキーが見当たらない。したがって、UIやプロンプトに `character_id` を追加するだけでは分離は成立しない。読み取り・書き込み・非同期処理・通知・削除・進化分析の各経路で同じスコープ規則が必要。

本書はソース上で確認できた実装と、今後の設計提案を区別する。SQL migration の読解は、現在の本番DBに適用済みであること、実データの状態、実効GRANT/RLSを証明するものではない。

## 2. スコープの基本モデル（提案）

| スコープ | 含める情報 | 共有方針 |
|---|---|---|
| User Shared Profile | 呼び名の希望、仕事・生活の基本事実、ユーザーが共有を望む設定 | キャラクター間共有可。ただし機微情報・明示的な非共有設定を優先 |
| Character Definition | キャラクター固有の名前、人格、口調、生活設定、知識、関係ポリシー | そのキャラクターにのみ適用 |
| User × Character Pair | 関係ステータス、親密度、感情・距離感、二者間の出来事、相手にだけ話した記憶 | 当該ペアのみ。別キャラクターへ自動コピー禁止 |
| Pair Conversation | 会話履歴、会話から抽出した自然記憶、今日の記憶・要約 | 当該ペアのみをデフォルトにする。明示的に共有された事実のみUser Sharedへ昇格 |
| Character Knowledge | キャラクターが持つ一般知識・職業知識・地域知識 | キャラクター単位、または明示的に共有された知識パック単位 |
| User Experience / Work Memory | ユーザー本人の運転経験、現場観察、勤務傾向 | User Shared候補。ただし「本人の経験」と一般事実・仮説を区別 |
| External Context | 天気、交通、空港・鉄道・地域などの外部情報 | 共有キャッシュは可能。鮮度・出典・地域・取得時刻を保持し、会話へ入れる際は関連性で絞る |
| Delivery / Channel State | 通知予約、配信済み判定、写真・音声などの配信参照 | 配信元のキャラクターとペアに紐付ける。重複防止・送信権限はDB側で保証 |

**重要:** 「ユーザーの事実」と「美咲との間で起きた事実」は別物。「親密度」と「友達・恋人・配偶者等の関係ステータス」も別物。感情の一時的変化から婚姻等の確定イベントを自動成立させない。

## 3. 現行ソースから確認できた所有キーとリスク

| サーフェス | 現行ソース上の確認 | 現在の主なスコープ | 複数キャラクター化のリスク / 対応 |
|---|---|---|---|
| チャット人格ロード | `app/api/chat/route.ts` から `loadPersonaPrompt(supabase, userId, channel, relationshipTimeContext)` を呼ぶ経路を確認 | user + channel。呼出しに character ID が見当たらない | キャラクター解決を一元化し、後段すべてに確定済みの character/pair context を渡す |
| Persona Store | `lib/persona/persona-store.ts` および Body Clock 側 `supabase/functions/body-clock/persona-store.ts` | persona version / prompt modules / user traits | キャラクター固有の persona version と user-specific traits を分離。チャットと通知で同じ解決規則にする |
| 関係性の正本 | `misaki_relationship_state` は `user_id` が主キーの形 | 1ユーザーにつき1状態 | ペア単位へ論理的に分離する必要。単純に列を足す前にRPC・参照・制約・履歴の全依存を調査 |
| 関係イベント | `misaki_relationship_events` は user-centered。source message/delivery の参照あり | user | キャラクター／ペアを識別できないイベントは将来の関係履歴を混同する。既存行を推測で振り分けない |
| Relationship Engine evidence | `(user_id, request_id, evidence_key, analyzer_version)` の重複防止キーを確認 | user + request | ペアの識別がない。Evidence とその親イベントの所有スコープを一貫して拡張する必要 |
| Relationship Engine episodes | `(user_id, episode_key, analyzer_version)` | user | 同じキーのエピソードがキャラクター間で衝突し得る |
| Relationship Engine patterns | `(user_id, pattern_key, pattern_version)` | user | キャラクター間で傾向・パターンが混ざり得る |
| Critical pending | `(user_id, request_id, candidate_type)` | user + request | 重大イベント候補の所属キャラクターを保ち、正本ターンと同じペアで検証する必要 |
| Canonical conversation root | `lib/canonical-state.ts` は `misaki_user_conversation_state` から `history,memory,today_memory` を user_id で読む | user | 履歴・記憶をペア単位へ分離する設計が必要。既存データを全キャラ共有扱いにしない |
| Natural memory | `lib/persona/natural-memory.ts` はユーザーについての安定した事実を中心に抽出。最大件数制限あり | user-oriented | 抽出対象に「ユーザー一般の事実」と「美咲との会話でのみ成立した私的記憶」の区別が必要 |
| Persona Evolution | `lib/persona/evolution-runner.ts` は `misaki_user_relationship_traits` を `user_id` で読み、`create_user_evolution_candidate` RPC を呼ぶ | user | 呼び方・嫉妬・愛情表現等の関係依存特性が別キャラへ漏れる危険。候補・承認・反映すべてにスコープが必要 |
| Evolution 分析API | `app/api/persona/evolution/analyze/route.ts` は認証ユーザーの `misaki_user_conversation_state` の `history,memory` を読む | user | 分析時点でペアを選択・検証できない現状では、複数キャラのデータを安全に分析できない |
| Body Clock | `supabase/functions/body-clock/index.ts` は美咲固定の文言・配信文脈を持ち、会話状態と persona を user 単位で読む | user / Misaki fixed | 通知側だけ別キャラを選ぶと会話・人格・関係性が食い違う。キャラ識別・配信スコープ・重複排除を一体で設計 |
| 配信原子性 | `finish_misaki_body_clock_delivery` は lease、日次上限、配信記録、会話履歴・カウンタ更新を同一トランザクションで扱う migration を確認 | user + delivery | 原子性を維持したままペアの所有者を加える。クライアント側で配信可否を決めない |
| 一時利用・メール引継ぎ | temporary root は暗号化、revision/expiry、checkpoint/import と lease 制御の経路あり | user + temporary root | アカウント化時にどのキャラの関係・記憶として引き継ぐか明示が必要。自動で複数キャラへ複製しない |
| ユーザープロフィール | `lib/user-profile.ts` にタクシー運転手向け文脈・用語案内等がある | user profile / chat context | ユーザー固有の仕事知識は共有候補、キャラの人格・個別の関係経験とは分離 |
| 履歴・記憶の消去 | この棚卸しでは全削除経路と全ての参照元の確定を完了していない | 要追加調査 | UIで履歴削除・記憶削除を提供する前に、ペア単位と共有プロフィール単位の消去範囲、配信履歴・派生記憶の扱いを定義 |

## 4. 書き込み境界：保持すべき既存契約

Relationship Engine の `20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql` では、v2 RPC の主要書き込みが active lease を検証し、canonical chat turn が存在することを確認する構造を確認した。旧 v1 mutation RPC の service_role EXECUTE を取り消す記述もある。

今後のスコープ拡張でも以下を維持する。

- 永続状態の更新を直接 INSERT/UPDATE で迂回しない。既存の正規RPC契約を維持し、変更が必要なら署名・権限・呼出し元・テストをまとめてレビューする。
- `user_id`、`request_id`、`processing_version`、`lease_token` の検証と lease fencing を崩さない。
- 正本のチャットターンが確定する前に、そのターンに基づく関係性イベントを確定しない。
- リトライ・再実行で関係性の成長、イベント、通知が二重適用されないよう冪等性を保つ。
- 会話順はワーカー完了順ではなく canonical turn の順序に従う。ユーザー単位のロック／キューを character_id だけで分割しない。
- Body Clock の配信確定・履歴追加・カウンタ更新の原子性を保つ。
- anonymous temporary root の暗号化、期限、revision、サーバー側検証、checkpoint/import 境界を維持する。
- 既存の美咲の記憶を将来のキャラクターへ自動移行・コピーしない。

## 5. 次の実装前に必要な調査

以下は未完了。migration を読んだだけで実効権限や本番状態を推定しない。

1. **RPC完全一覧:** 関係性、canonical turn、Evolution候補作成・レビュー・承認、履歴／記憶、temporary root、Body Clock配信の全RPCについて、署名、security definer、所有者、EXECUTEのGRANT/REVOKE、RLS、呼出し元を対応付ける。
2. **Evolutionの状態遷移:** `create_user_evolution_candidate` とレビュー・適用RPC、承認者、適用先テーブル、削除時の派生データ処理を確認する。
3. **履歴・記憶の全経路:** チャット、要約、自然記憶、Body Clock、履歴表示、履歴消去、エクスポート、アカウント削除まで追跡する。
4. **現行DB照合:** 適用済みmigration、実効GRANT、RLS、テーブル定義、インデックス、実データ分布を読み取り専用で確認する。確認前に「本番も同じ」と断定しない。
5. **品質基準線:** 同一シナリオ・同一条件で、記憶正確性、関係性反映、会話一貫性、反復の少なさ、自然さ・温かさを複数回評価。小さなコスト削減は品質ゲート通過後に比較する。
6. **移行設計:** 既存の美咲データを Misaki pair にどう帰属させるか、ロールバック可能性、バックフィル・整合性チェック・段階導入を設計し、DB変更前にレビューする。

## 6. 受け入れ条件（最低ライン）

- どの会話・記憶・関係状態・通知にも、認証済み user と確定した character/pair の所有者が一意に定まる。
- キャラクターAで共有していない秘密・関係イベント・呼び方・親密度がキャラクターBのコンテキストに出ない。
- User Shared Profile と Pair-private memory の検索・保存・削除が別々にテストされる。
- 競合ターン、リトライ、ワーカー再起動、二重配信、アカウント化、削除を含むテストで canonical ordering と lease fencing が保たれる。
- 既存美咲ユーザーの体験が回帰しないことを、固定シナリオと本番挙動比較で確認する。
- 品質が事前に合意した基準を満たす。コストだけを合格指標にしない。

## 7. 関連する主要ソース

- `docs/MULTI_CHARACTER_PHASE0_AUDIT.md`
- `docs/IMPLEMENTATION_OVERVIEW.md`
- `docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md`
- `docs/SERVER_CANONICAL_STATE.md`
- `lib/canonical-state.ts`
- `lib/persona/natural-memory.ts`
- `lib/persona/evolution-runner.ts`
- `app/api/persona/evolution/analyze/route.ts`
- `app/api/chat/route.ts`
- `supabase/functions/body-clock/index.ts`
- `supabase/migrations/20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql`
- `supabase/migrations/20261003081902_relationship_engine_v1_analysis_write_surface.sql`

---
**変更範囲:** この文書はソース上の実装棚卸しと設計提案のみ。アプリコード、DB、RPC、本番設定、デプロイは変更していない。
