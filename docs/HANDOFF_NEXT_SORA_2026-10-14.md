# 次のソラへの引き継ぎ — Misaki
最終更新: 2026-10-14

## まず読むもの
1. docs/IMPLEMENTATION_OVERVIEW.md — 正本の総覧。特に2026-10-14追補。
2. docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md — Main / production DB / migration ledger / RPC provenanceの照合台帳。
3. docs/MULTI_CHARACTER_PHASE0_AUDIT.md — 現行データ所有権・RPC caller・ACL・worker・Body Clock等の複数キャラクター化監査。
4. PR #81（Draft）— 上記監査資料をまとめる文書のみの変更。未マージ。
5. PR #66 Forget Control、PR #67 Relationship Identity、PR #79/#80 multi-character audit、PR #31 relationship-time v2 design。

## 正本・環境
- GitHub mainの最新アプリソースと接続先Supabase本番DBの実状態が正本。再開時にHEADを再取得する。
- Main＝本番・実機検証。Preview＝PR/branchごとの隔離された機能検証。Work＝調査・実験。
- ユーザー実機で確認済み：Relationship Engine v2、メール保存、ログイン後の会話履歴、記憶復元、5軸、3日間の猶予、恋人関係の確定。これらを未検証に戻さない。
- PRの説明文やPreview deploymentの存在は、Mainに未実装／本番有効化済みである証拠にはならない。

## このチャットで追加した整理
- 開発中に依存問題を発見し、複数作業が並行したため仕掛かりが点在している。次は新規着手を増やすより、Mainとの差分・完成条件・依存・次の一手を棚卸しして順番に閉じる。
- Geminiの会話履歴重複削減は約5.9%のコスト削減と品質低下のトレードオフが焦点。ユーザーは「この品質低下に対して有意義か。生活イベント対応の方が効果が出るのでは」と指摘。品質評価と実トークン計測がない状態で採用しない。Work実験は本番の挙動ではない。
- MainのRE v2を基準に、Forget Control、Relationship Identity、Relationship time、Gemini実験、multi-character監査、migration/RPC provenanceを分けて扱う。
- PR #81はDraft・文書のみ。Mainを変更していない。本番DB・migration ledger・RPC・ACL/RLS・gate/config・デプロイも変更していない。

## 複数キャラクター化の最終構想（重要）
### 原則
- MVPは美咲一人で開始してよいが、内部アーキテクチャは将来複数キャラクターを前提にする。
- User、Character、User×Character Pair、canonical relationship events、memory scope、work knowledge、external context、shared Reply Core、delivery/channelを別ドメインとして扱う。
- キャラクターは人格・価値観・口調・生活設定・地域・恋愛観・嫉妬傾向・境界を個別に持ち、可能な限りデータ駆動で追加できるようにする。
- 5軸、親密度、感情、relationship status、恋愛イベント、ペア記憶はUser×Characterごとに独立。美咲の関係・思い出を別キャラクターへ自動コピーしない。
- ユーザー共通プロフィールは共有ポリシーに従う。キャラクター限定の相談・思い出は他キャラクターへ漏らさない。Memory scopeをretrieval時点で強制し、prompt後の注意書きに依存しない。
- 一般知識や許可された外部情報は共有可能だが、キャラクター人格・関係・感情・思い出とは分離する。
- 仕事一般知識とユーザー固有の仕事経験、キャラクターの生活地域とユーザーの居住地・勤務地域・登録地点を分離する。
- ChatとBody Clock/通知/音声等は共通の原則で対象character/pairを選ぶ。Chatだけを切り替えて通知が旧人格や旧関係を使う設計にしない。

### 恋愛・婚姻
- キャラクターごとの交際方針は異なってよい。一途なキャラクターは同時に恋人一人、別のキャラクターは複数交際を受け入れる、など。具体的な交際可能人数は未決定。
- 現時点の方向性ではユーザー側は同時に複数の相手と婚姻関係を持たない。
- キャラクター側が複数ユーザーと同時に婚姻できるかは未決定。推測で仕様化しない。
- 交際と婚姻を分離する。交際成立、拒否、別れ、プロポーズ、結婚、離婚、復縁はvalidated canonical event/stateで記録する。
- Geminiの台詞、romance score、親密度だけで恋人・配偶者を成立させない。婚姻排他性などの硬い制約はDB/RPCで原子的に保証する。
- Intimacy stagesは関係の深さ（他人→知り合い→友達→親友→大親友→第6段階）であり、relationship type/statusではない。具体的な第6ラベルや段階定義はfreeze前の仕様項目。

### 絶対に守る技術境界
- canonical stateへの書き込みは既存RPC契約を通す。直接INSERT/UPDATE/mergeで迂回しない。
- lease fencing、processing version/token、request ID、retry/idempotency、canonical turn順序を維持。
- 匿名temporary rootの暗号化、期限、revision、email checkpoint/import境界を維持。
- 既存relationship eventsや記憶を新キャラクターへ勝手にbackfillしない。旧データをMisaki pairに帰属させるbackfill/rollback/互換期間を設計・レビューする。
- Multi-character migrationは現行本番DB・全RPC/FK/unique/RLS/caller/worker/import/Body Clock依存を照合し、論理ERと移行案をレビューして明示承認を得てから行う。
- Production DB/gate/deploymentを、引き継ぎ文書や監査PRだけを根拠に変更しない。

## 最新のmigration provenanceメモ
- 2026-10-14再取得の読み取り比較：Main SQL migration files 35、production ledger 82、exact version/name pairs 11、Main-only pairs 24、ledger-only pairs 71、同名でversion違い19（前の21から訂正）、同一versionでname違い0、Main migration names without ledger name 3、ledger names without Main filename 50。
- これらはファイル名とledgerの比較であり、未適用や破損を意味しない。RPC本文/ACL/実適用経路を確認する。台帳を書き換えたりmigrationを再適用したりしない。
- apply_relationship_emotion_action_v2のMain SQLとproduction function body/contractは一致。relationship-time UUID overloadはproductionにあるがMain migration source/provenanceを特定できず、これは履歴再現性のギャップ。手動SQLと断定しない。403を再現させるためにgrantを広げない。

## 再開後の最初の手順
1. main HEAD、PR #66/#67/#79/#80/#81のstate/head/CI、Vercel deploymentを再取得。
2. 総覧とこの文書を読み、事実・ユーザー確認・PR主張・未決定を区別。
3. 全仕掛かりを「Main完成」「Preview実装・受入待ち」「調査のみ」「保留」に分類し、完成条件／依存／次の一手／本番影響を記載。
4. migration/RPC差分はread-onlyの証拠を増やす。Production DB/ledger/ACL/gate/deployを変更しない。
5. ユーザーに既に話した設計を繰り返し質問しない。緊急の安全問題以外は、並行着手を増やさず一件ずつ閉じる。
