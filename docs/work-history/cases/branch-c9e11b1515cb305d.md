# codex/legacy-maintenance-drain

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** ブランチ差分（PR関連あり）

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

関連PR：[#30](https://github.com/miyazaki1016/misaki/pull/30)

根拠取得日時 (UTC)：2026-11-10T02:50:24.064930+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [.github/workflows/legacy-drain.yml](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/.github/workflows/legacy-drain.yml)：同一HEADのPR案件に原文収録
- [app/api/chat-proxy/route.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/api/chat-proxy/route.ts)：同一HEADのPR案件に原文収録
- [app/api/chat/route.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/api/chat/route.ts)：同一HEADのPR案件に原文収録
- [app/api/persona/evolution/analyze/route.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/api/persona/evolution/analyze/route.ts)：同一HEADのPR案件に原文収録
- [app/api/persona/history/route.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/api/persona/history/route.ts)：同一HEADのPR案件に原文収録
- [app/api/push/body-clock/route.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/api/push/body-clock/route.ts)：同一HEADのPR案件に原文収録
- [app/api/push/test/route.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/api/push/test/route.ts)：同一HEADのPR案件に原文収録
- [app/chat/conversation-history-sync.tsx](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/chat/conversation-history-sync.tsx)：同一HEADのPR案件に原文収録
- [app/chat/page.tsx](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/app/chat/page.tsx)：同一HEADのPR案件に原文収録
- [docs/IMPLEMENTATION_OVERVIEW.md](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/docs/IMPLEMENTATION_OVERVIEW.md)：同一HEADのPR案件に原文収録
- [docs/LEGACY_MAINTENANCE_DRAIN.md](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/docs/LEGACY_MAINTENANCE_DRAIN.md)：同一HEADのPR案件に原文収録
- [docs/WRITE_SURFACE_INVENTORY.md](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/docs/WRITE_SURFACE_INVENTORY.md)：同一HEADのPR案件に原文収録
- [lib/legacy-browser-drain.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/lib/legacy-browser-drain.ts)：同一HEADのPR案件に原文収録
- [lib/legacy-drain.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/lib/legacy-drain.ts)：同一HEADのPR案件に原文収録
- [package-lock.json](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/package-lock.json)：同一HEADのPR案件に原文収録
- [package.json](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/package.json)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/index.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/supabase/functions/body-clock/index.ts)：同一HEADのPR案件に原文収録
- [supabase/functions/body-clock/legacy-drain.ts](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/supabase/functions/body-clock/legacy-drain.ts)：同一HEADのPR案件に原文収録
- [supabase/legacy-maintenance-drain.sql](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/supabase/legacy-maintenance-drain.sql)：同一HEADのPR案件に原文収録
- [tests/account-conversation.test.cjs](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/tests/account-conversation.test.cjs)：同一HEADのPR案件に原文収録
- [tests/legacy-drain.browser.test.cjs](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/tests/legacy-drain.browser.test.cjs)：同一HEADのPR案件に原文収録
- [tests/legacy-drain.db.test.cjs](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/tests/legacy-drain.db.test.cjs)：同一HEADのPR案件に原文収録
- [tests/legacy-drain.edge.test.cjs](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/tests/legacy-drain.edge.test.cjs)：同一HEADのPR案件に原文収録
- [tests/legacy-drain.routes.test.cjs](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/tests/legacy-drain.routes.test.cjs)：同一HEADのPR案件に原文収録
- [tests/legacy-schema.fixture.sql](https://github.com/miyazaki1016/misaki/blob/17449c7ec4e8ff50605ef931b04ae76584c6304f/tests/legacy-schema.fixture.sql)：同一HEADのPR案件に原文収録

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

