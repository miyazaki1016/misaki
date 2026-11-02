# 美咲 開発台帳（mainから辿るための索引）

> **最新の交通整理表**：[開発案件・担当・次の一手の運用索引](DEVELOPMENT_OPERATIONS_INDEX.md)（2026-11-01時点。実装・本番の完了認定ではない）。

> **このファイルは詳細台帳の代替ではない。** 2026-10-31時点の管理入口を追加するためのもの。実装・統合・本番反映を新たに認定しない。

[実装・修正総覧](IMPLEMENTATION_OVERVIEW.md) · [共通運用規約](DEVELOPMENT_MANAGEMENT_STANDARD.md)

## 既存棚卸しの正本

- 専用ブランチ: `docs/development-registry-audit-20261020`
- 詳細台帳: `docs/DEVELOPMENT_REGISTRY.md`（**この専用ブランチから取得すること**）
- 追加の監査資料: 同ブランチの `docs/audits/20261021-work-all-assets/` ほか。
- 継続更新規約: 同ブランチの `docs/development-ledger-continuous-update-rule-20261023.md`。
- 詳細台帳は2026-10-20開始の棚卸し途中の記録。記載の91ブランチは当時の調査母集団であり、現在の総数ではない。
- 専用ブランチはmainと分岐しており、監査ファイルや未公開実装が混在する可能性がある。**ブランチ全体をmainへマージしないこと。**

## 判定区分

A: main実装確認 / B: ブランチ実装・main未確認 / C: 実験・検証不足 / D: 設計・監査のみ / U: 未判定。

**Aも本番反映の保証ではない。** Preview・CI・過去のPR説明だけで本番状態を確定しない。

## 優先して照合する作業（過去の棚卸しに記録あり）

| 作業 | 過去記録の所在 | 次の確認 |
| --- | --- | --- |
| Forget Control v1 | `work/forget-control-v1`, PR #66 | 現行main・関連migration・本番適用の実体を再照合 |
| Relationship Identity | PR #67、詳細台帳 | 保存・復元・migrationの実体と統合状態を再照合 |
| Conversation Lab | PR #86、詳細台帳 | 実験結果と本番利用の区別を確認 |
| 共通会話エンジン | PR #88、詳細台帳 | main依存経路と検証の実体を確認 |
| 美咲単独版入口・ラウンジ・チャット | 過去のローカルコミット `7f42677` | リモート存在、Preview、公開前レビューを確認。ここでは本番反映を認定しない |
| 全ブランチ棚卸し | `docs/development-registry-audit-20261020` | 最新ブランチ・open/closed PRと照合して追加分を分類 |

※ この表は既存資料への入口であり、最新実装の判定結果ではない。

## 自動棚卸し

- 実装案: `scripts/development_inventory.py`
- 週次ワークフロー案: `.github/workflows/development-inventory.yml`
- レポートは**未登録・放置の可能性を示す候補**。PRのないブランチを未完了と断定しない。
- 詳細は[共通運用規約](DEVELOPMENT_MANAGEMENT_STANDARD.md)を参照。

## 次の一手

1. 詳細台帳と全ブランチの最新head・PR状態を突き合わせ、前回棚卸し以降の変更を分類する。
2. 既存の詳細証拠を消さずに、作業ID／状態／証拠／未確認／次の一手の索引を拡充する。
3. 自動レポートの誤検知を検証し、ユーザー承認後にワークフローをmainへ統合する。

## 2026-11-01 差分棚卸しの起点（読み取り確認）

- GitHubブランチ検索で **109ブランチ（main含む）** を取得。過去の詳細台帳に記載された91ブランチは当時の母集団であり、差分の厳密な件数ではない。削除・改名・追加の可能性を区別してから照合する。
- 現行の新しい作業候補として `feat/lounge-chat-handoff-20261030`、`feat/lounge-opening-fullscreen-20261029`、`feat/lounge-muse-v3-official-20261030`、`fix/lounge-transition-flash-20261030`、`experiment/transparent-lounge-20261027` を確認。**ブランチ存在のみ確認済み、main統合・実機・本番は未判定（U）**。
- 既存の詳細台帳 `docs/DEVELOPMENT_REGISTRY.md` は専用ブランチのまま保持し、上記の新規候補との重複と証拠を確認してから索引へ正式登録する。
- 管理用PR #103 のオフライン回帰テストは2026-11-01確認時点で成功。これはGitHub実データ棚卸しの実行成功を意味しない。
- 次の一手：詳細台帳の記載済み作業IDと現在の109ブランチを照合し、追加・更新・所在不明を分類。ラウンジ系の詳細資料とPRを確認し、未確認項目を勝手に完了扱いしない。

