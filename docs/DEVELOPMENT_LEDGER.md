# 美咲 開発台帳

[総覧に戻る](IMPLEMENTATION_OVERVIEW.md) · [旧台帳・全文保存版](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/DEVELOPMENT_LEDGER.md) · [旧運用索引・全文保存版](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/DEVELOPMENT_OPERATIONS_INDEX.md)

**案件の状態・担当・次の一手を更新する場所はここ。** 状態を変える際は、確認日・PRやブランチ・該当ファイル・検証証拠を残す。main、本番、実機は別々に判定する。

## 中断と再開のチェックポイント（正本）

親目的は [Issue #102](https://github.com/miyazaki1016/misaki/issues/102)。既存の忘れ物棚卸しを再利用し、「エンジン総点検」自体を未完了のまま追跡する。[中断・復帰の手順](WORK_RESUME.md)に従う。自動生成物は候補表示であり、この正本の状態を書き換えない。

初回確認：PR #66は忘却と再学習の実装・テストがある一方、原本では実モデル・本番受入が未完了。PR #100は匿名24時間記憶の設計資料。PR #101は記憶・自律性の監査・計画資料であり、すべて実装済みという証拠ではない。これらは今回再実験せず総点検の入口として再利用する。現在本番の動作は未確認。

<!-- work-resume:v1
{
  "checkpoints": [
    {
      "issue": 102,
      "goal": "エンジン総点検：埋もれた成果の所在・実装・本番利用と再開先を確認",
      "status": "active",
      "updated": "2026-11-12",
      "pause_reason": "",
      "blocked_by": [],
      "next": "既存migration・cron・Auth FKを追跡して匿名rootの物理保持／削除契約を確認し、PR #66とmainの差分から忘却情報の再浮上を防ぐ隔離テストを整理する。続いて感情v2のCAS競合と冪等性を確認する。",
      "completion": "重要エンジンの所在・実装・検証・main・本番利用・実機状態を根拠付きで分類し、未完了の全候補に再開先を残す。全件確認前に親Issueを閉じない。",
      "evidence": [
        "https://github.com/miyazaki1016/misaki/issues/102",
        "https://github.com/miyazaki1016/misaki/pull/66",
        "https://github.com/miyazaki1016/misaki/pull/100",
        "https://github.com/miyazaki1016/misaki/pull/101",
        "https://github.com/miyazaki1016/misaki/issues/102#issuecomment-6806161708"
      ],
      "stages": {
        "implementation": {
          "status": "unconfirmed",
          "evidence": []
        },
        "verification": {
          "status": "unconfirmed",
          "evidence": []
        },
        "main": {
          "status": "unconfirmed",
          "evidence": []
        },
        "production": {
          "status": "unconfirmed",
          "evidence": []
        },
        "device": {
          "status": "unconfirmed",
          "evidence": []
        }
      },
      "resumed": {
        "by": "美咲の総点検担当ソラ",
        "at": "2026-11-12T14:00:21+09:00",
        "from": "既存のエンジン総点検から匿名期限と忘却のコード境界確認を再開",
        "evidence": "https://github.com/miyazaki1016/misaki/issues/102#issuecomment-6815091619"
      }
    }
  ]
}
-->

## 再開時に見る案件

| 案件 | 確認すること | 根拠・入口 |
| --- | --- | --- |
| ラウンジ・会話の再開地点 | 旧台帳の11/03記録と現在のmain／本番を照合 | [旧台帳の引き継ぎ](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/DEVELOPMENT_LEDGER.md) · M-01 |
| 記憶・関係性の開発 | 詳細台帳と関連PRを起点に、実装済みと設計を分ける | [記憶・自律性の総覧](MEMORY_AUTONOMY_PUBLIC_OVERVIEW_20261030.md) |
| 旧監査・未統合資産 | 専用ブランチの詳細台帳を参照。ブランチ全体は統合しない | [詳細台帳](https://github.com/miyazaki1016/misaki/blob/docs/development-registry-audit-20261020/docs/DEVELOPMENT_REGISTRY.md) |

## 案件一覧

運用索引から引き継いだ下表は **2026-11-01時点の記録**。移管時に完了・本番・担当の受諾を再認定していない。更新時は個別の確認日を状態欄に添える。

| ID | 作業 | 記録上の状態 | 引き継ぎ先 | 証拠・所在 | 次の一手 |
| --- | --- | --- | --- | --- | --- |
| M-01 | ラウンジ→オープニング→チャット | 進行中・統合未判定 | 美咲担当ソラ | [旧台帳](https://github.com/miyazaki1016/misaki/blob/fc1424ec1649fd73b1c6e89d2122cd7df5c13038/docs/DEVELOPMENT_LEDGER.md) / `experiment/transparent-lounge-20261027` | 独立HTTPS実機検証の結果を受領し状態更新 |
| M-02 | 旧会話入力・性能計測 | 照合・採否未決 | 美咲担当ソラ | [CHAT_METRICS_PATH_20261101.md](audits/CHAT_METRICS_PATH_20261101.md) | 既存telemetryと旧計測の重複有無を担当へ引継ぎ |
| M-03 | 会話コンテキスト圧縮・旧migration | 高リスク・保全 | 美咲担当ソラ | [LEGACY_CODE_DIFF_20261101.md](audits/LEGACY_CODE_DIFF_20261101.md) | 旧migrationを取り込まず互換性判断待ち |
| M-04 | 外部AIレビュー用Preview | 保全・公開不可判断待ち | 美咲担当ソラ | [FEATURE_RECONCILIATION_20261101.md](audits/FEATURE_RECONCILIATION_20261101.md) | 公開範囲の確認待ち |
| M-05 | 旧監査証拠 | 保全 | 棚卸し担当ソラ | [LEGACY_AUDIT_FOLLOWUP_20261101.md](audits/LEGACY_AUDIT_FOLLOWUP_20261101.md) | 必要な証拠のみ索引化 |
| M-06 | 旧Safari・関係性診断ブランチ2件 | 整理候補・未削除 | 棚卸し担当ソラ | [BRANCH_TRIAGE_20261101.md](audits/BRANCH_TRIAGE_20261101.md) | 参照先確認後に削除可否を相談 |

## 直近の追加案件（2026-11-05確認）

| 案件 | 状態 | 次の一手・正本 |
| --- | --- | --- |
| チャット初期スクロール・履歴読み込み計測 | [Draft PR #151](https://github.com/miyazaki1016/misaki/pull/151)／未マージ・実機検証未了 | 最新CI・実機測定と所有者確認の安全性を照合。5秒遅延の改善効果は未測定 |
| 美咲のバックアップ・安全な復元 | [Issue #159](https://github.com/miyazaki1016/misaki/issues/159)／調査中・実装完了ではない | 既存手動チェックポイントの対象不足、Supabase設定、復元試験を調査。DB変更は未実施 |

## 更新手順

1. [最新の棚卸し結果](https://github.com/miyazaki1016/misaki/actions)から変化を拾う。結果が取得できないときは変化なしと扱わない。
2. 既存案件ID、PR・コミット、ブランチの詳細資料と照合する。新規案件には一意のIDと再開リンクを付ける。
3. 確認できた変化だけをこの台帳に反映する。設計・テスト・調査の長文は個別資料へ。完了の判定には実際の証拠を添える。

[運用索引](DEVELOPMENT_OPERATIONS_INDEX.md)は棚卸しが参照する案件IDと自動取得情報の互換入口。そこに状態・担当・次の一手を書き直さない。

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
| #101 | docs: 記憶・想い出・感情・自律日常の公開用計画資料を追加 | merged | `a4ea7b00da0f213bb865a40044b46d6973f859dd` | 2026-11-05T00:33:44Z |
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
| #136 | Add open PR review handoff report to existing inventory | merged | `4caa708bac259ad2293c7a33ab9442b6b41a9bbf` | 2026-11-02T04:44:10Z |
| #137 | Show human approval route for every open PR in inventory | merged | `a695895d09ded7b11732fa7c1d78b43e3c87ba7c` | 2026-11-02T04:49:49Z |
| #138 | Prepare conservative Vercel build reduction (not enabled) | merged | `49d22ba30353ebe52d2c194a2e8c844bbc84e0e6` | 2026-11-02T11:43:06Z |
| #139 | Define full inventory, ledger and main index completion gates | merged | `5ddc61276a14fbedfa158b33c5c81d534a80bfc5` | 2026-11-02T15:54:37Z |
| #140 | iPhone全画面ラウンジの正式化と通常返信の発話状況を修正 | merged | `0ba21aabc7c0abb0fd1e629400a3e2376577db8d` | 2026-11-02T15:23:31Z |
| #141 | Complete reviewed ledger and main operations-index fact proposals | merged | `6e3df7b41bdce757191c0650a66fad977a8a198e` | 2026-11-02T16:04:56Z |
| #143 | fix: avoid proposal branch collisions on GitHub Actions reruns | merged | `4dfd89e9cf0f333b948e1f9eeba7112b94e73b65` | 2026-11-02T16:21:24Z |
| #145 | Inventory: report shared changed-file paths across work branches | merged | `16a3c9b95ff7559ef66aa4be942a20203cfe8dea` | 2026-11-02T16:37:09Z |
| #147 | Inventory: cross-reference branches, PR history and existing case IDs | merged | `9758a5c6f496eb6614f08485262f9c735bdc350c` | 2026-11-02T16:40:50Z |
| #148 | Inventory: compare exact code patch evidence across branches | merged | `8ab1c012268ad647a80cf5e7fd58f8e39167e2d6` | 2026-11-02T20:49:11Z |
| #149 | Inventory: ranked, evidence-only human review queue | merged | `d9d22481493f88fc93da426895defc29a5c5d0a8` | 2026-11-02T20:53:30Z |
| #150 | fix: reuse existing ledger facts PR on repeated inventory runs | merged | `b47d2a35d48f1df34c987b80fd8dc22dacd2778b` | 2026-11-02T23:27:02Z |
| #151 | WIP: チャット初期スクロールの追従制御（読み込み遅延調査・検証は未完了） | merged | `3ccc345375985e09836979f04617c0f7cc90d197` | 2026-11-10T14:55:02Z |
| #152 | fix: restore ledger facts workflow after invalid YAML merge | merged | `6e5dc7f5964229787069f60f2cd8114596003489` | 2026-11-03T23:40:05Z |
| #153 | feat: mobile GitHub Pages approval dashboard for Misaki and Amefuru | merged | `823e019139b3c3c66762a54e61ae938fe9c154b3` | 2026-11-03T23:53:14Z |
| #154 | docs: document Pages retry procedure after activation | merged | `445b5106d44a042820c20699ac535bfb1791f41f` | 2026-11-03T23:59:06Z |
| #155 | feat: show explicit owner decisions with question and recommendation | merged | `da1ea1eb9569ce1b414211dd2063c7b0187c70c4` | 2026-11-04T03:47:26Z |
| #156 | fix: remove JavaScript source accidentally rendered below approval dashboard | merged | `5733e11fb8e95c6a15d4b939fbc7c9e5f583262e` | 2026-11-04T04:07:04Z |
| #157 | docs: first-pass owner decision triage of 36 open PRs | merged | `aed0b7249c69eb057c2e761014cd386cc9fdea1f` | 2026-11-05T00:42:08Z |
| #158 | feat: prepare authenticated owner-only merge broker (disabled by default) | merged | `a3fa23884039f320803f947babbacad68d433954` | 2026-11-05T00:54:20Z |
| #160 | feat: show Solas handoff queue with copyable PR work instructions | merged | `b25d13349b005da467ca654ecb166cc70e67dbc6` | 2026-11-05T01:34:43Z |
| #161 | docs: unify development management and Sora handoff entrypoints | merged | `bb43cc89b3451bc7d27ab85a3c30db54f91b3794` | 2026-11-05T02:12:19Z |
| #162 | ci: stop automatic previews and skip documentation-only builds | merged | `9ef26156431126c48789016d18e501d56a37cc25` | 2026-11-05T04:42:01Z |
| #163 | docs: 総覧を短くし、案件管理を開発台帳へ集約 | merged | `e75d2702654619ad2f003954f3453f2a76603c6d` | 2026-11-05T04:58:08Z |
| #164 | docs: 開発総覧・運用索引を2026-11-05の最新案件へ更新 | merged | `79225eae87069f5b98dd538a1f4789c49f28005b` | 2026-11-05T05:14:36Z |
| #165 | docs: 美咲のバックアップ対象と安全な復元試験の設計 | open | `5ad808ba0f6bc51de1b4ed66bdf1922ae184e6b1` | 2026-11-05T09:18:03Z |
| #166 | feat(inventory): add searchable work-history index to Misaki daily audit | merged | `b3439dfc31c84e84bc6c1f294582f681d4daf28d` | 2026-11-09T08:17:50Z |
| #167 | 日本語開発履歴：コード・検証根拠の検索と過去結論の継続保存 | merged | `7e25439024253daa1fccef870e9dfe946ddfa4ac` | 2026-11-09T08:56:36Z |
| #168 | fix(history): 棚卸し中に更新されたPRのコミットを確実に取得 | merged | `1bb0eb939af96999692b28ea4e65b55dc3961b15` | 2026-11-09T09:02:29Z |
| #169 | fix(history): main統合とPRマージを区別し、検証条件の検索を補強 | merged | `b4b46c92dc4d11093b125fd92821299929e13b4c` | 2026-11-09T09:08:53Z |
| #170 | docs: require Japanese work-history review before any new development | merged | `afa7b9d94598bace5820034ad7a9b0c750b18520` | 2026-11-09T09:21:29Z |
| #171 | feat(history): 着手前に「以前の実装・検証」を自動提示して再利用判断を確認 | merged | `54e6017b56f435b28fb91a2d6932ca87b9f7bced` | 2026-11-09T09:45:45Z |
| #172 | docs(history): 着手前自動照合の実測と再利用判断を保存 | merged | `2f8ab3ed5c1c1c9a8de55a8514d17929eb5abcd2` | 2026-11-09T09:51:29Z |
| #173 | docs: 日本語開発履歴の引継ぎを通常チャット・Actions経由に対応 | merged | `b02e1e9161c1b46eba111c261bdafc69f54acaa5` | 2026-11-10T02:50:11Z |
| #175 | feat(history): Issueへ照合結果を返却し、引継ぎと検証・完成を分離 | merged | `ab90b75a222676fd3ede283bcf3dabcbc0532ee6` | 2026-11-10T05:03:42Z |
| #178 | docs: 自動照合の合格確認まで案件調査を開始しない | merged | `814dd54d8352b99e1ae1e738108c8d00f68e4d33` | 2026-11-10T05:33:42Z |
| #179 | docs: 照合待機から本題まで追加合図なしで継続する | merged | `e52257dee648a0b25104c5b8bd7fab79f4cc87ef` | 2026-11-10T08:31:49Z |
| #180 | feat(chat): iPhoneで履歴読み込み時間を確認する診断パネル | merged | `29f09d07a2c3b80eaa8300af6827851d127264cc` | 2026-11-10T15:36:10Z |
| #182 | feat(history): iPhone履歴読み込みのDB段階別計測 (#181) | open | `47801ceae351b67dda19c35f48b8a37d742f1f62` | 2026-11-10T17:10:21Z |
| #183 | feat(history): 中断した親目的と再開候補を既存台帳で追跡する | merged | `7c1b6217bdc87411f0e3bbfed143d905590c708e` | 2026-11-10T17:39:03Z |
| #186 | feat(history): 作業の再開待ちと復帰記録を引き継ぎに表示する | merged | `c4fd15dacfbbc8378b6451f3667f63db5dcaca98` | 2026-11-12T06:52:07Z |
<!-- INVENTORY_FACTS_END -->
