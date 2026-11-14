# 匿名会話と記憶をメール確認前に同じユーザーへ保存する

[PR原本](https://github.com/miyazaki1016/misaki/pull/1)

**目的：** 会話や記憶・関係性を扱う処理の変更／通知・メール配信とその運用に関する変更／開発資産の把握・引継ぎ・レビューを支援する変更／画面表示や操作に関する変更

**実装状態：** 変更差分を取得。実装の受入完了は未認定

**検証の扱い：** Actionsの成否は実行単位の事実。製品の受入検証とは別

**PR状態：** merged

**main統合：** mainに祖先コミットとして存在（機能受入・本番は別）

**本番反映：** 未確認（main統合／Vercelプレビューから推定しない）

**残課題：** 受入条件・未解決事項をPR本文、レビュー、台帳と照合

**次の作業：** 類似コード・既存結論を確認し、未解決条件だけを次の作業にする

根拠取得日時 (UTC)：2026-11-09T09:02:40.107460+00:00

## 日本語で確認した成果

匿名会話と記憶をメール確認前に同じユーザーへ保存する

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/1)

## 実装判断の検索候補（コード・テスト・検証資料）

テスト名と期待値は同じコミットのソースを読むための手掛かりです。

### API rejects foreign expected user ID and accepts memory-only explicit save