## 2026-11-01 証拠付き作業索引（初回・暫定）

以下は作業単位の入口。2026-11-01のGitHub読み取り結果であり、状態の最終認定ではない。詳細は `docs/audits/DEVELOPMENT_INVENTORY_DIFF_20261101.md`。main・本番・DB・実機は個別の確認がない限り**未確認**。

| ID | 作業 | 状態 | 所在・証拠 | main / 本番 / 実機 | 次の一手 |
| --- | --- | --- | --- | --- | --- |
| M-LNG-01 | ラウンジ・オープニング・チャット遷移（関連ブランチを1作業群として管理） | C暫定 | `feat/lounge-chat-handoff-20261030`, `feat/lounge-opening-fullscreen-20261029`, `feat/lounge-muse-v3-official-20261030`, `fix/lounge-transition-flash-20261030`; `docs/LOUNGE_SHORTCUT_PREVIEW_20261030.md`, `docs/LOUNGE_VIDEO_INTEGRATION_LEDGER_20261029.md` | 未確認 / 未確認 / 未確認 | mainとの差分と素材・遷移を統合的に確認。既存チャットや本番を変更しない |
| M-MEM-01 | 匿名情報単位24時間記憶 | D | `design/anonymous-per-item-24h-memory-20261030`; `docs/ANONYMOUS_MEMORY_24H_DESIGN_20261030.md` | 未確認 / 未確認 / 未確認 | 実装着手時は時刻境界と既存記憶の互換を検証 |
| M-MEM-02 | 記憶の公開方針・台帳補足 | D暫定 | `docs/misaki-memory-public-final-20261030` | 未確認 / 未確認 / 未確認 | 既存詳細台帳との記載差分のみ照合 |
| M-CONV-01 | Conversation Lab | C暫定 | Draft PR #86（open、未マージ、2026-11-01確認） | 未確認 / 未確認 / 未確認 | 実験と本番採用を区別して検証 |
| M-CONV-02 | 共通会話エンジンの接続基盤 | C暫定 | Draft PR #88（open、未マージ、2026-11-01確認） | 未確認 / 未確認 / 未確認 | 現行mainの依存経路を検証 |

※ PR #103は管理用Draft PRであり、機能実装の採用とは別。未確認を未実施と読み替えない。

## 2026-11-01 既存詳細台帳との重複解消

- **M-CONV-01 / M-CONV-02は新規未完了作業ではなく、既存詳細台帳の既知案件。** `docs/development-registry-audit-20261020` 上の `docs/DEVELOPMENT_REGISTRY.md` にConversation Lab PR #86と共通会話エンジン PR #88の実装・検証・未採用理由が既に記録されている。今回の索引は**再調査の指示ではなく既存証拠への入口**として扱う。
- 2026-11-01時点でPR #86 / #88ともopen Draft・未マージ。詳細台帳にある過去のCI・Previewの成功は消さず、現在のmain/本番採用とは区別する。
- **M-LNG-01は複数の同一HTML変更を一作業群として管理。** 既存詳細台帳の2026-10-26静的ラウンジ試作とは時点・対象が異なるため、過去の記録を残したまま2026-10-29〜30の新しいブランチを追加証拠とする。
- `design/anonymous-per-item-24h-memory-20261030` は資料に**未実装**と明記。設計Dを維持し、匿名記憶の実装完了とは扱わない。
- 今後の追加調査は **ラウンジの現在の統合状態、最近の記憶設計との差分**に絞る。既存Conversation Lab/共通会話エンジンの全面再監査は行わない。

## 共通フィールドへの補足（2026-11-01）

上の初回索引の `main / 本番 / 実機` は簡易表示であり、共通規約の正式フィールドは **main統合／本番デプロイ／DB適用／実機確認** の4項目。索引中の各行について、**DB適用はすべて今回未確認**。本番・実機も既存詳細台帳に証拠がある場合はその記録を優先し、未確認を未実施と読み替えない。更新確認日：2026-11-01。正式な状態認定は関連PR・main・詳細証拠との照合後に行う。


## 2026-11-01 棚卸し・ブランチ差分調査
- [調査証拠・判断・未解決事項](audits/INVENTORY_RECONCILIATION_20261101.md)（GitHub/本番DBの読み取り確認。アプリ・DB・Push・本番変更なし）。


## 2026-11-01 旧監査ブランチの追加照合
- [旧監査ブランチの証拠・未確認事項](audits/LEGACY_AUDIT_FOLLOWUP_20261101.md)。過去snapshotと現行状態を区別し、旧ブランチは未削除・未merge。


