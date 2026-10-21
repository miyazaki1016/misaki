# ① 全ブランチ一覧（実測スナップショット）

取得92件、100件指定の次ページ0件。main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。詳細・完全SHAは branches.json。日時はコミット日時（UTC）であり、枝作成時刻ではない。

| ブランチ | HEAD | 最終commit UTC | 目的（PR/commit由来） | 状態 | ahead/behind | PR | Preview履歴／HEAD |
|---|---|---|---|---|---|---|---|
| chore/restore-relationship-rpc-migration | 4dd716a2c04c6864445cb8720a1921813bb50933 | 2026-10-14T11:49:50Z | chore: restore applied relationship RPC migration | 7 SQL本文はmainと同一・再適用禁止 | 1/1 | #82 merged | 1件／READY |
| cleanup/legacy-proactive-tags | 275529187bc54a7151de3aa06ed4c6b07362d1fd | 2026-09-17T13:59:07Z | 旧自発APIの独立タグ推論を廃止する | 7 関連PRマージ済み、現行機能同等性は要確認 | 2/349 | #13 merged | 0件／HEAD該当なし |
| cleanup/remove-legacy-proactive-path | 242e1e8d1fac7dac1ff90e4d02a05c5f2afd6369 | 2026-09-18T00:13:17Z | 旧ブラウザ自発メッセージ経路を削除する | 7 関連PRマージ済み、現行機能同等性は要確認 | 7/339 | #23 merged | 0件／HEAD該当なし |
| codex/legacy-maintenance-drain | 17449c7ec4e8ff50605ef931b04ae76584c6304f | 2026-09-19T21:30:53Z | 旧schema互換の先行maintenance/drain設備を独立追加 | 9 安全上BLOCKED（CIと文書の不一致あり） | 7/323 | #30 open/Draft | 1件／READY |
| codex/server-canonical-foundation | 685fbb7baee4a542555f939fabaecd674658c148 | 2026-10-02T08:11:20Z | 美咲の根本状態をサーバー正本化する基礎工事 | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/174 | #29 merged | 1件／READY |
| design/shared-conversation-engine-contract-20261015 | daded504b1d2834ed4d7b4a6d0758e89841aed74 | 2026-10-15T08:13:52Z | design: shared Misaki conversation engine for production and tuning lab | 1 文書設計・監査（実装済みとはしない） | 1/0 | #87 open/Draft | 1件／READY |
| docs/audit-overview-against-source | f6d8baf94d037057ec94deb87b156a713445d37f | 2026-09-17T23:35:49Z | 総覧を最新mainソースと再照合する | 1 文書設計・監査（実装済みとはしない） | 1/340 | #22 merged | 0件／HEAD該当なし |
| docs/development-registry-audit-20261020 | 22a22826569fe06aa294b95afaac5e38cdc92642 | 2026-10-21T02:50:23Z | docs: inventory branch document trees 17-24 of 92 | 1 文書設計・監査（実装済みとはしない） | 88/0 | 該当head refなし | 87件／READY |
| docs/multi-character-data-scope-inventory | ad51dfe248fdf9a6903f4ff193f437bf04b2d80c | 2026-10-13T07:40:56Z | docs: multi-character data scope inventory | 1 文書設計・監査（実装済みとはしない） | 1/1 | #79 open/Draft | 1件／READY |
| docs/multi-character-rpc-caller-audit | 83476dd2d347687c253a471557d9c27b82e1caf7 | 2026-10-13T08:53:36Z | docs: audit multi-character RPC callers | 1 文書設計・監査（実装済みとはしない） | 9/1 | #80 open/Draft | 8件／READY |
| docs/production-source-of-truth-reconciliation | ce8e41f47af98f766c75e1f27787d0b585c452a7 | 2026-10-14T00:30:10Z | docs: reconcile production source-of-truth and management drift | 1 文書設計・監査（実装済みとはしない） | 17/1 | #81 open/Draft | 17件／READY |
| docs/relationship-five-axis-design-review-20261015 | 8a7f467761f9c5b42be4bb375d616eec67d47c7c | 2026-10-14T20:22:04Z | docs: 5軸成長速度とRelationship Engine思想の照合を総覧へ追記 | 1 文書設計・監査（実装済みとはしない） | 4/0 | #84 open/Draft | 4件／READY |
| docs/relationship-v1-2-stage-growth-principles | ed8359319181f20cf73aec87ab75c7a1405264f2 | 2026-10-04T04:41:44Z | Document Relationship Engine v1.2 Stage and growth principles | 1 文書設計・監査（実装済みとはしない） | 10/52 | #60 open/Draft | 10件／READY |
| docs/update-implementation-overview | 621dea871afc4dca517071cc79666d81cb69e29c | 2026-09-17T23:29:33Z | 直近の実装・修正総覧を更新する | 1 文書設計・監査（実装済みとはしない） | 1/341 | #21 merged | 0件／HEAD該当なし |
| docs/update-overview-relationship-growth | 1d9db32ea15fbea950ac46090cb6e1a8bc750001 | 2026-09-18T03:15:09Z | 総覧を関係成長・応答診断の最新状態へ更新する | 1 文書設計・監査（実装済みとはしない） | 1/334 | #28 merged | 0件／HEAD該当なし |
| experiment/conversation-lab-offline-v1-20261015 | f92250fc1ac79efa44c72468e00449d3fdc7ce6e | 2026-10-20T11:36:05Z | experiment: offline multi-turn conversation lab foundation (no Gemini/DB) | 8 main未収録の実装・試験あり、採用未確定 | 112/0 | #86 open/Draft | 112件／READY |
| experiment/interpreter-gradual-acting-20261015 | ef5bd23246a75b02a0df60302263f971de061843 | 2026-10-19T01:46:09Z | experiment: 5軸の中間成長を表現するInterpreter比較案（本番未接続） | 8 main未収録の実装・試験あり、採用未確定 | 36/0 | #85 open/Draft | 36件／READY |
| experiment/shared-conversation-history-v1-20261015 | 2ae90d70ff143c8de935f25ec12f291e9b82613a | 2026-10-16T21:02:04Z | refactor: pure conversation history adapter (first shared engine seam) | 8 main未収録の実装・試験あり、採用未確定 | 35/0 | #88 open/Draft | 35件／READY |
| feature/proactive-derived-tags | 9d2d6257e845b61f8e3b8b68db63eabf56bafc86 | 2026-09-17T13:47:21Z | 自発メッセージの表現タグを感情・行動判断から派生させる | 7 関連PRマージ済み、現行機能同等性は要確認 | 2/350 | #12 merged | 0件／HEAD該当なし |
| fix/anonymous-chat-session-drop | 5b6c276c1da9ea85615fda11a881e2b3802f08f7 | 2026-09-18T00:49:43Z | 匿名セッションの一時切断で会話を消さない | 7 関連PRマージ済み、現行機能同等性は要確認 | 2/338 | #24 merged | 0件／HEAD該当なし |
| fix/anonymous-email-history | 27e83d2366de22053a7f41d62b77cfe6d7a748a8 | 2026-09-17T05:22:02Z | 匿名会話と記憶をメール確認前に同じユーザーへ保存する | 7 関連PRマージ済み、現行機能同等性は要確認 | 2/365 | #1 merged | 0件／HEAD該当なし |
| fix/anonymous-session-cache-reset | 6a4eb039d356fe81262e1c55f870f563eaf51404 | 2026-09-17T07:44:24Z | Safariで正常な匿名会話が消える可能性を防ぐ | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/362 | #4 merged | 0件／HEAD該当なし |
| fix/body-clock-claim-rpc | df2daf89f604bf80fab4e720060861862bdd2f6f | 2026-09-17T14:35:09Z | Body Clock claim RPCの実行エラーを修正する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/346 | #16 merged | 0件／HEAD該当なし |
| fix/chat-failure-recovery | 2cee1b7722cfe2e20d2b063226ba3d0b03522784 | 2026-09-17T23:09:14Z | チャット返答失敗時に回数を戻してエラーを表示する | 7 関連PRマージ済み、現行機能同等性は要確認 | 3/343 | #19 merged | 0件／HEAD該当なし |
| fix/chat-network-reliability | 7ba84c4d18e3f5b3ae012bd8b31eacebb0162f3a | 2026-09-17T09:17:57Z | proxy再試行による利用回数の二重消費を防ぐ | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/356 | #10 merged | 0件／HEAD該当なし |
| fix/chat-reliability-cleanup | a06baac8110ded425c07e2122117e89460868405 | 2026-09-17T09:04:30Z | 記憶回答の矛盾防止と診断コードを整理する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/357 | #9 merged | 0件／HEAD該当なし |
| fix/chat-request-diagnostics | 47f39994a79e68fa47cbe5234ba75ce2a19d5965 | 2026-09-17T08:30:54Z | 実機から会話履歴の受信状況を診断できるようにする | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/359 | #7 merged | 0件／HEAD該当なし |
| fix/chat-turn-dedupe | 017b94c1cf2c3f7d8340a3a59f572d1a012de5e5 | 2026-09-17T16:47:27Z | 会話同期で同じチャットターンが二重保存されるのを防ぐ | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/344 | #18 merged | 0件／HEAD該当なし |
| fix/expired-temporary-relationship-import | 63cf82a53600b0518c1d88e61df4b09665026e2d | 2026-10-05T23:35:56Z | Do not let expired anonymous roots block relationship processing | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/35 | #64 merged | 2件／READY |
| fix/gemini-chat-timeout | 469578ea12663c594a32c62a05263b23e7190891 | 2026-09-18T01:23:10Z | Gemini返答待ちにタイムアウトと診断ログを追加する | 7 関連PRマージ済み、現行機能同等性は要確認 | 2/337 | #25 merged | 0件／HEAD該当なし |
| fix/gemini-json-retry | f93a9444565ce1029cd46c0d466456f651ee7c9e | 2026-09-17T06:38:31Z | GeminiのJSON解析失敗時に会話生成を自動再試行する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/363 | #3 merged | 0件／HEAD該当なし |
| fix/grow-relationship-from-first-meeting | 98675cd45ea3723150031ba6d89e90ceadae5a8c | 2026-09-18T03:01:20Z | 初対面から関係を育てる設定に切り替える | 7 関連PRマージ済み、現行機能同等性は要確認 | 4/335 | #27 merged | 0件／HEAD該当なし |
| fix/legacy-safari-cache | 0546426c9802665413ff47a16ad56f5cd7bb91b5 | 2026-09-17T05:42:45Z | 旧Safariに残った所有者不明の会話キャッシュを破棄する | 7 関連PRマージ済み、現行機能同等性は要確認 | 2/364 | #2 merged | 0件／HEAD該当なし |
| fix/preserve-active-chat-history | 9bfa64985c390c0f2e0276d4e5b45c9071e4fb08 | 2026-09-17T15:56:59Z | iPhoneで直前のチャットが消える同期競合を修正する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/345 | #17 merged | 0件／HEAD該当なし |
| fix/recall-history-grounding | 475410541b700562e0f535484cb3fd02d9f76b1a | 2026-09-17T08:44:35Z | 記憶確認時に直近会話を回答根拠として再提示する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/358 | #8 merged | 0件／HEAD該当なし |
| fix/recall-keep-recent-history | 1fdd4d44a4ee53bcbda48e27d4065dc5f39cf7bc | 2026-09-17T07:58:36Z | 記憶確認の質問でも直近の会話履歴を保持する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/361 | #5 merged | 0件／HEAD該当なし |
| fix/relationship-analyzer-bounded-retry | 90ac90bba86f716ccf46e50542097d1b81e23702 | 2026-10-05T23:50:39Z | Retry transient Relationship Analyzer failures | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/33 | #65 merged | 1件／READY |
| fix/safari-load-failed-message | 08ee64b09567900a5abd8e557c74d3a8cd16961e | 2026-09-17T12:31:41Z | Safariで通信例外を美咲の発言として表示しない | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/355 | #11 merged | 0件／HEAD該当なし |
| fix/safari-load-failed-ui | b88b7a8d9c4b1f2f4fc0844186a312fe975ee4ab | 2026-09-17T09:19:44Z | proxy再試行による利用回数の二重消費を防ぐ | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/355 | 該当head refなし | 0件／HEAD該当なし |
| fix/use-chat-proxy | 29d74e3483d4f06f5127364d7c5bdf528826301b | 2026-09-17T08:16:16Z | 記憶確認では直近の会話履歴を明示的に参照する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/360 | #6 merged | 0件／HEAD該当なし |
| fix/workday-grounding | 6f25eba602fca1183383588ad0183d4c4a16d37c | 2026-09-17T23:21:58Z | ユーザーの仕事推測と美咲の仕事時間帯の矛盾を抑える | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/342 | #20 merged | 0件／HEAD該当なし |
| main | c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa | 2026-10-14T11:57:22Z | chore: restore applied relationship RPC migration | 6 main基準 | 0/0 | 該当head refなし | 0件／READY,READY,READY,READY,READY |
| perf/chat-stage-timing | ead9d6283b68579f6014e07bef46add2a41fb791 | 2026-09-18T02:31:32Z | チャット応答の工程別タイミングを計測する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/336 | #26 merged | 0件／HEAD該当なし |
| refine/proactive-action-tags | 693bb5822e1f0de7c409e844ae3f1285458af0ab | 2026-09-17T14:05:13Z | 自発メッセージの行動状態と表現タグの優先関係を調整する | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/348 | #14 merged | 0件／HEAD該当なし |
| refine/sleepy-tag | d6bdfd46f09d52c2cc432a01e36af324ec63f5f5 | 2026-09-17T14:15:16Z | sleepyを深夜の身体状態タグとして正式化する | 7 関連PRマージ済み、現行機能同等性は要確認 | 3/347 | #15 merged | 0件／HEAD該当なし |
| sora/anonymous-history-get-noop | 368afb0dfbf9ea66837c83834d8fc24837813554 | 2026-10-02T08:34:26Z | 匿名history GETのauth raceを安全なno-opにする | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/170 | #33 merged | 3件／READY |
| sora/canonical-relationship-integration | 0f10f0506c95fdf0aadf8d0fd7f4afa6ec14f359 | 2026-10-02T13:09:00Z | 統合検証: canonical memory × relationship life context | 7 関連PRマージ済み、現行機能同等性は要確認 | 3/175 | #32 merged | 140件／READY |
| sora/cutover-cleanup | f5424c06c92b3f51535dd44ec54ef0a25f790370 | 2026-10-02T09:08:34Z | 移行仕上げ: 匿名history同期とJR 403ノイズを止める | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/161 | #35 merged | 4件／READY |
| sora/drop-ungrounded-relationship-evidence | ae0df66929f62bb804b37c35eebabb7e8c66b696 | 2026-10-03T14:20:32Z | Ignore ungrounded Relationship evidence candidates | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/59 | #56 merged | 2件／READY |
| sora/fix-relationship-polarity-transport | 66bec2792d571c697aa891ff0142e78f4941456e | 2026-10-03T13:02:15Z | Fix Relationship Analyzer polarity transport | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/66 | #53 merged | 2件／READY |
| sora/fix-waiting-reply-layout | f3a613291569a60e471065372135cbee07373702 | 2026-10-02T11:53:04Z | 待機メッセージの縦崩れを直す | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/142 | #41 merged | 1件／READY |
| sora/gemini-timeout-retry | 862cfa6c2ce6e45b7ccbc294270f3ba02548ed2a | 2026-10-02T12:51:58Z | Geminiタイムアウトを一度だけ自動再試行 | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/135 | #43 merged | 2件／READY |
| sora/gemini-transient-retry | 0c77bad036d4bef73c82983c3ae3f800943a1ee5 | 2026-10-02T11:43:41Z | Gemini一時混雑を美咲の待機体験で吸収する | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/144 | #40 merged | 4件／READY |
| sora/history-edge-trace | e3a08db0c3dc97b297130a224919e73a69974c60 | 2026-10-02T09:28:34Z | 5秒history GETをEdge境界で捕捉する | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/154 | #38 merged | 1件／READY |
| sora/history-get-trace | 524596dedf44806da95c8d84e2096f2a5411440d | 2026-10-02T09:24:48Z | 5秒history GETの発信元をProductionで確定する | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/156 | #37 merged | 1件／READY |
| sora/history-sync-source-proof | 850e2acccef3722fc487dd17df687056b3b58911 | 2026-10-02T09:18:51Z | 匿名history 5秒GETの発信元を実証して停止する | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/158 | #36 merged | 2件／READY |
| sora/lp-pwa-mobile-layout | f65c3b2e56478634861e27193fbb5913ebfb84cb | 2026-10-04T06:57:01Z | Fix mobile PWA section horizontal clipping | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/40 | #63 merged | 2件／READY |
| sora/lp-relationship-story | 9bfa0760f56b3d1c3bf6d07af056410afde975ec | 2026-10-04T06:36:02Z | Refresh Misaki landing page around relationship growth | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/45 | #62 merged | 6件／READY |
| sora/misaki-acting-lab | be15cfea6039ff9e44be1a34ceff48a882f09c18 | 2026-10-03T06:18:55Z | 美咲の演技研究室：Relationship Interpreter 基礎 | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/106 | #45 merged | 23件／READY |
| sora/profile-aware-life-events | 610e50b6cd4d63ccdfcfd5aaf57516bb016468bb | 2026-10-02T08:59:12Z | 生活イベントを確認済みユーザープロフィール連動にする | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/166 | #34 merged | 3件／READY |
| sora/relationship-analyzer-stage-diagnostics | 0907d2ff24f6a584c032ece54f9289954ccbeb63 | 2026-10-03T13:17:26Z | Add temporary Relationship Analyzer stage diagnostics | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/64 | #54 merged | 1件／READY |
| sora/relationship-analyzer-structured-output-hotfix | 319865a5f9351899ef260754aaad2604623552d5 | 2026-10-03T10:55:35Z | Hotfix Relationship Analyzer structured output | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/79 | #48 merged | 2件／READY |
| sora/relationship-control-rpcs-v1 | e6bf2bc75aa5dd87e520724e5dbf3f4a5f0f6578 | 2026-10-03T10:07:48Z | Add Relationship Engine v1 fully lease-fenced DB contract | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/87 | #46 merged | 5件／READY |
| sora/relationship-evidence-validation-diagnostics | b8607f3e92fde63fbc37dab85a30d9945c8ad649 | 2026-10-03T13:58:33Z | Add Relationship evidence validation reason diagnostics | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/62 | #55 merged | 1件／READY |
| sora/relationship-processing-error-diagnostics | 867e227b7d2efb31c214d248e94b26e390e9f845 | 2026-10-03T10:57:16Z | Merge PR #48: Relationship Analyzer structured output hotfix | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/78 | 該当head refなし | 0件／HEAD該当なし |
| sora/relationship-time-v2-design | e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64 | 2026-09-25T10:01:28Z | 関係時間v2: 内容理解から感情・行動・自発性まで統合 | 10 状態不明・機能単位追加照合 | 276/323 | #31 open/Draft | 99件／HEAD該当なし |
| sora/remove-false-busy-wait | 1b77372a7e385a58f127d259a99e05e60cb8deb6 | 2026-10-02T12:04:14Z | 通常応答で忙しそう表示を出さない | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/138 | #42 merged | 3件／READY |
| sora/remove-relationship-stage-diagnostics | d41e673420637cd644587c5db42c38d432fd2e74 | 2026-10-03T15:25:25Z | Remove temporary Relationship Analyzer diagnostics | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/57 | #57 merged | 1件／READY |
| sora/remove-relationship-temporary-diagnostics | e4f870f0ab76271daee76882fbd1b3fefae3a9bb | 2026-10-03T12:37:50Z | Remove temporary Relationship diagnostics | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/69 | #52 merged | 3件／READY |
| sora/remove-timestamp-history-poll | 829ee4671443140386043396ffb70c0a8a8daaae | 2026-10-02T09:35:54Z | 時刻表示の5秒history pollingを撤去する | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/149 | #39 merged | 4件／READY |
| sora/sync-free-usage-with-history | f67b388e965bb9bfb3f8d6820fd62e9d273123b6 | 2026-10-02T23:34:05Z | Sync free quota state with canonical history refresh | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/131 | #44 merged | 3件／READY |
| sora/update-overview-relationship-v1-production | 4a59cbc7b163b199ffcf9f975a969cbc254cbfe2 | 2026-10-03T15:36:07Z | Update overview with Relationship Engine v1.1 production spec | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/54 | #59 merged, #58 merged | 2件／READY |
| test/relationship-acting-state-comparison | fd714bd8a82a4a48c9f33b368c35498aec6e65b5 | 2026-10-14T12:58:45Z | test: compare canonical relationship acting instructions | 8 main未収録の実装・試験あり、採用未確定 | 2/0 | #83 open/Draft | 2件／READY |
| work/ab-20-pair-dispatch | f3b98d03475fdcc012a07de669cc628911e32239 | 2026-10-08T02:49:36Z | ci: add optional 20-pair isolated Gemini A/B run | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/23 | #69 merged | 1件／READY |
| work/ab-blind-review-artifact-workflow | 648e07cef9831c2d276b3cb2754ce49d53d2e27e | 2026-10-08T07:41:46Z | ci: enable short-lived blinded synthetic reply artifacts | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/16 | #76 merged | 1件／READY |
| work/ab-http-diagnostics-dispatch | 76f066c05653374826f42c9ee1578719da975e2e | 2026-10-08T03:41:11Z | ci: pin HTTP and JSON diagnostics for manual Gemini A/B | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/21 | #71 merged | 1件／READY |
| work/ab-long-fixture-dispatch | 188502ff4b70f5c4fdfbec44cb47d86d99c055ab | 2026-10-08T03:35:46Z | ci: select synthetic long-context Gemini A/B fixture | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/22 | #70 merged | 1件／READY |
| work/ab-manual-workflow-only | 7b8edbc79c9f1f798e3936504eb3f09b2d7bd9bd | 2026-10-08T02:41:23Z | ci: manual-only isolated Gemini A/B dispatcher (no app changes) | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/24 | #68 merged | 1件／READY |
| work/ab-paced-dispatch | 266c6a1ce74bc6ba0889e41590004854386fab31 | 2026-10-08T03:44:52Z | ci: optional pacing for isolated Gemini A/B calls | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/20 | #72 merged | 1件／READY |
| work/ab-quality-diagnostics-workflow | ab805d88148c6880238918e858ca5261564c1bdc | 2026-10-08T05:30:08Z | ci: add numeric-only quality failure diagnostics | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/18 | #74 merged | 1件／READY |
| work/ab-quality-manual-workflow | 5a8f52da62da8ffbeb16705d1d7e2d23f85d5743 | 2026-10-08T04:52:43Z | ci: add manual synthetic conversation-quality A/B | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/19 | #73 merged | 1件／READY |
| work/ab-quality-reply-schema-dispatch | 82848c976ef0f1602d4dc3f7c9556a91145f93a5 | 2026-10-08T06:40:52Z | ci: pin quality A/B runner with explicit reply JSON schema | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/17 | #75 merged | 1件／READY |
| work/context-no-duplicate-replies-ab | a849bec92059d326940ffc358635164ea7d391c9 | 2026-10-13T05:09:47Z | Test isolated conversation replay adapter | 8 main未収録の実装・試験あり、採用未確定 | 211/24 | #78 open/Draft | 126件／READY |
| work/conversation-context-compression-spike | 10275b666387115ced06312570111b21d0276e17 | 2026-10-08T01:25:39Z | feat: connect numeric prompt overlap diagnostics in isolated Preview | 8 main未収録の実装・試験あり、採用未確定 | 85/24 | 該当head refなし | 8件／READY |
| work/forget-control-v1 | 84d147ba5b46698d3b46fb727a9859f87f79f3d2 | 2026-10-06T21:20:42Z | Forget Control v1: canonical忘却と確認付き再学習 | 8 main未収録の実装・試験あり、採用未確定 | 5/28 | #66 open/Draft | 5件／READY |
| work/gemini-unit-cost-telemetry | e329b6c81bce3f5f54a5a6d5af14c3ebc40d2035 | 2026-10-04T05:18:52Z | Observe Gemini physical-call usage with server-only cost telemetry | 7 計測主要13/16ファイルはmain同一、残3は後続差異 | 2/52 | #61 merged | 2件／READY |
| work/quality-long-history-workflow | efcf00c4beb7f8cc4a077a5ff0e4d455cd6f1409 | 2026-10-08T09:12:06Z | ci: add manual long-history synthetic quality A/B option | 7 関連PRマージ済み、現行機能同等性は要確認 | 1/15 | #77 merged | 1件／READY |
| work/relationship-analyzer-diagnostics | 42177230a0a3c8926689499ffb19de4f1044d8d7 | 2026-10-03T11:32:10Z | Add temporary allowlisted Gemini failure diagnostics for Relationship Analyzer | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/75 | #50 merged | 1件／READY |
| work/relationship-engine-v1 | 42c8eba3c92e0cbaeb0825717f122e2fb3f7364a | 2026-10-03T10:13:57Z | Draft: connect canonical Relationship Engine v1 after chat save | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/88 | #47 merged | 4件／READY |
| work/relationship-error-diagnostics | 7b68b97c3feae99d21f9f1dd937b29218b40997b | 2026-10-03T11:16:26Z | Log Relationship processing exception name and message | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/77 | #49 merged | 1件／READY |
| work/relationship-identity-v1 | 9cbe2146d4a9ad09edd16100c27d950e95a8bcc4 | 2026-10-11T16:44:12Z | Relationship Identity v1: canonical persistence, continuity and migration audit | 8 main未収録の実装・試験あり、採用未確定 | 81/24 | #67 open/Draft | 84件／READY |
| work/relationship-polarity-integer | 68a2aebb98e5f800f7a6d334c815c2a7841b2873 | 2026-10-03T12:29:22Z | fix: Relationship Analyzer の polarity 整数 enum を削除 | 6 HEADはmain祖先（現行挙動・稼働は別確認） | 0/73 | #51 merged | 1件／READY |