- 条件：API rejects foreign expected user ID and accepts memory-only explicit save
- 動作・設定：if (&quot;error&quot; in auth) { ／ return Response.json({ error: auth.error }, { status: 401 }); ／ if (body?.saveAnonymous === true) { ／ if (!auth.isAnonymous &#124;&#124; body.expectedUserId !== auth.userId) { ／ return Response.json({ error: &quot;Anonymous account mismatch.&quot; }, { status: 409 }); ／ if (error) { ／ return Response.json({ error: &quot;Conversation could not be saved.&quot; }, { status: 500 }); ／ return Response.json({ synced: true, result: data });
- 検証範囲：テストの期待値: assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: &#x27;b&#x27;, history, memory: [] }))).status, 409) ／ assert.equal(h.calls.length, 0) ／ assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: &#x27;a&#x27;, history: [], memory: [&#x27;remember&#x27;] }))).status, 200) ／ 実行証拠: 個別の実行結果は未確認
- 残課題：呼び出し元・本番採用・実機を確認
- 根拠：[原本](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/api/persona/history/route.ts#L136) ／ [原本](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs#L146)

## 実際の変更処理（コードから抽出）

AUTH_KIND_KEY、AccountPage、AnonymousSessionGuard、BROWSER_SESSION_KEY、CHAT_HISTORY_KEY、ChatLayout、ConversationHistorySync、DEVICE_USER_KEY、EMAIL_SAVE_USER_KEY、GET、LONG_MEMORY_KEY、POST、SUPABASE_PUBLISHABLE_KEY、SUPABASE_URL、SYNC_INTERVAL_MS、accessToken、active、arraysEqual、assert、auth、authError、authorization、bindDeviceUser、body、bootstrap、cache、child、cleanup、clearMisakiDeviceData、clearMisakiLocalData、client、context、createAuthenticatedSupabase、currentUser、cursor、fetchServerState、find、flush、fs、getAuthenticatedClient、getBearerToken、h、hadBrowserSession、handleVisibility、harness、history、historyChanged、i、initialized、intervalId、isAnonymous、isExistingAccountError、isPermanent、key、lastAuthKind、load、localHistory、localMemory、localStorage、map

- 条件分岐・閾値：`if (currentUser) bindDeviceUser(currentUser.id);`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- 条件分岐・閾値：`if (active) {`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- 条件分岐・閾値：`if (session?.user) bindDeviceUser(session.user.id);`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- 条件分岐・閾値：`if (sessionError) throw sessionError;`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- 条件分岐・閾値：`if (!session?.user.is_anonymous &#124;&#124; session.user.id !== user?.id &#124;&#124;`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- HTTP要求：`const saved = await fetch(&quot;/api/persona/history&quot;, {`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- 条件分岐・閾値：`if (!saved.ok) throw new Error(&quot;会話・記憶を保存できませんでした。メールは送信していません。もう一度お試しください。&quot;);`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- 条件分岐・閾値：`if (latest.session?.user.id !== session.user.id &#124;&#124; !latest.session.user.is_anonymous) {`（[app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)）
- 条件分岐・閾値：`if (body?.saveAnonymous === true) {`（[app/api/persona/history/route.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/api/persona/history/route.ts)）
- 条件分岐・閾値：`if (!auth.isAnonymous &#124;&#124; body.expectedUserId !== auth.userId) {`（[app/api/persona/history/route.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/api/persona/history/route.ts)）
- DB・ストレージ操作の呼出し：`const { data, error } = await auth.supabase.rpc(&quot;save_anonymous_conversation_state&quot;, {`（[app/api/persona/history/route.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/api/persona/history/route.ts)）
- 条件分岐・閾値：`if (error) {`（[app/api/persona/history/route.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/api/persona/history/route.ts)）
- 関数・クラス定義：`export default function AnonymousSessionGuard({ children }: { children: ReactNode }) {`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (error) throw error;`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!user &#124;&#124; (!hadBrowserSession &amp;&amp; lastAuthKind === &quot;anonymous&quot; &amp;&amp; user.is_anonymous &amp;&amp; !pendingSave)) {`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (user) {`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (signOutError) throw signOutError;`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!active) return;`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (signInError) throw signInError;`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!active) return;`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (user) {`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!localStorage.getItem(DEVICE_USER_KEY) &amp;&amp; !user.is_anonymous) clearMisakiDeviceData();`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (active) setFailed(true);`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!active &#124;&#124; !initialized) return;`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!state &#124;&#124; typeof state.exists !== &quot;boolean&quot; &#124;&#124; !Array.isArray(state.history) &#124;&#124; !Array.isArray(state.memory)) {`（[app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/conversation-history-sync.tsx)）
- 条件分岐・閾値：`if (localStorage.getItem(DEVICE_USER_KEY) !== userId) return;`（[app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/conversation-history-sync.tsx)）
- 条件分岐・閾値：`if (!serverState.exists &amp;&amp; localStorage.getItem(EMAIL_SAVE_USER_KEY) === userId) {`（[app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/conversation-history-sync.tsx)）
- 条件分岐・閾値：`if (stopped &#124;&#124; latest.session?.user.id !== userId &#124;&#124; latest.session.user.is_anonymous &#124;&#124;`（[app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/conversation-history-sync.tsx)）
- 条件分岐・閾値：`if (!arraysEqual(localHistory, sanitizeHistory(readJsonArray(CHAT_HISTORY_KEY))) &#124;&#124;`（[app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/conversation-history-sync.tsx)）
- 条件分岐・閾値：`if (localStorage.getItem(EMAIL_SAVE_USER_KEY) === userId) localStorage.removeItem(EMAIL_SAVE_USER_KEY);`（[app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/conversation-history-sync.tsx)）
- 条件分岐・閾値：`export const DEVICE_USER_KEY = &quot;misaki-device-user-id&quot;;`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 条件分岐・閾値：`export const EMAIL_SAVE_USER_KEY = &quot;misaki-email-save-user-id&quot;;`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 関数・クラス定義：`export function clearMisakiDeviceData() {`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 条件分岐・閾値：`if (key?.startsWith(&quot;misaki-&quot;)) storage.removeItem(key);`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 関数・クラス定義：`export function bindDeviceUser(userId: string) {`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 条件分岐・閾値：`if (owner &amp;&amp; owner !== userId) clearMisakiDeviceData();`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 関数・クラス定義：`export function readDeviceArray(key: string): unknown[] {`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 条件分岐・閾値：`if (!raw) return [];`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- 条件分岐・閾値：`if (!Array.isArray(value)) throw new Error(&quot;Invalid conversation cache.&quot;);`（[lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)）
- テストの期待値・条件：`-- Explicit email-save checkpoint. A snapshot replaces itself; it is never a delta.`（[supabase/migrations/20260917051607_save_anonymous_conversation.sql](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/supabase/migrations/20260917051607_save_anonymous_conversation.sql)）
- 関数・クラス定義：`create or replace function public.save_anonymous_conversation_state(p_history jsonb, p_memory jsonb)`（[supabase/migrations/20260917051607_save_anonymous_conversation.sql](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/supabase/migrations/20260917051607_save_anonymous_conversation.sql)）
- 関数・クラス定義：`revoke all on function public.save_anonymous_conversation_state(jsonb,jsonb) from public, anon;`（[supabase/migrations/20260917051607_save_anonymous_conversation.sql](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/supabase/migrations/20260917051607_save_anonymous_conversation.sql)）
- SQL定義・権限：`grant execute on function public.save_anonymous_conversation_state(jsonb,jsonb) to authenticated;`（[supabase/migrations/20260917051607_save_anonymous_conversation.sql](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/supabase/migrations/20260917051607_save_anonymous_conversation.sql)）
- テストの期待値・条件：`// Run: node --test tests/account-conversation.test.cjs`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- テストの期待値・条件：`const { test } = require(&#x27;node:test&#x27;);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- テストの期待値・条件：`const assert = require(&#x27;node:assert/strict&#x27;);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- 関数・クラス定義：`function storage(initial = {}) {`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- DB・ストレージ操作の呼出し：`getItem: k =&gt; map.get(k) ?? null, setItem: (k, v) =&gt; map.set(k, String(v)), removeItem: k =&gt; map.delete(k) };`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- 関数・クラス定義：`async function flush() { for (let i = 0; i &lt; 12; i++) await new Promise(setImmediate); }`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- 関数・クラス定義：`function harness(user = { id: &#x27;a&#x27;, is_anonymous: true }, initial = {}, sessionInitial = {}) {`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- 条件分岐・閾値：`if (!(i in states)) states[i] = value;`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- 条件分岐・閾値：`}, useEffect: fn =&gt; { if (!mounted) effects.push(fn); }, useLayoutEffect: fn =&gt; { if (!mounted) effects.push(fn); } };`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- HTTP要求：`console: { error() {} }, fetch: (...args) =&gt; h.fetch(...args),`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- 関数・クラス定義：`function load(file) {`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- 条件分岐・閾値：`if (cache.has(file)) return cache.get(file);`（[tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)）
- [app/account/page.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/account/page.tsx)：全文
- [app/api/persona/history/route.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/api/persona/history/route.ts)：全文
- [app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/anonymous-session-guard.tsx)：全文
- [app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/conversation-history-sync.tsx)：全文
- [app/chat/layout.tsx](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/app/chat/layout.tsx)：全文
- [lib/device-conversation.ts](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/lib/device-conversation.ts)：全文
- [supabase/migrations/20260917051607_save_anonymous_conversation.sql](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/supabase/migrations/20260917051607_save_anonymous_conversation.sql)：全文
- [tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/27e83d2366de22053a7f41d62b77cfe6d7a748a8/tests/account-conversation.test.cjs)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
匿名で会話してからメール保存し、確認リンクを新しいタブで開くと、認証確認前のセッションガードが端末履歴を消去し得ました。履歴同期もサーバー行が存在する場合は空履歴を端末へ上書きしていました。

「メールで保存」の明示操作時に、確認メール送信より先に同じ匿名user_idへ会話・長期記憶をチェックポイント保存します。updateUser({email})による同一IDの正式化を維持し、端末の所有者を照合して別ユーザーのキャッシュを消去します。ガードは認証確認後にチャットをマウントし、同期中のユーザー切替や壊れたレスポンスからの上書きを防ぎます。新規RPCは認証された匿名本人だけが使え、再送でも履歴を重複追加しません。通常の匿名会話のサーバー非保存とログアウト時の両ストレージ消去は維持します。

検証: クライアント/API回帰テスト11件、型チェック、コンパイル通過。Supabaseで再送・所有者分離・空履歴上書き防止・記憶のみ・空行からの保存・正式化後の同一ID復元・他ユーザーのRLS遮断を検証（テストはROLLBACK）。Migration 20260917051607_save_anonymous_conversation は対象Supabaseへ適用済みです。

制約: ローカルの完全ビルドは端末の子プロセス起動制限（spawn EPERM）、workerThreadsでの回避時は静的ページ生成のDataCloneErrorで完了できませんでした。実メール送信を伴う認証E2Eは未実施です。プレビュービルドを確認してからマージしてください。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/account/page.tsx

```text
diff --git a/app/account/page.tsx b/app/account/page.tsx
index aba9678..9082429 100644
--- a/app/account/page.tsx
+++ b/app/account/page.tsx
@@ -3,6 +3,7 @@
 import { useEffect, useState, type CSSProperties } from "react";
 import type { User } from "@supabase/supabase-js";
 import { supabase } from "../../lib/supabase";
+import { bindDeviceUser, clearMisakiDeviceData, DEVICE_USER_KEY, EMAIL_SAVE_USER_KEY, readDeviceArray } from "../../lib/device-conversation";
 
 type Mode = "save" | "login";
 
@@ -10,17 +11,6 @@ function normalizeEmail(value: string) {
   return value.trim().toLowerCase();
 }
 
-function clearMisakiDeviceData() {
-  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
-    const key = localStorage.key(i);
-    if (key?.startsWith("misaki-")) localStorage.removeItem(key);
-  }
-  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
-    const key = sessionStorage.key(i);
-    if (key?.startsWith("misaki-")) sessionStorage.removeItem(key);
-  }
-}
-
 function isExistingAccountError(error: any) {
   const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
   return [
@@ -79,6 +69,7 @@ export default function AccountPage() {
         }
 
         if (active) {
+          if (currentUser) bindDeviceUser(currentUser.id);
           setUser(currentUser);
           setMode(currentUser && !currentUser.is_anonymous ? "login" : "save");
         }
@@ -92,7 +83,10 @@ export default function AccountPage() {
 
     void load();
     const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
-      if (active) setUser(session?.user ?? null);
+      if (active) {
+        if (session?.user) bindDeviceUser(session.user.id);
+        setUser(session?.user ?? null);
+      }
     });
 
     return () => {
@@ -109,6 +103,30 @@ export default function AccountPage() {
     setWorking(true);
     setMessage("");
     try {
+      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
+      if (sessionError) throw sessionError;
+      const session = sessionData.session;
+      if (!session?.user.is_anonymous || session.user.id !== user?.id ||
+          localStorage.getItem(DEVICE_USER_KEY) !== session.user.id) {
+        throw new Error("アカウント状態が変わりました。画面を開き直してください。");
+      }
+      // Save before sending the link: confirmation may open in another tab/device.
+      const saved = await fetch("/api/persona/history", {
+        method: "POST",
+        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
+        body: JSON.stringify({
+          saveAnonymous: true,
+          expectedUserId: session.user.id,
+          history: readDeviceArray("misaki-chat-history"),
+          memory: readDeviceArray("misaki-long-term-memory"),
+        }),
+      });
+      if (!saved.ok) throw new Error("会話・記憶を保存できませんでした。メールは送信していません。もう一度お試しください。");
+      const { data: latest } = await supabase.auth.getSession();
+      if (latest.session?.user.id !== session.user.id || !latest.session.user.is_anonymous) {
+        throw new Error("アカウント状態が変わりました。画面を開き直してください。");
+      }
+      localStorage.setItem(EMAIL_SAVE_USER_KEY, session.user.id);
       const { error } = await supabase.auth.updateUser(
         { email: nextEmail },
         { emailRedirectTo: `${window.location.origin}/account` }

```

### app/api/persona/history/route.ts

```text
diff --git a/app/api/persona/history/route.ts b/app/api/persona/history/route.ts
index 8676edb..f2b35fa 100644
--- a/app/api/persona/history/route.ts
+++ b/app/api/persona/history/route.ts
@@ -80,7 +80,8 @@ async function getAuthenticatedClient(request: Request) {
 
   return {
     supabase,
-    userId: data.user.id,
+    userId: data.user.id,
+    isAnonymous: data.user.is_anonymous === true,
   };
 }
 
@@ -145,7 +146,22 @@ export async function POST(request: Request) {
       body ?? {},
       "memory"
     );
-    const memory = memoryWasProvided ? sanitizeMemory(body?.memory) : null;
+    const memory = memoryWasProvided ? sanitizeMemory(body?.memory) : null;
+
+    if (body?.saveAnonymous === true) {
+      if (!auth.isAnonymous || body.expectedUserId !== auth.userId) {
+        return Response.json({ error: "Anonymous account mismatch." }, { status: 409 });
+      }
+      const { data, error } = await auth.supabase.rpc("save_anonymous_conversation_state", {
+        p_history: history,
+        p_memory: memory ?? [],
+      });
+      if (error) {
+        console.error("ANONYMOUS CONVERSATION SAVE ERROR:", error);
+        return Response.json({ error: "Conversation could not be saved." }, { status: 500 });
+      }
+      return Response.json({ synced: true, result: data });
+    }
 
     if (history.length === 0) {
       return Response.json(

```

### app/chat/anonymous-session-guard.tsx

```text
diff --git a/app/chat/anonymous-session-guard.tsx b/app/chat/anonymous-session-guard.tsx
index f3086b3..22b105a 100644
--- a/app/chat/anonymous-session-guard.tsx
+++ b/app/chat/anonymous-session-guard.tsx
@@ -1,75 +1,71 @@
 "use client";
 
-import { useLayoutEffect } from "react";
+import { useLayoutEffect, useState, type ReactNode } from "react";
 import { supabase } from "../../lib/supabase";
+import { bindDeviceUser, clearMisakiDeviceData, DEVICE_USER_KEY, EMAIL_SAVE_USER_KEY } from "../../lib/device-conversation";
 
 const AUTH_KIND_KEY = "misaki-auth-kind";
 const BROWSER_SESSION_KEY = "misaki-browser-session";
 
-function clearMisakiLocalData() {
-  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
-    const key = localStorage.key(i);
-    if (key?.startsWith("misaki-") && key !== AUTH_KIND_KEY) {
-      localStorage.removeItem(key);
-    }
-  }
-
-  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
-    const key = sessionStorage.key(i);
-    if (key?.startsWith("misaki-")) {
-      sessionStorage.removeItem(key);
-    }
-  }
-}
-
-export default function AnonymousSessionGuard() {
+export default function AnonymousSessionGuard({ children }: { children: ReactNode }) {
+  const [ready, setReady] = useState(false);
+  const [failed, setFailed] = useState(false);
   useLayoutEffect(() => {
     let active = true;
-
-    const hadBrowserSession = sessionStorage.getItem(BROWSER_SESSION_KEY) === "1";
-    const lastAuthKind = localStorage.getItem(AUTH_KIND_KEY);
-
-    // 前回が匿名利用で、ブラウザセッションが終了している場合は
-    // 匿名会話・記憶・進化キャッシュを新しいセッションへ持ち越さない。
-    if (!hadBrowserSession && lastAuthKind === "anonymous") {
-      clearMisakiLocalData();
-      localStorage.removeItem(AUTH_KIND_KEY);
-    }
-
-    sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
+    let initialized = false;
 
     async function reconcileAuth() {
-      const { data } = await supabase.auth.getSession();
-      if (!active) return;
-
-      const user = data.session?.user ?? null;
-
-      // Supabase の匿名セッション自体は localStorage に残るため、
-      // ブラウザを閉じた後の新規セッションでは匿名認証も作り直す。
-      if (!hadBrowserSession && lastAuthKind === "anonymous" && user?.is_anonymous) {
-        await supabase.auth.signOut({ scope: "local" });
+      try {
+        const hadBrowserSession = sessionStorage.getItem(BROWSER_SESSION_KEY) === "1";
+        const lastAuthKind = localStorage.getItem(AUTH_KIND_KEY);
+        const { data, error } = await supabase.auth.getSession();
+        if (error) throw error;
         if (!active) return;
-        const { data: anonymousData } = await supabase.auth.signInAnonymously();
-        if (!active) return;
-        if (anonymousData.user) {
-          localStorage.setItem(AUTH_KIND_KEY, "anonymous");
+        let user = data.session?.user ?? null;
+        const pendingSave = user && localStorage.getItem(EMAIL_SAVE_USER_KEY) === user.id;
+
+        // Supabase の匿名セッション自体は localStorage に残るため、
+        // ブラウザを閉じた後の新規セッションでは匿名認証も作り直す。
+        if (!user || (!hadBrowserSession && lastAuthKind === "anonymous" && user.is_anonymous && !pendingSave)) {
+          clearMisakiDeviceData();
+          if (user) {
+            const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
+            if (signOutError) throw signOutError;
+          }
+          if (!active) return;
+          const { data: anonymousData, error: signInError } = await supabase.auth.signInAnonymously();
+          if (signInError) throw signInError;
+          if (!active) return;
+          user = anonymousData.user;
         }
-        return;
-      }
 
-      if (user) {
-        localStorage.setItem(
-          AUTH_KIND_KEY,
-          user.is_anonymous ? "anonymous" : "permanent"
-        );
+        if (user) {
+          if (!localStorage.getItem(DEVICE_USER_KEY) && !user.is_anonymous) clearMisakiDeviceData();
+          bindDeviceUser(user.id);
+          localStorage.setItem(
+            AUTH_KIND_KEY,
+            user.is_anonymous ? "anonymous" : "permanent"
+          );
+          sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
+          initialized = true;
+          setReady(true);
+        }
+      } catch (error) {
+        console.error("ANONYMOUS SESSION GUARD ERROR:", error);
+        if (active) setFailed(true);
       }
     }
 
     void reconcileAuth();
 
-    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
-      if (!active) return;
+    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
+      if (!active || !initialized) return;
       const user = session?.user;
+      if (event === "SIGNED_OUT" || (user && localStorage.getItem(DEVICE_USER_KEY) !== user.id)) {
+        clearMisakiDeviceData();
+        window.location.reload();
+        return;
+      }
       if (user) {
         localStorage.setItem(
           AUTH_KIND_KEY,
@@ -84,5 +80,6 @@ export default function AnonymousSessionGuard() {
     };
   }, []);
 
-  return null;
+  if (!ready) return <main>{failed ? "アカウントを確認できませんでした。画面を再読み込みしてください。" : "アカウントを確認しています…"}</main>;
+  return <>{children}</>;
 }

```

### app/chat/conversation-history-sync.tsx

```text
diff --git a/app/chat/conversation-history-sync.tsx b/app/chat/conversation-history-sync.tsx
index dc69b43..879d659 100644
--- a/app/chat/conversation-history-sync.tsx
+++ b/app/chat/conversation-history-sync.tsx
@@ -2,6 +2,7 @@
 
 import { useEffect } from "react";
 import { supabase } from "../../lib/supabase";
+import { DEVICE_USER_KEY, EMAIL_SAVE_USER_KEY } from "../../lib/device-conversation";
 
 const CHAT_HISTORY_KEY = "misaki-chat-history";
 const LONG_MEMORY_KEY = "misaki-long-term-memory";
@@ -74,7 +75,11 @@ async function fetchServerState(token: string): Promise<ServerState> {
     cache: "no-store",
   });
   if (!response.ok) throw new Error("Conversation state load failed.");
-  return (await response.json().catch(() => null)) ?? {};
+  const state = await response.json();
+  if (!state || typeof state.exists !== "boolean" || !Array.isArray(state.history) || !Array.isArray(state.memory)) {
+    throw new Error("Invalid conversation state response.");
+  }
+  return state;
 }
 
 export default function ConversationHistorySync() {
@@ -97,30 +102,25 @@ export default function ConversationHistorySync() {
         if (!session?.access_token || !session.user || session.user.is_anonymous) {
           return;
         }
+        const userId = session.user.id;
+        if (localStorage.getItem(DEVICE_USER_KEY) !== userId) return;
 
         const localHistory = sanitizeHistory(readJsonArray(CHAT_HISTORY_KEY));
         const localMemory = sanitizeMemory(readJsonArray(LONG_MEMORY_KEY));
-        let serverState = await fetchServerState(session.access_token);
-
-        // 匿名で話していた美咲をメール保存した直後だけ、
-        // その時点の一時会話・記憶を保存済みアカウントへ初回登録する。
-        if (!serverState.exists && (localHistory.length > 0 || localMemory.length > 0)) {
-          const bootstrap = await fetch("/api/persona/history", {
-            method: "POST",
-            headers: {
-              "Content-Type": "application/json",
-              Authorization: `Bearer ${session.access_token}`,
-            },
-            body: JSON.stringify({
-              history: localHistory,
-              memory: localMemory,
-            }),
-          });
-
-          if (!bootstrap.ok) throw new Error("Initial conversation sync failed.");
-          serverState = await fetchServerState(session.access_token);
+        const serverState = await fetchServerState(session.access_token);
+        if (!serverState.exists && localStorage.getItem(EMAIL_SAVE_USER_KEY) === userId) {
+          throw new Error("Saved conversation state is missing.");
         }
 
+        // Email save already persisted the snapshot before sending confirmation.
+        // Never bootstrap a signed-in account from unqualified device caches.
+        const { data: latest } = await supabase.auth.getSession();
+        if (stopped || latest.session?.user.id !== userId || latest.session.user.is_anonymous ||
+            localStorage.getItem(DEVICE_USER_KEY) !== userId) return;
+        // A chat response may have arrived while the server request was in flight.
+        if (!arraysEqual(localHistory, sanitizeHistory(readJsonArray(CHAT_HISTORY_KEY))) ||
+            !arraysEqual(localMemory, sanitizeMemory(readJsonArray(LONG_MEMORY_KEY)))) return;
+
         const serverHistory = sanitizeHistory(serverState.history);
         const serverMemory = sanitizeMemory(serverState.memory);
         const historyChanged = !arraysEqual(localHistory, serverHistory);
@@ -128,6 +128,7 @@ export default function ConversationHistorySync() {
 
         localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(serverHistory));
         localStorage.setItem(LONG_MEMORY_KEY, JSON.stringify(serverMemory));
+        if (localStorage.getItem(EMAIL_SAVE_USER_KEY) === userId) localStorage.removeItem(EMAIL_SAVE_USER_KEY);
 
         if ((historyChanged || memoryChanged) && !stopped) {
           window.location.reload();

```

### app/chat/layout.tsx

```text
diff --git a/app/chat/layout.tsx b/app/chat/layout.tsx
index 5bdf85a..36f7f42 100644
--- a/app/chat/layout.tsx
+++ b/app/chat/layout.tsx
@@ -9,8 +9,7 @@ import FloatingMenuButton from "./floating-menu-button";
 
 export default function ChatLayout({ children }: { children: ReactNode }) {
   return (
-    <>
-      <AnonymousSessionGuard />
+    <AnonymousSessionGuard>
       <ConversationHistorySync />
       <AccountMenuLink />
       <ProactivePhotoDisplay />
@@ -113,6 +112,6 @@ export default function ChatLayout({ children }: { children: ReactNode }) {
       `}</style>
 
       {children}
-    </>
+    </AnonymousSessionGuard>
   );
 }

