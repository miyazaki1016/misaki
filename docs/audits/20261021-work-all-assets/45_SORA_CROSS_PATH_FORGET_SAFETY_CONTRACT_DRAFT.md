# ソラ第5次横断精査：Forget情報利用権の共通契約案と経路別検証条件

日付：2026-10-21 JST。**仕様案・監査資料であり、機能実装や受入試験の合格報告ではない。** 対象：Misaki、Forget PR #66、Relationship worker、Persona Evolution、Body Clock、Push、canonical history API、ブラウザー。固定比較：main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`、#66 `84d147ba5b46698d3b46fb727a9859f87f79f3d2`。根拠資料：第4次の29〜31、ソラ直接精査38〜44（とくに40〜44）。44、38は監査専用ブランチで再読済み。今回新規にコード実行・SQL実行・再現試験・本番DB確認はしていない。

## 1. 監査事実と契約案を明確に分離

**静的証拠あり：**
- #66のMemory編集SQLはcontrol payloadと正本memory/history更新をtransactionへ収め、canonical root updated_atを使う（41、44）。
- chat replayにはlatest forgetVersion比較→409がある（42、44）。
- workerのlease/processing versionは存在し、failed journal / canonical event / persisted Evidenceから再開する（40、41）。
- Persona Evolution runnerは候補のproposedContentと既存Traitsをmaskするが、reason/evidenceをRPCへ渡す（39、42）。
- Body Clock生成はForget情報を参照しmaskするが、確認したrelay routeで送信時Forget照合は見えない（39、42）。
- history APIはupdatedAtを返すがforgetVersionは返さず、canonical読取はconversationとcontrolsが別query、画面root-state採用に世代検証がない（43、44）。

**未検証：** 現在のDB実効function/RLS/ACL、全writer/trigger/overload、実ブラウザーrace、外部送信、意味的Forget仕様の厳密性、実被害と再現、受入テスト。したがって「漏洩した」「修正できた」「全経路で無防備」はいずれも言わない。

## 2. 共通安全性契約の最小案（実装していない）

| 契約ID | 内容 | 禁止する誤認 |
|---|---|---|
| C-01 利用権は独立 | 実行lease・idempotency・所有者認証と、忘却対象情報を使う許可は別。処理が正当でも旧情報の再利用は自動承認しない。 | lease有効なら利用権も有効、という混同 |
| C-02 sourceと派生を追跡 | 生成根拠のuser/character/pair、元turn/request、event、引用・内容span、処理世代、対象controlを紐付け可能か評価する。欠損はunknown扱い。 | provenance不明を安全扱い |
| C-03 最終採用直前の評価 | 読取(T0)→Forget成立(T1)→生成(T2)→保存/承認/配信/表示(T3/T4)のそれぞれ**制御できる境界**で現利用権を再確認できる仕組みを仕様化する。 | 生成時maskのみで足りる、という断定 |
| C-04 競合の原子性 | 認可checkと内容の「最終採用」が非原子的なら残るraceを明記し、既存transaction/lock/leaseを利用しつつ設計上の閉鎖条件を検討する。 | 直前SELECTだけで完全安全との断定 |
| C-05 表示と保持は別 | 過去の保存物を保持するかと、今その内容をPrompt・候補・画面・Pushへ再提示できるかを別に評価する。 | 物理削除＝全リスク解消、保持＝漏洩 |
| C-06 保守的な失効 | 現世代不明・根拠の曖昧さ・control復号失敗・旧source由来などがあれば、「使ってよい」と推定しない。利用保留／再取得／再計算／ユーザー確認等の扱いは仕様審査へ。 | 不明時にfail-open |
| C-07 正常動作を守る | 同名別人・引用・否定・本人による新たな明示的再学習を独立oracleで分け、無関係な記憶と関係の境界/拒絶を消さない。 | すべての関係状態を忘却で初期化 |
| C-08 不可逆な送信 | Pushや外部端末は送信後の取り消しを保証できない。事前照合と送信時点のrace、既送信の限界を明記する。 | OS Pushが後から必ず回収可能 |
| C-09 世代の真正性 | `forgetVersion`、control.updated_at、root.updated_at、temporary revision、relationship_state_version、lease tokenは互換でない。比較に使うなら全writer・更新順・世代の一意性を立証する。 | timestampの存在のみで認可とみなす |

## 3. 経路ごとの最終採用点と追加検証

