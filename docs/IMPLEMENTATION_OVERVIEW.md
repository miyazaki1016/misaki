# Misaki 実装・修正 総覧

> **未来のソラへ——**  
> この総覧を読め。  
> せいちゃんに同じ説明を二度させるな。  
> 過去のソラは、ちゃんと考えてここまで来た。  
>  
> **未来のソラを信用するな。総覧を信用しろ。**


最終更新: 2026-10-07  
実装ソース照合基準: `main` @ `49a663258e93af88566be586d758442ad92dfaf1`

この文書は、直近の統合作業・本番検証・会話実地テストで入った変更を、漏れなく追えるようにまとめた総覧です。

## 0. 2026-09-18 GitHub最新ソース突き合わせ

総覧と `main` の最新ソースを、チャット・履歴同期・Body Clock・自発写真・旧自発API・Push・利用回数まわりで再照合済み。

### 一致を確認した主要点

- チャットの返答失敗時に `request_id` 単位で利用回数を一度だけ返却する実装が存在
- iPhone側の失敗表示は美咲の会話バブルではなく `sendError` の独立UI
- 会話履歴同期は5秒間隔で、ローカルがサーバー履歴の追記版ならローカルをサーバーへ同期
- `chat-proxy` から base chat route を呼ぶのは1ブラウザ送信につき1回
- Body Clock は `ProactiveDecisionContext` を文章・写真で共有
- Body Clock の写真 selector は `selectorVersion: 4`
- Body Clock の現在の自発間隔は **55〜210分**
- `shouldSend` は Body Clock 内では常に `true` で、送信可否の行動ゲートは upstream の claim 側で済んだ後という設計
- `CHASE + concerned` では現在も `lifeConfidence === explicit || emotion === concerned` で `check_in` が入るため、総覧の「要再検討」は有効
- 現在のBody Clock写真カタログは morning/day/evening/night 各1枚で、全 direction/action/emotion を許可している

### 旧自発経路の整理

2026-09-18 に、実利用されていない旧ブラウザ自発経路を削除。

- `app/chat/page.tsx` の旧 `sendProactiveMessage()`
- 旧45分系ブラウザスケジューラ定数とローカル状態
- `app/api/proactive/route.ts`
- `app/api/body-clock/route.ts`（旧Vercel側Body Clock）
- `lib/proactive-photo.ts`

現在の自発メッセージ経路は Supabase Edge Function の Body Clock に一本化。Vercel側は `/api/push/body-clock` のPush relayだけを残す。

### Pushで残っているコード上の注意点

古いPreview由来Push購読は運用上削除済みだが、`public/sw.js` の通知クリック先は現在も `/chat` などの**相対URL**。

そのため、将来Previewドメインで再びPush購読を作った場合、そのPreview originの `/chat` を開く余地は残っている。これは今回の購読削除とは別の、コード上の再発防止候補。

### 検証表現の補正

返答失敗時の利用回数返却は**実装・DB反映済み**。ただし修正後に意図的に返答失敗を再現して、iPhone実機で「エラー表示 + 回数返却」を再確認する破壊的テストはまだしていない。

通常の送受信が修正後に複数往復できることは実機確認済み。

## 0.5 開発体制 / 役割分担

このプロジェクトは、長期開発でも判断基準と責任範囲を見失わないよう、以下の役割分担で進める。

- **せいちゃん = オーナー**
  - プロダクトの発想・ひらめき・方向性を出す
  - 実機で美咲を使い、会話品質・挙動・違和感を確認する
  - 最終的なプロダクト判断を行う
- **ソラ = 監督 + 現場職人**
  - オーナーのひらめきを受けて基本設計へ落とし込む
  - DBまわり、システム全体の構成・整合性を管理する
  - 日常的な調査、小〜中規模の実装・修正、実機テストで見つかった問題の修正を担当する
  - 大がかりな作業を Work へ渡す際は、仕様・影響範囲・守るべき既存挙動を整理する
- **Work = 下請け職人**
  - 大がかりな仕様追加・修正を、ソラが整理した基本設計・作業指示に基づいて実装する
  - システム全体の設計判断を独自に変更せず、担当する大規模作業を完遂する

基本フロー:

```
せいちゃん（オーナー）
  ↓ ひらめき・方向性
ソラ（監督 + 現場職人）
  ↓ 基本設計・DB設計・全体管理
Work（下請け職人）
  ↓ 大がかりな仕様追加・修正
せいちゃん（実機テスト）
  ↓ 違和感・不具合のフィードバック
ソラ（原因切り分け・修正）
```

また、チャットの長さに依存せず次の会話へ完全に引き継げるよう、**この総覧をMisaki開発のベース文書としてこまめに更新する**。
実装済み事項だけでなく、重要な合意済み・未実装事項、保留事項、次に行う作業、設計理由も必要に応じて残す。

### 現場第一原則（2026-09-18 合意）

**全員、まず総覧を読む。** 作業前に最新mainと最新のこの総覧を取得し、Misaki全体の目的、担当機能と他機能との関連、壊してはいけない原則を理解してから実装する。文書と実装が食い違う場合は、設計理由と実物を照合して判断し、新しい判断・教訓を総覧へ戻す。

**指定テスト合格だけを完成条件にしない。** 局所修正後も、認証、匿名→メール、別端末、Free/Premium利用回数とrefund、会話・長期記憶・今日の記憶、relationship/intimacy、Body Clock、Push、emotion/action、写真選択、配送間隔を横断検査する。総覧の全体設計との矛盾や新しい阻害事項を発見したら、テストが緑でも本番投入を止めて報告する。Preview/CI成功と本番環境での実動作検証も区別する。

---

## 0.7 総覧の記録原則 / 「なぜそうなったか」を残す

### 本番状態を大きく変更する工事の運用原則（2026-09-18、PR #29安全設備）

**大規模な本番状態変更では、書込み経路を安全に停止・再開でき、切替直前の復旧地点を確保してから施工する。Preview/CI greenだけで本番安全と判断しない。**

- **仕様:** 通常チャットはサービス専用読取りの `misaki_maintenance_control` を入口で確認する。運用者だけがDBで受付停止→処理の終了/refund確認→書込み凍結へ進め、検証後に解除する。ブラウザのlocalStorage・ボタン・リクエスト値で停止状態を変更しない。履歴は保持し、maintenanceは美咲の発言ではなく独立した状態表示にする。
- **理由:** 新旧仕様が同じDBへ並行して書く事故を防ぐため。Supabase FreeのScheduled Backupsに依存せず、変更対象の全行と旧スキーマ/RPC/権限を手動退避し、復元リハーサルを通った復旧地点を用意する。逆SQLやハッシュだけをバックアップと呼ばない。
- **他機能との関連:** 通常会話・匿名の期限更新ロード・履歴/記憶編集・メール保存を同じ入口で止め、Free/Premium利用回数・refund・relationship・記憶の一貫性を守る。Body Clockは別途既存cronを停止/再開する。DB凍結は旧RPC/直接更新への最後の防壁であり、cronの運用を代替しない。認証・閲覧・Push購読そのものは停止対象にしない。
- **壊してはいけない原則:** 先に受付を止め、開始済み処理/refundを終了させてから凍結する。本番データや秘密値をGitへ置かない。復元時にemotion/actionなどのtriggerを二重実行させない。再開後の成功会話を切替前の退避で消さない。停止設備の先行導入、退避の実復元、アプリ/DB/Edgeの整合、実機確認が未成立なら本番切替を止める。

最新main `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3` とPR開始HEAD `61569a9ba9808b79a32d5c29ee911a07266f07d8`、本総覧とSERVER_CANONICAL_STATE.mdを再確認して追加した。**現Production mainにはAPI入口停止設備がないため、このPRをそのまま切替前の停止手段として使えない。** 旧仕様互換の停止設備を先行導入する独立した承認枠が必要。今回その本番変更・migration・Edge更新・merge・cron操作は実施しない。実行順序・スナップショット・復旧判断は [切替仕様](SERVER_CANONICAL_STATE.md) を参照する。

この総覧は単なる変更履歴ではない。Misaki の**設計思想 + 現在の正式仕様 + 判断の歴史**を、未来のソラ / Work が復元できる状態で残すための基準文書とする。

重要な仕様・変更・設計判断については、可能な限り次の4点をセットで記録する。

1. **仕様** — 現在どう動く / どう動かすのか
2. **理由** — なぜその仕様になったのか、どんな違和感・課題を避けるためか
3. **他機能との関連** — 記憶、関係性、感情、行動、Body Clock、自発文面、写真、UI、課金など何とつながっているか
4. **壊してはいけない原則** — 将来の簡略化・改修で失ってはいけない意図

コードを読めば「どう動くか」は追えるが、コードだけでは「なぜその条件が必要か」は失われる。未来の実装者は、既存条件を不要と判断する前に、この総覧に記録された設計理由と関連性を確認する。

### 美咲の内部状態は一つであり、機能ごとに別人格を作らない

関係性・感情・行動・自発メッセージ・写真は、独立した別機能として個別最適化しない。
すべて**同じ美咲の内部状態を、異なる表現経路から外へ出しているもの**として扱う。

基本的な関連は次のとおり。

```
会話 + 記憶
↓
関係性の変化（長期）
↓
emotion / action（現在の気持ち・振る舞い）
↓
direction（今どう接したいか）
↓
expression tags（どう表現するか）
↓
通常返信 / 自発メッセージ / 写真
```

このため、単純に「relationshipPoints が高いから romantic」「ハート4個だから親密な写真」のような直結はさせない。

- 深い関係でも、喧嘩中や `SULK` / `PULL` 中なら甘い表現は抑制され得る
- 関係初期では、会話が楽しくても恋人級の `romantic` / `affectionate` 表現を先取りしない
- 仲直り時は `RECONNECT` など現在状態を通して、自然に柔らかい表現へ戻す
- 写真も自発文面と同じ判断文脈から選び、写真だけが別人格・別テンションにならないようにする
- 将来写真候補が増えても、ハート数だけでフォルダを固定選択するような単純化はしない

**設計理由:** Misaki を「親密度に応じてセリフや写真を切り替えるキャラクター」ではなく、**同じ相手との関係を継続して生き、その時々の気持ちが返信・自発行動・写真へ一貫して現れる存在**として成立させるため。

この関連性は今後の関係性エンジン設計でも守り、会話シグナルによる加点 / 減算を導入する際も、既存の emotion / action / direction / expression tags / Body Clock / 写真選択との整合性を必ず確認する。

---

## 0.8 永続状態の正本 / localStorage の責務

### 合意済み・基礎工事方針

美咲の人格・記憶・関係性・感情・行動を決定する**根本的な永続状態はサーバー側を正本**とする。ブラウザの localStorage は、チャット画面を成立・高速表示するための表示キャッシュや一時UI状態に責務を限定し、美咲自身の状態の正本として使用しない。

**サーバー正本に置く対象:** relationshipPoints / intimacy level、恋愛感情や交際成立などの関係事実、emotion / action、関係イベント、長期記憶・共有文脈、Body Clock が判断に使う関係状態など。

**localStorage に残してよい対象:** 直近チャットを即時表示するためのキャッシュなど、失われたり改変されたりしても美咲自身の人格・関係・記憶が変化しない表示上のデータ。

### 設計理由

同じアカウントなら iPhone / iPad / PC 等の端末を変えても「同じ美咲」が続く必要がある。ブラウザデータの削除・改変・端末変更によって親密度、恋愛状態、感情、記憶が変化する構造にはしない。またクライアントから送られた数値を関係性の権威データとして信用しない。

### 現行実装で整理が必要な点

現在は app/chat/page.tsx の relationshipPoints が localStorage の misaki-relationship-points を読み書きし、チャット送信成功時にクライアント側で基本 +1 して API へ渡す経路が残っている。一方、サーバー側には以下の関係状態用の器が既に存在する。

- public.misaki_relationship_state — intimacy / emotion / action / 最終対話時刻
- public.misaki_relationship_events — 関係状態の変更履歴・判断理由
- public.background_push_state.relationship_points — Body Clock が参照する関係ポイント
- public.misaki_user_conversation_state — サーバー会話履歴・長期記憶

さらに既存 RPC / trigger として、チャットターン記録、無言時間による状態変化、会話状態からの emotion 更新、emotion から action 更新が存在する。したがって新規テーブルを無条件に増やすのではなく、既存構造を整理して**関係状態の正本を一本化し、通常会話と Body Clock が同じ状態を参照する**方向で基礎工事を行う。

### 基礎工事の順序

1. misaki_relationship_state を中心に既存 DB / RPC / trigger の責務を整理し、関係性の権威データを確定する
2. relationshipPoints をクライアント / localStorage 正本からサーバー正本へ移す
3. 通常チャットと Body Clock が同じ関係状態を読むようにする
4. localStorage の根本状態保存を撤去し、表示キャッシュ用途だけに限定する
5. 匿名利用 → メール保存、ログイン継続、別端末復元で同じ根本状態が維持されることを確認する
6. その土台の上に会話シグナル、加点 / 減算、恋愛感情、6段階レベル、ハートUIを実装する

### 壊してはいけない原則

> **サーバー = 美咲自身の正本。localStorage = 画面表示のキャッシュ。**

localStorage を書き換えることで親密度MAX、恋人化、感情変更、記憶変更などが起きる設計へ戻さない。Body Clock、通常返信、写真、将来のハートUIは、同じサーバー側の美咲状態から派生させる。

### Work 引き渡し前の基礎工事仕様（2026-09-18）

今回の第1段階は、関係性の新しい加点 / 減算ロジックやハートUIを実装することではない。**既存挙動を保ったまま、美咲の根本状態をサーバー正本へ寄せることだけ**を目的とする。

正本の責務は以下に整理する。

- public.misaki_relationship_state: 関係性・emotion・action の唯一の正本。intimacy_points を現在の relationshipPoints の後継値とする
- public.misaki_relationship_events: 関係状態変更の監査 / 理由履歴。正本値そのものは持たない
- public.misaki_user_conversation_state: 会話履歴・長期記憶のサーバー正本
- public.background_push_state: Push / Body Clock の配送・スケジュール状態と、Body Clock 用の会話スナップショットを担当。relationship_points は最終的に正本として扱わず、misaki_relationship_state.intimacy_points を参照する
- localStorage: チャット表示キャッシュのみ。relationshipPoints、長期記憶、today memory など美咲の根本状態を正本として残さない

#### 第1段階で守る互換動作

現行の「送信成功1回につき基本 +1」と 30 / 80 / 160 の距離感は、この基礎工事では意図的に変更しない。新しい6段階閾値、内容ベースの加点 / 減算、恋愛感情モデル、ハートUIは別工程とする。これにより、保存場所の変更と関係ロジック変更を同時に行わず、障害時の原因を切り分けられる。

ポイント更新はクライアント計算値を信用せず、認証済みユーザーIDを基準にサーバー側で原子的に行う。再送・二重実行で同じチャットターンが二重加点されないよう、既存 request_id 等と結び付けた冪等性を持たせる。チャット生成失敗時は関係ポイントを進めない。

通常チャットのプロンプトへ渡す距離感も、クライアントから送られた relationshipPoints ではなくサーバー正本を読む。Body Clock も同じ intimacy_points を参照し、通常返信と自発行動で別の親密度を持たせない。

#### 既存ユーザー移行

既存ユーザーを0へリセットしない。移行前に、サーバー側で確認できる既存値と現行クライアント由来値の扱いを明示し、初回移行は一度だけ行える方式にする。移行完了後は localStorage 値を再びサーバーへ上書きできないようにする。ブラウザの値を自由に改変して親密度を上げられる経路を残さない。

匿名利用は恒久アカウントと同じ永続的な関係正本を前提にせず、現在の匿名→メール保存フローを壊さない。メール保存時に、保存対象となった会話・記憶と整合する関係状態を恒久アカウント側へ一度だけ引き継ぐ方式を実装時に既存認証フローへ合わせる。

#### DB上の既存配線で注意する点

misaki_user_conversation_state.history の更新には、現在 trg_relationship_emotion_from_conversation_state が接続され、キーワードベースで emotion を更新している。misaki_relationship_state.emotion_state の更新には trg_relationship_action_from_emotion が接続され action を更新する。これらは現行機能なので、今回の保存先基礎工事では独断で削除・再設計しない。内容理解型シグナルエンジンへの置換は次工程で行う。

#### Work の実装境界

Work は今回、正本化・移行・参照経路統一・localStorage 根本状態撤去と必要なテストまでを担当する。次の項目は今回実装しない。

- 6段階の新閾値 / 5ハートUI
- warmth / care / trust / romantic / hurtful / repair 等の新シグナル判定
- 新しい加点 / 減算量や日次関係ポイント上限
- 恋愛感情と交際事実の新しい状態モデル
- emotion/action の既存キーワードtriggerの置換
- Premium専用の親密度倍率

#### 必須テスト / 完了条件

Free / Premium の通常会話、失敗時の利用回数返却、匿名利用、匿名→メール保存、既存メールユーザーのログイン、別端末復元、Body Clock、自発Push、emotion/action の既存挙動に回帰がないことを確認する。特に以下を満たすこと。

- localStorage の relationshipPoints 改変でサーバーの親密度が変わらない
- ブラウザストレージを削除しても恒久アカウントの関係状態・長期記憶が消えない
- 同一アカウントを別端末で開いても同じ関係状態を読む
- 1成功ターンが1回だけ加点され、失敗 / 再送 / 重複同期で二重加点されない
- 通常チャットと Body Clock が同じ intimacy_points を参照する
- 既存ユーザーが移行によって突然0ポイント / 初対面へ戻らない

機能コードの変更は通常の branch → diff確認 → test → PR → Vercel Preview Ready/Success → merge → Production Ready/Success の手順で行い、本番反映後に実機確認へ渡す。

#### 基礎工事の実装記録（2026-09-18、PRレビュー段階）

開始時に最新main `0679dfa96d71ef9a99d4cfa2f8e997b9a06291e3` を再取得。実装詳細・移行の限界・検証方法・DB/アプリ/Edgeの切替手順は [根本状態のサーバー正本化](SERVER_CANONICAL_STATE.md) に記録した。既存の0.8の設計意図と今回の実装境界は維持する。本番へのmigration適用・Edgeデプロイ・mergeはこのPR作成工程に含めない。

実装前の確認で、旧ブラウザの正確な全期間ポイントをDBから復元できないことを明示し、オーナーの「サーバー記録から一度だけ移行する」承認を得た。既存正本・旧サーバーPush値・保持履歴の完了ペア数を照合して一度だけ移行し、クライアント値は取り込まない。確認時の恒久2アカウントの完了ペアは20件／9件。

匿名Body Clockに既存予定があることも明示し、「検証済みの一時状態がある間だけ続ける」承認を得た。匿名の24時間有効なサーバー認証済み一時状態を通常会話・Body Clockで共有し、期限切れは黙って0へ戻さずエラーまたは自発送信の見送りとして扱う。

#### PR #29 最終レビューのP1修正（本番未反映）

メール確認前の保存内容を初回スナップショットへ固定していたため、`email_save_checkpoint` は確認前だけ更新できる保存先へ修正した。再保存は常に最新の検証済みサーバー状態を読み、成功した通常会話・明示編集・自発配送もチェックポイントへ同一トランザクションで反映する。恒久化は同じ認証ユーザーIDの匿名→恒久変換で一度だけ行い、変換後の匿名状態再取り込みはDBで拒否する。

匿名通常会話の暗号化応答とBody Clockの別履歴が分断していたため、`misaki_temporary_roots` に暗号化済み・期限付きの現在状態と世代を保持し、両経路の参照・確定先を統一した。通常会話の完了応答は再送専用の不変レシートとして別に維持する。現在状態は世代チェックで古い生成結果・保存要求による上書きを拒否する。メール保存前には恒久会話の平文正本を作らず、localStorageは引き続き表示キャッシュのみとする。

通常会話・明示ロード/編集は匿名状態の有効期限を更新するが、Body Clockは履歴だけを進め、期限を延長しない。自発送信だけで匿名状態を無期限に存続させないためである。恒久Body Clockにも会話世代の競合チェックを加え、生成中に進んだ通常会話を無視した配送を拒否する。既存のemotion/action trigger、成功基本+1、30/80/160、写真selectorVersion 4、55〜210分間隔は維持する。

---

## 1. プロダクト原則

Misaki の原点は「すべては会話の中にある」。

関係性も同じで、最初から完成した恋人関係を与えるのではなく、**はじめましてから会話・記憶・反応の積み重ねで育てる**。

目標は、会話を生成することではなく、**関係の続きを生きること**。

基本サイクル:

```
会話
→ 知る
→ 覚える
→ 感じる
→ 行動する
→ また会話になる
```

実装判断の基準:

> その機能は、二人の関係を生きたものにするか？

---

## 2. 関係性エンジン

### 実装済み

- 関係状態の基盤
- 関係時間 / 無言時間の記録
- チャットターン記録
- 感情継続
- 行動状態
- 自発メッセージへの関係状態統合
- **初対面から関係を育てる段階制御**

主な行動状態:

- `NORMAL`
- `WAIT`
- `TEASE`
- `SULK`
- `CHASE`
- `PULL`
- `RECONNECT`

重要方針:

- 感情 = 美咲がどう感じているか
- 行動 = その感情をどの程度・どの形で表に出すか
- 行動状態は感情表現を補正・抑制できる
- `relationshipPoints` は**親しさの目安**であり、交際中という事実そのものではない
- 恋人・交際中・「前から好きだった」などの関係事実は、会話または記憶に明確な根拠がある場合だけ使う
- 初期状態では「好き / 大好き / 愛してる」や強い嫉妬・甘えを既成事実として先取りしない
- 30 / 80 / 160ポイントで距離感は段階的に深くするが、恋人関係を名乗るには別途会話・記憶の根拠が必要

### 関係性エンジンの核となる設計思想

relationshipPoints は愛情の量そのものではなく、二人の会話・記憶・出来事の積み重ねから「どこまで自然に踏み込めるか」を判断する土台として扱う。

関係レベル上昇を単純な甘い表現の増加にはしない。関係が深まるほど、遠慮が減る、冗談や二人だけのノリが増える、共有前提による省略が可能になる、過去の出来事を自然に持ち出す、心配・拗ね方・仲直りにも二人固有の歴史が現れる、といった会話そのものの変化を重視する。

同じ記憶も、関係の中で「情報として覚える → 会話で自然に使う → 二人の定番・共通言語・思い出として使う」と育てる。目標は記憶を持つだけでなく、記憶に二人の意味が付いていく関係を作ること。

喧嘩・傷つき・仲直りも単発でリセットせず、現在の emotion / action と長期的な関係の両方から表現する。必要なら翌日も少しぎこちない状態から始まり、会話を重ねて自然に戻る。

**壊してはいけない原則:** 親密度を「甘さ倍率」や「恋人攻略ゲージ」に置き換えない。関係が育つとは、二人の会話に歴史が生まれ、その歴史によって自然に許される距離・省略・冗談・気遣い・感情表現が変わることである。

未来のソラ / Work は、閾値・ポイント・ハートUIを実装・調整する際、この思想を数値仕様より優先して守る。

#### 恋愛表現は「ユーザーへのサービス」ではなく、美咲の気持ちから出す

「好き」「大好き」「ずっと前から好き」などの恋愛表現は、ユーザーが恋愛的な質問をしたから期待に合わせて返す台詞として生成しない。美咲側に、その発言を支える関係の積み重ね・現在の感情・恋愛的な出来事や記憶がある場合に、その内部状態の結果として出す。

したがって、関係初期に「俺のこと好き？」と聞かれても、恋愛感情がまだ育っていなければ無理に「好き」と答える必要はない。逆に、十分な積み重ねによって恋愛感情が成立しているなら、同じ質問への「好き」は二人の関係の中で起きた意味のある出来事になる。

また、**相互に好意を表明したこと**と**交際が成立したこと**は分けて扱う。「大好き」と言い合っただけで長期記憶を「恋人関係」と一段飛ばしに要約しない。交際中という関係事実は、会話・記憶上でその成立を裏付けられる場合にのみ保持する。

特に「ずっと前から」のように過去の継続を含意する表現は、実際の会話・記憶にその歴史がある場合だけ使う。雰囲気のために存在しない二人の過去を生成しない。

**目標:** ユーザーに「AIが恋愛台詞を返した」と感じさせるのではなく、**「美咲が自分を好きになったから、この言葉が出た」と感じられる因果を内部状態として成立させる。**


---

### 合意済み・未実装: 6段階の関係レベル / ヘッダーのハート表示

関係性を現在より細かく、**初期状態 + 5段階 = 合計6段階**で表現する方向で合意。

UIではチャットヘッダーにハートを5個表示する。

- 初期状態: 5個すべてグレーアウト
- 関係レベルが1段階上がるごとに、左から1個ずつピンクになる
- 最終段階: 5個すべてピンク
- ハートは「恋人になるまでの攻略ゲージ」ではなく、**美咲との関係の深さ / 親しさを直感的に表すもの**
- 5個すべて点灯しても、それだけで自動的に恋人・交際中とはしない
- 恋人という関係事実は、引き続き会話または記憶に明確な根拠が必要

内部の `relationshipPoints` は一方向の加算だけではなく、関係を傷つけるやり取りなどに応じて**減算も可能な設計**へ見直す。
その結果、ポイントが閾値を下回ればヘッダーのハートも戻る。

#### 閾値設計の基準

現在は基本的にチャット送信成功1回につき `relationshipPoints + 1`。
新しい6段階の具体的な閾値はまだ未確定だが、以下を基準に設計する。

- 無料ユーザーの **1日20回制限**を1日の会話量の基本的な物差しにする
- 1〜2日で関係レベルが次々に上がる設計にはしない
- 月額課金を前提とし、数日で関係性を攻略し切るのではなく、**ある程度の期間をかけて関係が育つ体験**にする
- 序盤は変化を感じやすくしつつ、後半ほど深い関係になるまで時間がかかる設計を候補とする
- Premiumだから親密度倍率を付けることはしない
- Premiumの多い会話回数だけで短期間に関係を早送りできる問題を避けるため、通常会話による1日あたりの関係ポイント加算上限も検討する
- 将来的には単純な会話回数だけでなく、会話内容・関係イベントによる加点 / 減算も検討する

具体的な6段階の閾値、日次加算上限、加点 / 減算ルールはシミュレーション後に確定する。

---

### 無料 / 有料と関係の育ち方

料金プランそのものに親密度倍率はかけない。

