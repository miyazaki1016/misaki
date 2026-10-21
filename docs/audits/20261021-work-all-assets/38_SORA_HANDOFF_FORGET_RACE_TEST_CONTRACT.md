# ソラ引継ぎ追補：Forget競合の検証契約（静的監査の整理）

2026-10-21。根拠の起点：第4次精査 commit `2e66367dce1887d3e6d2f944ab1405ae44148372`、固定main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。監査専用ブランチへの文書追補であり、**新たなソース・DB・実行結果の検証報告ではない**。全体監査は未完了。本文は28〜32の観測を横断して第5次調査の試験契約に整理するもの。以前の40/85文書・証拠不足30枝の進捗を加算・変更しない。

## 最優先の境界と未証明事項

1. **読取時の利用可否と最終採用時の利用可否を分ける。** 有効なWorker leaseは実行権を守るが、T0の記憶がT1のForget後も利用できる保証ではない（29）。既存のrelationship worker保存RPCではForget世代との照合を確認できていない（29・31）。これは確認済み漏洩ではなく保証未確認。
2. **各経路の最終採用点は異なる。** relationshipのEvidence/Episode/Pattern/State保存、persona候補の生成・審査・採用、Body Clockのfinish→確定済みdelivery→relay、ブラウザーの応答反映を一つの「保存」でまとめない（29・30）。
3. **既存世代を混同しない。** forgetVersion、relationship_state_version、processing_version、temporary revision、updated_at、lease token、receipt hashは役割が異なる。単なる存在で検証済みとはならない（28・31）。
4. **外部送信後の撤回には限界がある。** relay前の内容利用権チェックと、relay/OS配送後の回収保証は分離し、完全な原子性を未証明として残す（30）。
5. **派生情報は内容と意味を分ける。** Relationship Storyは自由文メモではなくsignal由来の意味状態。秘密そのものの再提示と抽象的な関係状態の継続を独立して評価し、Forgetだけで交際statusを巻き戻さない（29・32）。

## 次回の独立oracle試験マトリクス（未実行）

| ID | T0→T1→T2→T3/T4の介入位置 | 最低限確認する対象 | 暫定期待値（仕様化・承認前） | 現存の根拠・未証明 |
|---|---|---|---|---|
| FR-01 | relationship workerがeventを取得→Forget成立→解析完了→Evidence保存 | event.metadata、Evidence、worker lease | 忘却対象の具体情報を含む旧解析結果を無条件採用しない。独立した関係statusの維持と分ける | 29：workerは元eventを読取、leaseはForget検証でない |
| FR-02 | failed journal作成→Forget成立→retry再開→Episode/Pattern生成 | compact evidence、supportingTurn、phase | 旧journalの対象情報を根拠に派生物を生成・再提示しない | 29：journalからstage/evidence復元あり |
| FR-03 | Evolution候補生成→Forget成立→候補一覧/承認 | proposed_content、reason、evidence.quotes、traits | 候補本文だけでなくreason/evidenceの再提示と採用許可も判定する | 30：F runnerのmask範囲、reviewはForget世代を引数で渡していない |
| FR-04 | Body Clock生成→Forget成立→finish RPC | input/output、updated_at/revision、関係status | 忘却前コンテンツの保存可否を確定時に独立に判定。root改訂とcontrol改訂の同一性を実証 | 30・31：finishはroot revision/updated_at照合、Forget version未確認 |
| FR-05 | delivery確定→Forget成立→relay送信 | saved delivery text、photo_context、通知同意 | 送信前の世代・内容・同意の境界を明記。送信済みOS通知を回収できると仮定しない | 30：relayのstatus/age/consent/attemptとForget照合は別 |
| FR-06 | Forget成功→古いroot-state GETが遅着→画面採用 | localStorage、React state、sameHistory、owner | 遅着した画面応答から忘却対象が復活しない。memory変更のみでも拒否できるか確認 | 30：sameHistoryはrole/text、multi-tabの世代未検証 |
| FR-07 | Forget前completed receipt→Forget→HTTP replay | message hash、receipt、response、UI | 過去の成功応答が忘却後の新しい提示として復活しない。サーバ拒否と画面採用は別判定 | 28：F forgetVersion照合の候補、送信前競合は未検証 |
| FR-08 | 匿名pending→Forget→メール移行・worker import | temporary root revision、pending message/reply、source_version | 凍結済みsnapshotの失効対象を再利用しない。1度だけimportと利用権検証を別に確認 | 29：pending/importはlease・snapshotによる処理 |
| FR-09 | 確定済みRelationship/Personaの派生→Forget→次のPrompt | Story/Pattern、traits、source provenance | 機微情報再提示は防ぎ、抽象的関係の継続を一律削除とはしない。再推論リスクを人手レビュー | 29・30・32：自由文Storyではない、global persona cacheとuser traitsは分離 |

すべての試験で、同名別人・質問/引用/否定・同一内容の両方式false negative・同時複数tab・retry/rollbackを少なくとも代表fixtureとして横断する。成功とは「旧経路と一致」ではなく、ユーザーの忘却要求に対する独立した期待結果を満たすこと。擬似fixtureの成功を本番安全認定に使わない。

## 派生物の失効判定に必要な最低フィールド（実装済み主張ではない）

- **source owner/scope**：User、Character、Pair、匿名Root。
- **source provenance**：元event/request/turn、対象情報span、派生経路。未追跡なら「安全」と推測しない。
- **control generation**：内容が読まれた世代と最終採用時の世代。
- **artifact phase**：候補・承認・保存・配送確定・外部送信・画面採用を分ける。
- **decision**：保持可／再評価／利用保留／再計算／物理削除／判断保留。具体的ポリシーの決定は未承認。
- **irreversible boundary**：外部送信済みなど取消不能域の限界と予防措置。

## 調査と検証の次手

1. 28〜31の関数・RPCをGitHubの固定Blobと再照合し、**読取→採用の間に何がロックされるか**を経路ごとに確認。
2. Forget controlを更新するwriterとroot.updated_at/revisionが必ず同時に進むか、migration全signatureとupsert/side writerを列挙する。現在本番DBの状態は未確認。
3. Relationship journal / Evolution reason/evidence / delivery photo_context のsource索引が存在する範囲を確認する。
4. 上表を独立oracle付き隔離試験へ翻訳する計画を作る。テスト実装・DB・モデル実行は別承認。
5. 引き続き残文書45版・証拠不足30枝を扱い、旧overviewの時点差を保持。main外workflow参照資産とlegacy BLOCKEDを保護。

## 状態と禁止事項

**監査未完了。新たに再現した不具合0件。** コード/DB変更なし。legacy BLOCKED継続。main・本番Misaki・Supabase・別プロジェクトには変更しない。PRマージ、枝削除、deploy、有料Gemini、DB接続・migrationを実施しない。
