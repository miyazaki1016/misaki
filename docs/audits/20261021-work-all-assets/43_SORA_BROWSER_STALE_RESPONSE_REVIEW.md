# ソラ第5次部分精査：ブラウザーの遅着応答・表示キャッシュ・Forgetの競合

2026-10-21。**監査未完了。固定ソースの静的照合のみ。** Forget #66 HEAD `84d147ba5b46698d3b46fb727a9859f87f79f3d2`、main比較基準 `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。第4次資料30、第5次38〜42の続き。実ブラウザーで再現試験は行っていない。本番脆弱性の認定ではない。

## 照合済みコード

| ファイル | Forget枝のBlob SHA | 関連箇所 |
|---|---|---|
| `app/chat/conversation-history-sync.tsx` | `3f39da1597ed5b12c7effff2420a3c1f7f571fc4` | 8–14 `sameHistory`、18–47 GETとガード、47–73イベント発火とキャッシュ更新 |
| `app/chat/page.tsx` | `0e952f84978577e5b8cbd6e7a3a9de571345258e` | 710–756 root/history event、初期load、1020–1054削除、1188–1202送信開始、1285–1377返信結果採用 |
| `lib/device-conversation.ts` | `72247015ec7b6521ae461b1c468ee8cb6d44e97a` | 6–21 device owner切替時storage掃除とcache ownership |
| `app/api/chat/route.ts` | `9bf009f871eba55732986807445337cc557ac179` | 1809–25 replayのForget世代比較（既存対策） |

## 静的な制御経路

1. `conversation-history-sync.tsx` はuser ID、セッションの匿名性、送信中フラグ、`sameHistory(before, readHistory())`でGETの結果採用を制限している（18–46）。`sameHistory`はhistoryの**件数・role・textのみ**を比較し、MemoryやForget世代を比較しない（12–14）。この防御は認証所有者の変化やローカル履歴の変化には有効な範囲があるが、他タブでのMemoryのみ削除を直接検出する契約ではない。
2. 取得結果の`misaki-root-state`イベントは47行で発火し、`page.tsx` 712–716の`applyRoot`が`setMemory(state.memory)`を行う。つまり**historyが同一であっても、遅着したroot-stateがMemoryを上書きし得る経路**が静的に存在する。これは再現済み事象ではなく介入試験対象。
3. 47行のroot-state dispatch後、usage RPCを待機する（50–63）。その後`state.history`の一致確認（65行）やlocalStorage更新（69行）、history event（73行）へ進むが、**usage await後に改めて所有者・世代・ローカル変更を確認する記述がない**。待機中に別タブのForget等が進むと、履歴表示の競合を評価する必要がある。
4. `page.tsx` 初期loadはサーバhistoryをPOSTで取得し（736–746）、戻り後にuser ownershipを確認して`applyRoot`/history採用を行う（748–756）。**同一owner内のForget世代比較**はこの採用点に見えない。旧キャッシュを一旦表示する（731–733）既存仕様との関係も評価対象。
5. `page.tsx` の`changeStoredState`は現在タブで送信中・pendingがあれば操作を拒否し（1020–1021）、state変更後にowner再検査・setMemoryする（1033–1037）。これは**同タブ**競合を減らすが、別タブ・他の未完了GETの失効を包括的に保障するものではない。
6. `sendMessage`後の応答採用はrequest ID/pendingとownerを用いる（1188–1202、1285–1377）。サーバ側chat replayにはForget世代不一致409がある一方、**一度生成済みのHTTP結果をUIが受け取るまでに別タブでForgetが成立する窓**は追加テスト対象。サーバが409を返すケースと、レスポンス作成後に遅延到着するケースを区別。
7. `no-store`、storage ownerチェック、正本優先設計は既存資産として保持すべき。これらの存在は旧画面stateの無効化・全tab同期・HTTP応答世代チェックの完成とは同義でない。

## 特に再現計画を立てるべき時系列（未実行）

| ID | 介入手順 | 独立oracleの期待候補（仕様確定前） | 検証先 |
|---|---|---|---|
| UI-01 | Aタブでhistory GET開始→BタブでMemoryのみForget→Aに旧root-state GETを解決 | 忘却したMemoryがAのReact stateへ復活しない | sync:12–14/43–47、page:712–716 |
| UI-02 | Aタブでhistory GET開始→Aがroot-state dispatch→usage RPC待機→BタブでForget/履歴変更→Aがusage解決 | 最新のHistory/cacheへ旧stateを上書きしない | sync:47–73 |
| UI-03 | ページ初期load開始→同一ownerで別タブForget→古いload応答到着 | 旧Memory/historyを採用しない。初期localStorage表示の扱いも定義 | page:727–756 |
| UI-04 | Chat応答サーバ生成完了→別タブでForget成立→旧成功HTTPが到着 | 旧情報の画面表示・再保存に利用しない。409 replayと別契約 | chat route:1809–25、page:1285–1377 |
| UI-05 | Logout/loginまたはowner変更中にGET/返信が到着 | 別ownerへ漏れない。現owner guardの範囲と非同期更新を確認 | sync:25–46、page:748/1287、device-conversation |
| UI-06 | offline→ローカルcache表示→オンライン復帰 / 複数タブでForget | 古い表示内容を現在の再提示許可と区別する。通信不能時のUI方針を先に定義 | page:731–756、sync focus/visibility |
| UI-07 | clearHistoryとclearMemoryを別操作、古いserver reply/GETが遅着 | history削除とMemory/Forget barrierの異なる効力を守る | page:1020–1054、canonical root/receipt |

独立oracleでは「root-state Memoryが新しい状態へ戻る」だけでなく、表示が短時間でも古い秘密を再表示したか、再送・新しいPromptへ混入したかを別々に評価する。scripted fixtureの成功を実運用の安全保証と呼ばない。

## 修正実装に先立つ判断（今回は採用・実装しない）

- UI側に`user×character`の状態世代/無効化通知が必要か、既存`updated_at`/temporary revision/Forget logical versionが信頼できるかを整理する。ローカル時計だけの単純な比較で安全としない。
- `misaki-root-state`・`misaki-history-state`・直接のHTTP応答で共通の「結果採用時の利用権」ルールを共有できるか検討する。
- サーバ側のForget完了境界と他タブ通知、offline中の表示抑止はユーザー体験と運用ルールを含む。派生物・Body Clockと同じ保証水準を前提にしない。

## 進捗・制限

新たな静的検証資料1件。残文書45版・証拠不足ブランチ30件は**今回加算なし**。再現済み漏洩・バグ0件（試験未実施であり問題ゼロの意味ではない）。legacy BLOCKED、main外workflow参照資産保護を維持。

main・本番Misaki・Supabase・アメふるへの変更、DB/migration、PR merge、枝削除、deploy、有料Gemini、機能実装なし。