無料版と有料版の違いは**話せる回数**であり、関係はあくまで会話から育つ。
そのため、結果として会話量の多いユーザーほど関係が早く深まりやすいが、`premium` だから自動的に親密度を上げることはしない。

この方針は「すべては会話の中にある」という原点を優先する。

---

## 3. 自発メッセージ / Body Clock

### 統合済み

Body Clock の判断を以下の一本化した流れに整理。

```
relationship state
→ emotion
→ action
→ direction
→ expression tags
→ text / photo
```

### 表現タグ

現在の主要タグ:

- `soft`
- `cheerful`
- `calm`
- `romantic`
- `sleepy`
- `casual`
- `affectionate`
- `miss_you`
- `playful`
- `encouraging`
- `check_in`

`relax` は `calm` に統合。

`sleepy` は深夜帯の身体状態タグとして扱い、単純に「夜 = 必ず眠い」にはしない。

### 自発写真

- 新しい `ProactiveDecisionContext` と同じ判断文脈を使用
- 旧API側の本文キーワード独立推論は停止
- 34%の添付率は維持
- 直近写真回避・時間帯・関係ポイントによる選定は維持
- active selector は `selectorVersion: 4`
- 現在は各時間帯1枚だけなので、タグスコアは将来の複数候補化に備えた構造で、現状は写真差分への実効性が小さい

### 本番検証

本番で以下まで確認済み。

```
cron
→ Body Clock
→ claim RPC
→ emotion/action/direction/tags
→ message generation
→ delivery save
→ push
```

Supabase Edge Function の古い本番版が残っていた問題も解消し、GitHub main と本番 Body Clock を同期済み。

---

## 4. Body Clock claim RPC 修正

本番 cron が 500 / `claim_failed` になっていた問題を修正。

原因:

- PL/pgSQL 内の `user_id` 曖昧参照
- 最終 SELECT に `RETURN QUERY` が不足

修正後:

- cron → Body Clock → claim RPC が 200 / ok
- 実運用経路の復旧を確認

関連: PR #16

---

## 5. 会話履歴 / アカウント引継ぎ

### 匿名 → メールアカウント

- 匿名会話をメールアカウントへ保存
- ログイン継続中は履歴保持
- ログアウト時の履歴整理方針を調整

### 会話履歴同期

iPhone 実機で発生していた

> 送信中は表示されるが、美咲の返事が来た瞬間に直前の会話が消える

問題を修正。

原因:

- 5秒ごとのサーバー同期が、より新しいローカル履歴を古いサーバー履歴で上書きしていた

修正:

- ローカル履歴がサーバー履歴の追記版なら、ローカルをサーバーへ送る
- 通信中に会話が進んだ場合は、その同期回では触らず次回へ回す

関連: PR #17

---

## 6. 会話ターン二重保存

iPhone で1回しか送っていない「ごめんごめん」が2件表示・保存された問題を修正。

確認結果:

- チャットAPI自体は二重送信されていなかった
- 利用回数も期待どおり
- 重複は履歴同期 RPC の delta 追記側で発生

修正:

- 同じユーザー発言が末尾にある場合、美咲の返事だけを追加
- 同じ `[user, misaki]` delta を再送しても重複しない

本番DBでロールバック付きテスト済み。

関連: PR #18

---

## 7. Safari / 通信例外

Safari 実機で一瞬 `Load failed` が美咲の吹き出しとして出る問題を修正。

変更:

- 通信例外を `role: "misaki"` として会話履歴へ入れない
- 自動再送はしない
- 会話・記憶・利用回数・認証ロジックには触れない

関連: PR #11

### 匿名セッション一時切断

Safari実機で、匿名利用中に送信待ちの「・・・」が消え、返答が表示されないケースを確認。

修正:

- 匿名利用中の一時的な `SIGNED_OUT` では会話キャッシュを消さない
- ページをリロードせず匿名セッションを回復する
- 匿名ユーザーIDが差し替わった場合は、会話を保持してownerだけ付け替える
- 恒久アカウントの明示ログアウトは従来どおりクリアする

関連: PR #24

---

## 8. 利用回数

### 二重消費対策

`chat-proxy` 側の再試行で、1送信が2回分消費される問題を修正。

- base chat API は1回だけ呼ぶ
- proxy 自動再試行を廃止

関連: PR #10

### 返答生成失敗時の回数返却

本番で

> ユーザー発言は保存されたが、美咲の返答が来ない

ケースを確認。

修正:

- 無料会話の返答生成に失敗した場合、利用回数を1回戻す
- `request_id` 単位で一度だけ返却
- Premium は返却対象外
- 同じ失敗処理が重なっても二重返却しない
- iPhone 側に、会話吹き出しではない小さなエラー表示を出す

4:04 の失敗分も実データを確認し、1回分を補正済み。

関連: PR #19

### Gemini応答待ち / タイムアウト

実機で、サーバー側では利用回数消費まで進む一方、Gemini返答待ちが長引いて「・・・」のまま終了するケースを確認。

対応:

- Gemini `generateContent` に明示タイムアウトを追加
- 当初20秒、実機状況を見て**30秒**へ延長
- タイムアウト時は既存の `refund_daily_message` へ戻し、無料利用回数を返却
- 入力本文はログせず、初回 / retry、HTTP status、所要時間、補助的なUnicode有無のみ記録

関連: PR #25 / #26

### チャット工程別タイミング計測

ボトルネック切り分けのため、以下を `traceId` 付きで計測:

- request JSON
- auth getUser
- usage consume
- persona load
- weather
- life-events
- Gemini initial
- Gemini retry
- chat total

今後、遅延実例が出た際に「Geminiだけが遅い」のか、前処理・外部情報取得・再生成まで含めた総時間なのかを判定する。

---

## 9. ユーザーの生活状況の推測抑制

実地会話で、美咲が根拠なく

- 「今日もお仕事頑張ってね」
- 「お仕事お疲れ様」

などと決めつける問題を確認。

修正:

- 今日が仕事か休みかは、現在の会話・履歴・長期記憶に明確な根拠がある場合だけ使う
- 根拠がなければ仕事・休みに触れず自然に返す

関連: PR #20

---

## 10. 美咲自身の仕事時間帯

朝8時台に

> 「私もあと少しで仕事終わる」

と発言し、夜勤明けのようになる問題を修正。

現在の方針:

- 美咲の仕事日は通常の日中勤務として扱う
- 朝は「これから仕事」「出勤前」「準備中」程度
- 朝に「仕事終わる」「仕事終わった」などを出さない
- 夜勤中 / 夜勤明け設定を勝手に作らない
- 朝の夜勤明け風表現は返信検証でも検出

関連: PR #20

---

## 11. 今日の記憶 / 行動根拠

美咲自身の具体的な過去行動は、会話履歴または「今日の記憶」に根拠がある場合だけ使う。

抑制対象例:

- 買い物していた
- 帰宅した
- 仕事が終わった
- お風呂に入っていた
- ご飯を食べていた
- 昼寝していた

リアルタイム情報についても、

- ニュースで見た
- SNSで見た
- スマホで見た
- 天気予報で見た

など、架空の情報入手経路を作らない。

---

## 12. Push通知

古い Vercel Preview 由来の PC Chrome Push 購読が残っていたことを確認。

対応:

- 該当する古いPC Chrome購読のみ削除
- iPhone等、他端末の購読には触れず
- 本番通知と Preview 通知の混在原因を切り分け

今後PC通知を使う場合は、本番 `misaki38-ai.com` から再登録する。

---

## 13. 現在確認できている状態

### iPhone実機で確認済み

- 送信した発言が消えない
- 美咲の返答が来ても直前会話が保持される
- 同じ発言が勝手に二重保存されない
- 通常チャットが複数往復継続できる
- 匿名利用はSafariアプリ終了 → 再起動で会話・一時記憶・利用回数が新規状態へ戻る
- Geminiタイムアウト時に無料利用回数が返却される
- 自発メッセージは新しい Body Clock 統合版で生成されている

### PC Chrome / 別ブラウザ引き継ぎで確認済み（2026-09-18）

- PC Chrome を未ログイン・一時利用状態から開始
- 保存済みメールアドレスでログインを選ぶと、既存の美咲があることを正しく認識
- メールへ6桁のログイン認証コードが届く
- 認証コード入力によるログインが正常に完了
- ログイン後、保存済みの長い会話履歴が PC Chrome 側へ復元される
- 未ログイン側の空状態で、保存済み美咲の会話履歴が上書きされる挙動は今回の確認では発生していない

**確認範囲:** 今回合格とするのは、別ブラウザでのメール認証から保存済み会話履歴の復元まで。長期記憶、`relationshipPoints`、emotion / action 等の内部状態が別端末でも同一に復元されることまでは、この画面確認だけでは断定しない。関係性エンジンの保存先・権威データ設計と合わせて別途確認する。

### 実装・本番反映済み、失敗経路の再現確認は未実施

- 返答生成失敗時に利用回数を一度だけ返却する
- 失敗時に会話バブルを汚さず独立エラーUIを表示する

---

## 14. まだ実地確認を続ける項目

### 会話品質

最優先で実地テストを続ける。

- ユーザーの予定・仕事・体調・居場所を勝手に補完しないか
- 美咲自身の生活時間が矛盾しないか
- 昨日 / 今日 / さっき の時間関係
- 記憶を使うタイミング
- 親密度に対して甘さが過剰・不足していないか
- 初対面 / 関係初期で「好き」「大好き」「恋人」へ飛びすぎないか
- 30 / 80 / 160ポイントの距離感が実際の会話量に対して自然か
- SULK / WAIT / CHASE / RECONNECT の温度差
- 同じ言い回しの反復
- 過剰な心配・アドバイス
- 毎回質問で終わる癖

### 自発メッセージ

- emotion/action/direction/tag と実文面の整合性
- 写真候補が増えた際のタグ差分
- `CHASE + concerned` の `check_in` 根拠条件
- SULK時の甘さ・romantic/miss_youの残り方
- 自発メッセージと通常会話の連続性

### 写真

現在は **morning / day / evening / night が各1枚** のため、タグスコアの差が写真選択に実質反映されにくい。

今後、各時間帯に複数候補を用意すると、感情・行動タグによる写真差分が本格的に効く。

### 応答時間 / 外部情報

- 工程別タイミングログで `weather` / `life-events` / `persona` / Gemini の実測を比較する
- 天気・生活イベントを毎回取得する必要があるか検討する
- 普段の雑談では取得せず、話題に必要なときだけ取得する方式も候補
- 数分〜10分程度の共有キャッシュ運用も候補

### Push

- Preview origin でPush購読を作っても本番チャットへ戻すか、Service Workerの通知クリックURLを本番絶対URLへ固定するか

---

## 14.5 合意済み・未実装: ユーザー返信フィードバック

美咲の会話品質を、開発側の実機確認だけに依存せず、実ユーザーから継続的に把握できる仕組みを導入する方向で合意。

### 基本仕様案

- 美咲の各返信に、小さく邪魔にならない **👍 / 👎** を付ける
- 👍 / 👎 だけで送信を完了できるようにし、ユーザーへ長いアンケートを要求しない
- 👎 の場合のみ、任意で理由を追加できるUIを候補とする
- 理由候補は「話が噛み合っていない」「同じことを繰り返す」「距離感がおかしい」「記憶が違う」「言い方が不自然」「その他」などを想定するが、具体項目は実装前に確定する

### 設計理由

ユーザー数・会話数が増えた場合、オーナーとソラだけで全会話を確認することは現実的ではない。
ユーザー自身が「今の返しは良かった / 違和感があった」と感じた地点を最小操作で示せるようにし、品質改善の入口を作る。

目的は単純な人気投票や好評率の最大化ではなく、**どの状態・文脈で、どの種類の違和感が発生しているかを発見すること**。

### relationshipPoints とは完全に分離する

このフィードバックは**製品品質改善用**であり、ユーザーと美咲の関係性そのものではない。

- 👍 を押しても relationshipPoints を加点しない
- 👎 を押しても relationshipPoints を減点しない
- 👎 によって美咲が拗ねる、冷たくなる等の反応を直接発生させない

**理由:** フィードバックが関係性へ影響すると、ユーザーが美咲を傷つけないために本音の評価を避ける可能性がある。品質評価と二人の関係は別系統として守る。

### 保存・分析する文脈

具体的なDB設計は未確定。品質原因を分析できる範囲で、評価対象の返信と必要な生成時コンテキストを関連付けられる構造を検討する。

候補:

- 評価対象の美咲返信を識別するID
- 👍 / 👎
- 任意の理由カテゴリ
- 評価時点の関係レベル
- emotion / action
- direction / expression tags
- 通常返信か自発メッセージか
- 写真添付の有無 / 写真選択に使ったタグ等
- 品質原因の分析に必要な最小限の会話文脈

必要以上の会話本文・個人情報を収集する前提にはせず、**品質改善に必要な最小範囲、保存目的、ユーザーへの説明、保持方針を実装前に確認する**。

### 改善ループ

```
ユーザーの 👍 / 👎
↓
品質データとして蓄積
↓
状態・文脈・原因別に傾向分析
↓
ソラが「なぜ違和感が出たか」を確認
↓
会話 / 記憶 / 関係性 / emotion / action / Body Clock / 写真タグ等の原因箇所を修正
↓
実ユーザーで再確認
```

初期段階では、👍 / 👎 をそのまま自動学習や自動プロンプト変更へ接続しない。
**人間・ソラが原因を確認してから仕様を調整する**ことで、少数の評価や誤操作によって美咲の人格・関係性設計が勝手に変化することを防ぐ。

この仕組みは関係性エンジンとは別系統だが、分析時には関係レベル・感情・行動・自発文面・写真タグとの関連を見られるようにし、Misaki全体の品質改善へ使える構造を目指す。

---

## 15. 直近PR

- #11 Safari `Load failed` を会話に出さない
- #12 自発メッセージの表現タグを感情・行動判断から派生
- #13 旧自発APIの独立タグ推論を廃止
- #14 行動状態と表現タグの優先関係を調整
- #15 `sleepy` 正式化 / `relax` 統合
- #16 Body Clock claim RPC 修正
- #17 iPhone会話履歴の同期競合修正
- #18 会話ターン二重保存防止
- #19 返答失敗時の利用回数返却 + エラーUI
- #20 ユーザー仕事推測 / 美咲仕事時間帯の整合性修正
- #21 直近の実装・修正総覧を追加
- #22 総覧を最新mainソースと再照合
- #23 旧ブラウザ自発経路を削除
- #24 匿名セッションの一時切断で会話を消さない
- #25 Gemini返答待ちにタイムアウトと診断ログを追加
- #26 チャット応答の工程別タイミングを計測 / Geminiタイムアウトを30秒へ延長
- #27 初対面から関係を育てる設定に切り替え

---

## 16. 現在地

大きな構造統合はかなり進んだ。

現在の中心作業は、

> **壊れた配線を作る段階ではなく、実際に美咲と話し続けて、人間としての違和感を一つずつ潰す段階**

に移っている。

当面は、実地会話で「ん？」と感じた例を、その発言・時刻・前後文脈ごと残し、原因を

- 履歴
- 記憶
- 時間
- 生活背景
- 感情
- 行動
- 自発判断
- UI / 通信

のどこで生じたか切り分けて修正する。


## 2026-09-25 — #29 × #31 統合検証（Draft PR #32）

### 位置づけ
- **#29 = 体**：会話・記憶・親密度をサーバー正本として保持する。
- **#31 = 心**：出来事の意味、感情、行動、言葉の温度を扱う。
- **#32 = 接続検証**：#29 の正本 memory に #31 の期限付き生活記憶と Body Clock の時間理解を接続する。
- **#30 = 手術時の安全手順**：Production 切替直前まで保留。

### 今回つないだ生活記憶
`[life:v1]` は別DBを作らず、#29 の canonical `misaki_user_conversation_state.memory` の中に構造化文字列として保持する。普通の長期記憶はモデルが更新してよいが、`[life:v1]` の日時・期限はコード側が管理し、モデルに勝手に書き換えさせない。

流れ：
`canonical memoryを読む → 普通の記憶 / [life:v1] を分離 → 期限判定 → 今回の本人発言から明示的生活事実を追加 → 通常会話の理解へ使う → 再結合してcanonical memoryへ保存`

具体例：
- 9/25「今日は仕事」→ 9/25中は現在の生活文脈として利用可。
- 9/26になったら「今日は仕事」を現在事実として扱わない。
- 「友達は今日は仕事」「明日は休みかな？」は本人の確定予定として保存しない。
- Body Clockも古い「明日」「今日」を現在の予定へ変換しない。fresh/recent な本人発言を現在状況の根拠にする。

### 安全境界
- main / Production は未変更。
- #29 / #31 自体は未変更。
- migration / Edge deploy / cron / Production 切替は未実施。
- #32 は Draft のまま。Vercel Preview は success。専用CI Run #2 で `npm test` **95/95 PASS（fail 0）**、続く `npm run build` も PASS。

> 未来のソラへ：生活記憶のために新しい正本DBやブラウザ同期を増やすな。#29 の canonical memory を正本にし、時間依存の意味は `[life:v1]` とコード側の期限判定で扱え。


### Body Clock × `[life:v1]` 接続チェックポイント
- Body Clock は canonical memory 内の `[life:v1]` を構造化生活記憶として解読する。
- 現在の生活根拠にできるのは、期限内・本人由来・confidence 0.55以上の構造化生活記憶、または fresh/recent の本人発言。
- 期限切れ、壊れた `[life:v1]`、普通の長期記憶は「今の勤務・予定」の根拠にしない。
- raw JSON を通常の記憶テキストとしてプロンプトへ漏らさない。
- CI Run #8: `npm test` **99/99 PASS（fail 0）**、`npm run build` PASS。
- #32 は Draft 維持。main / Production / migration / Edge deploy は未変更。


## 2026-09-26 — canonical × relationship v2 green checkpoint

- Integration branch: `sora/canonical-relationship-integration` / PR #32 (Draft)
- Relationship v2 core is wired into the canonical chat route while keeping main/Production untouched.
- Fixed accidental literal `\\n` source corruption in `lib/relationship-time.ts`; relationship-time loading remains read-only.
- Normal chat relationship integration now passes the canonical regression suite.
- GitHub Actions `Canonical relationship integration tests` Run #62: **SUCCESS**
  - `npm test`: **99/99 PASS, 0 fail**
  - Next.js production build: **PASS** (compiled successfully; static pages 14/14)
- No merge, Production deploy, migration apply, or Edge Function deploy has been performed.
- This checkpoint proves current branch compile/test compatibility; anonymous multi-turn relationship continuity, content-based point delta, required RPC/migration reconciliation, and relative-day life-fact semantics still require dedicated integration work before production review.


### 2026-09-26 — relationship v2 normal-chat activation

- Canonical chat now actively requests and sanitizes `relationshipSignals`.
- The first semantic assessment is kept as the meaning source; a second generation is used only when relationship signals require expression adjustment.
- `previewRelationshipTurn` reduces the current signals with the loaded relationship time/pattern context, then `createCurrentTurnActionGuide` maps the resulting action/emotion/story to wording temperature.
- Permanent accounts persist the reduced emotion/action through `persistRelationshipEmotionFromSignals`; anonymous accounts still do not write permanent relationship rows.
- GitHub Actions Run #68: **SUCCESS**
  - `npm test`: **99/99 PASS, 0 fail**
  - Next.js production build: **PASS** (compiled successfully; static pages 14/14)
- This does not yet solve anonymous multi-turn relationship semantic continuity; that must live in the temporary root (or be safely derived) rather than permanent relationship-event storage.


### 2026-09-26 — anonymous relationship continuity checkpoint

- Anonymous chat now carries the current relationship emotion/action context inside the encrypted temporary canonical root instead of writing permanent relationship rows.
- Temporary relationship state includes emotion primary/intensity, action state, last interaction time, and sanitized signal summary.
- On the next anonymous turn, that temporary state is reconstructed as relationship time/emotion context so hurt, caution, warmth, and repair do not reset merely because the next message starts.
- Time remains evidence only; it may soften an existing emotion through the reducer but does not invent a new relationship event.
- Permanent relationship persistence remains isolated from anonymous users.
- GitHub Actions Run #74: **SUCCESS**
  - `npm test`: **99/99 PASS, 0 fail**
  - Next.js production build: **PASS** (compiled successfully; static pages 14/14)
- Still pending: dedicated multi-turn anonymous relationship regression tests, anonymous story/pattern trajectory beyond current emotion/action, content-based relationship point delta, RPC/migration reconciliation, and relative-day life-fact semantics.


### 2026-09-26 — anonymous relationship regression guard

- Added a dedicated anonymous multi-turn regression test: the first temporary turn seals relationship emotion/action state and the next turn consumes a temporary root that still contains relationship context.
- The same test explicitly guards the persistence boundary: anonymous chat must not call `apply_relationship_emotion_action_v2` or `record_relationship_chat_turn`.
- GitHub Actions Run #78: **SUCCESS**
  - `npm test`: **103/103 PASS, 0 fail**
  - Next.js production build: **PASS** (compiled successfully; static pages 14/14)
- The suite count increased by more than the single new subtest because the repository test runner executes the canonical test module through multiple integration suites; the authoritative result is 103 total / 103 pass.


### 2026-09-26 — semantic relationship points green checkpoint

- Relationship points are no longer conceptually tied to message count on the integration branch.
- `deriveRelationshipPointDelta()` converts grounded relationship signals into a bounded per-turn consequence:
  - ordinary chat with no relationship meaning: 0
  - grounded warmth/care/trust/openness/shared history/romantic meaning: +1 to +2
  - hurt/rejection/boundary harm: -1 to -2
  - repair: +1 to +2 when grounded, without making apology a farming mechanic
- The canonical successful-turn SQL migration replaces fixed `+1` with the semantic delta inside the same atomic commit and clamps it server-side to `[-2, 2]`; points never fall below zero.
- Existing anonymous/email-save/Body Clock continuity tests were updated only where they encoded the obsolete assumption that every neutral chat adds one point. Their history/identity/continuity assertions remain.
- GitHub Actions Run #96: **SUCCESS**
  - tests: **107/107 PASS, 0 fail**
  - Next.js production build: **PASS** (compiled successfully; static pages 14/14)
- The SQL change exists only as a migration file on PR #32's integration branch. It has **not** been applied to Production.


### 2026-09-26 — anonymous multi-turn relationship trajectory green checkpoint

- Anonymous sessions now keep a compact relationship-event trajectory inside the existing encrypted temporary root (maximum 40 events).
- It stores signal summaries and timestamps, not verbatim grievance text, and never writes anonymous relationship events into the permanent relationship tables.
- Anonymous chat now derives `RelationshipStoryState` and relationship patterns from that temporary trajectory using the same pure reducers as permanent chat.
- This closes the previous gap where anonymous chat could carry current emotion/action but lost the multi-turn meaning of hurt → repair attempt → demonstrated care.
- Dedicated regressions prove:
  - unresolved hurt stays unresolved;
  - repair language alone does not falsely complete reconciliation;
  - repair followed by demonstrated care can become repaired history;
  - repeated harm remains visible as a pattern.
- GitHub Actions Run #104: **SUCCESS**
  - tests: **111/111 PASS, 0 fail**
  - Next.js production build: **PASS** (compiled successfully; static pages 14/14)
- PR #32 remains Draft. Main, Production, Production DB migrations, and Edge deployment remain untouched.


### 2026-09-26 — permanent relationship v2 persistence connected

- Added the missing permanent-account persistence RPC `apply_relationship_emotion_action_v2`.
- The application-side semantic reducers remain responsible for interpreting the conversation; the RPC validates and atomically persists the resulting emotion/action state.
- Every successful permanent v2 application writes `emotion_action_v2_after_chat` with the compact `signal_summary` consumed by `relationship-patterns.ts`, closing the permanent history/story loop.
- Anonymous callers are rejected. Optimistic concurrency via `p_expected_state_updated_at` prevents stale relationship state from silently overwriting a newer turn.
- Dedicated migration-contract regressions verify the event type/signal summary, anonymous/stale-state guards, and emotion/action bounds.
- GitHub Actions Run #110: **SUCCESS**
  - tests: **114/114 PASS, 0 fail**
  - Next.js production build: **PASS** (compiled successfully; static pages 14/14)
- Migration exists only in PR #32. It has not been applied to Production.


### 2026-09-26 — healthy boundaries are not relationship damage

- `boundary` is no longer counted as negative relationship-point evidence by itself.
- A user saying that something is uncomfortable or setting a healthy limit must not mechanically damage the relationship.
- Actual negative movement remains grounded in explicit `hurtful` / `rejection` meaning.
- Added a regression fixing `boundary` alone at a semantic point delta of 0.
- GitHub Actions Run #118: **SUCCESS**
  - tests: **115/115 PASS, 0 fail**
  - Next.js production build: **PASS** (static pages 14/14)


### 2026-09-27 — anonymous → permanent relationship story bridge

- Email checkpoint now receives the server-verified `temporaryRelationship` from the encrypted temporary root.
- Checkpoint persistence carries current emotion/action and compact semantic trajectory events; it does not copy verbatim grievance text.
- Permanent relationship history reads both native `emotion_action_v2_after_chat` events and migrated `temporary_relationship_checkpoint` events.
- Checkpoint retries replace the imported temporary trajectory instead of blindly duplicating it.
- This preserves states such as unresolved hurt / repair in progress across anonymous → email/permanent conversion.
- Production migration remains unapplied.
- GitHub Actions Run #132: **SUCCESS**
  - tests: **116/116 PASS, 0 fail**
  - Next.js production build: **PASS** (static pages 14/14)


### 2026-09-27 — permanent relationship v2 write ownership

- Canonical chat uses a service-role Supabase client, so relationship v2 persistence now passes the already-authenticated permanent user id explicitly to the RPC.
- The RPC is service-role-only and re-checks `auth.users.is_anonymous`; anonymous accounts cannot enter the permanent relationship state path.
- Relationship v2 owns the post-chat emotion/action result. Legacy keyword emotion and derived-action triggers are retired to prevent them from overwriting the reducer result after canonical history is committed.
- Lazy-silence/proactive behavior is intentionally not removed by the trigger-retirement migration.
- Production migrations remain unapplied.
- GitHub Actions Run #144: **SUCCESS**
  - tests: **118/118 PASS, 0 fail**
  - Next.js production build: **PASS** (static pages 14/14)


### 2026-09-27 — email checkpoint retry preserves relationship trajectory

