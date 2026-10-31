# 旧会話計測実験の機能単位調査（2026-11-01）

対象: `work/conversation-context-compression-spike` と `experiment/chat-input-metrics-offline-20261022`。実際の旧ソースを読み、mainの同一パス存在を確認した。

- `lib/context-size-measurement.ts`: `measureContextSize` は文字数ベースの診断。ソースに「token countingではない」と明記。トークン削減の実測根拠として使わない。
- `lib/conversation-engine/chat-input-metrics.ts`: `measureRenderedChatSections` はセクション別の入力計測。ソースに「日本語文字数・バイト数からtokenを推定しない」「本番promptの同等性を主張しない」旨がある。
- mainに上記2ファイルと `lib/context-overlap-analysis.ts`、`lib/conversation-engine/chat-external-relevance.ts` の同一パスはない。ただし別実装の有無は未確認。

**採否**: 旧計測の「文字数」と「トークン数」を混同しない。旧コードの一括mergeをせず、現行の実際のプロンプト組み立て経路と比較して必要な測定器だけを別PRで検討する。関係性SQL migrationも同様に保留。

実装・DB・公開・デプロイ変更なし。