```

### lib/device-conversation.ts

```text
diff --git a/lib/device-conversation.ts b/lib/device-conversation.ts
new file mode 100644
index 0000000..ede3498
--- /dev/null
+++ b/lib/device-conversation.ts
@@ -0,0 +1,25 @@
+export const DEVICE_USER_KEY = "misaki-device-user-id";
+export const EMAIL_SAVE_USER_KEY = "misaki-email-save-user-id";
+
+export function clearMisakiDeviceData() {
+  for (const storage of [localStorage, sessionStorage]) {
+    for (let i = storage.length - 1; i >= 0; i -= 1) {
+      const key = storage.key(i);
+      if (key?.startsWith("misaki-")) storage.removeItem(key);
+    }
+  }
+}
+
+export function bindDeviceUser(userId: string) {
+  const owner = localStorage.getItem(DEVICE_USER_KEY);
+  if (owner && owner !== userId) clearMisakiDeviceData();
+  localStorage.setItem(DEVICE_USER_KEY, userId);
+}
+
+export function readDeviceArray(key: string): unknown[] {
+  const raw = localStorage.getItem(key);
+  if (!raw) return [];
+  const value: unknown = JSON.parse(raw);
+  if (!Array.isArray(value)) throw new Error("Invalid conversation cache.");
+  return value;
+}

