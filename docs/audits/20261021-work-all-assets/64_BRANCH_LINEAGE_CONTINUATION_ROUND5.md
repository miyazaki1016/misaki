# 第5次続行：残24枝の全変更pathと23枝の静的分類

2026-10-21 JST。起点 `2efc394c4c06b952545dda07fd590a094e7b42a8`。remote92headsを再取得しmainは `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` のまま。残24枝のうち監査枝自身を除く23枝のHEADは61と一致。監査枝BR-008だけは旧snapshot `9e3f787`→起点2efc394へ前進している。

**今回23件を静的所在・後続置換として分類、旧44件中累計43件、証拠不足は1件。現在挙動の受入ではない。** 未実施試験を合格にせず、歴史的SQLのmain存在を本番適用証明にしない。runtime受入残件は棚卸しとは別に残す。

## 照合方法

全24枝のmerge-base→元HEADの全変更pathを列挙し、23枝についてbranch delta、現在mainの対応path/blobと置換後の責務を照合。削除枝は削除pathと現main不在、代替Edge経路を確認する。PRマージの有無だけで判定しない。固定HEAD/merge-base/path/blob/差分と原文は66/67、全文ではなく追加節だけを読んだ文書は63に明示した。

| ID・枝（HEADは68に固定） | 独自成果・全変更の意味 | mainへの所在・後続置換／保全・未確認 |
|---|---|---|
| BR-002 cleanup/legacy-proactive-tags | 旧lib/proactive-photoの本文キーワードinferTagsと独自scoreを削除、active Body Clockへ意味タグ判断を集約。変更1path | 旧pathはmainで削除済み。現在Edgeのdecision→photoが後継。過去互換語彙を再導入しない。独立タグ判定の廃止という成果を保存 |
| BR-003 cleanup/remove-legacy-proactive-path | 旧Vercel Body Clock API、proactive API、旧photoを削除。pageの45分系定数・未使用sendProactiveMessageと総覧を更新、計5path | 3削除pathはmainにもない。pageはEdge/Push relayとcanonical履歴取得へ。削除済みブラウザー機能を復活させない。古い消したAPI全文は証拠archiveに保持 |
| BR-011 docs/production-source-of-truth-reconciliation | 全4pathが文書。引継ぎ新規、総覧追補、Phase0の本番照合追補、整合化台帳 | mainにない設計・歴史資料。DOC-018/049は既読、052今回全文、035は追加差分のみ。独自差分と現在コードの関係は確定、巨大総覧の本文読了は別残件。UUID SQL復元で旧未発見の一部を解消、現DB未照合 |
| BR-012 docs/relationship-five-axis-design-review-20261015 | 総覧追加節＋38行sensitivity test。5軸の低中域ガイド、Momentumと長期状態分離 | mainにsensitivity testなし、総覧追加節も別Blob。未反映設計・試験資産。現guideのfriendship/trust/affection80等と一致。閾値永久固定や実返信品質のPASSではない |
| BR-019 feature/proactive-derived-tags | decision/photoの2path。感情・行動・方向からtagsを作り、写真を同じ原因でscore | 現Edge両pathに方式は存続。後続044/045とcanonical入力で改訂。本文inferMoodを戻さない。関係5軸/Status/Storyとの全接続を完成扱いにしない |
| BR-020 fix/anonymous-chat-session-drop | guard＋テスト。匿名SIGNED_OUT回復と匿名owner付替えで進行中cacheを保持 | guardは現mainと同一Blob、テストは後続追補。恒久logout消去は維持。暗号rootと認証ID交換の安全性までこのcache対策だけでは証明しない |
| BR-021 fix/anonymous-email-history | 8path。明示email checkpoint→メール送信、owner確認、無資格cache bootstrap撤去、guardによるhydration待機、保存RPCとテスト | layoutと旧SQLはmain同Blob。現在accountはbrowser本文snapshotでなく暗号temporaryState＋pendingを送る。APIはverified root→checkpointへ。旧browser snapshotを正本として再導入しない。正当な保存前認証と保存失敗時メール未送信を維持する契約 |
| BR-022 fix/anonymous-session-cache-reset | guard1path。ownerless掃除を一度だけにして一時owner欠落で現会話を消さない | 現mainにLEGACY_OWNERLESS_CLEANUP_KEYと同処理が存続。033の無条件掃除を精密化。物理cache保持とForget利用権を混同しない |
| BR-023 fix/body-clock-claim-rpc | migration1path。PL/pgSQL曖昧列参照回避、RETURN QUERY、claimの返却復旧 | SQLはmainと同一Blob。現main repository内では旧silence処理も残る。Time枝の新claim設計や本番適用と同一視せず、復旧修正・意図・残差を保全 |
| BR-024 fix/chat-failure-recovery | chat/page/refund SQLの3path。消費したrequest一回返却、独立sendError UI、失敗を会話に書かない | refund migrationはmain同Blob。現chatにrefundIfCharged、pageにsendError。canonicalのcompleted refund guardが後続で追加。旧保存前後の境界をそのまま現在へ戻さない。実際の失敗・返却未追試 |
| BR-026 fix/chat-reliability-cleanup | proxy1path。根拠があれば古い「覚えていない」誤答を引き継がない、診断履歴除外、診断応答入口削除 | 現lib/chat-recall.tsへ移設。proxyは一度だけbaseへ委譲。引用発話の存在をその内容の確実性に昇格させない。Memory Certainty/Forgetは別 |
| BR-027 fix/chat-request-diagnostics | proxy1path。履歴診断prefixに対し件数・語一致数を返す当時の診断口 | 026で診断応答を除去、canonicalでproxyを簡素化。現recallの診断履歴除外だけ存続。旧診断口を製品仕様として復活させない。到達性を可視化した歴史資産 |
| BR-030 fix/gemini-chat-timeout | chat1path。20秒AbortController、initial/retry・status・時間診断、既存failure/refundへ | 043で30秒へ、現在lib/gemini-json-generator.tsとchatへ分離。timeout/429等の物理retryとwrapper再実行を区別。20秒へ戻さず、実コスト・回復率は未実測 |
| BR-032 fix/grow-relationship-from-first-meeting | chat、fallback2path、人格module更新SQL。最初から恋人という固定設定を撤去 | fallback2本とSQLはmain同Blob。現acting guideは明示status優先。基本人格の継続とPair関係の成長を分離。共通modulesの実DB値や全更新writerは未確認 |
| BR-033 fix/legacy-safari-cache | guard＋テスト。ownerless古いSafariデータを新ownerへ結び付けない | 現guardは022の一回限りmigrationへ精密化、020の一時回復も追加。無所有cache破棄と正当な匿名連続性を同時に守る要件を保全 |
| BR-034 fix/preserve-active-chat-history | sync1path。localがserverの追記ならupload、in-flight変化時は棄却 | 現syncはGET専用の表示cache更新へ置換。成功turnはserverが保存し、client cacheをuploadしない。古い5秒同期・local authoritative方針へ戻さない |
| BR-038 fix/safari-load-failed-message | page1path。catchで通信エラーをmisakiバブルへ追加する処理を撤去 | 現pageの独立sendErrorへ発展。会話history・Memoryにネットワークエラーを混ぜない。実Safariでの今回再現なし |
| BR-040 fix/use-chat-proxy | proxy1path。recall questionにhistory優先・根拠なければ創作しない案内を追加 | 026等を経て現chat-recallが直近20件を追加、chatがcanonical historyを渡す。元名称だけでproxy独自正本を再構築しない。旧「memory確認」は全履歴検索完成ではない |
| BR-041 fix/workday-grounding | chat1path。ユーザーの勤務/休暇を根拠なく断定しない。美咲の日中勤務・朝の夜勤明け表現を防ぐ | 現chatのworkTimingGuide/findDayTypeProblemsとユーザー勤務ガイドに存続。Life Facts/確度/時点と接続する回帰要件、同じ役職のキャラ全体への固定化はしない |
| BR-043 perf/chat-stage-timing | chat1path。20→30秒、request/auth/quota/persona/weather/life/Gemini/totalをtraceIdで計測 | 現chatのmeasureStageと生成器へ存続。匿名統計の計測基盤であり速度・費用削減の実証ではない。秘密本文を観測用データとして無制限に残さない |
| BR-044 refine/proactive-action-tags | decision1path。emotionをactionで抑制、PULLの甘さ撤去、RECONNECTを温かさへ、concernの根拠要求 | 現decisionに存続。CHASEのexplicit OR concernedと、後段directionでのtag追加の残差も見える。個別抑制を全組合せの整合性保証としない。PULL/SULKは罰・敵意ではない思想 |
| BR-045 refine/sleepy-tag | Edge index/decision/photo3path。同じcurrentTime共有、sleepyを0〜5時の保守的身体状態へ、relax撤去、selector4 | photoはmain同Blob、decision/Edgeは後続canonical入力等で改訂。夜だから必ず眠いにしない。写真と文章のForget世代整合は別未検証 |
| BR-047 sora/canonical-relationship-integration | 変更は総覧1pathだけ、追加104行。shared-world自然挿入・個人追跡禁止・homeとcurrent place分離、10/2 cutover checkpoint | 後続mainの総覧historyに保持された歴史文書成果。trace/deployment/実機成功は当時の記録。親にある巨大統合実装全部をこの枝の独自変更と数えない。shared-world思想をIDEA15へ |