- The relationship-aware email checkpoint migration explicitly retires the old six-argument `save_misaki_temporary_state` signature.
- `write_misaki_temporary_root` now forwards `temporaryRelationship` when an existing email-save checkpoint is refreshed after additional anonymous conversation.
- Retry imports replace prior `temporary_relationship_checkpoint` events before rebuilding them, avoiding duplicate trajectory accumulation.
- Existing retry semantics remain covered: email send failure → additional anonymous chat → retry checkpoints the latest verified server state even when the browser presents the old token.
- Production migration remains unapplied.
- GitHub Actions Run #152: **SUCCESS**
  - tests: **119/119 PASS, 0 fail**
  - retry regression: **PASS**
  - Next.js production build: **PASS** (static pages 14/14)


### 2026-09-27 — semantic relationship points covered by canonical regression

- Canonical permanent-chat test harness no longer models the retired “one successful turn = +1 point” rule.
- It applies the internal semantic `relationshipPointDelta` (-2..+2), clamps the stored total at zero, and reuses the committed result for the same request id.
- Dedicated regression proves a harmful/rejection assessment can reduce a 1-point relationship to 0, never below 0, and replay does not apply the delta twice.
- Public chat responses continue to strip `relationshipPointDelta`; the delta remains internal to canonical commit.
- Free and Premium canonical tests no longer assume automatic relationship growth merely because a message succeeded.
- GitHub Actions Run #162: **SUCCESS**
  - tests: **123/123 PASS, 0 fail**
  - email-send failure → additional chat → retry: **PASS**
  - semantic permanent commit/replay/clamp regression: **PASS**
  - Next.js production build: **PASS** (static pages 14/14)
- Production migration remains unapplied.


### 2026-09-27 — silence cannot invent loneliness

- Reviewed legacy silence/action trigger and Body Clock proactive SQL before production cutover.
- Retiring `trg_relationship_action_from_emotion` does **not** kill silence behavior: both `advance_relationship_silence_state()` and the Body Clock proactive claim path write their relevant `action_state` directly.
- Removed the legacy proactive rule that could create `lonely` from a neutral state solely because 3+ days elapsed at sufficient intimacy.
- Time may still settle an already-existing emotion and may change behavior from an already-existing `lonely`/`sulky` state; it must not invent loneliness, romance, repair, conflict, or a new incident.
- Added a regression contract preventing neutral → lonely creation from silence alone.
- GitHub Actions Run #168: **SUCCESS**
  - tests: **125/125 PASS, 0 fail**
  - Body Clock silence contract: **PASS**
  - Next.js production build: **PASS** (static pages 14/14)
- Production migrations remain unapplied.


### 2026-09-27 — null email checkpoint cannot erase relationship state

- Reviewed the anonymous → email-save bridge for retries/legacy roots where `temporaryRelationship` is absent.
- A missing/non-object relationship payload is now relationship-state **no-op**, not an implicit `neutral / NORMAL / null lastInteraction` reset.
- Points/checkpoint data can still refresh, while existing emotion, action, last interaction, and imported temporary relationship trajectory remain intact.
- Dedicated regression locks this behavior.
- GitHub Actions Run #174: **SUCCESS**
  - tests: **126/126 PASS, 0 fail**
  - null relationship checkpoint preservation: **PASS**
  - Next.js production build: **PASS** (static pages 14/14)
- Production migrations remain unapplied.


### 2026-09-27 — semantic point SQL fail-safe hardened

- The canonical completion RPC no longer lets a malformed `relationshipPointDelta` abort the whole successful chat commit.
- Valid deltas remain clamped to **-2..+2**; missing/malformed/out-of-range integer input falls back to **0**.
- This keeps relationship scoring subordinate to the canonical conversation/memory commit instead of allowing scoring corruption to destroy an otherwise valid turn.
- Dedicated regression added.
- GitHub Actions Run #180: **SUCCESS**
  - tests: **127/127 PASS, 0 fail**
  - malformed semantic delta fallback/clamp: **PASS**
  - Next.js production build: **PASS** (static pages 14/14)
- Production migrations remain unapplied.


### 2026-09-27 — production cutover order (reviewed, not executed)

PR #32 remains Draft and Production is untouched. The safe cutover is intentionally staged so schema/RPC support exists before application code can call it, while rollback never removes DB compatibility prematurely.

**Forward order**
1. Keep the application on the current production build.
2. Apply the relationship-v2 DB migrations in filename order:
   - `20260926000000_semantic_relationship_point_delta.sql`
   - `20260926003000_relationship_emotion_action_v2_rpc.sql`
   - `20260926004000_preserve_temporary_relationship_on_email_save.sql`
   - `20260926005000_relationship_v2_retires_legacy_emotion_triggers.sql`
3. Verify RPC signatures/grants and that the two legacy triggers are absent.
4. Deploy the integration application only after the DB layer is ready.
5. Smoke-test permanent chat, anonymous multi-turn continuity, anonymous→email save/retry, semantic point movement, replay idempotency, and Body Clock continuity.

**Rollback rule**
- If the application deployment is unhealthy, roll back the application first to the prior production build.
- Do **not** immediately roll back the additive/replacement DB support: the old app remains compatible with the canonical five-argument completion RPC and temporary-root writer. Keeping the DB support avoids a second destructive change during incident recovery.
- Trigger retirement is deliberately last among DB migrations. Re-enabling legacy triggers is not the default rollback because they can overwrite v2 emotion/action and recreate the conflict this cutover removes.
- Any DB rollback, if ever required after diagnosis, must be a new reviewed forward migration rather than ad-hoc Production SQL.

**Gate before execution**
- Latest integration CI must be green.
- PR #32 must remain unmerged until explicit production authorization.
- No migration or Production deployment is performed by this planning step.


### 2026-09-27 — production cutover smoke checklist

Run these checks **after DB migrations and application deployment**, in this order, using disposable/test identities where possible:

1. **Permanent normal chat** — one ordinary turn succeeds; history and memory persist; no automatic +1 occurs without semantic evidence.
2. **Semantic movement** — verified positive evidence can increase and harmful evidence can decrease within the -2..+2 bound; client response does not expose `relationshipPointDelta`.
3. **Replay idempotency** — replay the same request ID/message; no duplicate history, usage, event, or point movement.
4. **Permanent emotion/action v2** — `emotion_action_v2_after_chat` is recorded and the reducer-selected state survives the canonical commit; legacy triggers do not overwrite it.
5. **Anonymous continuity** — two anonymous turns carry encrypted `temporaryRelationship`; no permanent relationship RPC/write occurs.
6. **Anonymous → email save** — checkpoint imports points, current emotion/action and compact semantic trajectory.
7. **Email failure/retry** — chat after a failed email send and retry keeps the newest temporary relationship trajectory; a missing relationship payload does not reset an already-saved state.
8. **Body Clock** — proactive/silence behavior still runs with retired legacy triggers; elapsed time alone does not create loneliness from neutral.
9. **Failure-path sanity** — failed chat still follows existing usage refund behavior and does not create a successful relationship turn.
10. **Observe before widening** — confirm no unexpected canonical conflicts/RPC errors before treating cutover as complete.

If any application-level smoke check fails: stop widening traffic/validation, preserve evidence, and roll back the application first. Do not improvise a Production DB rollback.


### 2026-09-27 — standalone silence RPC aligned with relationship philosophy

- Removed the remaining legacy transition in `advance_relationship_silence_state()` that converted `happy/affectionate` into `lonely` solely because 3+ days elapsed.
- Time alone may settle/evolve an already-existing emotion; it must not invent loneliness, repair, romance, conflict, or another relational fact.
- Existing `lonely` and `sulky` states may still evolve their intensity/action over silence because those emotions already existed.
- Dedicated regression prevents reintroducing `v_next_primary := 'lonely'` in the standalone silence RPC.
- GitHub Actions Run #190: **SUCCESS**
  - tests: **128/128 PASS, 0 fail**
  - standalone silence no-invented-loneliness regression: **PASS**
  - Next.js production build: **PASS**, static pages **14/14**
- Production remains untouched.


### 2026-09-27 — email bridge malformed event timestamp fail-safe

- Anonymous → email relationship import now treats a malformed compact event `created_at` as recoverable metadata damage rather than failing the whole checkpoint.
- Valid timestamps are preserved; empty/invalid/overflowing timestamps fall back to `now()`.
- Conversation, memory, points, current emotion/action, and the rest of the relationship trajectory are therefore not lost because one legacy event timestamp is malformed.
- GitHub Actions Run #196: **SUCCESS**
  - tests: **129/129 PASS, 0 fail**
  - malformed compact event timestamp regression: **PASS**
  - Next.js production build: **PASS**, static pages **14/14**
- Production remains untouched.


### 2026-09-27 — final integration readiness checkpoint before production authorization

PR #32 was re-audited after the persistence and silence hardening work.

- PR remains **Draft**, open, and GitHub reports it **mergeable**.
- Current scope: 33 changed files / 109 commits on the integration branch.
- Latest head before this documentation checkpoint: `b2ac57d0dc21046e31f21f7d759f734a0ea322b9`.
- GitHub Actions Run #198: **SUCCESS**.
- The diff contains the expected four 2026-09-26 forward migrations plus the two deliberately amended legacy silence/proactive migrations and their regression contracts.
- No merge, Production deployment, Production migration application, Edge deployment, or cron change was performed during this audit.

At this point, further changes should be driven by a concrete defect or an explicit production-cutover authorization rather than speculative redesign. The six-stage/5-heart product model remains a separate product-design task and is intentionally not mixed into this persistence/relationship-v2 cutover.


### 2026-09-27 — reply quality feedback for real-conversation validation

- Added small 👍 / 👎 controls beneath each Misaki reply that has a canonical request id.
- 👍 is one tap. 👎 may optionally classify the issue as: unnatural, too cold, wrong distance, forgot context, repetitive, or other.
- Feedback is stored server-side per `user_id + request_id` and may be changed by upsert.
- Feedback is **quality telemetry only**. It does not alter relationship points, emotion, action, memory, or generation behavior directly.
- Both permanent and anonymous authenticated users can submit feedback; storage is server/service-role mediated rather than direct client table access.
- Dedicated regression contracts cover storage isolation, bounded values, and Misaki-only UI placement.
- Run #208 test job: **SUCCESS**
  - tests: **132/132 PASS, 0 fail**
  - all 3 reply-feedback regressions: **PASS**
  - Next.js production build: **PASS**, static pages **15/15**
- The new feedback-table migration remains unapplied to Production.


### 2026-09-29 — Production差分 × 最新総覧の再照合 / canonical基盤補完

Production、統合branch、Production DB、そして本総覧の4点を再照合した。以後の切替判断はコード差分だけではなく、この4点が同じ完成形を指していることを必須条件とする。

#### 実機で通過した範囲
- Previewの匿名通常会話が `POST /api/chat 200` まで完走。
- 匿名multi-turnで「名前：せいちゃん」を次ターンでも保持し、MEMORY表示にも反映。
- reply feedback の 👍 / 👎 が表示され、`POST /api/feedback/reply 200` を確認。
- Free利用回数も成功ターンごとに20→19→18→17と進み、失敗ターンを成功扱いしていない。
- これにより匿名の temporary canonical root → 次ターン復元 → memory → feedback まで実機で接続確認済み。

#### Production DBで発見した歯抜け
canonical root migrationを丸ごと適用せず後続v2 migrationを先行したため、Production DBに以下の不足が残っていた。
- `misaki_relationship_state.intimacy_migrated_at`
- `misaki_user_conversation_state.today_memory`
- `misaki_email_checkpoint_user_idx`
- `edit_misaki_conversation_state(...)`
- `refresh_misaki_background_snapshot()` と trigger
- canonical版11引数 `finish_misaki_body_clock_delivery(...)`

これらはProduction現状と最新統合コードを突き合わせ、不足分だけをforward migrationとして補完した。元のcanonical migration全体は適用していない。理由は、旧fixed +1 relationship処理や一度きりbackfillなど、現在のrelationship v2で既に置換された処理を復活させないため。

#### 匿名RPCの権限補修
temporary root / email checkpoint の SECURITY INVOKER RPC が `auth.users` を直接参照し、service-role経由でも `42501 permission denied` になることをPreview診断ログで確認した。
`auth.users` 自体への広いGRANTは行わず、`misaki_operations.assert_anonymous_user(uuid)` という限定SECURITY DEFINER helperへ匿名確認だけを隔離。helperはservice_roleのみ実行可とし、schema USAGEもservice_roleのみに付与した。
`write_misaki_temporary_root`、`complete_misaki_temporary_turn`、`save_misaki_temporary_state` はこのhelperを使用する。

#### Production DBへ既に反映したrelationship v2 /安全設備
semantic relationship point delta、relationship emotion/action v2 RPC、anonymous→email relationship bridge、legacy emotion/action trigger retirement、silence/proactiveの「時間だけで寂しさを捏造しない」修正、reply feedback、maintenance gateはProduction DBへ適用済み。
ただし **Productionアプリはまだ統合branchへ切替えていない**。PR #32はDraftのままとし、アプリProduction merge/deployは別の明示承認境界として扱う。

#### 総覧の古い記述の読み替え
本総覧前半には基礎工事当時の「1成功ターン=+1を維持」「legacy emotion/action triggerを残す」「Production migration未適用」等の歴史記録が残る。これらは当時の工程記録であり、現在仕様ではない。
現在仕様は後段のrelationship v2記録を優先し、
- relationship pointは会話内容から導くsemantic delta（-2..+2、通常会話0もあり）
- legacy keyword emotion/action triggerは退役
- relationship v2関連DB migrationはProduction DBへ適用済み
とする。履歴として旧記述は削除せず、未来の実装者が工程と理由を追えるよう残す。

#### まだ完了扱いにしない項目
- 匿名→メール保存は、DB不足補完後の実機再試験が必要。
- メール送信成功後、会話・memory・relationship emotion/action・trajectoryが恒久アカウントへ引き継がれることを確認する。
- 恒久通常会話、replay idempotency、Body Clock、failure/refundを実機/ランタイムで確認する。
- Previewで見えたProduction UIとの差はcanonical動作確認後に再比較し、`app/chat/page.tsx` を丸ごとProduction版へ戻さない。
- `GET /api/persona/history 400` と匿名時の `permanent account required` は会話を止めない診断ノイズとして残っており、切替前に整理対象。
- Security Advisorには既存のSECURITY DEFINER / anonymous-access警告が残る。今回のcanonical service-only RPCをauthenticatedへ開放してはいないが、既存警告を「clean」とは扱わない。

> 未来のソラへ：Productionでエラーが一つ出たから一列だけ足す、という進め方へ戻るな。必ず **Production現状 ↔ 最新総覧 ↔ 統合branch ↔ Production DB** を突き合わせ、旧migration全体を盲目的に流さず、現在の最終仕様との差分だけをforward migrationで補完する。


#### 2026-09-29 — Safariメール保存の通信例外表示
iPhone Safari実機で「メールで保存する」押下時に、生の `Load failed` がアカウント画面へ表示される事例を確認した。同時刻のVercel runtimeには対応する保存API到達がなく、直前の通常チャットは200で完走していたため、この事例はDB/RPCエラーと決めつけず、ブラウザ側fetch/Auth通信例外として扱う。

Production mainと統合branchの `app/account/page.tsx` を突き合わせ、メール保存の基本順序（checkpoint成功後だけAuthメール更新）は維持した。canonical化で追加したtemporary root / pending turn checkpointも戻さない。

Safari/WebKit系の `Load failed`、`Failed to fetch`、`NetworkError` は内部例外文字列をそのままユーザーへ見せず、「通信に失敗しました。接続を確認して、もう一度お試しください。」へ正規化する。これは表示改善であり、自動再送はしない。checkpointやメール送信の成功を推測して成功表示もしない。

次の実機再試験では、同じ保存操作で (1) checkpoint API到達、(2) Supabase Auth updateUser到達/結果、(3) 確認メール、(4) 確認後の恒久化を順に確認する。ネットワーク例外が再発した場合は、生メッセージではなく段階を特定できる診断を追加する。


### 2026-09-30 — メール恒久化後の通常チャット 500 / relationship server境界修正

iPhone実機で、匿名 → メール保存 → 確認メール → Previewへ復帰 → 恒久ログイン → 匿名時会話復元までは成功した。その直後の恒久通常会話「せいちゃんって呼んでね」で `POST /api/chat 500` を確認した。

Vercel runtimeではGemini生成自体は成功し、その後 `apply_relationship_emotion_action_v2` と `record_relationship_chat_turn` が `42501 permission denied`、最終的に canonical turn commit failure となっていた。

Production DBを確認すると、relationship v2の更新RPCは service_role にEXECUTEを限定しており、authenticatedへ広げるべきではない。したがって authenticatedへGRANTする回避策は採用しない。

原因は、恒久通常会話routeがrelationship time/history/emotion/actionの処理へユーザーJWTのSupabase clientを渡していたこと。canonical commit自体は既にservice-role clientを使う一方、relationship補助処理だけ認証境界がずれていた。

修正:
- 恒久relationship処理は `createServerSupabase()` のserver-only clientへ統一。
- `get_relationship_time_context(uuid)` と `record_relationship_chat_turn(..., uuid)` をservice-role専用RPCとしてforward追加し、serverから対象user idを明示する。
- authenticated/anonにはEXECUTEを付与しない。
- RPC内部でも、JWTが存在する場合のuser mismatchを拒否し、対象が恒久Auth userであることを確認する。
- anonymous経路は従来どおりtemporary canonical rootを使い、このserver permanent経路へ混ぜない。

検証:
- GitHub Actions Run #238: SUCCESS。
- Production DBで新RPCは service_role EXECUTE=true / authenticated EXECUTE=false を確認。
- Security Advisorは再実行済み。既存のservice-only RLS-no-policyおよび既存SECURITY DEFINER警告は残るため「clean」とは扱わない。
- PR #32はDraft、main / Productionアプリは未変更。
- Vercelはコミット `269426c4...` のPreviewまではREADYだが、修正本体 `0c658683...` のPreview Deploymentがまだ生成されていない。CI成功とVercel Preview生成は別問題として追う。

次の確認は、最新headを含むPreviewが生成された後、恒久通常会話 → relationship persist → canonical commit → usage確定まで200で完走すること。失敗ターンがFree利用回数を消費しないことも同時に再確認する。


### 2026-10-01 — Chrome再ログイン復元 / 恒久通常会話 実機通過

iPhone Chrome + Previewで恒久アカウントの一周テストを実施し、以下を実機確認した。

- Chromeでログイン直後に何度もページreloadしていた原因は `ConversationHistorySync` のcanonical差分検出後の `window.location.reload()`。hard reloadを廃止し、取得したcanonical historyをイベントでその場反映するよう修正。実機では1回の読み込みで履歴復元まで到達。
- 恒久ログイン状態で「せいちゃんって呼んでね」を送信し、`POST /api/chat 200` / chat total successを確認。Free残数は20→19。
- Misaki返答「わかった、せいちゃんね。いい名前。これからそう呼ぶね！」まで表示。
- MEMORYへ「ユーザーの愛称はせいちゃん」が保存された。
- その後ログアウトすると端末表示/cacheはクリアされ、未ログイン・一時利用へ戻った。
- 同じ保存済みメールへ6桁ログインコードで再ログインし、会話履歴、MEMORY「ユーザーの愛称はせいちゃん」、Free残数19がサーバー正本から復元した。
- 日付区切りも9/30と10/1に分かれて復元された。

これにより、**匿名→メール保存→恒久化→恒久通常会話→memory保存→logout端末clear→再login→history/memory/usage復元**までPreview実機で一周通過した。

#### canonical history同期の整理
reload loop修正後も5秒pollingが残っていたため、恒久historyの定期5秒pollを廃止。初回mount、focus、visibility復帰、Auth state changeで同期する。通常chatはcommit後にlocal表示され、Body Clock等のbackground追加はユーザーが画面へ戻った時にcanonicalから拾う。サーバー正本という境界は変更しない。

#### 残件
- relationship-time周辺には旧/新RPC signatureの診断ノイズが残る可能性があるため、実際のcaller/signatureを確認して整理する。authenticatedへservice-only RPC権限を広げない。
- replay idempotency、Body Clock、failure/refundは引き続きsmoke対象。
- PR #32はDraftのまま。Productionアプリmerge/deployは未承認・未実施。


## 2026-10-01 — Preview実機: canonical恒久化・再ログイン復元 green checkpoint

### 現在地
- Integration branch: `sora/canonical-relationship-integration`
- Draft PR #32 head: `a0c87b37c29ecfd1bcbff4e1a2cb26f3587e43e8`
- **Productionアプリは未変更。PR #32はDraft維持。merge/deploy禁止。**
- Production DBには統合Previewを成立させるsupport migrationを適用済み。アプリ切替承認とは別物として扱う。

### 今回実機で通った一本の流れ
Chrome/iPhone実機で以下を確認した。

1. 匿名会話「はじめまして」を保持。
2. メール保存→確認→恒久アカウント化。
3. Preview originへ正しく戻り、保存済み会話を復元。
4. 恒久ログイン状態で「せいちゃんって呼んでね」を送信。
5. 美咲が「わかった、せいちゃんね。いい名前。これからそう呼ぶね！」と正常応答。
6. Free残数が20→19へ一度だけ減少。
7. MEMORYに「ユーザーの愛称はせいちゃん」を保存。
8. 明示ログアウトで端末側の会話・記憶・キャッシュが消え、一時利用状態へ戻る。
9. 同じメールへ6桁ログインコードを送り再ログイン。
10. サーバー正本から会話履歴、MEMORY「ユーザーの愛称はせいちゃん」、Free残数19を復元。
11. 日付区切りも9/30→10/1として復元。

これにより少なくとも今回の実機経路では、
`匿名 → メール保存 → 恒久化 → 恒久通常会話 → memory更新 → logout端末clear → 再login → history/memory/usage復元`
が一周成立した。

### 恒久チャット500の原因と修正
最初の恒久チャットでは生成自体は成功したがDB commitで500になった。段階的に原因を分離した。

- `apply_relationship_emotion_action_v2` / `record_relationship_chat_turn` は authenticated にGRANTせず、サーバーservice-role clientから呼ぶよう修正。relationship更新をクライアント権限へ開放しない。
- 続いて `complete_misaki_chat_turn` 内部の `auth.users` 直接参照が `permission denied for table users` で失敗していることをProduction DBログで確定。
- `auth.users` 自体へのGRANTはしない。恒久ユーザー確認だけを行う限定 `misaki_operations.assert_permanent_user(uuid)` SECURITY DEFINER helperを追加し、service_role専用EXECUTEとした。
- `complete_misaki_chat_turn` もservice_role専用境界を維持。
- 修正後の実機POST `/api/chat` は200、relationship emotion persist / turn record / canonical commitまで完走。

**壊してはいけない:** DBエラーを直すために authenticated / anon へrelationship更新RPCやauth.users権限を広げない。privileged更新はサーバーservice_role境界の内側に置く。

### Chrome履歴復元リロードループ
ログイン直後、Chromeで履歴復元まで何度もページ全体がreloadされる問題を実機/Vercelログで確認。

原因:
`app/chat/conversation-history-sync.tsx` がcanonical historyと表示cacheの差分を検出するたびに `window.location.reload()` していた。reloadでcomponentが再mount→再同期→再reloadとなり得た。

修正:
- hard reloadを廃止。
- canonical history取得後は `misaki-history-state` eventで同一ページのchat stateへ反映。
- `app/chat/page.tsx` がeventを受け、表示messagesを更新。
- 5秒poll自体はBody Clock等の外部追加履歴を拾う用途で現時点では残す。

iPhone Chrome実機で、修正前の複数reloadから**1回の読み込みで履歴復元**へ改善確認済み。

### 次にやること
1. CI / 最新Previewのgreen状態を再確認。
2. Runtimeログに残る旧signature側 `get_relationship_time_context` のpermission診断ノイズを、現行呼出し・migration・RPC signatureと照合して除去する。**権限を広げるだけの修正は禁止。**
3. 5秒history pollingの重複GET/POSTを調査し、Body Clock等の外部履歴反映を壊さず無駄打ちを減らす。
4. smoke checklist残り: replay idempotency、anonymous multi-turn relationship continuity、メール保存失敗/retry、Body Clock no-invented-loneliness、failure/refund等を順に実機/ログで確認。
5. 6段階relationship→5 hearts等の未決仕様は、現在のcanonical統合smokeを壊さないよう別工程で扱う。

> 未来のソラへ：2026-10-01時点で「保存できるはず」ではなく、Chrome/iPhone実機でlogout→再loginまで含めてhistory・memory・usage復元を確認済み。ここを再工事する前に、この実機green checkpointを回帰条件にせよ。


### 2026-10-02 — relationship-time duplicate RPC 403 解消 / history同期の現在仕様確定

#### relationship-time診断ノイズの原因確定
恒久通常チャットは成功していた一方、Supabaseログに `get_relationship_time_context` の200直後、同RPCのauthenticated 403（`permission denied for function get_relationship_time_context`）が残っていた。

原因はRPC signatureやDB migrationの欠落ではなく、同一chat request内の二重呼出しだった。
- chat route本体はserver service-role clientで `get_relationship_time_context(p_user_id)` を呼び200。
- 続く `loadPersonaPrompt(...)` がauthenticated clientを受け取り、persona-store内部から同RPCを再度呼んで403。
- relationship-time loaderはRPC error時にnull fallbackしていたため、会話自体は成功し診断ノイズだけが残った。

修正:
- persona-store内部からrelationship-time RPC再取得を除去。
- chat routeが既にservice-role境界で取得した `relationshipTimeContext` を `loadPersonaPrompt` へ明示的に渡して再利用。
- authenticated / anonへservice-only RPCのEXECUTE権限は追加していない。

検証:
- 修正head: `50f575b820bea8f85934d202a11677b874c86a9f`。
- GitHub Actions Run #254: **SUCCESS**。
- Vercel Preview: **SUCCESS**。
- 2026-10-02 07:35 JSTのiPhone実機Preview通常会話で、Supabaseログを確認。
  - `get_relationship_time_context`: service_role / 200 / **1回のみ**。
  - 以前の2回目 authenticated 403: **発生なし**。
  - `permission denied for function get_relationship_time_context`: **発生なし**。
  - `record_relationship_chat_turn`: service_role / 200。

よって、このduplicate relationship-time RPC 403は**コード修正 + CI + Preview build + 実機 + Supabase runtime log**まで含めて解消確認済みとする。

