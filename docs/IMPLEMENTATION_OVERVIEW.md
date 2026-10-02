# Misaki 実装・修正 総覧

> **未来のソラへ——**  
> この総覧を読め。  
> せいちゃんに同じ説明を二度させるな。  
> 過去のソラは、ちゃんと考えてここまで来た。  
>  
> **未来のソラを信用するな。総覧を信用しろ。**


最終更新: 2026-09-18  
実装ソース照合基準: `main` @ `8339ee5fad7465e5e003b9877b2e0552ff144506`

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


### 2026-10-02 — 自然な生活圏イベント挿入の実例 / shared-world設計メモ

Production実機の通常会話で、近所のスーパーについて雑談中、美咲が会話末尾に「このあと雨降ってくるかもだから気をつけて帰ってね☔」と自然に天気を差し込んだ。ユーザーが雨について聞くと、「予報だとこの後雨の可能性あるみたい」「塩浜の方も怪しい感じ」と続けた。

runtime trace `519b64d7` では `weather` / `life-events` stage がともに成功。現行コードでは、ユーザーの端末現在地やユーザープロフィール居住地ではなく、美咲自身の固定生活圏として定義された江東区周辺の代表座標 `35.6728, 139.8174` を Open-Meteo に渡し、現在天気と今後6時間の予報を取得する。life-events側は降水確率40%以上、降水/雨量0.2mm以上等の意味のある変化がある時だけ `weather_forecast` をGeminiへ渡す。

この実例を、今後の「美咲の世界 + ユーザーの生活圏 + 現実世界の出来事」を統合するshared-world機能の自然挿入基準として残す。

#### 自然挿入の原則
- 情報を取得できること自体を価値にしない。**会話との接点ができた時だけ口にする。**
- API結果を読み上げず、普通の会話の一部として短く差し込む。
- 関係のない雑談中は、情報を知っていても原則黙る。
- 例: 帰宅・外出→雨/交通、近所の買い物→新店舗、家族の話→その人に紐づく生活圏の重要イベント。
- 情報の確信度に応じて言い方を変える。曖昧なら「〜だったっけ？」「〜みたい」等で確認余地を残す。
- ユーザーの訂正・確認は、その後の生活圏/記憶更新の根拠候補にする。
- 安全・災害情報は信頼できる外部情報を根拠にし、根拠以上の断定をしない。

#### 将来の処理イメージ
`現実情報取得 → 会話との関連性判定 → 今言う価値の判定 → 美咲らしい自然表現 → ユーザー反応による記憶/生活圏更新`

#### 重要な境界
今回の「塩浜の方も怪しい」は、塩浜町丁目ピンポイント予報を取得した証拠ではない。固定された江東区周辺代表座標の予報を、美咲自身の生活圏「江東区・塩浜周辺」の文脈で表現したもの。今後ユーザー生活圏へ拡張する際も、隠れた端末現在地を勝手に使わず、本人の会話・確認済みプロフィール等から得た生活圏を根拠にする。

> 設計の狙い：位置情報対応AIではなく、**美咲が自分の世界で生活しながら、ユーザーにとって意味のある世界の変化にも自然に気づく会話AI**を目指す。


#### shared-worldのプライバシー境界 — 「知れることを全部知ろうとしない」

生活圏機能が高度になるほど、外部情報を取得できる能力と、美咲がその情報を知っていて自然かどうかを分離する。

**原則：美咲は、知れることを全部知ろうとしない。**

- ユーザー本人が会話で教えた情報、過去に本人から聞いて記憶した情報、天気・一般ニュース・地域の店舗情報など通常の生活で自然に知り得る公開情報は、会話との関連性がある時に利用できる。
- 一方、学校名などの断片から担任・家族・知人など特定個人を外部検索で突き止めたり、SNS等を横断して本人が教えていない個人情報を推定・収集したりしない。
- 「技術的に取得可能」だけを理由に、美咲の知識として会話へ持ち込まない。
- 判断基準は「人間の親しい相手なら、この情報をどうやって知ったのかを自然に説明できるか」。知った経路が不自然なら使わない。
- ユーザー自身が「子供の担任は田中先生」等と話した場合、それを後日自然に覚えていることはshared-worldの価値になり得る。ただし学校名等から担任名を外部で特定して突然言及するのは対象外。
- 目標は「なんでそんなこと覚えてるの😳」という嬉しい驚きであり、「なんでそれを知っているの😨」という監視感を生まないこと。

この境界は、今後shared-world / user life-areaの取得ソースや自発会話を拡張する際の必須設計条件とする。
