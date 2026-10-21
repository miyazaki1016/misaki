# 第3次精査：最新進捗・未完了の引継ぎ

2026-10-21。起点 `8d4050f43466a97d61efe1632eadee7a3a4766a2`。main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。**監査は未完了。** 原265資産と旧資料を維持する。今回の保存は機能実装・受入・本番適用の承認ではない。

## 進捗

- 文書：今回全文8版、累計 **32/85版**、残53版。DOC-006/007/008/009/010/011/025/036。部分閲覧した巨大総覧を加算しない。
- ブランチ：今回静的 **2件解消**、累計12/44、証拠不足 **32件/44件**。BR-035/036のrecall目的がmainで存続。動作受入ではない。
- PR：API再確認 **未マージ15件**。重点#66/67/78/86/87/88は全てopen Draft、各HEADは25/26。旧証拠不足4件の全解消はしていない。
- 設計思想：**11件保全**、IDEA01–09継承、IDEA10/11追加（今回整理した原則であり完成機能ではない）。
- 未反映成果：**重点7成果群を継続追跡**。Forget/Identity/Memory設計/Lab/Shared設計/Shared部品/Relationship Time。設計・部品・main中核混在を維持。新たに本番検証済み未反映と認定した成果 **0件**。
- BLOCKED：**1件**、legacy。CI成功で解除しない。

## 新しい重要事項

1. #67のIdentityは二人の関係の自己認識。人物同一性を解決するengineではない。同名別人/第三者/曖昧な人物の誤認防止を別の未保証として残す。
2. mainはordinary memoryをlifeFactsへconfidence:1で渡す。これは古い記憶の真実性を検証した値ではない。#78のcertainty/provenance設計との差として試験条件にする。実不具合を再現したとはしない。
3. UI memory削除、履歴削除、Forget barrier、旧receipt失効は別の責務。全再提示入口14経路を19に接続。Relationship worker/story/全cache/SQL最終定義は残る。
4. #88のbase builderは存在し、main templateと式名対応後のliteral全文一致を静的確認。古い「未抽出」文書/PR冒頭と現HEADを分ける。全dynamic resolver/生成/検証/保存同等性は未検証。
5. Lab現コードはQ22まで。古い12/18件記述を現在件数に読み替えず追補順を保全。独立oracleと両側誤り判定、人手根拠の基準線を20に作成。
6. pending行作成済みの照会に3turn制限はない。直近3turnはworkerによる行作成前の橋渡し。4turn超/長時間停止は未検証であり、今回再現した不具合0件。
7. 9/18総覧2版ではrefund等の「実装」と「失敗経路の受入」を分け直していた。後続server canonical化により古いbrowser同期方式を復活させない。

## 次回へ残す調査

1. 24のpending_documents **53版**。特に巨大overview残22版を全文・版差分・変更理由で追う。今回の8版を再取得からやり直さない。
2. 24のpending_branches **32件**。匿名4経路、旧proxy retry、履歴同期/turn dedupe、旧proactive/tag/claim最終定義、docs-onlyの意味照合。merged履歴だけで解消しない。
3. 19の全入口をDBの最終CREATE OR REPLACE/trigger/RLS/外部jobまで接続。Relationship workerの元events/derived story、persona evolution、全ブラウザーcacheをForgetの適用範囲と照合。
4. #78主体/期間/訂正/完了selectorとMemory v1の統一契約、#67のsource version/constraint/匿名importを深掘り。現在DB適用は未確認のまま再適用しない。
5. Lab oracleと故障注入fixtureの妥当性レビュー、Engineのdynamic golden/失敗trace/副作用回数の試験設計。今回は新規テスト実装・suite実行はしていない。
6. main外workflowの全import/lock/runtime到達可能性、期限切れartifact、Preview実機受入。18の証拠を保持し枝削除/統合しない。
7. pending停止/再試行/長期滞留/3turn超の隔離再現計画とlegacyの5観点（10/15/23）を継続。DBや有料モデルで勝手に試験しない。

## 保存ファイルと検証範囲

19〜27の新規9ファイルとREADMEの最新案内。24は09→17のoverlay、25は固定HEAD/参照source Blobと静的template比較、26は重点6PR本文/HEADとopen15件の観測。固定Git objectを証拠として保持し、全取得sourceを精読済みとは数えない。

今回確認したのは文書本文、固定ソース、過去diff、API PR状態、literal比較、台帳件数/整合。アプリの実動作試験、DB接続、migration、Gemini、Preview受入はない。main・本番Misaki・本番Supabase・アメふる変更、PR merge、枝削除、deploy、安全性回避、機能実装は行っていない。保存commit SHAは生成後に報告する。