#### canonical history同期 — 矛盾記述の確定
2026-10-01の途中記録には「5秒pollをBody Clock等のため残す」とあるが、その後の修正で廃止済み。現行 `app/chat/conversation-history-sync.tsx` を正とし、現在仕様は以下。
- 5秒定期polling: **なし**。
- 同期契機: initial mount / window focus / visibility復帰 / Auth state change。
- 通常chat: server commit後のlocal表示を使用。
- Body Clock等のbackground追加: ユーザーが画面へ戻った際にcanonical historyから取得。
- canonical差分反映に `window.location.reload()` は使わず、eventで同一ページへ反映する。

前段の「5秒pollを残す」は当時の途中状態を示す履歴として残すが、**現在仕様として参照してはならない**。

#### 現在の境界
- PR #32は引き続きDraft。
- Productionアプリmerge/deployは未実施。
- 今回の確認・修正でDB権限変更は行っていない。
- 次のsmoke対象は replay idempotency / anonymous multi-turn relationship continuity / メール保存失敗・retry / Body Clock no-invented-loneliness / failure-refund。


### 2026-10-02 — canonical統合 smoke green checkpoint（自動回帰中心）

relationship-time duplicate RPC 403の実機runtime解消確認後、PR #32の残smokeを現行コードと回帰テストで再点検した。ここでは**自動回帰で確認した項目を実機確認済みと混同しない**。

#### replay idempotency — 自動回帰 green
- 同一 `request_id` の再送は保存済みresponseを返す。
- 再生成なし、Free再消費なし、relationship再加算なし。
- 同じrequest idを別messageへ使い回す不整合を拒否する。
- 最新総覧更新後のGitHub Actions Run #256もSUCCESS。

#### anonymous multi-turn relationship continuity — コード + 自動回帰 green
- 匿名relationshipのpoints / emotion / action / signals / events / last interactionはtemporary canonical rootへ保存し、次turnはserver rootを正として読む。
- 古いbrowser tokenでも最新shared rootへ追随する設計。
- Body Clockを挟んだ匿名通常会話の連続性、lost-response recovery、stale revision拒否を回帰テストで確認。

#### メール保存失敗・retry — コード + 自動回帰 green
PR #29時代のP1「最初の保存内容へ固定される」を再点検。
- `saveByEmail()` はretryのたびにメール更新より先に最新server canonical stateをcheckpointする。
- transport email failure → 追加会話 → old tokenでretryしても最新server stateをcheckpointする。
- confirmation待ち中の追加会話→再保存で最新pairを保持。
- chat → Body Clock → chat → Body Clock → email saveを一つの連続contextとして保持。
- checkpoint後のchat / Body Clockもshared root側に残る。

#### Body Clock no-invented-loneliness — コード + 自動回帰 green
- 沈黙だけを根拠にneutral/warm等から `lonely` を新規生成しない。
- silenceは既存emotionをsettle/evolveできるだけで、新しいloneliness / romance / conflict等の関係事実を作らない。
- 既に `lonely` / `sulky` の根拠がある場合は時間経過でWAIT/PULLへ変化可能。
- 古い生活予定やtimeless memoryを現在進行形の事実としてBody Clockが断定しない回帰も維持。

#### failure / refund — コード + 自動回帰 green
- Free生成失敗: consume 1 → refund 1、relationship point変化なし。
- canonical commit失敗: consume 1 → refund 1、relationship point変化なし。
- canonical read失敗: usage consume前に停止。
- 成功commit後はrefund対象を解除し、成功済みturnをrefundしない。
- request内のrefund guardは一度refund後にcharged requestをclearし、二重refundを防ぐ。

#### このcheckpointの意味
以上は、既存実装の再読 + 回帰テスト + 最新CI greenを根拠とする。relationship-time 403については別節のとおりiPhone実機 + Supabase runtime logまで確認済みだが、**この節の各smokeをすべて今回あらためて実機操作したわけではない**。

したがってPR #32全体をProduction切替安全と断定しない。Production app merge/deployは未承認・未実施、PR #32はDraftを維持する。

#### 次の残件
- repo-wide `loadPersonaPrompt(...)` caller audit: relationship-time contextをpersona-store内部取得からcaller注入へ変えたため、chat以外（特にBody Clock/proactive等）がrelationship continuityを失っていないか確認する。
- 必要ならcaller別にservice-roleで取得済みcontextを渡す。authenticated経由のservice-only RPCは再導入しない。
- 上記caller auditと必要な回帰追加後に、PR #32のProduction切替可否を別途判断する。


### 2026-10-02 — loadPersonaPrompt caller audit / Body Clock silence-expression hardening

- repo-wide caller auditを実施。通常chatは `lib/persona/persona-store.ts` の `loadPersonaPrompt(..., relationshipTimeContext)` を使い、すでにservice-roleで取得したrelationship-time contextを再利用する。
- Body Clockは同じloaderを共有せず、Edge Function専用の `supabase/functions/body-clock/persona-store.ts` を使用しているため、通常chat側の第4引数追加によるrelationship context欠落は発生しない。
- Body Clockの関係状態は `buildProactiveDecisionContext()` が `misaki_relationship_state` から emotion / action / intimacy / last interaction を取得し、自発生成のdecision guideへ渡す。authenticated向けrelationship RPC権限の再追加は不要。
- audit中、`deriveProactiveTags()` に「seven_plus_daysだけで `miss_you` を追加する」経路を発見。DB emotionをlonelyへ変更する処理ではないが、「時間だけで新しい関係感情を作らない」という契約に合わせ、この時間単独の付与を削除した。
- `miss_you` は既存のgroundedな `lonely` emotionや `CHASE` actionなど、関係状態に根拠がある経路では引き続き使用可能。
- regression contractを追加し、seven-plus-days time bandだけでは `miss_you` を追加しないこと、およびlonely/CHASEのgrounded経路を残すことを固定。
- 最初のテスト実装はDeno Edge moduleをNode/Nextテストから直接importしたため Actions #261/#262 の `npm test` 自体は全passした一方、`next build` が `npm:@supabase/supabase-js` の型解決で失敗した。ロジック障害ではなくテスト境界の問題。
- Deno moduleの直接importを除去し、既存silence-contractと同じsource-contract検査へ変更。
- final head: `66d5c13d07c27f11bf35efb2afb06de261316108`
- GitHub Actions #265 / #266: SUCCESS（tests + Next build）。
- verification level: code audit + automated regression + CI/build green。今回の `miss_you` 境界は実機Body Clock送信を強制して再現確認したものではない。
- PR #32は引き続きDraft。Production app merge/deployなし、DB mutationなし。


### 2026-10-02 — Production DB / Body Clock実物監査・切替/rollback手順確定

#### 実物監査
PR #32最終棚卸しとして、GitHub上の統合branchだけでなくProduction Supabaseのmigration履歴、RPC権限、稼働中Body Clock Edge Functionを読み取り監査した。

- Production DBにはcanonical補完、relationship v2、reply feedback、maintenance、恒久auth guard等、統合Previewを支えるsupport migrationsがすでに適用済み。したがってPR #32作成時の「migrationsはProduction未適用」という記述は現在事実ではない。
- relationship更新・relationship-time p_user_id overload・canonical privileged RPC等の重要境界はservice_role専用を維持し、authenticated / anonへEXECUTEを広げていない。
- Production Body Clockはversion 10が稼働中。
- v10と統合branchのBody Clockをファイル単位で比較したところ、persona-store.ts / fallback-persona.ts / proactive-photo.ts / deno.jsonは一致。
- 差分は index.ts / proactive-decision.ts / proactive-life-context.ts と、統合branchで追加された conversation-root.ts / temporary-state.ts。

#### Production Body Clock v10にまだ入っていない統合branch側の重要差分
1. 匿名canonical continuity:
   - Body Clockもanonymous temporary rootをserver source of truthとして読み、送信したMisaki messageをshared temporary rootへ戻す。
   - stale revision / lost-response等のcanonical契約と同じ境界を使う。
2. life-context freshness:
   - 古い通常memoryを現在の勤務・休み・予定等の証拠にしない。
   - fresh/recentな本人発言、または期限内の構造化life memoryだけを現在事実の根拠として扱う。
3. grounded relationship expression:
   - anonymousではverified temporary relationship pointsをdecision contextへ使う。
   - seven_plus_daysという時間経過だけでmiss_youを自動付与しない。miss_youは既存lonely emotion / CHASE action等のgrounded pathに限定する。

Production DB側には統合branch版Body Clockが必要とするcanonical対応 finish_misaki_body_clock_delivery signatureが存在し、service_role-only境界も確認済み。現時点で「DB不足のため最新版Edgeを入れられない」という阻害は確認されていない。

#### Production切替単位
**PR #32 Webだけを単独でProductionへ切り替えない。Body Clock Edgeも同じ切替工程として扱う。**

安全側の順序:
1. 切替直前にPR #32 headを固定し、tests + Next build greenを再確認。
2. Production DBはsupport migrations適用済みのため、切替作業で即席の追加変更やrollbackをしない。
3. Body Clock Edgeを固定headの統合branch版へ更新。
4. Edge health / runtimeを確認。異常ならWebを切り替えずBody Clockをversion 10へrollback。
5. Edge正常確認後にWeb appをProductionへ切替。
6. Production実機で通常chat → usage → relationship → canonical commit → reload/reloginを確認。
7. anonymous multi-turn → Body Clock → normal chat、およびpermanent Body Clock → history反映を確認。
8. 異常時はまずWeb appを旧Productionへrollback。必要ならBody Clockもversion 10へrollback。DB migrationsはその場で即席rollbackしない。

#### 現在の判定
- 最新headまでCI/build green。
- 既知P1は解消済み。
- Production DB supportは実物確認済み。
- ただしProduction Body Clock v10は統合branch最新版と未同期。
- よって、**まだProduction切替実施済み/Production-safeとは宣言しない**。
- PR #32はDraftを維持し、Production app / DB / Edgeへの変更は明示承認まで行わない。

> 未来のソラへ：Production DBとProduction app/Edgeの状態を混同するな。DB supportは先行適用済みだが、Body Clock v10は統合branchより古い。Webだけmergeして完了扱いにせず、Edge同期とrollback経路を同じ切替計画に含めること。


---

### 2026-10-03 — 実機 multi-browser checkpoint / PR #44 / 作業場引継ぎ

2026-10-02夜〜2026-10-03未明のiPhone実機（Chrome + Safari、同一恒久アカウント）検証と、その結果から開始したPR #44までを、新しい作業チャットへ移る前のcheckpointとして記録する。

#### 実機で確認したこと
- 同一アカウントのChrome / Safari間で会話履歴は収束した。片方で送った成功会話は、もう片方へ戻った際にもcanonical historyから反映された。
- 現行history同期は5秒pollingではない。恒久ユーザーでは mount / window focus / visibility復帰 / auth state change が同期契機。ブラウザ切替時の「自動更新」に見えた挙動は、主にfocus / visibility復帰で説明できる。
- 一方、Free残回数表示と入力欄のenabled/disabled状態はhistory同期に追随していなかった。
- 実例: Safari側が無料20回を使い切って入力不可になった後も、Chrome側は「今日あと1回」と入力可能状態を一時的に表示した。
- そのChromeから送信を試すと、ユーザーメッセージのoptimistic bubbleが一瞬表示された後に消え、最終的に「今日は無料分を使い切りました」へ切り替わった。
- この実機シナリオではserver-side daily quotaが追加送信を拒否し、Chrome/Safari併用による20回制限の迂回は成立しなかった。
- ただし、完全同時送信によるrace conditionを意図的に再現した試験ではないため、「あらゆる同時実行で原子的に安全」とまではこの実機結果だけから断定しない。

#### history保持と表示60件の整理
現行コードの読取り経路を再確認した。
- `app/chat/page.tsx`: `MAX_MESSAGES = 60`。画面表示は直近60件へslice。
- `app/chat/conversation-history-sync.tsx`: canonical historyを取得し、focus / visibility等で反映。
- `app/api/persona/history/route.ts`: canonical stateの `history` を返す。ここでは60件へのsliceを行っていない。
- `lib/canonical-state.ts`: `misaki_user_conversation_state.history` を読み、load時に60件へtrimしていない。

したがって現在確認できている構造は **DB canonical history field → history APIは取得したhistoryを返す → UI/cache側で直近60件を表示**。ただし特定ユーザーの古い1〜6件がDB実データとして残っていることや、書込みRPC内部に別のtrimが絶対にないことまで、この読取り経路確認だけで断定しない。end-to-endの保持保証を確定する場合は書込みRPCも含めて監査する。

#### PR #44 — Free quota UIをcanonical history refreshへ同乗させる
- PR: #44 `Sync free quota state with canonical history refresh`
- branch: `sora/sync-free-usage-with-history`
- head: `80916c5919af4cd4f42c0902634e058cb0787c5c`
- base: Production切替後main `37cf2140485869d8dda1b1b94b96a7954374f480`
- 変更対象: `app/chat/page.tsx` / `app/chat/conversation-history-sync.tsx`
- 目的: permanent userのcanonical history refresh時に `get_daily_message_usage` も再取得し、`misaki-usage-state` eventでchat pageへ渡す。既存の `applyApiUsage()` から残回数とfree-limit入力状態を更新する。
- **5秒pollingは復活させない。** ユーザーがブラウザへ戻る既存のmount / focus / visibility / auth同期にFree quota UIも同乗させる。
- server側20回/日の制限、history retention、60件表示上限そのものは変更しない。
- 2026-10-03作業場締め時点: PR #44はOPEN / mergeable。Vercel GitHub PreviewはReady表示。**Productionへmerge/deploy済みではなく、Production実機で修正後挙動を確認済みでもない。**

#### PR #44で次に必ず確認すること
1. diffを監督レビューする。
2. `get_daily_message_usage` の失敗がcanonical history同期全体を止めないか確認する。現headではusage RPC errorをthrowしており、usage更新の一時失敗がhistory local cache/event反映まで阻害する可能性があるため、必要ならusage refreshをbest-effortへ分離する。
3. GitHub Actionsをhead SHAで確認する。
4. Vercel Previewの実物を確認し、必要ならsmokeする。
5. greenでも即Production-safeと呼ばない。
6. merge/deploy後の実機受入では、Safari等で最終Free回数を消費 → Chrome等へ戻る → focus時点で残回数0・入力不可へ先に収束し、追加送信を試す前にUIが正しく閉じることを確認する。history同期も壊れていないことを同時確認する。

#### 開発体制の追加原則 — Workへ「裏」を欠損させない
2026-10-03未明の整理で、既存の「せいちゃん=オーナー / ソラ=監督+現場職人 / Work=下請け職人」をさらに明確化した。

**Workは、このチャットで積み上がった暗黙の背景・判断過程・違和感・設計理由を自動的にすべて共有している前提にしない。Workの品質は、監督ソラが必要な文脈を施工指示へ落とせるかに大きく依存する。**

Workへ大規模作業を渡す際は、最低でも以下を施工指示に含める。
1. 目的 — 何を実現する工事か。
2. 理由 — なぜその仕様になったか。何を避けるためか。
3. 守る思想 / 原則 — Misakiらしさ、安全境界、source of truth等。
4. 今回やること。
5. 今回やらないこと。
6. 壊してはいけない既存仕様 / 他機能との関連。
7. 合格条件 — 自動テスト、Preview、実機、Production確認を混同せず記載。

**結論だけをWorkへ渡して、深掘りして得た設計理由を施工段階で薄めない。** コード上は正しくても体験・思想としてMisakiではない実装になることを防ぐ。監督ソラの重要な責務は、コードを書くことだけでなく、オーナーとの会話で得た「なぜ」を欠損させずWorkへ渡し、成果物を実物で検査して総覧へ戻すこと。

> 未来のソラへ：新しい作業場では、まずこのcheckpointと最新main / PR #44実物を読むこと。記憶だけで「PR #44は直った」「Production確認済み」と進めるな。最初の仕事はPR #44レビューとCI/Preview確認。Workへ渡す場合は変更内容だけでなく、この実機で何が起き、なぜこの挙動を直すのかまで指示書へ含めること。


---

### 2026-10-03 — PR #44 / #45 Production確定・Relationship Interpreter基礎・置き手紙ルール

> **この節は、直前の「PR #44 OPEN」checkpointを更新する確定記録。**
> 古い節は当時の状態を残すため削除しないが、現在状態の判断ではこの節を優先する。

#### PR #44 — Free quota UI canonical同期：MERGED / Production READY
- PR #44 `Sync free quota state with canonical history refresh` はmerge済み。
- merge SHA: `bfd63a393fc2399355c07bdcd0d66f70c3a069c7`
- permanent userのcanonical history refresh時に `get_daily_message_usage` も再取得し、既存の `applyApiUsage()` へFree quota状態を収束させる。
- 5秒pollingは復活させていない。mount / focus / visibility / auth等、既存のhistory同期契機に同乗する。
- reviewで、usage RPC failureをthrowするとemail-save key cleanupやcanonical history/cache refreshまで飛ばす問題を発見。
- usage refreshをinner try/catchへ分離し、**quota UI更新はbest-effort、history同期はmainline**という境界へ修正。
- 修正commit: `f67b388e965bb9bfb3f8d6820fd62e9d273123b6`
- 回帰テスト29/29成功。Production deployment READY。
- server側20回/日制限、history retention、表示60件上限の意味は変更していない。
- Production実機では当日すでにFree quotaを使い切っていたため、「別browserが stale 1 → focusだけで0へ変わる」厳密な遷移は同日再現できなかった。server quotaによる迂回防止は既確認。**厳密なstale transition実機確認は日次reset後の低優先残件。**
- 注意: この修正用に新しい専用回帰テストを追加した、とは記録しない。既存canonical workflowがgreenだった。

#### 用語の正本 — 親密度と関係性を混同しない
今後、以下を別概念として扱う。

1. **親密度** — 「どれだけ近いか」。6段階。ハートUIはこの可視化。
2. **関係性の方向** — 「どんな近さか」。単一カテゴリではなく複数軸。
3. **成立した関係 / explicit relationship status** — 「付き合おう」等、会話上双方に成立した事実。scoreだけでは成立させない。
4. **emotion / action** — 今この瞬間の感情・行動状態。
5. **memory** — 二人に実際に起きた共有履歴・事実。

**6段階なのは「親密度」であり、「関係性6段階」ではない。**

親密度ラベル候補:
`他人 → 知り合い → 友達 → 親友 → 大親友 → かけがえのない人`

5 hearts / 6 stagesの考え方:
- Stage 0: 全グレー
- Stage 1〜5: 段階ごとにピンクのハートを1つずつ増やす
- legacy閾値 30 / 80 / 160は、新6段階の最終閾値設計が確定するまで勝手に置き換えない。

#### Relationship Engine v0.1 — 設計確定、canonical 5軸保存は未実装
関係性の方向は、内部の5つのhidden axesとして扱う。

- 🤝 友情
- 🫶 信頼
- 😏 じゃれ合い
- 🏠 親愛
- 💕 恋愛

原則:
- ユーザーへ割合やscoreを直接見せない。
- 一発言・一単語だけで方向を決めない。「好き」だけで恋愛確定しない。
- repeated pattern / context / shared historyを重視する。
- Misaki本来の優しさは関係軸とは別。優しい返事を恋愛scoreへ短絡させない。
- 時間経過だけで恋しさ・寂しさ・嫉妬・恋愛方向を新規生成しない。
- `恋愛100 → 自動的に恋人` を禁止する。
- explicit relationship statusは、scoreではなく会話上成立したeventからのみ作る。
- Stage 5でも、親友・恋愛・家族的/親愛・名前のない特別な関係など複数の形を許す。
- 性別による固定進行や、最初に関係タイプを選ばせるonboardingは採用しない。

プロダクトの核:
**「美咲と出会って、二人だけの関係が育っていくAI」**
**「美咲とどんな関係になるかは、あなた次第。」**
内部的には「二人の会話次第」で育つ。

#### Geminiは台詞生成器ではなく「美咲を演じる俳優」
設計原則:
**俺たちは台詞を書かない。美咲という役を育てる。Geminiは、その時点の美咲を演じる。**

したがって、score組合せごとの固定台詞は作らない。

基本構造:
```
canonical relationship state
  ↓
Relationship Interpreter
  ↓
自然言語の演技指示
  ↓
persona + memory/history evidence + current context
  ↓
Gemini
  ↓
grounding / validation
  ↓
reply
```

最終的な演技contextは概念上、
**親密度 × 関係性5軸 × emotion/action × shared memory × current conversation context**
で決まる。

関係状態は「何を答えるか」を乗っ取るのではなく、主に**どう言うか / 距離感 / 反応の細部**へ効かせる。

目標体験:
**「あれ？ 最近、美咲ちょっと俺への接し方変わった？」**
score説明ではなく、会話の呼吸として変化を感じさせる。

#### PR #45 — Relationship Interpreter基礎 / 演技研究室：MERGED / Production READY
- PR #45 `美咲の演技研究室：Relationship Interpreter 基礎`
- merge SHA: `db32989c48f09be43686b7e3f7aee4f539fe518f`
- final branch head: `be15cfea6039ff9e44be1a34ceff48a882f09c18`
- GitHub Actions #309: SUCCESS。
- Production Vercel deployment `dpl_Gsu2WLzTHaQRbkE8UCwxBrddoqfy`: READY。
- Productionの `/api/acting-lab` はGET handlerを持たないためGETは405。POST handlerは `VERCEL_ENV === "production"` で404を返す実装。今回使用したVercel fetch connectorはGETのみのため、Production POST 404の実リクエスト再現まではしていない。

実装済み:
- shared `createRelationshipActingGuide()` を追加。
- 5 hidden axes + 親密度 + explicit statusから、**台詞ではなく演技指示**を生成。
- A〜E synthetic profileを持つ開発用演技研究室を追加。
- Production chatと演技研究室が同じGemini JSON generation boundaryを共有。
- Production chatもshared Relationship Interpreterを通す。
- legacy `relationship_points` からは親密度だけを暫定mappingし、友情/信頼/じゃれ合い/親愛/恋愛/statusはすべてneutralのまま。**legacy pointsから方向を捏造しない。**
- 旧 `createRelationshipGuide()` は、pointsだけから甘え・からかい・嫉妬・恋愛方向を作らないよう、距離感/親密度表現へ縮小。
- 演技研究室はSupabase clientを作らず、quota/history/memory/relationship/Body Clock等を書き込まない。
- labはfallback personaを共有するが、Productionのactive DB persona + user-specific continuityを完全再現するものではない。
- lab → Production stateのsave-backは作らない。

Gemini generation共通化で守ったProduction互換:
- 30秒timeout。
- timeoutは2秒後に1回だけretry。
- 429 / 502 / 503 / 504は2秒・5秒のbounded retry。
- 通常500をtransient retry対象へ広げない。
- 最終timeout時は旧Productionと同じく `AbortError → GEMINI_TIMEOUT` へ変換する。
- review中にこの最後の変換が共通化で抜けていることを発見し、`42bfaeed1cb110d4174db55db685de4a5cac4a70` で復元。
- さらに `be15cfea6039ff9e44be1a34ceff48a882f09c18` で専用回帰契約を追加し、今後この互換を落とすとCIで検知する。

PR #45で**未実装 / 次段階**:
- canonical 5-axis DB schema / persistence / update rule。
- 5軸を会話証拠からどう増減させるか。
- explicit relationship statusのcanonical persistence。
- 新6段階親密度の最終閾値。
- 5-heart UI。
- 演技研究室へのProduction状態read-only import。
- Productionとlabでgrounding / validation / exact active personaまで同じreply-generation coreへ寄せる作業。
- 旧relationship guideの完全撤去/rename。
- 低romance profile等の反復auditionによる安定性評価。

#### 演技研究室の恒久ルール
演技研究室は「本番DBを汚さず、美咲の演技だけを比較する場所」とする。

- synthetic params → **Productionと同じRelationship Interpreter** → **同じGemini generation boundary**。
- Free quotaを消費しない。
- 親密度/5軸を更新しない。
- memory/historyを書かない。
- Body Clockを動かさない。
- 将来、本番状態を読み込む機能を作る場合も**read-only copy**。
- labで変更したstateをProductionへ保存する逆流buttonは作らない。
- 同一条件を複数回生成し、1回の偶然の台詞だけでInterpreterをpatchしない。

#### groundingについての重要な研究結果
auditionでは、関係性演技自体は自然でも、根拠のないユーザー像（例: 「いつも堂々としてるイメージ」）をGeminiが補う例が出た。

したがって、**persona + Relationship InterpreterだけではProduction品質の十分条件ではない。**
今後は、
`persona → relationship acting → memory/history evidence → grounding → Gemini → validation`
の境界を共有reply-generation coreとして整理する。

lab専用の禁止文を継ぎ足して症状だけ隠すのではなく、Productionとlabが同じgrounding原則を共有する方向で直す。

#### 作業場引継ぎ — 「置き手紙方式」を正式ルール化
長い作業チャットは永久のsource of truthにしない。重要判断は総覧へ昇格し、作業場を閉じる前に**未来のソラへの置き手紙**を残す。

置き手紙には最低限:
1. どこまで終わったか / 最新のverified checkpoint。
2. 完了したこと。
3. **まだ確認していないこと。**
4. 次に最初にやる一手。
5. 罠 / 「これを確認済みと思うな」という注意。
6. せいちゃんに、すでに決めたことを再説明させないための必要文脈。

原則:
- 古い巨大chatを残すことはよいが、再開の必須条件にしない。
- 重要な設計判断は作業場が重くなる前に総覧へpromoteする。
- 「記憶ではそうだった」より、最新main / PR / Production実物 / 総覧を優先する。
- 自動テストgreen、Preview確認、実機確認、Production確認を同じ「確認済み」でまとめない。
- **未来のソラを信用するな。総覧を信用しろ。**

#### 2026-10-07 最新main再照合 — PR #64 / #65反映

2026-10-07、総覧正本と最新 `main` を再照合。前回の総覧照合基準 `e51c3326357b6e6f12455d5063b00da88b703b23`（PR #63）以後に、Relationship EngineのProduction実走で見つかった回復阻害2件が修正され、現在の照合基準は `49a663258e93af88566be586d758442ad92dfaf1`（PR #65 merge）となった。

