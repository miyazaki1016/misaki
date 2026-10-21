# ソラ第5次：ブラウザー結果採用とサーバForget完了の整合性

2026-10-21 JST。**監査未完了・静的ソース確認。再現テストなし。** Forget PR #66 HEAD `84d147ba5b46698d3b46fb727a9859f87f79f3d2`。main固定比較基準 `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。資料43のUI入口と41のSQL保存境界を繋いで確認。新規の設計/検証事項であり、実際の本番漏洩を発見した報告ではない。

## 固定証拠

| 対象 | Blob SHA | 行と観測 |
|---|---|---|
| `app/api/persona/history/route.ts` | `c99434f06f76525339a46a22a8bf22d6ed2440b4` | 16–20 responseStateには`updatedAt`あり、Forget controls/versionはHTTPに含めない。22–27 GETはcanonicalをそのまま返す。84–86 POST loadも同様。92–116編集→Forget control登録→DB edit→canonical再読込。 |
| `lib/canonical-state.ts` | `20445722e4ea90bc00a192fb8244f8614eeb0a44` | 86–91 relationship/conversationを読んだ後、別クエリでforgetControlsを読む。104–110 rootとして組立。117–120 `misaki_forget_controls`読込。159–167 turn結果のcontrolsをSQLへ渡す。 |
| `app/chat/conversation-history-sync.tsx` | `3f39da1597ed5b12c7effff2420a3c1f7f571fc4` | 12–14 `sameHistory`はrole/text、43–47 owner/history一致ならroot-state event、50–73 usage RPC後にcache/history反映（資料43）。 |
| `app/chat/page.tsx` | `0e952f84978577e5b8cbd6e7a3a9de571345258e` | 712–721 root-stateがmemoryを採用、727–756 page load採用、1020–1037編集後のmemory採用、1285–1377応答採用。 |
| `app/api/chat/route.ts` | `9bf009f871eba55732986807445337cc557ac179` | 1805–27 replay時の最新forgetVersion照合による409拒否、1830–39生成開始のcontrol取得、2784–95生成結果mask/controls/version/rootUpdatedAt。 |
| `supabase/migrations/20261006200002_forget_control_v1.sql` | `78311ec1cfe16007c5f9e333b5b692da0b304e5a` | 72–77 canonical成功turnのroot lock/updatedAt比較後control保存。116–139 Memory編集でcontrol+root更新が同一transaction。 |

## 重要な境界別の判定

**FSC-01: Forget完了時の正本変更とブラウザー表示更新は別の操作。**
`edit_misaki_conversation_state`はSQL transaction中にcontrol+Memory/historyとroot updated_atを更新する設計。編集HTTPはその後`responseState(await loadCanonicalState(...))`を返し、当該タブは`setMemory`する。しかし同一ユーザーの別タブが持つ既存React stateや、Forget完了前からin-flightだったGET/POSTの採用可否は編集SQLのatomicityだけでは保証しない。

**FSC-02: HTTP history stateにupdatedAtはあるが、UIは結果採用時に利用権を検証しない。**
`responseState`が返す`updatedAt`はchat/history画面上のUIが忘却世代を比較する契約として使っていない。同じ`userId`・同じhistoryなら、Forget後に旧GET結果を反映し得る静的構造がある。今回、順序制御した実ブラウザーで再現していないため**未検証の競合可能性**とする。

**FSC-03: canonical rootの多段読取は「一貫したForget世代のSnapshot」ではない。**
`loadCanonicalState`はconversation row（history/memory/updated_at）を読み、その後別のクエリでForget controlsを読む（86–91）。同時にForgetが入ると、**古いconversation row + 新しいcontrols**の組が組み立てられる時系列を理論上考えられる。反対順序や内部transaction isolationについては今回テスト未実施。controlが新しければ後段のmaskで保護し得るが、GET履歴APIの`responseState`はhistory/memoryをmaskせず返している（16–20、27、85）。ゆえに「サーバ正本を読むから、全画面応答がForgetポリシーでフィルタ済み」とは主張できない。

**FSC-04: chat replayには明示的なForget世代照合があるが、load/syncと通常応答まで同一保証ではない。**
Replayでは`forgetVersion(latestRoot.forgetControls)`とcompleted payloadのversionを比較し409を返す。これは既存の重要な対策。いっぽう、結果構築後から通信配送/画面採用までの窓は別。UIには同じ比較の処理を確認していない。

**FSC-05: root updatedAt は便利でも万能な「Forget世代」ではない。**
#66のUI Memory編集ではupdated_atが進む設計で、通常の同時更新排除に利用可能。ただしcontrols自体は別表でupdated_atを持ち、匿名rootやother-control writer、既存in-flight replyの結果採用をすべて表現できるかは未証明。セキュリティ保証を`timestamp`比較に単純化しない。

## 独立oracleによる追加試験案（未実装・未実行）

| ID | 介入 | 期待結果候補 | 具体的観測 |
|---|---|---|---|
| FSC-T01 | history GETがconversationを読んだ後で停止→別タブでForget commit→旧GET完成 | Forgot secretをHTTP/画面に再提示しない。表示用historyをどうmaskするか先に仕様化 | SQL状態、HTTP本文、React memory/history |
| FSC-T02 | root-state GET開始→Forget後に取得結果遅着→`misaki-root-state`発火 | 古いMemoryをsetMemoryへ戻さない | イベントペイロード、既存/current世代 |
| FSC-T03 | `misaki-root-state`発火→usage RPC保留→別タブでhistory変更→後から旧GET history採用 | UI cacheと画面を古い履歴へ上書きしない | localStorage、history event、React |
| FSC-T04 | 通常chat生成がForget前に結果作成→Forgetが別タブで成立→HTTP返信到着 | replyとupdatedMemoryを旧利用権でUI採用しない。サーバ失敗/commit拒否とUI失効を区別 | canonical commit応答、body、React、requestId |
| FSC-T05 | completed replayでForget世代変更 | 既存の409防御を維持し、正常replayまで拒否しない | サーバ409、本人同一世代で200 |
| FSC-T06 | 匿名temporary root revision更新とForget/ログイン切替が並行 | 本人確認・revisionとcontent利用権の双方で古い秘密を受け入れない | encrypted root、revision、pending/recoveredTurn |
| FSC-T07 | Forgetのみ変更 / Memoryのみ変更 / historyのみ変更を別々に発生 | 各操作の責務と表示契約を混同しない | SQL updatedAt、control payload、UI/HTTP |

## 設計判断を急がないための留保

- Historyの物理保存と再提示禁止は別。**既存historyをすべて削除すべきだという結論ではない**。GETのマスキングや表示仕様を検討する際、再提示対象/引用/同名別人の独立oracleが必要。
- `updatedAt`は現GETレスポンスにあるが、Forgetの完全なgenerationを示すと断定できない。論理世代・source provenance・無効化シグナルの要否は設計課題。
- サーバの原子的編集、チャットretryの409、端末所有者の確認、no-storeは既存の安全性資産。改善する際に壊さないこと。
- これまでの第5次成果38〜43と一体で次回の仕様レビューへ回す。**mainや本番の修正はユーザー承認後**。

監査進捗の分母は据置：文書40/85精査済み（残45）、証拠不足ブランチ30。legacy BLOCKED維持。本番DB/実ブラウザー/実モデル未確認。main・本番・DB・アメふる、PR merge、枝削除、deploy、有料Geminiは変更・実行していない。
