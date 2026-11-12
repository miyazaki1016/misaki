# 会話入力計測と現行chat経路の静的照合（2026-11-01）

- main `app/api/chat/route.ts` は `measureStage` による処理段階の計測と `createGeminiTelemetrySink("normal_reply", ...)` によるGemini利用状況の計測を呼び出す。
- 旧 `work/conversation-context-compression-spike:lib/context-size-measurement.ts` の `measureContextSize` は文字数診断でありtoken数の計測ではない。
- 旧 `experiment/chat-input-metrics-offline-20261022:lib/conversation-engine/chat-input-metrics.ts` はセクション単位の入力構造診断で、実本番promptとの同等性を主張しない。
- mainのchat routeに処理段階・利用状況の計測が存在するため、旧計測ツールの同一ファイルがないことだけで「計測未実装」とは判断しない。

**判断**: 性能計測（処理時間）、API利用量、入力セクション構造は別の指標。旧実験を一括mergeせず、現行Gemini telemetryが記録する実際の入力tokenとセクション別構造の比較可能性を次に検証する。現在の本番品質やコスト削減率はこの調査からは算出しない。

本番コード・DB・公開変更なし。
