# 会話成熟化・3ブロック統合レビュー（Issue #218）

2026-11-20 Work統合レビュー。以下は設計レビュー案。担当間で一致した方針を記録し、実装詳細と運用上の承認は各段階で追跡する。
[#218の着手前照合](https://github.com/miyazaki1016/misaki/actions/runs/44497001705) は REVIEW_RECORDED・confirmed・success。現行Issue本文とタイトルの指紋を公開結果に照合済み。

## 責務と依存

| 担当 | 再利用する成果と責務 | 次の受入条件・未決事項 |
| --- | --- | --- |
| 各エンジン | 正本を保持し、認可済み候補をアダプタで提供。[既存調査](https://github.com/miyazaki1016/misaki/issues/197)・[Life Contextの要求](https://github.com/miyazaki1016/misaki/issues/198)・[監査計画](https://github.com/miyazaki1016/misaki/pull/101)を利用 | 種別ごとに出所、期限、取消、禁止条件を宣言。根拠を取得できないエンジンは材料ゼロ |
| #199 材料選別 | スコープ付き入口、採否理由、メモリ内監査、選別A/Bを再利用 | サーバー側の認証・出所保証、入口迂回防止、キャラ正本ID、発話意図と理由、snapshot期限・バージョン互換、監査ID仮名化 |
| #220／#221 会話調律 | 設定検証、スライダー部品、所有者判定の読み取り専用APIを再利用。表現の設定と版管理を担当 | 対象キャラと操作別認可、永続化方式、限定適用と復旧、会話APIの版固定。現HEADのプレビューUIは未ルーティング・メモリ内のみ。実ストア、会話API接続、設定digest照合は未確認 |
| #194 Gemini最適化 | #78由来の合成A/Bと費用ガードを再利用。選別済みの意図・事実・制約・表現設定をGemini向けに最小化 | 制約保持、モデル別価格、思考トークン予約、日本語入力の保守的な見積り、必要CI |
| Work統合 | 接続順、境界テスト、証拠管理。独立出力ガードの統合責任を担当 | ガード実装、フォールバック文面の許可条件、担当横断テストと各HEADのCI |
| Muse監査 | スコープ、来歴、制約保持、復旧、独立ガード・品質評価をレビュー | 仮名化方式・保持期間・削除権限と、費用・検証指摘の解消確認 |

[#199責任分界](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7025535773)・[#220受入契約](https://github.com/miyazaki1016/misaki/issues/218#issuecomment-7025727725)・[#194マルチキャラ要件](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7020760018)・[Muse監査](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7025629615)

## 材料と受け渡しの契約

1. 各アダプタは共通候補に種別・安定した種別内ID・出所と版・根拠参照・発生時刻・期限・取消／忘却状態・対象ユーザー／キャラ・参加／目撃／明示共有の根拠・有限の優先度・重複キー・既出状態・許可済みの内容を渡す。期限なしはソースの明示ポリシーがある場合だけ許可する。外部イベントは安定IDの最新版と取消を照合し、旧版の復活を拒む。
2. サーバーで認証済みユーザー・正本の対象 `characterId` を解決し、根拠と可視性を検証する。所有者・キャラ欠落や未知版はバッチ拒否。不正候補、別ユーザー、非公開、期限切れは個別除外し安全に継続。未実装エンジンは空。各エンジン間の直接依存を作らない。#199が関連性・既出・優先順位・矛盾を裁定し、取消／忘却／認可を優先する。根拠や優劣が判断不能な矛盾は出力から除外し、採否と意図（発話しない、質問を控える場合を含む）の理由コードを記録する。
3. #199の既存 `ConversationSelectionHandoff` を基礎にする。サーバー内の検証済み受け渡しにスキーマ版、選別版、snapshotId、対象ユーザー／キャラ、snapshot生成時刻・有効期限、発話意図、質問可否、許可事実、必須／禁止制約を結び付ける。型や自己申告フラグだけを認可証明に使わない。snapshotIdは固定された候補・時刻・履歴・スコープとの対応を検証し、失効や版不整合時は再選別または停止する。認可失効・忘却を再確認し、snapshotは材料の寿命を延長しない。
4. #220は許可済みの意図に沿う表現設定を別オブジェクト（キャラ、対象範囲、有効開始、tuningVersion、スタイル値）で渡す。質問不可を維持し、許可事実と必須／禁止制約を読み取り専用で保持する。#194は promptVersion・モデル・variantを固定して最小プロンプトに変換する。Geminiは許可された素材の言語化のみ。生ID、未採用候補、監査理由はプロンプトから除外し、必要な制約と意味はすべて保持する。
5. 独立ガードはモデル呼び出し前にスコープ・版・期限・制約保持を検査し、生成後はユーザーに送信する前に、質問越権、捏造された事実・感情・評価・約束、必須／禁止違反を検査する。検証不能なら許可済み定型文または送信停止。Geminiの自己採点に依存しない。

## キャラ分離、版管理と監査

記憶・人格・感情・関係性・調律・セッション・監査の全境界でキャラを必須にする。暗黙の美咲デフォルトを置かず、他キャラは合成fixtureで境界検証する。実装対象は美咲を優先する。

サーバー側で所有者認証とキャラ別の閲覧・保存・試験・適用・復元権限を別々に確認する。下書き保存 → 隔離A/B → 限定範囲への適用 → 明示承認を記録した本番適用 → 最終正常版への復元。適用と復元は変更理由・操作者・時刻・対象範囲・版を監査し、同時操作で承認版を取り違えないことを検証する。会話APIはセッション開始時に承認版を固定し、通常適用・復元は新規セッションから。危険版を明示失効した場合は既存セッションを停止し、許可された正常版から再開する案をレビューする。

各生成に仮名化したスコープ・snapshot・選別版・調律版・promptVersion・モデル・variant・判定理由を紐付ける。永続監査に生ID・本文・未承認の根拠を記録しない。保持期間・削除・閲覧権限は永続化前に合意する。

## 接続順と受入

1. スコープ・材料契約。別ユーザー／キャラ、未知版、偽の出所、NaN、監査データと配信用オブジェクトの誤用、直接呼び出しによる迂回を拒否。
2. Body Clock／人格 → 記憶／忘却 → 関係性／感情の順にアダプタを検証。各段で根拠、可視性、有効期限、矛盾、情報欠損を確認。#197／#198の外部イベント連携は更新・取消・期限切れの回帰を通してから候補に追加する。
3. #220 → #194 → 独立ガード → 横断テスト。質問不可、沈黙、誤記憶・捏造、版固定・復元、ログ漏えい、制約欠落を合成fixtureで検証。Museの費用・境界指摘の解消と別途承認を、実Geminiを用いる評価の前提とする。

調律A/Bは同一キャラ・snapshot・時刻・履歴・選別版・promptVersion・モデルで調律版だけを変更する。プロンプトA/Bは調律版を固定してpromptVersionだけを変更する。材料選別A/Bは既存比較器の軸として管理する。人手の独立評価（自然さ、気遣い、自発性、関連性、質問反復）と、安全・整合性の機械判定、入力／出力・思考トークン、費用、遅延を個別に記録する。漏えい・忘却違反・制約違反は不合格。サンプル不足は未判定。品質の許容幅、試行数、評価者は本実験前に確定する。

## 原本照合と検証

2026-11-22の変更前原本照合スナップショット。各PRのbase・HEAD・main比較・PR起動Actionsを記録する。比較基準のmainは `3ab124c0d5a20a6015840b2627a63c21b3e1f701`。#219の行は本書更新前のHEAD・CIであり、更新後のHEADとCIは今回の変更コミットのActionsで別途確認する。

| PR | base branch | 変更前HEAD | mainとの比較 | 変更前HEADのActions／状態 |
| --- | --- | --- | --- | --- |
| [#219](https://github.com/miyazaki1016/misaki/pull/219) | `main` | [`0cd039a958911594de8a1a927041425078ae0a7c`](https://github.com/miyazaki1016/misaki/commit/0cd039a958911594de8a1a927041425078ae0a7c) | 25 ahead / 0 behind | preflight [success](https://github.com/miyazaki1016/misaki/actions/runs/44940957766)・統合 [success](https://github.com/miyazaki1016/misaki/actions/runs/44940957789)・分類 [success](https://github.com/miyazaki1016/misaki/actions/runs/44940957763) |
| [#199](https://github.com/miyazaki1016/misaki/pull/199) | `main` | [`071270a15716a45bf558363d8ef35f1bef30c787`](https://github.com/miyazaki1016/misaki/commit/071270a15716a45bf558363d8ef35f1bef30c787) | 26 ahead / 26 behind | preflight [success](https://github.com/miyazaki1016/misaki/actions/runs/44640044140)・統合 [success](https://github.com/miyazaki1016/misaki/actions/runs/44640044171)・分類 [success](https://github.com/miyazaki1016/misaki/actions/runs/44640044086) |
| [#221](https://github.com/miyazaki1016/misaki/pull/221) | `main` | [`74780ba0100d629ec7046a097deaecb430b35a30`](https://github.com/miyazaki1016/misaki/commit/74780ba0100d629ec7046a097deaecb430b35a30) | 16 ahead / 0 behind | preflight [success](https://github.com/miyazaki1016/misaki/actions/runs/44644915033)・統合 [success](https://github.com/miyazaki1016/misaki/actions/runs/44644915107)・分類 [success](https://github.com/miyazaki1016/misaki/actions/runs/44644915059) |
| [#194](https://github.com/miyazaki1016/misaki/pull/194) | `work/context-no-duplicate-replies-ab` | [`8d7b732fb19ef45c8148c135fffb94451e9bd9ea`](https://github.com/miyazaki1016/misaki/commit/8d7b732fb19ef45c8148c135fffb94451e9bd9ea) | 215 ahead / 147 behind | PR起動Actions 0件・check runs 0件・commit status contexts 0件（state=pending）。CI未確認 |

mainとの比較は全PRで同じmain HEADに対する値。#194はPR自体のbaseが研究ブランチであり、main比較はPRのbase比較や統合可能性を示さない。#199はmainから26コミット遅れており、担当ブランチの更新・統合は別担当の作業として扱う。

4PRのPR review submissionsとinline review threadsは各0件。Conversation commentsは #219=45件、#199=20件、#221=9件、#194=12件で、通常コメントとレビュー承認を区別する。Issue #218の既存着手前照合 [run 44497001705](https://github.com/miyazaki1016/misaki/actions/runs/44497001705) は現行本文・判断記録に一致し、REVIEW_RECORDED／confirmed／success。Issue #220の既存照合 [run 44506179084](https://github.com/miyazaki1016/misaki/actions/runs/44506179084) も本文・判断記録に一致し、同じく合格。#219自身は上表の最新HEAD preflightで再確認済み。

#199の既存合成fixture 21件は記載HEADのソースでローカル再実行し21件成功。追加の合成契約試験は後続節に記録し、担当のローカル隔離実行と既存HEAD CIを混同しない。実アダプタ接続、実経路の独立送信前ガード、実Geminiの横断テストは未実施。

担当間で次に合わせる項目は、正本のキャラID、サーバー内handoffの証明、snapshotのTTL確定、版の互換表、監査の保持期間、調律の限定範囲と失効時処理、独立ガードの判定と安全な停止。各担当はこのDraft PRで確認結果を共有する。マージ、DB、既存認証・設定、本番配線・デプロイ、実Geminiは別途承認が必要。

## 担当回答を反映した統合契約

[#199の契約案](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7026000340)・[#220の受入条件](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7026015649)・[#194の受入条件](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7026020474)・[Museの追加監査](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7026059874)

| 境界 | 統合方針 | 残る実装判断 |
| --- | --- | --- |
| キャラとセッション | サーバーの登録済み不変IDを使用。認証済み所有者と対象キャラをセッションに固定し、キャラを変えるときは新規セッションを作る。共有エンジンのユーザー依存キャッシュと派生状態にも owner／character を必須キーとし、セッションや版に依存する値はその次元も含める | 美咲の登録IDと認可正本を確認 |
| 材料の出所 | 各アダプタが信頼済みの正本レコード・版・根拠・可視性・失効状態から候補を生成。#199の認証済みサーバー入口で照合し、純粋フィルタへの入力や自己申告フラグを認可証明に使わない。下流は検証済みサーバー経路だけを受理 | アダプタ別の証拠取得と、入口の強制方法 |
| snapshot | サーバー発行の推測困難なIDを owner／character／session／turn と不変の材料マニフェスト（生成時刻、期限、元データ版、schema／選別版）に束縛。同一ターン限りかつ使用する材料の最短期限以内。Gemini呼び出し直前とユーザー送信直前に忘却・権限変更・共有撤回・イベント取消を再確認。失効時は再取得・再選別するか停止。実験用は本番に転用不可 | 保管方式、具体的TTL、実験保持期限 |
| #199→#220→#194 | 既存の `selected` とバージョン情報を基礎に、scope・期限・意図・質問可否・ID付き必須／禁止制約を検証済み受け渡しに追加。既存の `decisions` と意図の理由・根拠は監査側で参照。空の採用材料は許容し、沈黙は明示した意図として表現し、Gemini呼び出し・定型文送信とも行わない | フィールド名と型、意図の列挙、互換表。現行 #199 の schema v1 は選別基礎型であり、拡張契約の対応版は未登録 |
| 版互換 | schemaVersion は構造、selectionRulesVersion は選別、tuningVersion は実効スタイル、promptVersion は構成を個別管理。明示対応版だけを許可し、不明な制約、版不一致、必須項目欠落は拒否。破壊的変更は新schemaと送受双方の契約テストを要する。ターンにはモデル・variantと各版も記録 | #199／#220／#194の対応版一覧と移行猶予 |
| 調律と復元 | readPreview／editDraft／publish／rollbackを対象キャラごとに認可。共通デフォルトとキャラ別上書きは解決済みのキャラ別実効版として扱い、新規セッションでキャラと版を原子的に固定。最終正常版は同一キャラ・範囲で承認済みかつ適用後の確認を通過し失効していない版を指す。通常の適用・復元は新規セッションから | 正常判定の観察期間と閾値、旧版セッション継続・保存期間、緊急失効の権限・中断処理・再開時の再束縛 |
| 独立ガード | #194は制約IDと原文または構造化値を保持。ガードが受渡し側の必須／禁止制約集合とプロンプト／強制経路での実効制約を照合する。質問不可は生成後の送信経路でも強制。Workが実装統合を担当し、判定基準の変更は版管理しMuseのレビュー対象とする。ターン監査にガード版、項目別合否、理由、再生成回数、定型文発動有無を記録 | 合否基準の詳細、再生成の上限値、意図別に許可する定型文と版。上限に達したら許可済み定型文を使うか送信停止 |

mainでは [会話APIのBearer認証](https://github.com/miyazaki1016/misaki/blob/main/app/api/chat/route.ts)、[美咲専用の人格版取得](https://github.com/miyazaki1016/misaki/blob/main/lib/persona/persona-store.ts)、[ユーザー単位の記憶・関係性読込](https://github.com/miyazaki1016/misaki/blob/main/lib/canonical-state.ts) を確認。#221の [所有者認証](https://github.com/miyazaki1016/misaki/blob/74780ba0100d629ec7046a097deaecb430b35a30/lib/conversation-tuning-owner-auth.ts) もユーザー本人の検証まで。これらからマルチキャラの正式ID値やキャラ別操作権限の正本は確認できず、未決のまま扱う。

初回の合成契約テストは同一ユーザー・2キャラのキャッシュ分離、同一IDでの別セッション再利用拒否、生成中の失効、制約IDが同じでも値を弱めた場合の拒否、沈黙時のモデル呼び出し0件、質問不可時の送信拒否、共通デフォルト変更時の既存セッション維持、未確認版への復元拒否を含める。

#221のUUID修正後の最新HEAD `74780ba010` は [統合テスト](https://github.com/miyazaki1016/misaki/actions/runs/44644915107)・[分類](https://github.com/miyazaki1016/misaki/actions/runs/44644915059)・[着手前照合](https://github.com/miyazaki1016/misaki/actions/runs/44644915033) が成功。#194は引き続きCI未確認。費用ガードはモデル別単価と未知モデル拒否、思考トークンの事前予約、日本語入力の保守的な見積りを実送信前の必須条件とする。

## 2026-11-20 担当報告の照合

| 担当 | 確認できた範囲 | 残る受入条件 |
| --- | --- | --- |
| [#199 材料選別](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7026969479) | 合成候補で期限前の採用、期限と同時刻の除外、最新の可視性で再選別したときの共有撤回の反映。対象HEAD `071270a157` の[既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44640044171) 成功 | 選別済みsnapshotを同一ターンに束縛し、生成中に共有が撤回された場合は送信前に止める横断ケースが未検証 |
| [#221 調律](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7027192722) | 合成プレビューは同一fixtureに対する異なる調律版を保持。対象HEAD `74780ba010` の[既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44644915107) 成功 | 版Bの適用後も既存セッションがAを使い、新規セッションがBを使う経路は未実装・未検証 |
| [#194 Gemini最適化](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7027228664) | 費用予約の差分案で、思考分を含む上限内／超過／予約不可の合成3ケースが期待どおり | 差分の適用、料金の確認、実Geminiは未実施。統合側で現行HEAD `8d7b732fb1` のActionsを照会した結果は0件 |

[#199の追加契約試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7032710702)は、対象HEADの選別関数と試験用ガードを用い、生成中の共有許可継続で送信1件、共有撤回で旧snapshotからの送信0件を確認した。実経路での同時更新・送信境界、照合元の正本、TTL秒数、正式キャラID、互換表、本番配線は未決。[#221の追加契約試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7033638077)では、対象HEADの設定検証と試験用のメモリ内承認ポインタを使い、版Bへ切替後も既存セッションはAと元の設定を保持し、新規セッションはBと新しい設定を使うことを確認した。既存プレビュー4件と追加契約試験1件は隔離実行で成功。実際の承認版ストア、セッション作成時の原子的な固定、複数端末からの再開、旧版保持と失効は未実装または未検証。

[#194の制約保持契約試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7034307503)では、対象HEAD `8d7b732fb1` の最小本文生成器と試験用の照合経路を隔離実行。安定ID・種別・構造化値の照合で、順序変更は通過し、欠落・必須と禁止の入れ替え・同じIDでの値変更は入力確定前に停止した。合成4件成功。現行HEADのActions runは取得0件。文字列化後の制約保持と実効制約の強制、正式な版・API互換、実Geminiの振る舞いは未検証。

3件の隔離試験がそろったため、実装へ移る前に、試験用の判定と実経路の受入条件との差を独立レビューする。対象は共有撤回と送信の境界、調律版の固定と失効、最小入力への制約引き渡しと強制。具体TTL、保存期間、権限、正式な版・APIは引き続き未決。

## 独立監査の結果と実装前の条件

[Museの監査回答](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7040588896)は、3件の隔離試験と設計文書の証拠が一致することを確認した。3件は期待する挙動を示す。実経路での強制と本番受入は未確認。

- 実装前の第一条件は、#219のPR単位の着手前照合を解消すること。[監査対象コミットの失敗ログ](https://github.com/miyazaki1016/misaki/actions/runs/44706990982/job/136188969745)は `REVIEW_REQUIRED`。当時は #221 と #171 の再利用判断がPR本文に未記録だった。両件を追記後、監査結果を収録したコミット `8964cb16` の[PR単位の再照合](https://github.com/miyazaki1016/misaki/actions/runs/44788212193)が成功した。#218の本文に一致する[Issue単位の合格](https://github.com/miyazaki1016/misaki/actions/runs/44497001705)は引き続き有効。
- #199は、送信境界で許可の現行状態を確認し、材料集合が変われば旧出力を破棄して再生成または停止する。期限切れや外部イベント取消も再照合対象。最終照合後の撤回、送信再試行時の二重送信防止、正本との照合方法は追加受入条件の提案として扱う。
  - [#199の期限・取消の追加報告](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7047777162)を[元依頼](https://github.com/miyazaki1016/misaki/pull/199#issuecomment-7047738145)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44640044171)と照合。隔離合成試験では、送信直前に再選別すると期限前・取消なしはメモリ内送信1件、生成中に期限へ到達すると0件（`expired`）、生成中に外部イベントが取り消されると0件（`cancelled`）。後者2件では材料集合が変わったため試験用ガードで旧出力を破棄した。既存CIは対象HEADの証拠で、3ケースの結果は担当のローカル隔離実行による。再照合から実送信までの競合、再試行時の重複防止、照合先の正本、具体TTLは引き続き未決または未検証。
  - 統合側では、上記[#199 HEAD](https://github.com/miyazaki1016/misaki/commit/071270a15716a45bf558363d8ef35f1bef30c787)の選別器を再利用し、期限のあるイベント1件と有効な別材料1件を選ぶ隔離試験を追加実行。再選別で2件とも残る対照はメモリ内送信1件。期限到達・イベント取消の各ケースで別材料1件が残っても、既に生成した出力は破棄され、送信は各0件。3ケース成功。送信判定は試験用で、実経路での強制は未検証。
  - [#199のsnapshot再利用試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7052104117)を[元依頼](https://github.com/miyazaki1016/misaki/pull/199#issuecomment-7052080684)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44640044171)と照合。有効期限内に同じID・材料を使い、元のセッションとターンではhandoffを1件確定。セッションのみ、ターンのみを変更すると各0件で旧handoffを返さなかった。ローカル隔離試験3件成功。マニフェストと文脈照合は試験用。実経路での強制、ID発行方式、保管先、具体TTLは未検証または未決。
  - [#199の共有キャッシュ・派生状態の分離試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7061149101)を[元依頼](https://github.com/miyazaki1016/misaki/pull/199#issuecomment-7061128771)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44640044171)と照合。試験用のメモリ内キャッシュは owner／character／材料種別／材料ID でキーを分けた。同一スコープの対照では合成材料1件と派生優先度17を取得。別キャラと別ownerでは同一材料IDでも初回は各0件で、自スコープに同じIDを登録すると自スコープの材料と優先度12だけがhandoffに入り、元スコープの17を保持した。誤配線の対照2件では既存のスコープ判定がそれぞれ `not-visible-to-character` と `different-user` で拒否した。担当の隔離試験は5件成功。既存CIは対象HEADの証拠で、この5件はローカル試験。実キャッシュの実装・認可正本・正式キャラID・失効処理は未決または未検証。
  - [#199の監査用と配信用の分離試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7063343727)を[元依頼](https://github.com/miyazaki1016/misaki/pull/199#issuecomment-7063319115)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44640044171)と照合。同じ合成入力から作った2種類の出力を試験用の受理境界に渡し、配信用として発行したhandoffはメモリ内受け渡し1件、監査用オブジェクトは `not-issued-for-delivery` で拒否されて0件。監査用には選別材料の識別子があり、本文は含まれなかった。担当の隔離実行は既存4件と追加3件の計7件成功。発行済みオブジェクトのメモリ内登録は試験用で、既存コードから再利用したのはスコープ付きhandoffと監査用の本文除外処理。正式な型・認可証明・監査保持方式と実際の経路での強制は未決または未検証。
- #221はセッション作成時にキャラと承認版を原子的に固定する。固定中の版の失効・復元・再開と、生存中セッションが参照する旧版の保持をストア実装前に決める。設定digestを含む固定、公開切替との同時実行、不明版・別キャラ版の扱いは監査提案。
  - [#221の固定版読込報告](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7049262066)を[元依頼](https://github.com/miyazaki1016/misaki/pull/221#issuecomment-7049234011)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44644915107)と照合。試験用ストアに最新承認版Bがある状態で、同じキャラの固定版Aは設定1件、存在しない版と同名版が別キャラにだけある場合は各0件。後者2件で最新承認版Bや別キャラの設定への切替はなかった。担当の隔離実行は既存プレビュー4件と固定版読込3件の計7件成功。実経路のストア・認可、固定時の原子性、設定digest、旧版保持と緊急失効後の扱いは未検証または未決。
  - [#221の公開切替とセッション作成の競合報告](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7051348211)を[元依頼](https://github.com/miyazaki1016/misaki/pull/221#issuecomment-7051325691)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44644915107)と照合。メモリ内で順序を制御し、固定が先なら版A・設定A、公開切替が先なら版B・設定B。版と設定を別々に読む対照では、間の切替により版A・設定Bが混在した。担当のローカル隔離実行は、この3件と既存プレビュー4件の計7件成功。実ストアの原子性、保存先、digest形式、旧版保持期間、緊急失効後の再開条件は未検証または未決。
  - [#221の通常復元試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7054184729)を[元依頼](https://github.com/miyazaki1016/misaki/pull/221#issuecomment-7054162177)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44644915107)と照合。適用後未確認の版Bへの復元を拒否し、承認版ポインタはCを維持。確認済みで失効していない版Aへ復元すると、新規セッションはAを固定し、既存セッションはCとその設定を保持した。担当のローカル隔離実行は追加2件と既存プレビュー4件の計6件成功。復元判定とストアは試験用。実ストアでの更新・競合・認可・監査、観察期間・閾値、緊急失効後の再開条件は未検証または未決。
  - [#221の共通デフォルト切替試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7061991045)を[元依頼](https://github.com/miyazaki1016/misaki/pull/221#issuecomment-7061971459)および[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44644915107)と照合。担当の隔離実行は既存4件と追加3件の計7件成功。試験用の設定解決では、切替後も既存セッションは版Aと全設定を保持し、新規セッションは版Bを固定した。新規セッションは親しみやすさ35→65、自発性40→55、質問口調25→15を継承し、キャラ別に明示したユーモア0と長さshortを維持。誤って既存ターンが公開ポインタを読み直す対照では、設定が版Bに変わる差を検出した。設定解決と版固定はメモリ内の試験用で、追加3件は既存CIの対象外。実ストアでの原子性・認可・監査、正式な版キーと保存先は未検証または未決。
  - [#221の調律A/Bでの制約保持試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7064066010)を[元依頼](https://github.com/miyazaki1016/misaki/pull/221#issuecomment-7064044903)と[対象HEADの既存CI](https://github.com/miyazaki1016/misaki/actions/runs/44644915107)に照合。版と質問口調を変えても、共有入力の質問不可・許可材料・必須／禁止制約は同一。質問可否が欠ける入力は既存プレビュー入口で拒否され、元入力を後から変更してもプレビューの共有入力は維持された。担当の隔離試験は既存4件と追加3件の計7件成功。追加3件は既存CIとは別のローカル実行で、実経路の質問判定・送信前強制は未検証。
- #194は必須・禁止制約を構造化したまま保持し、実際に生成・強制する制約を独立に照合する。文字列化後の保持、上流での重複ID拒否、3担当の合成試験をCIに組み込むことは追加受入条件の提案。
  - [#194の文字列化後の制約照合報告](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7050074348)を[元依頼](https://github.com/miyazaki1016/misaki/pull/194#issuecomment-7050050268)および[#194対象HEAD](https://github.com/miyazaki1016/misaki/commit/8d7b732fb19ef45c8148c135fffb94451e9bd9ea)と照合。既存の本文生成器で最小本文Bを生成し、合成制約を含む最終JSONを読み戻して受渡し元のID・種別・構造化値と比較。全件一致（順序変更あり）では検査した文字列がメモリ内スタブに1件届き、1件欠落・同じIDと種別で値変更では各0件。担当のローカル隔離試験3件が成功した。JSON形式・ガード・スタブは試験用で、#194の対象HEADのPR起動Actionsとcombined statusは取得0件。実際の送信経路、生成後の独立ガード、正式形式・版互換は未検証または未決。
  - [#194の版互換の隔離試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7062578318)を[元依頼](https://github.com/miyazaki1016/misaki/pull/194#issuecomment-7062559556)および[対象HEADのChecks](https://github.com/miyazaki1016/misaki/commit/8d7b732fb19ef45c8148c135fffb94451e9bd9ea/checks)と照合。明示登録した構造・選別・調律・プロンプトの版の組み合わせでは、既存本文生成器とメモリ内送信スタブが各1回。未知schemaと、個別には既知でも組み合わせが未登録の調律版・プロンプト版では各0回で、`unknown-schema` と `incompatible-versions` を区別した。拒否時は入力版の置換や再試行もなし。担当の隔離試験3件成功。互換表と照合は試験用で、正式な対応版一覧・移行猶予・実経路での強制は未決または未検証。対象HEADのPR起動Actionsとcombined statusは取得0件で、#194のCI合格は未確認。
  - [#194のモデル別単価の合成試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7065061500)を[元依頼](https://github.com/miyazaki1016/misaki/pull/194#issuecomment-7065040352)および[対象HEADのChecks](https://github.com/miyazaki1016/misaki/commit/8d7b732fb19ef45c8148c135fffb94451e9bd9ea/checks)と照合。入力1,000・出力256トークンを固定し、架空単価Aで予約0.000634 USD、Bで0.001012 USD、メモリ内呼び出し各1件。未登録モデルは `unregistered-model` で拒否し、既定単価への置換なし、呼び出し0件。担当の隔離試験3件成功。#194の対象HEADはPR起動Actionsとcombined statusの取得が各0件で、CI合格は未確認。
  - 統合側は、上記モデル別単価の試験と[思考トークン込みの予約試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7027228664)の合意済み条件を組み合わせた。固定の合成入力1,000・出力256・思考128トークン、使用済み推定0.039 USD・停止値0.04 USDで、Aは予約0.000826 USDで呼び出し1件、Bは予約0.001268 USDで上限超過のため0件、未登録モデルは単価未確定で0件。ローカルの隔離合成試験3件が成功。単価表、予約判定、呼び出しは試験用で外部送信なし。実価格・料金仕様、日本語入力の見積り、実績精算と実経路での強制は未検証。

TTL、正式キャラID、版互換表、保存期間、ガード判定基準の版管理は未決。監査回答による実装承認や本番変更の承認はない。

## 統合側の沈黙契約の隔離試験

明示した沈黙の意図では、許可済み定型文を想定した試験用の文面が用意されていても、モデル呼び出しとメモリ内送信はいずれも0件。空材料の応答ターンを対照にし、[既存の#194本文生成器](https://github.com/miyazaki1016/misaki/blob/8d7b732fb19ef45c8148c135fffb94451e9bd9ea/lib/context-ab-prompt.ts)を再利用してモデルスタブ呼び出し1件・合成応答1件を確認。別の対照ではモデルスタブが失敗を返すと試験用定型文が1件記録され、沈黙側の0件を検出できることを確認した。隔離試験3件成功。意図の判定・モデル・送信経路は試験用。定型文を許可する実際の意図や文面の版、実経路での強制は未決または未検証。

## 統合側の質問可否の隔離試験

[#220の質問可否の受け渡し契約](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7026015649)に沿って、[既存の#194本文生成器](https://github.com/miyazaki1016/misaki/blob/8d7b732fb19ef45c8148c135fffb94451e9bd9ea/lib/context-ab-prompt.ts)を使い、モデル役の合成出力を試験用ガードで判定した。質問不可・質問出力はメモリ内送信0件、質問可・同じ質問出力は1件、質問不可・平叙文は1件。試験3件成功。疑問符で終わる固定文を試験対象とし、本番の質問判定基準、再生成・定型文の扱い、実際の会話経路での強制は未検証または未決。

## 通常復元と沈黙の横断隔離試験

[Museの監査回答](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7056344891)と[通常復元試験](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7054184729)を照合。合意済みの通常復元では新規セッション用の承認版ポインタだけを切り替え、既存セッションの固定版と処理中ターンの意図・質問可否を保つ。試験では調律設定検証と最小本文生成器を再利用し、ターンの意図を固定した後に承認版をCからAへ復元した。

| 試験用の意図 | モデルスタブ呼び出し | メモリ内送信 | 既存セッションの固定版 | 新規セッションの固定版 |
| --- | ---: | ---: | --- | --- |
| 沈黙・質問不可 | 0件 | 0件 | C | A |
| 通常応答・質問不可（対照） | 1件 | 1件 | C | A |

2ケースが成功。復元直後とターン完了後の固定レコード・handoffは一致し、試験用監査記録に固定版C、設定のdigest、意図、質問可否が残った。応答の対照ではモデルスタブへの入力にCの設定を使用。ストア、digestの形式、ガード、監査記録は試験用で、実経路での強制は未検証。緊急失効の権限・適用範囲・停止時点・通知や定型文・再開条件は未決のまま扱う。

## 調律A/Bから送信前までの横断隔離試験

[#221のプレビュー](https://github.com/miyazaki1016/misaki/blob/74780ba0100d629ec7046a097deaecb430b35a30/lib/conversation-tuning-preview.ts)と[#194の本文生成器](https://github.com/miyazaki1016/misaki/blob/8d7b732fb19ef45c8148c135fffb94451e9bd9ea/lib/context-ab-prompt.ts)を再利用。合成fixtureを共有し、調律版A/Bと質問口調15/85だけを変え、本文は両方とも同じプロンプトvariantに固定した。試験用の本文から読み戻した質問可否・許可材料・必須／禁止制約は両方で一致した。

- 質問不可・固定の質問出力は A/B とも送信0件。
- 質問可・同じ質問出力と、質問不可・平叙文の対照では A/B ともメモリ内送信1件ずつ。

Node.js v24.22.3 のローカル隔離実行で3件成功。出力・質問判定・送信はスタブで、疑問符で終わる合成文だけを判定した。実経路での生成、質問判定基準、再生成・定型文の扱いは未検証または未決。

## 2026-11-21 main実態監査（Issue #222）との突合・未決事項

対象は main `3ab124c0d5a20a6015840b2627a63c21b3e1f701` の読み取り専用監査です。設計目標と現行本番コードの状態を混同しないため、以下を as-is の観測として追記します。[Muse一次報告](https://github.com/miyazaki1016/misaki/issues/222#issuecomment-7060599218)・[動きの地図](https://github.com/miyazaki1016/misaki/issues/222#issuecomment-7060751080)・[RPC所在の訂正](https://github.com/miyazaki1016/misaki/issues/222#issuecomment-7060774641)・[#219への確認依頼](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7060614662)。

| 項目 | mainで報告された実態 | #219での扱い |
| --- | --- | --- |
| 関係性 | ポイント制（毎ターン同期）、5軸 v1.1（非同期）、感情・行動 v2（毎ターン状態遷移）の3系統が併存。コード上、単一の正本や矛盾時の優先順位は宣言されていない | **正本・優先順位は未決**。どれか1系統を選ぶ、合成する、または他を従属させる判断は行わない。担当確認と用途・意味論の根拠が揃うまで、同じ「関係性」材料として同一視しない |
| v1.1の本番有効状態 | `MISAKI_RELATIONSHIP_ENGINE_VERSION` と `MISAKI_RELATIONSHIP_ENGINE_START_AT` の本番実値は監査で未取得 | 本番での有効／無効は未確認。環境変数や本番への接続を行わず、未確認のまま維持 |
| 生活文脈 | チャット側は日付ハッシュで仕事／休み・気分を決め、Body Clock側は別の生活文脈組み立てを持つ。両者の突き合わせ結果は未取得 | 同じ日タイプ・気分の正本として扱えるか未決。矛盾時の優先順位を推測しない |
| キャラ分離 | 監査対象の現行main会話・状態経路はユーザー単位で、キャラ次元は確認されていない | #219の必須 `characterId` は将来の統合契約であり、現行本番実装済みとは扱わない |
| RPC定義 | 中核RPC 24件中23件は migrations／SQL に定義あり。`consume_daily_message` の定義はリポジトリ内で見つからず、migrationでは権限設定の対象として参照され、本番DBには存在すると報告 | 「中核RPC全体がリポジトリにない」という先行記述は訂正済み。DB実体とmigration最終形のドリフト、同RPCの定義内容は未確認 |
| 3ブロック接続 | #199の選別、#220の調律アプリ、#194の評価スクリプトはmainに存在せず、#219のsnapshot／handoff／独立ガードも現行会話経路には未接続。既存の返答チェックは独立したfail-closed送信ゲートと同等ではない | Draft上の契約・隔離試験を本番経路の実装証拠に読み替えない。独立ガードの実装・接続は未完了 |

この追記は現行実装の観測と未決事項の記録であり、関係性の正本選択、環境設定の有効化、DBドリフト解消、キャラ分離の本番実装、3ブロックの接続を承認するものではありません。production／DBの読み取り確認は今回の範囲外です。

## 2026-11-22 統合フォロー：送信境界の参照契約と最新原本照合

変更前の原本は Draft PR #219、branch `docs/conversation-maturity-218`、HEAD `d162427d81f1c27983ce2dd320c21dbb3d54581d`。比較基準の main は `3ab124c0d5a20a6015840b2627a63c21b3e1f701`。この追記は本節の直前までの記録を保持し、担当PRのコード・ブランチは変更しない。

### 担当依頼と報告の突合

- #199 の既存 [MISAKI-REQUEST](https://github.com/miyazaki1016/misaki/pull/199) 7件のうち、最初の6件は各元コメントURLが一致する [MISAKI-REPORT](https://github.com/miyazaki1016/misaki/pull/219) を確認。新しい [TOCTOU・二重送信防止依頼](https://github.com/miyazaki1016/misaki/pull/199#issuecomment-7075745505) は 2026-11-22 07:09:19Z 投稿で、対応する実作業報告はまだない。6時間未満のため督促対象ではない。報告まで新規担当依頼を追加しない。
- #221 の既存依頼7件は、すべて元依頼の直接URLが一致する実作業報告を確認。#194 の既存依頼5件も同様にすべて報告あり。受領のみの [MISAKI-TEST] は作業報告に数えない。
- #219 の 2026-11-21 21:30Z の新着3コメントは各担当の疎通試験受領 [MISAKI-TEST] であり、作業完了や新しい依頼根拠には転用しない。
- Museの [独立監査依頼](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7069531837) は未回答。対象コミット `0cd039a958911594de8a1a927041425078ae0a7c` から現HEADまでの差分は2コミットで、実質内容は #220/#221 の状態と原本照合表の更新、および変更前スナップショットの明示。別の同一観点の依頼は重ねない。

### 最新HEAD・CIの原本照合（変更前）

| 対象 | base / HEAD | main `3ab124c0d5a20a6015840b2627a63c21b3e1f701` との比較 | 対象HEADのPR Actions |
| --- | --- | --- | --- |
| [#219](https://github.com/miyazaki1016/misaki/pull/219) | `main` / [`d162427d81f1c27983ce2dd320c21dbb3d54581d`](https://github.com/miyazaki1016/misaki/commit/d162427d81f1c27983ce2dd320c21dbb3d54581d) | 27 ahead / 0 behind | [preflight success](https://github.com/miyazaki1016/misaki/actions/runs/44966347202) · [統合テスト success](https://github.com/miyazaki1016/misaki/actions/runs/44966347199) · [分類 success](https://github.com/miyazaki1016/misaki/actions/runs/44966347205) |
| [#199](https://github.com/miyazaki1016/misaki/pull/199) | `main` / [`071270a15716a45bf558363d8ef35f1bef30c787`](https://github.com/miyazaki1016/misaki/commit/071270a15716a45bf558363d8ef35f1bef30c787) | 26 ahead / 26 behind | [preflight success](https://github.com/miyazaki1016/misaki/actions/runs/44640044140) · [統合テスト success](https://github.com/miyazaki1016/misaki/actions/runs/44640044171) · [分類 success](https://github.com/miyazaki1016/misaki/actions/runs/44640044086) |
| [#221](https://github.com/miyazaki1016/misaki/pull/221) | `main` / [`74780ba0100d629ec7046a097deaecb430b35a30`](https://github.com/miyazaki1016/misaki/commit/74780ba0100d629ec7046a097deaecb430b35a30) | 16 ahead / 0 behind | [preflight success](https://github.com/miyazaki1016/misaki/actions/runs/44644915033) · [統合テスト success](https://github.com/miyazaki1016/misaki/actions/runs/44644915107) · [分類 success](https://github.com/miyazaki1016/misaki/actions/runs/44644915059) |
| [#194](https://github.com/miyazaki1016/misaki/pull/194) | `work/context-no-duplicate-replies-ab` / [`8d7b732fb19ef45c8148c135fffb94451e9bd9ea`](https://github.com/miyazaki1016/misaki/commit/8d7b732fb19ef45c8148c135fffb94451e9bd9ea) | 215 ahead / 147 behind（main比較。PR base比較ではない） | PR起動run 0件・combined status 0件。CI合格は未確認 |

#219の既存Issue照合は [#218 run 44497001705](https://github.com/miyazaki1016/misaki/actions/runs/44497001705)、[アプリ担当 #220 run 44506179084](https://github.com/miyazaki1016/misaki/actions/runs/44506179084) がいずれも本文・判断記録に一致する既存合格として再利用。#102はOPEN・未完了で、台帳の親チェックポイントもactive。会話3ブロックの設計レビューを理由に親のエンジン総点検を完了扱いしない。

### #199の送信境界・冪等性：統合側の隔離参照契約

根拠は [Muse監査の追加受入条件](https://github.com/miyazaki1016/misaki/pull/219#issuecomment-7056344891) と [#199の未報告依頼](https://github.com/miyazaki1016/misaki/pull/199#issuecomment-7075745505)。外部送信のない合成値だけで、送信境界の意味論を持つ参照モデルを隔離実行した。owner・character・session・turn、材料manifest、許可版を合成値で束縛し、最終送信境界で許可版と冪等キーを照合する。

| ケース | 期待 | 結果 |
| --- | --- | --- |
| 許可版が変わらない対照 | 1回送信 | 1回 |
| 最終再照合後・送信境界前に共有を撤回 | 古い許可版を拒否、0回 | `stale-permission`、0回 |
| 同一turnの送信再試行 | 重複を拒否し総数1回 | 1回目 `sent`、2回目 `duplicate-turn`、総数1回 |
| 送信境界が撤回より先に確定する順序 | 線形化順序に従い1回 | 1回 |
| 撤回が送信境界より先に確定する順序 | 線形化順序に従い0回 | 0回 |

5ケース成功、失敗0。これは統合側の参照契約モデルであり、#199の実コード・DBトランザクション・キュー・ネットワーク送信は実行していない。実経路のTOCTOU原子性、正本の許可版照合、同一turnの永続冪等性は引き続き未検証で、#199担当の報告待ち。今回の合成試験を実経路の受入・本番承認に読み替えない。

#194は同HEADのActionsがないためCI未確認のまま。実Gemini、実価格・モデル仕様、認証、DB、会話API接続、Body Clock同時実行、感情の定期回収、iPhone Safariの本番受入は、設計・合成試験・CI・main統合とは別の未完了段階として維持する。
