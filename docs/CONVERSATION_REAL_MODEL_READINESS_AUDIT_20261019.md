# 2026-10-19 実モデル会話評価の実行前監査・停止ゲート

状態：**静的ソース監査のみ。実Gemini未実施。オーナー承認待ち。**
対象：main の `app/api/acting-lab/route.ts`、`lib/gemini-json-generator.ts`、`lib/relationship-acting-guide.ts`、Draft PR #86 のオフライン評価器。

## 結論
PR #86 の18ケースのオフライン試験・レビュー記録・比較ゲートは構造検証用として利用できる。しかし、現行 `/api/acting-lab` をそのまま「本番の美咲の会話品質が分かる検証口」として使うのは不適切。**現行経路を呼び出さない**。

## 実ソースで確認した重要な差分・懸念
1. `/api/acting-lab` は production だけ404、それ以外は `GEMINI_API_KEY` があれば生成を許可する。**API route自身には認証・明示的なテスト許可・予算上限・呼出回数制限が確認できない**。Preview側のVercel保護は別設定であり、このコードだけでは安全を保証できない。
2. `profiles` 未指定時は A〜E すべてを対象に Promise.all で並列生成する。つまり**1 HTTP POSTが5モデル生成呼出し**になり得る。生成器は429/502/503/504時に最大2回、タイムアウト時に最大1回再試行する。外部実行の予算上限・物理リクエスト上限が必要。
3. `contents: []` と単一 `userText` を使う**単発の演技オーディション**。ユーザーの蓄積した会話履歴・User Memory/Shared Memory・canonical Relationship State・Body Clock等は取得しない。**多往復会話・思い出・Free/Premium・通常の本番美咲の品質は測定できない**。
4. `createFallbackPersonaPrompt("chat")` と演技ガイドを直接組み立てており、実本番 `/api/chat` が生成する完全な人格・記憶・生活・会話コンテキストと同一とは確認できない。
5. `ACTING_LAB_PROFILES` の A〜E は実験用の数値例で、交際成立のcanonical状態を自動変更しない。恋人歴1年・仲直り・失恋/復縁等の比較用固定fixturesは別途必要。
6. APIが返す `model` は固定文字列。`generateGeminiJson` のコード上のモデルも `gemini-3.1-flash-lite`。実モデルを呼び出したことやプロンプト版・利用量・結果真正性の監査証明にはならない。

## 実会話評価に進む最小ルート（別作業・要承認）
1. **まずオーナーから実課金呼出し・上限回数/金額・利用する隔離環境の承認を取得**。承認までモデルAPIを呼ばない。
2. Productionとは隔離したPreview/ローカル環境に**認証、IP/セッション単位の回数上限、総予算上限、失敗時停止、再試行込みの物理呼出し上限**を用意。環境変数 `GEMINI_API_KEY` の存在だけを実行許可としない。
3. まず1シナリオの2ターンを、固定persona・関係・記憶・時刻・外部情報で実行。**本番canonical DBへ書かない**。モデル版・プロンプト版・有効入力構成と物理生成試行数を記録する。
4. 同じ入力で比較を行い、PR #86の `recorded-reply-import` → `quality-review-packet` → 人手判定 → `quality-reviewed-comparison` に流す。人手の期待・禁止項目を全件評価し、出所の自己申告と実証ログを区別する。
5. ゲート通過後に複数ケースへ拡大する。実行不能ならキー・費用・環境・同意の不足理由を明示して停止。**合成fixtureを実機成果にすり替えない**。

## 承認不要で可能な次作業
- 既存テストのCI確認、ソースの監査、固定fixtureの妥当性レビュー、不要な擬似指標の除去。
- 将来の実行経路の安全設計とコード差分はDraft PRで提案可能だが、Previewで課金を発生させる実動作は承認まで実施しない。

**今回の実行結果**：前回コミット `9a24cff` のPRテストCIは success。今回の監査は読み取りと文書追加のみ。Mainへのmerge、DB変更、Production deploy、Gemini呼出しなし。

## 2026-10-19 承認後の隔離Smokeアダプター（PR #86、まだ実呼出しなし）

