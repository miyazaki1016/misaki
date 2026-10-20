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
