# 第4次精査：Relationship worker・Story・再開
固定HEAD/Blobは35。mainと#66のrelationship-runtime-v1.ts、relationship-processing-v1.tsは完全に同じBlob。Forgetを接続済みのworkerとは数えない。

## 実際の経路
1. runtime:54–74はSTART_AT以後のchat_turn_completedをid昇順に読み、appliedを飛ばし一回最大3件。前のdeferredで停止する。
2. processing:37–90はclaim取得、replayed claim拒否、token保持、renew、外部モデルの前後check。turn:188–193はイベントmetadata.message/result.replyを読む。現在のmemoryだけが入力ではない。
3. processing:78–84と141付近はfailed journalからstageとcompact evidenceを復元する。journalにはinterpretation/subject/supportingTurnを含め得る（compact:32–35）。古い解析候補は再モデル呼出しなしで使われ得る。
4. Evidence→Episode→Pattern→Stateは段階保存。Evidence解釈、episode summary、pattern summary/リンク、applicationsのbefore/after stateが別の保存物。
5. pendingはvalidator前に作成し、resolved/dismissedを再処理しない。status確定はcritical RPC。Forgetと関係解消を同一操作にしない。
6. anonymous runtime:17–50はpendingのmessage/replyが暗号root.historyに存在するか確認して分析する。import:88–113は恒久化後の凍結snapshot pendingをメモリで完了し一度だけimportする。checkはleaseでありForget判定ではない。

## Storyの区別（第3次の入口を具体化）
lib/relationship-patterns.ts:41–94,157–190のStoryは、emotion_action_v2_after_chat/temporary_relationship_checkpointの最新40イベントにあるsignal_summary/signalsからhurt/repair/care/trustを集計する。出力はunresolvedHurt、repairStage、meaning、lastMeaningfulAt。自由文の出来事を格納するStoryテーブルを今回の追跡で確認したわけではない。
chat:1861–1871は恒久の認証済みclient（RLS依存）又は匿名snapshot.eventsからstoryを導出し、2647の表現ガイドへ渡す。worker v1のEvidence/EpisodeからこのStoryへ直接再登録する呼出しは、確認した二ファイルにはない。これを「古いworkerが秘密をStoryへ再登録する確認済みバグ」としない。
一方、Story/Patternの抽象的な関係解釈がForget後も残ることの許容範囲は未決。RLS現物・全writerは未確認。

## 保護と未検証リスク
| 対象 | コードで確認した保護 | Forgetとの不足/検証条件 |
|---|---|---|
| worker所有権 | active lease/token、renew、失効時deferred、token単位release | 有効leaseのままForgetが成立する競合。leaseが生きていても旧情報の利用許可は別 |
| retry | phase復元、saved evidence利用、冪等キー | analyzing/ evidence_saved/episode_saved/pattern_savedそれぞれで停止→Forget→再開。journalも失効対象判定へ含める |
| RPC保存 | 10/3 full fencing→直接v2 writer、canonical completed turn、同user evidence/episode所有確認 | p_forget_version相当の条件を確認した最終worker RPCには見つけていない。保存の可否と関係状態保持を仕様化して試験 |
| 古い関係状態 | critical event、source version、pending guide等の資産 | 関係解消とForgetを混ぜず、境界/拒絶を消して勝手に恋人へ戻さない |
| 匿名import | 暗号認証、期限、revision、checkpoint、一度だけimport | 読取後Forget/恒久化、pending message/reply、古いrootの分析結果を適用しない条件を確認 |
| 再提示 | Acting/Storyは構造化解釈 | 機微事実そのものと抽象状態を独立oracleで判定。内容の影響を一律バグにしない |

## IDEA12（監査から導いた原則・未実装）
実行leaseの有効性と、元情報の利用権の有効性を分ける。source requestと派生リンクを活用し、retry journal・候補・表示・配送にも利用権の世代を追跡する案。既存lease/RPCを置換・回避せず、元の関係Engineの意味を変更しない。既存IDEA11の非同期処理への具体化であり、新完成機能ではない。