- `lib/conversation-lab/live-smoke-probe.ts`: Q02「過去の約束を覚えている？」だけを使用する2往復の最小実験。**APIキー注入と `approved: true` の両方がないと呼出し拒否**。ユーザー記憶は空、人物は合成fixture。
- 物理API呼び出しは**1 runあたり最大2回**。再試行なし、15秒で中断、出力最大300 tokens、50 KB超応答拒否、ログ保存なし。失敗runはcomplete扱いにせず、不一致・空返答を正常として扱わない。
- これはfallback personaを使う**研究用Smoke**。本番の全プロンプトや記憶・生活エンジン、Relationship Engineの同等性を示さない。
- `tests/conversation-lab-live-smoke-probe.test.ts` はfetchをmockし、ゼロ回認可、2回上限、履歴転送、429/不正JSONで再試行しないことを検証する。CIで実APIキーは渡さず、課金発生なし。
- **次の実Gemini実行は未実施**。接続済み実行環境のAPIキーをこの会話から安全に使えることが確認できず、勝手なPreview公開・本番トークンの取得や実験デプロイはしない。運用上の総金額予算上限や呼出履歴の可視化はAPI/Google側の設定との照合が必要。試行数上限は費用の絶対上限そのものではない。
- 利用者に見せる前にGitHub Actionsの新コードテスト結果を確認し、セキュリティ境界・実行許可・費用上限を再確認する。Main/本番/DBに触れない。

## 2026-10-19 Follow-up: Preview readiness check and preflight fix

- GitHub Actions for `4918ec7` was successful; the connected Vercel project `misaki` had a READY Preview deployment for that commit. A READY Preview is a deployment/build result, **not** confirmation that the experimental adapter was executed.
- `GEMINI_API_KEY` exists as a sensitive Vercel environment-variable name for Preview, but this audit did **not** decrypt or reveal its value. Availability in Preview does not authorize arbitrary public requests.
- The 2-call adapter currently is a **library function, with no safe protected one-shot invocation endpoint**. Therefore no real Gemini inference has been triggered; the owner approval allows proceeding once a protected, auditable single-run execution path exists and an enforceable total spending policy is known.
- Fix applied: validate capture manifest, model identity, empty-memory and unknown-relationship fixtures **before** any potential billable request. Previously malformed metadata could be discovered only after 2 requests. New tests ensure invalid inputs result in zero network requests.
- Do not invoke the older `/api/acting-lab`: it lacks the intended identity, budget and long-conversation constraints. Do not build a publicly callable endpoint merely to access the key.


## 2026-10-19 追補：CLI専用ワンショット入口

- `scripts/run-conversation-smoke.ts` を実験ブランチに新設。**公開Web APIではなく、承認済みオペレーターが隔離環境の秘密鍵を継承して一度だけ起動する**コマンド。プロジェクト固有 `GEMINI_API_KEY` の値をログや引数に書かない。
- コマンドは `--approved-small-test` と `MISAKI_LIVE_SMOKE_APPROVED=yes` の両方を必須にする。内部ではQ02合成ユーザーの2往復、最大2回、retryなし、入力固定。未評価の返答シートを標準出力へ出す。stdoutの保存・取り扱いはオペレーターが保護すること。
- **実施には**秘密鍵を安全に注入できる認可済みローカル/保護実行環境と予算上限確認が必要。現在のChatGPT実行環境には認証済みのVercel CLIも環境変数シークレットもない。VercelのプレビューはREADYだが、サーバーの環境変数をこのCLIが自動で引き継ぐわけではない。
- この入口も本番の美咲と完全に同じコンテキストにはならない。成功してもFallback PersonaでのQ02試験の結果であり、実データの長期記憶/Relationship Engine/Body Clockは評価しない。
- 本追補時点で、Gemini呼出しは**まだ0回**。CLI作成は実測ではない。

## 実行手順の正本（2026-10-19）

認証済み開発者によるワンショットCLI手順は `docs/CONVERSATION_SMOKE_OPERATOR_RUNBOOK_20261019.md` に固定。PR #86実験branchの `scripts/run-conversation-smoke.ts` を呼ぶ。Vercel CLIは`env run`をサポートするがSecret/Sensitive値を必ずCLIへ提供できる保証はないため、**正規のキーが利用不可なら0回で中止**。この会話内で秘密鍵を復号・転記しない。実Geminiの返信は未取得。成果判定はCI/Preview READYではなくraw応答と人手レビューの実測を待つ。

## 2026-10-19 iPhone版の入口（非課金・手入力）

