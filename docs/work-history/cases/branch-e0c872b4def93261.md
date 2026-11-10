# sora/canonical-relationship-integration

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** ブランチ差分（PR関連あり）

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

関連PR：[#32](https://github.com/miyazaki1016/misaki/pull/32)

根拠取得日時 (UTC)：2026-11-10T02:50:24.064930+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [docs/IMPLEMENTATION_OVERVIEW.md](https://github.com/miyazaki1016/misaki/blob/0f10f0506c95fdf0aadf8d0fd7f4afa6ec14f359/docs/IMPLEMENTATION_OVERVIEW.md)：先頭18000文字・原本リンク参照

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

### docs/IMPLEMENTATION_OVERVIEW.md

```text
diff --git a/docs/IMPLEMENTATION_OVERVIEW.md b/docs/IMPLEMENTATION_OVERVIEW.md
index b488876..3eb6a94 100644
--- a/docs/IMPLEMENTATION_OVERVIEW.md
+++ b/docs/IMPLEMENTATION_OVERVIEW.md
@@ -1542,3 +1542,104 @@ Production DB側には統合branch版Body Clockが必要とするcanonical対応
 - PR #32はDraftを維持し、Production app / DB / Edgeへの変更は明示承認まで行わない。
 
 > 未来のソラへ：Production DBとProduction app/Edgeの状態を混同するな。DB supportは先行適用済みだが、Body Clock v10は統合branchより古い。Webだけmergeして完了扱いにせず、Edge同期とrollback経路を同じ切替計画に含めること。
+
+
+### 2026-10-02 — 自然な生活圏イベント挿入の実例 / shared-world設計メモ
+
+Production実機の通常会話で、近所のスーパーについて雑談中、美咲が会話末尾に「このあと雨降ってくるかもだから気をつけて帰ってね☔」と自然に天気を差し込んだ。ユーザーが雨について聞くと、「予報だとこの後雨の可能性あるみたい」「塩浜の方も怪しい感じ」と続けた。
+
+runtime trace `519b64d7` では `weather` / `life-events` stage がともに成功。現行コードでは、ユーザーの端末現在地やユーザープロフィール居住地ではなく、美咲自身の固定生活圏として定義された江東区周辺の代表座標 `35.6728, 139.8174` を Open-Meteo に渡し、現在天気と今後6時間の予報を取得する。life-events側は降水確率40%以上、降水/雨量0.2mm以上等の意味のある変化がある時だけ `weather_forecast` をGeminiへ渡す。
+
+この実例を、今後の「美咲の世界 + ユーザーの生活圏 + 現実世界の出来事」を統合するshared-world機能の自然挿入基準として残す。
+
+#### 自然挿入の原則
+- 情報を取得できること自体を価値にしない。**会話との接点ができた時だけ口にする。**
+- API結果を読み上げず、普通の会話の一部として短く差し込む。
+- 関係のない雑談中は、情報を知っていても原則黙る。
+- 例: 帰宅・外出→雨/交通、近所の買い物→新店舗、家族の話→その人に紐づく生活圏の重要イベント。
+- 情報の確信度に応じて言い方を変える。曖昧なら「〜だったっけ？」「〜みたい」等で確認余地を残す。
+- ユーザーの訂正・確認は、その後の生活圏/記憶更新の根拠候補にする。
+- 安全・災害情報は信頼できる外部情報を根拠にし、根拠以上の断定をしない。
+
+#### 将来の処理イメージ
+`現実情報取得 → 会話との関連性判定 → 今言う価値の判定 → 美咲らしい自然表現 → ユーザー反応による記憶/生活圏更新`
+
+#### 重要な境界
+今回の「塩浜の方も怪しい」は、塩浜町丁目ピンポイント予報を取得した証拠ではない。固定された江東区周辺代表座標の予報を、美咲自身の生活圏「江東区・塩浜周辺」の文脈で表現したもの。今後ユーザー生活圏へ拡張する際も、隠れた端末現在地を勝手に使わず、本人の会話・確認済みプロフィール等から得た生活圏を根拠にする。
+
+> 設計の狙い：位置情報対応AIではなく、**美咲が自分の世界で生活しながら、ユーザーにとって意味のある世界の変化にも自然に気づく会話AI**を目指す。
+
+
+#### shared-worldのプライバシー境界 — 「知れることを全部知ろうとしない」
+
+生活圏機能が高度になるほど、外部情報を取得できる能力と、美咲がその情報を知っていて自然かどうかを分離する。
+
+**原則：美咲は、知れることを全部知ろうとしない。**
+
+- ユーザー本人が会話で教えた情報、過去に本人から聞いて記憶した情報、天気・一般ニュース・地域の店舗情報など通常の生活で自然に知り得る公開情報は、会話との関連性がある時に利用できる。
+- 一方、学校名などの断片から担任・家族・知人など特定個人を外部検索で突き止めたり、SNS等を横断して本人が教えていない個人情報を推定・収集したりしない。
+- 「技術的に取得可能」だけを理由に、美咲の知識として会話へ持ち込まない。
+- 判断基準は「人間の親しい相手なら、この情報をどうやって知ったのかを自然に説明できるか」。知った経路が不自然なら使わない。
+- ユーザー自身が「子供の担任は田中先生」等と話した場合、それを後日自然に覚えていることはshared-worldの価値になり得る。ただし学校名等から担任名を外部で特定して突然言及するのは対象外。
+- 目標は「なんでそんなこと覚えてるの😳」という嬉しい驚きであり、「なんでそれを知っているの😨」という監視感を生まないこと。
+
+この境界は、今後shared-world / user life-areaの取得ソースや自発会話を拡張する際の必須設計条件とする。
+
+
+### 2026-10-02 — Production canonical cutover 完了 checkpoint（PR #29〜#43）
+
+この節は、上の途中記録に残る「Production未切替」「PR #32 Draft」「Body Clock v10」等より新しい。**現在状態はこの節を優先する。** テスト成功とProduction安全を混同せず、以下は実際に確認した範囲だけを記録する。
+
+#### Production現在値
+- Web main: `37cf2140485869d8dda1b1b94b96a7954374f480`（PR #43 merge）。
+- Vercel Production: `dpl_9z8Qr8Mx3X84UgwmeJKsgH8wfyXE`、`READY`、alias `misaki38-ai.com`。
+- Production Body Clock Edge: version 11。custom `x-cron-secret` 境界を使い、canonical continuity対応版として稼働。
+- Production DBはcanonical/relationship v2/temporary continuity等のsupport migrations適用済み。privileged relationship/canonical更新はservice_role境界を維持し、authenticated/anonへ権限を広げていない。
+
+#### Web切替で通過した主要PR
+- PR #29: canonical server-state foundation。
+- PR #33: anonymous history GETの安全なephemeral応答。
+- PR #34: profile-aware life-events。
+- PR #35: cutover cleanup、JR East server-side取得の隔離、ユーザー固有のtaxi metadataをglobal promptから除去。
+- PR #36〜#39: history同期診断を段階的に行い、真因を `app/chat/chat-timestamp-display.tsx` の5秒 `setInterval` と確定。PR #39で定期pollを除去し、initial/focus/visibility等の必要同期だけを残した。診断コードも除去。
+- PR #40: Gemini 429/502/503/504を2秒→5秒のbounded retryで吸収。通常500はretryしない。
+- PR #41: 待機表示のレイアウト修正。
+- PR #42: 通常応答が1.8秒を超えただけで「美咲ちゃん、ちょっと忙しそう」と表示していたfalse busy timerを除去。通常待機はtyping dotsのまま。
+- PR #43: Production実機で発見した30秒 `GEMINI_TIMEOUT` に対し、2秒待って**1回だけ**再試行するbounded timeout retryを追加。2回目もtimeoutなら既存failure/refund pathへ落とす。通常500はretryしない。
+
+#### Production runtimeで確認した重要事実
+1. 5秒history GET問題:
+   PR #39後、30秒以上の実機観測で旧5秒cadenceは消失。reload/focus等に伴うGETまで「全て消えた」とは扱わない。
+2. Gemini 503:
+   旧Productionで実際の503を確認しPR #40を導入。PR #43後の最終smokeでも trace `717baf9e` が初回503 → `GEMINI TRANSIENT RETRY`（2秒）→ Gemini 200 → chat 200 / `ok:true`、total 10.151秒となり、**既存503 retryがProductionで実際に回復させた**ことを確認。
+3. false busy:
+   PR #42後の実機で、通常待機中にfalse busy文言が出ないことを確認。
+4. timeout:
+   2026-10-02 21:37 JST、旧PR #42 Production trace `c514b8d0` でGemini initialが約30秒後 `GEMINI_TIMEOUT`、chat 500を実測。これがPR #43の直接原因。
+   PR #43はcode review + regression + GitHub Actions #286 SUCCESS + Preview READY + Production READYまで確認。最終smokeではtimeout自体が再発していないため、**timeout retryのProduction実発火を確認済みとは書かない**。
+5. failure/refund:
+   chat outer catchは `refundIfCharged()` を通り、Free consume済み失敗をrefundする既存経路を再確認。自動回帰も維持。ただし上記21:37の特定timeout requestについてDBでrefund行そのものを直接突合した、とはこのcheckpointでは主張しない。
+6. 最終通常会話smoke:
+   新Productionで少なくとも3件の `POST /api/chat` が200 / `ok:true`。うち2件はGemini初回200、1件は上記503→retry→200。確認時点の新Production 5xxは0件。
+
+#### JR East / life-events
+JR Eastの公式ページはVercel server-sideで403になるため、現行コードは `process.env.VERCEL` でJR取得を返さず、Productionの診断ノイズを止めている。公式にserver-consumableな取得方法が確立するまで再有効化しない。weather/life-eventsは別系統で継続する。
+
+#### rollback基準
+現在の直前Production rollback候補はPR #42世代:
+- `dpl_LSJJYCHST4t8ewbCtdd3hXPRdWRT`
+- main `b6bd03cde1e44c77545978c2c144ac82e7c4b1b1`
+さらに必要ならPR #41 `dpl_HtHfEsJzqYgfaECKuuyW8odpjaZ5`、PR #40 `dpl_9nxMH17Ko2HHTqZSqWYTV17cHRpm`、PR #39 `dpl_FWb7LWJWLHh6ti7pZAm6RJhALnGg` が履歴上の復帰点。ただしDB support migrationsをその場で即席rollbackする運用はしない。
+
+#### canonical cutover判定
+2026-10-02時点で、canonical server-stateへのProduction切替工程は**完了checkpoint**とする。これは「今後バグが存在しない」という意味ではない。Production切替を止めていた既知P1、Body Clock同期、relationship権限境界、5秒history polling、Gemini一時503吸収、false busy、今回発見したtimeout retryまでを現在Productionへ反映し、CI/Preview/Production smokeの各段階を通過した、という意味である。
+
+次工程はcanonical移行の延長修理ではなく、shared-world / 6段階relationship・5 hearts等の製品機能を別工程として進める。
+
+#### shared-world追加メモ — 美咲の「家」と「現在地」を分ける
+Production会話で、美咲の固定生活圏（江東区・塩浜周辺）の天気を根拠にしつつ「こっちは少し雲が怪しくなってきたから、急いで帰らなきゃ！」という返答が出た。固定生活圏は「美咲が普段生活する地域」の根拠であり、その瞬間に美咲が家の外にいる証拠ではない。
+
+今後のshared-worldでは最低限、
+- home / life area（普段の生活圏）
+- current place / activity（その時どこで何をしている設定か）
+を別状態として扱う。current placeの根拠がない時に、天気情報だけから「今外にいて帰宅途中」等の行動を創作しない。これも「知れることを全部知ろうとしない」と同じく、世界の整合性を守る必須境界とする。

```

