# 通常会話・入力計測器：ローカルテスト報告（2026-10-22）

## 実施内容

GitHub実験枝 `experiment/chat-input-metrics-offline-20261022` に保管された `lib/conversation-engine/chat-input-metrics.ts` と `tests/chat-input-metrics-offline.test.ts` を読み取り、**同等の関数と6テストをローカルの一時ディレクトリ `/tmp/misaki-offline/` に再構成**して Node.js v22.16.0 で実行した。

コマンド: `node --test --experimental-strip-types tests/chat-input-metrics-offline.test.ts`

**結果：6 test / 6 pass / 0 fail**。対象は以下の6シナリオ。
1. 日本語の節文字数・バイト数と`modelInputTokens:null`
2. 不要な天気情報を合計から除外、除外理由保持
3. 会話履歴と直近美咲発言に同一sourceKeyがある場合の検出
4. 非選択節のsourceKeyを重複計算しない
5. 絵文字におけるUTF-16 / Unicode / UTF-8の相違
6. 節名重複の例外

## 検証の範囲と限界（重要）

- **GitHubの実際のcheckoutを実行したわけではない。** 接続先コードを確認し、その同等ロジック／assertをローカル再構成して実行した。したがって「GitHubブランチ自身のCIが成功した」「ブランチの全test suiteがPASS」「mainとの互換が確認できた」とは書かない。
- TypeScript全体の型チェック、production prompt builderからの実入力節抽出、実Gemini token計測、コスト削減率、V0 byte-parity、モデル品質比較は未実施。
- この計測器は**既にレンダリングされた合成文字列の長さ**だけを数える。モデルの実トークン数・請求金額を推定していない。
- ローカルテストの中ではGemini・Supabase・本番Misaki・ユーザーデータ・本番通知にアクセスしていない。テスト実行のための課金API呼出しもない。

## 次の工程

1. 実験ブランチの**実際のGit checkout/CI**で同一テストを実行し、ファイルの一致と型検査を行う。
2. 現行mainの`app/api/chat/route.ts`の`baseSystemPrompt`を実節に分解する読み取り専用の合成rendererを作る。ただし通常会話のV0 prompt-parityをまず維持。
3. 「ただいま／天気／羽田／電車／天気比較」のC01–C05合成fixtureで、節の使用/除外だけを比較する。モデル呼出しなし。
4. 自発メッセージの改修・Free/Premium決定は引き続き別作業。本番/DBには触れない。

前提設計: 監査専用ブランチの資料80・81。legacy BLOCKED、Forget独立16試験NOT_RUNは未解消。