## 重要な置換のつながり

- 匿名保存：owner付替え／メール前snapshot→暗号root・server checkpoint→恒久化。cache保持だけで所有権・Forget・importの利用権を保証しない。
- Recall：proxyの案内／診断→診断撤去・正しい想起の案内→canonical chatと純粋helper。現在「発話履歴にある」は主体や内容の真偽・利用許可の証明ではない。
- 自発性：旧browser/API整理→Edge共通decision/photo→旧claim復旧。さらにTime枝にあるurge/何もしない/Story写真抑制は別の未反映成果。mainのselector4があることだけで後者を消化済みにしない。
- 人格：固定「恋人」撤去→関係に応じた距離感→status優先guide。Character共通の基本人格とPair私的成長の分離が将来複数キャラの回帰条件。

## 残るBR-008と受入残件

BR-008は監査専用の動く枝。mainとの差は文書・監査証拠で、コード変更はない。ただし原DEVELOPMENT_REGISTRY全文と残巨大総覧の意味精査が完了していない。自分で保存した監査資料の存在だけをもって、全開発成果が保全済みと自己認定しない。旧headと現在headを分けて68に保留を残す。

旧44件の証拠不足が1件になったことは、92枝の全機能が本番動作確認済みという意味ではない。01〜62、legacy BLOCKED、main外workflow参照、未実施16試験は保持。PR merge・枝削除・workflow変更・deploy・DB接続なし。
