# 第5次：派生情報19種の依存・失効・保持契約案

2026-10-21 JST。38〜45のC-01〜09を継承して具体化する**未実装・未採用の設計案**。コード上の観測は28〜31/39〜44、現在文書・実験の追加照合は56。新たなDB/モデル/動作試験なし。全監査未完了。

## 判定を分ける

各artifactに「保持してよいか」「今の用途に利用してよいか」「具体情報を再提示してよいか」を別々に判定する。Forgetの範囲（soft/hard、主体・事実・期間・用途）を最初に正規化し、曖昧なら保留。物理消去を要求する契約かどうかも別フィールドにする。現在の#66 hard_deleteは全履歴・全派生物消去の意味ではない。

判定は用途ごとの `retain / reevaluate / suspend-use / recompute / physical-delete / unknown`。これらは単一の排他enumでなく、保持と利用について組み合わせ得る。例えば監査用にアクセス制限付き保持しつつPrompt利用停止。過去の出来事の内容を語れなくても、抽象的信頼や成立済みstatusを維持できる場合がある。

## 依存・失効一覧

U=User、C=Character、P=User×Character。所有欄のP/Cは**将来の責務上の所有先**を示す。現実装は多くがuser_idであり、pair schema完成を示さない。全行で、依存不明／復号不能／所有不明はunknown→該当用途を保留。source参照だけで秘密の内容が漏れる場合も評価する。

| 項目 / 所有 | 観測した元情報・追跡の足場／不足 | 失効条件・利用権の候補 | 保持・再生成の条件 |
|---|---|---|---|
| Relationship Evidence / P | canonical event message/reply、request/evidence key。解釈・subject・supportingTurnを含む。workerはcontrol明示参照なし | 失効sourceの具体情報・推測を含むなら利用停止。無関係な根拠は再評価可能 | 旧行は非提示領域に保持する案。許可済みeventだけで再解析。全依存の証明がなければ保留 |
| Relationship Episode / P | Evidenceリンク、summary。保存済みEvidenceから再開 | 参照Evidenceの失効がsummary/意味に影響すれば再評価→再計算 | 汚染summaryの単語だけ消すのでなくsafe Evidenceから再構成。来歴を維持 |
| Relationship Pattern / P | episode、derived_from、summary | 失効episodeに依存する推論、希少な特徴の組合せから秘密を推測できるなら停止 | 独立した許可済み複数episodeで裏付けられる抽象傾向だけ保持候補。閾値は未決 |
| Relationship Story / P | signal event最新40件からhurt/repair/care/trust意味状態。worker自由文メモではない | eventの具体的事情を再構成・言及する用途は再評価 | 非機微な関係の空気は保持候補。数値・labelも組合せによる再推論を人手oracleで確認 |
| Relationship State / P | Evidence/Pattern applicationsのbefore/after、5軸・version | provenance不明の新適用／古いworker適用は保留。現在state全体を自動resetしない | 既存抽象状態の継続と今後の増分採用を分離。再計算によるstatus/境界の巻戻しは禁止 |
| Relationship Status / P | critical event、pending、validator、独立した成立事実 | 失効根拠の未確定candidateは採用停止。Forgetそれ自体は別れ／復縁の合意でない | 成立済みstatus・拒絶・境界を維持。訂正・解消は独立した認可済み遷移が必要 |
| Persona Traits / PまたはC | user traitsはuser_id別、共通modulesとは別読取。全writerは未確認 | 私的出来事・理由の再提示は禁止判定。Cへ広げる許可と抽象化証拠がなければ共有停止 | 非機微な安定傾向は再評価して保持候補。全Traitを自動消去しない |
| Persona Evolution / P→Cは別審査 | history/memory/traits→analyzer→候補RPC。共通成長の全経路不明 | 入力失効／所有変更後の採用は再検証。user経験を共通人格へそのまま移さない | 特定人を復元できない抽象化・共有許可・用途を別審査。単なる名前除去は不可 |
| Evolution Candidate / P | proposed_content＋reason＋evidence.quotes。全source ID/世代は未保証 | 生成後Forgetなら保存／一覧／承認それぞれで再評価。reasonだけ失効しても保留 | safe sourceだけで再生成した新候補へ。旧candidate IDを同意の根拠に使わない |
| Evolution Approval / PまたはC | review APIはcandidate ID/actionだけ。現RPC本文不明 | 旧候補への過去のapprove操作は現在利用権にならない。採用時も再検証 | 承認の事実・監査メタデータ保持候補。承認理由の私的詳細は別失効。確定済みtraitを別判定 |
| Life Facts / UまたはP | 既存memoryの[life:v1]、source/observedAt/validUntil/confidence | Forget、期限、訂正・完了、共有scope違反を別判定。confidence1でも許可復活なし | 有効な独立sourceから再抽出。旧文字列を一括confirmedにしない |
| Memory Summary / UまたはP | 圧縮設計はあるが独立summary正本storeを今回確定していない | future summaryも原sourceの失効を継承。要約だから匿名・安全とはしない | safe inputから再計算。確度・否定・対象期間・発話者を保持。未発見storeはunknown |
| Body Clock Context / P＋C生活 | root/history/memory/traits/life/decision | 読取後Forget・同意・plan・時刻変化で話題／用途を再評価 | C自身の安全な日常だけの結果は独立再評価候補。Freeは新構想の話題源制限を満たす必要 |
| Proactive Message / P | decision→generated reply→delivery/history | 生成後もfinish／表示／relayで現利用権を判定。old result保存済みでも許可にならない | 未送信なら停止／safe contextから再生成。保持用原文と利用可能本文を区別 |
| Photo Context / P＋C素材 | selector4の既存写真選択、reply/decision/recentPhotoIds→photo_context | lifeEvidenceやcaption/decisionが失効したら文章とまとめて再評価 | 素材画像が公開可でも私的caption/contextは別。文章と同一の認可snapshotで再選択／分離 |
| Notification Payload / P | saved delivery.message→relay→Web Push→OS | relay前は同意・利用権再検証。外部handoff後に必ず取り消せるとはしない | 機微本文を外部に渡さない汎用通知＋open時最新取得は代替案。まだ未採用 |
| Completed Receipt / UまたはP・匿名Root | request/message hash、暗号response、#66 logical forgetVersion比較 | 同じrequestのreplayでも現世代・用途不一致は再提示停止 | 冪等な完了事実・hashは保持候補、旧replyの再返却は別判定。retryで課金／副作用再実行しない |
| Retry Journal / P・匿名Root | processing stage/compact Evidence、interpretation/subject/supportingTurn | 旧source snapshot・旧候補の復元も新規利用。phaseやleaseが一致しても失効 | 段階進捗だけ保持、内容は隔離。safe source再取得し新attemptとして評価、二重適用防止を維持 |
| Browser Cache / 端末U＋P | localStorage/React history、sessionStorage token/pending、遅着HTTP | same owner/historyだけで最新権限を保証しない。token/root/GET/POST/復元を別検証 | cacheは正本にuploadしない。offlineは権限確認不能の利用保留案。忘却前に端末へ到達済みの全文回収は保証不可 |

