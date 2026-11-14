# 美咲 総覧

ラウンジからキャラクターと会話し、記憶・想い出・関係が育つ体験をつくる。

> [!CAUTION]
> **開発・調査・検証・修正・再測定を始める前に、必ず[日本語開発履歴検索](https://miyazaki1016.github.io/misaki/history.html)を確認すること。** 機能名・日本語キーワード・コード名・過去の数値で検索し、未統合ブランチも含めた過去の実装、検証結果、根拠リンク、残課題を読む。**同じ作業を繰り返す前に、既存成果から再開できるか判断する。** 手順は[日本語開発履歴の運用](WORK_HISTORY_OPERATIONS.md)。検索結果がない・不十分なときは原本のPR・ソース差分・テスト・Actionsを確認し、未確認は未確認のまま扱う。main統合／CI成功／本番反映は区別する。

> [!IMPORTANT]
> **担当ソラはここから [開発台帳](DEVELOPMENT_LEDGER.md) へ。** 案件の状態・担当・次の一手は台帳を更新する。再開前に、該当PR・ブランチ・詳細資料を実際に確認する。

| 知りたいこと | 開く場所 |
| --- | --- |
| **着手前に必ず見る：過去の日本語開発履歴** | [両プロジェクト共通の検索画面](https://miyazaki1016.github.io/misaki/history.html) · [運用手順](WORK_HISTORY_OPERATIONS.md) |
| 案件の現在地・証拠・次の一手 | [開発台帳](DEVELOPMENT_LEDGER.md) |
| 自分の判断待ち・担当への引き継ぎ | [美咲 × アメふる承認ボード](https://miyazaki1016.github.io/misaki/) |
| PR・ブランチの自動棚卸し | [GitHub Actions](https://github.com/miyazaki1016/misaki/actions) → 最新成功の `development-inventory` |
| 開発・確認・リリースの規約 | [共通運用規約](DEVELOPMENT_MANAGEMENT_STANDARD.md) · [Vercelビルド運用](VERCEL_BUILD_POLICY.md) |
| 過去の判断・未統合研究・詳細な開発史 | [整理前の総覧・全文保存版](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/IMPLEMENTATION_OVERVIEW.md) · [旧開発台帳・全文保存版](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/DEVELOPMENT_LEDGER.md) |

[エンジン総点検の中断・再開チェックポイント](DEVELOPMENT_LEDGER.md) · [中断・復帰手順](WORK_RESUME.md)

## 新しいソラへの引き継ぎ（共通ひな形・必須）

**新しいチャットで担当ソラに開発を渡すときは、以下をコピーし「今回やりたいこと」「守る条件・直前の状況」を埋める。** 美咲とアメふるを同時に変更せず、指定された対象だけを扱う。担当AIはひな形の指示を実行すること。**総覧を読むだけ・検索画面を案内するだけでは着手前確認を済ませたことにならない。**

```text
開発を引き継いでください。最初は照合段階だけを実行してください。

対象リポジトリ：
美咲：miyazaki1016/misaki
アメふる：miyazaki1016/emergencyalert
※今回の対象だけを作業してください。

今回やりたいこと：
（ここに依頼内容を書く）

守る条件・直前の状況：
（あれば書く）

最初に最新mainのAGENTS.mdと
 docs/WORK_HISTORY_PREFLIGHT.mdを読んでください。

引継ぎ先は通常チャットを基本としてください。
WorkやローカルPythonの実行環境を前提にしないでください。

実装・調査・再測定を始める前に、今回の依頼文で既存成果を照合してください。
Pythonを実行できない場合は、GitHub連携で同じ作業の既存Issueを再利用するか、
対象リポジトリへ依頼内容のIssueを登録してください。
自動起動する「Existing work preflight」の今回の実行結果・ログを読み、
提示された原本を確認してください。
再利用判断と証拠URLをIssue本文のhistory-preflightに記録し、
本文編集後の新しいActions実行の完了まで、Issueのbotコメントを再取得して待ってください。
最新本文・判断記録に対応するpublication_status=confirmed、
preflightジョブのsuccess、REVIEW_RECORDEDを確認してから案件作業を開始してください。
候補なしの場合はNO_STRONG_MATCHとして区別して確認してください。
合格前は照合の原本確認・判断記録だけを行い、
読み取り専用の原因調査・仕様検討・設計も始めないでください。
原本確認・判断記録・再照合の待機と再取得を、可能な限り同じ応答内で継続してください。
合格したら追加の「りょ」を待たずに、許可された本題へ進んでください。
同一依頼の有効な合格がある場合は再利用し、「りょ」だけで再照合しないでください。
待機を継続できない場合は「照合待ち・案件未着手」で止め、
次の応答で結果確認から再開してください。
着手前にIssue URL・実行ID／URL・判定・最新本文との一致を報告してください。
PRを作る際は、Issueへのリンクと判断記録をPR本文にも記載してください。

実行環境がある場合はscripts/development_preflight.pyのCLIも使えます。
必要なGitHub操作ができない場合は、不足する機能・権限を明示してください。

提示された過去のコード・検証結果・未統合研究・
残課題を読み、再利用判断を記録してから進めてください。
同じ実装や実験を最初から繰り返さないでください。
開発台帳の中断チェックポイントを確認し、別の問題へ移る前に元の目的・中断位置・子Issue・復帰条件・次の一手を残してください。
子案件の終了後は親目的への復帰を確認し、再開しない場合も理由を残してください。

コード変更後は、最新PR HEADに対応する必要なActions結果を確認してください。
引継ぎ成功・既存成果の再利用成功・新規変更の検証成功・案件の完成を
別々に記録し、未実行・実行中・失敗・未確認を成功扱いしないでください。
Issueの結果コメントから実行IDを読める場合は、利用者にサイトで探させないでください。

履歴やコードを取得できない場合は、
確認できたふりをせず、その箇所を明示してください。
```

**担当AIの実施順序（通常チャット）：** 最新mainの[AGENTS.md](../AGENTS.md) → [Actions経由の着手前照合手順](WORK_HISTORY_PREFLIGHT.md) → 対象Issueの登録・更新 → 今回のActions結果・原本を読む → Issue本文へ再利用判断を記録 → 編集後の新しい実行を確認 → 未解決分のみ作業。PRにもリンクと判断を記録する。実行環境があればCLIも使える。照合不能は未確認と明記し、main統合・CI成功・本番反映・実機確認を区別する。

## 主な領域

ラウンジと会話、記憶・関係性、開発の引き継ぎ。 案件の進捗は[開発台帳](DEVELOPMENT_LEDGER.md)を参照。

[記憶・自律性の設計](MEMORY_AUTONOMY_PUBLIC_OVERVIEW_20261030.md) · [共通の開発管理総覧](DEVELOPMENT_MANAGEMENT_OVERVIEW.md)

## 守る運用ルール

- ユーザー間の記憶は分離。キャラクター間は参加・目撃・明示共有の範囲だけ参照する。
- 匿名の記憶は作成から24時間を基準にし、再会話で延長しない。登録への移行は同意を前提にする。現行実装の状態は案件の証拠を確認する。
- ラウンジ、匿名セッション、会話、記憶の変更では既存の設計と回帰条件を先に確認する。
- 検討・研究がmainにない場合は、ブランチとファイルの所在を台帳に登録する。詳細が別ブランチにある場合は、そのブランチを取得して確認する。
- 自動棚卸しは差分と確認候補を出す。完了・本番反映・実機確認を自動認定しない。
- **Vercelの自動プレビューは停止中。** 画面修正は必要に応じて手動で確認する。mainのアプリ変更は本番ビルド、判定できる資料だけの更新はビルド処理を省略する。省略でも回数枠に数えられる場合がある。詳しくは[運用ルール](VERCEL_BUILD_POLICY.md)。
- 修正は **テスト → 必要なプレビュー → main → 本番READY → 実機確認** を区別して記録する。未確認は未確認のまま残す。

整理日：2026-11-05。全文保存版には旧見出し・相対リンク・履歴をその時点のまま残している。

[共通の4段階区分・最新HEADの検証・引継ぎ成功事例](WORK_HISTORY_HANDOFF_VALIDATION.md)。

### Forget Control v1 第1工事 — レビュー用実装（2026-10-06 UTC）

**状態: 実装・ローカル自動検証済、実モデルPreview/Production受入未完了。完成扱いしない。** 基準mainは `eb9ca4bec1a8a24afc58d4728f3c2bac3164bbf2`。上の2026-10-07仕様に加え、ユーザー承認によって再提示後の確認・肯定を必須化し、clearMemoryの全対象にもHard Deleteを残す。匿名persona evolutionのブラウザ由来history/memory入力を廃止し、検証済canonical rootだけを解析材料にする。Relationshipの処理順・意味論は変更しない。

#### 実装と保存境界
- Next/Deno共有の `supabase/functions/_shared/forget-control.ts` に概念同定、参照用context、再記憶確認、出力検証を集約。対象はsubject/predicate/value/scopeで保持し、同名・部分一致で一括除去しない。判定不能・不完全なモデル応答・保存失敗はfail closed。
- 永久側は `misaki_forget_controls` にownerごとの暗号化control vectorを保存。HMAC target key、AES-GCM ciphertext、owner AADを使い、生の対象値や全historyを新しい平文DB列へ複製しない。暗号化鍵は既存service-role secretに依存するため、鍵変更時は読取互換または再暗号化が必要。Forget自体に24h期限は設けない。
- Soft Forgetはchat commit、UI×/clearMemoryはcanonical edit、匿名はtemporary root/checkpointと同じtransactionに保存。古いhistoryはそのまま保持し、clearHistoryの意味を変更しない。古いtransport receiptは現在のcontrol versionと異なる場合409とし、古いreply/memoryを再配信しない。
- 現在turnの明示的な再提示だけでpending確認を作り、その確認の直後・30分以内の肯定turnでreleaseする。古いhistoryは時刻とrelease時の行fingerprintで遮断したまま。訂正した値は新しく学習し、退役した旧値は復活させない。由来が確定できない旧persona traitはrelease後も遮断する。
- Body Clockのlife/decision/generation、Recall/Profile/Natural Memory、persona trait参照に同じpolicyを適用。Relationship Stateの巻き戻し・Evidence等の削除は行わない。Shared Memoryその他の別工程は実装していない。

#### Migration / 適用・rollback方針
新規 `20261006200002_forget_control_v1.sql` はservice-only/RLSの暗号化保存表・保存helperを追加し、最新版chat commit、edit、checkpoint、temporary writerを必要なForget保存引数だけ拡張する。旧edit/checkpoint overloadを撤去し、revision/checkpoint/lock順/maintenance guardを維持する。既存memory/historyを一括変換しない。Productionへは未適用。

適用はレビュー後に隔離DB/Previewで検証し、既存maintenance freeze下でDB・Next・Body Clock Edgeを協調更新する。旧app/Edgeと新RPCを混在させない。適用前に現行RPC/権限・root/controlデータと鍵の参照をバックアップする（秘密鍵をGitへ保存しない）。新しいForgetが成立した後に旧appへ戻すと復活禁止を破るため、control tableを削除して単純rollbackしてはいけない。保護を維持した修正をroll forwardし、必要ならmaintenance状態で整合したsnapshotを復元する。既存成功chatを無断で削除しない。

#### 自動検証結果と限界
`TZ=UTC npm test` と `TZ=Asia/Tokyo npm test`: 各251/251成功、skip 0。新規Forget検証48件（共通policy20、API統合19、実migration SQL6、Body Clock追加3）。従来test harnessのimportによる重複登録を解消し、既存固有ケースは維持した。`npx tsc --noEmit`、`npm run build`成功。

| 必須項目 | 自動検証の根拠 |
|---|---|
| 1/2/6/7 UI×・Soft Forget・Recall・Natural Memory復活防止 | API統合: 記憶→forget→質問→40turn→質問（両モード）、共通policy: history60件内外 |
| 3/4/5 Profile・reply・Body Clock/proactive | 実Profile/trait loader・共通context/出力guard・Body Clock canonical/匿名テスト |
| 8 再学習 | 再提示のみはactive、確認の肯定でrelease、新根拠のみ、旧history/未来誤時刻を遮断 |
| 9 同名・部分一致 | 無関係な同名/部分一致/別節保持、曖昧・重複spanはfail closed |
| 10 冪等 | double delete/forget、receipt再試行、control version変更時の古いreceipt拒否 |
| 11 匿名→保存→別端末 | API統合とSQLcheckpoint refresh/retry/恒久再import拒否 |
| 12 保存失敗 | APIとSQLでmemory/control/chatの片側成功を禁止、revision競合rollback |
| 13 quota/refund/atomic save | Free/Premium既存回帰、Forget失敗時、実SQLのcommit/refund/receipt検証 |
| 14/15 Relationship/Body Clock | 全既存固有テストを含むfull suite成功、Relationship実装ファイル変更なし |

意味判定はscripted test doubleを使うため、実Geminiの日本語同定精度を検証済とは扱わない。PGliteは実migration/RPCを最小隔離schemaで実行したもので、Production DB全体のcloneではない。既存Life Factの時刻依存テストはAmerica/Phoenixで失敗するがUTC/JSTでは成功する（今回のLife Fact変更はなし）。Shared Memoryの検証項目は対象外・未実装。

未解決の受入: 実モデルPreviewでSoft Forget/UI×の代表シナリオ・数十turn・確認再記憶・匿名保存/別端末・Body Clockを実施すること。接続済Supabaseに隔離branchがなく、Productionへのmigration/試験書込みは行っていない。ローカル画面試験はブラウザ実行環境の準備失敗で未実施。追加semantic resolver呼出しの実latency/costと実モデル誤判定もPreviewで確認が必要。Production実機の復活防止確認はさらにレビュー・適用承認後の工程であり未完了。

#### PR #66レビュー追補 — Soft Forget正本と追加call数（2026-10-07 JST）

Soft Forgetは生成contextだけをmaskして終わらない。chat routeの `updatedMemory` を `completeCanonicalTurn` がRPCへ渡し、`complete_misaki_chat_turn` が同じtransactionでcontrolを保存して `misaki_user_conversation_state.memory = p_result.memory` とBody Clock snapshotを更新する。現行実装に対象memory残存は見つからず、productionコード/DDL修正は不要だった。

`tests/forget-database.test.cjs` に実chat route→実migration RPC→PGlite DB列の直接読取を追加。入力memory `['弟の名前は隆紀']` に対して現在turn `隆紀のことは忘れて` を送ると、commit後のDB memoryは `[]`、controlは復号するとactive soft_forget、元のhistoryは残る。モデルが旧memoryを再出力するfixtureでも同じ結果になる。無関係な `猫が好き` を同時に保持するケース、およびcontrol保存失敗時にmemory/control/historyすべてが更新前のままで500になるケースも検証した。RPCへのmemoryとDB列の両方をassertしており、Response/context maskのassertだけではない。

`tests/forget-call-count.test.cjs` とBody Clock追加ケースは実route・共通policy・実persona storeのfetch呼出しをカウントする。意味判定応答はscripted doubleで、実モデルの料金/所要時間の測定ではない。下表は単一control、非空history/memory/Today Memory/生成memory/生成Today Memory、retryなし、同じ値の確認再記憶という固定条件の1turnあたりForget追加call数。既存reply生成・retry・表現調整・Relationship workerのcallは追加数に含めない。

| 経路 | traitなし | traitあり |
|---|---:|---:|
| Forget Controlなしの通常reply | 0 | 0 |
| Soft Forget成立turn | 6 | 7 |
| active Forget後の通常turn | 7 | 8 |
| 再提示・確認質問turn | 6 | 7 |
| 確認肯定・同じ値でreleaseするturn | 4 | 5 |
| Body Clock（Today Memory空） | 3 | 4 |
| Body Clock（Today Memoryあり） | 4 | 5 |

内訳: 通常active turnはreoffer判定1 + history/memory/Today Memoryのmask各1 + persona trait mask（非空なら1）+生成memory/Today Memory/replyの検証各1。Forget成立はtarget抽出1がreoffer判定を置換し、固定ackなのでreply検証が不要。再提示も固定確認replyで検証不要。肯定は確認factのtarget抽出1、旧history/Today Memory/生成Today Memory mask各1（同値release後のmemory/outputには対象barrierがない）。Body Clockはhistory/memory/任意Today Memory/任意trait/reply maskで、reoffer判定は行わない。

数は全ユーザー固定ではない。空の入力/出力はcallなし。肯定対象が複数ならtarget抽出は対象controlごと、訂正した旧値のbarrierは追加memory/output判定を必要とし、active/releasedが混在するとhistoryのbarrier groupごとにcallが増える。少数値の固定quotaとして扱ってはいけない。各callは25秒timeoutで、通常active turnにも7〜8回の追加が生じる現行設計のlatency/costは実モデルPreviewで未検証。今回は計測と証明だけを追加し、判定の統合・省略や意味論変更は行っていない。

PRはDraftを維持。merge/Production migration/Edge適用なし。実モデルPreview・Production実機の未完了条件は上記のとおり継続する。

追補の追加テスト10件（DB正本3、chat call計測2、Body Clock call計測5）は成功。UTC/JSTの全回帰は各261/261成功、fail/skip 0。今回の差分はテスト・harness・総覧のみで、前回成功したTypeScript/production build対象のapplication/DDLは変更していない。

#### Batch resolver比較検証（2026-10-07 JST / 検証専用）
本番3-call化は未実施。`tests/forget-batch-evaluate.ts` に同一fixtureの現行/batch両arm比較と実usage/latency取得用live transportを追加。20シナリオのscripted比較と不正応答のfail-closed検証を実施した。barrier/provenanceは現行policyからサーバー側で取得し、reofferは独立callを維持。cache、Relationship Engine、DB schema、Forget semantics、再学習条件、atomic commitは変更なし。結果/全不一致分類は [batch検証報告](../tests/reports/forget-batch-evaluation.md) と `tests/reports/forget-batch-scripted.json` に保存。実Geminiキー未設定でtokens/latencyは未測定、意味判定同等性は未証明。Draft/merge禁止/Production未適用を継続する。

#### 実Gemini Shadow検証の停止・性能最適化の分離（2026-10-07 JST / オーナー承認）

**test doubleによる構造検証は完了しているが、実Gemini Shadow比較は未実施。GEMINI_API_KEY/環境設定不足、およびcanonical非書込みShadow入口が存在しないため。実モデルの精度・token・latency・費用は未測定。したがって現行resolverから3-call batch版への置換は禁止。** 通常chat APIはcanonical commitを伴うため、Shadow検証の代用として実行しない。

構造検証は20シナリオ、検証専用テスト23/23、UTC/JST各全回帰284/284成功。不一致3件と「両者一致だが両方誤り」の人工ケースを分類済。ただし部分一致・人物事実節でbatch側だけ期待結果に一致した結果はtest doubleの比較であり、実モデルの優劣・意味判定同等性・安全性の証明ではない。

性能最適化はForget Control本体から分離する。**PR #66では現行resolverを維持し、batch化コードを本番経路へ接続しない。** 既存batchコードは検証専用のままとし、cacheも導入しない。将来、canonical非書込みのShadow環境と実Gemini認証を用意したうえで、別PRで実Gemini比較→全不一致の人間判定→採否判断を行う。Shadow結果はcanonical DB、Forget Control、reply、memory、Today Memory、persona、Relationship Engineへ反映しない。

現在位置は総覧更新後の停止。PR #66はDraft・未merge、Production migration/Next/Edge適用なし。Forget Control全体のPreview/Production実機受入は引き続き未完了で、完成扱いしない。

#### PR #66 Preview実機受入ゲート（2026-10-07 JST / 最終レビュー固定）

コード・migration・自動回帰の横断レビューでは、通常chat、匿名temporary root、メール保存checkpoint、UI Memory削除、Body Clock、persona trait、quota/refund、古いreceipt拒否までForget Controlの主要保存/参照境界が接続されていることを再確認した。HEAD `a13fb439d1a78f76f5607b8bb6465287fa95b3a3` 時点でGitHub Actions `Canonical relationship integration tests` とVercel statusはsuccess。ただし、これは実モデル・実画面・Production受入の代替ではない。

**Preview実機で合格が必要な項目:**
1. Soft Forget: 「弟の名前は隆紀だよ」→記憶成立→「隆紀のことは忘れて」→直後のRecallで「隆紀」を復活させない。
2. 長期復活防止: Forget後に数十turn会話してから再度Recallしても、古いhistoryを根拠に復活させない。
3. 確認付き再学習: 「弟の隆紀がさ…」の再提示だけではactiveのまま、美咲の確認→直後30分以内の肯定で初めて新しい現在根拠として再学習する。旧historyは解除根拠にしない。
4. 訂正再学習: 旧値を忘れた後に別の新値を教え直した場合、新値だけを学習し旧値を復活させない。
5. UI× Hard Delete: Memory UIの×で対象memoryが消え、その後のRecall・通常replyでもhistoryから復活しない。会話履歴そのものが物理削除されたとは判定しない。
6. 匿名連続性: 匿名でForget→メール保存/checkpoint→保存再試行→恒久化→別端末復元後もcontrolが1回だけ引き継がれ、対象memoryが復活しない。
7. Body Clock/proactive: active Forget対象を自発メッセージ、life context、persona traitから持ち出さない。既存の配送間隔・Push・写真・Relationship挙動を変えない。
8. 失敗系: Forget/control保存失敗を成功表示しない。Freeは既存refund契約を守り、成功済requestはrefundしない。古いpre-Forget receipt/replayは409で再配信しない。
9. 無関係保持: 同名・部分一致・別事実を誤って消さず、対象外memory/contextを保持する。
10. 実画面: iPhone/PCの実ブラウザでMemory削除確認文言、Forget応答、再学習確認、エラー表示に破綻がない。

**実Geminiで測るが、3-call batch採否とは分離する項目:**
- 現行resolverの日本語target/mask/reoffer判定が代表シナリオで意味的に正しいこと。
- 実latency、input/output token、追加call数、概算費用を記録すること。
- 誤判定・曖昧判定はfail closedになり、別人物/別事実を誤forgetしないこと。
- これらはPR #66の現行resolver受入データであり、batch版とのShadow比較ではない。batch比較は別PRまで禁止。

**合否境界:**
- 上記Preview実機項目が通るまでPR #66をReady/Mergeにしない。
- Preview合格後もProduction migration/Next/Body Clock Edgeは明示承認なしに適用しない。
- Production適用時はDB・Next・Edgeを協調更新し、旧app/Edgeと新RPCを混在させない。
- Production実機で代表Soft Forget / UI× / Recall / 再学習 / Body Clockを確認するまで「Forget Control完成」と記録しない。
- 一度Forgetが成立した環境では、旧appへの単純rollbackやcontrol table削除を行わない。復活防止を維持したroll-forwardを基本とする。

**現在の判定:** コードレビュー/自動検証ゲートは通過。次の阻害はPreview実機・実Gemini受入であり、PR #66は引き続きDraft・未merge・Production未適用。
