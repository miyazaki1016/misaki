# ③ 未反映成果・別経路反映・ブロックの区別

基準main: `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。全件の根拠SHA・差分は branches.json / code-differences.json / checks.json。これは監査途中の確定所見であり、mainへの採用指示ではない。

## main未収録の成果を確認したもの

| 成果 | 枝HEAD / PR | 実装と試験の根拠 | 現時点の判定・残件 |
|---|---|---|---|
| Forget Control v1 | `work/forget-control-v1` @ `84d147ba5b46698d3b46fb727a9859f87f79f3d2` / #66 open Draft | `_shared/forget-control.ts`、`lib/canonical-state.ts`、chat/Body Clock/personaの配線、`20261006200002_forget_control_v1.sql`、専用試験・batch評価レポート。HEADのtest check success。 | 4 実装・CI成功、8 main未反映。main canonical保存・chat本線にforgetControls配線なし。Preview READYはbuildのみ。scripted意味判定で実Gemini精度未証明。忘却後の旧app単純rollbackは復活防止を破り得る。 |
| Relationship Identity v1 | `work/relationship-identity-v1` @ `9cbe2146d4a9ad09edd16100c27d950e95a8bcc4` / #67 open Draft | `relationship-identity-resolver.ts`、engine/runtime/canonical-state/acting-guide、4 migration、専用試験。HEADのtest check success。 | 4/8。mainには専用resolver・identityEnabledの配線なし。PRは本番DB適用済み・gate OFFと記録。これは今回のDB実測ではない。migration再適用・gate ONは禁止。複数session競合・隔離Preview受入は残件。 |
| Canonical演技指示の比較試験 | `test/relationship-acting-state-comparison` @ `fd714bd8a82a4a48c9f33b368c35498aec6e65b5` / #83 open Draft | `tests/relationship-acting-state-comparison.test.ts` と `relationship-chat-wiring.test.ts`。同一入力でstatusのみ変更しsystemInstructionを比較。 | 試験資産。affection 0/1の演技指示は同じ、80で変わることを固定。実モデルの返答改善の証拠ではない。 |
| 段階的Acting候補・Body Clock境界監査 | `experiment/interpreter-gradual-acting-20261015` @ `ef5bd23246a75b02a0df60302263f971de061843` / #85 open Draft | `relationship-acting-guide-gradual-experiment.ts`、比較試験、race/version/RPC監査文書群。 | 既存ガードを呼ぶ統合候補と独立候補を区別。mainへの配線なし。20/50/80等は仮説。閾値の採用や実モデル品質は未確定。 |
| 多往復会話品質ラボ | `experiment/conversation-lab-offline-v1-20261015` @ `f92250fc1ac79efa44c72468e00449d3fdc7ce6e` / #86 open Draft | `lib/conversation-lab/`、quality probes、レビューpacket、recorded reply import、比較ゲート、関連試験。HEADのtest check success。 | 4 構造試験済み/8 main未反映。合成返信は実モデル改善の根拠にしない。自己申告provenanceの真正性は未証明。実課金呼出しは未実施。 |
| 共通会話エンジンの純粋部品 | `experiment/shared-conversation-history-v1-20261015` @ `2ae90d70ff143c8de935f25ec12f291e9b82613a` / #88 open Draft | `lib/conversation-engine/`、history adapter / layered prompt等と試験、prompt inventory / parity gate資料。 | 部品・設計の成果。main通常chatは未置換。認証・quota・canonical保存・reply検証・再試行まで含む本番同等性は未達。 |
| Context圧縮・重複返答削減研究 | `work/conversation-context-compression-spike` @ `10275b666387115ced06312570111b21d0276e17` と `work/context-no-duplicate-replies-ab` @ `a849bec92059d326940ffc358635164ea7d391c9` / #78 open Draft | overlap/size測定、balanced候補、固定fixture・盲検レビュー・隔離replay、評価文書。 | 計測・比較基盤。単発15.9%や合成短文/長文の削減率を本番へ一般化しない。main構成と同一条件の品質非劣化は未証明。 |

## 「未反映」と扱ってはいけないもの

1. `chore/restore-relationship-rpc-migration` @ `4dd716a2c04c6864445cb8720a1921813bb50933` はmainとdivergedだが、対象SQL `supabase/migrations/20260930131930_relationship_server_rpc_user_context.sql` はmainと同一Blob `8c2c8383348ad290f3890b16488a3b0ef50e0798`。復元元SQL自体にも再適用禁止コメントがある。**7 別履歴でmain収録済み**。
2. `work/gemini-unit-cost-telemetry` @ `e329b6c81bce3f5f54a5a6d5af14c3ebc40d2035` はdivergedだが、merge-base差分16ファイル中13ファイルはHEAD/main同一。`lib/gemini-usage-telemetry.ts` は `a1ef34771b7e61671d12f637c69f0959159670a2`、server sinkは `0a3898beb90b8e0def5d7aaa5521f69d59a63148`、migrationも同一。残るanalyzer/runtime/その試験は後続差異。**計測機能を新規に二重実装しない**。#61はmerged。source同一と本番稼働の現在実測は別問題。
3. 33枝はGitHub比較でbehindのみ、HEADがmain祖先。これはコード履歴の収録証拠。後続変更による置換・削除はあり得るので、現在の機能受入済みと一括判定しない。
4. 旧fix/refine/cleanup/AB workflow枝の多くにはmerged PRがある。個別merge SHAを branches.json に保存した。squash等のためdivergedでも未反映とは限らない。全機能の意味的同等性判定は未完了。

## 旧大規模枝は部分反映として扱う

`sora/relationship-time-v2-design` @ `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64` / #31 open Draft。ahead 276という数字を未実装機能数にしない。mainにはaction/emotion reducer、relationship signal、life contextと同一Blobの成果がある。一方、proactive urge/motive/contact timing/focus、conversation generator/preview、relationshipStory専用試験など同名パスのない成果が残る。別名実装と現行5軸engineの相互作用を機能単位で照合するまで、全枝の移植・廃棄のどちらも行わない。

## 安全上のBLOCKED

`codex/legacy-maintenance-drain` @ `17449c7ec4e8ff50605ef931b04ae76584c6304f` / #30 open Draft。文書は未保護write surface、停止前MVCC snapshot、受付集合、barrier寿命等の反例とBLOCKEDを保存している。現在HEADのCIはsuccessで、実ログにもPG17.6/18.4各56 pass/0 fail/0 skipがある。この相違の原因は未確定。**成功CIでBLOCKEDを解除しない。文書だけを根拠に最新CI失敗とも書かない。**

## 書込み禁止・権限制限による未反映

全88 PRのConversation comments・reviews・inline commentsを取得。権限語の自動抽出では#47の旧RPC deny記録を検出したが、これは設計上の権限制御でありアシスタントの書込み失敗の証明ではない。Draft維持・merge禁止・未完成はPR本文から確認できる。一方、過去チャットの自動承認拒否・未保存ローカル作業はGitHubだけでは復元できず、**該当作業がゼロとは証明しない**。保存前に失われた変更は未確認範囲。