## 2026-11-01 未整理ブランチの一次分類
- [PR履歴未紐付けブランチの保全・照合・整理候補分類](audits/BRANCH_TRIAGE_20261101.md)。削除やコード取り込みの承認ではない。


## 2026-11-01 機能単位の追加照合
- [mainと旧ブランチの実ファイル照合](audits/FEATURE_RECONCILIATION_20261101.md)（アメふる旧履歴Deep Linkのmain実装を再確認。過去の暫定懸念を訂正）。


## 2026-11-01 旧実験コードの照合
- [旧実験コードとmainの比較記録](audits/LEGACY_CODE_DIFF_20261101.md)。実装採用・DB変更は別途判断。


## 2026-11-01 旧テスト・計測ソースの追加照合
- [会話計測の旧実験コードを確認](audits/TEST_CASE_RECONCILIATION_20261101.md)。文字数診断とトークン計測は区別し、実装採用は未判断。


## 2026-11-01 現行処理経路の追加確認
- [現行コード経路の静的調査](audits/CHAT_METRICS_PATH_20261101.md)。コード・DB・本番環境は無変更。

<!-- INVENTORY_FACTS_START -->
## GitHub自動取得の事実（確認用）

> この欄はPRメタデータの記録であり、開発完了・本番反映の認定ではありません。

