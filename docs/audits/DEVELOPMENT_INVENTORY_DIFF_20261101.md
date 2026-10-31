# 2026-11-01 差分照合・第一段階（読み取り）

- 現行ブランチ109本（main含む）。詳細台帳 `docs/DEVELOPMENT_REGISTRY.md`（専用ブランチ）の**文字列検索**で108作業ブランチ中93本の名称を確認、15本は名称の完全一致なし。
- **注意**：名称未記載は「未登録作業」「未完成」を証明しない。旧名、別資料、PR、main総覧に存在する可能性がある。
- 名称未記載15本：
- `chore/development-inventory-automation-20261031`
- `design/anonymous-per-item-24h-memory-20261030`
- `docs/development-registry-audit-20261020`
- `docs/misaki-memory-public-final-20261030`
- `feat/lounge-chat-handoff-20261030`
- `feat/lounge-encounter-shortcut-20261030`
- `feat/lounge-minimal-navigation-20261030`
- `feat/lounge-muse-v3-official-20261030`
- `feat/lounge-muse-v3-preview-20261030`
- `feat/lounge-opening-fullscreen-20261029`
- `feat/lounge-portrait-preview-20261030`
- `feat/lounge-shortcut-preview-20261030`
- `feat/lounges-autoload-assets-20261029`
- `fix/lounge-js-syntax-tap-20261030`
- `fix/lounge-transition-flash-20261030`

次：15本を優先してmain総覧・PR・専用資料と照合し、作業単位で索引化。実装状態は現段階すべて未判定（U）。

## 第二段階：ブランチ内容の実物確認

| 作業 | main比較（調査時点） | 実物の証拠 | 暫定分類・次の確認 |
| --- | --- | --- | --- |
| 匿名情報ごと24時間記憶 | `design/anonymous-per-item-24h-memory-20261030` ahead 1 / behind 0 | `docs/ANONYMOUS_MEMORY_24H_DESIGN_20261030.md` の設計のみ | **D**（設計）。実装は未確認。 |
| ラウンジ→チャット接続 | `feat/lounge-chat-handoff-20261030` ahead 3 / behind 4 | `docs/LOUNGE_SHORTCUT_PREVIEW_20261030.md`、ラウンジHTML2件 | **C暫定**（試作・実機未検証）。現行mainへの採用状況は別途照合。 |
| 縦型オープニング | `feat/lounge-opening-fullscreen-20261029` ahead 2 / behind 10 | `docs/LOUNGE_VIDEO_INTEGRATION_LEDGER_20261029.md`、ラウンジHTML | **C暫定**（試作）。古い資料の未配置記述は追記で更新されており、最終状態を要確認。 |
| Muse V3ラウンジ | `feat/lounge-muse-v3-official-20261030` ahead 3 / behind 5 | `docs/LOUNGE_MUSE_V3_PREVIEW_20261030.md`、ラウンジHTML2件 | **U**。名称だけで公式採用・本番反映を認定しない。 |
| 画面切替時のフラッシュ | `fix/lounge-transition-flash-20261030` ahead 3 / behind 3 | ラウンジHTML2件とショートカット資料 | **U**。PR・現行mainと差分照合が必要。 |
| 記憶・公開方針資料 | `docs/misaki-memory-public-final-20261030` ahead 1 / behind 0 | 記憶方針文書と `docs/DEVELOPMENT_REGISTRY.md` を含む4ファイル | **D暫定**。既存詳細台帳を置き換えない。 |

※ ahead/behindはGit ancestryであり、未統合機能数・完成度を表さない。2026-11-01の読み取り結果。既存台帳の評価を上書きしない。
