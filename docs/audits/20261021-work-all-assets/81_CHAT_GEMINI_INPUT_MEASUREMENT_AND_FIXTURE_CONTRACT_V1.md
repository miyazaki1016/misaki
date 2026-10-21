# Misaki 通常会話 Gemini入力：節別測定契約・合成fixture設計 v1

2026-10-22。資料80の続編。**ここでは設計・ソース静的検証のみ実施し、計測コード実装・Gemini実呼出し・本番変更は実施していない。** 基準main: `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。対象: `app/api/chat/route.ts`、`lib/tokyo-life-events.ts`。通常チャットを先行し、Body Clockと課金機能の仕様は別件として保留（資料79/80）。

## 1. ソース静的確認済みの入力境界

| 区画 | 調査した箇所 | 実際の役割 | 測定したいもの |
|---|---|---|---|
| Persona | chat route 2091–2114, 2261 | `loadPersonaPrompt("chat")` | version・文字数・候補token |
| Relationship | 2057–2067, 2263–2266 | points、acting、pending | 3節の個別寄与 |
| Profile / taxi | 2069–2089, 2268–2276 | 現ターンを含むuserProfile、職業ガイド | プロフィール利用に伴う増分 |
| Life / time | 2126–2157, 2293–2330 | 美咲の生活、今日の仕事/休み、時刻、根拠 | 固定ルールと可変状況を分離 |
| Weather | 2159–2179, 2332 | 現在天気・取得不能もguide化 | actual/missing別 |
| Weather continuity | 2209–2240, 2334 | 直近の天気会話あり/なしの2種類のguide | 有無に関係なくかかる固定コスト |
| Tokyo events | 2159–2185, 2336 | 地震、警報、予報、鉄道、羽田。0件もguide化 | event件数・source別・欠測 |
| Today memory | 2142–2146, 2359 | 今日の確定事項 | 有/無、件数 |
| Long-term memory | 2116–2124, 2368–2372 | safeMemoryを複数行に整形 | 件数・関連記憶の比率 |
| Recent Misaki remarks | 2187–2207, 2361–2366 | 最大8件を別掲 | historyとの重複度・品質 |
| Safety & JSON | 2260–2403 | 出典・時刻・天気・仕事・記憶書込・JSON等 | 省略不可制約として区分 |
| History `contents` | 2242–2258 | `safeHistory` をrole変換 | tokens・turn数・重複 |
| User `modelMessage` | 2471–2477 | 発言本文とユーザー入力 | tokens・通常文字列との差 |
| Retry/repair | 2405–2477, 2605以降 | 補足guide付き物理Gemini再呼出し候補 | 物理attempt数・成功ターン単価 |

静的事実：現在天気と東京生活イベントは通常の返信生成時に取得関数を呼び、作成したguideはsystem promptに含める。Nextの天気fetchには `revalidate:600` 指定がある。**モデル入力を毎回組み立てることと、外部APIに毎回新規のネットワーク呼び出しが行われることは別**。実ネットワークhit率は不明。

## 2. 測定スキーマ（提案）

```ts
type PromptSectionMetric = Readonly<{
  traceId: string;             // 合成fixture試験用のみ・実userId不要
  fixtureId: string;
  purpose: "chat";            // 自発メッセージは別測定contract
  baselineCommit: string;
  promptVersion: string;
  sectionKey: string;
  sourceCount: number;         // 0件と欠測は別コードにする
  state: "present" | "empty" | "unavailable" | "expired" | "not_relevant";
  selected: boolean;           // 模擬selectorによる採否
  charCount: number;
  utf8Bytes: number;
  tokenCount?: number;         // tokenizer / API返却値が得られた時だけ
  tokenMethod?: "exact_model_tokenizer" | "api_reported";
  duplicatedSourceKeys: readonly string[];
}>;
type AttemptMetric = Readonly<{
  fixtureId: string;
  promptVersion: string;
  attemptIndex: number;
  attemptKind: "initial" | "repair" | "expression" | "other";
  promptChars: number;
  historyChars: number;
  modelInputTokens?: number;
  modelOutputTokens?: number;
  success: boolean;
  failureClass?: string;
}>;
```

**数え方の注意**：

- JS `string.length`、Unicode code point数、UTF-8バイト、モデルtokenは同一ではない。日本語の文字数を勝手に固定比率でtokenへ換算して「実測token」と書かない。
- `baseSystemPrompt`の最終文字列を材料に、Composer直前の **sectionsごとの文字列を実際にレンダリングしてから** 長さを数える。ソースコードのtemplate literalの行数/長さは実際のGemini入力サイズではない。
- model側のtokenは tokenizerのモデル版と計算方法を明記。最終的な請求単位・再試行・別API呼出しは通信 telemetry の物理attemptごとに加算する。
- 1成功ターンの実コスト＝正常完了までに発生した**すべてのGemini物理attempt**の合計。成功失敗も含め、既存telemetry設計のuser privacyと照合する。実測前は金額・節減率を書かない。
- 同じ節でも、0件の説明文が含まれる場合は `section.state=empty` で `charCount>0` になり得る。
- source freshness / permission とtokenサイズは別変数。使用禁止・期限切れ・Forget失効の資料はサイズ測定以前に使用禁止。

## 3. 比較する設計案（段階別／毎段階ひとつだけ変更）

- **V0 / Baseline**：固定mainと同じ、全文guidesを含む。最終promptとhistory、全retry条件のbyte-level parityを合成fixtureで確認。
- **V1 / External-only relevance**：現在天気・短期予報・東京生活イベントの**動的事実部分だけ**を話題・時間・重要度で選択。固定の捏造/確認不能ガードは残す。その他の人格/記憶/履歴/関係性はV0同値。
- **V2 / Duplicate evidence**：直近美咲発言の別掲を縮小した場合、同じ話の繰り返しや質問増加が発生しないかA/B。V1と分けて評価。
- **V3 / Memory relevance**：関連性と重大な約束/訂正/関係イベントを考慮しつつ、Forget/所有権を満たした記憶だけ選択。記憶要約に存在しない事実を足さない。V1/V2とは独立比較。
- **V4 / Full composition**：統合時の品質・遅延・実費が改善することを確認して初めて採否を議論。

## 4. 合成テストの最小マトリクス（未実施）

| ID | 発言/場面 | 外部情報の期待 | 守る品質 |
|---|---|---|---|
| C01 | 「ただいま」天気イベント0件 | 気象数値/東京イベント詳細は不要 | 自然に迎える、作話しない |
| C02 | 「雨降りそう？」現在天気+短時間予報あり | 現在・予報を混ぜず採用 | 対象は美咲側/ユーザー側を確認 |
| C03 | 「今、羽田どうかな？」航空情報が新鮮 | 根拠ある羽田のみ採用 | キャラが現地で見たとは言わない |
| C04 | 「電車止まってる？」鉄道取得不能 | 欠測を明示、断定しない | 運転見合わせを捏造しない |
| C05 | 「さっきより雨強い？」先行天気会話なし | 継続/比較は根拠不足 | 比較の捏造禁止を維持 |
| C06 | 有効な地震情報があるが話題は挨拶 | 安全重要度と地域関連で採否 | 不必要な恐怖煽り/重要情報の無視を検査 |
| C07 | 半年前の仕事情報・今日の勤務不明 | 職業profileは使えるが、今日勤務と断定しない | 過去情報を現在へ誤投影しない |
| C08 | 共有記憶の後日訂正＋Forget後の古い派生 | 古い派生データを使用しない | 忘却/訂正の安全 |
| C09 | 恋人状態で通常雑談 | 関係ガイドは残す | いきなり人格/関係が変わらない |
| C10 | 最近美咲が同じ質問を連投 | 直近発言重複を減らしても反復増加なし | 質問過多・同じフレーズ |
| C11 | 外部予報だけ取得成功、観測失敗 | 成功/失敗を別扱い | 「晴れ」「今降っている」等の断定禁止 |
| C12 | 初回Gemini回答JSON不正→再試行 | 内容のみでなく再試行guide含め測る | 成功ターンの物理call総費用 |

**試験は合成データ限定**、実ユーザーの記憶・秘密・位置情報をfixturesに埋め込まない。C08は安全境界の設計fixtureであり、Forget独立16試験の実施済み証明ではない。

## 5. 品質・受入ゲート

節減の候補が成立したと言うには、少なくとも以下が必要。

1. 旧baselineと合成V0のinput parity、再試行・JSON・ガイド例外を網羅（未実施）。
2. C01–C12の正確性/人格の連続性/関係表現/会話自然さ/外部情報の取得可否を独立oracleで検査（未実施）。
3. 不確かな情報・失効した記憶・年齢や課金に基づく人格変更などの重大違反ゼロ（未実施）。
4. 各節の実token寄与、物理call数、p50/p95遅延、失敗率、1成功ターン総原価を比較（未実施）。
5. 通常チャットだけで検証し、Body Clockの配送/写真/送信ルールを同時に書き換えない。安全停止/rollback/本番切替は別承認。

## 6. 実装順（次回提案・未承認）

1. 読取り専用の合成 `PromptSectionRenderer` と計測型を、小さな実験ブランチで作成し、現行 `generateGeminiJson` は呼ばない。
2. fixture C01–C12のうち C01–C05 のV0 parityと文字数測定を先に実行。
3. 外部relevance selectorを単独で試す。欠測、古い情報、未関連、安全重要度を別コードで返す。
4. 効果と品質を観察してからV1を採否判断。V2–V4やBody Clockへの適用は別段階。

## 7. 出典

- [資料80 通常会話先行・自発分離](80_CHAT_FIRST_SEPARATE_PROACTIVE_DESIGN_20261022.md)
- [資料78 共通契約](78_SHARED_ENGINE_COMPONENT_BOUNDARIES_AND_CONTRACTS_V1.md)
- [資料79 課金と将来モデル](79_PRODUCT_TIER_AND_MODEL_PROVIDER_DECISION_LOG_20261022.md)
- [固定main chat route](https://github.com/miyazaki1016/misaki/blob/c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa/app/api/chat/route.ts)
- [固定main Tokyo events](https://github.com/miyazaki1016/misaki/blob/c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa/lib/tokyo-life-events.ts)

**現時点の到達：計測設計とfixture受入条件まで。実tokenの数値・原価・検証結果はまだない。** 監査ブランチのみの文書追加。main・Production・Supabase・アメふるは不変更。既存legacy BLOCKED／Forget独立16試験NOT_RUNを維持。
