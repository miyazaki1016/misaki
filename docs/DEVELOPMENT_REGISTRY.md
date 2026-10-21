# Misaki 開発管理台帳 — 棚卸し中

> **未来のソラへ：作業前に `docs/IMPLEMENTATION_OVERVIEW.md` とこの台帳を必ず読むこと。**
> チャットの記憶・説明だけで「完成」「main統合済み」「本番適用済み」と判定しない。
> **総覧は設計・全体仕様の正本、こちらは実装・検証・PR・未完了作業の追跡台帳。**

更新: 2026-10-20 JST  
状態: **第1版／棚卸し途中。確認済みの証拠と未確認事項を分離。**  
調査対象: `miyazaki1016/misaki`、全91ブランチ（main含む）のGit ancestry比較、主要ブランチのファイル差分・資料・PR。  
この台帳の作成は専用docsブランチのみ。main・Production・Supabase・Gemini実呼出しは変更しない。

## 判定規則

- **A**: mainに実装済み（機能の動作とコードを別途確認）。
- **B**: 作業ブランチに実装と検証記録があるが、main反映が確認できない。
- **C**: 実装・実験はあるが、本番相当の検証や採用条件が未完了。
- **D**: 設計・監査・研究のみ。
- **U**: 未判定。**PR本文・過去のテスト成功・Preview READYは、本番稼働の証明ではない。**
- `ahead_by` はGitの祖先差分であり「未統合の機能数」ではない。`ahead=0` でも機能品質・本番反映の保証ではない。
- 同じパスがmainにないことは、そのファイルの不存在のみを証明し、同等機能の不存在までは証明しない。
- **禁止**: 棚卸しを理由としたブランチ削除、mainへの自動merge、Production deploy、DB migration、実ユーザーデータ取得、課金API実行。

## 優先案件：確認済み証拠と残件

