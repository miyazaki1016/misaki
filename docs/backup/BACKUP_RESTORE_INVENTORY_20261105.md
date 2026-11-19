# 美咲バックアップ対象・復元試験計画（設計段階）

更新日: 2026-11-05 / 正本: Issue #159

## 現状と適用範囲

この資料は読み取り監査に基づく**設計**であり、バックアップ取得・復元試験・PITR有効化の完了を示さない。既存の `supabase/canonical-backup.ps1` は移行用の手動チェックポイントで、全サービスの復旧手段ではない。スクリプトはスキーマと、関係性state/events、会話集約state、push state、日次利用量2種、proactive deliveriesの**7テーブル**のデータを取得する。会話原本 `conversations` は含まない。

## データの分類と初期方針

| 分類 | 代表的なテーブル | 復元方針 |
| --- | --- | --- |
| 会話原本 | `conversations` | 現行ダンプ対象外。ユーザー所有権と削除・匿名期限を確認してから対象化 |
| 会話集約・記憶 | `misaki_user_conversation_state` | 現行対象。ただし原本との整合性を要検証 |
| 関係性の現在値 | `misaki_relationship_state` | 現行対象。イベント・履歴との整合性を要検証 |
| 関係性イベント | `misaki_relationship_events` | 現行対象。参照先の会話原本と配信データを併せて検証 |
| 根拠・エピソード | `misaki_relationship_evidence`, `misaki_relationship_episodes`, `misaki_relationship_episode_evidence` | 現行対象外。参照関係を含めて検討 |
| パターン | `misaki_relationship_patterns`, `misaki_relationship_pattern_consumptions` | 現行対象外。参照関係を含めて検討 |
| 関係性の自己認識 | `misaki_relationship_identity_state`, `misaki_relationship_identity_transitions` | 現行対象外。連続性の復元要件を確認 |
| 適用履歴 | `misaki_relationship_state_applications` | 現行対象外。二重適用を防止 |
| 処理状態 | `misaki_relationship_processing`, `misaki_relationship_worker_leases`, `misaki_relationship_critical_pending` | そのまま再開しない。リース失効・再実行安全性を確認 |
| 匿名の一時ルート | `misaki_temporary_roots` | 期限延長・失効済み復活禁止。生データの無条件復元禁止 |
| Auth / Storage | 認証ユーザー・セッション・ファイル等 | 対象範囲と提供機能が未確認。DBダンプだけで完全性を主張しない |

※これは完全なテーブル一覧ではない。追加の関連テーブル・スキーマ、RLS、保持期間、削除経路の棚卸しが必要。

## 確認済みの依存関係

- `misaki_relationship_events` は `conversations` と `misaki_proactive_deliveries` を参照する。
- `misaki_relationship_episode_evidence` は `misaki_relationship_episodes` と `misaki_relationship_evidence` を参照する。
- `misaki_relationship_pattern_consumptions` は `misaki_relationship_patterns` を参照する。
- 多くのユーザー単位のテーブルは `auth.users` を参照する。

復元はテーブル名の羅列順で行わず、**実際の外部キー・削除規則・整合性制約を取得した後**、隔離環境で手順を確定する。

## 復元試験の安全ゲート

1. 本番とは独立した検証環境を用意し、本番への書き戻しを禁止する。
2. バックアップ範囲・取得時点・保管先・暗号化・アクセス権・SHA256・保持期限を記録する。
3. 復元前に、削除確定済みユーザー・匿名期限切れの情報を**復活させない仕組み**を設計・検証する。バックアップ時点より後の削除を反映できない場合は本番復元不可とする。
4. 外部キー、ユーザー分離、会話と集約状態、関係性イベントと現在値、重複適用、処理中リースを検証する。
5. 件数・ハッシュ・サンプル整合性を比較し、個人の会話本文をログやPRに出さない。
6. テスト結果と残余リスクをレビューし、実際の本番復旧は別途明示承認を得る。

## 未確認・着手前の必須事項

- Supabaseマネージドバックアップ・PITRの設定、保存期間、復元可能な範囲。
- Auth・Storage・Edge Functions・環境変数等の復旧責任範囲。
- 匿名24時間・削除受理後24時間・バックアップ30日以内のルールを実現する削除台帳／復元フィルタの有無。
- 暗号鍵管理・バックアップの保管場所・権限・定期実行・復元リハーサル。
- 全テーブルの分類と、運用データ・一時データ・恒久データの境界。

**禁止事項:** 本資料だけを根拠に既存ダンプのテーブルを増やすこと、期限付きデータを無条件復元すること、本番DBに試験復元すること、復元成功を宣言すること。
