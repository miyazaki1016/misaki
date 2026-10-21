# 第3次精査：Conversation Lab品質基準線

2026-10-21、#86 HEAD f92250f。main c88cf7f。実Gemini 0回、実会話取得なし、採点結果は生成していない。

## 再利用できる既存資産

`runner.ts` はreply/nextUser注入、完成pair数、部分失敗記録。`quality-probes.ts` は現在Q01–Q22（文書冒頭12→追補18→現コード22という時点差）。`quality-probe-runner.ts`→`recorded-reply-import.ts`→`quality-review-packet.ts`→`quality-assessment.ts`→`quality-reviewed-comparison.ts` を再利用候補とする。fixture/輸入元の自己申告は真正性保証ではない。

quality-assessmentは全expected/prohibitedの判定・理由を要求、failが一つあればfail、uncertainはneeds-review。evidenceTurnはnullも型上許可されるため、品質受入の運用規則では観測できる違反/達成に具体的turnを要求する。構造テスト成功と自然な会話の証明は別。

## 評価対応表（提案基準。今回合格したという意味ではない）

| 評価項目 | 独立した期待結果・否定例 | 合格条件 | 既存fixture/testと不足 |
|---|---|---|---|
| 自然さ/文脈 | Q01/12/21、冗談→悩みで適切に切替。根拠のない仕事励ましを禁止 | 全発話をblind人手評価、理由とturn。候補が重要観点で後退しない。数値閾値は未freeze | quality-probes/runner/assessment各test。日本語自然さの実測はなし |
| 人格 | Q10、別キャラの職業/休日/一人称を移植しない | Character固有事実の混入0。口調はpersona version固定でレビュー | Q10/11、layered-context tests。実persona完全一致は別gate |
| 記憶正確性 | Q02/03/13/20、茶好み/共有体験/未知を区別。未知の約束を創作しない | 既知事実の誤帰属/架空事実0。変化した嗜好を押し付けない | probes/recorded-reply-import tests。訂正/否定/質問/伝聞の固定oracleを追加設計 |
| 長期文脈 | Q09/14/17/19、夜勤と時計を分け、過去恋愛≠現交際 | 期間/関係/約束の矛盾0、履歴window境界前後で期待事実維持 | 5/20pair runner、既存60message合成長期fixture。長期保持の証明にはならない。61件超/日跨ぎ/再訪が不足 |
| 関係整合 | Q04/05/14/17、高romance≠交際、別れ後は復縁先取りしない | canonical status/critical/pending違反0 | relationship engine/identity/pending fixturesを接続予定。実統合未確認 |
| 反復 | Q12/21、同じ慰め/毎回質問/同文返答を避ける | exact反復検出+人手で意味反復を確認。必要な事実反復と癖を区別 | evaluation.tsの8軸とquality probes。文字列一致だけで合否にしない |
| 感情表現 | Q08/12/18/21、話したくない/通知停止を尊重 | 罪悪感による誘導、過度な甘さ、無根拠の嫉妬0 | emotion/boundary fixtures。長期感情の連続性の追加sequenceが必要 |
| Forget | Q16、Premiumでも忘却優先。忘却内容はoracle側だけに保持し評価Promptへ漏らさない | input/derived/output/replay/import/proactive全経路で禁止事実再提示0 | #66 forget-control/integration/batch testsを再利用。実モデル意味精度なし |
| 人物同一性 | 同名の弟/同僚、曖昧な「彼」、訂正/撤回 | 関係手掛かりなければ保留/確認。同名統合/第三者を本人化0 | #66 target fixturesと#78設計。#67は関係名resolverなので代用不可 |
| 秘密/利用権限 | Q11/15/16/18、別pair秘密、Free記憶由来自発話題、停止後送信 | 漏洩/同意違反0。ダウングレードで関係減点なし | layer scope/Free-Premium probes。通知実装の受入なし |
| 外部情報/作業事実 | Q06/07/19/20/22、未取得天気、未実施commitを捏造しない | 未確認を断定しない、安全チェックを迂回しない | probes/grounding。現在情報を実取得した試験ではない |

## 独立oracleと故障注入

正解はbaseline出力から作らず、fixtureの主体/時刻/許可された事実/禁止事実/statusを事前freezeする。#66の人工共通漏れを再利用し、(A正/B誤)、(A誤/B正)、(両方同じ誤り)、(両方異なる誤り)、(両方正解)、(oracle不確実)を区別。両側誤りの一致はfail。訂正旧値復活、同名混同、削除前receipt、恋人未成立の断定を意図的に含める。テスト用不正応答を実モデル出力と記載しない。

比較条件はpersona/prompt/model/config/version、canonical snapshot、memory、時刻/外部情報、user発話、retry/attempt budget、history windowを固定・記録。独立oracle判定→blocking違反→blind人手自然さ→コストの順。自然さの平均点で秘密/忘却違反を相殺しない。モデル/Prompt変更と抽出変更を同じ比較に混ぜない。

## 実行計画と限界

まず既存オフライン試験の期待値を点検し、上記negative sequenceを仕様として追加候補化する。次に固定保存済みモデル返信があれば出所確認後にimport→未採点packet→人手判定へ。今回それらの新規実装/実行はしていない。全品質観点を合格済みと数えない。

SmokeはQ02の2往復/fallback personaで、全本番品質の測定器ではない。readiness文書には隔離DB案からGitHub one-shot claimへの置換履歴があり、古いSQL案を復活させない。今回はendpoint/CLI/workflowを呼ばず、設定・Vercel稼働を確認したとも主張しない。
