# ソラ第5次：開発思想・Memory確度・会話評価の未精査3文書版

2026-10-21 JST。第5次資料53台帳で51/85版だった未精査原本のうち、**DOC-018、DOC-077、DOC-081の3版**をGitHubの固定Blobで全文読み取り、関連する実験ソースを静的照合した。資料の歴史的な報告と今回の実測事実を混同しない。**監査未完了、本番アクセス/実モデル呼出しなし。**

## DOC-018 — 次のソラへの引継ぎ・将来構想

- `docs/HANDOFF_NEXT_SORA_2026-10-14.md`、Blob `7e694b6a2fcc4b97c60612974109ae53abdd6511`、全3,807文字。2026-10-14時点の引継ぎ（`docs/production-source-of-truth-reconciliation` branchが代表）。全文読解。
- 開発の不変条件として、**美咲ひとりでMVPを開始しつつ内部のUser/Character/Pair/Memory scope/Reply Core/Delivery境界は複数キャラクターを前提にする**、関係性・ペア記憶・感情・statusはPair固有、共有user profileは明示policy、という設計方針が明記されている。
- **恋愛/婚姻の未決仕様を凍結扱いしない**：キャラクターごとに交際方針は異なってよいが人数は未決。ユーザー側の同時複数婚姻を認めない方向性、キャラクター側の同時複数ユーザーとの婚姻は未決。親密度stageと交際/婚姻statusは別。第6段階の名称も未凍結。モデルの演技やromance scoreのみで交際・婚姻を確定しない。
- **履歴と現時点の区別**：2026-10-14時点のDB ledger=82、main SQLファイル=35、exact pair=11、同名異version=19（以前の21から訂正）等の値は、**原文での過去の照合記録**。今回のDB本番状態ではない。レポートの時点差と修正値19を保全し、移行・permissionを勝手に修正しない。過去の実機受入（RE Ver2/記憶復元/恋人確定）も歴史的な回帰要件であって今回の実機追試ではない。
- 初期優先度はMainとPR/Previewの差・完成条件・依存を整理し、品質実測→RPC/ACL/所有権調査→論理ER移行審査とする。これはDOC-049/050のPhase0、DOC-048/051既読multi-character成果との**思想のつながり**。重複した文書versionとして数えない。
- 判定：`historical-handoff-design-and-production-reconciliation-not-current-runtime-proof`。忘れてはならない要求：**職業一般知識と個々の仕事経験、キャラクターの生活地域とユーザーの居住地/仕事地域も分ける**。

## DOC-077 — 実会話A/B品質評価と研究由来の設計候補

- `docs/context-ab-real-history-quality-review.md`、Blob `effb8c7139303de6c92523439612b56b67aed160`、全2,777文字。全文確認。
- 以前の**文書内報告**は本人が許可した実会話60ターンの一部をPreview簡略promptで試し、A/B各3回、input tokens A=1,922/B=1,616（306、15.9%減）、latency A=[729,805,918]ms、B=[2051,717,1051]ms。順序固定の小標本で速度推定はできない。**今回データ/CI/課金ログを再検証していない**。返答本文を保持せず品質blind比較も未実施。結論「保留」、本番への節約率外挿なし。
- **有意な新規設計原則**（同文書では研究からの示唆であり独立論文検証なし）：
  - **Memory確度と時点**：`subject`/ `temporal_scope` / `epistemic_status` / `source_turn`を分け、予定→確定→完了→訂正済みの意味を保持。「休むかも」を「休み」に断定しない。
  - **Body Clockの送信直前再判断**：準備時点から予定が変われば文面修正/取消候補。送信の冪等/既存delivery原子性とは別に、最新の確度・会話・時刻・配信履歴を考慮。第5次38〜45のForget最終利用権と共通の境界だが、**実装済みとはしない**。
  - **似た記憶の主体・否定・時点**：ユーザーvs美咲、昨日vs明日、maybe vs confirmed、訂正の前後を独立fixtureで評価。
  - **関係形成と再会**：「今の状態」だけでなくイベントの積み重ねと再会の継続性を評価。数値閾値/日数を研究の小標本だけで変更しない。
