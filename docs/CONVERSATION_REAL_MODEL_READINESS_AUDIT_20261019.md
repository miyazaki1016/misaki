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