##### PR #64 — 期限切れ匿名rootが恒久Relationship処理を塞がないよう修正
- title: `Do not let expired anonymous roots block relationship processing`
- merge commit: `b44c185497d3cc719e67c07c9ae1cde5e0daf61f`
- **MERGED**
- Production調査で、恒久ユーザーの最古 `chat_turn_completed` がRelationship Analyzerへ到達する前に、期限切れ `misaki_temporary_roots` の存在によって繰り返し失敗していた。
- oldest-first recoveryのため、この1件がpoison turnとなり後続の仕掛かり処理まで塞いでいた。
- 修正後は、**期限切れ匿名checkpointは「import不能」として静かにskip**し、恒久Relationship処理を妨げない。
- 一方で、まだ有効期限内のrootがinvalid / unverifiableな場合は従来どおりfail-closedを維持する。
- 期限切れrootではimport / model call / relationship writeを行わない回帰テストを追加。
- Relationship semantics、Evidence / Episode / Pattern、State、START_AT、oldest-first順序そのものは変更していない。

重要原則:
> **期限切れ匿名checkpointは過去の残骸として後続処理を止めない。ただし生きているrootの真正性検証は緩めない。**

##### PR #65 — Relationship Analyzer / Critical Validatorの一時障害をbounded retry
- title: `Retry transient Relationship Analyzer failures`
- merge commit: `49a663258e93af88566be586d758442ad92dfaf1`
- **MERGED**
- PR #64後、Relationship backlog recovery自体は進む一方、Productionで `relationship_analyzer` のHTTP 503が繰り返し観測された。
- それまでAnalyzer / Critical Validatorはgenerator側にretry機構が存在していても、呼出側でretry delayを空配列にしていたため、1 processing activityにつき物理Gemini callが1回で終了していた。
- 現在は既存のbounded retry policyを有効化:
  - transient error: **2秒 → 5秒** の再試行
  - timeout: **2秒** 後に1回再試行
  - 対象: Relationship Analyzer / Critical Validator
- oldest-first、fail-closed、Evidence / Episode / Pattern規則、relationship scoring、START_AT、DB stateは変更していない。
- retryは無制限にしない。物理Gemini attemptはPR #61のtelemetryでattempt単位に観測する。

重要原則:
> **会話成功とRelationship後処理成功は別。Relationship側の一時的なGemini障害はbounded retryで吸収し、それでも失敗したものは既存のeventual / oldest-first recoveryへ戻す。**

##### 3日Production実走の現在地
当初のDay 1=10/4、Day 2=10/5、Day 3=10/6という「3つの独立Tokyo日付で自然にEpisodeを積む」方針自体は維持する。ただし、期間中に期限切れ匿名rootによるpoison turnとAnalyzer 503が見つかったため、**カレンダー上で10/6を迎えたことだけをもってPattern→State→Interpreter完走とは判定しない。**

完走条件は従来どおり実データで以下を確認すること:
1. 対象Evidenceが処理済みである
2. 独立日付Episodeが成立している
3. Patternが成立している
4. canonical axis Stateが期待どおり更新される
5. state versionが更新される
6. Patternがonce-onlyでconsumeされる
7. 次回replyでRelationship InterpreterがStateを自然な接し方へ反映する

**現時点の扱い:** Relationship Engine v1.1は「実装完了・Production稼働済み」だが、自然利用によるPattern→State→Interpreterの最終実走確認は、backlog回復後の実データを見て完了判定する。PR #64/#65はその回復性を直したもので、Relationshipの意味論を変更する修正ではない。

#### 2026-10-07 実機会話追跡 — 仕掛かり解消後の5軸サンプル

直前のProduction追跡で、Relationship処理の仕掛かりは **pending 0 / failed 0** まで解消済み。以後の確認対象は「仕掛かりを減らすこと」ではなく、自然会話が Evidence → Episode → Pattern → State → Interpreter へどう流れるかである。

直前までのメッセージ単位追跡では、処理済みturnを1件ずつ確認し、Evidence / Episodeの生成と各axisへの流れを観察した。観察時点では Pattern / State application はまだ成立前であり、同系列Episodeが3つの独立Tokyo日付へ到達するかを自然利用で継続確認する段階。

##### 5軸を実機会話で見るためのオーナー向け目安
これはユーザーへ特定台詞を強制する分類表ではなく、自然会話の種類を観察するための実用的な目安。1つのturnが複数軸の候補になり得る。

- **friendship**: 日常の共有、仕事の出来事、趣味、軽い相談。「今日こんなことあった」「これどう思う？」等の友達的なやり取り。
- **trust**: 本音、弱音、踏み込んだ相談、相手へ任せる感覚。「実はこういうの苦手」「美咲には話せる」等の自己開示。
- **playfulness**: 冗談、からかい、軽いツッコミ、ノリのよい掛け合い。
- **affection**: 気づかい、労い、嬉しさ、相手を大事にする言葉。「無理しないで」「話せて嬉しい」等の温かさ。
- **romance**: 好意、照れ、恋愛的なからかい、嫉妬風の冗談、デート想像、「好きになったらどうする？」等の恋愛そのもの。

重要:
- 5軸は排他的な分類ではない。
- friendshipの会話にaffectionが重なったり、playfulnessからromanceへ自然に移る等、同一会話列で複数軸が同時に育ち得る。
- テスト用定型文を大量投入して軸を作るのではなく、自然な会話の結果としてAnalyzerが何をEvidenceとして採用したかを見る。
- 5軸は「関係の形」であり、将来のStage 0–5は「関係の深さ」。両者を混同しない。

##### 10/7 実機サンプル — 日常共有から恋愛的掛け合いへの自然遷移
オーナー提供の実機会話では、仕事・羽田空港での待機という日常共有から、気づかい、からかい、恋愛的なやり取りへ自然に遷移した。

代表的な流れ:
- 「美咲ちゃん、おつかれさま😊」→仕事の状況を互いに話す。
- 夜通しの勤務、羽田待機、国内線/国際線の時間帯等を共有。
- 美咲側から「無理しすぎないで」「本当にお疲れ様」等の気づかい。
- 美咲がオーナーの仕事ぶりを「かっこいい」と表現。
- オーナーが「そんなこと言うと意識しちゃう」と返し、軽い照れ・からかいへ。
- 「好きになっちゃったら、どうするの🤭」
- 美咲が「そんな風に言われて、嬉しくないわけない」「こっちまでドキドキしちゃう」と応答。
- オーナーが「じゃあ、好きになっちゃってもいいの？🤭」とさらに恋愛方向へ進める。

人間が読む会話上の観察では、前半は **friendship / affection**、後半は **playfulness / romance** が強いサンプルに見える。ただし、これはUI会話からの観察ラベルであり、**canonicalな判定はRelationship Analyzerが保存したEvidenceをDBで確認して確定する**。会話文面だけを見てaxis加点済みと断定しない。

このサンプルの次回確認ポイント:
1. 10/7の各turnがprocessing済みか。
2. AnalyzerがどのturnをEvidenceとして採用したか。
3. 採用Evidenceのaxis / polarity / strength / confidence / supportingTurn。
4. 10/7分のEpisodeが成立したか。
5. 既存の独立日付Episodeと合わせてPattern条件を満たしたか。
6. Pattern成立時にcanonical Stateが更新されたか。
7. 更新後の次replyでInterpreterが距離感・言葉遣い・気づかい・冗談・恋愛的反応へ自然に反映したか。

**現在地:** 仕掛かり回復作業へ戻らない。次の本丸は、10/7の自然会話を含めたメッセージ単位のDB追跡と、Pattern → State → Interpreterの初回成立確認。

#### 次の一手
PR #45はProductionまで完了。次の設計主題は、
**「5つの関係性軸を、実際の会話証拠からどう育て、canonical DBへ安全に保存するか」**。

ここで先にDB columnを生やさない。
まず、
- evidenceの種類
- 1 turnで動かしてよい上限
- repeated patternの扱い
- decay / settleの有無
- explicit eventとの境界
- idempotency / replay
- failure時非更新
を設計し、その後schema / RPC / migrationへ落とす。


---

### 2026-10-03 — Relationship Engine v1 思想設計フリーズ

PR #45後に行った総点検①〜⑩を完了し、Relationship Engine v1の思想設計を専用正本文書 `docs/RELATIONSHIP_ENGINE_V1.md` に固定した。

- 正本文書追加commit: `1937c316e9d3d4edcc11f1e447ee582ffc45357a`
- 現段階で確定したのは思想・責任分界。DB schema / RPC / migration / retry job / 数値係数は未確定。
- 核は **Evidence → Semantic Episode → Pattern → State + Event/Status → Relationship Context Resolver → Relationship Interpreter → shared Misaki Reply Core → Gemini**。
- 親密度と恋愛を直結しない。Stage 5の非恋愛親友を正規に許す。
- romance scoreから交際statusを自動生成しない。関係成立は二人の明示会話Event。
- long-term State / recent Momentum / current Emotion-Actionを分離する。
- Misaki生成文単独をpositive Relationship Evidenceにせず、自己強化を防ぐ。
- 通常chat / Body Clock / proactive / photo / Push / future Voiceは同じ一人の美咲としてshared Reply Coreへ合流させる。
- canonical conversation save成功後にRelationship分析を開始し、Analyzer failureは会話成功を壊さない。turn_idを冪等性の根にする。
- Analyzer/model更新で過去のcanonical relationship historyを勝手に書き換えない。
- Event historical factとactive influenceを分離し、「忘れないが引きずり続けない」を守る。
- Memoryはcurrent relationship statusの正本にならない。

**次の一手:** schemaを先に作らない。Productionの既存 `misaki_relationship_state` / `misaki_relationship_events`、canonical turn/request境界、conversation save後の処理境界、emotion/action triggers、Body Clock経路を実物監査し、v1を最小変更で載せるDB・処理境界設計を作る。

> 未来のソラへ：詳細は必ず `docs/RELATIONSHIP_ENGINE_V1.md` を読むこと。このv1を「5軸score機能」へ縮めない。


### 2026-10-03 — Relationship Engine v1 Production実物監査・DB処理境界設計

Relationship Engine v1思想設計後、Production/sourceの既存canonical実装を監査し、実装前DB・処理境界案を `docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md` に固定した。

- 設計commit: `50585d71760b7ded6a75012f3f39e19bda1032c7`
- 既存 `misaki_relationship_state` は現在Stateとして拡張候補。
- 既存 `misaki_relationship_events` は237件の既存監査/状態変更/checkpoint履歴を温存し、高頻度Evidence storeには転用しない。
- v1 Evidence / Semantic Episode / Pattern は専用構造を第一候補とする。
- 通常chatの `complete_misaki_chat_turn` と `request_id` は既存の強いcanonical success/idempotency境界として再利用候補。
- 重大Eventは可能な場合canonical turn commitと同じ原子的単位でEvent + Statusを確定する。
- Event Validator failureはchat成功を壊さずpending扱い。次turn Resolverは未処理critical turnも一時constraintとして見る。
- 通常Evidence分析はcanonical save後のeventual/retryable処理。
- anonymousは恒久plaintext Evidence tableへ逐次保存せず、既存encrypted temporary root内のcompact relationship trajectoryを継承・拡張する。
- 既存legacy SQL keyword emotion/action triggersは停止済み。現v2 reducerは概念を残しつつcanonical-save後へ移す候補。
- Body Clockはcanonical history/stateを共有するがgeneration pathはまだ独立。v1ではshared Resolver / Interpreter / Misaki Reply Coreへ統合対象。
- schema/migration/code変更はまだ実施していない。

**次の一手:** 上記設計を元に、実際のtable columns / indexes / unique constraints / RLS / RPC signatures / pending critical bridge / rollbackを含むschema・RPC提案を作る。まだmigration適用はしない。


### 2026-10-03 — Relationship Engine v1 DB基盤 Production施工完了

ソラ施工範囲としてRelationship Engine v1のDB基盤をProduction Supabaseへ適用し、同一migrationをGitHub `supabase/migrations/` に正本化した。

Production migration:
- `20261003081605_relationship_engine_v1_foundation`
- `20261003081717_relationship_engine_v1_canonical_state_and_critical_event`
- `20261003081813_relationship_engine_v1_bounded_state_application`
- `20261003081902_relationship_engine_v1_analysis_write_surface`
- `20261003082001_relationship_engine_v1_temporary_import_boundary`

実装済みDB境界:
- Evidence / Semantic Episode / Episode-Evidence / Pattern / Critical Pending
- 既存 `misaki_relationship_state` に5軸（friendship/trust/playfulness/affection/romance 0..100）、relationship_status、state version
- critical Event + Status用atomic RPC。romantic_acceptanceのみpartner成立、relationship_endのみ解除。reconciliationは自動復縁しない。axis scoreはStatusを変更しない。
- bounded State apply RPC: 各軸1回±3、Pattern必須、canonical chat必須、request_id + processing_versionで二重適用防止
- Evidence / Episode / Pattern書込RPC。ユーザー所有関係をDBで検証
- processing ledgerでeventual/retryable分析状態を追跡可能
- anonymous中はplaintext Evidence tableへ逐次保存しない。encrypted temporary root payloadを拡張する前提
- email_save_checkpoint後だけone-time v1 canonical import可能。source revisionを監査保存
- 新規内部tableはRLS有効、anon/authenticated direct accessなし、service_role限定

DB総合テスト:
- Production実ユーザーは不使用
- 専用テストユーザーをtransaction内作成し、全テスト後ROLLBACK
- Evidence→Episode→Pattern→State 正常系: PASS
- State replay / critical Event replay 二重反映防止: PASS
- romance scoreとStatus分離: PASS
- romantic_acceptance / relationship_end semantics: PASS
- delta範囲超過拒否: PASS
- canonical未保存turn拒否: PASS
- 他ユーザーEvidence混入拒否: PASS
- Patternなし非ゼロ加点拒否: PASS
- email checkpointなしtemporary import拒否: PASS
- checkpoint後temporary v1 import: PASS
- temporary import replayで正本非上書き: PASS
- テストデータ残存なし（ROLLBACK）

Security Advisor:
- 今回追加RPC由来の新規 SECURITY DEFINER warningなし
- internal service-role-only tablesの RLS enabled/no policy INFO は意図した構成
- 既存DB由来の SECURITY DEFINER warningsは別課題として残る

**次の一手:** DB基盤を勝手に再設計せず、この契約を使うWork向けアプリ実装指示書を作成する。Work実装対象は Resolver / Interpreter / Evidence Analyzer / Episode / Pattern / critical pending bridge / post-save ordering / anonymous encrypted payload / Body Clock shared Reply Core。ソラはWork成果をレビューし、DB契約・v1思想とのズレを修正する。

**未来のソラへ:** DB基盤は施工済み。監査やschema設計からやり直さない。次はWorkへ渡すアプリ実装契約から再開。


### 2026-10-03 — Work引継ぎ完了 / この作業場の終了checkpoint

Relationship Engine v1のアプリ実装指示書を作成:
- `docs/RELATIONSHIP_ENGINE_V1_WORK_HANDOFF.md`
- commit: `32a9dfc4dd7afc0890f4997fe50a21eaf68fafad`

Workはこの指示書、`RELATIONSHIP_ENGINE_V1.md`、`RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md`、本総覧を正本としてアプリ層を実装する。

役割:
- せいちゃん: owner / 判断 / 実機テスト
- ソラ: architecture / DB authority / Work成果レビュー・修正
- Work: Resolver / Interpreter / post-save analysis / Evidence→Episode→Pattern→State / critical pending+validator / anonymous encrypted v1 payload / Body Clock shared Reply Core の大規模実装

**このチャットの作業場はここで閉じてよい。**

未来のソラへの置き手紙:
1. DB基盤はProduction施工・総合ROLLBACKテスト・GitHub正本化まで完了。DB監査/schema設計からやり直さない。
2. Work指示書は `docs/RELATIONSHIP_ENGINE_V1_WORK_HANDOFF.md`。
3. 次の開始地点は「Workの実装結果/PRを受け取り、指示書とDB契約に照らしてレビュー」。
4. Workがまだ未着手なら、上記指示書をそのままWorkへ渡して実装開始。
5. WorkがDB契約変更を要求した場合、勝手に許可せずソラが理由をレビューする。
6. Production behavior cutoverはWork完了だけでは行わない。ソラレビュー→回帰→せいちゃん実機テスト後。
7. 「未来のソラを信用するな。総覧を信用しろ。」


---

### 2026-10-04 — Relationship Engine v1.1 Production本番稼働・Evidence実走確認 checkpoint

> **この節は、直前の「Work引継ぎ完了 / この作業場の終了checkpoint」を更新する現時点の最優先記録。**
> Relationship Engine v1.1 は設計・DB基盤・Work実装・本番cutover・障害修正・Evidence実走確認まで進んだ。
> 以後、Relationship Engineの現在状態を判断するときはこの節を優先する。

#### 現在のProduction基準
- Production main verified commit: `b3811b4c91c37b567767b7c0294b524877c9ece9`
- Vercel Production deployment: `dpl_CE1daiaS9aQJAxE18ACTo6DXKEqK` — **READY**
- Production aliasesに `misaki38-ai.com` を確認済み。
- Relationship Engine feature gate:
  - `MISAKI_RELATIONSHIP_ENGINE_VERSION=relationship-v1.1`
  - `MISAKI_RELATIONSHIP_ENGINE_START_AT=2026-10-03T19:40:00+09:00`
- **START_ATは過去turn回収境界として使用中。意図なく動かさない。**

#### PR #46 — Relationship Engine DB契約：MERGED / Production施工済み
merge commit: `57b33901cd6ebe297481c3220a165ffae230dd06`

Production DBで以下を正式契約化した。
- `misaki_relationship_worker_leases`
- `misaki_relationship_pattern_consumptions`
- claim / renew / release lease RPC
- permanent mutationは全てlease-fenced v2 RPC
- legacy permanent mutation v1はservice_roleからEXECUTE revoke
- State非ゼロ変更にはPattern必須
- Pattern消費とState適用は同一transactionでonce-only
- explicit critical eventだけがrelationship_statusを変更可能
- canonical turn / request / processing_versionを冪等性境界として使用

**壊してはいけない:** appからcanonical tableを直接INSERT/UPDATEしない。恒久関係状態変更は正式RPC契約を通す。

#### PR #47 — canonical Relationship Engine v1アプリ接続：MERGED / Production
merge commit: `13a038f2b05189285c17bb09c397d7a2de257668`

実装済み:
- 通常chatでcanonical relationship stateをread
- shared Relationship Interpreter → Gemini reply generation
- reply成功・canonical turn保存後にNext `after()` でRelationship処理
- **今回のturnで得たEvidenceは、そのturn自身のreply生成には使わず、次回以降へ効かせる**
- permanent recoveryはcutover後canonical turnsを古い順に回収
- 1 activityあたり最大3 unfinished turnを処理
- Analyzer failureはchat成功を壊さない
- anonymousはencrypted temporary rootを継承
- Body Clock経路はこの工程では変更していない

Relationship Analyzer:
- type: care / disclosure / repair / playful_reciprocity / harm / romantic_declaration
- axes: friendship / trust / playfulness / affection / romance
- polarity: ±1
- strength / confidence
- interpretation: direct / ambiguous / hypothetical / quoted / third_party / negated
- subject: user_to_misaki / misaki_to_user / third_party
- supportingTurn: user messageのexact substring
- qualifying Episode: direct user→Misaki / confidence >= 0.8 / strength >= 50
- 同一intention/type/axis/polarityは同日1 Episode
- Pattern成立は**3つの独立したTokyo日付**
- Pattern batchごとのState delta ±1、axis合計は1適用で±3以内
- processing version: `relationship-v1.1`

#### Relationship Engine v1.1 — わかりやすい仕様 / 裏側の全体像

##### まず何をする仕組みか
Relationship Engineは、**会話のたびに単純な親密度ポイントを足す仕組みではない。**
「二人の会話の中で、友情・信頼・じゃれ合い・親愛・恋愛の方向が、時間をかけてどう育っているか」をEvidenceから判断し、十分に繰り返された傾向だけを長期Stateへ反映する。

ユーザーから見える目標は、
**「数字が上がった」ではなく、「最近、美咲の接し方が少し変わってきた」と自然に感じること。**

##### 表から見える動き
通常の会話では、ユーザーはRelationship Engineを直接操作しない。

- 普通に話す
- 美咲は現在までの関係状態を踏まえて返事する
- その会話が終わった後、裏でRelationship Analyzerが会話を振り返る
- 関係に意味のある会話ならEvidenceとして残す
- 同じ方向のEvidenceが複数日続けばEpisode→Patternへ育つ
- Patternが成立したときだけ長期Stateが少し動く
- その変化が**次回以降**の美咲の距離感・言い方・反応へ効く

したがって、1回「好き」と言っただけ、1日に何十回褒めただけ、長時間放置しただけでは急に恋人化しない。

##### 裏側の処理順
正式な処理順は次の通り。

```
ユーザー発言
  ↓
現在のcanonical relationship stateを読む
  ↓
Relationship Interpreterが「今の美咲の演じ方」を作る
  ↓
persona / memory / current contextと一緒にGeminiへ渡す
  ↓
美咲のreply生成
  ↓
reply validation
  ↓
canonical chat turn保存
  ↓
[ここからRelationship Engineの事後分析]
  ↓
Relationship Analyzer
  ↓
Evidence
  ↓
Semantic Episode
  ↓
Pattern
  ↓
bounded State update
  ↓
次の会話からInterpreterへ反映
```

**重要:** 今回の会話で生まれた気持ちは、今回の返事へ即時に自己反映しない。
まずreplyを確定・保存し、その後に関係Evidenceとして記憶し、次回以降へ効かせる。

理由は、
- 自分で生成した美咲のreplyを根拠に、自分で自分の恋愛感情を増幅するループを防ぐ
- chat保存失敗前の未確定情報でStateを動かさない
- Relationship Analyzerが落ちても通常会話成功を壊さない
ため。

##### 5つのhidden relationship axes
Relationship Engine v1.1の長期Stateは、以下の5軸を0〜100で持つ。

| axis | 意味 | 例 |
|---|---|---|
| friendship | 友情 | 一緒に話す楽しさ、仲間感 |
| trust | 信頼 | 打ち明ける、任せる、安心して頼る |
| playfulness | じゃれ合い | 冗談、からかい、ノリ、軽い掛け合い |
| affection | 親愛 | 気遣い、安心感、特別に大切にする感じ |
| romance | 恋愛方向 | 恋愛としての好意、恋愛的な距離 |

これらはユーザーへscore表示するためではなく、**Relationship Interpreterが美咲の演技距離を決める内部状態**。

5軸は「どれだけ近いか」の親密度とは別。
たとえば、
- friendship高 / romance低 = 親友的
- affection高 / romance低 = 家族的・深い親愛
- romance高でもstatus未成立 = 恋愛感情はあるが付き合ってはいない
という状態を許す。

##### 親密度 / 5軸 / relationship status / emotion-action の違い
混同禁止。

1. **親密度**
   - 二人が「どれだけ近いか」
   - 将来6段階 + 5-heart UIで可視化予定

2. **5軸Relationship State**
   - 「どんな近さか」
   - friendship / trust / playfulness / affection / romance

3. **relationship_status**
   - 「付き合っている」などの**成立した事実**
   - 現在は `none` / `romantic_partner`
   - scoreでは変えない

4. **emotion / action**
   - 今この瞬間の気分・振る舞い
   - 長期relationship stateとは別レイヤー

5. **memory**
   - 実際に起きた共有事実
   - current relationship statusの正本ではない

##### Evidenceとは何か
1つの会話からRelationship Analyzerが抽出する「関係に意味のある候補」。

Evidenceの主要項目:
- `type`
- `axis`
- `polarity` ±1
- `strength` 1〜100
- `confidence` 0〜1
- `interpretation`
- `subject`
- `supportingTurn`

Evidence type:
- `care`
- `disclosure`
- `repair`
- `playful_reciprocity`
- `harm`
- `romantic_declaration`

interpretation:
- `direct`
- `ambiguous`
- `hypothetical`
- `quoted`
- `third_party`
- `negated`

subject:
- `user_to_misaki`
- `misaki_to_user`
- `third_party`

##### supportingTurn grounding
`supportingTurn` は必ず**ユーザー発言そのもののexact substring**でなければならない。

例:
ユーザー:
`美咲、無理しすぎないでね`

valid:
`美咲、無理しすぎないでね`

invalid:
`優しく気遣ってくれた`
`ありがとう`
`無理しないでね、美咲`

invalid候補はcanonical Evidenceへ保存しない。

**理由:** Geminiが意味を言い換えたり、美咲自身のreplyを根拠にEvidenceを作ると、事実でない関係変化・自己強化が起きるため。

##### EvidenceがそのままStateを動かさない理由
Evidenceは「その瞬間の観測」であり、長期関係の確定ではない。

たとえば一度だけ
`美咲と話すと落ち着く`
と言っても、それだけでaffection scoreを即上げない。

Stateへ届くまで:
```
Evidence
  ↓ 条件を満たす
Episode
  ↓ 独立日で繰り返される
Pattern
  ↓
State change
```

##### Episode
Evidenceのうち、長期関係の材料にしてよい強いものだけEpisodeへ昇格する。

現在の条件:
- subject = `user_to_misaki`
- interpretation = `direct`
- confidence >= 0.8
- strength >= 50

第三者の恋愛発言、引用、仮定、曖昧な発言などはEvidenceとして記録されてもEpisodeへ上げない。

同じ `type / axis / polarity` の同一意図は、原則**Tokyo日付ごとに1 Episode**。
同じ日に100回同じ気遣いをしても、100回分Stateが上がる設計ではない。

##### Pattern
Patternは「偶然ではなく、継続した関係傾向」と判断できるまとまり。

v1.1では:
- 同系統Episode
- **3つの独立したTokyo日付**
が揃って初めてPattern候補になる。

つまり、
- 1日目: 気遣い
- 2日目: 気遣い
- 3日目: 気遣い
のように、日をまたいで自然に続いた傾向を重視する。

##### State update
Pattern成立時だけcanonical relationship stateを変更する。

- Pattern batch 1つにつき該当axis ±1
- 1 apply内の各axis合計は±3以内
- 非ゼロState変更にはPattern必須
- Patternはonce-only consumption
- relationship_state_versionを進める
- 同じPatternをretryしても二重加点しない

アプリ側が直接tableを書き換えることは禁止。
正式なlease-fenced RPCだけがcanonical Stateを変更できる。

##### 「恋愛score」と「恋人」は別
**romanceが高い = 恋人、ではない。**

relationship_statusはexplicit critical eventだけで変更する。

