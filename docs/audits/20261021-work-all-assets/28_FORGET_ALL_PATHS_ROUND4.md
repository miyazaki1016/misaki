# 第4次精査：Forget後の再利用・派生・再提示
2026-10-21 JST。監査未完了。起点 b56194ec6c608f0cb13574e4d6c42397dd0ab282、main c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa、Forget #66 HEAD 84d147ba5b46698d3b46fb727a9859f87f79f3d2。全参照のBlobは35、再取得可能な固定パスは36。19の14入口を引き継ぐ。調査・文書化のみ。再現済み不具合0件。

## 結論
#66は全経路の忘却成立を証明していない。workerの保存済み入力・retry journal・Evolution候補・確定済み配送・表示キャッシュの利用権は別々に追う必要がある。ただし関係状態の保持自体を忘却違反としない。保存、利用、再提示、派生情報の失効、物理消去は別の責務である。

## 14入口から下流への追跡
M=main、F=#66。位置は固定ソースの1始まり。未検証リスクは実際の漏洩観測ではない。

| 入口 | 保存元→読取→派生・一時保存→再提示 | Forgetの位置・既存保護 | 残る不足・必要な検証 |
|---|---|---|---|
| 1 通常chat root | conversation state / temporary root→canonical-state→chat | M本人の正本、F forgetContext | 正本選択と利用許可は別。別user/character・旧revision・同時Forgetを区別 |
| 2 Memory/Life Facts/Profile | memory文字列と[life:v1]→selector/profile→Prompt | Fフィルタ後のhistory/memory。M期限とconfidence | confidence=1は事実認定ではない。訂正/第三者/期限/忘却の組合せ |
| 3 History | history最大60→contents→生成 | F history barrier、release後も古い行を保護 | 保存履歴の保持は仕様。モデルへ渡す経路と画面表示を分ける |
| 4 Recall | 直近20件→追加userText→reply | F適用後のhistoryを利用する資産 | 旧秘密・誤ったassistant発話・引用・同名の独立oracle |
| 5 Persona | global modulesとuser traits→persona-store→chat/Edge | F traitsをderivedでmask。global cacheは共通modulesのみ | 共通人格へ私的経験が移っていないかは全管理writer未確認。所有キーは将来pair対応が必要 |
| 6 生成/retry/expression | safe context→各モデルattempt→reply/memory/today | F出力mask、reply改変必要時の拒否 | 意味判定はGemini依存。遅着出力、false negative、訂正済み旧値 |
| 7 成功commit | result→complete RPC→history/memory/event/receipt | F control保存と成功commitの同一transaction | 最新controlと古い処理の整合。SQL適用は未確認。worker event metadataは別参照元 |
| 8 匿名/登録移行 | 暗号root→checkpoint→恒久状態/Relationship import | revision/expiry、F forget payloadを一度引継ぎ | pending内message/reply、凍結snapshotの分析、旧tokenとcontrol、恒久化途中を試験 |
| 9 UI削除 | deleteMemory/clearMemory/clearHistory→edit RPC | M操作を分離、F memory削除とcontrolを原子化 | history完全消去ではない。派生candidate/通知/display失効の定義が別途必要 |
| 10 Receipt/Replay | canonical event metadata /暗号receipt→再送HTTP | F forgetVersion比較、M request/message整合 | 比較後送信前の競合、既にin-flightの古いHTTP。UI世代確認を保証しない |
| 11 Relationship worker/Story | completed event→Evidence→Episode→Pattern→State。別にsignal events→Story→Acting | lease/token/processing version/同一user/順序。F worker二ファイルはMとBlob一致 | 29参照。retry journalも入力。Storyを自由文の新規記憶登録と混同しない |
| 12 Identity | #67 relationship version/status/critical→関係の自己認識 | 人物照合ではない。旧19を継承 | Forgetによる事実利用制御と関係名の継続性は別。今回#67全再精査はしていない |
| 13 Body Clock/写真/通知 | root→life/decision/persona→reply→photo_context→delivery→relay→OS | F入力/出力mask、既存finish revision/updated_at、relay同意確認とattempt一意 | 30参照。確定後Forget、通知停止、Free/Premium話題源、写真と文章の世代整合 |
| 14 browser/cache | localStorage履歴/sessionStorage root・pending/React state→復元/同期 | owner確認、no-store、正本へキャッシュを自動uploadしない | multi-tab/遅いGET/再login/offline/画面復活。history保存≠再提示許可を明示する |

## 再利用する既存成果と責務
- #66のbarriersForはactiveに加えderived、release前history、blockedHistoryKeysを扱う。再学習が古い情報の再許可にならない思想を保全する（forget-control.ts:121–181）。
- requestId、source_request、episode-evidenceリンク、pattern derived_fromは派生依存関係を辿る既存の足場。全派生物へsource/control世代が既に実装されたわけではない。
- leaseは所有権、processing_versionは解析器の世代、relationship_state_versionは関係正本の世代、temporary revisionはroot更新、forgetVersionは利用権の状態。相互に代用しない。
- Storyのmeaningや関係scoreを全消去する案は採用しない。機微事実の再言及禁止と、抽象的関係状態を残せる条件を別途決める。
- 旧20のLab独立oracle/Q16と#66 scripted doubleを回帰設計に再利用できるが、実モデル安全性の認定はない。

## 共通検証契約（今回未実行）
各経路でT0読取→T1 Forget成功→T2分析完了→T3保存/送信を制御する。最新の利用権と一致しない結果は採用しないことを期待値候補とし、関係statusを勝手に巻き戻さない。Forget前成功receipt、released後旧history、再Forget、同名別人、別user/pair、空/不正control、タイムアウトを組合せる。
外部Job/DB現物/ブラウザー実機/実Geminiは未確認。全GitHub枝の全SQLと全依存graphの網羅は未完了。