| 案件 | 判定（暫定） | ブランチ / PR | 実装・テスト・資料の証拠 | mainとの確認と残件 |
| --- | --- | --- | --- | --- |
| Forget Control v1 | **B/C** | `work/forget-control-v1` / [#66](https://github.com/miyazaki1016/misaki/pull/66) | `supabase/functions/_shared/forget-control.ts`; `supabase/migrations/20261006200002_forget_control_v1.sql`; `tests/reports/forget-batch-evaluation.md`。報告上、検証専用23/23、UTC/JST各284/284成功。20シナリオのscripted比較。PR本文にはcanonical忘却・再学習・rollback注意事項。 | 同名forget-control.tsはmainに見つからない。実Gemini意味判定の同等性は未証明。別実装・PR状態・DB適用状況を照合するまで統合禁止。 |
| 重複返答削減 / Context A/B | **C** | `work/context-no-duplicate-replies-ab` / [#78](https://github.com/miyazaki1016/misaki/pull/78) | `lib/context-ab-balanced.ts`、`docs/CONTEXT_AB_EXPERIMENT.md`、`docs/context-ab-real-history-quality-review.md`。簡略Preview実験で1922→1616 input tokens（15.9%削減）。 | 同名balanced.tsはmainにない。実会話の返答品質盲検比較は未実施、Productionプロンプト相当ではない。実会話の利用は同意と隔離が前提。 |
| Context圧縮の計測研究 | **C/D** | `work/conversation-context-compression-spike` | `docs/conversation-context-compression-spike.md`、`lib/context-overlap-analysis.ts`、`lib/context-size-measurement.ts`、テスト。 | 実運用の削減・品質・速度は未実証。baseline計測と同一条件の品質評価が必要。 |
| 5軸の段階的Interpreter | **C** | `experiment/interpreter-gradual-acting-20261015` / [#85](https://github.com/miyazaki1016/misaki/pull/85) | `lib/relationship-acting-guide-gradual-experiment.ts`、`docs/INTERPRETER_GRADUAL_COMPARISON_20261015.md`、テスト。 | 同名実験ファイルはmainにない。静的比較のみ。現行intimacyStageガード等が実験版に未移植。実Gemini A/B未実施。 |
| 共通会話エンジン / 複数キャラ | **C** | `experiment/shared-conversation-history-v1-20261015` / [#88](https://github.com/miyazaki1016/misaki/pull/88) | `lib/conversation-engine/` の純粋ヘルパー群、`docs/CONVERSATION_ENGINE_MULTICHARACTER_GAP_AUDIT_20261016.md`、各テスト。 | `lib/conversation-engine/layered-prompt.ts`はmainにない。Gemini出力契約、再試行、canonical保存、DB分離、Production parity未達。 |
| 会話品質検証ラボ | **C** | `experiment/conversation-lab-offline-v1-20261015` / [#86](https://github.com/miyazaki1016/misaki/pull/86) | `lib/conversation-lab/runner.ts`、評価・fixture・テスト、`docs/CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md`、iPhoneレビュー画面。過去にコミット`f92250fc1ac79efa44c72468e00449d3fdc7ce6e`のCI成功記録。 | runner.tsはmainにない。実Gemini品質評価は未実施。実験用生成経路は安全ゲート未有効化。本番DB・アメふるDBを流用しない。 |
| Relationship Time v2 | **U** | `sora/relationship-time-v2-design` | `lib/relationship-time.ts`、relationship reducer、Body Clock、SQL migrations、多数のテストをmainとの差分で確認。Git ancestry ahead=276 / behind=323。 | 古い分岐の大規模差分。現mainでの再実装・置換・退行を個別比較するまで未統合とは断定しない。migrationを実行しない。 |
| Relationship Identity v1 | **U** | `work/relationship-identity-v1` | `lib/relationship-identity-resolver.ts`、関連migrationとテスト。ahead=81 / behind=24。 | `work/context-no-duplicate-replies-ab`にも関連ファイルが含まれ重複。mainのcanonical設計と照合が必要。 |

## PR・レビュー確認の注意

- #66、#78、#85、#86、#88のhead branchとPR本文をGitHubで照合済み。
- これらのPR本文は当時の説明。**現在のopen/closed/merged、CI最新結果、レビュー承認状態は別途確認する。**
- 過去の成功テスト件数は当時の記録であり、現在のmainや全ブランチで再実行した結果ではない。
- PR #86では「テスト未確認」という初期本文の後、ブランチ上の資料で後続CI成功が記録されている。時点を混同しない。

## 未完了の棚卸し

1. 現mainのコードを機能単位で検索し、別名で再実装されたものを確認する。
2. 主要PRの最新state、merge SHA、レビュー、CIを照合する。
3. 残りの全ブランチを機能群に分類し、重複・祖先ブランチ・検証のみの枝を区別する。
4. `docs/IMPLEMENTATION_OVERVIEW.md` の記載と突き合わせ、未記載・古い記述・矛盾を一覧化する。
5. A/B/C/D/Uの暫定判定を根拠付きで更新。削除候補でもブランチ削除はしない。
6. 確認できた節目ごとにこの台帳を更新し、チャット終了時の一括記録に依存しない。

## 引き継ぎスナップショット

2026-10-20: 91ブランチのGit比較、主要8ブランチの変更ファイル調査、主要6資料の読取、5 PRのhead検索、mainに存在しない代表5パスの確認を実施。**現時点で本番変更なし、main変更なし、branch削除なし、実Gemini呼出しなし。** 次は「PR状態・mainの同等機能・総覧の整合」から再開する。


## 2026-10-20 追加監査：PR・main実体・総覧

### 新たに確認したPR

- [#67 Relationship Identity v1](https://github.com/miyazaki1016/misaki/pull/67): PR本文では **「Production適用済み・Identity gate OFF・Draft維持・merge禁止」** と明記。これは「Productionに何もない」と同義ではない。DB適用済みの主張とアプリ機能のmain未統合は分けて扱う。4 migrationの本番履歴一致はPR本文の記録であり、この棚卸しでProduction DBに再接続して検証したわけではない。
- [#31 Relationship Time v2](https://github.com/miyazaki1016/misaki/pull/31): 感情・行動・Body Clock・関係ストーリーの統合実装をPR本文で確認。**mainに `lib/relationship-time.ts` が実在**するため、旧ブランチの大量aheadをもって「v2が丸ごと未統合」と判断しない。ファイル単位の差分・実動作を継続監査。
- [#81 Production source-of-truth reconciliation](https://github.com/miyazaki1016/misaki/pull/81): GitHub mainをアプリの基準、Production SupabaseをDB実体の基準とする文書監査。RPCの複数overload・migration台帳と実DBの不一致可能性を記録。**migrationファイル名だけでProduction未適用と判断しない**。

### mainでの実体照合

- `docs/IMPLEMENTATION_OVERVIEW.md` はmainに存在。先頭記載の最終更新は **2026-10-13**。長期ビジョン・複数キャラ構想を「将来設計であり実装済みではない」と明示している。
- `lib/relationship-time.ts` はmainに存在（blob SHA `1283b6cd5d67073d91cd0b028a3cdcb96a286bbb`）。**Relationship Time関連をすべてB扱いにしない**。
- `lib/relationship-identity-resolver.ts` はmainの同名パスに存在しない。PR #67のProduction migration適用主張とは矛盾しない。mainの別名実装・gate状態は未確認。
- **現mainの総覧は約151k文字**。総覧があること自体は個々の機能の完成・本番稼働を証明しない。差分の証拠と照合する。

### 判定更新（追加根拠）

| 対象 | 暫定判定 | 理由 |
| --- | --- | --- |
| Relationship Time v2 | **Aの一部を確認 / 全体U** | mainにrelationship-time.tsあり。PR #31の全構成要素・Body Clock等の現行稼働は未確認。 |
| Relationship Identity v1 | **B + DB適用主張あり / 全体U** | mainに同名resolverなし。PR #67にはProduction適用済み・gate OFFと明記。DBを再検証していないため主張と事実を区別。 |
| Production source-of-truth audit | **D（文書監査）** | PR #81に調査結果。アプリ実装やmigration完了の証明ではない。 |

### 重要な運用上の教訓

**「mainにない＝本番DBにもない」は誤り。** 特にIdentityは本番migrationとfeature gateを分けて確認する。  
**「古い枝がmainよりahead＝機能未統合」も誤り。** Time v2のようにmainに同名コードがある。  
**「PR本文のProduction適用済み＝現時点のDB実測」でもない。** 接続による再検証をしていない限り、資料上の主張として記録する。

### 次の照合順序

1. mainのrelationship-time、Body Clock、relationship state周辺のファイルとPR #31の機能表を照合。
2. Identityのmigration 4本とmainの現在のgate・resolver/consumer経路を確認（本番DBは読み取りすら明示的な目的と範囲を決めてから）。
3. 総覧のForget/Identity/Time/5軸の節を見出し単位で索引化し、台帳と突き合わせ。
4. 全ブランチを機能別にグルーピングし、PRと現mainの重複実装を精査。

**更新は台帳専用ブランチのみ。main・本番・DBは無変更。**


## 2026-10-20 追加監査：mainの現行コードとmigrationパス

読み取りのみで次を確認した。

| mainの対象 | 結果 | 意味 |
| --- | --- | --- |
| `app/api/chat/route.ts` | **存在**、blob `5600ad37f2660049a570c4dd340e8ed140d9843b` | 現行チャットの実体。冒頭で`relationship-engine-v1`、`relationship-runtime-v1`、`chat-recall`、canonical state等をimport。新しい実験機能の統合判定はこのルートと依存関係を基準に行う。 |
| `lib/relationship-time.ts` | **存在**、blob `1283b6cd5d67073d91cd0b028a3cdcb96a286bbb` | 時間経過・intimacy・emotion・actionの文脈型と読込処理を確認。v2全体の導入証明ではない。 |
| `lib/relationship-identity-resolver.ts` | **同名パスなし** | Identityの作業ブランチ実装が同じパスではmainにない。別実装やDBの適用有無は別問題。 |
| `supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql` | **同名パスなし** | PR #67に記録されたProduction適用済みとの記述を否定しない。migrationのリネーム・適用履歴・schemaを区別する。 |

**注意：** GitHubのmainコード検索はこの環境では空結果が返り、網羅的な参照検索として利用できなかった。個別ファイルの実在確認のみを証拠とする。総覧の最終更新表記は2026-10-13であり、2026-10-20の全成果を網羅している保証はない。

次回: `app/api/chat/route.ts` の依存先と実験ブランチの変更箇所を比較し、mainの同等実装をファイル単位で判定。Identity migrationはDB変更なしで履歴証拠の照合を継続。


## 2026-10-20 追加監査：現行チャットの依存経路

mainの現行ファイルを直接読み取り、次を確認。

| mainのファイル | 確認内容 | 監査上の意味 |
| --- | --- | --- |
| `app/api/chat/route.ts` | `engineEnabled`、`enqueueTemporaryTurn`、`resumeRelationshipProcessing`、`pendingRelationshipGuide`、`createRecallAwareMessage`、`loadCanonicalState`、`completeCanonicalTurn`、`loadRelationshipTimeContext`、`recordRelationshipChatTurn` をimport | 既存の会話・関係性・記憶・canonical保存経路がある。新しい実験エンジンを直接置換しない。 |
| `lib/relationship-engine-v1.ts` | `PROCESSING_VERSION = "relationship-v1.1"`、5軸 `friendship/trust/playfulness/affection/romance`、`engineEnabled()` は環境変数 `MISAKI_RELATIONSHIP_ENGINE_VERSION` と一致する場合にtrue | **mainに5軸の基盤実装が存在**。5軸の実験ブランチがすべて未実装という意味ではない。環境変数の実値・本番有効化は未確認。 |
| `lib/relationship-runtime-v1.ts` | `engineEnabled()` でのゲート、`relationshipEngine` snapshot、requestId重複抑止、pending turn、canonical処理 | 既存の実行・再試行・保存経路がある。Identity v1や段階的acting実験とは別レイヤー。 |
| `lib/chat-recall.ts` | 記憶想起質問の検出と`createRecallAwareMessage` | 既存の記憶想起機能はあるが、**Forget Controlの復活防止と同等とは限らない**。 |

### 誤認を防ぐための判定補正

- 「5軸関係性」はmainに既存基盤あり（**Aの一部**）。PR #85は5軸そのものの初導入ではなく、段階的な表現方法を比較する**Cの実験**。
- 「記憶想起」はmainに存在するが、PR #66の「忘れた情報を旧historyから復活させない」機能と混同しない。
- mainのコード上にfeature gateがあっても、ProductionでONかどうかは環境変数と稼働検証が必要。今回確認していない。
- ここまでの結果はソース読取であり、テストの再実行・Production稼働確認ではない。

次の優先作業: 現行acting guideとPR #85の差分、現行記憶・保存経路とPR #66の差分、Identity v1のゲート・DB証拠の分離を続ける。


## 2026-10-20 深掘り：忘却制御と段階的actingの構造差

### Forget Control：現行canonical保存との相違

- main `lib/canonical-state.ts`（blob `584989230ed0dc89a8aee961aa169e32d4646d3a`）の`RootState`には`history`、`memory`、`relationshipEngine`があるが、**`forgetControls`はこのファイル内で見つからない**。
- mainの`loadCanonicalState`は`misaki_user_conversation_state`から`history,memory,today_memory,updated_at`を読み込む。この読込行にはforget controlsはない。
- 作業ブランチ `work/forget-control-v1` の`supabase/functions/_shared/forget-control.ts`（244行、blob `e7763c96e7f94a896fef3323fddaef53fab8072a`）には`identifyForgetTargets`、`addForgetControls`、`maskForgetRows`、`forgetContext`、`prepareForgetTurn`、`sealForgetControls`、`openForgetControls`などがある。単純な記憶検索ではなく、忘却ポリシー・履歴マスク・暗号化を扱う別設計。
- **暫定結論:** mainのcanonical-stateはForget Control v1と同一構造ではない。ほかのmainファイルでの実装やproduction DBの有無までは未検証。作業ブランチを無条件に統合してはならない。PR #66のDB移行・rollbackリスクがある。

### 段階的acting：既存ガードを保持する統合候補あり

- main `lib/relationship-acting-guide.ts`（131行、blob `9f494a43e8bab0d928e48e9dc16e8fffc6dd6daf`）は`intimacyStage`、5軸、`relationshipStatus`を扱い、関係ステージや恋人状態を使って表現を制限する。
- 実験ブランチ `experiment/interpreter-gradual-acting-20261015` の`lib/relationship-acting-guide-gradual-experiment.ts`（91行、blob `6d325cdd4ab545c4c6c3d9db239c77650ec2c04a`）には**2つの候補**がある：`createGradualActingGuide`と`createIntegratedActingGuideExperiment`。
- 後者は既存`createRelationshipActingGuide`を呼び出し、既存のintimacy/statusガードを維持しつつ、5軸の中間表現を足す実験案。低いplayfulnessや既存romance条件との衝突を避ける分岐もある。
- **前回記録の精密化:** 「実験版にガード未移植」は独立版`createGradualActingGuide`についての懸念。統合候補`createIntegratedActingGuideExperiment`は既存ガードを保持する設計。ただしモデル品質・副作用・実運用の採用は未検証で、mainには接続しない。

### 優先度

1. **Forget Control：高**。忘却ポリシーと旧history復活防止の欠落リスクを慎重に検証。DBとrollbackの整合性が必須。
2. **段階的acting：中**。既存ガード保持版をbaselineと比較。安全・品質・実Gemini検証未実施。
3. **Identity：高**。PR #67のProduction migration適用記録とmainアプリgate OFFを分けて確認。

今回もソース読取のみ。テスト実行・main変更・DB操作・課金API実行なし。


## 2026-10-20 深掘り：canonical stateの行単位差分・Identity resolver

### Forget Control — 実装差分を特定

同一パス`lib/canonical-state.ts`をmainと`work/forget-control-v1`で比較。

| 確認点 | main | Forgetブランチ |
| --- | --- | --- |
| `RootState.forgetControls` | なし | **9行目にあり** |
| `loadCanonicalState`内の忘却control読込 | なし | **91行目に`loadForgetControls(userId)`** |
| 専用DB読込 | 同ファイル内になし | **117–118行目に`misaki_forget_controls`からpayload読込** |
| 通常会話の保存 | `completeCanonicalTurn`あり | **161–164行目でforgetControlsを公開結果から分離し`forgetControlPayload`をcanonical commitに渡す** |
| 匿名/temporary保存 | canonical state処理あり | **198・217行目に忘却payloadを保存状態へ追加** |

**重要:** これで「忘却制御が単にmainに別ファイル名で存在するかも」という疑問を一段狭められた。**少なくとも同一canonical stateファイルの主要保存境界にはForget v1相当の配線がない。** ただしmain全体の網羅調査・DB実体照合はまだ未了。Forgetの取り込みにはmigration、認証、rollback、過去履歴の漏れ防止の整合監査が必要。

### Identity — 純粋resolverの意味

- `work/relationship-identity-v1/lib/relationship-identity-resolver.ts` は93行、blob `63279032c8a9708e3f4899c9661d5676146a5ba0`。
- `deriveRelationshipTraits`と`resolveRelationshipIdentity`を公開し、5軸の数値とrelationshipStatusからidentity候補を計算する。
- **`relationshipStatus === "romantic_partner"`はlover候補を優先**する。
- 複数候補の距離が同点なら、宣言順で恣意的に選ばず曖昧扱いする`uniqueClosest`がある。
- 隣接状態への遷移と制約を別ロジックとして持つ。単純な「点数が高い＝恋人」の変換ではない。
- main `lib/relationship-acting-guide.ts` にはrelationshipStatusの表現ガードがあるが、**Identity resolverとは別の責務**。同名resolverはmainにない。
- PR #67の本番migration適用済み記録は引き続き**未再検証の資料上の主張**。Identity gateの本番実値は未確認。

### 次の実装判断

**優先度はForgetの保存境界整合 → Identityのgateと移行整合 → actingの品質比較。** この監査結果を根拠に、いきなりDB migrationや本番gateを有効化しない。


## 2026-10-20 追記待ち調査：Forget Controlの会話経路

mainの `app/api/chat/route.ts` と `work/forget-control-v1` の同ファイルを比較した。mainは2928行、作業ブランチは2948行。作業ブランチには忘却判定・履歴マスク・再生時のバージョン照合・返答検証・一時状態への制御保存があり、mainのチャット本線には対応する専用処理を確認できなかった。

確認した作業ブランチ側の行：2（関連関数import）、1809/1817/1825（古いforgetControlVersionなら409）、1833-1839（判定と履歴・記憶のマスク）、2271（復活禁止のモデル指示）、2715/2784-2788（出力と返答の検証）、2792-2793/2824（結果と一時状態への保存）。

判定：Forget Control v1はmainの会話本線に未統合の可能性が高い。実Gemini品質・処理時間・migration/rollbackは未検証。部分統合や本番適用は行わない。


## 2026-10-21 棚卸し：mainとの差分ファイルをGitHub比較APIで再確認

今回の比較は `main...作業ブランチ` のGitHub比較結果であり、実際のProduction適用状態とは別。既存台帳を更新してから次へ進む。

| ブランチ | ahead/behind | 重要な差分 | 判定 |
| --- | --- | --- | --- |
| `work/relationship-identity-v1` | 81/24 | `lib/relationship-identity-resolver.ts` がadded（92行相当）。`app/api/chat/route.ts` modified（14変更行）、`lib/relationship-acting-guide.ts` modified（21変更行）。Identity migration 4本がadded。Identity関連テスト6ファイル以上を確認。 | main未統合のアプリ構成要素がある。PR #67のProduction適用記録と矛盾しない。 |
| `work/forget-control-v1` | 5/28 | `app/api/chat/route.ts` modified（44変更行）、`supabase/functions/_shared/forget-control.ts` added（243変更行）、`supabase/migrations/20261006200002_forget_control_v1.sql` added（296変更行）。複数のforget関連テスト・評価レポート・scripted JSONあり。 | mainの会話・保存経路との差分が明確。DB migrationと検証を伴うため単純統合禁止。 |
| `experiment/interpreter-gradual-acting-20261015` | 36/0 | `lib/relationship-acting-guide-gradual-experiment.ts` added（90変更行）。段階的表現、playfulness境界、Body Clockとのparityなどのテストが追加。 | mainの既存5軸エンジンとは別の表現実験。品質確認前に本番採用しない。 |

**検証方法の補足：** `ahead` はmainにないコミット数であり、未統合機能数ではない。`behind` はmain側の進行。`changes` はGitHub比較上の変更行数で、ファイルの現在の総行数ではない。IdentityのPR #67にある「Production適用済み・gate OFF」は資料上の記録で、今回DBの実測はしていない。

**次に行うこと：** Identityブランチの `app/api/chat/route.ts` とmainの同ファイルの具体的な呼び出し差分を追跡し、ゲート・読み込み経路を特定する。先に本節の保存を確認する。


## 2026-10-21 深掘り：Relationship Identityの実際の接続とゲート

mainと `work/relationship-identity-v1` の同一ファイルを直接比較した。

- **mainの `app/api/chat/route.ts`**（blob `5600ad37f2660049a570c4dd340e8ed140d9843b`）には `identity` / `Identity` の文字列を含むコードが見つからなかった。
- **Identityブランチの同ファイル**（blob `f568646c0ced8c676bdd8f129f03de8fa89cb5e2`）2行目で `identityEnabled`、3行目で `deriveRelationshipTraits` をimport。2068–2075行目で `rootState.relationshipIdentity` を優先し、なければ `identityEnabled()` と `rootState.relationshipEngine?.identity` を使って関係性の自己認識・制約を組み立てる。
- **mainの `lib/relationship-engine-v1.ts`**（blob `969f26a2c02e823a298e88f7908b60cfc7871553`）には `identityEnabled` がない。
- **Identityブランチの同ファイル**（blob `591ebb10e928c7c4e3fac84ce3e529bc763b73cc`）28行目で `identityEnabled()` を定義。`engineEnabled()` かつ環境変数 `MISAKI_RELATIONSHIP_IDENTITY_VERSION === "relationship-identity-v1"` のときだけ有効。
- **Identityブランチの `lib/relationship-acting-guide.ts`**（blob `c12ac2d42f3fccfbbba725566322cfb32380da9d`）はIdentityとtraits/constraintを受け取り、関係の自己認識を表現ガイドへ接続。`post_breakup`、`post_rejection`、`boundary` は高い親密度でも恋愛関係を既成事実化させない制約として使う。

**結論：** IdentityはDBだけの機能ではない。会話ルート、エンジンゲート、acting guideの3か所にまたがるアプリ側配線があり、mainには同等の配線が確認できない。PR #67の「Production migration適用済み、gate OFF、Draft・merge禁止」という記録と整合的。Productionの実環境変数やDB状態は今回未確認。**本番ゲートをONにしない。**

**次回：** Identityブランチの `canonical-state.ts` / relationship runtimeの保存・復元経路と、mainの実装差分を調べる。調査結果は先に台帳へ保存する。


## 2026-10-21 深掘り：Identityの保存・復元・リトライ経路

mainと `work/relationship-identity-v1` の同名ファイルを直接比較（ソース読み取りのみ）。

| 対象 | main | Identityブランチ |
| --- | --- | --- |
| `lib/canonical-state.ts` | 207行、Identityへの参照なし | 220行。`RootState.relationshipIdentity`を追加。86–91行目でgate ON時のみ `misaki_relationship_identity_state` を読み込み、112–120行目でrelationship stateのversionと一致した場合のみIdentityを採用。 |
| `lib/relationship-runtime-v1.ts` | 119行、Identityへの参照なし | 232行。temporary snapshotで `resolveRelationshipIdentity` を実行。permanent側では `processPermanentIdentity` を呼び、`misaki_relationship_identity_state` を参照し `apply_misaki_relationship_identity_v1` RPCで反映。 |
| `lib/relationship-processing-v1.ts` | 245行 | Identityブランチでも**同じblob SHA** `bc89fbc00036b66b4f0b3d3500f853bf2bf38ed5`。Identity実装のためにこの既存処理自体を変更していない。 |

追加の重要点：Identityブランチのruntimeでは、関係性ターン処理の後に `processPermanentIdentity` を呼び、関係性ターンがスキップされたケースでもIdentity再処理を試みるコードがある（100–103行目）。また保存時のsource relationship state versionを照合するため、古いIdentityをそのまま会話に使わない意図が読み取れる。

**暫定結論：** Identity v1は単なるUI表示・プロンプト文言ではなく、`canonical-state`の条件付き読み込み、temporary state更新、permanent state処理、専用DB/RPCを横断する機能。mainにはこの3ファイルのうち前2つのIdentity配線がない。3つ目のrelationship-processingは同一内容。**PR #67のProduction適用記録は今回DBで再検証していない。** gate ON・migration実行・main統合はしない。

次の調査はIdentityのテスト・migrationの安全条件を確認し、差分を台帳へ保存してから進める。


## 2026-10-21 深掘り：Identity migration 4本とテストの実体

`work/relationship-identity-v1` のSQLとテストファイルを直接読んだ（本番DBには接続していない）。

1. `20261007114143_relationship_identity_v1_canonical.sql`（126行）：`misaki_relationship_identity_state` と `misaki_relationship_identity_transitions` を作成。RLS有効、anon/authenticatedの直接権限をrevoke、service_roleに権限付与。`apply_misaki_relationship_identity_v1` RPCとsource version検証を含む。
2. `20261007114154_relationship_identity_v1_atomic_temporary_import.sql`（90行）：匿名temporaryからcanonical relationshipとIdentityを原子的に移行する `import_misaki_temporary_relationship_v3`。lease検証、processing version一致、遷移記録の重複抑止がある。
3. `20261007114158_relationship_identity_v1_romance_reentry_provenance.sql`（102行）：別れ・拒否の後に恋愛関係を再構築した根拠を `romance_reentry_version` で保持し、古い状態・不正なversionを拒否する条件を追加。
4. `20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql`（96行）：匿名側の再構築根拠をversion数値ではなくboolean事実として移し、canonical側のversionへ対応付ける。

### テストに書かれた検証内容（実行結果ではない）

- `tests/relationship-identity-resolver.test.ts`（134行）：5軸の組み合わせ、2回のcanonical確認、同じversionの重複を確認回数に数えないこと、明示的な恋人状態、別れた後の元の安全な関係への復帰、古い恋愛値による復活阻止をテスト。
- `tests/relationship-identity-sql.test.ts`（186行）：独立PostgreSQL上でmigration 4段階の適用、RPCの引数数、service-only権限、古いsource versionの拒否、リプレイと遷移履歴の不変性をテストする設計。

**重要な区別：** テストコードに検証が書かれていることと、今回テストを再実行して成功したことは別。PR #67に過去の検証・Production適用済みとの記録はあるが、今回の確認はソース読取のみ。**本番適用やgate ONは行わない。**

**次の課題：** テスト実行記録の日時・結果をPR/CIから検証し、migration 4本とmainの現行schemaとの差分を履歴として整理。現在の本番DBの実測は未実施。


## 2026-10-21 Identity v1：過去CI成功の独立確認と残存ゲート

PR #67本文とGitHub Actionsのコミット紐付けを照合した。

- PR #67には、`npm ci`、UTCとAsia/Tokyoで各320件のfull suite、Identity関連57件、TypeScript型検査、Next build成功と記載。
- **GitHub Actions側でも独立確認**：commit `3c8a2e746e833859f32b05f6eb0993bdaa549970` に紐づく run ID `37616664677`、workflow `Canonical relationship integration tests`、run #430 は **status=completed / conclusion=success**。リンク： https://github.com/miyazaki1016/misaki/actions/runs/37616664677 。ただし今回ジョブログの個別ステップは未閲覧であり、320件などの細目はPR本文に基づく。
- PR本文には、別のコードcommit `555d35bc19e7003dd9b051d02762b4bdfac1b192` のCI #427 success、Vercel Preview READY、改名後ローカルテスト成功の記録もある。これらは今回の独立照合対象外。
- PR記録によれば、空PGlite上で4 migrationを順に適用しRPCを検証、ACL/stale/replay/ledger rollback/anonymous checkpoint等を確認した。**ただしPGliteはsingle-sessionで複数セッションのロック競合未検証**。完全なSupabase初期migration履歴がないため、全アプリの空Supabase reset成功は主張できない。
- **停止条件**：隔離Supabase Previewでの実機受入と既存rollback SQL suiteの確認が残る。PR #67はDraft維持・merge禁止・gate ON禁止と明記。Production migration適用済みはPR本文の過去記録であり、今回本番DB実測なし。

**監査判定更新：** Identity v1は「未テスト」ではない。**過去のCI成功がGitHub Actions上で確認できた、ただし受入・競合・rollbackに未完了がある実装**。本番で機能を有効化してよいという結論ではない。

次はCI #430のジョブ単位の結果と、既存rollback SQL suiteの記録を照合する。先にこの節の保存成功を確認する。


## 2026-10-21 Identity CI #430ジョブ詳細とrollback受入の停止位置

GitHub Actions run `37616664677` のjob一覧を直接取得。job ID `112776539139`、name `test`、status `completed`、conclusion `success`。以下の個別ステップも全て `success`：`npm ci`（step 4）、`npm test`（5）、`npx tsc --noEmit`（6）、`npm run build`（7）。**これはジョブ・ステップの成功を独立確認した結果**。テスト件数（UTC/JST各320、Identity57）はPR #67本文に記載された値で、ログの件数は今回未検証。

Identityブランチの `docs/IMPLEMENTATION_OVERVIEW.md` 3564–3578行および3623–3633行に、未実施の受入事項が明記されていた：

- PGliteはsingle-sessionであり、実Postgresの複数セッションlock待機・競合は未検証。State update対Identity apply、同一source二重apply、import競合/retryを隔離DBで試す必要。
- Preview READYは隔離Supabaseでの実機受入を意味しない。anonymous → email → 別端末restore/retry、別れ/拒否/境界、恋愛関係再構築の一連の受入が残る。
- 既存 `tests/*.rollback.sql` は、**完全なlegacy Supabase migration baselineを備えた隔離環境**で実行する必要。現リポジトリのmigration履歴は完全ではなく、推測で欠落を補完しない。
- 同文書3572行は「ProductionへのIdentity migration 4本の再適用は不要・禁止」と明記。これは当該ブランチの過去の運用記録であり、今回Production実測はしていない。
- PR #67はDraft / 未merge、gate OFFを維持し、ownerレビューと隔離環境受入まではmerge・gate ONをしない。

**判定：** Identity v1のCI・ビルドは過去成功を確認済み。一方、rollback SQLと複数DBセッション競合、隔離Preview実機受入は「未実施」と明示されている。今回もmain・Production・DB・gateは変更していない。


## 2026-10-21 横断棚卸し：A/B検証の補助ブランチ10本

GitHub比較APIで、次の10本を `main` と個別比較した。**10本すべてahead=1、変更ファイルは `.github/workflows/isolated-gemini-ab-manual.yml` の1ファイルのみ。** アプリ本体・DB migrationの差分はこの10本の比較結果には含まれない。

| ブランチ | ahead / behind | 変更対象 |
| --- | --- | --- |
| `work/ab-20-pair-dispatch` | 1 / 23 | A/B手動ワークフロー |
| `work/ab-blind-review-artifact-workflow` | 1 / 16 | 同上 |
| `work/ab-http-diagnostics-dispatch` | 1 / 21 | 同上 |
| `work/ab-long-fixture-dispatch` | 1 / 22 | 同上 |
| `work/ab-manual-workflow-only` | 1 / 24 | 同上 |
| `work/ab-paced-dispatch` | 1 / 20 | 同上 |
| `work/ab-quality-diagnostics-workflow` | 1 / 18 | 同上 |
| `work/ab-quality-manual-workflow` | 1 / 19 | 同上 |
| `work/ab-quality-reply-schema-dispatch` | 1 / 17 | 同上 |
| `work/quality-long-history-workflow` | 1 / 15 | 同上 |

**分類：** 10本はA/B実験のCI・手動dispatch支援に関わる補助ブランチ（暫定D：検証インフラ）。**未統合の会話エンジン実装10件と数えない**。ただし実際のworkflow YAMLの中身、実行実績、後継workflowに機能が引き継がれたかは未確認。ahead=1なので、削除してよいとは判断しない。

**次の調査：** このworkflowのmain版と代表的な補助ブランチ版を読み、A/B検証で現在使える機能・古い検証経路・有料Gemini呼出しの条件を整理する。調査結果を先に台帳へ保存する。


## 2026-10-21 A/Bワークフロー実体：mainに引き継がれた機能

`.github/workflows/isolated-gemini-ab-manual.yml` をmainと代表4ブランチで直接比較した。

- **main**：104行、blob `edffcd3d81dffc084fb655a5014af901f33383a2`。`workflow_dispatch` による手動実行、`confirm_billable_requests == 'YES'` の明示的な有料Gemini呼出し許可、`MISAKI_AB_GEMINI_API_KEY` secret、事前の `npm ci` / `tests/context-ab-*.test.ts`、latency/tokenとqualityの実験分岐を確認。quality側は `scripts/context-ab-quality-live.ts`、それ以外は `scripts/context-ab-live.ts`。quality成功時は匿名化レビュー用の `synthetic-blind-review` と照合キー `synthetic-review-key` を別々のartifactとして出力。`fixture` と `quality_history` の入力あり。
- **`work/ab-20-pair-dispatch`**：48行、blob `22f0d48c919c6bc24042917ef07ba457fe1da63a`。mainより古い小規模な手動実行形態。明示許可、secret、テスト、`context-ab-live.ts` がある。
- **`work/ab-blind-review-artifact-workflow`**：95行、blob `bd20ddcd41e5c6efc7c8aae1a33fa4423ac6453d`。qualityモードとblind-review/keyの分離artifactを備えるが、mainはさらに `quality_history` 入力などを持つ。
- **`work/ab-manual-workflow-only`**：40行、blob `4a637d5bb985d173e56c211230710e1a66302e5e`。2回の有料呼出しを明示確認する初期形態。
- **`work/quality-long-history-workflow`**：mainと**blob SHAが完全一致**。このブランチにある当該workflowの内容はmainへ反映済み（GitHub比較でahead=1でも、内容が同一であり得る）。

**分類更新：** 10本のA/B補助ブランチを一律「未統合」と数えるのは誤り。少なくとも `quality-long-history-workflow` のworkflow本文はmainと同一。mainは品質レビューartifactと長文履歴入力を含む統合版を保持。残りの補助ブランチは各々の機能・実行履歴までの完全同等性は未確認。**枝の削除判断は保留。**

**費用・安全：** ワークフローに有料Gemini呼出しが存在するが、今回はコードを読んだだけでdispatchもAPI呼出しもしていない。明示許可条件を回避しない。mainのworkflowが存在することは、品質A/Bの盲検レビューが完了した証拠ではない。

次は残る補助ブランチのworkflow blobとmainの一致状況を確認し、検証済み/未実施を台帳へ保存する。


## 2026-10-21 A/B補助ブランチ残り6本のworkflow本文照合

残る6ブランチの `.github/workflows/isolated-gemini-ab-manual.yml` を直接取得してmainのblob `edffcd3d81dffc084fb655a5014af901f33383a2`（104行）と比較した。全6本とも**mainとblob SHAは異なる**が、段階的に拡張された旧版と見られる。

| ブランチ | workflow blob（先頭7桁） | 行数 | 確認できた特徴 |
| --- | --- | ---: | --- |
| `work/ab-http-diagnostics-dispatch` | `b3ba117` | 57 | 手動dispatch、fixture、runs、Gemini live |
| `work/ab-long-fixture-dispatch` | `5937ffb` | 57 | 手動dispatch、fixture、runs、Gemini live |
| `work/ab-paced-dispatch` | `889638d` | 66 | 上記にdelay_ms入力を追加 |
| `work/ab-quality-diagnostics-workflow` | `ab45477` | 78 | quality-live と latency-live を分岐 |
| `work/ab-quality-manual-workflow` | `ab6c57c` | 78 | quality-live と latency-live を分岐 |
| `work/ab-quality-reply-schema-dispatch` | `e3535d7` | 78 | quality-live と latency-live を分岐 |

全6本に `confirm_billable_requests == 'YES'` と `MISAKI_AB_GEMINI_API_KEY` secretを確認。mainの統合版にも手動dispatch、fixture、quality/live分岐、明示的な有料実行確認がある。mainにはさらに `quality_history`、blind-reviewとblind-keyのartifact出力がある。**したがって上記の主要なworkflow操作はmainにも残っているが、旧版固有の診断ログやエラー処理が一字一句同等かは未検証。**

10本全体の暫定判定：`work/quality-long-history-workflow` はmainとworkflow blob完全一致、残り9本は内容が異なる旧版。全10本とも比較上はworkflow以外の変更なし。**未統合アプリ機能10件として扱わず、CI支援ブランチとして追跡継続。削除・main変更・有料API呼出しなし。**

次の優先調査：`work/context-no-duplicate-replies-ab` 本体の実装・検証状況とmainの差分。補助workflowと実験本体を混同しない。


## 2026-10-21 Context A/B本体：実装・実測・未完了の分離（PR #78）

`main...work/context-no-duplicate-replies-ab` のGitHub比較は **ahead 211 / behind 24 / 79 changed files**。A/B実装のほか、Relationship Identityのresolver・4 migration・testsも同じ差分に含まれるため、**79件すべてをA/B固有の成果と数えない**。A/B専用には `lib/context-ab-{balanced,prompt,quality,...}.ts`、独立replay/privacy/measurement群、実験API・review UI・workflow・scripts・testsがある。`lib/context-ab-balanced.ts` は外部から渡したread-only model adapterで `ABBA` の4試行を行い、成功数、JSON妥当性、latency、token統計を返すpure isolated harness。`lib/context-ab-prompt.ts` はA=直近の美咲発話をsystem instructionに重複掲載、B=会話履歴参照と重複回避の短い指示、という明確な差分を作る。

### 既存の実測（branch documents、今回再実行なし）

- `docs/context-ab-execution-gate.md`：2026-10-13の**合成日本語1ペア（Gemini 2リクエスト）**でA/BともHTTP 200・JSON妥当、入力token A=322/B=233（Bは89 token、約27.6%減）。latency A=639ms/B=837ms。1件なので速度・品質の優劣は判断不能。本文は保存されず、後からblind review不可。
- `docs/context-ab-real-history-quality-review.md`：本人同意の60ターン履歴を用いた簡略Preview実験でA/B各3回、入力token A=1922/B=1616（306 token、15.9%減）。latency A=[729,805,918]ms/B=[2051,717,1051]ms。常にA→Bの順で、生成本文は保存せず品質評価不可。**Productionと異なるpromptであり、Productionの削減率へ外挿禁止**。
- `docs/context-ab-execution-gate.md` によれば、offline synthetic quality scenarioは4→7へ拡張、blind score集計testを追加し、commit `19cc84667a1a205a6b4b7193f74637197ba938df` のCI成功が記録されている。ただし今回はCIを独立再確認していない。

### 判定・残作業

- **実装済み**：A/B prompt差分、ABBA測定ハーネス、synthetic live runner、品質採点/盲検レビューの補助実装とドキュメント。
- **数値実測済み（過去記録）**：限定された合成1ペアおよび簡略Previewのtoken削減。
- **未完了**：Production相当promptでの検証、複数場面でのブラインド人手品質評価、実会話品質の同等性証明、mainへのA/B本体の統合。PR #78はDraftの実験であり、token節約だけでは採用不可。
- **注意**：mainにあるA/B workflowの存在と、`lib/context-ab-balanced.ts` のmain統合は別の話。mainの同名実装の有無は次に個別path確認する。追加の有料Gemini呼出し・実会話送信・Production変更は行わない。


## 2026-10-21 Context A/B：mainの具体的な未反映ファイル確認

`main` に対してGitHub `fetch_file` で**正確なパスを指定して実在を検証**した。以下の8パスはmainで404（NOT_FOUND）であり、`work/context-no-duplicate-replies-ab` との差分一覧では追加ファイルとして記録されている。

| mainに存在しないパス | 役割 |
| --- | --- |
| `lib/context-ab-balanced.ts` | ABBA比較・数値集計 |
| `lib/context-ab-prompt.ts` | A/B prompt差分生成 |
| `lib/context-ab-quality.ts` | 品質評価補助 |
| `lib/context-size-measurement.ts` | 文脈サイズ測定 |
| `scripts/context-ab-live.ts` | live合成A/B runner |
| `scripts/context-ab-quality-live.ts` | live品質A/B runner |
| `app/api/experiments/blind-quality/route.ts` | 隔離実験API |
| `.github/workflows/context-ab-validation.yml` | A/B検証用workflow |

一方、**`.github/workflows/isolated-gemini-ab-manual.yml` はmainに存在**し、blob `edffcd3d81dffc084fb655a5014af901f33383a2`。ただしmainにある手動workflowが呼ぶ `scripts/context-ab-live.ts` と `scripts/context-ab-quality-live.ts` は**mainで両方404**。よって**mainのworkflowが存在するだけでは、そのまま正常実行できると判断できない**。手動実行の実効性は別途検証が必要（dispatchは行わない）。

**判定：** A/B本体の主要な実装は、少なくとも上記のパスではmain未反映。補助workflowの統合と実験本体の統合は別。移植は品質・プライバシー・課金ゲートを通した後に判断。現時点でmainへ実装コピーしない。

次はmainに存在するworkflowの参照スクリプトと、旧ブランチのworkflowにおけるcheckout refを照合して、実行経路の成立条件を確認する。


## 2026-10-21 A/B workflowのcheckout先に関する訂正

前節の「mainに実験スクリプトがないため実行経路が欠けている可能性」は、checkout先を確認した結果、修正が必要。mainの `.github/workflows/isolated-gemini-ab-manual.yml` は `actions/checkout@v4` で固定commit `9a40d98c4ecec2f17eef1489a687acc1e24f338e` を指定している。このcommitには `scripts/context-ab-live.ts`、`scripts/context-ab-quality-live.ts`、`tests/context-ab-prompt.test.ts` が実在することをGitHubから直接確認した。したがってmainに同名スクリプトが存在しないことだけで、workflowが壊れているとは判断できない。実験コードを固定commitから取得する隔離構成である。main未統合のA/B本体という判定は維持。workflow実行成功・secret設定状況は未確認。有料実行なし。


## 2026-10-21 A/B関連CI実行履歴の独立照合

`work/context-no-duplicate-replies-ab` のPR #78は「Test isolated conversation replay adapter」、本文は `Draft for automated tests only. No production merge.`。このPRの記述は本番採用承認を意味しない。

過去の検証ドキュメントが挙げるcommit `19cc84667a1a205a6b4b7193f74637197ba938df` をGitHub Actions APIで直接照合したところ、workflow run **38319587040**、`Isolated Replay Tests` #49 は `completed/success`。job **115044210136** (`replay-tests`) も `completed/success`。step単位で `npm ci` と `Run offline replay tests only` の成功を確認した。

**確認できた事実：** このcommitのoffline replay CIは実際に成功していた。**確認できないこと：** このrunだけから、全体の `npm test`、TypeScript型チェック、Next build、Gemini有料live試験、盲検の人手品質評価が完了したとは言えない。過去の実験記録の数値は別証拠であり、このrunの成功と混同しない。

mainの手動A/B workflowは固定commit checkoutを使うため、mainに実験スクリプトがないことだけで破損とは言えない。現時点でworkflowのdispatch、Gemini API呼出し、mainへのmergeは実施していない。

次の照合対象：固定checkout commit `9a40d98c4ecec2f17eef1489a687acc1e24f338e` の実行記録と、実験ブランチのその他CI結果を分けて検証する。


## 2026-10-21 固定A/B実験commitの履歴照合

mainの手動workflowがcheckoutする固定commit `9a40d98c4ecec2f17eef1489a687acc1e24f338e` に対して、GitHubの `fetch_commit_workflow_runs` を実行した結果は **`workflow_runs: []`**。**重要：このAPIはpull_request関連のrunに絞る実装なので、結果ゼロを「手動workflowの実行履歴が一切ない」証拠とは扱わない。** 手動dispatchの実行履歴はこの取得方法では網羅できない。

固定commitを直接読んで確認したこと：
- `scripts/context-ab-live.ts`（blob `83e826d`）は存在。`MISAKI_AB_LIVE=YES`、`GEMINI_API_KEY`、`MISAKI_AB_MODEL` が必須。実行回数は1〜20に制限し、fixtureはshort/longのみ。
- `scripts/context-ab-quality-live.ts`（blob `198e58d`）も存在。同じくlive明示許可・key・modelを要求。`MISAKI_AB_EXPORT_REVIEW=YES` の場合、synthetic回答のblind-review JSONと対応キーJSONをローカル出力する処理がある。
- `tests/context-ab-prompt.test.ts`（blob `618d5db`）も存在。
- 固定commitには `.github/workflows/isolated-gemini-ab-manual.yml` は存在しない（main側にあるworkflowがcheckout後に実験コードを実行する構成と整合）。

**結論：** 固定commitにはmainのworkflowが呼ぶ実験コードと事前テストの少なくとも一部が存在し、live実行には二重の明示的な環境変数・secret条件がある。現時点で固定commitの手動実行成功・失敗の有無は未判定。既存のoffline replay CI成功（run 38319587040）は別commitの別workflowであり混同しない。有料APIは呼び出していない。


## 2026-10-21 Forget Control v1：差分とbatch検証の精査

`main...work/forget-control-v1` はahead 5 / behind 28、差分34ファイル。チャットAPI、persona、Body Clock、canonical-stateに加え、mainにない `supabase/functions/_shared/forget-control.ts` と `supabase/migrations/20261006200002_forget_control_v1.sql` を含む。単一UI機能ではなく、**会話・自発処理・人格・DBの横断変更**であり、部分移植は危険。

branch実装を直接取得して確認：共有policy `forget-control.ts` はSoft Forget/Hard Delete、active/released、対象の曖昧さ拒否、履歴・memory・返信のmask、reoffer確認を扱う。migrationは暗号化payloadを保存する `misaki_forget_controls`、RLS、権限制限、persist関数、chat turn原子的完了処理への接続を含む。migration冒頭に `Branch-only` / `No Production execution` と明記。

`tests/reports/forget-batch-evaluation.md`（2026-10-07 JST）を確認。20シナリオの**scripted port比較**で現行armは多くが7〜9回、batch armは2〜3回のsemantic呼出し。人工false negativeを両armに注入した場合、両方が同じ誤りを犯すことも明示。**これは実Geminiの性能・安全性証明ではない。** token・Gemini latencyはすべて未測定、API key未設定でliveは未実施。記録上は検証専用23/23、UTC/JST各284/284回帰成功、TypeScript検査成功。**今回のGitHub CI独立検証はまだしていない。**

**判定：** 実装・scripted検証は具体的に存在するが、live意味判定同等性、実測token/latency、誤判定の人手レビュー、migration/rollbackと本番整合の確認が未完了。main/Productionへ移行しない。PR #66はDraftと記載。次はPRとCI実行記録を独立照合し、残件を整理する。


## 2026-10-21 Forget Control PR #66：GitHub CI独立確認

GitHub PR APIで #66 `Forget Control v1: canonical忘却と確認付き再学習` を確認。**open / draft=true / merged=false**、head `work/forget-control-v1`、head SHA `84d147ba5b46698d3b46fb727a9859f87f79f3d2`、変更34ファイル。PR記載のProduction未適用・隔離Supabaseなし・Preview実機受入未完了は**PR作成者の記録**であり、今回Productionを直接確認した事実ではない。

head commitに紐づくGitHub Actions run **37533221342**（`Canonical relationship integration tests` #358）は **completed/success**。job **112507554141**（`test`）のstepで **`npm ci`、`npm test`、`npx tsc --noEmit`、`npm run build` がすべてsuccess** とGitHub APIで独立確認した。

PR本文の過去検証記録：PGliteのmigration/RPC原子性・rollback・checkpoint/refund、UTC/JST各251→261→284のテスト成功、23件のbatch検証、Preview READYなど。ただし**CI step成功は個別テスト件数・実Gemini精度・本番DB適用状況を証明しない**。Deno独立型検査・隔離Preview実機・匿名/別端末・Body Clock・実モデルlatency/cost・rollback受入はPR上の未完了項目。実Gemini batch比較は未実施。

**結論：** Forget ControlのPR headは、npm test・TypeScript・Next buildのCI成功を実際に確認できた。機能全体は依然Draft・未merge。安全な本番導入判断には独立DB/Preview、実モデルの意味判定、移行・復旧手順の確認が必要。main/Productionへの変更は行わない。


## 2026-10-21 Context compression spike：埋もれた計測成果の確認

`main...work/conversation-context-compression-spike` は ahead 85 / behind 24、差分27ファイル。ただしIdentity resolverと4本のIdentity migrationも含むため、**27件すべてを圧縮機能の成果として数えない**。

このブランチにmainにはない `lib/context-size-measurement.ts`（blob `36a944a`）、`lib/context-overlap-analysis.ts`（blob `8d10394`）、`tests/context-size-measurement.test.ts`、`tests/context-overlap-analysis.test.ts`、`docs/conversation-context-compression-spike.md`（blob `b5a6296`）が存在。前者はsystem/history/user/persona/relationship/memory/repeated replies/environmentの**UTF-16文字数**を集計し、`contextSizeMeasurementEnabled` は文字列 `1` でのみ有効。**トークン計測ではない**。後者はpromptの重複文字数とhistory中のrecent reply重複数を数える純粋な診断helper。いずれも会話内容をログに出さず、promptを変更しない設計。

設計文書は「research only; no runtime behavior changes」。現行60件historyとrecent Misaki repliesの重複、20件history・要約・重複除去などの候補、盲検の会話品質比較、usageMetadataとの照合を提案。2026-10-08の単発例（初回30,002ms timeout、再試行16,881ms、input 8,378 tokens）は**ベンチマークではない**。圧縮・要約を実運用した証拠ではない。

同名head PRの検索結果は0件（この検索で見つからなかっただけでPRの不存在を完全保証しない）。**現時点の判定：計測helper・重複分析・ユニットテスト・研究設計はブランチに存在。main未反映。実運用の圧縮・品質非劣化・複数回latency/token実測は未確認。** 他機能（Identity）の差分と混同せず、削除・main merge・Production変更を行わない。次は該当ブランチのCI/テスト実績とmain routeの計測接続状況を検証する。


## 2026-10-21 Context compression：実chat route接続の追加発見とCI照合

**前節の「計測helperのみ」という印象を訂正：branchでは実chat routeへの接続まで実装済み。** branch head `10275b666387115ced06312570111b21d0276e17` のコミット差分をGitHubで確認。`app/api/chat/route.ts` に `analyzePromptSectionOverlap` と `countRepeatedRepliesInHistory` を追加し、既存の `measureContextSize` と合わせて `console.log('MISAKI CONTEXT SIZE:', ...)` に**数値診断**を出す。traceIdと文字数・重複件数のみで本文をログに出さない設計。

実chat routeをmain/branch双方から直接取得して比較：main blob `5600ad37f2660049a570c4dd340e8ed140d9843b` には `contextSizeMeasurementEnabled`、`measureContextSize`、`analyzePromptSectionOverlap`、`MISAKI CONTEXT SIZE` のいずれも0件。branch blob `f7037edeb071468b1f5b5c017fea1e4b8412f1c8` には4項目すべて存在。branchでの計測条件は `MISAKI_CONTEXT_SIZE_METRICS=1` **または** `VERCEL_ENV=preview` かつ `VERCEL_GIT_COMMIT_REF=work/conversation-context-compression-spike`。つまり指定Previewでは環境フラグなしでも診断有効となる条件がある。Productionへの適用は確認されず、mainは未接続。

branch head SHAに対する `fetch_commit_workflow_runs` は空配列。ただしこのAPIはPR runに限定されるため、**CI不成功・未実行の証拠ではない**。branch head commitは2026-10-08 `feat: connect numeric prompt overlap diagnostics in isolated Preview`。PR head検索も結果なし。**今回独立にCI成功を証明できたわけではない。**

**判定：** 計測・重複診断はbranchの実chat routeまで接続済みで、単なるhelperより進んだ実装。mainには未反映。実際のPreviewログ出力、実測token/latency、複数ケースの品質検証、CI結果は未確認。圧縮・要約によるruntime最適化は未実装の研究候補として区別。削除・merge・Production変更なし。


## 2026-10-21 Context compression：Vercel Preview実在とActions履歴

Vercel接続からbranch `work/conversation-context-compression-spike` のdeploymentsを直接検索し、**8件**を確認。**READY 7件、CANCELED 1件**。最新head `10275b666387115ced06312570111b21d0276e17` のdeployment **`dpl_3atm4VMq7J6cgFbSiQmbW1dCRSYe`** は `READY`、URL `https://misaki-khw4f34x4-kishibojim.vercel.app`、Vercel inspector `https://vercel.com/kishibojim/misaki/3atm4VMq7J6cgFbSiQmbW1dCRSYe`。直前の重複診断テストcommit `0e2b616bc12aaec9a22cd651b938e627d49c8a0e` もdeployment `dpl_CPj3uB3gwTpQo1vNEXTRo56hxgPC` がREADY。

**重要な区別：** Vercel `READY` はビルド・デプロイの準備完了を示すが、計測ログの実発生、実会話リクエスト、テストスイート成功、隔離DBでの受入完了は意味しない。Previewにアクセスしたり実会話を送ったりはしていない。

GitHub Actions REST `GET /repos/miyazaki1016/misaki/actions/runs?head_sha=10275b666387115ced06312570111b21d0276e17&per_page=20` は `total_count:0`。このAPIは前のPR限定検索より広いが、**head SHAに一致するrunがAPI結果にない**という範囲の確認であり、過去の他commitでのCI成功・ローカルテスト結果の不存在は証明しない。branchのユニットテストファイルは存在するが、最新headのGitHub Actions CI成功は未確認。

**更新判定：** branch headのPreview READYは独立確認済み。main未反映、実ログ・計測効果・品質評価・GitHub CI成功は未確認。削除・main merge・Production変更なし。


## 2026-10-21 Shared conversation engine PR #88：CI・Preview実証

`experiment/shared-conversation-history-v1-20261015` のPR #88をGitHub APIで確認：**open / draft / unmerged**、head `2ae90d70ff143c8de935f25ec12f291e9b82613a`。`main...head` は **35 ahead / 0 behind、29ファイル全てadded**。`lib/conversation-engine/` にhistory、attempt、base/character/layered prompt、memory、relationship、retry、context、Amahuru rain context等の**13個のモジュール**、`tests/conversation-engine-*.test.ts` に対応テスト群、設計/監査文書が存在。main側に同じ追加差分はない。PR本文は最初のpure history adapterの説明で、**最新headの全モジュールを網羅した説明ではない**。現状も実chat routeの切替・production parityの証明はない。

GitHub Actions run **38966516004** (`Canonical relationship integration tests` #545、event pull_request) は **completed/success**。job **117194210775** の `npm ci` / `npm test` / `npx tsc --noEmit` / `npm run build` は**全てsuccess**とGitHub APIで独立確認。CI成功は実Gemini/本番の動作同等性までは証明しない。

Vercel接続でbranch head `2ae90d70ff143c8de935f25ec12f291e9b82613a` のdeployment **`dpl_6mfszaNd85cgbx4HKsWF7FacbBxD`** が **READY** と確認（`https://misaki-99419osjm-kishibojim.vercel.app`）。READYはPreviewビルド完了であり、機能がPreviewで接続・受入済みという意味ではない。

**判定：** 共通会話エンジンの多数の純粋モジュールとテストがmain外に実装済み、CIのテスト・型チェック・build成功、head Preview READYまで独立確認。**しかしmain/実chat route未統合、実モデルの会話品質・機能同等性・運用受入は未完了**。実験ブランチの成果を失わないよう保持。Amahuruへの統合は別プロジェクトにつき実施しない。main/Production/Supabase変更なし。


## 2026-10-21 Gradual Interpreter PR #85：停止理由・再開条件・CI確認

PR #85 (`experiment/interpreter-gradual-acting-20261015`) は **open / draft / unmerged**、head `ef5bd23246a75b02a0df60302263f971de061843`。main比 **ahead 36 / behind 0、28ファイル**。`lib/relationship-acting-guide-gradual-experiment.ts` と段階的playfulness/acting、Body Clock境界、DTO、prompt precedence等のテストと多数の監査・契約文書がmain外に存在。PR本文は「純粋関数とテストのみ、既存Interpreter/本番chat/DB/環境変数には未接続、閾値20/50/80は未承認の比較仮説、実Gemini A/B未実施」と明記。

GitHub Actions **run 39186862912**（`Canonical relationship integration tests` #554）は **completed/success**。job **117851011382** で `npm ci` / `npm test` / `npx tsc --noEmit` / `npm run build` が全てsuccess。Vercel接続でも同headのdeployment **`dpl_2DThKw2YVkNj6474D4xpbVdGratZ`** が **READY** と独立確認。ただしPreview READYは隔離実験の純粋コードのビルド完了であり、実チャットへの接続や実Gemini検証を意味しない。

**開発目的：** 5軸関係性に応じた美咲の表現を段階的に調整するacting/Interpreter仮説の検証。**停止理由：** PR記録上、未承認閾値の採否判断と実Gemini A/B・レビュー待ち。作業が中断した真の経緯は未確認であり推測しない。**再開条件：** 仕様・閾値の合意、現行actingとの比較と実モデルの品質/安全性検証、Body Clock/DTO境界のレビュー、必要なら独立Previewで受入。**判定：** 実験コード/テスト実装済み・CI成功・Preview READYだが、main未反映かつruntime未接続。無条件merge不可。main/Production/DB変更なし。


## 2026-10-21 Conversation Lab PR #86：中断理由と再開ゲートの再確認

PR #86 (`experiment/conversation-lab-offline-v1-20261015`) は **open / draft / unmerged**、head `f92250fc1ac79efa44c72468e00449d3fdc7ce6e`。main差分 **112 ahead / 0 behind、32ファイル**。初期PR本文の「tests not yet verified」は**作成当時の記述**で、後続のCI成功記録と混同しない。後続で `app/conversation-review/page.tsx`（iPhone手動評価画面）、`app/api/conversation-review/smoke/route.ts`、`lib/conversation-lab/live-smoke-probe.ts`、`scripts/run-conversation-smoke.ts`、複数のreview/quality/runner helperとテストが追加されている。既存台帳にhead `f92250fc` のCI成功・Preview READYを記録済み。

ブランチ文書 `docs/CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md` と `docs/CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md` を直接確認。**実Gemini呼出し0回・実モデル品質評価未実施**と記録。旧 `/api/acting-lab` はPreviewで認証/予算上限が不足し、かつ本番の記憶/関係/Body Clock/60件historyと非同等のため、代用禁止。隔離Q02 2往復アダプターはキー＋明示承認、最大2物理呼出し、retryなし、15秒timeout、出力300 tokens上限。CLI入口は `--approved-small-test` と `MISAKI_LIVE_SMOKE_APPROVED=yes` の双方必須。**安全な実行環境・正規の開発キー・費用管理の確認なしに起動しない。** iPhone画面は人手レビュー用で、画面があることは実モデル呼出し成功の証拠ではない。

**開発目的：** 美咲の会話品質を複数ターンで比較・評価する再現可能な基盤。**停止/保留理由（文書上）：** 本番相当のprompt/contextでない、実モデルの認可・費用・実行環境・品質受入ゲートが未解決。中断した真の人的経緯は不明。**再開条件：** (1) offline tests/CI再確認、(2) 既存smoke endpointの認可・停止ゲートをソース検証、(3) ownerが費用・回数・隔離環境を承認してから実Gemini最小試験、(4) raw結果を人手評価、(5) production parityは別設計・別PRで検証。**判定：** 評価基盤/画面/安全設計の多くは実装済みで保護対象、実Geminiの会話品質は未実証。main/Production/Supabase変更なし、課金実行なし。


## 2026-10-21 Relationship Time v2 PR #31：大規模未統合成果と導入停止理由

PR #31 `sora/relationship-time-v2-design` は **open / draft / unmerged**、head `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64`。main比 **276 ahead / 323 behind、60ファイル**。古い大規模branchであり、mainにも同名 `lib/relationship-time.ts` が存在するため「全未実装」とは判定しない。差分には新規 `lib/relationship-emotion-reducer.ts`、`lib/relationship-action-reducer.ts`、`lib/relationship-signal.ts`、`lib/relationship-emotion-store.ts`、`lib/relationship-conversation-*`、Body Clock `proactive-urge.ts` / `proactive-motive.ts`、**9本のv2 SQL migrations**、関連テストが存在。mainの現行5軸runtimeとの意味・schema・writer差分の個別照合が必須。

PR記録上の開発目的は「会話→関係時間→感情→行動→言葉/自発行動」を一貫させ、傷・修復・再発を `relationshipStory` として保持し、通常チャット/Body Clock/写真の行動整合性を確保すること。PR本文では270 tests passと主張。独立にGitHub Actions **run 36121699019** (`PR relationship v2 tests` #432) **completed/success**、job `test` の **npm ci / npm test / npm run build 成功**を確認。**このjobには独立した `npx tsc --noEmit` stepは存在しない**。個別270件という数はPR本文の記録であり、今回job stepから直接件数を確認したわけではない。

Vercel branch検索では複数の古いcommitのREADY deploymentsを確認したが、今回取得した先頭4件はhead SHAと一致せず、**head Preview READYとは判定しない**。

**停止/保留理由（記録上）：** v2 migrationが既存phase1〜phase5/Body Clock基盤の後に順序適用され、旧keyword emotion trigger・旧action trigger・silence-only claimを段階的に置換するため、**途中状態でProduction運用不可**。PR #29サーバー正本化・PR #30本番切替安全工事と協調必要。mainが323 commits先行しており、現在のcanonical state / 5軸 / DB RPC / Body Clockとの再整合も必要。開発中断の人的な理由は不明。

**再開条件：** mainに実装済みの同等機能を照合して残存差分を機能単位で抽出、migrations依存・RPC writer・Body Clockとの互換性とrollbackを隔離DBで検証、実モデル/Previewの受入、PR #29/#30との依存解消。**判定：** 実装・テスト・CI成功のある重要成果だが、大きく乖離した旧branchの無条件mergeは危険。branch保護、main/Production/Supabase不変更。


## 2026-10-21 Canonical切替の依存関係 PR #29/#30：重要な状態差異

GitHub PR API直接確認：**PR #29 `codex/server-canonical-foundation` は `closed / merged=true`**（head `685fbb7baee4a542555f939fabaecd674658c148`）。PR本文に残る「merge未実施」は作成・更新当時の記述で、**現在のPR metadataと矛盾するため現在のmerge状況の根拠に使わない**。ただしmerge済みは本番DB migration/切替実施を意味せず、Production稼働状態は未確認。

**PR #30 `codex/legacy-maintenance-drain` は open / Draft / unmerged**、head `17449c7ec4e8ff50605ef931b04ae76584c6304f`。main比 **7 ahead / 323 behind、25ファイル**。目的はcanonical migrationに先立つ旧main互換maintenance/drain。PR本文とbranch `docs/LEGACY_MAINTENANCE_DRAIN.md`、`docs/WRITE_SURFACE_INVENTORY.md` に、**凍結後でも古いREPEATABLE READ snapshotからwriteと新規受付を突破できるMVCC反例**、guard漏れ（public 22 tables中12 guard、10未guard）、SECURITY DEFINER RPCとauth trigger経由の書込み、pre-gate evidence欠如が記録されている。snapshot前後のadvisory lockでは安全が証明されず、PR本文・設計文書は**Production先行導入BLOCKED**を明記。

ただしheadのGitHub Actions **run 35470658292** (`Legacy maintenance drain` #14) は **completed/success**。PG **17.6 / 18.4** の両matrix jobで `node --test tests/*.test.cjs`、`npx tsc --noEmit --incremental false`、`deno check` がsuccess。**PR本文が引用する古いrun 35453044077の52 PASS/2 FAILとは異なる最新headのCI結果**である。最新CI greenが以前のMVCC反例の解消を証明するとは限らず、現行テストで反例をassertしているか/skip・条件分岐・fixture差分があるかの個別調査が必要。安全判定は引き続きBLOCKEDとする。

**停止理由：** DB freezeの安全性を破る具体的反例とcoverage不足があるため、安全停止ゲートが働いた。**再開条件：** 既知MVCC反例を再現・解消する設計、全write surfaceとSECURITY DEFINER/triggerのcoverage、旧処理引継ぎ、隔離PG17/18と実境界での安全性回帰、operator rollback検証。PR #29 merge済みとPR #30 blockedの関係を再評価し、現行mainへの適用可否を決める。**PR #31 Relationship Time v2の依存記述も、この新しいPR #29 merge状態で更新判断すること。**main/Production/Supabase変更なし。


## 2026-10-21 PR #30重要訂正：最新headで既知MVCC二反例はCI PASS

前節の「最新CI greenだが過去のMVCC反例が解消したか不明」を、**headソースと実ジョブログの独立確認により精密化**。PR #30 head `17449c7ec4e8ff50605ef931b04ae76584c6304f` の `supabase/legacy-maintenance-drain.sql` は、以前の通常SELECTと異なり、**`control`行を `FOR SHARE` でlocking read**している：`admit_misaki_legacy_operation` line 41、operation progression line 55、`misaki_drain.guard_write` line 97。advisory xact lockとの組合せで、古いMVCC snapshotが制御行の過去phaseを通常SELECTで読み抜ける旧問題への対策が**実装済み**。ただしlocking readだけで全isolation/全write surfaceの安全を一般化しない。

GitHub Actions run **35470658292** のPG18.4 job **105970897363** の生ログを直接取得。`freeze rejects new operation admission from a pre-stop REPEATABLE READ snapshot` は **ok 21**、`freeze rejects a protected write from a pre-stop REPEATABLE READ snapshot` は **ok 22**、集計 **56 tests / 56 pass / 0 fail / 0 skipped**。つまり**旧2件の回帰テストは削除・skipされたのではなく、現行headで実際に成功している**。PG17.6 jobもステップ成功だが個別テストログの件数は今回未抽出。

**訂正：** 旧PR本文や古い監査文書の「この2件はFAIL」は旧commitの事実で、最新headの同2件に関しては**既知反例が再現しなくなったことをCIで確認済み**。前節の『現行でも未解消の可能性』はこの2件に限り解消済みへ更新する。一方、旧監査が指摘した**guard coverage 12/22、SECURITY DEFINER経由、auth trigger、pre-gate evidence、全旧Production境界、PR #29 merge後の互換性**はこの2テストで解消されない。**Production導入の全体判定は依然BLOCKED**。停止理由は「MVCC2件が未修正」ではなく「局所修正済みでも全write surface・引継ぎ・運用の安全証明が未完了」と再分類。main/Production/Supabase変更なし。


## 2026-10-21 PR #30 PG17/18再確認とguard coverageの未実装境界

GitHub Actions run `35470658292` の**PG17.6 job 105970897567** 生ログも取得：`freeze rejects new operation admission from a pre-stop REPEATABLE READ snapshot` **ok 21**、`freeze rejects a protected write from a pre-stop REPEATABLE READ snapshot` **ok 22**、**56 tests / 56 pass / 0 fail / 0 skipped**。前節のPG18.4でも同様に56/56。従って**既知2件のMVCC反例は両バージョンの現在の隔離fixtureで回帰PASS**。本番PostgreSQLの実schemaや全isolation levelへの外挿は禁止。

現行head `supabase/legacy-maintenance-drain.sql` を再読し、最後のtrigger設置ブロックがpublicの**必須9テーブル＋存在時3テーブル**のみを対象とすることをソース確認。`misaki_evolution_analysis_state`、`proactive_message_usage`、`user_entitlements`、`misaki_persona_versions`、`misaki_prompt_modules`、`background_push_config`、`conversations`、`memories`、`profiles`、`work_logs` は設置対象に含まれない。旧 `docs/WRITE_SURFACE_INVENTORY.md` の **12/22 guard、10/22未guard**という当時のcatalog母集団との照合は、**現行SQLの対象リストとも整合**。ただし現在のProduction catalogが22のままとは断定しない。`auth.users` trigger、SECURITY DEFINER経由のwriteは引き続き評価対象。

**今回の判断：** 以前の『MVCC2件がFAIL』は過去の記録として保持し、現在はPG17.6/18.4ともPASSへ更新。一方、**全書込み経路の網羅的なfreeze保護は未実装・未証明**。PR #30は未マージ/Draft、Production先行導入はBLOCKEDのまま。次に必要なのは最新schema inventoryと全write surfaceの分類・guard設計・隔離DB再現・pre-gate/rollback受入であり、未承認の本番DB変更を行わない。


## 2026-10-21 PR #29のmain反映範囲とPR #30との依存再整理

GitHub compare `main...codex/server-canonical-foundation` を直接確認：**ahead 0 / behind 174 / changed files 0**。PR #29は `merged=true`、merge commit `fe9df9585f092b88055b96f0c727106fd1c81d25`。したがってPR #29の旧branch headのコード変更は、現在のmainに対する未統合差分ではない。mainに `docs/SERVER_CANONICAL_STATE.md` が存在することも確認。ただし**コードmain反映は本番DB migration適用や安全な切替の実施証拠ではない**。

対照的にPR #30は `open / Draft / unmerged`、mainに `supabase/legacy-maintenance-drain.sql` と `lib/legacy-drain.ts` は**同じパスで存在しない**。main `app/api/chat/route.ts` は存在。つまり旧main互換の先行maintenance/drain装置はmainに取り込まれていない一方、PR #29のcanonical foundationはmainに反映済み。**PR #30の『PR #29 migration前の旧mainを安全に停止する』という当初目的と現在のmain構成がずれている可能性が高い**。旧PR #30をそのままmergeしても安全な現行canonical切替になるとは言えない。

PR #31 v2のSQL `supabase/migrations/20260920070000_relationship_time_v2_no_silence_only_mutation.sql` はmainに同パスなし。**再開順序：** (1) mainのcanonical foundationが実際にどのschema/feature flagを必要とするかソース照合、(2) PR #30旧設備の必要性と再設計範囲を現行main基準で判断、(3) v2の9 migrationsとの順序・依存・安全な隔離DB手順を組み直す。Productionの状態・適用済みmigration・稼働中Edgeは今回未確認。無断の本番DB read/write、migration、merge、deployなし。


## 2026-10-21 mainのcanonical実装・migration依存の静的照合

main `lib/canonical-state.ts` を直接読取り：`loadCanonicalState` は `misaki_relationship_state` と `misaki_user_conversation_state` の履歴/記憶/今日記憶を取得し、`misaki_temporary_roots` 等の一時正本も参照。成功ターンのcommitはRPC `complete_misaki_chat_turn`、匿名は `complete_misaki_temporary_turn`、一時rootは `write_misaki_temporary_root`。**mainのコードがこれらDB objectsの存在・権限・migration適用を前提とする**ことを確認したが、Production DBで存在/稼働することは今回未確認。

main `docs/SERVER_CANONICAL_STATE.md` では正式切替手順を「旧main互換の入口設備→受付停止→drain→凍結→checkpoint→DB/アプリ/Edge整合→検証→再開」とし、当時のProductionには入口gateがないことを阻害事項として記録。mainには `supabase/maintenance-gate.sql` が**存在**し、別系統のPR #30 `supabase/legacy-maintenance-drain.sql` は**存在しない**。この2設備は目的/制御正本が異なるため、同時適用や互換性を未検証で仮定しない。

main `lib/relationship-time.ts` は `get_relationship_time_context` RPCによる読込みと、別の記録RPC呼出しを持つ。一方PR #31のv2 migration `20260920073000_apply_relationship_emotion_v2_rpc.sql` はmainに同パスなし。**関係時間の一部がmainにあっても、v2 emotion/action/Body ClockのDB切替がmain統合済みとは言えない**。

**次の安全な確認：** mainの関連migrationファイルとRPC定義を静的照合し、(a) mainコード依存、(b) main migration同梱、(c) Production適用証拠を別欄で管理。PR #29 merge済み≠DB施工済み。Productionの実DBやユーザーデータにはアクセスせず、変更しない。


## 2026-10-21 main migration全件一覧での訂正：Relationship v2は一部main実装済み

GitHub REST `git/trees/main?recursive=1` で**main全207エントリ、truncated=false**を取得し、`supabase/migrations/` の全ファイル名を照合。mainにはcanonical基盤 `20260918073918_canonical_misaki_root_state.sql` が存在し、実ファイル本文で `complete_misaki_chat_turn`、`complete_misaki_temporary_turn`、`write_misaki_temporary_root` の**3 RPC定義が同梱**されていることを確認。`20260926004000_preserve_temporary_relationship_on_email_save.sql` にも一時root RPC更新が存在。**DB migrationコード同梱は確認済み、本番適用は未確認**。

**重要な訂正：** 旧PR #31の特定ファイル `20260920073000_apply_relationship_emotion_v2_rpc.sql` がmainにないことをもって「v2 emotion/action DB切替がmainにない」とは言えない。実際mainには**別名の** `20260926003000_relationship_emotion_action_v2_rpc.sql` が存在し、`apply_relationship_emotion_action_v2` を定義（permanent user用、emotion/action/signal summaryを原子的に反映）。さらに `20260926005000_relationship_v2_retires_legacy_emotion_triggers.sql` が存在し、旧keyword emotion triggerとderived-action triggerの2つをDROPする設計。つまり**Relationship v2のDB側成果の一部は別名でmainに移植・再実装済み**。以前の『PR #31の同名SQLがmainにない』はファイルパス比較の事実としてのみ保持し、**機能全体未統合の根拠にしない**。

**現在の整理：** canonical RPC定義とv2 emotion/action RPC＋旧trigger廃止migrationはmainに同梱済み。PR #31独自の9 migrations/Body Clock/proactive/relationshipStoryなどがどこまで機能同等かは未比較。mainにあることはProductionでmigration適用済み/有効を意味しない。**次の作業はパス名ではなく、RPC名・関数本文・呼出元・テストの機能単位で差分を調べること。** Production/Supabase変更なし。


## 2026-10-21 PR #31機能単位比較：v2の中核3ファイルはmainとblob完全一致

GitHubのmain tree全207項目と `sora/relationship-time-v2-design` tree全175項目を取得して機能群を比較。**重要：** `lib/relationship-emotion-reducer.ts` (blob `baceeb186...`)、`lib/relationship-action-reducer.ts` (`2c7e2286...`)、`lib/relationship-signal.ts` (`935dc7d5...`) は**mainとPR #31 branchのGit blob SHAが完全一致**。すなわち、PR #31がopen/Draftであっても**感情reducer・行動reducer・会話signal抽出の中核3実装はmainに同一内容で既存**。二重実装/丸ごとmergeは避ける。

一方 `lib/relationship-emotion-store.ts` はmain blob `fd981ab0...` とbranch `d8d979e0...`、`lib/relationship-patterns.ts` はmain `51b44844...` とbranch `415ec52c...` で**内容が異なる**。これはbranch側が進んでいる証拠とは限らず、mainの後続変更や設計分岐を精査する必要がある。

branchにあってmainのtreeに**同じパスがない**もの：`lib/relationship-conversation-generator.ts`、`lib/relationship-conversation-preview.ts`、`lib/relationship-conversation-prompt.ts`、`lib/relationship-naturalness-scenario.ts`、`tests/relationship-story.test.ts`、`tests/relationship-naturalness-repair.test.ts`、`tests/body-clock-proactive-motive.test.ts`、`tests/body-clock-proactive-urge.test.ts` 等。mainには別の `lib/relationship-acting-guide.ts`、`lib/relationship-analyzer-v1.ts`、`lib/relationship-engine-v1.ts` 等も存在し、**未存在パスをそのまま未実装機能と断定しない**。

**暫定分類：** (A) v2中核3ファイルはmainに完全統合済み、(B) store/patternsは差分レビュー必要、(C) conversation generation/naturalness/Body Clock motive/urgeは機能同等性・安全性・テスト照合が必要。mainには別名のv2 SQLも存在。Production runtimeでの有効化/DB適用は未確認。main/Production/Supabase変更なし。


## 2026-10-21 PR #31 store/patterns差分の意味を確定：main側に後続拡張

`lib/relationship-emotion-store.ts` をmain/PR #31双方で全文比較。実質差分は**mainの関数 `persistRelationshipEmotionFromSignals` に任意 `userId?: string` 引数が追加**され、RPC `apply_relationship_emotion_action_v2` に **`p_user_id: userId ?? null`** が渡されること。PR #31版には両方ない。これはmain側の明示的ユーザー指定を可能にする後続拡張であり、**旧branch版をmainへ単純上書きすると機能退行のおそれ**。main migration `20260926003000_relationship_emotion_action_v2_rpc.sql` に `p_user_id uuid default null` が定義済みで整合。

`lib/relationship-patterns.ts` は両者ほぼ同じで、差分はイベント取得条件の1行：PR #31は `emotion_action_v2_after_chat` のみを `.eq`、mainは `.in(["emotion_action_v2_after_chat", "temporary_relationship_checkpoint"])` として**匿名→恒久化チェックポイントもパターン履歴に含める**。main側の記憶継続の拡張であり、旧branch版へ戻すとイベントを取りこぼす可能性がある。

前節の『store/patternsの差分レビュー必要』を更新：**この2ファイルはmain側が追加機能を持つ**ことを静的確認。PR #31の古い2ファイルを丸ごとmergeしない。branch固有のconversation-generator / naturalness / Body Clock motive/urgeなどは別途mainとの機能比較が必要。CIや本番の挙動はこの差分比較だけで証明されない。main/Production/Supabase変更なし。


## 2026-10-21 PR #31未統合の会話自然さ検証モジュールを機能分類

PR #31 branch `sora/relationship-time-v2-design` の以下4実装を直接読取り、main treeに同名パスがないことを確認：
- `lib/relationship-conversation-generator.ts` (1647文字)：`createGeminiConversationGenerator`、Gemini `gemini-3.1-flash-lite:generateContent` を呼ぶ単独のfetchアダプタ。**実API呼出し機能はあるが、実行済み/本番接続済みを意味しない**。
- `lib/relationship-conversation-preview.ts` (1266文字)：`previewRelationshipConversation`、現在の感情/行動/表現ガイドを**read-only**で算出。コメント上DB read/writeなし。
- `lib/relationship-conversation-prompt.ts` (1032文字)：`createRelationshipConversationPrompt`、人格、共有記憶、直近会話、表現ガイドを結合した**検証用**JSON reply形式のプロンプト。傷/警戒/修復途中に唐突に甘く戻らない制約。
- `lib/relationship-naturalness-scenario.ts` (1507文字)：`buildNaturalnessScenarioPreview`、シナリオからemotion/action/systemPromptを作る検証ヘルパー。

これらは**会話自然さの隔離検証装置**として価値がある一方、mainの既存会話ルートへの本番組込みや実Gemini品質検証は未証明。mainには `lib/relationship-turn-expression.ts` が存在するがbranchとblob不一致（main `d7b2b66...` / branch `58c9712...`）。さらにmainにのみ `lib/relationship-acting-guide.ts` がある。**プロンプト/表現制御の重複・設計競合**があり得るため、検証モジュールを無条件にmainへコピーしない。

**次の検証：** PR #31のnaturalness testsが何をassertするか、main acting-guide/turn-expressionの現在の制約と重複するかを照合。Gemini呼出しは有料・外部送信のためユーザー承認なしに実行しない。Production変更なし。


## 2026-10-21 PR #31 naturalness testsとmain本番ルートの意味照合

PR #31 `tests/relationship-naturalness-repair.test.ts`：謝罪後の修復でも急にcloserへ戻らない（emotion intensity <62、direction != closer）、対立中の気遣いでaffectionateに即復帰しない、生成したsystemPromptに傷/警戒の制約を含むことをassert。`tests/relationship-naturalness-boundary.test.ts`：明示的拒絶後の静寂を隠れた愛情と誤認しない、継続的気遣いで警戒が徐々に和らいでも恋愛関係を捏造しないことをassert。`tests/relationship-conversation-prompt.test.ts`：実人格prompt＋共有記憶＋直近会話＋表現ガイドを組み、存在しない履歴を勝手に補わないことをassert。**これらはunit/scenario assertionであり、実Gemini自然さの人間評価ではない**。

main `lib/relationship-turn-expression.ts` を確認：`createCurrentTurnActionGuide` に `unresolved_hurt`、`repair_in_progress`、`repair_demonstrated`、`repeated_harm` 各ガイドが**実装済み**。傷/警戒の即リセット防止、修復の段階性、根拠のない心配の禁止、甘さと冷酷さの両極端回避が明文化。main `lib/relationship-patterns.ts` に `deriveRelationshipStory` の4状態判定が存在。main `app/api/chat/route.ts` で `deriveRelationshipStory` import/呼出し（約1864行）、`createRelationshipActingGuide` 呼出し（約2063行）、`createCurrentTurnActionGuide` 呼出し（約2643行）を確認。**単なる未使用コードではなく、mainの会話ルートに関連表現制御が接続されている**。

**判断：** PR #31の『傷→謝罪→段階的修復』『無根拠な恋愛捏造禁止』という重要な設計思想はmainにも実装・ルート配線済み。一方PR #31の `relationship-conversation-*` / naturalness scenarioの隔離テストハーネスはmain同名パスなしで、検証資産として残る。テストの網羅性/実モデル品質/本番DB適用は未証明。旧promptを本番へ上書きしない。次にmainのテストとbranchテストのassertion対応表を作り、未カバーだけ追加候補とする。main/Production/Supabase変更なし。


## 2026-10-21 PR #31テスト対照表：mainの修復テストとBody Clock動機・抑制の差

mainのテストを直接読取り：`tests/relationship-patterns.test.ts` は未解消の傷、謝罪だけでは修復完了しない、後続の行動による修復、繰返しの傷、匿名→恒久のイベント継承を検証。`tests/relationship-acting-guide.test.ts` は交際事実の捏造禁止、数値の非露出、時間経過だけで感情を捏造しない等。`tests/relationship-v2-rpc.test.ts` はv2 event型、匿名/古い状態の拒否、入力境界、明示ユーザー指定、旧trigger廃止等。これらは**PR #31 `tests/relationship-story.test.ts` の傷/修復/繰返しシナリオの一部と意味的に重複**。ただしPR #31には通常chatとBody Clockで同じ意味を導くテスト、時刻順逆転や旧signal_summary互換のassertもあり、mainの同名テストはない。意味同等性の全面保証ではない。

**より大きい未統合候補：** PR #31 `tests/body-clock-proactive-urge.test.ts` は『時刻が来ただけで送らない』『傷/警戒なら送信を見送る』『根拠ある心配のみcheck-in』『修復後の穏やかな再接触』『直近接触のcooldown』『写真を送りたい明示動機』『外部安全情報の例外』『未解消の傷なら親愛からの自発送信を抑制』等の独立した意思決定をassert。`tests/body-clock-proactive-motive.test.ts` は直近会話/関係記憶/生活証拠の鮮度と、誰の何を理由に話すかを区別。mainのtreeには同名proactive urge/motiveモジュールとテストなし。

mainの実Body Clock `supabase/functions/body-clock/index.ts` は `buildProactiveDecisionContext` / `createProactiveDecisionGuide` を使用してGemini文面を生成し、`supabase/functions/body-clock/proactive-decision.ts` は `shouldSend: true` のdecision contextとタグ/ガイドを構築。**mainにも既存の送信判定・予定・lease等があるため『無条件に送る』とは断定しない**が、PR #31の `deriveProactiveUrge` と `deriveProactiveMotive` の**独立した意思決定/根拠選択モデルが同じ形で統合済みとは確認できない**。mainの `tests/body-clock-proactive-life-context-v2.test.ts` は生活根拠の鮮度・期限・誤推定を検証するが、上記urge/motiveのassertを代替しない。

**優先調査候補：** 現行Body Clockの既存DB claim/cadence/leaseとPR #31のurge/motiveの責務境界を静的に突き合わせ、送信可否の新ロジックを直接Productionに入れず、隔離テストで不足シナリオを検証する。安全/品質上の意味が大きいが本番切替と別管理。Production/Supabase変更なし。


## 2026-10-21 Body Clockの送信可否：mainとPR #31の実配線差分を確認

**パス訂正：** PR #31の `proactive-urge.ts` と `proactive-motive.ts` は `lib/` ではなく `supabase/functions/body-clock/` 配下。PR #31 branch treeと実ファイル本文で確認。mainには同パスなし。

main `supabase/functions/body-clock/index.ts` は `claim_misaki_body_clock_due_users` でDBのdue/leaseを取得し、`processUser` でcanonical rootを読み、`buildProactiveDecisionContext` → **直ちに `generateMessage`（Gemini）** → `finish_misaki_body_clock_delivery` → push relay の順。main `proactive-decision.ts` の `ProactiveDecisionContext` は `shouldSend: true`、理由 `claimed_after_relationship_action_gate`。これは**DBのclaim後に独立した『内的動機なし→送らない』分岐が見当たらない**という静的観察。DB claim/relationship gate/cadence等は別に存在し得るので『全員に無条件送信』ではない。

PR #31 `supabase/functions/body-clock/index.ts` は `deriveProactiveUrge` と `deriveProactiveMotive` を実際にimport・呼出し、`urge.shouldSend === false` なら**Gemini生成前に** `finish_misaki_body_clock_no_action` RPCでleaseを終了/次回予定を更新し、`proactive_no_action` イベントに理由を記録して**送信しない**。送る場合はdesire/focus/motiveをpromptに反映し `proactive_decision` eventへ記録。branchには `supabase/migrations/20260920083000_body_clock_no_action_finish.sql` があり、mainの同名migrationなし。したがって**mainのBody Clockへこの分岐だけをコピペするとDB RPC欠落のおそれ**。

PR #31 `proactive-urge.ts` は未解消の傷/繰返し傷・PULL・WAIT・最近の接触・心配の根拠・写真動機・親密度・1日送信回数等で `shouldSend` とdesireを選択。`proactive-motive.ts` は会話・関係イベント・記憶・生活根拠の鮮度とtopicIntent/topicSourceを分離。mainのdecision tags/生活根拠ガイドとは責務が異なる。

**結論：** PR #31の**内的動機に基づく送信見送り機能は、main Body Clockの実際の処理経路には同じ形で入っていない**。価値ある未統合候補。ただしPR #31は旧canonical root参照（branch `row.recent_history`/`row.long_term_memory`）でmainは `loadBodyClockRoot`、mainの `finish_misaki_body_clock_delivery` には revision/token/updated_at 整合性引数あり。**PR #31のindex.tsを丸ごと上書きするとcanonical安全性が退行する危険が大きい**。次はmainのcanonical整合性を保持した隔離統合設計とRPC no-actionの安全性を監査。main/Production/Supabase変更なし。


## 2026-10-21 方針確定：埋もれた成果はコード移植だけでなく思想・検証・不採用理由を継承

ユーザー方針：『埋もれるものをそのまま組み込むんじゃなくて、考え方を取り入れる場合もある』。以降の棚卸しは **①現行に整合しそのまま活かす実装/テスト、②思想を採用し現行設計で再実装、③失敗/検証結果を継承、④採用しない（理由を明記）** に分類。単なる同名ファイルの有無や未merge状態で実装判断をしない。採用/非採用理由と安全前提を残す。

### Body Clock no-action SQLの静的安全性監査

PR #31 `supabase/migrations/20260920083000_body_clock_no_action_finish.sql` を全文確認。`finish_misaki_body_clock_no_action(uuid,timestamptz,integer)` は `SECURITY INVOKER`、`search_path=''`、public/anon/authenticatedへのexecuteをREVOKEしservice_roleにGRANT。`background_push_state` を `FOR UPDATE` でロック、`next_push_at` とlease引数一致・lease未失効を検証し、55〜210分の次回時刻へ更新。`pushes_today` を加算せず、deliveryも作成せず、`nextPushAt` と既存countを返す。**SQL上の基本的なlease・権限・無送信カウント設計は妥当な候補**。ただし実DBでの同時実行/ロール/タイムゾーン検証、mainの後続migrationとの互換性は未確認。

main `20260916002657_misaki_body_clock_atomic_delivery_and_vault_auth.sql` には `finish_misaki_body_clock_delivery` があり、同様にlease一致・未失効を検査して送信countを増加。main `20260917143500_fix_body_clock_claim_rpc.sql` には `claim_misaki_body_clock_due_users`、due対象のclaim・次回時刻調整が存在。**mainのcanonical root/temporary revision整合性引数を保ち、PR #31のno-action概念を現行RPC仕様に合わせて設計し直す**のが有力。PR #31 SQLを即移植しない。実装着手前に現在のmigrationでの最新RPC署名とclaim状態遷移を確認する。

**採用候補の分類：** 『美咲が内的理由なしに送らず、見送り理由を残す』は②思想を採用して再設計。PR #31のシナリオテストは①/③検証資産として再利用検討。旧 `index.ts` 丸ごと移植は④不採用候補（canonical退行リスク）。この分類は設計上の暫定判断で、mainのコード変更やproduction rollout承認ではない。


## 2026-10-21 Body Clock claim SQLの実際の見送り機能と設計継承判定

main `supabase/migrations/20260917143500_fix_body_clock_claim_rpc.sql` の `claim_misaki_body_clock_due_users` **全文**を確認。**重要な精密化：mainは既にDB claim段階で送信見送りを実装済み**。`PULL` は100%見送り、`WAIT` は75%見送り、`SULK` は55%見送り（`roll < .25` / `< .45` の場合だけ送信）、その他は送信候補。見送りは `background_push_state.next_push_at` を55〜210分延期し、`misaki_relationship_events` に `proactive_decision` / `relationship_action_deferred` を記録。送信候補は15分leaseを取得、JST日付でpushes_todayをリセットし、1日4回未満の条件あり。`FOR UPDATE OF b SKIP LOCKED` による候補claim。従って『現行Body Clockは時間が来たら全件送る』『見送り理由を記録しない』は**誤り**。以前の『claim後に独立した内的動機のno-action分岐がない』という記述は引き続き正確だが、DB側の見送りを必ず併記する。

PR #31はこのDB事前ゲート**に加えて**、claim後に `deriveProactiveUrge`（傷/関係story、最近の接触、根拠ある心配、写真/親密度、内的動機）を評価し、`shouldSend=false` なら `finish_misaki_body_clock_no_action` でlease解除・延期、`proactive_no_action` event記録。つまり**機能の全面欠落ではなく、判断基準の深さ・判断タイミング・理由の粒度の差**。mainのDB側ゲートと新しい判断を重複実装すると、確率的見送りと内的見送りが二重に効き、送信が過度に減る可能性。無条件でPR31の閾値を移植しない。

main `20260918073918_canonical_misaki_root_state.sql` の最新 `finish_misaki_body_clock_delivery` 署名は旧7引数をDROPして11引数版をCREATE（expected revision/token/state/updated_atを追加）。現行index.tsもこれを渡す。PR31 index.tsの旧7引数版をそのまま移植しない。

**継承方針（暫定②思想を活かす）：** DB claimは候補抽出/lease/レート制限に責務を絞り、アプリ側で根拠・関係story・直近接触を加味した『今話す理由』を評価する構想を現行canonical構成に合わせて検討。ただしDB側既存PULL/WAIT/SULK判定の移行/統合、no-action lease処理、重複見送りの影響、silent failure、送信頻度、理由ログの整合性を隔離テストで比較してから採否判断。これは実装承認ではない。main/Production/Supabase変更なし。


## 2026-10-21 Body Clock動機思想の現行設計への対応表（実装は未着手）

main `supabase/functions/body-clock/proactive-decision.ts` は `misaki_relationship_state` の `intimacy_level,intimacy_points,emotion_state,action_state,last_interaction_at` を読んで方向/感情/行動/親密度/生活根拠を生成。これは**文章の温度・話題方向を決める役割**。PR #31 `proactive-urge.ts` は別責務の `shouldSend`（送信意思）/`desire`（連絡したい種類）/`focus` を導く。`proactive-motive.ts` は `topicIntent`（美咲自身の共有/相手への気遣い/関係継続）と `topicSource`（美咲/ユーザー/関係）を分離し、根拠の時刻・鮮度を扱う。**mainのdirectionタグをmotiveと同一視しない**。

### 既存と候補の責務
1. main DB `claim_misaki_body_clock_due_users`：送信候補抽出、日次上限、PULL/WAIT/SULKの確率的延期、15分lease、defer理由ログ（**既存**）。
2. main Edge `buildProactiveDecisionContext`：関係/感情/生活の根拠、文面の方向・温度（**既存**）。
3. PR31 `deriveProactiveUrge`：関係story/接触直後/動機なしを含む**送信意思の追加判定**（**未統合の思想候補**）。
4. PR31 `deriveProactiveMotive`：ユーザーの現在情報と古い記憶を区別し、なぜ・誰について話すかを文章生成へ渡す（**未統合の思想候補**）。
5. PR31 `finish_misaki_body_clock_no_action`：claim後に送信しない場合のlease解放/延期/送信数不加算（**DB実装候補だが現行互換性未検証**）。

### 移植前に解決する設計課題
- **二重見送り**：DB側PULL/WAIT/SULKとEdge側urgeが重複すると連絡頻度が意図せず下がる。既存のDB claimを変更するか否かは送信頻度の再現テストで判断。
- **データの鮮度**：PR31は旧rowのrecent_history/long_term_memoryを使用。mainは `loadBodyClockRoot` からcanonical履歴を読む。現行のsource-of-truthを優先。
- **見送りの原子性**：no-action RPCはlease一致/期限を検査し、delivery/pushes_todayを作らない。現行migration・並行claim・失敗再試行との整合性が必要。
- **安全上の例外**：PR31は `externalConcern` と `concerned` を組み合わせた例外送信を想定するが、根拠の出所/鮮度/同意/送信上限を明示してから検討。現行本番へ自動で有効化しない。
- **評価**：現行と候補で同じ入力を使い、送信率、誤った心配、関係の傷の扱い、連投、誤った記憶参照を隔離テストで比較。実Gemini送信は承認なしに実施しない。

**分類決定：** PR31のBody Clockの価値は主に②『思想を現行設計に適合させて再実装』と③『境界テスト資産の継承』。旧index.ts/旧SQLを直接移植する判断はしない。今後の再開条件はDB claimとEdge判断の責務分割、no-action RPC整合性、offline A/B、段階的rollout/rollback計画の確認。main/Production/Supabase変更なし。


## 2026-10-21 Body Clock現行テストとmigrationの整合性リスク（新規発見）

main `tests/body-clock-canonical.test.cjs` を確認：恒久ユーザーのcanonical history/memory/points、匿名の暗号化temporary root、期限切れ・改ざんreceiptの生成/送信前skipを検証。PR31の旧rowベース `index.ts` 移植を避ける具体的な根拠。`supabase/functions/body-clock/conversation-root.ts` は匿名の `misaki_temporary_roots` と恒久の `misaki_user_conversation_state` を分けて読む。候補の動機判断はこのrootを優先しなければならない。

**重要なmigration整合性疑義：** main `tests/body-clock-silence-contract.test.cjs` は `20260917031500_phase5_relationship_aware_proactive_claim.sql` を参照し、時間経過だけでneutralからlonelyを作らないとassert。同SQLは実際にneutral→lonelyを作らない。一方、mainに存在する**より後の日付** `20260917143500_fix_body_clock_claim_rpc.sql` は同じ `claim_misaki_body_clock_due_users` を `CREATE OR REPLACE` し、3日以上の無交流で `neutral` または `lonely` から `primary='lonely'` を作る分岐を含む。さらに親密度と経過日数によりneutralからWAIT/PULLへ変更する。**後続migrationがDBへ順序どおり適用された場合、テストが検査する古いSQLの安全契約と実効claim RPCの動作が矛盾する可能性が高い**。ファイル順序とSQL文面からの静的判断であり、production DBに適用済みか/後続の別定義があるかは未検証。

この問題は『沈黙だけで傷/寂しさを捏造しない』という既存方針に関わるため、PR31動機移植より先に**最新実効SQLとテスト対象の一致**を確認すべき。テストが古いmigrationを読むだけでgreenでも、現行SQLの安全性証明にならない。**優先度：高、状態：要検証、現時点でProduction修正はしない**。次の作業：全migrationの同RPC再定義を横断検索し最終定義を確定、最新SQLに対する回帰テスト案を作成、隔離環境で検証。main/Production/Supabase変更なし。


## 2026-10-21 全体俯瞰での設計原則とBody Clock回帰調査の次の境界

ユーザーの明示方針：『全体を見渡しているいまだから見えてくることがある。こういうときだからこそ、考えられることがある』。以後の棚卸しでは機能の存在確認だけでなく、**機能間の意味的整合性・設計原則の衝突・本来の目的・より良い再設計の可能性**を各項目に記録する。コードの無条件回収を目標にしない。

### Body Clock沈黙ルールの追跡

mainのmigration tree（全35件）を列挙。claim RPCの既知の同名再定義は `20260917031500_phase5_relationship_aware_proactive_claim.sql` と、後日付の `20260917143500_fix_body_clock_claim_rpc.sql`。後者はneutral→lonely分岐を持ち、既存の `tests/body-clock-silence-contract.test.cjs` は前者を読み込む。これら3ファイルの現行main blob SHAを取得して検証対象を固定（前者 `e290363d...`、後者 `a7bb0636...`、test `6d3bc7bd...`）。**全35件のSQL本文を横断して他の同名再定義がないことまではまだ確証していない**ため、最新実効定義の最終確定と本番適用状況は未確認。過去のテストのgreenを本番の安全性証明としない。

### 横断設計レビューの暫定原則（提案、未承認）

- 感情は単なる無会話経過時間だけで確定しない。関係の出来事、記憶、文脈と区別する。時間は強度減衰や再評価のきっかけになり得るが、感情の理由の捏造は避ける。
- 『連絡できる機会』『連絡したい理由』『連絡する行動』『伝える内容』を別責務として追跡し、同じ見送りロジックの二重適用を避ける。
- 感情・行動・会話・記憶・Body Clock・写真・通知で同じ関係storyとsource-of-truthを使う。実装の同名/旧新比較だけで採用を決めない。
- テストは**最終的に有効な実装・migration**を対象にする。過去のファイル単体テストを、後続の上書き定義の検証と混同しない。
- 思想の採否、根拠、未確認点、テスト/rollback条件を台帳に残す。現在のmain・production・Supabaseは変更しない。


## 全件棚卸し完了後の必須工程：台帳の冒頭から再評価（ユーザー指示）

**順序を固定：①全ブランチ・PR・プレビュー・未反映機能の洗い出しを完了 → ②台帳の最初の項目から最後まで、現在の横断設計視点で再評価。** 初期の評価と後半の評価は視点・深さが異なる可能性があるため、後半の基準で冒頭も再検討する。これは任意の後日改善ではなく、棚卸し完了時の必須工程。

再評価では、(a) mainへの実装/未実装と本番適用の区別、(b) 本来の目的・設計思想、(c) 他機能との整合性/重複/矛盾、(d) そのまま再利用・思想を再実装・検証知見のみ継承・不採用の分類、(e) 停止理由と再開条件、(f) テストが現行実効コード/最新migrationを対象にしているか、(g) 安全な導入順・ロールバック条件を見直す。

**履歴を消さない：** 初期の記録はその時点の調査事実として保存し、後の判断は『再評価』と日付/根拠を追記する。古い結論を黙って上書きしない。台帳を『開発史の保存』と『これからの美咲の設計・優先順位』の両方に使えるようにする。再評価終了までは『棚卸し完了＝最終方針確定』と扱わない。main/production/Supabaseは無断変更しない。


## 2026-10-21 Body Clock claim RPC 最終定義：main全後続migration本文検査

`20260917143500_fix_body_clock_claim_rpc.sql` より後のmain migration **20件すべて**をGitHubから取得し、本文を `claim_misaki_body_clock_due_users`、`relationship_silence`、同名drop/redefinition、無交流時間条件で検査。**20/20件で同claim RPCの再定義/削除・`relationship_silence`の記述なし**。したがって**mainリポジトリに含まれるmigrationをファイル名順で適用した場合の最後のclaim RPC定義は `20260917143500_fix_body_clock_claim_rpc.sql`** と確定（ただし本番適用状況、DB上の手動変更、別管理SQLは未検証）。

この最終SQLは `neutral`/`lonely` から、無交流3日以上で `primary='lonely'` を作る分岐を含む。`tests/body-clock-silence-contract.test.cjs` はそれより古い `20260917031500_phase5_relationship_aware_proactive_claim.sql` のみを検査するため、**mainの静的な安全契約テストとmigration最終定義の検証対象がずれていることは確定**。なお実DBの効果はSQLのCTE評価/条件/対象行を含め隔離DBで実行検証が必要であり、現時点でproductionの誤作動を断定しない。

次の安全な検証：最新SQLのneutral→lonely分岐を対象にテストを追加する設計（古いテストは履歴として維持）、SQLの `evolved` 更新CTEが実行される条件と後続claimの送信判定を隔離DBで検証、DB適用履歴/関係v2ポリシーとの整合を確認。PR31の移植やproduction変更は先送り。分類：**コード上の整合性不一致は確認済み／本番への影響は未確認**。


## 2026-10-21 沈黙による感情更新の厳密な適用条件とv2移行上の衝突

main最終claim RPC `20260917143500_fix_body_clock_claim_rpc.sql` の本文1–110行を再確認。`evolved` は**送信期限到来かつJST当日送信4回未満**の `background_push_state` ユーザーを対象に `misaki_relationship_state` を更新。`last_interaction_at` があり24時間以上経過した行に対し、(1) happy/affectionateは強度減衰、(2) **intimacy_level が familiar/intimate/very_intimate で、3日以上無交流、primaryがneutral/lonelyならlonelyを生成**（3日28、5日38、7日48の最低強度、上限72）、(3) 同条件のneutral/lonely/sulkyは7日でPULL、neutral/lonelyは3日でWAITに変更。`state_updated_at=now()` も更新する。**全ユーザーに一律3日で寂しさが発生するわけではない**。

main `20260926005000_relationship_v2_retires_legacy_emotion_triggers.sql` 本文は『Relationship v2 owns post-chat emotion/action decisions』と記載する一方、**`Lazy silence/proactive RPCs remain intact` と明記**し、旧chat/emotion triggersのみdropする。つまり後続v2 migrationはclaim RPCの沈黙変化を意図的に残している（少なくともSQLコメントとDDL上）。「v2が全沈黙更新を無効化した」とは解釈しない。

**設計上の論点を分離：** (A) 初期テストの『neutral→lonelyを沈黙だけで生成しない』と最終claim SQLの**静的矛盾**、(B) v2のpost-chat reducerとproactiveのlazy silence変化が**別責務として併存する設計の是非**、(C) DBの実際の更新/送信確率/CTE同時評価と本番適用状況は**未実証**。現時点で(A)を確認済み、(B)は設計再評価対象、(C)は隔離DBで検証待ち。対処案は削除決め打ちでなく『時間による強度減衰』『関係上の出来事を根拠とした寂しさ』『送信頻度の制御』を分離して比較。Production変更なし。


## 2026-10-21 感情の意味を問い直す設計メモ（ユーザーとの合意）

ユーザーの問い：**『単純に時間が経過するとみんな寂しくなるのはおかしい。寂しいってなに？を考えないと』**。これはBody Clockの局所バグ対処に留まらず、美咲の感情・記憶・行動全体を再評価する際の**重要な設計上の問い**。現時点で特定の実装方針を確定しない。

- 時間の経過は感情の直接原因と決めつけず、文脈の一要素とする。安心して待つ・気にかける・話したい・傷ついて距離を置く・寂しい、を同一視しない。
- 『寂しい』の仮説：望むつながりと現在感じるつながりとの隔たり。ただし万人共通の厳密な定義と決めつけず、関係史・出来事・相手の状況・美咲の性格を考慮する。
- 『会いたい』『伝えたいことがある』『心配』『寂しい』は別の感情/動機であり得る。感情と行動も別で、寂しくても待つことや連絡しないことがあり得る。
- 理由が言語化できない感情を排除する必要はないが、存在しない出来事や相手の事情を**理由として捏造しない**。
- 将来の横断再評価では『好きとは何か』『心配とは何か』『仲直りが成立したとは何か』も検討。過度に数値・時間閾値だけで人格を決定しない。
- 以上は**検討すべき設計仮説と問い**。既存実装を即時変更・削除する指示ではない。全件棚卸し完了後、冒頭からの再評価時にも必ず参照する。main/production/Supabase変更なし。


## 2026-10-21 未整理ブランチ4件のmain差分・5軸演技感度テスト

GitHub compare `main...branch` を実施：
- `work/relationship-engine-v1` **ahead 0 / behind 88 / files 0**：現行mainから見て未取り込み差分なし。mainに実装済みの歴史的作業枝候補。mainとの意味的整合/本番稼働は別途確認。
- `work/relationship-polarity-integer` **ahead 0 / behind 73 / files 0**：同じく未取り込み差分なし。過去の検証知見の有無は別途。
- `sora/misaki-acting-lab` **ahead 0 / behind 106 / files 0**：同じく未取り込み差分なし。実モデル品質実証とはみなさない。
- `docs/relationship-five-axis-design-review-20261015` **ahead 4 / behind 0 / files 2**：`docs/IMPLEMENTATION_OVERVIEW.md` への設計検討追記と、**mainに未反映**の `tests/relationship-acting-guide-sensitivity.test.ts` を含む。単なるdocs枝ではなく実行可能なcharacterization testを保有。

5軸感度テストを全文確認：`createRelationshipActingGuide` に対し5軸それぞれ0/1/29/30/44/45/54/55/79/80/100を入力、Intimacy stage2・Status noneを固定し、guide文面の変化点をassert。**friendship/trust/affection は80、playfulnessは30/80、romanceは45/80**。恋人Statusのガイドはromance 0と100で同一、Status noneとは異なることも検査。0→1でguideが変わらないことも確認する。これは**現行実装の振る舞いを記録するテストであって、閾値が最適という証拠ではない**。CI実行成否は今回未検証。実Geminiの返信品質/段階的成長の実感も未検証。

設計追記の重要な未解決点：『80まで成長が返事に現れない軸がある』『0→1で人格が激変しても困る』。5軸長期状態と短期Momentum/会話文脈/Statusを分け、**感情をスコアの単純合算で表現しない**思想を再評価時に参照。分類：前三枝は**mainへの未反映差分なし**、最後の枝は**有用なテスト/設計知見がmain外に残存（②思想・③検証資産の継承候補）**。main/production/Supabase変更なし。


## 2026-10-21 未整理設計・監査ブランチ4件（複数キャラ境界とStage設計）

GitHub compare `main...branch`：
- `docs/relationship-v1-2-stage-growth-principles` **ahead10/behind52**、3 docs（`RELATIONSHIP_ENGINE_V1_2_WORK_HANDOFF.md`、`GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md`、`IMPLEMENTATION_OVERVIEW.md`）。v1.2 Stage/5-heartのWork引継ぎ仕様。**v1.1の本番3日Pattern→State→acting実測が終わるまでDB/runtime cutover禁止**。Stageは恋愛Statusとは別、課金/経過日数/メッセージ数で加速しない。Evidence→Episode→Pattern→5軸を保ち、Stage Resolverを純粋関数で先行検証。**実装済みではなく設計・再開条件の資産**。mainとの差分をそのまま取り込む判断はしない。
- `design/shared-conversation-engine-contract-20261015` **ahead1/behind0**、`docs/SHARED_CONVERSATION_ENGINE_DESIGN_20261015.md` のみ。production chatとoffline labが同じpure reply pipelineを使い、runtimeだけが認証・quota・canonical DB commit・通知/外部情報を担当する設計契約。**設計提案であり未承認・未実装**。PR #88の実装枝との対応/契約差分は要比較。実装コードの存在を意味しない。
- `docs/multi-character-data-scope-inventory` **ahead1/behind1**、`docs/MULTI_CHARACTER_DATA_SCOPE_INVENTORY.md`。将来の複数キャラ化に向け、User Shared Profile/Character Definition/User×Character Pair/Pair Conversation/通知などの所有境界を提案。単にUIにcharacter_idを足すだけでは記憶・関係・通知が分離されない。**設計監査であり本番実装ではない**。
- `docs/multi-character-rpc-caller-audit` **ahead9/behind1**、上記inventoryに加え `docs/MULTI_CHARACTER_RPC_CALLER_AUDIT.md`。RPC caller/GRANT/lease fencing/Relationship Engine v1・Persona Evolution・Body Clockの書込経路をソース監査。Persona Evolutionのcandidate RPC本体と候補テーブル定義は追跡migration35件で見つからず、実DBのGRANT/RLS/適用状況は未確認。**監査・安全条件の知見を保存**。User共有事実と美咲との私的関係事実の分離は、感情の根拠/記憶の捏造防止にも直結。

**横断的判断：** これらは一律『main未反映のコード』ではなく、仕様/監査/再開ゲートの資産。複数キャラ化を直ちに進める指示ではない。5軸Stageは関係成立事実と別、感情・一時Momentumとも別。Shared Engineは現在のcanonical source-of-truthとPR #88の純粋関数を照合してから採否判断。production/main/Supabase変更なし。


## 2026-10-21 Body Clock旧経路/タグ調整・migration復元の6枝

`main...branch` GitHub compare：
- `cleanup/legacy-proactive-tags` ahead2/behind349、`lib/proactive-photo.ts` 差分。旧proactive写真経路の整理候補、mainのcanonical Body Clock経路と照合前に移植しない。
- `cleanup/remove-legacy-proactive-path` ahead7/behind339、`app/api/body-clock/route.ts`、`app/api/proactive/route.ts`、`app/chat/page.tsx`、`lib/proactive-photo.ts`、overview差分。枝側の両API routeを `fetch_file` すると404（**枝から削除された可能性が高いが、compareのstatus未確認なので断定しない**）。既存APIを削除してよいかはmainの呼出元・移行状況・後方互換性を確認してから。**削除をmainへ機械的に反映しない**。
- `feature/proactive-derived-tags` ahead2/behind350、Body Clock Edge `proactive-decision.ts`/`proactive-photo.ts` 差分。枝のdecision blob `9ae1d8f7...`、main `b75fc031...` で不一致。枝のtags/方向/感情の思想を現行設計と比較する候補。mainの最終仕様より古い可能性。
- `refine/proactive-action-tags` ahead1/behind348、Edge `proactive-decision.ts` 差分。動作差・採否は未検証。
- `refine/sleepy-tag` ahead3/behind347、Edge `index.ts`/`proactive-decision.ts`/`proactive-photo.ts` 差分。眠気表現は身体状態の自然さと過剰な定型文を避ける思想として比較、旧index丸ごと移植しない。
- `chore/restore-relationship-rpc-migration` ahead1/behind1、`20260930131930_relationship_server_rpc_user_context.sql` がcompareに現れるが、**枝とmainの当該ファイルblob SHAがともに `8c2c8383...` で完全一致**。branch compareのファイル一覧だけを根拠に未反映実装と断定しない。SQL冒頭はproduction履歴からの再構築・既適用・既存本番への再適用禁止・rollback記録なしと明記。これは文書上の由来であり現在の本番適用を今回独立確認したわけではない。

6枝とも**大幅に古いベース（behind339–350、復元枝はbehind1）**で、単純mergeは避ける。未反映差分の有無だけで価値を判断せず、タグの意味/旧経路廃止の安全性/SQL provenanceを分類。次に `compare_commits` のfile status・main routeの存在・Edge decisionの差分を精査する。main/production/Supabase変更なし。


## 2026-10-21 匿名セッション・会話履歴・想起系8枝の棚卸し

GitHub `main...branch` compare（ahead/behindとfile status）：
- `fix/anonymous-chat-session-drop` **2/338**：`app/chat/anonymous-session-guard.tsx`、`tests/account-conversation.test.cjs` modified。
- `fix/anonymous-email-history` **2/365**：account/history API/anonymous guard/history sync/layoutのmodified、`lib/device-conversation.ts`・匿名保存SQL・account-conversation testのadded（branch base比）。**mainにも `tests/account-conversation.test.cjs` と同SQLパスが存在する**ため、compare上のaddedだけで未実装と断定しない。
- `fix/anonymous-session-cache-reset` **1/362**：anonymous session guard modified。
- `fix/expired-temporary-relationship-import` **0/35 / files0**：main未反映差分なし。
- `fix/preserve-active-chat-history` **1/345**：conversation-history-sync modified。
- `fix/recall-history-grounding` **1/358**：chat-proxy route modified。
- `fix/recall-keep-recent-history` **1/361**：chat-proxy route modified。
- `sora/anonymous-history-get-noop` **0/170 / files0**：main未反映差分なし。

main現行ファイルの存在とblob SHAを直接確認：`app/chat/anonymous-session-guard.tsx`=`b8756ce6...`、`app/chat/conversation-history-sync.tsx`=`3f39da15...`、`app/api/chat-proxy/route.ts`=`d1e9749f...`（わずか294 bytes）、`tests/account-conversation.test.cjs`=`c5f80596...`。古い枝の `chat-proxy` 修正が現在の正本 `app/api/chat/route.ts` に適用されるとは限らず、**旧proxy経路と現行canonical routeを区別**する。匿名のセッション終了/履歴保全/一時rootの有効期限・一回限りimportの安全境界は重要で、旧枝を丸ごとmergeせずテスト資産/再現ケース/思想を照合する。

**状態**：6枝にmain差分あり（ただし古いベース338–365 behind）、2枝は差分なし。今回確認したのは差分の所在とmainファイルの存在であり、修正の機能的等価性・CI・本番適用は未検証。次の精査では匿名アカウントのログイン/ログアウト/履歴保存、期限切れtemporary receipt、想起の根拠保持を現行テストと比較する。main/production/Supabase変更なし。


## 2026-10-21 チャット障害・重複防止・Gemini再試行の8枝（開発経緯の復元）

`main...branch` compare：
- `fix/chat-failure-recovery` ahead3/behind343、`app/api/chat/route.ts`・`app/chat/page.tsx` modified、`20260918081000_refund_failed_chat_usage.sql` added（比較上）。**当該SQLはmainにも存在**（blob `b79b9606...`）。失敗した会話の利用枠返金という意図と、現行正本処理を照合すべき。
- `fix/chat-network-reliability` ahead1/behind356、旧 `app/api/chat-proxy/route.ts` modified。
- `fix/chat-reliability-cleanup` ahead1/behind357、同旧proxy modified。
- `fix/chat-request-diagnostics` ahead1/behind359、同旧proxy modified。
- `fix/chat-turn-dedupe` ahead1/behind344、`20260918014700_prevent_duplicate_chat_turn_sync.sql` added（比較上）。**当該SQLはmainにも存在**（blob `8b3b3aad...`）。重複ターン同期防止という歴史的修正。
- `fix/gemini-chat-timeout` ahead2/behind337、現行 `app/api/chat/route.ts` modified。
- `fix/gemini-json-retry` ahead1/behind363、旧proxy modified。
- `fix/use-chat-proxy` ahead1/behind360、旧proxy modified。

**現行main正本の直接確認**：`app/api/chat/route.ts` は55,132 bytes（blob `5600ad37...`）、`app/api/chat-proxy/route.ts` は294 bytes（blob `d1e9749f...`）で、現在のproxyは `POST` をcanonical `../chat/route` に一度だけ委譲し、コメントで『認証・正本読取・利用枠消費/返金・成功ターン原子的確定はbase側、wrapperで再試行禁止』と明記。旧proxyのネットワーク/JSON retry/診断コードをそのまま戻すと**二重実行や重複課金・二重保存**の危険がある。retryは生成層と副作用の境界を分けて検討。

**開発史としての読み取り（推論、確定事実ではない）**：ネットワーク失敗→診断/再試行→二重同期防止/返金→canonical単一路線、という問題群が見える。個々の枝の作成順・因果はcommit時刻/PR/issueで追加確認が必要。古い枝を『未反映だから戻す』ではなく、**障害再現ケース、返金・冪等性の不変条件、再試行境界**を抽出する。今回の確認は静的ソース/差分で、実稼働の障害再現・CI・production DB適用は未確認。main/production/Supabase変更なし。


## 2026-10-21 Relationship Analyzer・一時診断の8枝（差分ゼロの意味）

GitHub `main...branch` を8件照合。**全8枝 ahead0 / files0**、すなわち現在のmainから見て未取り込みの変更ファイルなし：
- `fix/relationship-analyzer-bounded-retry` behind33
- `sora/relationship-analyzer-stage-diagnostics` behind64
- `sora/relationship-analyzer-structured-output-hotfix` behind79
- `sora/relationship-evidence-validation-diagnostics` behind62
- `sora/relationship-processing-error-diagnostics` behind78
- `sora/remove-relationship-stage-diagnostics` behind57
- `sora/remove-relationship-temporary-diagnostics` behind69
- `work/relationship-analyzer-diagnostics` behind75

mainの関連ソースを直接取得：`lib/relationship-analyzer-v1.ts`（blob `05944b0a...`、6,387 bytes）、`lib/relationship-runtime-v1.ts`（`a5d22997...`、7,805 bytes）、`tests/relationship-engine-v1.test.ts`（`22b568c1...`、35,801 bytes）。単純文字列検査ではanalyzerにretry/evidence、runtimeにlease/evidence、testにlease/evidenceが多数存在。ただし**これだけで各過去枝の変更がそのままmainに残存することや、診断が適切に撤去されたことは証明できない**。歴史的に統合後、さらに修正・撤去された可能性がある。

**重要な分類**：『未反映コードがない』と『過去の目的が今も満たされている』は別。stage/processing/evidence診断の追加と撤去が対になっている履歴を、障害原因・安全な一時観測・機微データのログ露出防止・診断撤去後の監視能力という観点で後日見直す。現時点で具体的な事故や残留ログは断定しない。次の精査候補は各枝のcommit/PR経緯とmain現行ログ/テストの対照。main/production/Supabase変更なし。


## 2026-10-21 履歴トレース・同期・応答待機の8枝

GitHub `main...branch` compareで**8件すべてahead0/files0**、未反映ファイル差分なし：
- `sora/history-edge-trace` behind154
- `sora/history-get-trace` behind156
- `sora/history-sync-source-proof` behind158
- `sora/remove-timestamp-history-poll` behind149
- `sora/sync-free-usage-with-history` behind131
- `sora/remove-false-busy-wait` behind138
- `sora/fix-waiting-reply-layout` behind142
- `sora/gemini-timeout-retry` behind135

mainの現行対象を取得：`app/chat/conversation-history-sync.tsx` blob `3f39da15...`、`app/chat/page.tsx` `2221fcac...`、`app/api/chat/route.ts` `5600ad37...`。履歴取得・同期の証跡確認、timestamp poll除去、無料枠と履歴の整合、偽の待機表示、応答待機レイアウト、Gemini timeoutという問題群を示す**ブランチ名と現行ソースの存在**を確認。ただし個別の不具合の再現・修正内容・mainに残る機能的保証・本番状態は未検証。

**開発史の仮説**：『履歴の出所を追う→同期を正す→無駄なpollを減らす→待機表示と再試行の誤解を減らす』という一連のユーザー体験課題が存在した可能性。実際の順序・因果はcommit履歴で確認するまで断定しない。履歴と利用枠の二重正本化、再試行による二重保存、画面上の偽busy状態を避ける観点で最終再評価。main/production/Supabase変更なし。


## 2026-10-21 初対面からの関係成長・生活事実の根拠づけ8枝

`main...branch` compare：
- `fix/workday-grounding` ahead1/behind342：`app/api/chat/route.ts` modified。仕事日/休み等の事実に基づく発話の修正候補、現在のlife contextと照合前に旧routeを移植しない。
- `fix/grow-relationship-from-first-meeting` ahead4/behind335：chat route、chat/Body Clock fallback persona、`20260918030000_grow_relationship_from_first_meeting.sql`。**SQLはmainにも存在**（blob `aa61e3b1...`）。main `lib/persona/fallback-persona.ts`（blob `f7f68d98...`）を直接読み、**『最初から恋人ではない』『初対面から会話・記憶を重ねる』『交際や昔からの恋愛を根拠なく捏造しない』**という同じ原則が現行fallbackにも明記されていることを確認。これは現行人格設計に受け継がれた重要な意図。DB適用済みかは未確認。
- `sora/profile-aware-life-events` ahead0/behind166、差分なし。
- `sora/drop-ungrounded-relationship-evidence` ahead0/behind59、差分なし。
- `sora/fix-relationship-polarity-transport` ahead0/behind66、差分なし。
- `sora/relationship-control-rpcs-v1` ahead0/behind87、差分なし。
- `sora/canonical-relationship-integration` ahead3/behind175、`docs/IMPLEMENTATION_OVERVIEW.md` modifiedのみ。**main外に設計/引継ぎの文章差分**、実装未反映と同一視しない。
- `sora/cutover-cleanup` ahead0/behind161、差分なし。

main `lib/relationship-life-context.ts`（blob `d20d4f69...`）は `LifeFactKind=profile/schedule/routine/situation/preference/concern`、`source=user|memory`、`observedAt`、`validUntil`、`confidence` などの明示的な型を持つ。**生活の事実を文脈に応じて参照する設計資産**として、仕事日groundingや『寂しさを日数だけで決めない』方針との接続点。現行ルートでの実際の採用・品質は別途要検証。

**開発史の観点**：恋人前提の発話を避ける原則、実在の生活事実に根拠を求める原則、関係性Evidenceの極性と出所を守る原則が、別々の枝から現在の一貫性に収束した可能性。因果・完成度はcommit履歴/テスト照合まで断定しない。main/production/Supabase変更なし。


## 2026-10-21 Body Clock・Safari/PWA・見せ方の7新規枝＋1再確認

GitHub `main...branch` compare：
- `fix/body-clock-claim-rpc` ahead1/behind346、`20260917143500_fix_body_clock_claim_rpc.sql` added（比較上）。**同ファイルはmainに存在**（blob `a7bb0636...`）。現行のsilence/lonelinessルールについては既出の台帳項目を参照。DB適用状況未確認。
- `fix/legacy-safari-cache` ahead2/behind364、`app/chat/anonymous-session-guard.tsx` と `tests/account-conversation.test.cjs` modified。Safariの旧キャッシュと匿名セッションの関係が調査対象だった可能性。現行guardはmainに存在（blob `b8756ce6...`）。
- `fix/safari-load-failed-message` ahead1/behind355、`app/chat/page.tsx` modified。現行pageはmainに存在（blob `2221fcac...`）。
- `fix/safari-load-failed-ui` ahead0/behind355、差分なし。
- `sora/lp-pwa-mobile-layout` ahead0/behind40、差分なし。
- `sora/lp-relationship-story` ahead0/behind45、差分なし。
- `sora/update-overview-relationship-v1-production` ahead0/behind54、差分なし。
- `fix/chat-reliability-cleanup` ahead1/behind357、旧chat-proxy modified。**前回のchat reliability 8枝ですでに記録済み**、重複再確認としてのみ記載。新規棚卸しは7枝。

**区別**：ahead0/files0は『mainに未反映のファイル差分なし』であり、過去の実装が現在も有効・UX問題が解消済みという意味ではない。Safari/PWAでは端末実機・キャッシュ更新・匿名履歴の持続・エラー表示を分けて検証する必要がある。`lp-relationship-story`はユーザーに見せる物語、`grow_relationship_from_first_meeting`は内部人格原則であり、両者の表現一致を将来照合。Body Clockの機械的なlonely化は『寂しさの意味を文脈から考える』方針と要再検討。main/production/Supabase変更なし。


## 2026-10-21 正本照合・会話エンジン共通化・比較テストの7新規枝＋1再確認

`main...branch` compare：
- `docs/audit-overview-against-source` ahead1/behind340：`docs/IMPLEMENTATION_OVERVIEW.md` modified。
- `docs/production-source-of-truth-reconciliation` ahead17/behind1：`docs/HANDOFF_NEXT_SORA_2026-10-14.md` added、`docs/IMPLEMENTATION_OVERVIEW.md` modified、`docs/MULTI_CHARACTER_PHASE0_AUDIT.md` modified、`docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md` added。**重要な未統合の正本照合資料**。このブランチを直接精読し、現在のmain/台帳と矛盾する記述を再確認すること。資料を自動で正本と見なさない。
- `docs/update-implementation-overview` ahead1/behind341：`docs/IMPLEMENTATION_OVERVIEW.md` added（compare上）。
- `docs/update-overview-relationship-growth` ahead1/behind334：同overview modified。
- `experiment/shared-conversation-history-v1-20261015` ahead35/behind0：`lib/conversation-engine/` にattempt/base-prompt/character-context/character-prompt/context-format/history/layered-context/layered-prompt/memory/relationship-context/retry-guides等、会話エンジン分離に関わる多数の新規ファイル。`docs/CONVERSATION_ENGINE_MULTICHARACTER_GAP_AUDIT_20261016.md`等も追加。**将来の複数キャラクター設計と美咲一人の先行実装をつなぐ重点検証候補**。compareにアメふる連携資料・`amahuru-rain-context.ts` もあるが、別プロジェクトのアメふる本体は調査・変更しない。35 commits aheadという数値は品質・採用可否を意味しない。
- `test/relationship-acting-state-comparison` ahead2/behind0：`tests/relationship-acting-state-comparison.test.ts`、`tests/relationship-chat-wiring.test.ts` added。main外の関係性acting比較/配線テスト候補。テストがあるだけでは実行成功や実会話品質は未確認。
- `perf/chat-stage-timing` ahead1/behind336：`app/api/chat/route.ts` modified。旧計測案、現行正本APIへの直接移植は要注意。
- `sora/remove-timestamp-history-poll` ahead0/behind149/files0。前回調査済みのため**重複再確認のみ**。新規7枝。

**設計思想との接続**：ユーザーの最新方針は、Misakiを複数キャラクター基盤とし、まず美咲一人を作り込むこと。ユーザー×キャラの秘密/関係記憶と、キャラ固有の知識・人格成長を分離し、婚姻の同時一人制約をDBで担保する。将来の大改修を防ぐため、識別子・所有権・データ分離・整合性は先に設計する一方、成長ロジックは検証可能に保つ。**これはユーザーとの設計議論であり、既存実装済みの主張ではない**。棚卸し完了後に台帳全体を冒頭から再読して適合性を評価する。

本節は差分の存在と対象ファイルの確認まで。各branch内容・CI・preview・DB適用・本番稼働は未検証。main/production/Supabase/アメふる変更なし。


## 2026-10-21 重点精読：正本照合と共有会話エンジン

`docs/production-source-of-truth-reconciliation` の `docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md` を直接確認。2026-10-13時点の調査記録として、mainのSQL35件と当時のmigration ledger82件、完全一致11件という照合結果を記載。文字列の件数差だけで未適用や障害を断定できない。また、関係時間RPCのUUID引数版は当時の本番に存在した一方、mainのmigration群で作成元を特定できなかったと記録。**今回本番DBを再確認したわけではない**。新規環境の再現性を確認する課題として残す。

`experiment/shared-conversation-history-v1-20261015` の `docs/CONVERSATION_ENGINE_MULTICHARACTER_GAP_AUDIT_20261016.md` と `lib/conversation-engine/character-context.ts`、`history.ts` を精読。前者は実験コードが本番と同等ではないと明記。後者はuserId/characterIdの一致を調べる純粋関数と履歴のフィルタ・直近60件変換であり、DBのアクセス制御や本番ルートの配線を実現したものではない。persona版管理、関係性、記憶の分離、外部情報の鮮度、JSON出力、再試行、課金・保存・冪等性などは移行ゲートとして残る。

**今後の設計判断**：ユーザー×キャラの個別記憶、キャラ単位の知識・成長、婚姻の一意性を分ける。まず美咲一人を作り込むが、将来の複数キャラを前提にID・所有権・権限境界を設計する。以上は方針であり実装済みの認定ではない。main・本番・DB変更なし。
