# 全ブランチ文書棚卸し・実測ログ（2026-10-21）

目的：92ブランチそれぞれの全ドキュメント（.md/.mdx/.rst/.txt、docs/以外も含む）をGitHub Trees API recursive=1で列挙し、パスとblob SHAを照合する。これは進捗ログであり、全件完了の証明ではない。

## 実測状況
- GitHub branches API: 92枝取得（per_page=100）。
- Trees APIによる個別検証：**8/92枝**。いずれも `truncated=false`。
- 監査基準HEAD: `b7ef7eb44bcf9d33bf4b091bf17ae8b409062a11`（調査開始時）。
- 残り84枝：未列挙。文書本文の精査・mainとの差分照合は未完了。

| ブランチ | 文書数 | 特記 |
|---|---:|---|
| chore/restore-relationship-rpc-migration | 9 | 復元用、再適用禁止 |
| cleanup/legacy-proactive-tags | 1 | supabase/BODY_CLOCK.md |
| cleanup/remove-legacy-proactive-path | 2 | overview旧版 |
| codex/legacy-maintenance-drain | 4 | **BLOCKED**、LEGACY_MAINTENANCE_DRAIN.md・WRITE_SURFACE_INVENTORY.mdを含む |
| codex/server-canonical-foundation | 3 | overview旧版 |
| design/shared-conversation-engine-contract-20261015 | 10 | SHARED_CONVERSATION_ENGINE_DESIGN_20261015.mdを含む |
| docs/audit-overview-against-source | 2 | overview別SHA |
| docs/development-registry-audit-20261020 | 13 | 引継ぎ・基本構想・台帳・追跡表を含む |

## 初期の文書差分・取りこぼし候補
- `docs/LEGACY_MAINTENANCE_DRAIN.md` と `docs/WRITE_SURFACE_INVENTORY.md` は、少なくとも監査ブランチHEADの13文書に含まれない。BLOCKED理由の保存・検証が必要。
- `docs/SHARED_CONVERSATION_ENGINE_DESIGN_20261015.md` は監査ブランチHEADに含まれない。設計文書として要全文確認。
- `docs/IMPLEMENTATION_OVERVIEW.md` は複数のblob SHAが存在し、同名でも内容が異なる。最新版だけを読んで全履歴を把握したとは扱わない。
- `supabase/BODY_CLOCK.md` も文書に含める。ただし本番Supabaseへの接続・変更は行わない。

## 次の作業
残り84枝のTreeを列挙し、全ファイルのpath/blob SHA、固有文書、版違いを一覧化する。その後、固有文書・差分文書を読み、実装総覧・開発台帳と突合する。main、Production、Supabase、デプロイ、PRマージ、ブランチ削除は変更しない。
