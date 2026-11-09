# GeminiのJSON解析失敗時に会話生成を自動再試行する

[PR原本](https://github.com/miyazaki1016/misaki/pull/3)

**目的：** 会話や記憶・関係性を扱う処理の変更

**実装状態：** 変更差分を取得。実装の受入完了は未認定

**検証の扱い：** Actionsの成否は実行単位の事実。製品の受入検証とは別

**PR状態：** merged

**main統合：** mainに祖先コミットとして存在（機能受入・本番は別）

**本番反映：** 未確認（main統合／Vercelプレビューから推定しない）

**残課題：** 受入条件・未解決事項をPR本文、レビュー、台帳と照合

**次の作業：** 類似コード・既存結論を確認し、未解決条件だけを次の作業にする

根拠取得日時 (UTC)：2026-11-09T09:02:40.107460+00:00

## 日本語で確認した成果

GeminiのJSON解析失敗時に会話生成を自動再試行する

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/3)

## 実際の変更処理（コードから抽出）

MAX_MEMORY、PARSE_ERROR_MESSAGE、POST、SUPABASE_PUBLISHABLE_KEY、SUPABASE_URL、accessToken、authorization、baseResponse、body、callBaseChatWithParseRetry、canonicalMemory、createAuthenticatedSupabase、createForwardedRequest、firstResponse、forwarded、historyForSync、isAnonymous、isMemoryRecallQuestion、misakiMessageAt、nextMemory、normalized、payload、recallMode、relationshipTimeSynced、result、retryParseFailure、returnedMemory、safeBody、sanitizeMemory、supabase、temporaryMemory、userMessageAt

- 条件分岐・閾値：`const PARSE_ERROR_MESSAGE =`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/f93a9444565ce1029cd46c0d466456f651ee7c9e/app/api/chat-proxy/route.ts)）
- 関数・クラス定義：`function createForwardedRequest(request: Request, body: unknown) {`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/f93a9444565ce1029cd46c0d466456f651ee7c9e/app/api/chat-proxy/route.ts)）
- 関数・クラス定義：`async function callBaseChatWithParseRetry(request: Request, body: unknown) {`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/f93a9444565ce1029cd46c0d466456f651ee7c9e/app/api/chat-proxy/route.ts)）
- 条件分岐・閾値：`if (firstResponse.ok &#124;&#124; firstResponse.status !== 500) return firstResponse;`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/f93a9444565ce1029cd46c0d466456f651ee7c9e/app/api/chat-proxy/route.ts)）
- 条件分岐・閾値：`if (!retryParseFailure) return firstResponse;`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/f93a9444565ce1029cd46c0d466456f651ee7c9e/app/api/chat-proxy/route.ts)）
- [app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/f93a9444565ce1029cd46c0d466456f651ee7c9e/app/api/chat-proxy/route.ts)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
実機Safariで、通常の会話内容にもかかわらず `/api/chat` が「美咲の返事をうまく読み取れなかったみたい。」を返すケースが再現しました。

このPRでは `chat-proxy` 側で、その特定の500エラーだけを検出して同じ会話リクエストを1回だけ再試行します。

- 他の500/4xxは再試行しない
- 匿名・保存済みアカウントの両方に適用
- 再試行時も同じbody/request idを使うため、既存の日次利用カウントの冪等性を維持
- 再試行発生時はサーバーログに記録
- 2回目も解析失敗なら従来どおりエラーを返す

本番mainは直接変更せず、Vercel Preview確認後にマージします。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/api/chat-proxy/route.ts

```text
diff --git a/app/api/chat-proxy/route.ts b/app/api/chat-proxy/route.ts
index d3dfe70..62c6b14 100644
--- a/app/api/chat-proxy/route.ts
+++ b/app/api/chat-proxy/route.ts
@@ -6,6 +6,8 @@ const SUPABASE_URL = "https://tzozajnwznxqgxnjikoy.supabase.co";
 const SUPABASE_PUBLISHABLE_KEY =
   "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";
 const MAX_MEMORY = 30;
+const PARSE_ERROR_MESSAGE =
+  "美咲の返事をうまく読み取れなかったみたい。もう一度話しかけてね。";
 
 function createAuthenticatedSupabase(accessToken: string) {
   return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
@@ -50,6 +52,32 @@ function isMemoryRecallQuestion(message: unknown) {
   ].some((pattern) => normalized.includes(pattern));
 }
 
+function createForwardedRequest(request: Request, body: unknown) {
+  return new Request(request.url, {
+    method: "POST",
+    headers: request.headers,
+    body: JSON.stringify(body),
+  });
+}
+
+async function callBaseChatWithParseRetry(request: Request, body: unknown) {
+  const firstResponse = await baseChatPost(createForwardedRequest(request, body));
+  if (firstResponse.ok || firstResponse.status !== 500) return firstResponse;
+
+  let retryParseFailure = false;
+  try {
+    const payload = await firstResponse.clone().json();
+    retryParseFailure = payload?.error === PARSE_ERROR_MESSAGE;
+  } catch {
+    return firstResponse;
+  }
+
+  if (!retryParseFailure) return firstResponse;
+
+  console.warn("CHAT JSON PARSE ERROR: retrying Gemini response once");
+  return baseChatPost(createForwardedRequest(request, body));
+}
+
 export async function POST(request: Request) {
   try {
     const body = await request.json();
@@ -87,13 +115,7 @@ export async function POST(request: Request) {
         ...(recallMode ? { history: [] } : {}),
       };
 
-      const forwarded = new Request(request.url, {
-        method: "POST",
-        headers: request.headers,
-        body: JSON.stringify(safeBody),
-      });
-
-      const baseResponse = await baseChatPost(forwarded);
+      const baseResponse = await callBaseChatWithParseRetry(request, safeBody);
       if (!baseResponse.ok) return baseResponse;
 
       const result = await baseResponse.json();
@@ -131,13 +153,7 @@ export async function POST(request: Request) {
     };
 
     const userMessageAt = new Date();
-    const forwarded = new Request(request.url, {
-      method: "POST",
-      headers: request.headers,
-      body: JSON.stringify(safeBody),
-    });
-
-    const baseResponse = await baseChatPost(forwarded);
+    const baseResponse = await callBaseChatWithParseRetry(request, safeBody);
     if (!baseResponse.ok) return baseResponse;
 
     const result = await baseResponse.json();

```

