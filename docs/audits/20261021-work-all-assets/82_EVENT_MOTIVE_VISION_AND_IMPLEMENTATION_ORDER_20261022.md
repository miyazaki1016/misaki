# Misaki：イベント起点の自発動機・構想保全と開発順序（2026-10-22）

## 位置づけ
ユーザーとの直近対話で生まれた長期設計アイデアを**設計保全**し、すぐに巨大な新エンジンの実装を始めないための交通整理。資料77–81を上書きしない。通常会話のGemini軽量化は引き続き当面の実装優先。ここに書くイベント取得・配信・DB登録は一切未実装。

### 根本原則
「指定の時刻だから必ず送る」でも「地震・誕生日が起きたから全員に送る」でもない。**美咲が、その相手に、いま何を伝えたいと思うのか**を考えるための**動機候補**としてイベントを扱う。イベント登録≠配信予約。送らない選択も正常。本人の位置・通知同意、記憶参照利用権、ユーザーの拒否意思、頻度制限、安全上の禁止条件は動機選択より優先。送信や不送信でRelationshipの好意・愛情を報酬罰として動かさない。課金額で愛情表現の強さを変えない。

## イベント候補の3つの入口

| 系統 | 例 | データ根拠 | 開発段階 |
|---|---|---|---|
| A：プロフィール/日付 | ユーザー誕生日、二人の記念日 | 本人が共有したprofile、既存の関係イベント | 小さな初期fixture |
| B：外部出来事 | 地震、台風、大雨、初雪 | 気象庁等の信頼できる発表＋対象地域＋発表/観測時刻 | 設計保全。ネットワークpoll・通知は後回し |
| C：会話からの予定 | 「金曜日に面接」「来週旅行」「結果発表は来月」 | ユーザーの明示発言とその訂正、日付の根拠、元記憶の利用権 | 重点fixture候補。Forget安全検証が先 |

その他：美咲自身の生活で根拠がある出来事、約束、ユーザーが大切にしている日、文化・地域の行事。**初版で全種実装しない。**

## 最小限の共通契約（新しい正本DBを作らない）

候補は既存のProfile/Memory/Relationship/外部配信情報に紐づく**一時的な派生レコード**。イベントの出典と最新性を捨てない。

```ts
type MotiveCandidate = Readonly<{
  eventKey: string; // source/発生時刻/対象に基づく安定キー。重複しない
  kind: "birthday" | "personal_plan" | "earthquake" | "character_life" | "other";
  subject: "user" | "character" | "pair" | "region";
  sourceRef: string;
  observedAt: string; // 発生/発表/入力の由来。取得時刻と別
  expiresAt: string | null;
  locationScope?: { prefecture?: string; municipality?: string; provenance: "explicit" | "authorized_recent" };
  evidenceConfidence: "confirmed" | "inferred";
  consentScope: string; // 合意済み利用権。未許可なら候補化しない
  sourceGeneration?: string; // Forget/訂正後に無効化する参照世代
}>;
type MotiveDecision =
  | { action: "skip"; eventKey: string; reasonCode: string }
  | { action: "defer"; eventKey: string; reasonCode: string; until?: string }
  | { action: "candidate"; eventKey: string; reasonCode: string };
```

「candidate」は**配信承認ではない**。Character Behavior/Relationship文脈でなぜ送りたいかを考えるための入力。Body Clockで時機を判断し、Delivery Gateで認証・再検証・一意性・頻度・配信権限・最近の他通知・プライバシーを再確認する。判断理由の監査ログはreason codeのみを基本とし、会話本文や位置の細目を保存しない。

## 地震起点の注意事項

- 地震データの**全国一括poll**は候補。原則、各ユーザー分の個別地震API呼出しをしない。1分間隔案は要規約/コスト/障害耐性/重複検証。配信速度は保証しない。
- 「全国最大震度が4」だけでは対象判定できない。**ユーザーの照合対象地域で観測された震度**と、情報の確実性/地域粒度が必要。
- 新着・訂正・速報→詳細を**同じ事象**として扱うidempotency。古い所在地、登録居住地、本人の実際の所在地を混同しない。
- メッセージの送信有無は関係性だけで決定せず、本人が外部出来事による気遣いを許可しているかを優先。対象エリア全員へ送らず、最近の会話・人格・関係性・頻度・通知嗜好と合わせ判断。
- 地震後の気遣いは**緊急地震速報や公式防災通知の代替ではない**。「安全になった」「津波は心配ない」等の未確認断定を避ける。
- 動機候補抽出は通常のGeminiを全ユーザー分呼ばず、ルールベースで対象を絞ってから必要時のみモデルを使う方針。費用効果は未実測。

## C：会話由来イベントの安全要件

- 「来週面接」の相対日付は原会話の**日時・タイムゾーン・本人の言明**から確定、確信できなければ自発送信しない。
- 「面接行くかも」と「金曜に行く」の確実性は区別。
- ユーザーが予定を撤回・訂正したら旧候補も失効。Forgetでは元証拠だけでなく派生イベント・保留中判断・配送予約の利用権も失効。**Forget独立試験未実施、合格までは新経路で書込・送信しない**。
- デリケートな話題（通院、家族・仕事上の事情等）の突然の掘り起こしは、本人が望む気遣いなのかを慎重に判定。送らない/次の本人発言を待つも正しい。

## 実装交通整理（次にやることを狭く定める）

**Now（通常会話）**：実験枝 `experiment/chat-input-metrics-offline-20261022` の計測6テストのGitHub実checkout/CI相当の確認、V0 prompt parity、天気・羽田・鉄道を常時付けないV1外部relevance fixture設計。既存の監査資料81の優先順位を維持。

**Next（自発、まだ未実装）**：現在のBody Clockへの送信経路・履歴・写真/権限・NO_ACTIONの安全ゲートを精査。**誕生日1件・本人が言った予定1件・地震1件**の3つを合成MotiveCandidateとして渡し、「見送る」理由まで返す純粋テストを作る。新DB/新Cron/Pushは作らない。

**Later**：Forget全経路・配送一意性・安全テスト後、外部イベントpoll/キャッシュと受信設定、地域照合、段階的リリースを別途計画。本番操作・課金モデル・supabase本番更新は別承認。

## 現在のコードとの関係
固定main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` では、`supabase/functions/body-clock/index.ts` の `processUser` が現在の生活context、`buildProactiveDecisionContext`、`generateMessage`、配信処理を直接つなぐ。これは今回考えた汎用イベントレジストリの実装ではない。PR #31のurge/motive/no-action検討、資料77/78の共通エンジン契約を必ず比較すること。legacy BLOCKED、Forget独立16試験NOT_RUNは維持。

## 判断待ち
通知震度閾値、地震event基盤、Free/Premiumの自発記憶範囲、イベント受信オプトインのUX/初期値、Geminiを使った動機選択の割合は未確定。既存の設計候補を確定事項として記述しない。