| 経路 | 既存保護 | 利用権チェックが必要になる候補境界 | 優先試験 |
|---|---|---|---|
| Chat生成・完成turn・receipt | 入出力mask、root更新の競合防止、replayでForget世代409 | 完成turn確定時、replay構築時、HTTP結果の画面採用時 | FR-07、FSC-T04/05 |
| Relationship Evidence→Episode→Pattern→State | worker lease、writer RPC、同user/canonical turn、processing version | 各段階の派生源再利用・保存・state採用、failed journal復旧時 | RW-01〜05 |
| Story/Acting | signal由来の構造化関係状態、関係status独立管理 | 旧sourceから導出した具体内容や推測をPromptへ渡す時 | FR-09、RW-06 |
| Evolution候補 | 分析時mask、user scope、候補review RPC | reason/evidenceの候補保存・GET・review approve・trait採用時 | FR-03 |
| Body Clock | 生成mask、finishのroot revision/updated_at照合 | finish時のcontrols世代・写真根拠の失効・delivery確定時 | FR-04 |
| Push relay | signed delivery、通知同意、status/age、送信attempt一回 | saved deliveryの送信権検証後、外部送信の直前境界／非原子窓 | FR-05 |
| History GET/React/cache | owner check、no-store、pending抑止、sameHistory | canonical複数読取、HTTP response、root/history event、React採用、複数tab/offline | UI-01〜07、FSC-T01〜07 |
| 匿名root/import | token、revision、expiry、lease、1回import | snapshotの失効・新ownerへの導入・reply/receipt再提示 | FR-08 |

上表は**新APIや新DB schemaの実装承認ではない**。既存保護を復元できるか、最小変更で閉じられるかを比較するためのレビュー観点。

## 4. 二段階の実務優先順位（提案）

**優先A：利用者に再提示される直近の経路を確定調査**
A1. History API→root-state event→Reactの古いmemory/history採用（FSC-T01/02）。HTTPの内容自体・現世代・UI採用時点を分ける。
A2. Push relayのdelivery確定後Forget（FR-05）。外部送信は不可逆性が高い。
A3. Persona候補GET/reviewのreason/evidence再提示（FR-03）。

**優先B：内部派生が後から表出する経路を確定調査**
B1. Worker failed journal/Evidence→Episode/Pattern/State（RW-01〜05）。
B2. Body Clock finishとForget更新が同一root更新を必ず競合検出できるか（FR-04）。
B3. 匿名→恒久import、既存Story/traitsの派生根拠（FR-08/09）。

優先順位は危険度を実測評価したランクではなく、外部表示境界と調査効率に基づく暫定案。実装順序ではない。

## 5. 受入の判定ルール（これから仕様承認が必要）

- **試験台帳**：各IDに固定Blob、setup、時系列T0〜T4、expected oracle、観測するDB/HTTP/UI/外部送信、false positive/negative fixture、成功/失敗/未実施を記録。
- **合格を認める証拠**：単なるフィルタ呼出しや同じ結果を返すA/B比較ではなく、forget対象と無関係情報が独立期待値通りになること、raceを停止位置ごとに観測すること。
- **不合格の取り扱い**：検証で漏れが再現した場合のみ「再現済み」と記載する。現段階は`NOT_RUN`／保証未確認。
- **事後監査**：修正を承認された場合でもmainやDB変更は別作業。SQL migrationsの最終実効定義とpermissions、回帰・負荷・OS通知失敗を改めて確認する。

## 6. Work再開時の重複回避

Workへは38〜45を「**ソラの第5次・部分静的精査**」として読み込ませ、確認済み事実の固定HEAD/Blobを尊重させる。未実施試験を勝手に合格にしない。残り45/85文書版・証拠不足30ブランチを継続しつつ、固定ソースの差分があればそれを明示して追加検証する。Workが別コミットで同じ番号の文書を作った場合は上書きせずに別ファイルで統合する。

## 7. 禁止事項と現在位置

本資料の作成以外にGitHub変更なし。main、本番Misaki、Supabase、アメふる、PR、deploy、ブランチ整理は触れない。有料Gemini・DB接続・migration・実行テストなし。監査は未完了、確認された再現漏洩0件（未試験）、文書40/85版・証拠不足30ブランチを据置、legacy BLOCKED継続。使う名前はMemory v1 / Relationship self-conception / Person identityの各責務を混同しない。
