# 旧Safariに残った所有者不明の会話キャッシュを破棄する

[PR原本](https://github.com/miyazaki1016/misaki/pull/2)

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

旧Safariに残った所有者不明の会話キャッシュを破棄する

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/2)

## 実際の変更処理（コードから抽出）

AUTH_KIND_KEY、AnonymousSessionGuard、BROWSER_SESSION_KEY、active、assert、body、cache、child、cleanup、client、context、cursor、deviceOwner、find、flush、fs、h、hadBrowserSession、harness、history、i、initialized、lastAuthKind、load、localStorage、map、match、module、output、ownerKey、path、pendingKey、pendingOwner、pendingSave、react、reconcileAuth、req、request、root、route、server、sessionStorage、states、storage、tree、ts、user、vm

- 条件分岐・閾値：`if (!deviceOwner &amp;&amp; !pendingSave) {`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/app/chat/anonymous-session-guard.tsx)）
- テストの期待値・条件：`test(&#x27;legacy ownerless Safari cache is discarded before binding current user&#x27;, async () =&gt; {`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/tests/account-conversation.test.cjs)）
- テストの期待値・条件：`assert.equal(h.localStorage.getItem(&#x27;misaki-chat-history&#x27;), null);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/tests/account-conversation.test.cjs)）
- テストの期待値・条件：`assert.equal(h.localStorage.getItem(&#x27;misaki-long-term-memory&#x27;), null);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/tests/account-conversation.test.cjs)）
- テストの期待値・条件：`assert.equal(h.localStorage.getItem(&#x27;misaki-today-memory&#x27;), null);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/tests/account-conversation.test.cjs)）
- テストの期待値・条件：`assert.equal(h.localStorage.getItem(&#x27;unrelated&#x27;), &#x27;keep&#x27;);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/tests/account-conversation.test.cjs)）
- テストの期待値・条件：`assert.equal(h.localStorage.getItem(ownerKey), &#x27;legacy-anon&#x27;);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/tests/account-conversation.test.cjs)）
- [app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/app/chat/anonymous-session-guard.tsx)：全文
- [tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/0546426c9802665413ff47a16ad56f5cd7bb91b5/tests/account-conversation.test.cjs)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
Safariなど旧ビルド由来で `misaki-chat-history` / memory が残っている一方、`misaki-device-user-id` が存在しないケースを安全に処理します。

- 現在ユーザーへ紐づける前に、所有者を証明できない `misaki-` キャッシュを破棄
- メール保存中（pending save）の同一ユーザーは従来どおり保護
- `misaki-` 以外のブラウザデータは触らない
- 旧Safari残留状態の回帰テストを追加

今回ユーザー実機で、iPhoneアプリ/Chromeは空だがSafariだけ旧会話が残る現象が再現しているため、そのSafariを実機検証環境として保持しています。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/chat/anonymous-session-guard.tsx

```text
diff --git a/app/chat/anonymous-session-guard.tsx b/app/chat/anonymous-session-guard.tsx
index 22b105a..3cb5bb4 100644
--- a/app/chat/anonymous-session-guard.tsx
+++ b/app/chat/anonymous-session-guard.tsx
@@ -18,11 +18,19 @@ export default function AnonymousSessionGuard({ children }: { children: ReactNod
       try {
         const hadBrowserSession = sessionStorage.getItem(BROWSER_SESSION_KEY) === "1";
         const lastAuthKind = localStorage.getItem(AUTH_KIND_KEY);
+        const deviceOwner = localStorage.getItem(DEVICE_USER_KEY);
+        const pendingOwner = localStorage.getItem(EMAIL_SAVE_USER_KEY);
         const { data, error } = await supabase.auth.getSession();
         if (error) throw error;
         if (!active) return;
         let user = data.session?.user ?? null;
-        const pendingSave = user && localStorage.getItem(EMAIL_SAVE_USER_KEY) === user.id;
+        const pendingSave = Boolean(user && pendingOwner === user.id);
+
+        // Legacy builds could leave conversation/memory behind without an owner marker.
+        // Never attach ownerless caches to a newly reconciled anonymous/permanent user.
+        if (!deviceOwner && !pendingSave) {
+          clearMisakiDeviceData();
+        }
 
         // Supabase の匿名セッション自体は localStorage に残るため、
         // ブラウザを閉じた後の新規セッションでは匿名認証も作り直す。

```

### tests/account-conversation.test.cjs

```text
diff --git a/tests/account-conversation.test.cjs b/tests/account-conversation.test.cjs
index 82cda9c..b8895a8 100644
--- a/tests/account-conversation.test.cjs
+++ b/tests/account-conversation.test.cjs
@@ -116,6 +116,15 @@ test('ordinary expired anonymous browser session still clears all misaki caches'
   assert.equal(h.localStorage.getItem('misaki-today-memory'), null);
   assert.equal(h.localStorage.getItem('unrelated'), 'keep'); assert.equal(h.localStorage.getItem(ownerKey), 'new');
 });
+test('legacy ownerless Safari cache is discarded before binding current user', async () => {
+  const h = harness({ id: 'legacy-anon', is_anonymous: true }, { [ownerKey]: '', 'misaki-auth-kind': '', 'misaki-today-memory': 'old', unrelated: 'keep' }, { 'misaki-browser-session': '1' });
+  await h.mount('app/chat/anonymous-session-guard.tsx', { children: 'chat' });
+  assert.equal(h.localStorage.getItem('misaki-chat-history'), null);
+  assert.equal(h.localStorage.getItem('misaki-long-term-memory'), null);
+  assert.equal(h.localStorage.getItem('misaki-today-memory'), null);
+  assert.equal(h.localStorage.getItem('unrelated'), 'keep');
+  assert.equal(h.localStorage.getItem(ownerKey), 'legacy-anon');
+});
 test('different permanent user clears previous conversation and memory', async () => {
   const h = harness({ id: 'b', is_anonymous: false }, { [pendingKey]: 'a' });
   await h.mount('app/chat/anonymous-session-guard.tsx');

```

