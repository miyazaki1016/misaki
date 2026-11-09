# Safariで正常な匿名会話が消える可能性を防ぐ

[PR原本](https://github.com/miyazaki1016/misaki/pull/4)

**目的：** 会話や記憶・関係性を扱う処理の変更

**実装状態：** 変更差分を取得。実装の受入完了は未認定

**検証の扱い：** Actionsの成否は実行単位の事実。製品の受入検証とは別

**PR状態：** merged

**main統合：** mainに祖先コミットとして存在（機能受入・本番は別）

**本番反映：** 未確認（main統合／Vercelプレビューから推定しない）

**残課題：** 受入条件・未解決事項をPR本文、レビュー、台帳と照合

**次の作業：** 類似コード・既存結論を確認し、未解決条件だけを次の作業にする

根拠取得日時 (UTC)：2026-11-09T08:56:52.743400+00:00

## 日本語で確認した成果

Safariで正常な匿名会話が消える可能性を防ぐ

日本語見出しは変更目的の案内。受入完了・本番反映の認定ではない。差分・検証・残課題を原本で確認。

- [根拠](https://github.com/miyazaki1016/misaki/pull/4)

## 実際の変更処理（コードから抽出）

AUTH_KIND_KEY、AnonymousSessionGuard、BROWSER_SESSION_KEY、LEGACY_OWNERLESS_CLEANUP_KEY、active、deviceOwner、hadBrowserSession、initialized、lastAuthKind、legacyCleanupDone、pendingOwner、pendingSave、reconcileAuth、user

- 条件分岐・閾値：`const LEGACY_OWNERLESS_CLEANUP_KEY = &quot;legacy-ownerless-cache-cleanup-v1&quot;;`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/6a4eb039d356fe81262e1c55f870f563eaf51404/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!legacyCleanupDone) {`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/6a4eb039d356fe81262e1c55f870f563eaf51404/app/chat/anonymous-session-guard.tsx)）
- 条件分岐・閾値：`if (!deviceOwner &amp;&amp; !pendingSave) {`（[app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/6a4eb039d356fe81262e1c55f870f563eaf51404/app/chat/anonymous-session-guard.tsx)）
- [app/chat/anonymous-session-guard.tsx](https://github.com/miyazaki1016/misaki/blob/6a4eb039d356fe81262e1c55f870f563eaf51404/app/chat/anonymous-session-guard.tsx)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text
実機Safariで、操作していないのに匿名会話が真っさらになる事象が発生しました。

旧Safari向けの「所有者不明キャッシュ削除」が、所有者マーカーが一時的に欠けた場合にも毎回走り得る状態だったため、レガシー移行処理をブラウザごとに一度だけ実行するよう変更します。

- 未移行の旧Safariで ownerless cache が残っている場合は従来どおり一度だけ削除
- 移行済みブラウザでは、所有者マーカーの一時欠落だけでライブ会話を削除しない
- メール保存中の pending state は従来どおり保護
- ブラウザを閉じた後の匿名セッション再作成ロジックは変更しない

本番mainは直接変更せず、Preview確認後にマージします。
```

## ソース・テスト・資料の抜粋（実行はしない）

### app/chat/anonymous-session-guard.tsx

```text
diff --git a/app/chat/anonymous-session-guard.tsx b/app/chat/anonymous-session-guard.tsx
index 3cb5bb4..aad1c16 100644
--- a/app/chat/anonymous-session-guard.tsx
+++ b/app/chat/anonymous-session-guard.tsx
@@ -6,6 +6,9 @@ import { bindDeviceUser, clearMisakiDeviceData, DEVICE_USER_KEY, EMAIL_SAVE_USER
 
 const AUTH_KIND_KEY = "misaki-auth-kind";
 const BROWSER_SESSION_KEY = "misaki-browser-session";
+// This marker intentionally does not use the misaki- prefix because
+// clearMisakiDeviceData() removes every misaki-* key.
+const LEGACY_OWNERLESS_CLEANUP_KEY = "legacy-ownerless-cache-cleanup-v1";
 
 export default function AnonymousSessionGuard({ children }: { children: ReactNode }) {
   const [ready, setReady] = useState(false);
@@ -20,16 +23,21 @@ export default function AnonymousSessionGuard({ children }: { children: ReactNod
         const lastAuthKind = localStorage.getItem(AUTH_KIND_KEY);
         const deviceOwner = localStorage.getItem(DEVICE_USER_KEY);
         const pendingOwner = localStorage.getItem(EMAIL_SAVE_USER_KEY);
+        const legacyCleanupDone = localStorage.getItem(LEGACY_OWNERLESS_CLEANUP_KEY) === "1";
         const { data, error } = await supabase.auth.getSession();
         if (error) throw error;
         if (!active) return;
         let user = data.session?.user ?? null;
         const pendingSave = Boolean(user && pendingOwner === user.id);
 
-        // Legacy builds could leave conversation/memory behind without an owner marker.
-        // Never attach ownerless caches to a newly reconciled anonymous/permanent user.
-        if (!deviceOwner && !pendingSave) {
-          clearMisakiDeviceData();
+        // Old builds could leave conversation/memory behind without an owner marker.
+        // Clean that legacy state only once. After this browser has been migrated,
+        // a temporarily missing owner marker must never erase a live conversation.
+        if (!legacyCleanupDone) {
+          if (!deviceOwner && !pendingSave) {
+            clearMisakiDeviceData();
+          }
+          localStorage.setItem(LEGACY_OWNERLESS_CLEANUP_KEY, "1");
         }
 
         // Supabase の匿名セッション自体は localStorage に残るため、

```

