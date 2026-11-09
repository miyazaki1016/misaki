# 記憶確認時に直近会話を回答根拠として再提示する

[PR原本](https://github.com/miyazaki1016/misaki/pull/8)

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

記憶確認時に直近会話を回答根拠として再提示する

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/8)

## 実際の変更処理（コードから抽出）

HISTORY_DIAGNOSTIC_PREFIX、MAX_MEMORY、PARSE_ERROR_MESSAGE、POST、SUPABASE_PUBLISHABLE_KEY、SUPABASE_URL、accessToken、authorization、baseResponse、body、callBaseChatWithParseRetry、canonicalMemory、createAuthenticatedSupabase、createForwardedRequest、createHistoryDiagnostic、createRecallAwareMessage、diagnosticResponse、firstResponse、history、historyForSync、isAnonymous、isMemoryRecallQuestion、matches、messageForModel、misakiMessageAt、nextMemory、normalized、payload、recallMode、recentConversation、relationshipTimeSynced、result、retryParseFailure、returnedMemory、safeBody、sanitizeMemory、supabase、temporaryMemory、term、userMessageAt、validHistory

- 関数・クラス定義：`function createRecallAwareMessage(`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/475410541b700562e0f535484cb3fd02d9f76b1a/app/api/chat-proxy/route.ts)）
- [app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/475410541b700562e0f535484cb3fd02d9f76b1a/app/api/chat-proxy/route.ts)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
実機診断で、SafariからAPIまで直近historyが14件届き、「恋人同士」を含む元会話も2件含まれていることを確認できました。そこで「覚えてる？」系の質問時だけ、直近の実会話を回答根拠として現在メッセージ内にも明示的に再提示し、履歴に根拠がある場合に「覚えていない」「ヒントをちょうだい」と誤答しにくくします。通常会話の経路は変更しません。診断経路は実機確認完了まで残します。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/api/chat-proxy/route.ts

```text
diff --git a/app/api/chat-proxy/route.ts b/app/api/chat-proxy/route.ts
index efb7e40..2edb037 100644
--- a/app/api/chat-proxy/route.ts
+++ b/app/api/chat-proxy/route.ts
@@ -53,10 +53,30 @@ function isMemoryRecallQuestion(message: unknown) {
   ].some((pattern) => normalized.includes(pattern));
 }
 
-function createRecallAwareMessage(message: unknown, recallMode: boolean) {
+function createRecallAwareMessage(
+  message: unknown,
+  history: unknown,
+  recallMode: boolean
+) {
   if (!recallMode || typeof message !== "string") return message;
 
-  return `${message}\n\n【会話履歴の確認】\n回答する前に、渡されている直近の会話履歴を必ず確認してください。\n質問の答えが直近の会話履歴にある場合は、その内容を最優先で使って自然に答えてください。\n直近の会話履歴になければ長期記憶を確認し、どちらにも根拠がなければ知らないことを作らずに答えてください。`;
+  const recentConversation = Array.isArray(history)
+    ? history
+        .filter(
+          (item: any) =>
+            item &&
+            (item.role === "user" || item.role === "misaki") &&
+            typeof item.text === "string"
+        )
+        .slice(-20)
+        .map(
+          (item: any) =>
+            `${item.role === "user" ? "ユーザー" : "美咲"}: ${item.text}`
+        )
+        .join("\n")
+    : "";
+
+  return `${message}\n\n【記憶確認の回答根拠】\n以下は、この質問より前に実際に交わした直近の会話です。これは参考例ではなく事実の会話履歴です。\n質問された話題と関係する発言がこの中にある場合、その具体的内容を使って自然に答えてください。\n「覚えていない」「ヒントをちょうだい」と答える前に、必ずこの履歴を確認してください。\n履歴に根拠があることを知らないふりしないでください。\n履歴にも長期記憶にも根拠がない場合だけ、知らないことを作らずに答えてください。\n\n${recentConversation || "直近の会話履歴なし"}`;
 }
 
 function createForwardedRequest(request: Request, body: unknown) {
@@ -139,7 +159,11 @@ export async function POST(request: Request) {
 
     const isAnonymous = userData.user.is_anonymous === true;
     const recallMode = isMemoryRecallQuestion(body?.message);
-    const messageForModel = createRecallAwareMessage(body?.message, recallMode);
+    const messageForModel = createRecallAwareMessage(
+      body?.message,
+      body?.history,
+      recallMode
+    );
 
     // 匿名利用ではSupabaseを会話・記憶・関係時間の保存先にしない。
     // ブラウザから届いた一時記憶と直近の会話履歴を、そのブラウザセッション中の回答に使う。

```

