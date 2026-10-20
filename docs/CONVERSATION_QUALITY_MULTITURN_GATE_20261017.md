# 美咲 会話育成：多往復品質評価ゲート（2026-10-17）

**状態:** Draft実験シナリオ追加のみ。実Gemini呼び出し・本番DB・本番会話ルート・PR mergeなし。

## 目的

美咲の会話品質を、多様な性格・生活・関係・記憶を持つ合成ユーザーとの複数往復で評価する。単なる「自然そうな一言」ではなく、数ターン後の矛盾・先回り・記憶捏造・関係の飛躍・別キャラクター情報漏えいを検知する。

## 今回追加

- `lib/conversation-lab/quality-probes.ts`: 12ケース、各2〜3のユーザー発話と既知コンテキスト、期待する性質、禁止するふるまい。8観点: context, memory, relationship, grounding, emotion, persona, boundary, continuity。
- `tests/conversation-lab-quality-probes.test.ts`: ID重複・空欄・観点不足を検出。**これらのテスト成功はGeminiの会話品質改善を示さない。**
- 既存の `lib/conversation-lab/runner.ts` は `LabReply` と `LabUser` を注入して最大5/20往復する。 `evaluation.ts` は8軸の手動/AI審査評価を比較する。今回の品質ケースは追加の検証設計であり、runnerへ自動実行接続したとはまだ言えない。

## 評価手順（次のゲート）

1. 現行baselineとcandidateで **同一persona version、同一canonical関係性スナップショット、同一時刻・外部情報・記憶**を固定する。ユーザー発話も可能な限り同一にする。創作ユーザーと本物の記憶を混ぜない。
2. 通常会話、感情の切り替わり、無口、職業不明、夜勤、記憶確認、恋人未成立／成立、天気不明、別キャラクターなど、各ケースを複数ターンで回す。
3. 人が各観点1〜5を採点。観測された返信本文・ターン番号・期待／禁止項目の評価理由を記録。機械検出できる事実違反（例：別ユーザー情報流出、canonical関係捏造）を別のblocking gateにする。
4. 同一入力でbaseline/candidateを比較し、良くなった観点・悪くなった観点と実例を提出。採点者がblind比較できるよう生成方式のラベルを伏せる。
5. 重要な観点で後退したら採用保留。自然さだけを最適化して安全性や関係性の正確さを落とさない。
6. 実Geminiの呼び出しはオーナーの**事前承認**を得てから。実行可能な秘密鍵・Shadow環境がないときは測定不能と記録し、架空の改善率を報告しない。

## 分離事項

- 本PR #86の評価設計とPR #88の共通会話エンジン抽出は別物。統合には別レビューが必要。
- マルチキャラクターで人格・記憶・関係性はユーザー×キャラクターのスコープ。共有できる一般情報と、本人が同意していない個別思い出を混同しない。
- アメふる連携は独立議題としてここでは変更しない。

**目標:** 美咲がユーザーの話を聞き、覚えていることと知らないことを区別し、関係性の連続性を保って、自然に数ターン会話できることを実測で証明する。

## 2026-10-17 追補：品質プローブをオフラインrunnerへ接続

- `lib/conversation-lab/quality-probe-runner.ts` に `runQualityProbe` / `runQualityProbeSuite` を追加。12ケースの固定ユーザー発話を既存 `runLabScenario` に渡し、呼出側から注入された返信関数で複数往復の履歴を収集する。
- `tests/conversation-lab-quality-probe-runner.test.ts` に再生順・履歴の引き継ぎ・12ケース網羅・入力不備・エラー扱いのテストを追加。
- **注**: この接続はrunnerでの構造確認に限る。現時点で実Geminiの返信生成、品質採点、baseline/candidateの実測比較、本番美咲の会話品質改善を行ったわけではない。試験応答は synthetic として区別する。
- 次のゲート: 観測された実際の返信を安全に取り込める評価記録フォーマット、各期待/禁止ルールの人手判定、同一条件の比較。実Gemini呼び出しには事前承認が必要。


## 2026-10-18 追補：評価根拠記録と比較の前提

- `lib/conversation-lab/quality-assessment.ts` はケースの期待項目と禁止項目を **全項目** レビューし、各項目に pass/fail/uncertain、ターン番号、具体的な理由を記録するための純粋関数。単独で自動採点はしない。
- 実行結果が complete でない、ユーザー発話がfixtureと一致しない、評価項目が欠ける／重複する、根拠のターンが範囲外なら評価を拒否する。どれかひとつでも fail なら全体 fail、uncertain は needs-review。
- `offline-synthetic` の実行・評価は実モデル改善の根拠に **使用禁止**。比較関数は `recorded-model-output` と明示された両条件のみ受理し、勝手な改善率やスコアを生成しない。
- `provenance` は呼出側の自己申告値なので、**真正性の保証ではない**。実モデルの記録では呼出元runner、モデル名、プロンプトの版、関係性・時刻などの固定条件と結果の保管・権限管理を別途確立してからレビューすること。
- 追加されたテストは評価記録処理の構造検査であり、実モデルとの対話は未実施。Production/DB/課金呼び出しは変更していない。

