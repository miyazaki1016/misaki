# 実機から会話履歴の受信状況を診断できるようにする

[PR原本](https://github.com/miyazaki1016/misaki/pull/7)

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

実機から会話履歴の受信状況を診断できるようにする

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/7)

## 実際の変更処理（コードから抽出）

HISTORY_DIAGNOSTIC_PREFIX、MAX_MEMORY、PARSE_ERROR_MESSAGE、POST、SUPABASE_PUBLISHABLE_KEY、SUPABASE_URL、accessToken、authorization、baseResponse、body、callBaseChatWithParseRetry、canonicalMemory、createAuthenticatedSupabase、createForwardedRequest、createHistoryDiagnostic、createRecallAwareMessage、diagnosticResponse、firstResponse、history、historyForSync、isAnonymous、isMemoryRecallQuestion、matches、messageForModel、misakiMessageAt、nextMemory、normalized、payload、recallMode、relationshipTimeSynced、result、retryParseFailure、returnedMemory、safeBody、sanitizeMemory、supabase、temporaryMemory、term、userMessageAt、validHistory

- 条件分岐・閾値：`const HISTORY_DIAGNOSTIC_PREFIX = &quot;履歴診断:&quot;;`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/47f39994a79e68fa47cbe5234ba75ce2a19d5965/app/api/chat-proxy/route.ts)）
- 関数・クラス定義：`function createHistoryDiagnostic(body: any) {`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/47f39994a79e68fa47cbe5234ba75ce2a19d5965/app/api/chat-proxy/route.ts)）
- 条件分岐・閾値：`if (typeof body?.message !== &quot;string&quot;) return null;`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/47f39994a79e68fa47cbe5234ba75ce2a19d5965/app/api/chat-proxy/route.ts)）
- 条件分岐・閾値：`if (!body.message.startsWith(HISTORY_DIAGNOSTIC_PREFIX)) return null;`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/47f39994a79e68fa47cbe5234ba75ce2a19d5965/app/api/chat-proxy/route.ts)）
- 条件分岐・閾値：`if (diagnosticResponse) return diagnosticResponse;`（[app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/47f39994a79e68fa47cbe5234ba75ce2a19d5965/app/api/chat-proxy/route.ts)）
- [app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/47f39994a79e68fa47cbe5234ba75ce2a19d5965/app/api/chat-proxy/route.ts)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
実機Safariで表示履歴とモデル参照履歴の食い違いを切り分けるため、通常会話をGeminiへ送らずに `履歴診断:<語句>` で受信済みhistory件数と該当語句を含む履歴件数だけを返す診断経路を追加します。会話本文はサーバーログへ出力せず、診断時は会話・記憶・関係時間をSupabaseへ同期しません。原因特定後に診断経路は撤去予定です。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/api/chat-proxy/route.ts

```text
diff --git a/app/api/chat-proxy/route.ts b/app/api/chat-proxy/route.ts
index 083c551..efb7e40 100644
--- a/app/api/chat-proxy/route.ts
+++ b/app/api/chat-proxy/route.ts
@@ -8,6 +8,7 @@ const SUPABASE_PUBLISHABLE_KEY =
 const MAX_MEMORY = 30;
 const PARSE_ERROR_MESSAGE =
   "美咲の返事をうまく読み取れなかったみたい。もう一度話しかけてね。";
+const HISTORY_DIAGNOSTIC_PREFIX = "履歴診断:";
 
 function createAuthenticatedSupabase(accessToken: string) {
   return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
@@ -66,6 +67,31 @@ function createForwardedRequest(request: Request, body: unknown) {
   });
 }
 
+function createHistoryDiagnostic(body: any) {
+  if (typeof body?.message !== "string") return null;
+  if (!body.message.startsWith(HISTORY_DIAGNOSTIC_PREFIX)) return null;
+
+  const term = body.message.slice(HISTORY_DIAGNOSTIC_PREFIX.length).trim();
+  const history = Array.isArray(body?.history) ? body.history : [];
+  const validHistory = history.filter(
+    (item: any) =>
+      item &&
+      (item.role === "user" || item.role === "misaki") &&
+      typeof item.text === "string"
+  );
+  const matches = term
+    ? validHistory.filter((item: any) => item.text.includes(term)).length
+    : 0;
+
+  return Response.json({
+    reply: `診断結果：history=${validHistory.length}件 / 「${term || "未指定"}」を含む履歴=${matches}件`,
+    memory: sanitizeMemory(body?.memory),
+    memorySynced: false,
+    relationshipTimeSynced: false,
+    diagnostic: true,
+  });
+}
+
 async function callBaseChatWithParseRetry(request: Request, body: unknown) {
   const firstResponse = await baseChatPost(createForwardedRequest(request, body));
   if (firstResponse.ok || firstResponse.status !== 500) return firstResponse;
@@ -108,6 +134,9 @@ export async function POST(request: Request) {
       );
     }
 
+    const diagnosticResponse = createHistoryDiagnostic(body);
+    if (diagnosticResponse) return diagnosticResponse;
+
     const isAnonymous = userData.user.is_anonymous === true;
     const recallMode = isMemoryRecallQuestion(body?.message);
     const messageForModel = createRecallAwareMessage(body?.message, recallMode);

```