```

### supabase/migrations/20260917051607_save_anonymous_conversation.sql

```text
diff --git a/supabase/migrations/20260917051607_save_anonymous_conversation.sql b/supabase/migrations/20260917051607_save_anonymous_conversation.sql
new file mode 100644
index 0000000..7b0ca6f
--- /dev/null
+++ b/supabase/migrations/20260917051607_save_anonymous_conversation.sql
@@ -0,0 +1,49 @@
+-- Explicit email-save checkpoint. A snapshot replaces itself; it is never a delta.
+-- SECURITY DEFINER is necessary because the conversation table has no direct
+-- client insert/update policies. Ownership and anonymous status are checked here.
+create or replace function public.save_anonymous_conversation_state(p_history jsonb, p_memory jsonb)
+returns jsonb
+language plpgsql
+security definer
+set search_path = ''
+as $$
+declare
+  v_user_id uuid := auth.uid();
+  v_history jsonb;
+  v_memory jsonb;
+begin
+  if v_user_id is null then raise exception 'anonymous account required'; end if;
+  -- Serialize snapshots and hold anonymous status stable against confirmation.
+  perform 1 from auth.users where id = v_user_id and is_anonymous = true for update;
+  if not found then
+    raise exception 'anonymous account required';
+  end if;
+  if jsonb_typeof(p_history) is distinct from 'array' or jsonb_typeof(p_memory) is distinct from 'array' then
+    raise exception 'invalid snapshot';
+  end if;
+  select coalesce(jsonb_agg(item order by ord), '[]'::jsonb) into v_history
+  from (
+    select jsonb_build_object('role', elem->>'role', 'text', left(btrim(elem->>'text'), 2000),
+      'sentAt', to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) as item, ord
+    from jsonb_array_elements(p_history) with ordinality a(elem, ord)
+    where elem->>'role' in ('user', 'misaki') and jsonb_typeof(elem->'text') = 'string'
+      and length(btrim(elem->>'text')) > 0
+    order by ord desc limit 60
+  ) items;
+  select coalesce(jsonb_agg(item order by ord), '[]'::jsonb) into v_memory
+  from (
+    select to_jsonb(left(btrim(elem #>> '{}'), 500)) as item, ord
+    from jsonb_array_elements(p_memory) with ordinality a(elem, ord)
+    where jsonb_typeof(elem) = 'string' and length(btrim(elem #>> '{}')) > 0
+    order by ord desc limit 30
+  ) items;
+
+  insert into public.misaki_user_conversation_state(user_id, history, memory, updated_at)
+  values (v_user_id, v_history, v_memory, now())
+  on conflict (user_id) do update set history = excluded.history, memory = excluded.memory, updated_at = now()
+  where jsonb_array_length(misaki_user_conversation_state.history) <= jsonb_array_length(excluded.history);
+  return jsonb_build_object('saved', true);
+end;
+$$;
+revoke all on function public.save_anonymous_conversation_state(jsonb,jsonb) from public, anon;
+grant execute on function public.save_anonymous_conversation_state(jsonb,jsonb) to authenticated;

```

### tests/account-conversation.test.cjs

```text
diff --git a/tests/account-conversation.test.cjs b/tests/account-conversation.test.cjs
new file mode 100644
index 0000000..82cda9c
--- /dev/null
+++ b/tests/account-conversation.test.cjs
@@ -0,0 +1,156 @@
+// Exercise the actual client components and API with controlled auth/storage.
+// Run: node --test tests/account-conversation.test.cjs
+const { test } = require('node:test');
+const assert = require('node:assert/strict');
+const fs = require('node:fs');
+const path = require('node:path');
+const vm = require('node:vm');
+const ts = require('typescript');
+const root = path.join(__dirname, '..');
+const history = [{ role: 'user', text: 'hello' }, { role: 'misaki', text: 'hi' }];
+const ownerKey = 'misaki-device-user-id';
+const pendingKey = 'misaki-email-save-user-id';
+function storage(initial = {}) {
+  const map = new Map(Object.entries(initial));
+  return { get length() { return map.size; }, key: i => [...map.keys()][i] ?? null,
+    getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k) };
+}
+async function flush() { for (let i = 0; i < 12; i++) await new Promise(setImmediate); }
+function harness(user = { id: 'a', is_anonymous: true }, initial = {}, sessionInitial = {}) {
+  const localStorage = storage({ [ownerKey]: 'a', 'misaki-chat-history': JSON.stringify(history),
+    'misaki-long-term-memory': '["remember"]', 'misaki-auth-kind': 'anonymous', ...initial });
+  const sessionStorage = storage(sessionInitial);
+  const states = [], effects = [], cleanups = [], calls = [], listeners = [];
+  let cursor = 0, mounted = false, currentUser = user;
+  const react = { useState: value => {
+    const i = cursor++;
+    if (!(i in states)) states[i] = value;
+    return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }];
+  }, useEffect: fn => { if (!mounted) effects.push(fn); }, useLayoutEffect: fn => { if (!mounted) effects.push(fn); } };
+  const client = { auth: {
+    getSession: async () => ({ data: { session: currentUser ? { user: currentUser, access_token: 'token' } : null }, error: null }),
+    getUser: async () => ({ data: { user: currentUser }, error: null }),
+    signOut: async () => { calls.push('signOut'); currentUser = null; return { error: null }; },
+    signInAnonymously: async () => { calls.push('signIn'); currentUser = { id: 'new', is_anonymous: true }; return { data: { user: currentUser }, error: null }; },
+    updateUser: async () => { calls.push('email'); return { error: null }; },
+    onAuthStateChange: fn => { listeners.push(fn); return { data: { subscription: { unsubscribe() {} } } }; },
+  }, rpc: async (name, args) => { calls.push({ name, args }); return { data: { saved: true }, error: null }; } };
+  const context = vm.createContext({ localStorage, sessionStorage, Response, Request, Date, JSON,
+    console: { error() {} }, fetch: (...args) => h.fetch(...args),
+    window: { location: { origin: 'https://example.test', reload: () => calls.push('reload') },
+      setInterval() {}, clearInterval() {}, setTimeout: fn => fn(), addEventListener() {}, removeEventListener() {} },
+    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} } });
+  const cache = new Map();
+  function load(file) {
+    if (cache.has(file)) return cache.get(file);
+    const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
+      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 }
+    }).outputText;
+    const module = { exports: {} };
+    const req = name => {
+      if (name === 'react') return react;
+      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' };
+      if (name === '@supabase/supabase-js') return { createClient: () => client };
+      if (name.endsWith('/supabase')) return { supabase: client };
+      if (name.endsWith('/device-conversation')) return load('lib/device-conversation.ts');
+      throw Error(name);
+    };
+    vm.runInContext(`(function(require,module,exports){${output}\n})`, context)(req, module, module.exports);
+    cache.set(file, module.exports);
+    return module.exports;
+  }
+  const h = { localStorage, sessionStorage, states, calls, client, load,
+    fetch: async () => Response.json({ exists: true, history, memory: ['remember'] }),
+    setUser: u => { currentUser = u; }, emit: (event, u) => listeners.forEach(fn => fn(event, u ? { user: u } : null)),
+    render(file, props = {}) { cursor = 0; const tree = load(file).default(props); mounted = true; return tree; },
+    async mount(file, props) { const tree = this.render(file, props); effects.splice(0).forEach(fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }); await flush(); return tree; },
+    unmount() { cleanups.forEach(fn => fn()); } };
+  return h;
+}
+function find(tree, text) {
+  if (!tree || typeof tree !== 'object') return null;
+  if (tree.type === 'button' && tree.props.children === text) return tree;
+  for (const child of [tree.props?.children].flat(Infinity)) { const match = find(child, text); if (match) return match; }
+  return null;
+}
+test('email save checkpoints history and memory before updateUser', async () => {
+  const h = harness();
+  h.fetch = async (_url, options) => { h.calls.push('save');
+    const body = JSON.parse(options.body);
+    assert.equal(body.expectedUserId, 'a'); assert.equal(body.saveAnonymous, true);
+    assert.deepEqual(body.history, history); assert.deepEqual(body.memory, ['remember']);
+    return Response.json({ synced: true }); };
+  await h.mount('app/account/page.tsx'); h.states[2] = 'test@example.test';
+  await find(h.render('app/account/page.tsx'), 'メールで保存する').props.onClick();
+  assert.deepEqual(h.calls, ['save', 'email']); assert.equal(h.localStorage.getItem(pendingKey), 'a');
+});
+test('failed checkpoint never sends confirmation email', async () => {
+  const h = harness(); h.fetch = async () => new Response('', { status: 500 });
+  await h.mount('app/account/page.tsx'); h.states[2] = 'test@example.test';
+  await find(h.render('app/account/page.tsx'), 'メールで保存する').props.onClick();
+  assert.ok(!h.calls.includes('email')); assert.equal(h.localStorage.getItem(pendingKey), null);
+});
+test('account switch during checkpoint never updates another user email', async () => {
+  const h = harness(); h.fetch = async () => { h.setUser({ id: 'b', is_anonymous: true }); return Response.json({}); };
+  await h.mount('app/account/page.tsx'); h.states[2] = 'test@example.test';
+  await find(h.render('app/account/page.tsx'), 'メールで保存する').props.onClick();
+  assert.ok(!h.calls.includes('email'));
+});
+test('confirmation in a fresh tab preserves same-user cache and gates chat hydration', async () => {
+  const h = harness({ id: 'a', is_anonymous: false });
+  const tree = await h.mount('app/chat/anonymous-session-guard.tsx', { children: 'chat' });
+  assert.equal(tree.type, 'main'); assert.equal(h.states[0], true);
+  assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history);
+  assert.deepEqual(h.calls, []);
+});
+test('pending email save keeps the anonymous user when a fresh tab opens', async () => {
+  const h = harness(undefined, { [pendingKey]: 'a' });
+  await h.mount('app/chat/anonymous-session-guard.tsx', { children: 'chat' });
+  assert.deepEqual(h.calls, []); assert.equal(h.localStorage.getItem(ownerKey), 'a');
+});
+test('ordinary expired anonymous browser session still clears all misaki caches', async () => {
+  const h = harness(undefined, { 'misaki-today-memory': 'old', unrelated: 'keep' });
+  await h.mount('app/chat/anonymous-session-guard.tsx');
+  assert.deepEqual(h.calls, ['signOut', 'signIn']);
+  assert.equal(h.localStorage.getItem('misaki-chat-history'), null);
+  assert.equal(h.localStorage.getItem('misaki-today-memory'), null);
+  assert.equal(h.localStorage.getItem('unrelated'), 'keep'); assert.equal(h.localStorage.getItem(ownerKey), 'new');
+});
+test('different permanent user clears previous conversation and memory', async () => {
+  const h = harness({ id: 'b', is_anonymous: false }, { [pendingKey]: 'a' });
+  await h.mount('app/chat/anonymous-session-guard.tsx');
+  assert.equal(h.localStorage.getItem('misaki-chat-history'), null);
+  assert.equal(h.localStorage.getItem('misaki-long-term-memory'), null);
+  assert.equal(h.localStorage.getItem(pendingKey), null); assert.equal(h.localStorage.getItem(ownerKey), 'b');
+});
+test('logout clears caches in both storage areas and remounts mounted chat', async () => {
+  const h = harness({ id: 'a', is_anonymous: false }, {}, { 'misaki-browser-session': '1', 'misaki-test': 'secret' });
+  await h.mount('app/chat/anonymous-session-guard.tsx'); h.emit('SIGNED_OUT', null);
+  assert.equal(h.localStorage.length, 0); assert.equal(h.sessionStorage.length, 0); assert.ok(h.calls.includes('reload'));
+});
+test('server response after user switch cannot write old account history', async () => {
+  const h = harness({ id: 'a', is_anonymous: false });
+  h.fetch = async () => { h.setUser({ id: 'b', is_anonymous: false }); return Response.json({ exists: true, history: [], memory: [] }); };
+  await h.mount('app/chat/conversation-history-sync.tsx');
+  assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history); assert.deepEqual(h.calls, []);
+});
+test('missing or malformed saved server state cannot erase checkpoint cache', async () => {
+  for (const server of [{ exists: false, history: [], memory: [] }, {}]) {
+    const h = harness({ id: 'a', is_anonymous: false }, { [pendingKey]: 'a' });
+    h.fetch = async () => Response.json(server);
+    await h.mount('app/chat/conversation-history-sync.tsx');
+    assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history);
+    assert.equal(h.localStorage.getItem(pendingKey), 'a');
+  }
+});
+test('API rejects foreign expected user ID and accepts memory-only explicit save', async () => {
+  const h = harness(); const route = h.load('app/api/persona/history/route.ts');
+  const request = body => new Request('https://example.test/api/persona/history', {
+    method: 'POST', headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
+  assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: 'b', history, memory: [] }))).status, 409);
+  assert.equal(h.calls.length, 0);
+  assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: 'a', history: [], memory: ['remember'] }))).status, 200);
+  assert.equal(h.calls[0].name, 'save_anonymous_conversation_state');
+  h.setUser({ id: 'a', is_anonymous: false });
+  assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: 'a', history, memory: [] }))).status, 409);
+});

```

