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