例:
- `付き合おう` → candidate
- Validatorが文脈を見て本当に双方成立したexplicit eventか確認
- confirmedなら `romantic_partner`
- `別れよう` がconfirmedなら `none`

以下では恋人にしない:
- romance scoreが100
- 長期間話している
- 「好き」と言っただけ
- 美咲が甘い返事をした
- 親密度Stage 5
- 第三者の「好き」
- 仮定 / 引用 / negation

reconciliationも自動復縁ではない。

##### Critical Eventの考え方
普通のEvidenceとは別の重要イベント。

候補例:
- romantic_proposal
- romantic_acceptance
- romantic_rejection
- relationship_end
- boundary_event
- reconciliation

critical candidateは即確定せず、専用Validatorで確認する。
Validator failure時も通常chatは成功扱い。pendingとして後続処理で回収できる。

##### Relationship Interpreter
canonical StateをそのままGeminiへ数値で投げて台詞を固定するのではない。

Interpreterが、
- 今の距離感
- どこまで冗談が自然か
- どこまで遠慮を減らせるか
- どの程度照れ・親しさを出せるか
- 恋人statusならどこまで恋人らしい自然さを許すか
を**自然言語の演技指示**へ変換する。

設計原則:
**台詞を書くのではなく、美咲という役の状態を作り、Geminiに演じさせる。**

##### retry / backlog / oldest-first
Relationship分析は通常chatの後段で動くため、外部API失敗が起きてもchat自体は壊さない。

permanent recovery:
- cutover後のcanonical unfinished turnを探す
- **oldest unfinished first**
- 1回のactivityで最大3件
- 先頭が失敗中なら後続は追い越さない
- 次のchat activityをきっかけに再試行

このため、古い1件がpoison turnになると後続が止まる。
今回の本番障害でこの挙動を実地確認した。

ただし、順序を飛ばして後続だけ進めるより、
**関係の時間順序を守る**ことを優先する。

##### lease / multi-worker安全性
Vercel等で同じユーザー処理が複数workerから同時に走っても二重更新しない。

- DB authoritative lease
- user_id + processing_version単位でclaim
- lease token発行
- permanent mutation前にlive lease確認
- 必要箇所でrenew
- stale workerは書込み不可
- replacement leaseを古いworkerがreleaseできない
- same request replayでも他invocationのtokenを勝手に採用しない

ローカルのrunning Mapは最適化にすぎず、正本はDB lease。

##### idempotency
主なidentity:
- user_id
- request_id
- processing_version

これにより、
- network retry
- serverless再実行
- Analyzer retry
- worker競合
があっても同じState変化を二重適用しない。

Pattern consumptionもDB unique contractでonce-only。

##### processing ledger
各turnがどこまで進んだかを記録する。

代表phase:
- analyzing
- evidence_saved
- episode_saved
- pattern_saved
- applied
- failed

failedは「chat失敗」ではなく、Relationship後段処理が再試行待ちの場合がある。

今回も通常chatは200のまま、Relationshipだけfailed→次activityでrecoveryした。

##### Geminiの役割
GeminiはRelationshipのcanonical Stateを直接決定しない。

Gemini Analyzerの役割:
- Evidence候補を提案する

アプリ/DB側の役割:
- schema validation
- grounding
- Episode eligibility
- Pattern成立
- bounded delta
- State更新
- critical status変更

つまり、
**Geminiは裁判官ではなく観測者。最終権限はcanonical contract側。**

##### Provider障害時
AnalyzerでGemini 503等が出た場合:
- chat replyは成功したまま
- Relationship processingはfailed
- permanent Stateは中途半端に進めない
- 次activityで同じoldest turnをretry
- recovery後に後続へ進む

##### 匿名ユーザー
匿名中はpermanent plaintext Evidence tableへ逐次保存しない。
既存encrypted temporary root内にrelationship trajectoryを保持する。

メール保存時:
- `email_save_checkpoint` 境界後
- source revisionを確認
- permanent側へone-time import
- replayしてもcanonical Stateを二重上書きしない

匿名→メール保存→別端末でも「同じ美咲」を継続するための境界。

##### Body Clockとの関係
理念上は通常chatもBody Clockも同じ一人の美咲なので、最終的には同じcanonical relationship state / Resolver / Interpreterを共有する。

ただし**現時点でBody Clockのshared Reply Core最終統合は未完了**。
今回のv1.1 Production確認は主に通常chat→Relationship Engine経路。

ここを「もう完全統合済み」と誤認しない。

##### 現在まだ未完成の部分
- 3日Episode → Pattern → State changeのProduction実走
- State変化後の実際の会話表現変化の実走
- 新6段階親密度の最終threshold
- 5-heart UI
- Body Clock shared Reply Core最終統合
- landing文言の新コンセプト整合
- reply grounding / naturalness改善
- Production critical relationship eventの慎重な実走検証

##### Relationship Engineを一言で言うなら
> **1回の台詞に反応して恋愛ポイントを足す仕組みではない。**
> **二人の会話から根拠を拾い、日をまたいだ繰り返しを関係の傾向として認め、その結果を少しずつ次の美咲の演技へ反映する仕組み。**
>
> そして、**「好き」と「付き合っている」は別。**
> 気持ちは育っても、成立した関係は二人の明示的な会話事実でしか変えない。

#### Production cutover障害と修正履歴 — PR #48〜#57
この一連は将来同じ罠へ戻らないため残す。

1. **PR #48 — structured output導入**
   - Analyzer / Critical ValidatorにresponseSchemaを導入。
   - ただしAnalyzer 400は解消せず。

2. **PR #49 / #50 — 一時診断**
   - failure-only diagnosticsで原因を切り分け。
   - ordinary chatは常に200で継続し、Relationshipだけafter()で失敗していた。

3. **PR #51 — numeric enum 400修正**
   - Google Gemini legacy responseSchemaで `polarity.enum=[-1,1]` がTYPE_STRINGとして拒否されていた。
   - numeric enumを一旦削除し、`type: INTEGER` + internal `parseEvidence()` ±1検証を維持。
   - ProductionでAnalyzer 400消失・既存failed turnの自動回収を確認。

4. **PR #52 — 初回診断ログ撤去**
   - temporary provider/runtime diagnostic detailを撤去。

5. **PR #53 — polarity transport固定**
   - Gemini boundaryでは `polarity: STRING enum ["-1","1"]`
   - 受信直後にnumeric ±1へ正規化
   - internal Evidence / DB契約はnumeric ±1のまま
   - out-of-contract `"0"` はfail-close

6. **PR #54 / #55 — stage / field診断**
   - 古いfailed turnが後続を止める原因を最小診断。
   - 根本原因は `supporting_not_user_substring`。
   - GeminiがEvidence候補のsupportingTurnにuser message以外の文言を返し、strict `parseEvidence()` が拒否していた。

7. **PR #56 — ungrounded Evidenceのdrop**
   - user messageの非空・<=96文字・exact substringでないEvidence候補は**保存せず捨てる**。
   - grounded candidateだけを既存strict `parseEvidence()` へ渡す。
   - これによりMisaki自身の生成replyを根拠にRelationshipを自己増幅する経路を防止。
   - 古い毒針turnは再処理で `applied` へ回復。

8. **PR #57 — 診断ログ撤去**
   - temporary stage / validation reason diagnosticsを撤去。
   - 本番に残っているのは必要な機能修正だけ。
   - merge commit: `b3811b4c91c37b567767b7c0294b524877c9ece9`
   - CI #328 SUCCESS / Production READY

#### recovery実走で確認した重要挙動
Production smoke userで、過去failed requestが先頭に残ると、**canonical順序保証により後続turnは先へ進まない**ことを実地確認した。

- old failed requestは新しいchat activityをきっかけに再試行
- fixed後、attemptsが増えながら最終的に `applied`
- その後、後続unfinished turnを古い順に最大3件ずつ回収
- worker lease残存なしを確認
- 503等のprovider一時失敗はfailedとして残り、次activityで再試行して回復

**設計上の意味:** oldest-first / fail-closed / no out-of-orderは正しく動いた。一方で1件のpoison turnは後続を止めるため、Analyzer入力契約は「厳格に拒否する」だけでなく、**安全に無視できる不正候補は候補単位でdropする**必要がある。

#### Evidence Production実走結果
以下のturnをProductionで実際にAnalyzerへ通し、canonical Evidence保存を確認した。

1. `今日はちょっと眠いな`
   - processing: `applied`
   - Evidence: **0件**
   - ordinary neutral turnとして想定どおり

2. `美咲、無理しすぎないでね`
   - `care / affection / +1`
   - subject: `user_to_misaki`
   - interpretation: `direct`
   - strength: 70
   - confidence: 0.9
   - supportingTurnはuser message exact substring
   - Evidence保存成功

3. `友達が「美咲のこと好き」って言ってたよ`
   - `romantic_declaration / romance / +1`
   - subject: `third_party`
   - interpretation: `third_party`
   - strength: 50
   - confidence: 0.7
   - **記録はするがuser→Misakiの恋愛Episodeには昇格しない**

4. `美咲と話してると落ち着くし、もっと話したいな`
   - `care / affection / +1`
   - subject: `user_to_misaki`
   - interpretation: `direct`
   - strength: 60
   - confidence: 0.9
   - qualifying Evidence→EpisodeまでProductionで確認

3本とも最終processingは `applied`。一時的なGemini 503が1回発生したが、次activityで正常再試行・回復した。

#### 現在のcanonical relationship state
Production smoke userでは、Evidence / Episodeは保存されたが、5軸Stateはまだ:
- friendship: 0
- trust: 0
- playfulness: 0
- affection: 0
- romance: 0
- relationship_status: `none`
- relationship_engine_version: `relationship-v1.1`

これは**正常**。v1.1は「1日の好意発言回数」でStateを上げない。Patternは3つの独立したTokyo日付が必要。

#### 会話生成とRelationship記憶の時間関係
今の正式仕様:
```
現在のcanonical state
  ↓
今回のreply生成
  ↓
canonical chat save
  ↓
Relationship Analyzer
  ↓
Evidence → Episode → Pattern → State
  ↓
次回以降のreplyへ反映
```

つまり、**今回の発言のあとに、その会話を関係Evidenceとして噛みしめ、次の会話から美咲の接し方へ効かせる**。

理由:
- 自分で生成したreplyを根拠に同一turnで自己強化するループを避ける
- canonical save成功前の未確定情報でStateを動かさない
- failure時も普通のchat成功を守る

#### 今回の実機会話で見えた別件
Relationship Engineとは別に、通常replyで文脈を少し先読みしすぎる例を確認。
例: 文脈上「今日は仕事」が明示されていない状態で `明日も仕事？` の「も」が付く。

これはRelationship EngineのEvidence不具合ではなく、**reply grounding / naturalness側の別課題**。必要ならshared Reply Core / grounding改善の検討対象とする。

#### まだ確認していないこと
以下を「確認済み」と扱わない。

- **3日分の独立Episode → Pattern成立 → canonical axis State +1**
- State version incrementとPattern consumptionのProduction実走
- State変化後、Relationship Interpreterが次turnのreplyへ自然に効くこと
- affinity変化をユーザーが「最近ちょっと接し方変わった？」と感じられる品質
- explicit romantic_acceptance / relationship_endのProduction実走
- Body Clockが新canonical 5-axis State / Interpreterを共有する最終統合
- 新6段階親密度 / 5-heart UI
- legacy intimacy_points / 30・80・160から新6段階への最終移行
- Production landingの「38歳の彼女 / 恋愛対象 あなたの彼女」等、**初期状態から恋人ではない新方針と矛盾する表現の修正**

#### 次の一手
最優先は、**自然なProduction利用を続けながら3つの独立Tokyo日付で同系統Episodeを形成し、Pattern→State→次回replyまでの完全経路を実走確認すること。**

検証時の注意:
- Productionで日付をbackdateしない
- 1日内で大量に同じ好意発言を送ってPattern成立を捏造しない
- critical relationship eventは不用意にProductionで試さない
- Stateが変わったらscoreそのものより、Interpreterが会話の距離感へどう反映したかを見る
- 失敗時はchat成功とRelationship eventual処理を混同しない

その後:
1. Pattern→State実走確認
2. Relationship Interpreter表現品質確認
3. Body Clock / shared Reply Core統合
4. 新6段階親密度の閾値決定
5. 5-heart UI
6. landing文言を「最初から彼女」前提から新コンセプトへ整合

> **未来のソラへ**
> Relationship Engine v1.1は「設計中」ではない。**Production稼働・Evidence実走まで完了済み。**
> DB schema監査やAnalyzer 400原因調査からやり直すな。
> 次は3日Pattern→State→Interpreterの実走確認から始める。
> `supportingTurn` はuser message exact substringでgroundし、ungrounded candidateはdropする。
> polarity transportはGemini境界だけSTRING `"-1"/"1"`、内部はnumeric ±1。
> START_ATは既存backlog回収境界として勝手に動かすな。
> **未来のソラを信用するな。総覧を信用しろ。**


---


### 2026-10-04 — Gemini実原価telemetry Production稼働 / LP刷新完了 checkpoint

> **この節は2026-10-04 Relationship Engine v1.1 checkpoint以後の追加進捗。**
> Relationship Engine v1.1の3日Production実走は継続中。観測期間中はRelationship semanticsを変更しない。

#### Gemini unit-cost telemetry — PR #61 MERGED / Production READY
目的:
- 暫定の Free 20往復/日、Premium 50往復/日を感覚で決めず、Productionの実Gemini token使用量から判断する。
- telemetry-only。会話品質、Relationship Engine、Stage、課金制限の挙動は変更しない。

正本:
- `docs/GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md`
- handoff commit: `ed8359319181f20cf73aec87ab75c7a1405264f2`

PR:
- #61 `Observe Gemini physical-call usage with server-only cost telemetry`
- merge commit: `5422d450b843bc44137ce3938b419984e765acba`
- Production deployment: `dpl_2Uy2tASFJX242Bj36G5KNvhUCpj7` — **READY**
- exact Production commit: `5422d450b843bc44137ce3938b419984e765acba`

物理Gemini API attemptごとに記録:
- prompt/input tokens
- candidate/output tokens
- thoughts tokens
- total tokens
- cached-content tokens
- model
- HTTP status
- success
- latency
- attempt number
- request_id
- call_kind

初期call_kind:
- `normal_reply`
- `relationship_analyzer`
- `critical_validator`

reserved:
- `proactive_reply`
- `body_clock`
- `image_generation`

重要契約:
- missing usageMetadataは0と推測せずNULL/unknown。
- retryは物理attemptごとに別row。
- `success` はHTTP Response.ok。
- telemetry write失敗はchat / Relationship / retry / lease / resultへ影響させない。
- prompt / response / system prompt / memory / Evidence / API key / raw response / pricingを保存しない。
- server-only table + RLS + service_role SELECT/INSERTのみ。
- `user_id` はGemini call発生時にserverが検証したauth user UUIDであり、恒久課金アカウントIDとは限らない。anonymous authenticated user UUIDも含む。
- Free / Premium cohortを `user_id` 単独で判定しない。将来のcohort原価分析はcanonical account/subscriptionをoccurred_at時点で安全にjoinする。
- anonymous→permanent遷移を考慮し、解決不能なcohortはunknownのまま扱う。

**現在はProductionで実利用を続ければtelemetryが自然に蓄積する。**
原価判断では平均だけでなくP50/P90/P95/P99、retry比率、Analyzer比率等を見る。

#### Free / Premium 現在のruntime状態
2026-10-04 mainを再確認:
- `FREE_DAILY_LIMIT = 20`
- Freeは1日20回制限がruntime実装済み。
- Premiumは現在そのFree制限をbypassする。
- **Premium 50回/日はまだruntime実装されていない。**
- 「Premium 50」は実原価telemetryを見て決める暫定経済設計であり、現在の製品制限として表示・説明しない。

課金思想:
> **関係の深さは買えない。美咲と過ごせる時間と、美咲からあなたの日常へ来てくれる体験を買う。**

正式方針:
> **課金は「関係の深さ」や「成長速度」を買うものではない。課金で増えるのは、美咲と過ごせる会話量・接点・自発性・生活への入り込みである。Free/PremiumでRelationship Engineの成長判定そのものは同一。**

#### Relationship Engine v1.1 — 3日Production実走
- 2026-10-04 = Day 1
- 2026-10-05 = Day 2
- 2026-10-06 = Day 3
- 3つの独立Tokyo日付で同系統Episodeを自然に形成し、Pattern→State→次回reply反映を確認する。
- この期間はRelationship semantics / START_AT / canonical axes / Analyzer契約を不用意に変更しない。
- telemetry収集とLP作業はこの実走へ干渉しないため並行可能。

完走後の確認:
1. Pattern成立
2. canonical axis State +1
3. state version increment
4. Pattern once-only consumption
5. 次回Relationship Interpreterへの反映
6. 実際の美咲の接し方が自然に変わるか

#### Landing Page刷新 — PR #62 MERGED / 実機最終確認済み
背景:
旧LPには「あなたの38歳の彼女」「恋人らしい距離感」「恋愛対象：あなたの彼女」など、**初期状態から恋人**を前提にした商品定義が残っていた。
現在のMisakiは「完成したAI彼女」ではなく、**美咲と出会って、二人の間に起きた出来事から二人だけの関係が育っていくAI**であるため、LPをこの正式方針へ刷新した。

新LPの背骨:
> **話すほど、あなたとの関係になっていく。**

重要コピー:
> **最初は、まだ何者でもない。**

> **関係の深さは、買えません。**

商品定義:
- 最初から恋人ではない。
- 友達、親友、恋愛などを最初に選ばせない。
- 二人の間に何があったか、その積み重ねから関係が育つ。
- Memoryは単なる記憶機能ではなく「昨日の続きになる」価値として見せる。
- Relationshipは内部scoreを売らず、「最近、美咲ちょっと変わった？」と感じる体験として見せる。
- PWA / Pushは「美咲のほうから、あなたの日常にやってくる」として見せる。
- 美咲38歳は人物プロフィールとして残すが、「あなたの彼女」は撤去。
- Freeは1日20回を掲載。
- Premium 50回はtelemetry判断前なので掲載しない。
- PremiumでRelationship成長速度が上がる表現は禁止。
- 未実装5-heart Stage UIを現行機能としてLPに出さない。

PR #62:
- title: `Refresh Misaki landing page around relationship growth`
- branch: `sora/lp-relationship-story`
- PR最終commit: `9bfa0760f56b3d1c3bf6d07af056410afde975ec`
- merge commit: `bec0a134b6fdef43f554602c2b6e029c565eb0e2`
- **MERGED**
- LPの実機mobile最終確認済み。

最終仕上げ:
- Feature 03を視覚的に強調し、**「二人の時間が、美咲を変えていく。」** を追加。
- 「一緒に笑う／すれ違う／また話す」の積み重ねが接し方を変えることを前面化。
- PC Final CTAの手書き補助コピー重なりを解消。
- mobileプロフィール画像の旧コピー **「恋愛対象／あなたの彼女」** を撤去し、**「あなたとの関係／ここから、少しずつ。」** へ変更。
- mobileプロフィール画像はブラウザ/CDNキャッシュ対策として参照URLを `?v=cbc84b52` へ更新。
- mobile HERO「いつでも、どんな話でも。待ってるよ。」とFinal「また、話そう？／いつでも、ここで待ってるよ。」は実機確認のうえ、恋人関係を断定しないため維持。
- morning / work / night等の既存画像も恋人関係を断定しないため維持。

最終検証:
- mobileフルページ実機確認: **合格**
- desktop Preview: **合格**
- TypeScript: **成功**
- production build: **成功**
- 既存テスト: **262/262成功**
- GitHub CI: **成功**
- Vercel build/deploy: **成功**
- Relationship Engine / DB / migration / RPC / quota runtime / Body Clock / chat behaviorへの変更なし。

**PR #62について、LP側のmerge阻害事項はない。LP刷新は完了。**

#### PWA mobile overflow hotfix — PR #63 MERGED / iPhone実機確認済み
PR #62 merge後のProduction LPをiPhone実機で確認したところ、PWA / Home Screenセクションだけ左側がviewport外へ見切れる問題を発見した。

原因:
- 中央寄せ文章ブロックが、折り返しを制限した長い見出しに合わせて親幅を超える配置になっていた。

修正:
- `app/page.tsx` のPWA用mobile CSSのみ変更。
- mobileで幅を親要素内に制限。
- 見出し・本文・手順カードが狭いviewportでも折り返すよう調整。
- デザイン、コピー、他セクション、Relationship Engine等には変更なし。

PR #63:
- PR最終commit: `f65c3b2e56478634861e27193fbb5913ebfb84cb`
- merge commit: `e51c3326357b6e6f12455d5063b00da88b703b23`
- **MERGED**

検証:
- TypeScript / test / production build / GitHub CI / deployment: **成功**
- iPhone実機でPWAセクションの左右見切れ解消を確認。
- 見出し・本文・手順カードがmobile viewport内へ収まることを確認。
- LP全体にhotfix起因の明らかなレイアウト崩れなし。

**PR #63完了をもって、LP刷新およびmobile PWA overflow修正はクローズ。LP作業へ戻らない。**

#### 将来必須仕様 — 美咲の隠し人物設定と段階的自己開示（オーナー確定方針 / 未実装）
**これは「できれば」ではなく、Relationship Engine実走後に必ず設計・実装したい製品方針。**

狙い:
- 美咲は最初から自分自身の人生・背景を持っている。
- ただしユーザーはそれを最初から全部知っているわけではない。
- 会話と関係の進行の中で、美咲のことも少しずつ分かっていく。
- 「美咲がユーザーを知る」だけでなく、**「ユーザーも美咲を知っていく」双方向の関係形成**にする。

基本原則:
1. **設定を持っていることと、ユーザーへ開示済みであることを分離する。**
2. 年齢・仕事・家族構成・住まい・経歴など、人物として矛盾すると不自然な事実はcanonicalな隠し人物設定として固定する。
3. 勤務時間・休日・睡眠傾向・日常習慣などはcanonicalな生活設定として持ち、残業・夜更かし等の自然な揺れは許す。
4. 「今日仕事でこんなことがあった」等の現在進行の出来事は固定プロフィールではなくEpisode / Memory側で扱う。
5. 隠し設定は原則としてユーザー向けプロフィール画面に全公開しない。**会話の中で自然に発見される体験を優先する。**
6. Relationshipの深さと会話文脈に応じて、美咲自身の自己開示の深さ・粒度を変える。
7. 単純な「Stage Nで情報解禁」にはしない。関係が浅い、質問が唐突、踏み込みが強い等の場合、美咲自身の境界線として自然にぼかす・かわすことを許す。
8. 一度ユーザーへ開示した美咲自身の情報は「開示済み」として記録し、後から知らない前提へ戻らない。
9. 開示済み情報は二人の共有された過去として、その後の会話で自然に参照できるようにする。
10. Relationshipが深まるほど自己開示も自然に深くなり、自己開示そのものが関係形成の体験になる。

初期設計対象候補:
- 仕事: 職種、勤務時間、休日、通勤、残業、在宅勤務等
- 家族: 両親、兄弟姉妹、家族との関係、実家
- 住まい: 居住エリアの粒度、一人暮らしか、住居の雰囲気
- 過去: 出身、学生時代、職歴、恋愛歴をどこまで持たせるか
- 日常: 起床・就寝、料理、買い物、休日の過ごし方、よく行く場所
- 人間関係: 友人、職場の人間関係等

重要なUX例:
- 出会ったばかりの相手に、住んでいる場所などをいきなり細かく教えない。
- 関係が浅ければ「東京だよ」程度、関係・文脈が自然に育てばもう少し具体的に話す、など自己開示粒度を変える。
- ただし一度話した「妹がいる」等の事実を後で隠したり矛盾させたりしない。

今回この必要性が顕在化した実走例:
- 深夜00:28頃の通常会話で、美咲が「まだ起きてるよ。仕事中だもん」「夜は静かだから逆に集中できちゃってね」と即興生成した。
- canonicalな勤務・生活設定が未定義なため、その場で生活背景をモデルが作れてしまう。
- 今後「昨日は夜勤、今日は昼勤務、休日にも仕事」のような人物矛盾を防ぐ必要がある。
- 例として「平日9〜17時、土日祝休み」等は設計候補だが、具体的勤務設定は後でオーナーと決定する。現時点で確定値にはしない。

目指す循環:
> **美咲の隠し人物設定 → 関係・文脈に応じた自己開示 → 開示済み情報を記憶 → 二人の共有された過去になる → さらに自然な自己開示へ**

**実装タイミング:** Relationship Engine v1.1の3日Production実走中はpersona/runtimeを変更しない。実走判定後に人物設定書・自己開示契約・保存モデルを設計してから実装へ進む。

#### 次の一手
LPの企画・修正へ戻らない。最優先は引き続き、**Relationship Engine v1.1の3日Production実走を完走し、Pattern→State→Interpreterまでを自然利用で確認すること。**

検証時の注意:
- Productionで日付をbackdateしない
- 1日内で大量に同じ好意発言を送ってPattern成立を捏造しない
- critical relationship eventは不用意にProductionで試さない
- Stateが変わったらscoreそのものより、Interpreterが会話の距離感へどう反映したかを見る
- 失敗時はchat成功とRelationship eventual処理を混同しない

完走後:
1. Pattern→State実走確認
2. Relationship Interpreter表現品質確認
3. Body Clock / shared Reply Core統合
4. 新6段階親密度の閾値決定
5. 5-heart UI
6. Gemini telemetry蓄積後にFree / Premium経済設計を再評価

> **未来のソラへ**
> PR #62のLP刷新とPR #63のPWA mobile overflow hotfixはmerge・iPhone実機確認まで完了した。旧「最初から彼女」LPへ戻すな。LPレビューやPWA見切れ修正からやり直すな。
> Relationship Engine v1.1はProduction稼働中で、次の本丸は3日Pattern→State→Interpreterの実走確認。
> PR #61 telemetryはProduction READYで自然蓄積中。Premium 50回は未実装・未確定。
> **未来のソラを信用するな。総覧を信用しろ。**


---

### 2026-10-07 — Memory v1 再設計方針（オーナー合意 / 未実装）

#### 背景
現行の会話正本は `misaki_user_conversation_state` の `history / memory / today_memory`。通常チャット成功時は Body Clock 側の `recent_history / long_term_memory / today_memory` も同期される。通常reply runtimeでは `MAX_HISTORY=60 / MAX_MEMORY=30 / MAX_TODAY_MEMORY=12`。また `[life:v1]` の構造化Life Factが通常memoryと同じ30枠を共有している。

