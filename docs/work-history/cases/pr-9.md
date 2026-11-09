# 記憶回答の矛盾防止と診断コードを整理する

[PR原本](https://github.com/miyazaki1016/misaki/pull/9)

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

記憶回答の矛盾防止と診断コードを整理する

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/9)

## 実際の変更処理（コードから抽出）

HISTORY_DIAGNOSTIC_PREFIX、MAX_MEMORY、PARSE_ERROR_MESSAGE、POST、SUPABASE_PUBLISHABLE_KEY、SUPABASE_URL、accessToken、authorization、baseResponse、body、callBaseChatWithParseRetry、canonicalMemory、createAuthenticatedSupabase、createForwardedRequest、createHistoryDiagnostic、createRecallAwareMessage、diagnosticResponse、firstResponse、history、historyForSync、isAnonymous、isDiagnosticHistoryItem、isMemoryRecallQuestion、matches、messageForModel、misakiMessageAt、nextMemory、normalized、payload、recallMode、recentConversation、relationshipTimeSynced、result、retryParseFailure、returnedMemory、safeBody、sanitizeMemory、supabase、temporaryMemory、term、userMessageAt、validHistory

- 関数・クラス定義：`function isDiagnosticHistoryItem(item: any) {`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/a06baac8110ded425c07e2122117e89460868405/app/api/chat-proxy/route.ts)）
- [app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/a06baac8110ded425c07e2122117e89460868405/app/api/chat-proxy/route.ts)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
PR #8 の実機確認を受けた仕上げです。

- 記憶確認で具体的内容を取得できた場合に「思い出せない」等の矛盾表現を禁止
- 過去の誤答を引き継がず、今回根拠が見つかったら思い出せた状態として回答
- 一時的な `履歴診断:` API を撤去
- 既にブラウザ履歴に残った診断ターンは recall evidence から除外

`Load failed` のクライアント側通信エラー処理と、proxy retry の usage idempotency は別変更として続けます。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/api/chat-proxy/route.ts

```text
diff --git a/app/api/chat-proxy/route.ts b/app/api/chat-proxy/route.ts
index 2edb037..87fd79d 100644
--- a/app/api/chat-proxy/route.ts
+++ b/app/api/chat-proxy/route.ts
@@ -53,6 +53,14 @@ function isMemoryRecallQuestion(message: unknown) {
   ].some((pattern) => normalized.includes(pattern));
 }
 
+function isDiagnosticHistoryItem(item: any) {
+  return (
+    typeof item?.text === "string" &&
+    (item.text.startsWith(HISTORY_DIAGNOSTIC_PREFIX) ||
+      item.text.startsWith("診断結果：history="))
+  );
+}
+
 function createRecallAwareMessage(
   message: unknown,
   history: unknown,
@@ -66,7 +74,8 @@ function createRecallAwareMessage(
           (item: any) =>
             item &&
             (item.role === "user" || item.role === "misaki") &&
-            typeof item.text === "string"
+            typeof item.text === "string" &&
+            !isDiagnosticHistoryItem(item)
         )
         .slice(-20)
         .map(
@@ -76,7 +85,7 @@ function createRecallAwareMessage(
         .join("\n")
     : "";
 
-  return `${message}\n\n【記憶確認の回答根拠】\n以下は、この質問より前に実際に交わした直近の会話です。これは参考例ではなく事実の会話履歴です。\n質問された話題と関係する発言がこの中にある場合、その具体的内容を使って自然に答えてください。\n「覚えていない」「ヒントをちょうだい」と答える前に、必ずこの履歴を確認してください。\n履歴に根拠があることを知らないふりしないでください。\n履歴にも長期記憶にも根拠がない場合だけ、知らないことを作らずに答えてください。\n\n${recentConversation || "直近の会話履歴なし"}`;
+  return `${message}\n\n【記憶確認の回答根拠】\n以下は、この質問より前に実際に交わした直近の会話です。これは参考例ではなく事実の会話履歴です。\n質問された話題と関係する発言がこの中にある場合、その具体的内容を使って自然に答えてください。\n履歴から具体的内容を答えられる場合、それは美咲が思い出せている状態です。「覚えていない」「思い出せない」「まだ何も思い出せていない」「ヒントをちょうだい」など、回答内容と矛盾する表現を絶対に続けないでください。\n過去の美咲の発言に「覚えていない」「思い出せない」があっても、今回の履歴に根拠が見つかったなら、その古い誤答を引き継がず、今は思い出せたものとして自然に答えてください。\n履歴にも長期記憶にも根拠がない場合だけ、知らないことを作らずに答えてください。\n\n${recentConversation || "直近の会話履歴なし"}`;
 }
 
 function createForwardedRequest(request: Request, body: unknown) {
@@ -87,31 +96,6 @@ function createForwardedRequest(request: Request, body: unknown) {
   });
 }
 
-function createHistoryDiagnostic(body: any) {
-  if (typeof body?.message !== "string") return null;
-  if (!body.message.startsWith(HISTORY_DIAGNOSTIC_PREFIX)) return null;
-
-  const term = body.message.slice(HISTORY_DIAGNOSTIC_PREFIX.length).trim();
-  const history = Array.isArray(body?.history) ? body.history : [];
-  const validHistory = history.filter(
-    (item: any) =>
-      item &&
-      (item.role === "user" || item.role === "misaki") &&
-      typeof item.text === "string"
-  );
-  const matches = term
-    ? validHistory.filter((item: any) => item.text.includes(term)).length
-    : 0;
-
-  return Response.json({
-    reply: `診断結果：history=${validHistory.length}件 / 「${term || "未指定"}」を含む履歴=${matches}件`,
-    memory: sanitizeMemory(body?.memory),
-    memorySynced: false,
-    relationshipTimeSynced: false,
-    diagnostic: true,
-  });
-}
-
 async function callBaseChatWithParseRetry(request: Request, body: unknown) {
   const firstResponse = await baseChatPost(createForwardedRequest(request, body));
   if (firstResponse.ok || firstResponse.status !== 500) return firstResponse;
@@ -154,9 +138,6 @@ export async function POST(request: Request) {
       );
     }
 
-    const diagnosticResponse = createHistoryDiagnostic(body);
-    if (diagnosticResponse) return diagnosticResponse;
-
     const isAnonymous = userData.user.is_anonymous === true;
     const recallMode = isMemoryRecallQuestion(body?.message);
     const messageForModel = createRecallAwareMessage(

```

