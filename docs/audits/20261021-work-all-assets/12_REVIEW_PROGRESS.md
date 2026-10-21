# 追加精査の進捗・残件（2026-10-21 JST）

参照正本 `9e3f7873a3ad5aca3638a7d7d6b76f6ac0835fe0`。今回の目的は資産の保全と採否を追跡できる状態。形式的な監査完了とはしない。

## 最新照合

ブランチAPIは92件、次ページ0件。mainは前回同じ `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。PRは88件、次ページ0件で、前回からstate/draft/merged_at/updated_at/headの変更なし。監査枝の新しい文書コミットだけを追記する。

原監査の92枝＋85文書版＋88 PR＝**265資産**すべてにID、6分類、確認範囲、根拠、保留事項を記録。文書85版は原監査のコホートで、後から作成した監査資料自体を混ぜて件数を水増ししない。

- 文書16版に、今回までに確認した意味内容・範囲を記載。残る69版は意味精査保留。総覧24版の全差分を通読済みとはしない。
- 92枝は、main収録履歴34（main自身を含む）、同等中核確認2、実装候補5、未完成/要修正6、BLOCKED1、証拠不足44。収録履歴だけの枝は現在機能の存続を保証しない。
- 88 PRは、merged73、未完成/要修正6、候補4、BLOCKED1、証拠不足4。merged73はGitHub履歴の確認であり、全変更の現在mainでの機能受入ではない。

集計・全件行は09とJSON4ファイルを参照。粗い分類と機能別の精密判定を分け、混在する枝は11のように分解する。

## 今回進んだ内容

### legacy

3か所FOR SHARE修正と、以前の業務write/新規受付/transaction barrier/session disconnectの4回帰の関係を対応付けた。HEADの実CIログでPG17.6/18.4各56成功。テストが許容するSQLSTATEは55000又は40001で、成功時の実際の値はログに出ないため断定しない。

既知の未guard3テーブルは試験fixtureに含まれない。FOR SHARE変更はguard対象追加でもpre-gate inventory追加でもない。全surface・旧処理引継ぎ・実統合の証明がないためBLOCKEDを維持。

### 設計思想・未反映成果

- 記憶の確実性と訂正を、Forgetとは別の保全候補として登録。
- Stage/5-heart、Momentum、canonical Acting DTO、共通engine、三層prompt、既存relationship version再利用をIDEA01〜07へ登録。
- #31のrelationshipStoryはmainに中核がある。urge/motiveは未反映候補であり、全部未実装として作り直さない。
- 旧motiveの関数入力にはplan/同意/Forgetがない。新構想のFree自発話題源を満たすには、取り込み前の選別と境界テストが必要。
- DTO正規化の独立試験はtest内のローカル関数であり、runtime DTOの完成・Edge接続と混同しない。

## 次の精査

1. DOCの69保留を、本文段落・版差分・実コードの対応単位で減らす。まず総覧24版の変化、Memory v1/Identity設計、未マージ監査PRの記録を追う。
2. BRの44証拠不足を、merged PRのchange-setと現mainの依存経路・後続置換まで確認する。古い枝の一括mergeや削除はしない。
3. #31のcontact timing/focus/photo/storyの残部、#78/#67重複、#66の全参照入口を機能別回収表へ追加する。
4. legacyの未guard到達・pre-gate・operator isolationの試験計画を具体化する。実行や安全性コード変更はこの監査に含めない。

## 保存・再開

新しい09〜12と分類JSONが今回の精査台帳。01〜08/evidence.zipは初期スナップショットとして保持し、最新追補を優先する。本文と台帳の判断が変わったら根拠・変更前後を記録する。

全確認が完了した、現在本番で全機能が動く、未保存作業がゼロ、という主張はしていない。main・本番・DB・PR merge・枝削除・有料モデル実行なし。ブランチ統合/削除はユーザー承認後の別作業。