| PR | タイトル | 状態 | head SHA | 更新日時 |
| --- | --- | --- | --- | --- |
| #1 | 匿名会話と記憶をメール確認前に同じユーザーへ保存する | merged | `27e83d2366de22053a7f41d62b77cfe6d7a748a8` | 2026-09-17T05:26:43Z |
| #2 | 旧Safariに残った所有者不明の会話キャッシュを破棄する | merged | `0546426c9802665413ff47a16ad56f5cd7bb91b5` | 2026-09-17T05:46:28Z |
| #3 | GeminiのJSON解析失敗時に会話生成を自動再試行する | merged | `f93a9444565ce1029cd46c0d466456f651ee7c9e` | 2026-09-17T07:12:55Z |
| #4 | Safariで正常な匿名会話が消える可能性を防ぐ | merged | `6a4eb039d356fe81262e1c55f870f563eaf51404` | 2026-09-17T07:47:04Z |
| #5 | 記憶確認の質問でも直近の会話履歴を保持する | merged | `1fdd4d44a4ee53bcbda48e27d4065dc5f39cf7bc` | 2026-09-17T08:03:40Z |
| #6 | 記憶確認では直近の会話履歴を明示的に参照する | merged | `29d74e3483d4f06f5127364d7c5bdf528826301b` | 2026-09-17T08:18:27Z |
| #7 | 実機から会話履歴の受信状況を診断できるようにする | merged | `47f39994a79e68fa47cbe5234ba75ce2a19d5965` | 2026-09-17T08:33:19Z |
| #8 | 記憶確認時に直近会話を回答根拠として再提示する | merged | `475410541b700562e0f535484cb3fd02d9f76b1a` | 2026-09-17T08:47:13Z |
| #9 | 記憶回答の矛盾防止と診断コードを整理する | merged | `a06baac8110ded425c07e2122117e89460868405` | 2026-09-17T09:12:18Z |
| #10 | proxy再試行による利用回数の二重消費を防ぐ | merged | `7ba84c4d18e3f5b3ae012bd8b31eacebb0162f3a` | 2026-09-17T09:19:45Z |
| #11 | Safariで通信例外を美咲の発言として表示しない | merged | `08ee64b09567900a5abd8e557c74d3a8cd16961e` | 2026-09-17T12:32:42Z |
| #12 | 自発メッセージの表現タグを感情・行動判断から派生させる | merged | `9d2d6257e845b61f8e3b8b68db63eabf56bafc86` | 2026-09-17T13:49:47Z |
| #13 | 旧自発APIの独立タグ推論を廃止する | merged | `275529187bc54a7151de3aa06ed4c6b07362d1fd` | 2026-09-17T14:00:30Z |
| #14 | 自発メッセージの行動状態と表現タグの優先関係を調整する | merged | `693bb5822e1f0de7c409e844ae3f1285458af0ab` | 2026-09-17T14:06:52Z |
| #15 | sleepyを深夜の身体状態タグとして正式化する | merged | `d6bdfd46f09d52c2cc432a01e36af324ec63f5f5` | 2026-09-17T14:17:20Z |
| #16 | Body Clock claim RPCの実行エラーを修正する | merged | `df2daf89f604bf80fab4e720060861862bdd2f6f` | 2026-09-17T14:37:00Z |
| #17 | iPhoneで直前のチャットが消える同期競合を修正する | merged | `9bfa64985c390c0f2e0276d4e5b45c9071e4fb08` | 2026-09-17T15:58:10Z |
| #18 | 会話同期で同じチャットターンが二重保存されるのを防ぐ | merged | `017b94c1cf2c3f7d8340a3a59f572d1a012de5e5` | 2026-09-17T16:48:38Z |
| #19 | チャット返答失敗時に回数を戻してエラーを表示する | merged | `2cee1b7722cfe2e20d2b063226ba3d0b03522784` | 2026-09-17T23:10:25Z |
| #20 | ユーザーの仕事推測と美咲の仕事時間帯の矛盾を抑える | merged | `6f25eba602fca1183383588ad0183d4c4a16d37c` | 2026-09-17T23:23:28Z |
| #21 | 直近の実装・修正総覧を更新する | merged | `621dea871afc4dca517071cc79666d81cb69e29c` | 2026-09-17T23:30:48Z |
| #22 | 総覧を最新mainソースと再照合する | merged | `f6d8baf94d037057ec94deb87b156a713445d37f` | 2026-09-17T23:36:47Z |
| #23 | 旧ブラウザ自発メッセージ経路を削除する | merged | `242e1e8d1fac7dac1ff90e4d02a05c5f2afd6369` | 2026-09-18T00:15:47Z |
| #24 | 匿名セッションの一時切断で会話を消さない | merged | `5b6c276c1da9ea85615fda11a881e2b3802f08f7` | 2026-09-18T00:51:10Z |
| #25 | Gemini返答待ちにタイムアウトと診断ログを追加する | merged | `469578ea12663c594a32c62a05263b23e7190891` | 2026-09-18T01:25:26Z |
| #26 | チャット応答の工程別タイミングを計測する | merged | `ead9d6283b68579f6014e07bef46add2a41fb791` | 2026-09-18T02:32:49Z |
| #27 | 初対面から関係を育てる設定に切り替える | merged | `98675cd45ea3723150031ba6d89e90ceadae5a8c` | 2026-09-18T03:02:52Z |
| #28 | 総覧を関係成長・応答診断の最新状態へ更新する | merged | `1d9db32ea15fbea950ac46090cb6e1a8bc750001` | 2026-09-18T03:16:04Z |
| #29 | 美咲の根本状態をサーバー正本化する基礎工事 | merged | `685fbb7baee4a542555f939fabaecd674658c148` | 2026-10-02T08:23:32Z |
| #30 | 旧schema互換の先行maintenance/drain設備を独立追加 | open | `17449c7ec4e8ff50605ef931b04ae76584c6304f` | 2026-09-19T21:31:28Z |
| #31 | 関係時間v2: 内容理解から感情・行動・自発性まで統合 | open | `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64` | 2026-09-25T10:03:16Z |
| #32 | 統合検証: canonical memory × relationship life context | merged | `db5b6e17c77f94f54bb4764da3fcf01b764d313e` | 2026-10-02T08:11:21Z |
| #33 | 匿名history GETのauth raceを安全なno-opにする | merged | `368afb0dfbf9ea66837c83834d8fc24837813554` | 2026-10-02T08:35:46Z |
| #34 | 生活イベントを確認済みユーザープロフィール連動にする | merged | `610e50b6cd4d63ccdfcfd5aaf57516bb016468bb` | 2026-10-02T09:00:56Z |
| #35 | 移行仕上げ: 匿名history同期とJR 403ノイズを止める | merged | `f5424c06c92b3f51535dd44ec54ef0a25f790370` | 2026-10-02T09:10:48Z |
| #36 | 匿名history 5秒GETの発信元を実証して停止する | merged | `850e2acccef3722fc487dd17df687056b3b58911` | 2026-10-02T09:20:56Z |
| #37 | 5秒history GETの発信元をProductionで確定する | merged | `524596dedf44806da95c8d84e2096f2a5411440d` | 2026-10-02T09:25:51Z |
| #38 | 5秒history GETをEdge境界で捕捉する | merged | `e3a08db0c3dc97b297130a224919e73a69974c60` | 2026-10-02T09:31:01Z |
| #39 | 時刻表示の5秒history pollingを撤去する | merged | `829ee4671443140386043396ffb70c0a8a8daaae` | 2026-10-02T10:01:33Z |
| #40 | Gemini一時混雑を美咲の待機体験で吸収する | merged | `0c77bad036d4bef73c82983c3ae3f800943a1ee5` | 2026-10-02T11:45:36Z |
| #41 | 待機メッセージの縦崩れを直す | merged | `f3a613291569a60e471065372135cbee07373702` | 2026-10-02T11:55:10Z |
| #42 | 通常応答で忙しそう表示を出さない | merged | `1b77372a7e385a58f127d259a99e05e60cb8deb6` | 2026-10-02T12:05:38Z |
| #43 | Geminiタイムアウトを一度だけ自動再試行 | merged | `862cfa6c2ce6e45b7ccbc294270f3ba02548ed2a` | 2026-10-02T13:01:42Z |
| #44 | Sync free quota state with canonical history refresh | merged | `f67b388e965bb9bfb3f8d6820fd62e9d273123b6` | 2026-10-02T23:46:49Z |
| #45 | 美咲の演技研究室：Relationship Interpreter 基礎 | merged | `be15cfea6039ff9e44be1a34ceff48a882f09c18` | 2026-10-03T06:24:13Z |
| #46 | Add Relationship Engine v1 fully lease-fenced DB contract | merged | `e6bf2bc75aa5dd87e520724e5dbf3f4a5f0f6578` | 2026-10-03T10:31:14Z |
| #47 | Draft: connect canonical Relationship Engine v1 after chat save | merged | `42c8eba3c92e0cbaeb0825717f122e2fb3f7364a` | 2026-10-03T10:31:27Z |
| #48 | Hotfix Relationship Analyzer structured output | merged | `319865a5f9351899ef260754aaad2604623552d5` | 2026-10-03T10:57:16Z |
| #49 | Log Relationship processing exception name and message | merged | `7b68b97c3feae99d21f9f1dd937b29218b40997b` | 2026-10-03T11:19:37Z |
| #50 | Add temporary allowlisted Gemini failure diagnostics for Relationship Analyzer | merged | `42177230a0a3c8926689499ffb19de4f1044d8d7` | 2026-10-03T12:15:17Z |
| #51 | fix: Relationship Analyzer の polarity 整数 enum を削除 | merged | `68a2aebb98e5f800f7a6d334c815c2a7841b2873` | 2026-10-03T12:32:33Z |
| #52 | Remove temporary Relationship diagnostics | merged | `e4f870f0ab76271daee76882fbd1b3fefae3a9bb` | 2026-10-03T12:38:58Z |
| #53 | Fix Relationship Analyzer polarity transport | merged | `66bec2792d571c697aa891ff0142e78f4941456e` | 2026-10-03T13:11:32Z |
| #54 | Add temporary Relationship Analyzer stage diagnostics | merged | `0907d2ff24f6a584c032ece54f9289954ccbeb63` | 2026-10-03T13:26:58Z |
| #55 | Add Relationship evidence validation reason diagnostics | merged | `b8607f3e92fde63fbc37dab85a30d9945c8ad649` | 2026-10-03T14:00:03Z |
| #56 | Ignore ungrounded Relationship evidence candidates | merged | `ae0df66929f62bb804b37c35eebabb7e8c66b696` | 2026-10-03T14:21:55Z |
| #57 | Remove temporary Relationship Analyzer diagnostics | merged | `d41e673420637cd644587c5db42c38d432fd2e74` | 2026-10-03T15:26:42Z |
| #58 | Update Misaki overview for Relationship Engine v1.1 production | merged | `64253627bc5ee152c4b17389a6709e7481e9911b` | 2026-10-03T15:34:13Z |
| #59 | Update overview with Relationship Engine v1.1 production spec | merged | `4a59cbc7b163b199ffcf9f975a969cbc254cbfe2` | 2026-10-03T15:37:45Z |
| #60 | Document Relationship Engine v1.2 Stage and growth principles | open | `ed8359319181f20cf73aec87ab75c7a1405264f2` | 2026-10-04T04:42:23Z |
| #61 | Observe Gemini physical-call usage with server-only cost telemetry | merged | `e329b6c81bce3f5f54a5a6d5af14c3ebc40d2035` | 2026-10-04T05:22:52Z |
| #62 | Refresh Misaki landing page around relationship growth | merged | `9bfa0760f56b3d1c3bf6d07af056410afde975ec` | 2026-10-04T06:45:22Z |
| #63 | Fix mobile PWA section horizontal clipping | merged | `f65c3b2e56478634861e27193fbb5913ebfb84cb` | 2026-10-04T07:03:50Z |
| #64 | Do not let expired anonymous roots block relationship processing | merged | `63cf82a53600b0518c1d88e61df4b09665026e2d` | 2026-10-05T23:38:17Z |
| #65 | Retry transient Relationship Analyzer failures | merged | `90ac90bba86f716ccf46e50542097d1b81e23702` | 2026-10-05T23:52:24Z |
| #66 | Forget Control v1: canonical忘却と確認付き再学習 | open | `84d147ba5b46698d3b46fb727a9859f87f79f3d2` | 2026-10-06T21:21:23Z |
| #67 | Relationship Identity v1: canonical persistence, continuity and migration audit | open | `9cbe2146d4a9ad09edd16100c27d950e95a8bcc4` | 2026-10-11T16:44:42Z |
| #68 | ci: manual-only isolated Gemini A/B dispatcher (no app changes) | merged | `7b8edbc79c9f1f798e3936504eb3f09b2d7bd9bd` | 2026-10-08T02:42:12Z |
| #69 | ci: add optional 20-pair isolated Gemini A/B run | merged | `f3b98d03475fdcc012a07de669cc628911e32239` | 2026-10-08T02:50:26Z |
| #70 | ci: select synthetic long-context Gemini A/B fixture | merged | `188502ff4b70f5c4fdfbec44cb47d86d99c055ab` | 2026-10-08T03:36:21Z |
| #71 | ci: pin HTTP and JSON diagnostics for manual Gemini A/B | merged | `76f066c05653374826f42c9ee1578719da975e2e` | 2026-10-08T03:41:34Z |
| #72 | ci: optional pacing for isolated Gemini A/B calls | merged | `266c6a1ce74bc6ba0889e41590004854386fab31` | 2026-10-08T03:45:30Z |
| #73 | ci: add manual synthetic conversation-quality A/B | merged | `5a8f52da62da8ffbeb16705d1d7e2d23f85d5743` | 2026-10-08T04:53:25Z |
| #74 | ci: add numeric-only quality failure diagnostics | merged | `ab805d88148c6880238918e858ca5261564c1bdc` | 2026-10-08T05:30:43Z |
| #75 | ci: pin quality A/B runner with explicit reply JSON schema | merged | `82848c976ef0f1602d4dc3f7c9556a91145f93a5` | 2026-10-08T07:06:29Z |
| #76 | ci: enable short-lived blinded synthetic reply artifacts | merged | `648e07cef9831c2d276b3cb2754ce49d53d2e27e` | 2026-10-08T07:48:12Z |
| #77 | ci: add manual long-history synthetic quality A/B option | merged | `efcf00c4beb7f8cc4a077a5ff0e4d455cd6f1409` | 2026-10-08T10:49:35Z |
| #78 | Test isolated conversation replay adapter | open | `a849bec92059d326940ffc358635164ea7d391c9` | 2026-10-13T05:11:00Z |
| #79 | docs: multi-character data scope inventory | open | `ad51dfe248fdf9a6903f4ff193f437bf04b2d80c` | 2026-10-13T07:41:29Z |
| #80 | docs: audit multi-character RPC callers | open | `83476dd2d347687c253a471557d9c27b82e1caf7` | 2026-10-13T08:54:39Z |
| #81 | docs: reconcile production source-of-truth and management drift | open | `ce8e41f47af98f766c75e1f27787d0b585c452a7` | 2026-10-14T00:31:07Z |
| #82 | chore: restore applied relationship RPC migration | merged | `4dd716a2c04c6864445cb8720a1921813bb50933` | 2026-10-14T11:57:22Z |
| #83 | test: compare canonical relationship acting instructions | open | `fd714bd8a82a4a48c9f33b368c35498aec6e65b5` | 2026-10-14T12:59:39Z |
| #84 | docs: 5軸成長速度とRelationship Engine思想の照合を総覧へ追記 | open | `8a7f467761f9c5b42be4bb375d616eec67d47c7c` | 2026-10-14T20:22:38Z |
| #85 | experiment: 5軸の中間成長を表現するInterpreter比較案（本番未接続） | open | `ef5bd23246a75b02a0df60302263f971de061843` | 2026-10-19T01:46:50Z |
| #86 | experiment: offline multi-turn conversation lab foundation (no Gemini/DB) | open | `f92250fc1ac79efa44c72468e00449d3fdc7ce6e` | 2026-10-20T11:36:42Z |
| #87 | design: shared Misaki conversation engine for production and tuning lab | open | `daded504b1d2834ed4d7b4a6d0758e89841aed74` | 2026-10-15T08:14:27Z |
| #88 | refactor: pure conversation history adapter (first shared engine seam) | open | `2ae90d70ff143c8de935f25ec12f291e9b82613a` | 2026-10-16T21:02:55Z |
| #89 | 美咲ラウンジ：24fps透過WebP自動表示＋縦型21秒OP接続 | merged | `fda55141d873e29190c14910725c397d7931dfae` | 2026-10-29T14:40:06Z |
| #90 | 美咲オープニングをiPhone画面いっぱいに固定表示 | merged | `47e97ab221c0a5325484f8af0a49d7f2da1b7843` | 2026-10-29T14:45:40Z |
| #91 | 美咲ラウンジ：縦画面いっぱいの比較用プレビューを追加 | merged | `002484b73898dfc1b312c3769801f178e6f50f64` | 2026-10-29T16:39:43Z |
| #92 | 美咲：縦画面ラウンジに「いつもの女の子」ショートカット比較版を追加 | merged | `dbbc1311cd867cd23ea6b09f0a0d753e3786649d` | 2026-10-29T16:53:44Z |
| #93 | ラウンジ：大きな下部ボタンを小さな左右矢印と初回スワイプ案内に置換 | merged | `48e20e0d232a489310290794396a06e83347f445` | 2026-10-29T17:01:26Z |
| #94 | WIP: Muse v3 約14秒透過アニメのラウンジ比較版 | merged | `eb12d7b9d70853519784f1fe8fc4104dccb36a61` | 2026-10-29T22:26:39Z |
| #95 | 美咲ラウンジ：iPhone確認済みのMuse 14秒透過アニメを正式採用 | merged | `1206082bafe848ff7b2261857c66de6708ef344e` | 2026-10-29T22:32:09Z |
| #96 | 美咲ラウンジ：オープニング終了・スキップから既存チャットへ接続 | merged | `c454ee11d3adc40548d87de4a0516f0491394749` | 2026-10-29T22:36:59Z |
| #97 | 美咲ラウンジ：チャット切替時に背景が一瞬映る問題を修正 | merged | `d804b0233133359a7894e608848c72fdabf9313e` | 2026-10-29T22:42:29Z |
| #98 | 緊急修正：ラウンジの全タップ無反応（JavaScript構文エラー） | merged | `213935de5e14d431fb38422a53a9ce844a8e8cc0` | 2026-10-29T22:48:14Z |
| #99 | 美咲：初回は空枠、会話後にアイコン表示＋匿名会話を翌日も保持 | merged | `44e8ec5eb2ab636b76926777b714ff803ebe8aa5` | 2026-10-29T23:07:59Z |
| #100 | 設計: 匿名の情報別24時間記憶とGemini軽量化の安全な実装順序 | open | `1e48f266cf40b51220bf9197006d8b939fb00b9e` | 2026-10-30T01:05:37Z |
| #101 | docs: 記憶・想い出・感情・自律日常の公開用計画資料を追加 | open | `a4ea7b00da0f213bb865a40044b46d6973f859dd` | 2026-10-30T14:40:24Z |
| #103 | chore: 読み取り専用の開発忘れ物検出（両プロジェクト共通方式） | merged | `441779f88c0196a914079f238061c39c3159859d` | 2026-10-31T20:12:59Z |
| #104 | docs: 2026-11-01棚卸し・調査結果を台帳へ保存 | merged | `d411a319192f7b764d7bd639845f7256f7006903` | 2026-10-31T21:24:19Z |
| #105 | docs: 旧監査ブランチの追加調査を台帳へ記録 | merged | `897bf1c7e084ba88de75440c0d0e2042ead3be00` | 2026-10-31T21:28:00Z |
| #106 | docs: 未整理ブランチの保全・照合・整理候補を分類 | merged | `de42ab7cf5522a4d9878ec9c31ab83175f9402db` | 2026-10-31T21:30:57Z |
| #107 | docs: 旧ブランチとmainの機能単位照合を記録 | merged | `0fff17e7329d44826a301dd0ea9af8b461c3e743` | 2026-10-31T21:42:15Z |
| #108 | docs: 旧実験コードのmain照合記録 | merged | `397cecadd72d1888ad705ca856a2e852ce65342d` | 2026-10-31T21:43:07Z |
| #109 | docs: 旧テスト・計測コードのmain照合を記録 | merged | `5907add42bb8bb8a1cde67785fde69421b2f43b2` | 2026-10-31T23:11:07Z |
| #110 | docs: 開発台帳に旧テスト照合記録を追加 | merged | `c009c9229c4be89706d198850426b7ca92980eed` | 2026-10-31T23:13:50Z |
| #111 | docs: 現行処理経路と旧実験の追加照合 | merged | `4f537d806213caa6144131ac22e0d6ca250fda97` | 2026-10-31T23:33:33Z |
| #112 | Run read-only development inventory daily at 10:17 JST | merged | `289325326dd8f63ff611d54e8b7de2a57c9f8af7` | 2026-10-31T23:45:25Z |
| #113 | Correct main overview inventory status and daily schedule | merged | `025ac391080bbbe7515e6ed9243fb1134a83e21a` | 2026-10-31T23:49:04Z |
| #114 | Add concise development operations index linked from ledger | merged | `e8cea3154aaa508009b1f2a32c0ecead0abca80b` | 2026-10-31T23:57:43Z |
| #115 | Document inventory delta review and ledger update procedure | merged | `cf6d0b4ae8fcc1a5e729def41200b96638e67662` | 2026-11-01T00:01:28Z |
| #116 | Generate daily read-only inventory delta and ledger update candidates | merged | `b76e9ff9bdc1cc9ee92eed8d8e85cb3837910a28` | 2026-11-01T00:04:36Z |
| #117 | Allow read-only access to previous inventory Actions artifacts | merged | `bc869d342ea13e8ca08185ba58312746235393f6` | 2026-11-01T04:57:29Z |
| #118 | Preserve daily inventory when prior artifact returns HTTP 401 | merged | `3e05600ba66766641144c80545becf857e0e1699` | 2026-11-01T05:01:43Z |
| #119 | Diagnose HTTP 401 during inventory artifact comparison | merged | `2f51e7fa0de7701244cb4bcc599be4f4debf8d43` | 2026-11-01T05:18:17Z |
| #120 | Inventory phase 2: read-only triage and ledger review proposals | merged | `bb2d7f63c8208bad216b519fe8ddc46d7e6d14a3` | 2026-11-01T05:35:39Z |
| #121 | Fix malformed JSON and markdown in inventory triage artifacts | merged | `cd6491362319f7fdc2ce643a023f3cd53e3dff89` | 2026-11-01T09:46:11Z |
| #122 | Inventory phase 3: use PR metadata for review-only case hints | merged | `9a46c7d9178abada8d012696a5ca79fb10190fa1` | 2026-11-01T12:59:20Z |
| #123 | Inventory phase 3: bounded PR file evidence and maintenance triage | merged | `3577bab51e5d9fde11ef7f53f97407168659ac27` | 2026-11-01T13:07:22Z |
| #124 | Phase 4: establish safe ledger automation boundaries | merged | `95900b6fe269676614b0e55f84fd89ddeb7796fd` | 2026-11-01T14:51:27Z |
| #125 | Phase 4: scheduled review-only ledger update PRs | merged | `8dd57e4d28062bc2aa4cb1605235490743af8688` | 2026-11-01T14:54:23Z |
| #126 | Fix ledger facts table columns before first scheduled run | merged | `193d951417132f25fe39dacdc64945321232bc36` | 2026-11-01T14:57:27Z |
| #127 | Event-driven factual ledger proposals on PR changes and main updates | merged | `eed361d57293b2703527e4e9fad33753acff3728` | 2026-11-01T15:12:10Z |
| #128 | Add fail-closed checks before ledger automation writes | merged | `91557d9d07a940d7d2d4404c5539b0f924fe048a` | 2026-11-01T22:46:20Z |
| #129 | Add diagnostic artifact and explicit permission error for ledger automation | merged | `e8daca7a206b9324c1a240e4c4e4a360bfd1fe4f` | 2026-11-01T23:22:02Z |
| #130 | 美咲単独版：LP→ラウンジ→動画→既存チャットを接続 | merged | `0b5c808a4d6e2377c0ce2a18c3899b475395e650` | 2026-11-01T23:14:44Z |
| #131 | 匿名状態を保全して会話を復旧し、新規復旧受付だけを停止可能にする | merged | `6af9501cd6e691e85cf855d843586eba4f175559` | 2026-11-02T02:55:05Z |
| #132 | Fix inventory CI AttributeError when branch SHA is a string | merged | `958125d94dba310274fe4651796fa812c605a8ee` | 2026-11-02T01:57:27Z |
| #133 | docs: 競合AIコンパニオン研究とWork利用節約方針を総覧に反映 | merged | `7c02c3cf349db24f6e41e63acbd50c821c195754` | 2026-11-02T02:57:45Z |
| #134 | Add fail-closed PR promotion policy (review only) | merged | `9db5760f0024e6665a116b79a6f0085bfe3a2af6` | 2026-11-02T03:59:49Z |
| #135 | Run review-only promotion classification on PR updates | merged | `7014081f1cefa490db694139c147e36a10bbe18e` | 2026-11-02T04:05:16Z |
<!-- INVENTORY_FACTS_END -->
