# 美咲 自動棚卸し用の運用索引

> **人が更新する案件の状態・担当・次の一手は [開発台帳](DEVELOPMENT_LEDGER.md) に集約。** この索引は既存の自動棚卸しが参照する案件ID・照合名・パスと、GitHubから取得した事実を保持する。

| ID | 照合名 | 照合用の所在 |
| --- | --- | --- |
| M-01 | ラウンジ→オープニング→チャット | `docs/DEVELOPMENT_LEDGER.md` / `experiment/transparent-lounge-20261027` |
| M-02 | 旧会話入力・性能計測 | `docs/audits/CHAT_METRICS_PATH_20261101.md` |
| M-03 | 会話コンテキスト圧縮・旧migration | `docs/audits/LEGACY_CODE_DIFF_20261101.md` |
| M-04 | 外部AIレビュー用Preview | `docs/audits/FEATURE_RECONCILIATION_20261101.md` |
| M-05 | 旧監査証拠 | `docs/audits/LEGACY_AUDIT_FOLLOWUP_20261101.md` |
| M-06 | 旧Safari・関係性診断ブランチ2件 | `docs/audits/BRANCH_TRIAGE_20261101.md` |

自動取得は確認候補。案件の進捗・本番状態を自動確定しない。旧運用手順と状態は[整理前の運用索引](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/DEVELOPMENT_OPERATIONS_INDEX.md)で確認できる。

<!-- OPERATIONS_INVENTORY_START -->
## GitHub自動棚卸し（確認用の事実）

> これはPRの状態だけを示し、開発完了・本番反映・実装重複を意味しません。

開発台帳: [DEVELOPMENT_LEDGER.md](DEVELOPMENT_LEDGER.md)

| Open PR | タイトル | Head branch |
|---|---|---|
| #30 | 旧schema互換の先行maintenance/drain設備を独立追加 | codex/legacy-maintenance-drain |
| #31 | 関係時間v2: 内容理解から感情・行動・自発性まで統合 | sora/relationship-time-v2-design |
| #60 | Document Relationship Engine v1.2 Stage and growth principles | docs/relationship-v1-2-stage-growth-principles |
| #66 | Forget Control v1: canonical忘却と確認付き再学習 | work/forget-control-v1 |
| #67 | Relationship Identity v1: canonical persistence, continuity and migration audit | work/relationship-identity-v1 |
| #78 | Test isolated conversation replay adapter | work/context-no-duplicate-replies-ab |
| #79 | docs: multi-character data scope inventory | docs/multi-character-data-scope-inventory |
| #80 | docs: audit multi-character RPC callers | docs/multi-character-rpc-caller-audit |
| #81 | docs: reconcile production source-of-truth and management drift | docs/production-source-of-truth-reconciliation |
| #83 | test: compare canonical relationship acting instructions | test/relationship-acting-state-comparison |
| #84 | docs: 5軸成長速度とRelationship Engine思想の照合を総覧へ追記 | docs/relationship-five-axis-design-review-20261015 |
| #85 | experiment: 5軸の中間成長を表現するInterpreter比較案（本番未接続） | experiment/interpreter-gradual-acting-20261015 |
| #86 | experiment: offline multi-turn conversation lab foundation (no Gemini/DB) | experiment/conversation-lab-offline-v1-20261015 |
| #87 | design: shared Misaki conversation engine for production and tuning lab | design/shared-conversation-engine-contract-20261015 |
| #88 | refactor: pure conversation history adapter (first shared engine seam) | experiment/shared-conversation-history-v1-20261015 |
| #100 | 設計: 匿名の情報別24時間記憶とGemini軽量化の安全な実装順序 | design/anonymous-per-item-24h-memory-20261030 |
| #165 | docs: 美咲のバックアップ対象と安全な復元試験の設計 | docs/backup-restore-inventory-20261105 |
| #182 | feat(history): iPhone履歴読み込みのDB段階別計測 (#181) | feat/history-stage-timing-20261111 |
| #190 | P0 期限切れ匿名rootの安全な物理削除 | work/anonymous-expired-root-purge |
| #191 | P0 匿名会話履歴の推論入力に24時間期限を適用 | work/anonymous-history-24h |
| #192 | 美咲エンジン総点検とP0の検証結果を開発台帳に記録 | docs/engine-audit-102-20261112 |
| #193 | P0 統合 — 匿名個別記憶の24時間期限と感情v2の再開 | work/p0-engine-integration |
| #194 | test: add bounded synthetic context A/B quality evaluation (#184) | work/context-ab-quality-budget-guard-184 |

全ブランチのmain差分と滞留候補はGitHub Actionsのdevelopment-inventory成果物を参照。
既存案件ID・判断欄は変更しません。

<!-- OPERATIONS_INVENTORY_END -->
