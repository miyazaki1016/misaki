# 第5次再開：未精査6版の全文・版差分・ソース照合

2026-10-21 JST。開始HEAD `52c53fec066323e75cd15ddf5495f6f3ed6d442a`。38〜55を引き継ぐ。55の54/85版から今回6版を追加し、累計60/85版、残25版。新監査資料は85版の母数外。全監査未完了。全文確認は原本ID＋Blob単位。取得だけ・部分閲覧・既読版は加算しない。固定本文と今回ソース証拠は60に保存する。

## DOC-032：旧総覧の「実装」と「実機受入」を分けた版

`docs/IMPLEMENTATION_OVERVIEW.md` / `936f61c6363da27b384e37b00f08aec6b999cd75`、12,969 bytes。代表枝 `docs/audit-overview-against-source` HEAD `f6d8baf94d037057ec94deb87b156a713445d37f`。全文確認。

- 既読DOC-036（b017757）から、冒頭のソース照合節、旧自発API残存・ブラウザー呼出しなし、写真候補各1枚、selector4、Pushの相対URLを追加。返却処理の「安定」を、通常往復の実機確認と失敗経路未再現へ明確に分離した。PR #22の全文patchと親→HEAD差分で確認。
- 本文は「旧経路がdormantで残存」。既読DOC-025（3e5c58a）はその後の削除を記録する。同日でもこの2版を交換可能な同一仕様としない。削除はmain履歴 `15cb968` に対応する。
- 全16章にはBody Clock一本化、claim失敗原因、履歴同期の追記／delta重複防止、無料回数返却、勤務推測の抑止、今日の記憶と架空の情報入手経路禁止、未検証の自然さ・タグ・写真差分がある。
- 現main `conversation-history-sync.tsx` はmount/focus/visibility/authでGETし、表示cacheを正本としてuploadしない。旧版の5秒poll＋browser追記は現行契約へ戻さない。`public/sw.js`の相対URL、Edge selector4・添付率0.34・CHASEのcheck_in条件は現在の固定ソースでも対応を確認。現在の運用間隔55〜210分・購読削除・DB適用は今回実測していない。
- 分類：歴史的監査文書、後続で一部置換。main文書へ思想を継承、現在の全挙動同等性ではない。

## DOC-020：初対面からの関係成長・診断を追補した総覧

同path / `083dd5663fb7d3dc3961f302d290cc490eb33ac0`、16,587 bytes。代表枝 `docs/update-overview-relationship-growth` HEAD `1d9db32ea15fbea950ac46090cb6e1a8bc750001`。全文確認。

- 直前の既読DOC-025からPR #28で追補：初対面から育つ、pointsと交際事実の分離、30/80/160の距離感、Premium倍率なし、匿名SIGNED_OUTのcache保持、20秒→30秒timeout、工程別trace、外部情報キャッシュ候補、PR #24〜27。
- 理由は、根拠なく恋人・強い好意を先取りしないこと、Safariの一時切断で会話を失わないこと、無応答の原因を工程別に判定すること。共有cache案は実装決定ではない。
- 現main `relationship-acting-guide.ts` はstatus未成立をscoreで恋人扱いしない。legacy adapterの30/80/160と5軸の帯域は別。現main `anonymous-session-guard.tsx` は匿名回復時のowner付替えと恒久ログアウトを分離。`chat-proxy`は1呼出し。これらは静的に確認した存続資産。
- 現mainの点数は9/26 semantic deltaへ置換（`20260926000000_semantic_relationship_point_delta.sql`）。回数を増やせば必ず+1する旧前提へ戻さない。Free/Premiumの自発話題源は基本構想に追加された別契約。古い「違いは回数」だけで現構想を狭めない。
- 当時のSafari再起動／timeout返却の実機報告を保存するが、今回の実機合格にしない。総覧内のtimeout返却確認と一般的な生成失敗未再現は別の失敗種別として保持。

## DOC-012：実モデル評価入口の設計変更史

`docs/CONVERSATION_REAL_MODEL_READINESS_AUDIT_20261019.md` / `3b387da4876452a90eda5dca82c791be602de6c5`、17,064 bytes。全文確認。後半追補まで読むと、単なる「入口なし」で終わらない。