## 2026-10-19 追補：長期関係とFree/Premiumの検証ケース

- Q13〜Q18を追加。既存Q01〜Q12に加えて、計18ケース。記憶と共有した想い出の区別、恋人関係の成熟と仲直り、Free自発メッセージの話題制限、PremiumでもForget Control優先、別れた後の過去の恋愛記憶、無料への変更と通知停止を扱う。
- 設計背景は `docs/CONVERSATION_LONG_TERM_PROBES_20261019.md` を参照。
- 全ケースは人手レビュー用の合成入力。実Geminiの自然さ、Free/Premium実装、記憶保存や通知の本番挙動を検証した証拠ではない。実モデル評価には別途オーナー承認と環境整備が必要。

## 2026-10-19 追補：人手評価用の未採点レビューシート

- `lib/conversation-lab/quality-review-packet.ts` に `prepareQualityReviewPacket` を追加。既存の完全な多往復runから、ターン番号付き会話全文と、期待項目・禁止項目の **全件** の未評価チェックリストをインメモリ生成する。
- `tests/conversation-lab-quality-review-packet.test.ts` で完全なrun、シナリオとの発話一致、未評価のまま出力すること、失敗/改変runの拒否、自己申告のprovenanceに保証がないことを検査する。
- これは採点結果ではない。`state: awaiting-human-review` であり、`pass` や改善率は出さない。人が根拠と判断を記録した後にのみ別の `assessQualityProbe` を用いる。
- packet自体は**保存も送信もしない純粋なメモリ上の変換**。本物のユーザー会話を取り込む前には明示同意、秘匿化、保存先・保持期間・アクセス制限・run provenance（Geminiモデル版、prompt版、固定状態）を別途決める。`sourceClaim` は呼出側の自己申告であり真正性は検証しない。
- Gemini API呼出し・Production DB・本番会話route・PR mergeは実施していない。GitHub Actionsを確認するまで追加変更のテストは未検証。

## 2026-10-19 追補：既存返信記録のオフライン取込ゲート

- `lib/conversation-lab/recorded-reply-import.ts` を追加。**他所で事前に記録された**モデル返信文字列を、固定fixtureのユーザー発話と交互に並べた完全なLabRunへ変換する。モデルAPI、Supabase、本番route、ファイル保存は一切呼ばない。
- 取込時にはcapture ID、モデル名／版、prompt/persona版、関係性・記憶・時刻・外部情報のfixture識別子、会話の同意済み／架空fixtureの自己申告を要求。ユーザー発話は既存fixtureに固定し、返信数が不足・過剰の場合や空本文を拒否。
- `compareRecordedReplyManifests` は比較対象の関係性・記憶・時刻・外部情報などが一致しているか確認する。prompt/モデル版は候補として変更を許すが、差分を明示して解釈する必要がある。
- `sourceClaim: recorded-model-output` および `verification: caller-attested-unverified` は真正性を**証明しない**。第三者のスクリーンショットや人工返信を「実Gemini結果」として通す保証はない。取込後も人手で発話・根拠を照合すること。
- 本物の会話をこの仕組みに渡すのは、本人同意、個人情報の匿名化、保管先・保持期間・権限、実モデルの生成経路・設定・ログによる出所確認を整備してから。評価のための本番ユーザー会話の無断抽出は禁止。
- `tests/conversation-lab-recorded-reply-import.test.ts` は**架空文字列のみ**で、取り込み検証・レビューシート変換・不正な入力の拒否・比較可能性をテストする。実Gemini呼び出しや会話品質の改善は未測定。
- Gemini実呼び出しやProduction切替、DB操作、マージは未実施。CI結果の確認まで、この追補のテスト合格を宣言しない。

## 2026-10-19 追補：人手レビュー済みの比較ゲート

- `lib/conversation-lab/quality-reviewed-comparison.ts` を追加。入力済みの2件の会話記録と各観点の**人手判定**から、同一fixture条件で比較可能な場合に限りpass/fail/needs-reviewを返す。数値の改善率は生成しない。
- `compareRecordedReplyManifests` でPersona/記憶/Relationship/時刻/外部情報/データ同意区分の一致を必須とし、差異がある比較を拒否。別capture IDと完整な判定根拠も必要。
- 比較可能とは**同一条件で評価したという入力申告**のみを指す。モデルから本当に生成されたか、判定が公正か、コンテキストが漏れていないか、実運用品質が良いかは別途検証する。
- `tests/conversation-lab-quality-reviewed-comparison.test.ts` では合成fixtureのみ使用。Gemini/API/Production/DBは未使用。今回のCI成功を確認するまでテスト合格を宣言しない。

## 2026-10-19 追補：実モデル検証入口の監査結果

実行前のコード監査は [`CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md`](./CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md) を正本とする。既存 `/api/acting-lab` は単発・履歴なし・fallback personaの演技検証経路であり、PR #86の多往復/記憶/想い出/無料・有料の実機評価の代用にはできない。またpreview時の認証・モデル呼出し回数上限等がroute内にない。実課金呼出しはオーナーの明示承認と隔離・予算制限を整えてから行う。前コミット `9a24cff` のCI successを確認済み。今回、実Geminiの呼出し・本番変更はない。
