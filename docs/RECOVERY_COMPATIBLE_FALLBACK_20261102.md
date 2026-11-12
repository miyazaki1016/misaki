# 匿名会話を維持する受付停止版（ローカル検証）

## 採用案
PR #131の認証namespace・保存形式・root期限検証・replay前検証を保持したまま、新規の独立復旧受付だけを停止する互換版を用意する。新しいDB表、migration、provider設定、環境変数、管理画面、常駐AIは追加しない。

通常版の追加実装: 507b62d、実artifact確認テスト: dafab45。
停止版の独立コミット: 442c0f1（dafab45上の受付フラグ1行だけfalse）。
ベースはPR #131と同一treeのea8a40b。GitHubのPR #131（64f201c）には変更していない。mainの別プロジェクトによる棚卸し修正は取り込まず・修正せず、後の統合時に最新mainとの照合を行う。

## 変更
- lib/recovery-admission-policy.ts：server用受付フラグ。
- app/api/anonymous-recovery/admission/route.ts：公開GET、状態はacceptingの真偽だけ。force-dynamicとbrowser/CDN no-store。認証・会話・個人情報にアクセスせずログも出さない。
- lib/recovery-session.ts：GETが正常かつaccepting===trueの場合だけ受付可能。5秒timeout、HTTP/JSON/通信異常は新規受付のみ拒否。storageを変更しない。
- app/chat/page.tsx：本人confirm→匿名session取得→受付確認→再度同一匿名userを確認→既存の独立復旧処理。停止時は保存情報に触れず案内。待機中のアカウント切替も拒否する。
- tests/recovery-admission.test.cjs：受付ON/OFF、状態不変、停止中の各種既存会話、削除済みmemoryのstale再導入防止、実artifactのAPI応答を確認。
- tests/account-conversation.test.cjs：画面の停止/異常応答/通信失敗/アカウント切替確認。
- tests/recovery-session.test.cjs：実行contextのAbortSignal対応のみ。
- 本資料。計8ファイル（production 4、test 3、資料1）。

PR #131のlib/supabase.ts、lib/device-conversation.ts、chat/history API、lib/canonical-state.tsは今回一切変更しない。人格・感情・新記憶基盤・期限更新規則も変更しない。

## 停止の意味
新しい独立復旧の開始前だけ受付APIを見る。通常匿名・登録・既存の復旧会話のauth/history/send/save/reloadにはこのAPIもフラグも使わない。初めて訪問する通常匿名ユーザーの利用も止めない。
受付OFFは認証provider全体の停止でも、会話の停止でもない。端末への指示を強制するセキュリティ境界ではなく運用上の受付制御である。

## 緊急手順（まだ本番で実行しない）
1. 最初の本番反映前に、受付確認を含む通常版と停止版の両方をレビュー・buildする。旧PR131のまま先に配備すると、その旧clientは受付APIを確認しないので避ける。
2. 本番の正確なsource SHAと、停止版の全source差分がフラグだけであることを確認する。実機・本番反映の承認は別途必要。
3. 新規復旧で障害が起きたら、旧mainを丸ごとrollbackせず、この互換停止版を新しい本番として配備する。新機能を取り消す範囲を受付フラグに限定する。
4. 独自domainの受付APIがaccepting=false、no-storeとなったことを確認する。手動で新しい認証や会話データを作らない。停止中は別承認を得た専用セッションでのみ既存会話の継続を確認する。
5. 旧状態と復旧状態をcopy/merge/clear/signOutしない。Safariのサイトデータ削除やタブ終了による初期化を指示しない。
6. 認証namespace、root検証、replay検証を保ったまま問題箇所を前進修正する。安全確認後、受付trueの互換版を別承認で再配備して受付再開。

停止/再開にはbuild/deployが必要。即時・全世界・全in-flight操作の強制停止は保証しない。配備反映前、またはON応答を受信済みの操作は完了し得る。配備済みの互換clientは操作ごとに独自domainからno-storeで再確認するので、マウント済みのタブも次回確認からOFFに従う。CDN/ブラウザの実測は未実施。

## 検証結果
通常ON版: 全回帰374/374、型検査、Next production build成功。
停止OFF版: 全回帰374/374、型検査、Next production build成功。
元の340件を含むrunner件数。今回固有の新規14件＋harness importによる既存20件の再登録を含む。モデルはscripted、DBはin-memory RPC、認証SDKも合成transportであり実providerではない。
- 期限切れ/検証不能の旧rootは不変。新会話が停止版でも新規メッセージを保存し、再読込できる。
- 通常匿名/登録ユーザーも停止版で送信・保存・reload継続。
- OFF/ON切替API自体でroot/token/期限/RPC回数を変更しない。
- 不正応答、通信失敗、本人cancel時に新scopeを作らず旧cacheを維持。
- 受付確認待機中の別userへの切替を拒否。
- stale editをrevisionで拒否し、削除済みmemoryを古いtokenから生成入力へ戻さない。
- 前工程の複数tab/再訪/replay/期限切れ/SDK隔離テストを維持。

## PRとの関係
推奨は受付確認をPR #131へ追加してから最初の本番へ入れること（今は未反映）。停止版はフラグ1行差の独立した緊急用候補としてローカル保持。停止版だけ別に保持し、PR131 clientをそのまま本番へ出す方式は、古いタブが受付確認しないので不適切。
既存データと新しい復旧データの互換性を守るため、旧main全体へのrollbackを安全策として扱わない。

## 残存リスクと次の承認
本番の実際のauth/root/receipt/競合、iPhone Safari/Chrome/アプリ内ブラウザのタブ・storage・cache・戻る、実モデル応答は未検証。storageやauthそのものが壊れた場合はフラグだけで直らない。互換性を維持した個別修正が必要。タブ閉鎖によるsessionStorage喪失や、従来の正常load期限更新挙動も今回解決しない。
ローカルの停止版は本番で可用性を実証したdeploymentではない。未保証事項を残したまま「安全な本番rollbackを実証済み」とは言わない。
次はこの最小追加をレビューし、承認後にPR #131更新とCIを行う。Preview停止維持・最新main差分再確認も必要。本番merge/deploy、停止版配備、実provider/DB/モデルの1往復検証はそれぞれ別承認。
GitHub push/PR変更/main merge/deploy/DB変更/実送信は今回行っていない。PR #101も未操作。