1. 当初：acting-labは単発fallback、認証／予算上限なし、既定5profile＋generator retry。mainの全文routeを再照合し、現在も単発オーディションでcanonical品質の測定口ではないと確認。呼び出していない。
2. Q02の2物理call adapter→CLI→手入力iPhoneレビュー→無効なPreview routeとdraft DB claim→UI接続へ変遷。
3. 共有Production/Preview service-role先の危険を理由に隔離Supabase案、さらに無料枠制約から専用private GitHub create-only claimへ変更。旧SQL案は文書中で廃止と明示。新規DBを作る指示として扱わない。
4. 最後の文書追補はbranch固定、ready表示、未設定・未実行の報告。ただし現在取得した#86枝のroute Blob `640ddc7042bb5bd752b1b446430d9e6dfba953c5` は、さらに `q02-preview-v2`、`MISAKI_SMOKE_V2_EXPLICIT_APPROVAL`、専用quota repo/mainの固定を要求する。claim helper `75dd7e95bf9eac37ecfde305e064d31da6d1ffcc` は201だけを成功とする。**これは後続コードとの差であり、文書のv1段階を現状へ上書きしない。quotaの実在・設定・消費状態・実行歴は今回未確認。**

分類：未反映の研究・評価資産と歴史的安全ゲート。Preview READY／mock試験／route存在は実Gemini実行証明ではない。文書の過去承認は今回の課金禁止を変更しない。

## DOC-082：14call合成live計画と後続handler

`docs/misaki-synthetic-live-evaluation-runbook.md` / `395b5a68e712404520d6ce03b8e5052f8c330207`、2,740 bytes。全文確認。7固定架空scenario×2arm、14物理request、retryなし、20秒・128出力token、推定$0.04停止／許可$0.05、未実行という計画。

`work/context-no-duplicate-replies-ab` の `app/api/experiments/synthetic-quality-run/route.ts` Blob `75155018e819f344e744b091bb1b3382d7dedbcd` を全文照合。専用handlerは後続コードに存在し、Preview・Bearer token・enable・専用Gemini key・固定7fixtureを要求し、caller本文を入力に使わず、Supabaseを読まない。文書末尾の「専用handlerが必要」はこのコードで一部具体化された。

ただしcalls/estimatedUsdはPOST内のローカル変数。**14上限は一HTTP実行内であり、再POST・複数instanceを通じた一回限りの予算ではない。** エラー／timeoutの実課金やusage欠測を厳密に計上できる証明もない。これは静的な制限の観測であり超過課金の再現ではない。料金の記述は当時の前提、今回の現行価格確認・実行許可ではない。分類：未反映・実行条件未受入の評価計画。

## DOC-083：手書き参照回答と自己採点

`docs/misaki-synthetic-reference-replies-and-self-scores.md` / `fb14a7a5422fb4b15a6478fa1cfad3625bd76d3f`、5,247 bytes。全文確認。7scenarioは記憶／勤務推測禁止／交際境界／反復／落ち込み／話題転換／不確定予定。6件25/25、1件24/25は手書き回答への初期評価者採点で、実モデルの結果でない。

`lib/context-ab-quality.ts` Blob `a7eefd27c9c11517194fd3a1f8247db1ad2177d3` の全7fixture、includes式heuristic、5軸1〜5点・naturalness<=2 blockerと照合。関係自然さを文字列検査だけでは認定しない。DOC-081のS1〜S6、DOC-075の0〜2尺度と統合して集計しない。独立oracleには、参照文の完全一致を強制せず、許可された事実・不確実性・禁則と人手判定を使う。分類：未反映のreviewer準備資料、品質実績なし。

## DOC-004：A/Bの受入条件

`docs/CONTEXT_AB_EXPERIMENT.md` / `8dc57e97acfdf931d875cecbb7ac39ad35fa72cb`、3,992 bytes。全文確認。Aは直近美咲8発話をsystemへ重複、Bは履歴参照指示だけ。履歴・userText・model・設定・条件を固定し、接続／token smokeと人手品質を別段階にする。token metadataなしはinconclusive、文字数代用禁止。6軸1〜5とcritical flags、rawのCI非保存、人手redaction必須、scanner成功≠匿名化を要求する。

48で読了済みDOC-075/076/078への上位受入基準として比較。尺度が異なるため無検証の換算をしない。現mainには最近発話をsystemへ再提示する箇所があり、Bが本番採用された証拠は今回ない。`lib/context-ab-prompt.ts`は既存48の固定Blob照合を継承し、main workflowのmain外checkoutを保持する。今回CI／モデル／workflowを起動していない。分類：未反映の実験gate、コスト削減のみの採用不可。

## 精査の範囲

追加6版：DOC-004/012/020/032/082/083。既読DOC-025/036、46〜55の14版を重複加算しない。原31残件から25残件へ。これ以外の巨大overviewは部分参照のみならpendingを維持する。設計思想は既存IDEA01〜13の具体化で、新番号なし。過去成果の否定・削除ではなく、時点と根拠を追加する。
