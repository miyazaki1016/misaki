# 第5次：設計思想の追加保全と第6次判断用マトリクス

2026-10-21 JST。01〜62とIDEA01〜13を保持する追補。新しい機能実装・本番受入ではない。残19文書版・監査枝自身の意味精査があるため、第5次の全資産棚卸し完了はまだ宣言しない。

## 新たに番号を与えて保全する思想

### IDEA14：品質評価を関係の報酬・罰や自動人格更新にしない

根拠はDOC-042の14.5節（原Blob `fc76ff0d9ecb076de4d01a005236f524c92c84d8`）。👍/👎は低負担の品質改善入口で、ユーザーが美咲を傷つけまいとして本音を避ける構造を作らない。評価しても関係pointsを変えず、拗ね・冷たさを直接起こさない。少数評価や誤操作で共通人格・関係設計を自動変更せず、原因を人が確認する。

- 現main `app/api/feedback/reply/route.ts` は本人認証後にuser/request/rating/reasonを専用tableへupsertし、API本文から関係state・traitを更新していない。これは当該入口の静的観測で、全trigger・全分析writerの無影響を今回実証したものではない。
- Memory Certainty（IDEA01）、独立oracle（08）、Pair/Character所有（06）、Evolutionの利用権（12/13）と依存するが、**評価ボタン自体の関係への非干渉**は別の保全項目。
- 将来の学習提案では、feedbackの対象返信・根拠・ユーザー許可・Forget・品質と好意の分離を確認する。好評最大化のために全肯定や恋愛の先取りへ戻さない。

### IDEA15：shared-worldは自然な知り方と場所の根拠を守る

根拠はBR-047の総覧独自追補（固定HEAD `0f10f0506c95fdf0aadf8d0fd7f4afa6ec14f359`）。公開情報を技術的に取れることと、キャラクターがそれを知っていて自然なことを分ける。

- 学校名・断片情報から担任や家族を突き止めたり、SNSを横断して本人が教えていない私的情報を収集しない。「知れることを全部知ろうとしない」。本人が会話で教えた情報の自然な想起とは分ける。
- 情報は会話との接点と今言う価値があるときに短く使い、データ取得できたこと自体を発話理由にしない。
- Characterのhome/life areaと、その時のcurrent place/activityを分離。地域の天気を取得しただけで「今外にいて帰宅途中」と創作しない。Userの登録地点・許可現在地・Character地域も別scope。
- 現main `lib/tokyo-life-events.ts`、chatの天気取得は固定生活圏を使う既存経路。新しいUser生活圏追跡や現実情報連携が完成したとはしない。DOC-002の公式情報取得とキャラクター判断の分担はDraft契約として保存し、アメふる側へ変更しない。
- privacy/出所に関するIDEA06・11と関係するが、**取得する前の節度と、home≠current place**という世界整合性の境界を独立して保全する。

## 人格・記憶・関係の判断史を失わない

1. 旧「初めから恋人」を削ったBR-032は、Characterの基本人格を捨てる変更ではない。関係の深さ・交際事実を二者の歴史から育てる変更。複数キャラのscope分離でもこの因果を維持する。
2. DOC-024の「それぞれの二人にしか存在しない美咲」は、後続基本構想の共通Character人格＋私的Pair成長として読む。ユーザー別に秘密が混ざった共通人格へ統合する意味ではなく、無制限な基本人格複製の確定仕様でもない。
3. Storyの意味は後のcare/trustや再発で変わり、境界や拒絶を永久的な「悪いユーザー」ラベルにしない。Forget後の利用権と、関係の現在の意味・statusの継続を別々に審査する（58/59）。
4. Time枝はurge/motive/何もしない/Storyと写真の整合が独自成果。mainに似たenumや写真selectorがあるだけで全て回収済みと判定せず、通常chat・Edge・SQLを個別に比較する。
5. 過去の本番受入報告を保持しつつ、現在未接続の設計案やGitHubのSQL存在を「今回本番動作確認済み」としない。文書から削除されたBLOCKED説明も、解除の根拠がなければ別追補に残す。

## 重点7成果群：第6次以降の判断材料

以下は実装順序の承認ではなく、依存・残件を可視化する案。安全性の全研究が終わるまで全開発を停止する提案でもない。製品変更と隔離した読取・計測・設計を分ける。

| 成果群 | 所在・今回の追加保全 | 開発へ回す前の条件 | 現時点の判定 |
|---|---|---|---|
| Forget #66 | 未採用barrier/receipt/import候補。38〜45/58/59を継承 | 情報利用権と全source、保存/採用/表示の境界を仕様化。16試験の独立oracle・隔離実行証拠、旧writerとの互換 | 調査・設計継続。実装済み／全安全性合格ではない |
| Relationship Identity #67 | 関係自己認識、primary/hysteresis/constraint。人物照合とは別 | breakup/rejection解除条件・classifier凍結、canonical version/import、再提示権と関係status非巻戻し | 未反映候補を保持。別人識別の代用にしない |
| Memory Certainty | 主体×項目×期間、tentative/confirmed/corrected/completed。Life Factsの歴史を今回補強 | 既存canonical Memoryを基礎に、質問/第三者/訂正/期限とForgetを別軸で評価 | 新しい並列正本を作る決定なし。設計・fixture候補 |
| Conversation Lab #86 | 評価器・Q02入口・人手レビュー、現mainとのparity差は56以前を継承 | full-context再現範囲・真正性・認可・物理呼出しと費用・品質判定の区別 | 未採用評価資産。過去4シナリオ報告やCIを現在16試験へ流用しない |
| Shared Engine設計 #87 | pure Core、immutable resolved snapshot、auth/quota/保存を外側に残す | Prompt全byteだけでなくvalidation/retry/expression/異常系、所有scopeと現在保存境界を明示 | 設計資産を保持。コスト改善のための意味変更を抽出に混ぜない |
| Shared Engine部品 #88 | builder部品と三層prompt、Character/Pair分離の足場 | 全pipeline同等性、Node/Deno、scope/retrieval、保存/出力互換。部品存在を多キャラ完成にしない | 部品のみ再利用候補。DB/pair移行の承認なし |
| Relationship Time #31 | 今回DOC-024の全文・urge/motive/Story写真制御とBR-047のshared-worldを追加追跡 | 現mainにある部品と枝固有の自発性を分け、旧claim/Emotion語彙/Story/version/同意・plan・Forgetの最終採用を比較 | 一部main存続＋未反映資産。全面再実装も全面完了も不可 |

## 開発再開の段階案

- **棚卸し残件**：68の原19版とBR-008を全文・差分精査。すでに所在が確定した枝を再びゼロから調べず、未読区間だけを閉じる。
- **本番に触れない準備**：既存telemetryの項目設計・実コスト定義、固定sourceによるPrompt構成量の比較、独立合成fixtureと手動レビュー基準の整理。実GeminiやDBを呼ばずできる範囲を先行候補にする。
- **隔離した最小実装の審査**：一つの回収対象、受入条件、依存、rollback、保存権限、変更しない既存契約を具体化してレビューへ。今回はその機能実装を行っていない。
- **検証**：59の16試験は全NOT_RUNを維持。静的なcode対応・既存試験ファイル・過去CI報告から自動的に合格へ上げない。
- **本番判断**：実装・Preview受入・本番適用を別段階で扱う。main/DB/merge/deployの承認は今回範囲外。legacy BLOCKEDの解除を他の製品設計作業の成果で代用しない。

今の判定は「所在・置換の整理は大きく進展、意味精査と安全性検証は未完了」。IDEA14/15を加え累計15件、新しい本番検証済み機能は0件。
