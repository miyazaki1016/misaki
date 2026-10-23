# 美咲・新チャット引継ぎ（2026-10-21）

> **新しいソラへ：最初に必ずこの文書、`docs/MISAKI_SYSTEM_VISION_20261021.md`、`docs/IMPLEMENTATION_OVERVIEW.md`、`docs/DEVELOPMENT_REGISTRY.md`、`docs/BRANCH_AUDIT_TRACKER_20261021.md` をGitHubから実際に読んで、現在地を確認すること。会話の記憶だけで判断しない。**

## 0. 最重要：Misakiシステム基本構想
- **設計思想の独立した正本：`docs/MISAKI_SYSTEM_VISION_20261021.md`**（本監査ブランチ上）。
- 人格の一貫性と成長、Character共通とUser×Character専用データの境界、恋愛・結婚・離婚、Free/Premiumの公平性、Gemini費用と会話品質の両立、開発順序、未決事項を整理した文書。
- **新しいソラは実装・設計判断の前に必ず全文を読む。** 本書は構想であり、実装済みを意味しない。変更するときは理由と根拠を記録する。

## 1. 対象・禁止事項
- GitHub: `miyazaki1016/misaki`。
- 監査専用ブランチ: `docs/development-registry-audit-20261020`。調査と記録はこのブランチに限定。
- **main、本番美咲、本番Supabaseを変更しない。** ブランチ削除・PRマージ・デプロイ・課金が発生するGemini実行も承認なしに行わない。
- アメふるは別プロジェクト。触らない。安全性チェックは回避しない。

## 2. 完了した作業（証拠）
- 2026-10-21 GitHub branches APIで列挙した**全92ブランチの最終コミット日時を取得済み（92/92）**。
- `docs/BRANCH_AUDIT_TRACKER_20261021.md` に全件記録、**最終コミット日時の新しい順に並び替え済み**（UTC）。
- `docs/DEVELOPMENT_REGISTRY.md` に先行する各ブランチの調査メモあり。ただし「名前の記載あり」は精査完了を意味しない。
- 監査ブランチ自身の最終コミット日時は監査コミットごとに変化する。表の値はスナップショットであり、必要なら再取得する。
- **重要：日時の取得・並び替えはmain反映、PR、Preview、未反映タスク、実装安全性の検証完了ではない。**

## 3. 新チャットでの最初の作業
1. 冒頭で指定した5文書を**GitHubの実データで確認**。最新HEADと表の整合性を確認。
2. 全92枝のmain比較、PRの開閉/マージ履歴、Vercel Previewの所在、仕掛かりの有無を**証拠つきで**照合し、表の`main差分・PR・Preview`、`追加精査`列を更新。
3. 「main反映済み」「別経路で同等実装済み」「未反映」「安全上ブロック」「不明・要追加調査」を区別する。ahead/behindやコミット日時だけでマージ済みとは判定しない。
4. 過去の書き込み禁止・反映ブロックで未適用の作業が残っていないか、作業ブランチ・Preview・PRを横断して確認。
5. `docs/IMPLEMENTATION_OVERVIEW.md` と `docs/DEVELOPMENT_REGISTRY.md` を最初から通読し、重複や古い前提を整理して正本を更新する。

## 4. 棚卸し後の最優先実装：Gemini費用の最適化
- **品質・記憶・関係性を壊さず、成功した会話1ターン当たりの実コストを下げる**。
- Geminiの実リクエスト数、リトライ、入力/出力トークン、重複する会話履歴・system prompt、余分な付随呼び出しを調査。計測は個人情報を残さない。
- 既存の関連ブランチ: `work/gemini-unit-cost-telemetry`、`work/conversation-context-compression-spike`、`work/context-no-duplicate-replies-ab`、`sora/gemini-timeout-retry`、`sora/gemini-transient-retry`、多数の`work/ab-*`。先にmainとの差分・既存テストを確認し、課金実験は許可を得る。
- 過去の圧縮spikeでは会話履歴60件送信、system promptに美咲の返答最大8件の重複があった。古い会話の要約、直近履歴件数、重複除去などをオフライン品質比較で検証。単発のコスト例を全体に一般化しない。

## 5. 今後の設計思想
- 美咲は継続成長する人格。将来は複数キャラクターを同じ仕組みで運用。
- キャラ全体で共有する人格・知識・成長と、**ユーザー×キャラクター単位の非公開記憶・関係性**を厳密に分離し、他ユーザー・他キャラへの漏洩を防ぐ。
- 恋愛・結婚・離婚を含む関係性は自然に変化し、結末を固定しない。結婚の排他制約はDBで担保。
- Free/Premiumで関係性の価値や好意を差別しない。Premiumの記憶を使う積極メッセージは同意・プライバシーに注意。
- `codex/legacy-maintenance-drain` は過去のPostgreSQL並行性テストで安全性問題が判明しており**BLOCKED**。本番適用しない。
- `chore/restore-relationship-rpc-migration` は既存RPCの復元用ソースであり、本番への再適用は禁止。DB差分は慎重に検証。

## 6. 作業・報告方法
- ユーザーの「りょ」は原則として直前の作業を継続する合図。毎回実際にGitHubを調査・記録し、コミットSHAと成果を報告。
- 長いチャットで動作が重くなるため、新チャットに移動。次回も引継ぎはGitHubの文書を正本とし、チャットの記憶だけに頼らない。
- 記録は監査専用ブランチへコミット。**mainや本番に無断反映しない。**


## 2026-10-23 正式開発運用ルール

**作業を始める前に必ず `docs/MISAKI_DEVELOPMENT_WORK_RULES.md` をGitHubから読むこと。** ユーザー承認により2026-10-23正式採用。作業開始時の最新総覧・GitHub確認、1作業1記録、目的/変更ファイル/検証/未完了/次の手順の明記、コミット後のGitHub再取得、途中中断からの再開可能性、の5段階を毎回必須とする。安全BLOCKEDや本番無断変更禁止は従来どおり。最新のGemini入力軽量化の合成実験は `experiment/chat-input-metrics-offline-20261022` を参照し、同枝の成果はmainに未統合。GitHub書込みが阻止された場合は未保存と明記し、迂回しない。