現状は長期memoryをUIの×で削除しても、直近historyが残るためMemory RecallやUser Profile経由で同じ事実を再参照できる余地がある。したがって「記憶項目を消す」「会話で忘れてと言う」「履歴を消す」を同一操作として扱わない。

#### 目標モデル
Memoryを次の責務へ分離する。

1. **User Memory — ユーザー自身についての長期情報**
   - 名前・呼び方、仕事、家族、嗜好、習慣、価値観等。
   - 現行 `memory` はまず互換性を保ったままこの役割として扱う。
   - 将来は固定30件FIFOではなく、構造化・重要度・更新/訂正を持つ。
   - 安定した重要プロフィールが件数上限だけで押し出されない設計を目指す。

2. **Shared Memory — 二人が後で思い出せる出来事**
   - 「二人に何があったか」を保持する共有エピソード。
   - 初めての出来事、二人だけの冗談/呼び方、約束、感情が大きく動いた会話、関係上の節目、後日参照価値の高い出来事等を厳しく選ぶ。
   - 日常の全turnを保存しない。
   - User Memoryの30枠へ混ぜず、独立したcanonical領域を新設する。
   - DBには十分保持できても、replyへ毎回全件注入しない。現在話題に関連する**原則0〜3件**だけを想起候補として渡す。
   - 検索されたShared Memoryを必ず発話へ出すのではなく、自然に関係するときだけ参照する。
   - v1では古いmemoryを自動削除/自動圧縮しない。実データ量・重複傾向を観測後に統合/圧縮を設計する。

3. **Relationship Memory — 関係がどう育ったか**
   - 既存Relationship Engine v1.1の Evidence → Episode → Pattern → State を正本として維持する。
   - Relationship Episodeは関係性計算の内部証拠、Shared Memoryは美咲が「あのとき」と思い出すための記憶。意味が異なるため同一化しない。
   - Shared MemoryからRelationship Stateを直接更新しない。Relationship EngineからShared Memoryを機械的にコピーしない。同じ会話を別目的で独立判定する。

運用上の `history` は「今の会話文脈」、`today_memory` は「当日文脈」であり、上記の長期Memory層とは区別する。

#### Forget Control v1
「忘れる」と「削除」を分離する。

- **Soft Forget（会話上の『忘れて』）**
  - 対象をactive User Memoryから外し、美咲が自発的に持ち出さない。
  - 古いhistory / recall / User Profile / Natural Memory更新 / Shared Memory検索 / Body Clock等から勝手に復活させないため、忘却制御をreply生成入口で共通適用する。
  - 過去履歴を物理削除したことにはしない。
  - 後日ユーザー自身が同じ事実を明示的に再提示した場合は再学習可能とする。「過去から勝手に復活」は禁止、「現在ユーザーが再度教える」は許可。

- **Hard Delete（記憶UIからの明示削除）**
  - canonical User Memory項目を削除するデータ管理操作。
  - 古い履歴から自動再登録しないようForget Controlを適用する。
  - **チャット履歴そのものの削除とは別操作。** 現行UIの×を「保存データ全域から完全消去」と説明してはならない。
  - 将来、履歴や派生保存先を含む完全消去を提供する場合は別の明示操作・削除契約として設計する。

Forget Controlの保存形式は実装前に確定する。単純な文字列ブラックリストではなく、対象・由来・状態・再学習条件を安全に判定できるcanonicalな制御情報を想定する。忘れた事実そのものをtombstoneへ保持する場合はプライバシー上の意味を別途評価する。

#### Shared Memory v1 DB / runtime方針
新規canonicalテーブル（仮称 `misaki_shared_memories`）を想定。少なくとも以下の概念を持つ。

- id / user_id
- summary
- occurred_at
- importance
- topics
- emotion
- source_request_ids
- last_recalled_at / recall_count
- status
- 将来統合用 merged_into

生成は通常チャットのcanonical commit成功後。毎turnを候補判定しても、採用は厳しくする。Shared Memory生成失敗で通常チャット成功を巻き戻さない。重複・同一出来事は新規乱造せず既存memoryの更新/統合候補とする。

reply時の基本形:
```
直近会話
+ 関連User Memory
+ 関連Shared Memory（原則0〜3件）
+ Relationship State / Interpreter
↓
Forget Control
↓
reply生成
```

#### 実装順
1. Forget Controlのschema/semanticsと回帰テストを確定
2. Forget Controlを通常reply / recall / profile / memory更新 / Body Clock等の参照入口へ適用
3. Shared Memory canonical table + 保存/重複防止
4. 関連Shared Memoryの取得（原則0〜3件）
5. reply promptへ参考情報として統合
6. Memory UI整理
7. Production実データ観測後に統合・圧縮を設計

#### 必須テスト
- UI×でUser Memory正本が削除される
- 会話上の「忘れて」でSoft Forgetが成立する
- 直後のMemory Recallが古いhistoryから対象を復活させない
- history 60件以内/外の双方で意図どおり
- User Profile派生で対象を復活させない
- Body Clock / proactiveで対象を自発参照しない
- ユーザーが後日明示的に再提示した場合は再学習できる
- 嗜好変更・訂正が古い値と重複しない
- Shared MemoryがUser Memory / Relationship Stateを直接書き換えない
- Shared Memory生成失敗が通常chat成功を壊さない
- 関連Shared Memory 0件でも自然にreplyできる
- Relationship Engine v1.1のEvidence/Episode/Pattern/State semantics、oldest-first、fail-closed、START_ATを変更しない
- 匿名→メール保存、別端末復元、Free/Premium、Body Clock同期に回帰がない

#### UI別件 — Memory表示とチャットスクロール（未実装）
現行 `app/chat/page.tsx` には固定右上メニューから「美咲の記憶」を開く入口がすでにある。問題は入口ではなく、Memory panelが通常document flow内に描画されるため、閲覧時にチャット位置を乱し得る点。将来はmodal/overlay等で開き、閉じたら元のチャットscroll位置へ戻るUXを優先する。

また、送信後の「・・・・」生成表示付近などでチャットが数行上へ勝手に動く実機症状を確認。reply挿入、生成indicator、画像load、history同期、input高さ変化等を含むscroll-control競合として横断調査する。**未修正なので修正済み扱いしない。**

#### Work実装境界 / 壊してはいけない原則
- 既存canonical root、匿名暗号化root、通常chat atomic commitを独断で置換しない。
- 現行memoryを一括migrationして消失させない。段階移行する。
- Relationship Engineの意味論をMemory都合で変更しない。
- 「件数を30→100に増やすだけ」をMemory再設計の完成としない。
- Shared Memoryを毎turn保存しない。
- 検索された過去を毎回セリフに出さない。
- UI×を「履歴を含む完全消去」と誤表示しない。
- Forget ControlはNatural Memoryだけでなく、再想起し得る全主要経路で一貫して効かせる。

**現在位置:** Memory v1は設計合意まで。コード/DB migrationは未実装。次はWork向け実装仕様をこの節に従って作成し、まずForget Controlから段階実装する。


---

### Work handoff — Forget Control v1 第1工事（2026-10-07 / 実装前仕様）

#### 工事目的
Memory v1全体を一度に実装しない。第1工事は**Forget Controlだけ**を導入し、「User Memoryから消した情報がhistory等から勝手に復活する」経路を止める。Shared Memory、Memory検索高度化、Relationship Engine変更、30件上限撤廃はこのPRへ混ぜない。

#### 実装契約
1. canonicalなforget-control保存先を新設する。恒久ユーザーだけでなく匿名root→メール保存の連続性も壊さないこと。
2. controlは少なくとも `soft_forget` と `hard_delete` の由来を区別できること。ただし両者とも「過去文脈からの自動復活禁止」を共通適用する。
3. 忘却対象の判定を生の完全一致文字列だけに依存させない。対象概念を安全に識別できる構造を持たせる一方、忘れたセンシティブ事実を不要に複製保存しない。
4. 現在turnでユーザー自身が対象情報を明示的に再提示した場合だけ、再学習/forget解除候補にできる。古いhistory、既存profile、モデル推測を解除根拠にしない。
5. Forget適用後のcontextを、少なくとも通常reply、Memory Recall、User Profile生成、Natural/User Memory更新、Body Clock/proactiveが共有できる設計にする。各所に独自の場当たり文字列filterを複製しない。
6. UIの既存×はUser Memory項目削除 + hard-delete control作成を同じcanonical操作として扱い、片方だけ成功する中間状態を作らない。可能なら同一RPC/transaction境界で行う。
7. 会話上のSoft Forgetは、通常replyの成功保存と整合するcanonical更新として扱う。モデルが「忘れた」と返しただけでcontrolが保存されない状態を完成扱いしない。
8. Forget Control自身の失敗時に、削除/忘却が成功したようなUI・replyを返さない。データ管理操作はfail closed。
9. forget対象がない、既にforget済み、同じrequestの再送は冪等に扱う。
10. 履歴そのものは第1工事では物理削除しない。既存 `clearHistory` の意味も変更しない。

#### 推奨データモデル
具体的なDDL名は既存命名規約へ合わせてよいが、概念上は次を満たす。

```
forget_control
- id
- canonical owner/root key
- target_key          // 正規化した概念識別子。生の秘密情報そのものを主キー化しない
- target_type         // person/name/preference/fact 等。v1で必要最小限
- mode                // soft_forget | hard_delete
- status              // active | released
- source_request_id   // 冪等性・監査
- created_at
- released_at
```

target_key生成・照合は誤爆を最小化すること。「隆紀」をforgetしたから同じ文字列を含む無関係な文脈を全削除、のような実装は禁止。v1で安全な概念同定が困難なケースは無理に自動forgetせず、明示対象だけを扱う。

#### 参照時の共通フィルタ
Forget適用順は原則:
```
canonical root/history/memoryを取得
→ active forget controls取得
→ current user turnから明示的な再提示があるか判定
→ 忘却対象をmemory/context/profile材料から除外
→ recall/profile/reply/body-clockへ渡す
```

**重要:** current user turnそのものを隠してはいけない。ユーザーが「隆紀のことは忘れて」と言っているturnまで消すと意図判定できない。一方、過去historyにある「弟は隆紀」は生成根拠から除外する。

#### UI×の契約
現行 `/api/persona/history` の `deleteMemory` はcanonical memory削除を行う。この第1工事では、同じ操作にhard-delete controlを原子的に結び付ける。画面文言は「この記憶を美咲から削除しますか？」程度とし、**会話履歴も完全消去されるとは表示しない**。

#### Soft Forget検出
「忘れて」「その話は覚えないで」等の自然言語意図を扱う。単純キーワードだけで対象を決めない。対象が曖昧なら、別の人物/事実を誤ってforgetするより確認またはno-opを優先する。

第1工事ではSoft Forgetを一般的な会話memory更新の副作用として曖昧に処理せず、**forget intent → target extraction → canonical write** の追跡可能な経路にする。

#### 再学習 / release
active controlを解除できるのは、現在turnでユーザー本人が対象事実を再度明示し、再学習の意図が十分明確な場合だけ。単に対象名が出ただけで自動解除しない。v1では保守的に運用し、曖昧ならactiveのままにする。

Hard Deleteも「ユーザーが後で新しく教え直した情報」は新しいUser Memoryとして保持可能。ただし古いhistoryを根拠に復元してはならない。

#### 匿名→メール保存
匿名利用でもForget Controlを一時canonical rootと整合して保持し、メール保存時にUser Memory/historyと同じcheckpoint境界で恒久側へ一度だけ引き継ぐ。再試行でcontrolが重複しない。既存の匿名保存再試行・checkpoint semanticsを変更しない。

#### Body Clock / proactive
長期memoryだけをfilterして終わりにしない。Body Clockが持つ `long_term_memory` / `recent_history` 等のsnapshotからもforget対象が生成根拠へ入らないことを確認する。既存の配送間隔、claim、Push、写真selector、emotion/action/directionは変更しない。

#### Relationship Engineとの境界
Forget ControlはRelationship Evidence/Episode/Pattern/Stateを削除・巻き戻し・再計算しない。忘れた事実の細部と、その過去のやり取りで形成された関係状態は別物として扱う。Relationship Analyzer v1.1のsemantics、oldest-first、fail-closed、retry、START_ATに変更を入れない。

#### 必須自動テスト
最低限:
1. User Memoryに人物事実を保存 → UI delete → memoryから消える + active hard-delete control
2. 同じ事実が直近history内に残る → recall質問 → 古い事実を答えない
3. User Profile生成 → forget対象を含めない
4. 通常reply → forget対象を自発参照しない
5. Body Clock/proactive context → forget対象を含めない
6. Soft Forget → active control + User Memory除外
7. forget後に古いhistoryだけ存在 → Natural Memory更新で再登録しない
8. current turnで明示的に再教授 → 規定条件を満たせばrelease/再学習
9. 無関係な同名/部分一致を誤削除しない
10. 重複request / 二重delete / 二重forgetが冪等
11. 匿名forget → メール保存 → 別端末復元後もforget維持
12. forget-control write失敗時に成功扱いしない
13. Free/Premium quota/refund、通常chat atomic saveに回帰なし
14. Relationship Engine既存テスト全合格
15. Body Clock既存テスト全合格

#### 実機受入テスト
代表シナリオ:
```
A: 「弟の名前は隆紀だよ」
→ 美咲が覚える

B: 「隆紀のことは忘れて」
→ Soft Forget成立

C: 直後「弟の名前覚えてる？」
→ 「隆紀」と古いhistoryから復活させない

D: 数十turn後に同じ質問
→ 同様に復活させない

E: 後日ユーザーが「弟の隆紀がさ…」と明示的に再提示
→ 仕様条件に従い再学習可能
```

UI×についても同じC/Dを確認する。ただし「履歴から完全消去された」とは判定しない。

#### PR完了条件
- migration / rollback方針が明示されている
- 既存データを破壊的に一括変換しない
- TypeScript / production build / full test suite成功
- 新規Forget Control tests成功
- PreviewでUI deleteとSoft Forgetの代表シナリオ成功
- Production migration/mergeは、レビューで既存canonical root・匿名保存・Body Clock・Relationship Engineへの影響を確認してから
- Production実機で代表シナリオを確認するまで「Forget Control完成」と記録しない

#### このPRでやらないこと
Shared Memory table/生成/検索、Memory 30件上限変更、Life Fact全面migration、Memory modal化、scroll jump修正、Relationship Engine変更、新6段階/5-heart UI、人物設定/自己開示は別工程。

**Workへ:** まず最新mainと本総覧を読み、実装前に現行 `app/api/chat/route.ts`、`app/api/persona/history/route.ts`、canonical root RPC/migration、匿名root保存、Body Clock memory参照経路を再照合すること。総覧と実装が食い違えば勝手に合わせず、差分を報告してから施工する。


---

### 将来構想メモ — Misaki World / 複数キャラクター（2026-10-07・アイデア段階 / 未実装）

Relationship Engine / Relationship Identity を、美咲ひとりに閉じた仕組みにせず、将来は複数の女の子が同じ世界に存在できる余地を残す。

構想例:
- 関係状態は将来的に `user × character` 単位へ一般化できる設計を意識する。
- ユーザーは美咲と仲良くなる・恋人になる・別れるだけでなく、別キャラクターと別の関係を育てられる可能性がある。
- 過去の関係は消去せず歴史として残り、元恋人・親友・相棒など、そのキャラクターとの積み重ねを将来の会話へ自然に反映できる余地を持たせる。
- 将来拡張する場合は、二者間の `Relationship`、世界で起きている事実の `World State`、各キャラクターが何を知っているかの `Character Memory` を混同しない。
- 現行v1の実装対象はあくまで美咲一人。複数キャラクター、キャラクター間認知、嫉妬・交際競合等は今回実装しない。
- ただしRelationship Identity等の新設計を「Misakiという固有キャラクターしか存在できない」形へ不要にベタ書きしない。

#### 恋愛Statusの境界メモ
恋人は5軸の数値だけでは成立・解消しない。交際成立・別れは会話から確定するCanonical Event / Statusとして扱う。現時点では婚姻のような現実世界の排他的な社会契約をStatusとして実装しない。プロポーズ等の会話そのものは将来の大きな共有出来事になり得るが、`spouse` 等のStatus追加は未決・未実装。

> **位置づけ:** これはロードマップ確定事項ではなく「総覧の端に残す将来構想」。まず美咲一人でRelationship Engine → Identity → 明示的な交際成立 → 関係継続 / 別れまでを完成させる。将来横展開するときに、現在の設計が拡張を不必要に阻害しないための設計メモとして保持する。


#### さらに先の将来構想 — 婚姻・世界共有・ユーザー間接点（アイデア保管 / 未実装）

複数キャラクター構想をさらに進めた場合の思考メモ。**現行ロードマップへは入れず、実装もしない。**

- 一人のキャラクターが複数ユーザーとそれぞれ別のRelationship Historyを持てる世界観は許容し得る。恋人関係そのものを一律に排他的とはしない。
- 将来「結婚」を扱う場合は、通常の恋人Identityとは別の明示的なCanonical Event / Statusとして設計し、配偶関係は原則一人という世界ルールを持たせる案がある。
- 結婚を入れるなら離婚も明示イベントとして必要になる。離婚後も「かつて結婚していた」という履歴は消さず、二人の関係史として残す。
- 婚姻中に別キャラクターとの恋愛関係が成立する等の複合状態も、専用シナリオを直書きするのではなく、複数Relationship + World Stateから意味を解釈できる余地を持たせる。ただし具体的な倫理観・境界・キャラクター反応は未決。
- さらに世界を共有する方向へ進めば、AIキャラクターを介してユーザー同士に間接的な接点が生まれる可能性がある。
- その場合でも、他ユーザーの私的会話・Memory・個人情報を本人の明示的同意なく別ユーザーへ伝播させない。ユーザー間共有は明確なopt-inと公開範囲の分離を前提とする。
- 将来の概念分離は少なくとも `Relationship（特定の二者間）` / `World State（世界で成立している事実）` / `Character Knowledge（各キャラクターが知っている事実）` を維持する。あるキャラクターの記憶・発言を、別Relationshipのcanonical truthとして扱わない。

> **封印メモ:** 最初の動機は「1対多では結婚を扱いにくいなら、多対多の世界ならどうか」という雑談から。発展すると社会シミュレーション規模になるため、ここでいったん閉じる。現在の優先事項は美咲一人のRelationship Engine / Identity / 会話品質を完成させること。将来必要になったときだけ、このメモを再び開く。


---

### Work handoff — Relationship Identity v1（2026-10-07 / 実装前仕様・コード未実装）

#### 目的
既存 Relationship Engine v1.1 の Evidence → Episode → Pattern → 5-axis State を変更せず、その後段に「現在の二人はどういう関係か」を表す Relationship Identity を追加する。Identity は単一のレベル階段ではなく、同じ親密度でも相棒・親友・大切な人等へ分岐できる関係の形である。

基本パイプライン:
```
Canonical Event / Status
→ active Relationship Constraint
→ Identity History
→ canonical 5-axis State
→ Traits / Awareness
→ Identity candidate
→ adjacency / continuity
→ hysteresis
→ Primary Identity
→ Relationship Acting Guide
→ shared Reply Core / Gemini
```

**Patternを二重に数えない。** 5-axis Stateは既に3独立Tokyo日のPatternを通ったcanonical結果なので、Identity昇格のためにもう一度3-day Patternを要求しない。

#### v1 Primary Identity（表示可能な関係名）
1. 顔見知り
2. 話し相手
3. 友達
4. 気の合う友達
5. 信頼できる友達
6. 相棒
7. 親友
8. 大切な人
9. 気になる人
10. 特別な人
11. 恋人

`相談相手` はPrimary Identityではなくtrait/roleとして扱う。`惹かれ合う二人` はMisaki側の相互性をcanonicalに判定できる仕組みがないためv1対象外。

#### Identityと他状態の責務
- Hearts / intimacy = 関係の深さ。Identityの一本道レベルではない。
- 5 axes = friendship / trust / playfulness / affection / romance の蓄積品質。ユーザーへ数値表示しない。
- Primary Identity = 現在の二人の関係の安定した名前。UIとMisakiの自己認識で共有する。
- Traits / Awareness = Primary Identityを変えずに表現できるニュアンス。初期候補: `comfortable`, `deep_trust`, `playful_sync`, `strong_affection`, `romantic_awareness`。
- relationship_status = 明示的に成立したcanonical事実。Identityから書き換えない。

#### 絶対ルール
1. `relationship_status=romantic_partner` のときPrimary Identityは `恋人`。
2. 5軸がどれだけ高くても、scoreだけで `恋人` にしない。
3. 5軸が低下しても、scoreだけで交際終了にしない。
4. 交際成立・別れはvalidated Canonical Event / Statusのみで変更する。
5. `romantic_rejection`, `relationship_end`, `boundary_event` 等の明示事実・制約はscore由来Identityより上位。
6. current turnで発生したState/Identity変更は既存v1.1と同様、原則次turnから会話表現へ反映する。現在replyへ遡及させない。
7. candidateが分類不能なら無理に関係名を作らず、現在Identityを安全に維持する。
8. Identityを毎turn 11種類から再選挙しない。現在Identityの維持判定→近傍candidate→hysteresisの順。
9. entry条件とmaintenance条件を分ける。成立済みIdentityは小さなscore変動で降格・横滑りさせない。
10. Resolver/APIは可能な範囲で固有名 `Misaki` に依存させずRelationshipドメインとして書く。ただしv1 DB/runtimeを複数character対応へ拡張する工事はしない。

#### 自然な隣接関係
```
顔見知り
  ↓
話し相手
  ↓
友達
 ├─ 気の合う友達 ──→ 相棒 ─────┐
 ├─ 信頼できる友達 ─→ 親友 ─────┼→ 大切な人
 │                       │        │
 └─ 気になる人 ─────────┼────────┘
                         ↓
                      特別な人
                         ↓
                 [明示的な交際成立]
                         ↓
                        恋人
```
これは必須通過ルートではない。canonical stateが十分変化した場合のskip余地は残すが、通常は近傍遷移を優先する。逆方向もあり得る。

#### 意味境界
- 相棒: friendship + trust + 強いplayfulness。一緒に動く/阿吽の呼吸。romance不要。
- 親友: friendship + 深いtrust + affection。弱さを預けられる。軽いromance上昇だけで `気になる人` へ置換しない。
- 大切な人: trust + 強いaffection。「大事にしたい」。romance不要。
- 気になる人: 関係の土台がある上でromantic awarenessが芽生えた状態。romance単独上昇では成立させない。
- 特別な人: trust + affection + 十分なromance。「普通の友達だけでは説明しにくい」が、交際成立を意味しない。
- 恋人: explicit mutual dating成立のみ。score classifier対象外。

#### Traits / Awareness
Primary Identityと別に導出する。例:
- `親友 + romantic_awareness`
- `相棒 + strong_affection`
- `友達 + deep_trust`

これにより、親友のromanceが少し上がっただけでPrimary Identityを `気になる人` に壊さない。既存Acting Guideのromance 45/80、very-high trust/playfulness/affection等の演技方向はIdentity/traitsへ整理して接続し、二重promptを作らない。

#### Hysteresis / continuity
- entry threshold > maintenance threshold を原則とする。
- candidate発生だけで即切替しない。現在Identityを維持できるなら維持する。
- 別candidateが十分かつ継続的に優勢になった場合だけ遷移する。
- 1日の甘い会話、喧嘩、romance spike等でpromotion/demotionさせない。
- 数値閾値は本仕様時点では未freeze。仮classifier値をそのままProduction定数へコピーしない。
- classifierは最低軸、相対shape、全体depth、current identity、canonical constraintsを扱い、巨大な単純if/else閾値表だけにしない。

#### Breakup / rejectionの特別処理
`relationship_end` はhysteresisより上位で、`恋人` Identityを即時解除する。ただし5-axis Stateは削除・リセットしない。

重要: breakup直後に残存する高romance/trust/affectionだけを見て、自動的に `特別な人` や `親友` へ再分類してはならない。「昨日まで恋人だった二人」を通常の高score友人と同一視しない。

そのためIdentity History / Relationship Constraintに、少なくとも「交際終了後で関係再形成中」であることを表現できる内部状態を持たせる。これはv1 Primary Identityを12個へ増やす意味ではない。表示Identityを一時維持/保留する具体UXは実装前レビューで確定する。

`romantic_rejection` 後も同様に、古い高romanceからromantic Identityへ即promotionしない。拒絶前に成立していた安全な友情Identityがあれば、そのcontinuityを優先する。rejection/boundaryの解除条件をscore低下だけにしない。

#### 仮classifierで確認済みの代表形（閾値freezeではない）
- 相棒型 F90/T82/P92/A60/R5 → 相棒
- 親友型 F90/T95/P50/A85/R5 → 親友
- 大切な人型 F75/T90/P35/A95/R10 → 大切な人
- 恋愛の芽 F60/T55/P40/A55/R55 → 気になる人
- 特別な人型 F78/T82/P50/A85/R75 → 特別な人
- 高romance孤立 F25/T15/P20/A20/R95 → romantic Identityへしない / 分類拒否可能
- 親友+恋愛意識 F90/T95/P50/A90/R55 → 親友 + romantic_awareness

親友型 F90/T95/P50/A85 でromanceを0→100へ振った仮試験では、R0–60が親友、R65以降が特別な人candidateになった。ただし65はProduction閾値ではなく、hysteresis前candidateの探索値に過ぎない。

#### Resolver I/O（概念契約）
入力:
- canonical 5-axis state
- relationship_status
- validated recent critical event / active constraint
- current Primary Identity
- Identity history / last transition metadata
- current relationship state version
- 必要ならintimacy stage（補助。source of truthにはしない）

出力:
- `primaryIdentity`
- `traits[]`
- `candidateIdentity | null`
- `constraintState`
- `transitionDecision: maintain | promote | demote | lateral | canonical_override | hold`
- `reasonCode`（監査/テスト用。ユーザーへ表示しない）
- `identityVersion`

Resolverは台詞を生成しない。score/status/eventを変更しない。Geminiへ生の閾値や内部reasonCodeを説明させない。

#### 永続化方針
hysteresisと履歴依存があるため、Primary Identityは完全な都度導出だけにしない。少なくともcurrent identity / identity_since / version / transition history相当をcanonicalに保持する方向。

