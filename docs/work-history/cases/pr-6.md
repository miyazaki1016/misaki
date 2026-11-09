# 記憶確認では直近の会話履歴を明示的に参照する

[PR原本](https://github.com/miyazaki1016/misaki/pull/6)

**目的：** 会話や記憶・関係性を扱う処理の変更／開発資産の把握・引継ぎ・レビューを支援する変更

**実装状態：** 変更差分を取得。実装の受入完了は未認定

**検証の扱い：** Actionsの成否は実行単位の事実。製品の受入検証とは別

**PR状態：** merged

**main統合：** mainに祖先コミットとして存在（機能受入・本番は別）

**本番反映：** 未確認（main統合／Vercelプレビューから推定しない）

**残課題：** 受入条件・未解決事項をPR本文、レビュー、台帳と照合

**次の作業：** 類似コード・既存結論を確認し、未解決条件だけを次の作業にする

根拠取得日時 (UTC)：2026-11-09T08:56:52.743400+00:00

## 日本語で確認した成果

記憶確認では直近の会話履歴を明示的に参照する

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/6)

## 実際の変更処理（コードから抽出）

MAX_MEMORY、PARSE_ERROR_MESSAGE、POST、SUPABASE_PUBLISHABLE_KEY、SUPABASE_URL、accessToken、authorization、baseResponse、body、callBaseChatWithParseRetry、canonicalMemory、createAuthenticatedSupabase、createForwardedRequest、createRecallAwareMessage、firstResponse、historyForSync、isAnonymous、isMemoryRecallQuestion、messageForModel、misakiMessageAt、nextMemory、normalized、payload、recallMode、relationshipTimeSynced、result、retryParseFailure、returnedMemory、safeBody、sanitizeMemory、supabase、temporaryMemory、userMessageAt

- 関数・クラス定義：`function createRecallAwareMessage(message: unknown, recallMode: boolean) {`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/29d74e3483d4f06f5127364d7c5bdf528826301b/app/api/chat-proxy/route.ts)）
- 条件分岐・閾値：`if (!recallMode &#124;&#124; typeof message !== &quot;string&quot;) return message;`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/29d74e3483d4f06f5127364d7c5bdf528826301b/app/api/chat-proxy/route.ts)）
- [app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/29d74e3483d4f06f5127364d7c5bdf528826301b/app/api/chat-proxy/route.ts)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
実機で「前世の話覚えてる？」に対して、画面上に直前の会話が残っているにもかかわらず美咲が拾わないケースがありました。

調査の結果、通常の `/api/chat` は既存 middleware により `/api/chat-proxy` へ rewrite されており、PR #5 の履歴保持自体は本番経路に入っていました。そこで recall 系の質問では、履歴を保持するだけでなく、Geminiへ渡す今回メッセージに「直近の会話履歴を必ず確認し、答えがあれば最優先で使う」という限定的なガイドを追加します。

- 表示上のユーザーメッセージやサーバーへ同期する履歴は元の文面のまま
- recall 以外の通常会話は変更なし
- 長期memoryの正本運用と、recall時にmemoryを書き換えない既存仕様は維持
- JSON解析失敗時の再試行も既存proxy経路のまま維持
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/api/chat-proxy/route.ts

```text
diff --git a/app/api/chat-proxy/route.ts b/app/api/chat-proxy/route.ts
index 09a6358..083c551 100644
--- a/app/api/chat-proxy/route.ts
+++ b/app/api/chat-proxy/route.ts
@@ -52,6 +52,12 @@ function isMemoryRecallQuestion(message: unknown) {
   ].some((pattern) => normalized.includes(pattern));
 }
 
+function createRecallAwareMessage(message: unknown, recallMode: boolean) {
+  if (!recallMode || typeof message !== "string") return message;
+
+  return `${message}\n\n【会話履歴の確認】\n回答する前に、渡されている直近の会話履歴を必ず確認してください。\n質問の答えが直近の会話履歴にある場合は、その内容を最優先で使って自然に答えてください。\n直近の会話履歴になければ長期記憶を確認し、どちらにも根拠がなければ知らないことを作らずに答えてください。`;
+}
+
 function createForwardedRequest(request: Request, body: unknown) {
   return new Request(request.url, {
     method: "POST",
@@ -104,6 +110,7 @@ export async function POST(request: Request) {
 
     const isAnonymous = userData.user.is_anonymous === true;
     const recallMode = isMemoryRecallQuestion(body?.message);
+    const messageForModel = createRecallAwareMessage(body?.message, recallMode);
 
     // 匿名利用ではSupabaseを会話・記憶・関係時間の保存先にしない。
     // ブラウザから届いた一時記憶と直近の会話履歴を、そのブラウザセッション中の回答に使う。
@@ -111,6 +118,7 @@ export async function POST(request: Request) {
       const temporaryMemory = sanitizeMemory(body?.memory);
       const safeBody = {
         ...body,
+        message: messageForModel,
         memory: temporaryMemory,
       };
 
@@ -148,6 +156,7 @@ export async function POST(request: Request) {
     const canonicalMemory = sanitizeMemory(state?.memory);
     const safeBody = {
       ...body,
+      message: messageForModel,
       memory: canonicalMemory,
     };
 

```