- `app/conversation-review/page.tsx` 追加。iPhoneのSafariでQ02（2往復）を表示し、後で取得した実Gemini返信を貼り付け、4観点を人が評価し、内容をクリップボードへコピーできる。
- **ページ単体ではGeminiを呼び出さない**。バックエンドへの送信、DB保存、課金、実モデル起動は一切行わない。チャット欄の空欄は未取得と表示し、模擬返信を実測と偽らない。
- 公開の課金APIには繋がない。自動生成ボタンには引き続きオーナー認証、耐久的で全体を通じた呼び出し上限、費用管理が必要。Preview保護と単一ブラウザーのdisabledボタンでは乱用防止にならない。
- この画面は評価対象を実際に見せる準備であり、『iPhoneから実Geminiテストを実行できた』という成果ではない。


## 2026-10-19 iPhone生成ルートの実装（**無効化状態**）

- `app/api/conversation-review/smoke/route.ts` にPreview専用・Supabaseアクセストークン検証・オーナーUID照合・DB原子的claimを要求するPOST経路を追加。**公開URLを知っているだけでは生成不可**。Productionは404。
- `MISAKI_SMOKE_ENABLED=yes` と `MISAKI_SMOKE_ISOLATED_DB_CONFIRMED=yes` が両方ない限り404。認証情報、service-roleキー、Geminiキー、DB claim RPCが一つでも不足すると**Geminiを呼ばず停止**。
- `docs/sql/DRAFT_PREVIEW_ONLY_SMOKE_CLAIM_20261019.sql` はPreview隔離DB向けの**未適用ドラフト**。専用DBでレビュー・適用するまでは利用不可。本番DBへの適用は禁止。claimは生涯1件だけ成功し、Gemini失敗時も払い戻さない。
- 認証済みiPhone画面からの実行ボタンは**まだ有効化していない**。実行条件が揃っていない段階で「押せば生成できる」と見せないため。iPhone画面は引き続き手入力レビューのみ。
- 注意：routeの回数制限は「run1回・物理最大2回」だが**課金額の絶対上限ではない**。Google側の課金監視・隔離DB・オーナーUID・Vercel環境設定の実地検証が必要。Secret値をチャットやGitHubへ出さない。
- 今回はDraft PR #86 branchへのコード・SQL案のみ。**実Gemini 0回、SQL適用0回、Main/Production変更なし**。CIとPreview buildは新commitについて別途確認する。

## 2026-10-19 iPhone UI接続

- `app/conversation-review/page.tsx` で研究用ボタンを実装。タップ後に利用者確認を出し、SupabaseセッションのBearer tokenで `/api/conversation-review/smoke` を呼ぶ。成功時だけQ02の2返信を評価欄へ反映。404/403/429/失敗をユーザーに区別して説明。
- ただしサーバーの二重オプトイン環境変数は未設定のままで、隔離DBのSQLも未適用。**現時点ではボタンを押してもGemini実行はできない**。本番DB/Productionには変更なし。
- 既存チャットのSupabaseセッションとPreviewの認証プロジェクトが同一であるか未検証。専用Preview DB/認証への分離と本人UIDを先に確認すること。隔離環境を検証するまで実験を有効化しない。

## 2026-10-19 夜 安全性レビュー／DB分離修正

- 本番Supabase `tzozajnwznxqgxnjikoy` 以外に、Misaki専用の隔離Preview Supabaseプロジェクトは現時点で存在しない（プロジェクト一覧を照合）。EmergencyAlertのDBは他アプリなので流用禁止。
- Vercel既存環境は `SUPABASE_SERVICE_ROLE_KEY` がProduction/Preview共有。**これを実験のclaim先に使う設計は危険**なので、実装を修正した。
- 本人確認は現在の美咲アプリと同じSupabase Authで行い、実験回数の記録は新しい別Supabaseプロジェクトに限定。
- 新規専用環境変数 `MISAKI_SMOKE_QUOTA_SUPABASE_URL`, `MISAKI_SMOKE_QUOTA_SERVICE_ROLE_KEY`, `MISAKI_SMOKE_QUOTA_PROJECT_REF` が必要。接続先のURLとref一致・本番ref不一致をコードで検査し、未設定・本番宛は生成前に停止。公開鍵は現行アプリと同じ固定publishableキー。
- 2026-10-19 時点で実験用環境変数・隔離DBは未設定。既存Previewはビルド完了し、CI通過。新しい修正コミットのCIは別途確認。
- **ユーザーの追加課金／プロジェクト作成が必要になり得るため、新規Supabaseプロジェクトは未作成。** 現状は安全優先で生成OFF。