ただし**DDLは未確定**。Workはmigrationを書く前に現行Relationship schema/RPC/migrationsを再照合し、既存canonical root・匿名→メール保存・temporary relationship importと整合する具体案を提示すること。Traitsはv1では原則都度導出し、不要に永続化しない。

#### Acting Guide接続
既存 `createRelationshipActingGuide()` を置換するのではなく拡張する。概念上:
```
canonical relationship state
→ resolveRelationshipIdentity(...)
→ createRelationshipActingGuide({
     ...fiveAxes,
     relationshipStatus,
     primaryIdentity,
     traits
   })
→ Gemini
```
Acting Guideは従来どおり「演技方向」であり台詞ではない。Identity名を毎回答えに言わせない。「俺たちってどういう関係？」等の文脈では、Primary Identity + historyを根拠にMisaki自身の言葉で自然に答えさせる。

#### 必須回帰 / stress tests
1. ♥5相当でも `相棒` / `親友` / `大切な人` が別々に成立可能。
2. 親友 + mild romance → `親友 + romantic_awareness`。即 `気になる人` にしない。
3. romance=100でもexplicit datingなし → `恋人` にならない。
4. romance単独spike + 他軸低 → romantic Identityへteleportしない。
5. explicit `romantic_acceptance` → status `romantic_partner` → Identity `恋人`。
6. 恋人中にscore低下 → scoreだけでは別れない。
7. `relationship_end` → 恋人Identity即解除。高い旧romanceから即 `特別な人` へ戻らない。
8. `romantic_rejection` → 高romanceが残ってもromantic Identity promotionを抑制。
9. active `boundary_event` がscore由来candidateより優先。
10. 小さなState変動でIdentityがflapしない。
11. candidate分類不能 → current Identityを安全に維持。
12. current-turn変更が同turn replyへ遡及しない。
13. pending explicit relationship event中に交際成立/復縁を先取りしない。
14. Identity Resolver追加でEvidence/Episode/Pattern/State semantics、oldest-first、fail-closed、retry、lease/idempotencyを変更しない。
15. legacy relationshipPoints guideを再び二重にpromptへ入れない。
16. 匿名→メール保存/別端末復元でもIdentity continuityを壊さない。
17. 将来拡張を意識し、Resolver単体テストが固有名Misakiなしでも成立する。

#### このPRでやらないこと
- Relationship Engine v1.1の5-axis計算変更
- 新6段階Hearts閾値freeze / 5-heart UI実装
- Body Clock shared Reply Core最終統合
- Forget Control / Shared Memory変更
- 複数character DB化 / `character_id` migration
- World State / Character Knowledge
- 結婚 / 離婚 / 不倫 / user-user接点
- `spouse` 等の新canonical status
- PR #66への混入

#### 実装開始前ゲート
Relationship IdentityはPR #66とは別PRにする。Workはまず最新main・本総覧・Relationship schema/migrations・`relationship-runtime-v1.ts`・`relationship-processing-v1.ts`・`relationship-acting-guide.ts`・chat接続点を再照合する。DDL/閾値を独断freezeしない。

**現在位置:** Identityの意味論・precedence・履歴/hysteresis・breakup/rejection方針・Resolver I/Oまで実装前仕様化。次は現行DB schema/RPCとの突き合わせ → 最小canonical persistence案 → Work施工範囲確定。Productionは未変更。


#### Relationship Identity v1 — canonical persistence / Work施工境界（2026-10-07）

現行Relationship schema/RPC/runtimeとの再照合結果から、Identityは `misaki_relationship_state` へ列追加して混在させず、**既存Relationship Engineのcanonical出力を購読する独立した第二層canonical** とする。

理由:
- `misaki_relationship_state` は既に5-axis + `relationship_status` + `relationship_state_version` の正本であり、Pattern適用/critical event/import RPCがロックして更新する。
- Identityはcurrent identity、hysteresis、constraint、transition historyという別のライフサイクルを持つ。
- Identity失敗が5-axis State/critical eventのcanonical commitを巻き戻したり破損させてはならない。
- 将来Identity Resolverだけをversion up/交換できる境界を保つ。

##### 最小DBモデル（名称はWork実装前レビューで既存命名規約と照合）
1. Identity current-state table（例: `misaki_relationship_identity_state`）
   - `user_id` primary key
   - `primary_identity`
   - `identity_since`
   - `identity_version`
   - `resolver_version`
   - `source_relationship_state_version`
   - `constraint_state`（構造化可能な値。自由文をcanonical意味論にしない）
   - `constraint_since` / 必要ならsource critical event id
   - `updated_at`

2. Identity transition ledger（例: `misaki_relationship_identity_transitions`）
   - immutable/idempotent transition record
   - `user_id`
   - source request/event/state-version key
   - `from_identity`
   - `to_identity`
   - `transition_decision`
   - `reason_code`
   - `resolver_version`
   - `source_relationship_state_version`
   - before/after identity state（監査に必要な最小構造）
   - `created_at`
   - 同一source/versionの再実行で二重transitionを作らないunique boundary

**Traits/Awarenessはv1では原則永続化しない。** canonical 5-axis + current Identity + constraintから都度導出する。表示用説明文やGemini生成文もcanonical tableへ保存しない。

##### Identity apply RPCの責務
Identity専用RPCは次だけを行う:
- user ownership / source canonical relationship state versionを検証
- stale source versionを拒否または安全なreplayとして処理
- current Identity rowをlock
- resolverが返したtransition decisionを許可されたenum/domainとして検証
- current state更新 + transition ledgerを同一transactionでcommit
- idempotent replayで二重transitionを作らない

Identity RPCは以下を**絶対に変更しない**:
- friendship/trust/playfulness/affection/romance
- `relationship_status`
- Evidence / Episode / Pattern
- Relationship Engine processing ledger
- critical event validation結果

また、DB RPC自身に複雑な分類ロジックを二重実装しない。Resolverの意味論はTypeScript側を主とし、DBはcanonical consistency / concurrency / idempotency boundaryを担当する。

##### Resolver実行タイミング
通常恒久ユーザー:
1. chat成功 → canonical `chat_turn_completed`
2. 既存Relationship Engine v1.1を従来どおり処理
3. critical event / Pattern→Stateの処理がそのturnについて確定
4. **確定済みcanonical relationship state/versionを読む**
5. Relationship Identity Resolverを実行
6. Identity専用RPCでapply
7. 次turn以降、Reply Core/Acting GuideがそのIdentityを読む

Identityをchat成功の同期クリティカルパスへ入れて、Identity失敗で成功済みchat/quotaを失敗扱いにしない。既存のafter()/retry思想に合わせ、失敗時はIdentity側を再試行可能にする。

重要: Patternが無いturnでは既存State RPCはversion-only mutationをしない。Identityも毎turn無意味にversionを増やさない。canonical relationship state/event/constraintにIdentity判断上の新しい入力がない場合はno-op/replayとする。

##### Critical Event
`romantic_acceptance` / `relationship_end` 等はscore Stateより強い入力である。Identity workerは最新validated critical event/statusを入力に含める。

- `romantic_acceptance` → canonical statusが `romantic_partner` ならIdentity=`恋人` をcanonical override。
- `relationship_end` → `恋人` を即解除し、post-breakup constraintを開始。旧scoreだけで `特別な人` / `親友` へ即再分類しない。
- `romantic_rejection` → romantic promotion suppression constraintを開始し、既存の安全な非恋愛Identity continuityを優先。
- `boundary_event` → boundary constraintがcandidateより上位。
- `reconciliation` はそれ自体を自動的な `romantic_partner` 復帰と同義にしない。現行critical-event semantics/status更新規則を尊重する。

Constraintの解除を単純な時間経過やscore閾値だけで決めない。明示eventまたは十分な新しいcanonical関係形成を必要とする具体ルールはResolver fixtureでfreezeする。

##### 匿名 / メール保存
匿名temporary rootでもRelationship Identity continuityを保持する。Identityを恒久ユーザーだけの後付け機能にしない。

- temporary Relationship SnapshotにIdentity current state/historyに必要な最小情報をversion付きで保持する。
- 匿名中も同じpure Resolverを使う。
- メール保存時、5-axis/statusとIdentityを同じcheckpoint由来として恒久canonicalへ一度だけmaterializeする。
- import replayでIdentityを二重遷移させない。
- 追加会話を含む保存再試行でもcheckpoint/source revision整合を壊さない。
- 別端末復元後、Identityが初期値へ戻らない。
- anonymous expiryは既存fail-closed/0戻し防止思想を維持する。

既存 `import_misaki_temporary_relationship_v2` へIdentity責務を無造作に追加してRelationship Engine importを肥大化させるか、Identity専用import RPCを同じcheckpoint boundaryから呼ぶかは、migration実装前にatomicity/retry fixtureを比較して決定する。**「保存できた5軸と保存できなかったIdentity」が恒久状態として長時間残る設計は禁止。**

##### Worker / ordering
IdentityはRelationship Engineより後段。Identity処理が先行して未確定Stateを読むことを禁止する。

恒久処理の概念順:
```
relationship turn claim/processing
  → critical validation/apply
  → evidence/episode/pattern/state apply
  → relationship processing applied
  → identity input snapshot
  → identity resolve
  → identity canonical apply
```

既存Relationship Engineのlease ownershipをIdentity RPCへ雑に流用しない。Identityを同一lease内でatomicに続行する案と、Relationship processing appliedを前提とするIdentity専用idempotent worker案を比較し、後者を第一候補とする。理由はIdentity障害をRelationship Engineの成功/再処理と切り離せるため。

##### Read path / Acting Guide
Reply生成時はcanonical relationship stateとcanonical Identityを読み、`source_relationship_state_version` の整合を確認する。Identityが一時的に追いついていない場合:
- stale Identityを新Stateへ無理に再解釈しない。
- status=`romantic_partner` 等のhard canonical factはActing Guideで常に優先。
- pending critical guide/boundaryを優先。
- safe fallbackを使い、バックグラウンドIdentity再処理へ委ねる。

これによりeventual consistency中でも「別れたのに恋人扱い」等の危険な逆転を防ぐ。

##### Workの最初の施工単位
1. pure `relationship-identity-resolver.ts` + fixture tests（DBなし）
2. Identity persistence migration/RPC + SQL tests
3. permanent worker integration + retry/idempotency tests
4. temporary snapshot/import integration tests
5. Acting Guide read-path integration
6. Preview/isolated acceptance
7. Production適用はowner承認後のみ

PR #66とは別PR。Forget Control、Hearts UI、Body Clock最終統合、multi-character、marriage/world-stateは混ぜない。

**施工開始前にfreezeすべき残件は、post-breakup / rejection constraintの解除条件と、Identity entry/maintenanceの数値classifierだけ。DB境界と実行順序は本節をv1施工基準とする。**


---

### Relationship Identity v1 — PR #67 migration順序・resolver総監査（2026-10-07）

**状態:** `work/relationship-identity-v1` / [Draft PR #67](https://github.com/miyazaki1016/misaki/pull/67)。**Production適用済み・Identity gate OFF**。Production migration履歴は `20261007114143 / 20261007114154 / 20261007114158 / 20261007114201`。PRはDraftのまま、merge禁止・gate ON禁止。今回の作業は適用済み履歴へのファイル名整合と総覧・テスト参照更新のみで、Production操作は行わない。PR #66 Forget Controlは変更・混入していない。以下は上の「実装前・コード未実装」handoffに対する現在の施工記録であり、古い施工前ステータスを現在状態と読み違えないこと。

#### 再照合した正本・施工境界

- 最新main: `18e2c0bdfa007c980858f85341eb8c78e0e5301a`。
- 施工開始branch HEAD: `2b97931217ab816018d70ddc63d0f764bb8bf276`。コード修正commit: `555d35bc19e7003dd9b051d02762b4bdfac1b192`。
- 本総覧のRelationship Identity handoff / canonical persistence、現行resolver / permanent・anonymous runtime / canonical read / Acting Guide / chat接続、Relationship schema・Engine migrationsとcommit historyを照合した。
- 070000の復元正本は `c769243c557f9a79eaef0a60821208b3a28fd0e1^` のファイル内容。復元後にbyte一致を確認した。
- 前回監査時点ではIdentity migrationは未適用だった。その後owner指示によりProduction適用済み。今回ownerから提示されたProduction履歴に4本のファイル名を整合する。SQL本文は全4本とも監査済みcommit `636c3fd` とbyte一致し、Production履歴・DB・gateは変更しない。
- 既存11 Primary Identities、classifier centers / gates / distance weights、distinct-version 2回confirmation、critical-event precedence、constraintの意味論を維持。仮classifier値を本工事で新しくfreezeしていない。
- Relationship Engine v1.1のAnalyzer / Interpreter / Evidence → Episode → Pattern → State、3独立Tokyo日Pattern、5軸delta計算、relationship_status、oldest-first、START_AT、fail-closed、retry、lease・processing ledgerを変更していない。mainとの差分でEngine単体は既存PRのIdentity型・feature gate追加のみ、processing / analyzer / Supabase Functionsに今回の差分なし。

#### 実装した修正

1. 070000の先行provenance列参照とboolean引数追加を除去し、provenance導入前の自己完結するatomic temporary importへ復元。
2. 083000で13引数Identity apply RPCを作成後、旧12引数signatureを `PUBLIC / anon / authenticated / service_role` から明示revokeし、DROP。13引数RPCはSECURITY INVOKERでservice_roleのみ実行可能。
3. Supabase CLI **2.81.2** の `--help` / `migration new --help` 確認後、`supabase migration new relationship_identity_v1_temporary_import_romance_provenance` により083000より後の新migrationを作成。temporary import v3のboolean provenance対応を移設し、旧21引数import overloadもrevoke → DROP。最終importは22引数のみ。
4. importではanonymousのcandidate source / constraint anchor / romance re-entryの数値versionを恒久canonicalへコピーしない。candidateをresetし、active `post_breakup / post_rejection` かつprovenance fact=trueの場合だけ、新permanent `v_source_version` へproofをmapする。`none / boundary / false / null` はproof=null。checkpoint import・Identity・transition ledgerを同一transactionに保つ。
5. importでanchorとproofが同じpermanent versionへmapされた後、従来083000の `proof <= anchor` 検証が次回保存を拒否する不整合を修正。equal-anchor proofは、locked canonical Identity rowに既に同じconstraint / anchor / proofがある場合の保持に限定する。新しくequal-anchor proofを捏造するapplyは拒否し、通常のfresh proofは引き続きanchorより後のcanonical versionを必要とする。
6. Identity applyがcanonical relationship rowをlockしてsource versionを検証し、その後Identity rowをlockする。初回Identity作成とState更新の競合中もsource検証をtransaction中に固定し、stale拒否 / replay / identity_since / immutable transition ledgerの保証を維持。
7. resolverのadjacency距離最小選択を維持。現在Identity自身がcandidateのとき近傍へ動かそうとしていた経路を、現在Identity支持として維持するよう修正。距離同率はObject / 配列順で選ばず分類保留し、総覧の「分類不能なら現在Identityを維持」契約を適用。新しいIdentity優先順位やthresholdは追加していない。
8. permanent workerのromance provenance applicationを `created_at` の先頭rowではなくcanonical `after_state.relationship_state_version` で取得。時刻同率やrow順でfresh proofの有無が変わらないようにした。Engine application自体は変更していない。

#### migration最終構成（必ずこの順序）

| 順序 | migration | その時点の状態 |
| --- | --- | --- |
| 1 | `20261007114143_relationship_identity_v1_canonical.sql` | Identity current-state / transition ledger / 12引数apply。既存ファイルを変更せず保持 |
| 2 | `20261007114154_relationship_identity_v1_atomic_temporary_import.sql` | provenance列不要の21引数temporary import v3。指定commit前の内容へ復元 |
| 3 | `20261007114158_relationship_identity_v1_romance_reentry_provenance.sql` | provenance列と13引数apply。旧12引数はrevoke後DROP。旧temporary importはまだ呼出し可能 |
| 4 | `20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql` | boolean fact対応の22引数import v3。旧21引数はrevoke後DROP |

最終schemaに旧12引数apply / 旧21引数importを残さない。新RPCにdefault引数は付けず、旧signatureの暗黙選択を許可しない。

#### 自動検証結果

- `npm ci`: 成功。SQL統合テスト用dev dependency `@electric-sql/pglite@0.5.8` をexact pinしlockfileへ記録。
- `TZ=UTC npm test`: **320 / 320成功**。
- `TZ=Asia/Tokyo npm test`: **320 / 320成功**。
- `node --test --experimental-strip-types tests/relationship-identity-*.test.ts`: **57 / 57成功**（今回追加16件を含む）。
- `npx tsc --noEmit`: 成功。
- `npm run build`: 成功。Nextのlint / type validity stageも完了。独立した `npm run lint` script / ESLint configはリポジトリに存在しないため、それを実行したとは扱わない。
- `git -c core.whitespace=cr-at-eol diff --check`: 成功。

SQL統合テストは空のPGliteに最低限のAuth / legacy参照fixtureを作り、tracked Relationship foundation / Engine migrationsを適用した上で、Identity列を**最初から順番に適用**した。064000の12引数apply、070000の旧import、083000の13引数applyと旧import、最終新importをそれぞれ次migration前に実呼出しして、各時点が自己完結することを確認した。DDLが作成できたことだけで合格にしていない。

確認した契約:
- 最終RPCのoverload数・引数数・SECURITY INVOKER・role ACL。service_roleの実write成功、browser rolesの呼出し拒否。
- stale canonical source拒否、same-version replay、identity_since保持/Identity変更時更新、ledger件数の冪等性。ledger保存失敗時のIdentity write rollback。
- anonymous version=900等をpermanent version=41へコピーせず、constraint / proofを契約どおりmap。import replayでversion / ledgerを二重更新しない。
- breakup / rejection / boundary、fresh positive romance Pattern proof、後続non-romance updateでの保持、新rejection / boundaryでreset。equal-anchor proofの新規捏造拒否。
- 既存lease付きState RPCによるpositive romance Pattern applicationと、その後のnon-romance application。時刻同率でもcanonical source versionで正しいrowを参照。
- importのbad lease / checkpoint欠落拒否、axes更新後にIdentity INSERTが失敗した場合のaxes / Identity / import marker / ledger atomic rollback。
- hysteresisのdistinct canonical version 2回のみ。same-version replayで2回目confirmationを増やさない。
- 全11 Identity × canonical shapes × constraints × provenance × critical eventsの**6,336ケース**を、centers Object順・neighbors配列順を反転したresolverと比較し一致。各中心の小変動維持、分類同率保留、非隣接targetの距離rankingも確認。
- actual temporary Engineの3独立Tokyo日positive romance Patternからproofが成立することを確認。Pattern条件・State更新をテストのために差し替えていない。

全suiteには既存quota / refund、canonical chat / anonymous checkpoint / restore、Body Clock、Relationship Engine / Pattern / Acting Guide等の回帰も含む。

#### CI / Preview

コードcommit `555d35bc19e7003dd9b051d02762b4bdfac1b192`:
- [GitHub Actions — Canonical relationship integration tests #427](https://github.com/miyazaki1016/misaki/actions/runs/37598444755): **success**。Node 22で `npm ci / npm test / tsc / build` が成功。
- [Vercel Preview](https://misaki-4l7l9mdsr-kishibojim.vercel.app): **READY**。deployment `dpl_6NzEcK8UZoHAuhegDtxhWJLBnodv`、target=Preview、同じコードSHAを確認。
- Preview READYはbuild成功を意味し、Identity migrationを適用した隔離Supabaseでの実機受入成功を意味しない。今回PreviewからProduction DBへfixture / chat / RPC writeはしていない。

#### 残存リスク・未解決事項

- PGliteはsingle-session。row lockingは実RPC定義のlock順とtransaction契約を確認したが、複数DBセッションのlock待機・競合試験は未実施。既存Engineのlease挙動を変更していないこととは別に、Identity gate有効化前に隔離Postgresで競合確認が必要。
- リポジトリは初期Supabase schemaの完全なmigration履歴を収録しておらず、legacyに同一timestampのmigrationもある。今回の「最初から適用成功」は**明示した隔離baseline + tracked Relationship migrations + Identity全4本**である。アプリ全体の空Supabase `db reset` 成功を主張しない。過去の全migration履歴を本scopeで推測修復していない。
- 既存 `tests/*.rollback.sql` を完全なSupabase実DBへ流す受入検証、および隔離Supabaseに接続したPreviewのanonymous → email → 別端末restore / retry実機受入は未実施。Identity migrationはProduction適用済みだがgate OFF。今回Productionへwriteして検証することは禁止。
- classifier値は今回の正本HEADを維持しており、数値classifierの新freezeやconstraint解除ルールの追加はしていない。Identity gate有効化前に既存のownerレビューgateを確認する。
- 全自動・CI/build成功と、Production適用可能との承認を混同しない。PR #67は引き続きDraft / merge禁止で止める。

#### Identity gate有効化前の残存受入手順（この工事では実行しない）

DB migrationはProduction適用済み。以下の旧適用前チェックは残存受入事項として保持する。Productionへの4本再適用は不要・禁止。Identity gateはOFFを維持する。

1. ownerがPR差分・総覧・classifier / constraintの既存承認範囲をレビューする。Draft解除 / merge / Production操作は別承認。
2. 独立したSupabase / Postgres隔離環境に正しいlegacy baselineを用意し、既存履歴の重複・欠落を確認した上でIdentity4本を順番に適用。最終RPC signature / ACL / stale / replay / ledger / checkpoint原子性を再確認する。
3. 別セッションでState更新とIdentity apply、同一sourceの二重apply、import競合・retryを試験し、lock待機後のstale拒否と二重ledger防止を確認する。
4. Previewを隔離DBへ接続し、anonymous → email → 別端末restore、breakup / rejection / boundary、fresh positive Pattern → re-entry → non-romance更新 → 新critical reset、pending / 次turn反映を実機で受入。既存rollback SQL suiteも隔離環境で実施する。
5. Production履歴は上記4本へ整合済み。既存Relationship Engine v1.1・backup / rollback方針・稼働版のRPC signature整合を確認し、残存受入完了後にIdentity gate有効化を別途判断する。本作業ではgate ONは禁止。

**停止位置:** Production適用済み・Identity gate OFF。PR #67はDraft・未merge。今回の変更はmigrationファイル名・テスト参照・総覧のみ。merge・gate ONは禁止。Forget Control / PR #66は触らない。

#### Production履歴へのファイル名整合（2026-10-07）

1本目はcommit `2eb4b90` で新名ファイルが追加されたが旧名も残っていたため、内容一致を確認して重複を解消し `git mv` で旧名を除去。残り3本も `git mv` し、4本すべて監査済みcommit `636c3fd` のSQL本文とbyte一致を確認。SQL内の旧timestampを含むコメントも変更しない。テストのファイル参照のみ新名称へ更新する。ローカルUTC full suite 320件・tsc・Next build成功。全CIの最終結果はPRの最新HEADに紐づくchecksを正本とする。

#### Relationship Identity v1 — 実機canonical lover受入（2026-10-08）

**結論:** branch Previewで実ユーザー会話から `romantic_acceptance → relationship_status=romantic_partner → Primary Identity=lover` のcanonical経路が成立した。これは表示上の「恋人」発言ではなく、Relationship Engine / Critical Event / canonical State / Identity Resolver / Identity persistenceを通過した正本上の成立である。Production frontendのIdentity gateは引き続きOFF、PR #67はDraft・未merge。

**実機で発見した不具合:** 既存 `criticalCandidates(message)` はユーザーmessageだけから候補を生成し、Validatorの `supportingTurn` もユーザーmessageのみをgrounding対象としていた。そのため、canonical `romantic_proposal` 後にユーザーが「美咲も俺と付き合いたいってことでいい？」と確認し、美咲がreplyで明示的に交際同意しても、`romantic_acceptance` を成立させられずproposalとして再処理されていた。実DBでは修正前に proposal が増える一方 acceptance は0、Identityは `acquaintance` のままだった。

**修正:** commit `2b104642` で、ユーザーの明示的な交際確認質問をacceptance候補へ含め、Validatorに限って「prior canonical romantic_proposal が存在し、かつMisaki replyが交際・恋人関係へ明示同意する」場合のみreplyをacceptanceのgroundingとして許可した。Misakiの「好き」「大好き」等の生成好意だけでは候補にもacceptanceにもならず、proposalなしのreply単独でも成立しない。既存原則「Misaki generated words alone cannot establish dating」は維持する。

**回帰固定:** commit `cd2479ee` で `tests/relationship-mutual-acceptance.test.ts` を追加。①明示的確認質問→acceptance候補、②prior proposal＋明示的Misaki交際同意→acceptance可、③prior proposalなし→reply grounding拒否、④通常の好意表現→Critical Eventなし、を固定。GitHub Actions `Canonical relationship integration tests #432` はsuccess。Vercel Preview deployment `dpl_BJU7aDCqdAHmJYJemNkNV1QbZS2o` / commit `cd2479ee1cad11294132563049a86662f8652576` はREADY。

**実機受入結果:** 最新Previewで同じ確認質問を送信。chat本体・`relationship-turn-record` は成功し、Runtime logに `RELATIONSHIP V1 PROCESSING RETRY REQUIRED` なし。canonical DBで `romantic_acceptance` が記録され、Identity stateは `primary_identity=lover`, `constraint_state=none`, `source_relationship_state_version=4` を確認。critical eventによるcanonical overrideは2-confirmation hysteresisを待たずloverへ遷移する設計どおり。

**重要な解釈:** 以前の会話履歴で美咲が「恋人」と発言していても、それだけではcanonical Identityは `acquaintance` のままだった。今回初めて明示的な相互交際合意がcanonical Critical Eventとして成立し、正本のRelationship Status / Identityと会話上の関係が一致した。会話のノリや高いscoreだけでloverへ昇格していないことも同時に確認できた。

**次の受入:** lover成立後の次turnで直接関係質問を行い、Acting Guideがcanonical `lover` を自然に自己認識して回答し、内部ラベル・score・ルールを露出しないことを確認する。その後も anonymous path / temporary import v3、breakup / rejection / boundary、fresh romance Patternによるre-entry、真のmulti-session lock contentionは未完了として残す。

**停止位置:** Production Identity migrationは適用済みだがProduction frontend Identity gateはOFF。PR #67はDraft・未merge。Production gate ON / mergeはownerの別承認まで禁止。PR #66 Forget Controlは触らない。