物理削除が必要になるのは、明示した消去契約・保持期間・安全な隔離ができない保存形態などを審査して決めた場合。全19種を無条件に物理削除する既定にはしない。識別可能な派生詳細は、物理保持が許可されても生成・表示への利用を止める必要があり得る。

## 実装可能性を審査する最小契約

1. authorityが発行するowner/scope、単調な利用権revision、artifact IDとsource IDs、処理version、読取snapshot、用途、派生policy版を記録する案。既存logical forgetVersionがこのrevisionとして十分かは42の残件。ローカル時計や任意hashを認可の代用にしない。
2. **同世代かつ依存許可**なら既存lease・冪等性等の検証も満たして採用。**世代差あり**なら影響するsource／用途だけを再評価。無関係変更であると証明できるartifactは、新認可記録を付けて採用可能とする案。全結果の無条件破棄はしない。
3. source不明／失効sourceの具体内容を含む／根拠から秘密を再推論できる場合は保留または利用停止。文字列mask成功だけを独立性の証明にしない。safe inputから再計算する場合は旧生成結果・journalを新入力へ混ぜない。
4. DBではsource許可のcheckと採用を、Forget writerと同じ直列化境界へ収める設計が必要。適用済み関係状態を全巻戻しするのでなく、**今後の失効source利用と未採用結果を止める**。既存before/after historyも再提示権を評価する。
5. 再試行は同一副作用を二重適用しない。同時に、古い成功receiptやjournalの存在から内容許可を復活させない。失敗時は利用権を推測せず停止／再取得し、関係statusと正常な無関係情報を維持する。
6. 外部送信はDB transactionと別。配送予約tokenだけで完全保証としない。Forgetのcommitと外部handoffの順序をどう線形化するか、送信中のForget応答を待たせるか、機微本文を送らないかを設計審査する。キャンセル可能な最終点と不可逆なhandoffを記録する。
7. 忘却完了の約束は「サーバー採用失効」「オンライン端末への無効化」「既送信外部データの制御限界」に分けて定義する。全offline端末から必ず回収済みと表現しない。端末側にはHTTP結果・cache復元・notification openの採用時照合が別途必要。

新IDEAは加算せず、IDEA11〜13の具体的条件として保全する。採用・実装にはscope／再推論の判定規則、transaction設計、性能・livenessと独立試験（59）が残る。
