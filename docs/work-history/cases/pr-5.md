# 記憶確認の質問でも直近の会話履歴を保持する

[PR原本](https://github.com/miyazaki1016/misaki/pull/5)

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

記憶確認の質問でも直近の会話履歴を保持する

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/5)

## 実際の変更処理（コードから抽出）

MAX_MEMORY、PARSE_ERROR_MESSAGE、POST、SUPABASE_PUBLISHABLE_KEY、SUPABASE_URL、accessToken、authorization、baseResponse、body、callBaseChatWithParseRetry、canonicalMemory、createAuthenticatedSupabase、createForwardedRequest、firstResponse、historyForSync、isAnonymous、isMemoryRecallQuestion、misakiMessageAt、nextMemory、normalized、payload、recallMode、relationshipTimeSynced、result、retryParseFailure、returnedMemory、safeBody、sanitizeMemory、supabase、temporaryMemory、userMessageAt

- [app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/1fdd4d44a4ee53bcbda48e27d4065dc5f39cf7bc/app/api/chat-proxy/route.ts)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
実機Safariの匿名→メール保存E2Eで、表示履歴は正しく引き継がれた一方、「前世の話覚えてる？」のような記憶確認質問では直前の会話を参照できない事象を確認しました。

原因は chat-proxy の recallMode が記憶確認時に `history: []` を強制していたことです。

変更内容:
- 匿名・保存済みアカウントとも、記憶確認時にも直近の会話履歴をbase chatへ渡す
- 保存済みアカウントのcanonical memoryを正本として使う既存仕様は維持
- recallMode時に生成結果でcanonical memoryを書き換えない既存仕様も維持
- JSON parse retry、関係時間、同期処理には変更なし

これにより「長期記憶」と「今まさに続いている会話」を両方参照して自然に思い出せるようにします。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/api/chat-proxy/route.ts

```text
diff --git a/app/api/chat-proxy/route.ts b/app/api/chat-proxy/route.ts
index 62c6b14..09a6358 100644
--- a/app/api/chat-proxy/route.ts
+++ b/app/api/chat-proxy/route.ts
@@ -106,13 +106,12 @@ export async function POST(request: Request) {
     const recallMode = isMemoryRecallQuestion(body?.message);
 
     // 匿名利用ではSupabaseを会話・記憶・関係時間の保存先にしない。
-    // ブラウザから届いた一時記憶だけを、そのブラウザセッション中の回答に使う。
+    // ブラウザから届いた一時記憶と直近の会話履歴を、そのブラウザセッション中の回答に使う。
     if (isAnonymous) {
       const temporaryMemory = sanitizeMemory(body?.memory);
       const safeBody = {
         ...body,
         memory: temporaryMemory,
-        ...(recallMode ? { history: [] } : {}),
       };
 
       const baseResponse = await callBaseChatWithParseRetry(request, safeBody);
@@ -131,6 +130,7 @@ export async function POST(request: Request) {
     }
 
     // 保存済みアカウントではSupabaseのmemoryを唯一の正本として使う。
+    // 記憶確認の質問でも、正本memoryに加えてブラウザから届く直近の会話履歴を文脈として残す。
     const { data: state, error: stateError } = await supabase
       .from("misaki_user_conversation_state")
       .select("memory")
@@ -149,7 +149,6 @@ export async function POST(request: Request) {
     const safeBody = {
       ...body,
       memory: canonicalMemory,
-      ...(recallMode ? { history: [] } : {}),
     };
 
     const userMessageAt = new Date();

```