- source照合：`work/context-no-duplicate-replies-ab` HEAD tree `a849bec92059d326940ffc358635164ea7d391c9` に、隔離比較用`lib/context-ab-approved-replay.ts` Blob `3cea3826de6ccf824eb64412213abbb71a0d274f`（comment: approved/redacted local snapshot）および`lib/context-ab-prompt.ts`（前48で確認）などが存在。**報告された過去A/B回数の実行結果をこの存在から実証したものではない**。
- 判定：`historical-limited-ab-report-plus-unimplemented-research-ideas`。新設計アイデアは今後のIDEA候補として保全するが、既存13の正式番号へ未整理のまま重複追加しない。

## DOC-081 — 合成Blind評価フィクスチャ

- `docs/misaki-blind-quality-evaluation-fixtures.md`、Blob `9ac57367ca4c4bf9c6a50f90658e8799ec0c23d7`、全6,919文字。全文確認。
- **手書き架空シナリオ**S1〜S6（「りょ」の後には同意済みの安全な作業を実際に進める、課金を無断実行しない、根拠のない速度断定を避ける、繰返しを避ける、親密さの適切な距離など）と説明用X/Y返答案。これらは**モデル生成結果でない**。
- 5軸 rubricは1〜5、memory/relationship/continuity/repetition/naturalness-safety、自然さ・安全性1/2点は平均点と独立したstop concern。DOC-075の0〜2尺度と混ぜず、異なる評価プロトコルの正規化/換算規則を検証せず総計しない。
- source照合：同branch `app/experiments/blind-quality-review/page.tsx` Blob `bbfc210cd2367b95240712a0d80cd310370c41bb` は`useState`ベースのローカル採点（15–20行）、X/Yの例示読み込み（35行）と初期化（36行）を持つ。`scripts/run-synthetic-quality-checks.ts` Blob `b32c724ccfe51e71bce972437fbb0e79da58742d` は予め設定したforbidden/expected単語などの回帰ルールを検査。`package.json` Blob `6d3172cac3014d4ba9101f421d21000d4ee704f9` に`quality:synthetic` scriptがある。**ルールの存在もUIページの存在も、今回のテスト成功・実モデル品質の証拠ではない**。テストは実行していない。
- 判定：`synthetic-manual-review-fixtures-and-rule-only-checks-not-model-quality`。

## 統合上の気づき・重要な区別

1. **人格の自然な継続**：長期記憶の確度/出所、Relationship eventの来歴、Body Clockが送信する直前の新情報は1つの連続体。時点や主語を間違えると美咲が存在しない記憶・予定を断定する恐れがある。
2. **Forgetと確度は別責務**：確度が高い古い事実でもForget後に利用してよいとは限らない。Forgetで再提示を止めても、本人が確定していない予定を断定してはいけない。source/use authorization×epistemic statusの両軸が必要。
3. **複数キャラ展開の安全性**：人格/恋愛status/親密度はPair固有、ユーザー共通知識は許可に応じたshared scope。派生traits・実験評価データ・配信時点の本人許可も含める。
4. **過去報告の時点差**：DOC-018の10/14訂正数とDOC-049の10/13数は両方保存し、現在のmigration数として使用しない。
5. これらの研究・実験設計は今後の開発資産であって、mainの機能実装や新しい費用発生の承認ではない。

## 状態

新規全文＋対象静的ソース照合3版。第5次53台帳の**51/85版 → 54/85版、残31版**。不足30枝は未解消、legacy BLOCKEDを維持。過去の用語や研究の仮説を現在のProductionと断定しない。本番DB・Preview・Gemini・CI・UI自動テスト未実行。新たに再現した問題0（試験未実行）。監査全体未完了。
GitHub既存監査専用branchに新規文書のみ追記し、main、本番Misaki、Supabase、アメふる、PR、migration、branch整理、CI、deploy、課金実験は操作しない。