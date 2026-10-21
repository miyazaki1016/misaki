# Misaki 共通会話エンジン：設計総覧・骨格 v1（対話合意と未決事項）

作成: 2026-10-22。**設計記録のみ。未実装・未採用の技術案を含む。** 第5次の静的資産棚卸し完了（資料73/76）と、第6次への引継ぎを踏まえて、ユーザーとの直近の設計対話を埋もれないよう保存する。原監査資料01〜76、main、本番Misaki、Supabase、アメふるは変更しない。

## 0. 最重要のプロダクト方針（今回の対話で合意）

- **恋人・結婚・親密度の最大値はゴールではない。** 関係に固定の終点を設けない。
- 長く続く価値は、**二人の歴史の蓄積（理解・約束・訂正・共有した経験）**と、**キャラクター自身の継続的な変化・成長**の両方。親密度だけを無限増加させない。
- 時間・ログイン回数・課金額を、愛情・成熟・関係の加速や罰の代理指標にしない。人工的な事件や寂しさで継続を煽らない。何も起きない日も許容する。
- キャラは変化し得るが、基本人格を突然別人へ変えない。昔と今の変化が会話中に自然に現れ、後から訂正できること。
- 当面は美咲一人の品質を高める。**複数キャラに再利用可能な骨格を最初から採用候補にする**が、UIのみcharacter_idを追加する安易な移行は不可。
- 現実に起きたユーザーの出来事と、AIキャラとして語られた架空の生活・会話上の思い出を混同せず、情報源・確実性・鮮度を保持する。

## 1. なぜ共通エンジンか（4目的）

1. **Gemini軽量化**：天気、短時間予報、地震、気象警報、鉄道運行、羽田の便の乱れなどの外部情報を、毎回全文送らず、**会話の流れ・自発動機・キャラの生活・重要度・取得できた事実と鮮度**に応じて選択する。取得とGemini送信は別判断。
2. **会話品質の継続調整**：質問過多、反復、突然の甘さ、記憶・関係状態・生活状況の取り違えを、共有機構とキャラ固有パラメータに分解しLabで評価する。
3. **複数キャラ**：共通処理を共有しつつ、各キャラ固有の人格・生活・成長と、User×Character専用の履歴・記憶・関係・秘密を守る。
4. **通常チャット／自発メッセージの整合**：同じCharacter/Pairの状態・意味・権限を基礎にするが、「話しかけたいか」「何もしない」は生成前に判断する。写真やPushへの配送は別の最終検査を通す。

## 2. 骨格案：6つの責務＋不変 Conversation Snapshot

```text
通常Chat / Body Clock・自発候補 / オフラインLab
  → (1) Gateway: 認証、入口、用途、実行許可（runtime側）
  → (2) Context Resolver: owner/scopeを検証済みの記憶・関係・外部状況を選択
  → immutable, provenance-aware ConversationSnapshot
  → (3) Character Behavior: 人格・経験に基づく傾向、現在の関係/表現、自発動機
  → (4) Conversation Composer: 共通＋Character＋Pair＋関連情報からprompt構築
  → ModelPort(Gemini等)
  → (5) Response Evaluator: schema、捏造・禁則・反復・一貫性の検査、条件付きretry
  → ReplyCandidate（提案であって、保存・送信命令ではない）
  → (6) Output Coordinator（runtime側）: 最新権限/世代/同意/plan/送信境界を再検証して確定
```

(2)(3)(4)(5)の**純粋な評価・組立部品**を中心に共通化する。DB、認証、quota、支払、外部API通信、正式なstate更新、Push、photo deliveryは原則エンジン外で実施する。Resolver自体も「外側の認可済み取得」と「内側の純粋選別」を区別。ModelPortへの物理呼び出し/隠れたretryの課金回数はruntime側予算で制限する。純粋性・同一snapshotでの再現性・旧本番との互換性は**検証目標**であり、現在達成済みの宣言ではない。

Snapshotは少なくとも `purpose`（chat/proactive/lab）、`characterId`、`userId`、Pair scope、各sourceのprovenance/取得時刻/期限/epistemic status、persona version、relationship/state version、Forget世代/利用権の根拠、正当なcapabilities、モデル入力候補と履歴を区別する。Snapshot作成時の利用権は、後続の保存/Push送信時の許可の代替にならない。

## 3. 外部情報：毎回送信から条件付き選別へ（優先検証テーマ）

- main（固定基準 `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`）の `app/api/chat/route.ts` は通常chat内で `getTokyoWeather()` と `getTokyoLifeEvents()` を用いて `weatherGuide` と `tokyoLifeEventsGuide` をsystem promptに挿入する。
- `lib/tokyo-life-events.ts` は地震／気象警報・注意報／江東区周辺6時間予報／JR運行情報／羽田国内・国際線の乱れを組み立てる。現在天気は別経路。**毎ターンpromptに組み込むこと ≠ 外部APIへ毎ターン必ず新規ネットワーク取得すること**（cacheあり）。
- JR情報はmainにVercel環境での403回避・取得skipがあり、配信上の実在・精度は未受入。最大9イベントの結合順で後方の情報が落ちる可能性がある。空配列でも長い「情報なし」説明が送られる。数値・実token比率はまだ未計測。
- 改善候補：外部取得/キャッシュ→出所・有効期限・欠測状態管理→文脈との関連性選別→必要な内容だけ短く要約→Composerへ入力。重要な安全情報も**無条件に全ユーザーへ喋ることとは区別**し、必要な文脈と適切な通知経路を評価する。
- 毎ターン別の有料LLM分類を追加してしまうと逆効果。まずルールベース/非課金の判定、合成fixtureで比較。ユーザーから聞かれたときだけ取得する案は、自発的な気づきを消すため無条件採用しない。
- main Body Clockでは同じ外部状況の取り込みが通常chatと一致するとは確認されていない。**共通external-contextインターフェイス候補**として両経路を静的比較する。

## 4. 自発メッセージとFree/Premium（基本構想の既存規則）

`docs/MISAKI_SYSTEM_VISION_20261021.md` 第6章の基準：
- **Free**：自発メッセージの話題は主にキャラ自身の日常・出来事・気持ち。ユーザーとの過去会話や二人の思い出を、無料の自発話題生成用素材として使わない方針。
- **Premium**：本人の許可と用途/権限がある場合に限り、User Memory・Shared Memoryを少数参照した文脈ある自発メッセージを検討可能。
- Free/Premiumの決済・契約確認、quota、回数/頻度、送信許可は外側。エンジンには**用途別に確定済みの利用能力（capability）**のみ渡す。plan名による好意・関係ポイント・人格の加減は禁止。
- 上記は**現時点の設計基準**。通知頻度/費用/上限、通常チャット記憶、ダウングレード時の利用停止と保持の細則、本番実装の到達度は未決・未受入。
- 自発性は「dueになったら自動送信」ではない。PR #31のurge/motive/no-actionは重要な未統合候補。mainには別のclaim/cadence・見送り経路があり、旧PR一式の丸移植不可。

## 5. 会話調整・長期成長の責務分離

- **共通Quality Policy**：事実の捏造、矛盾、反復、過剰質問、関係/同意/Forget違反を検出。評価結果を恋愛/信頼/人格の報酬罰へ直結させない（既存IDEA14）。
- **Character-specific Style**：口調、ユーモア、質問傾向、感情表現、関心領域、積極性をキャラ固有に調整。単純な定率ルールで固定しない。
- **Pair-specific Continuity**：二人の事件/修復/約束/境界/好みの変化。相手ごとに違う振る舞いは許すが、別ユーザー/キャラに秘密を漏らさない。
- **Character Evolution**：成長候補のevidence/reasonと承認経路は専用のwriterが扱い、Composerは既に承認された状態だけを受け取る。変化は突然の全人格置換にしない。
- **Life Continuity（仮称、概念上の設計思想）**：関係が成熟した後も、経験や信頼の履歴＋キャラクター自身の変化から会話へ意味を反映する。**新しいDB正本や独立の自動成長数値を増やす提案ではない**。履歴にない架空の過去体験を作らない。
- Labは本番と共通の純粋処理・固定合成snapshotを使い、同じ条件で評価する。Prompt byteの互換／Gemini物理call・費用／モデルの表現品質を別々に測る。課金ありの実モデル実験は別途明示承認が必要。

## 6. 元の保存資産と今回の追加・改訂点

| 根拠 | 既存資産の内容 | 今回の扱い |
|---|---|---|
| PR #87 `design/shared-conversation-engine-contract-20261015` | immutable snapshot、pure prompt→model→validate→expression、auth/quota/writesは外部、Labと本番parity | **骨格の出典**。設計Draft、未本番採用 |
| PR #88 `experiment/shared-conversation-history-v1-20261015` | `lib/conversation-engine/` にhistory, memory, character, layered promptなどの純粋部品 | **部品資産**。PR説明時点と枝の後続差分を区別し、mainへの全配線済み認定をしない |
| PR #86 Conversation Lab | 品質評価/比較の実験資産 | キャラ固有調整を再現検証する場。実モデル品質受入ではない |
| PR #31 Relationship Time v2 | 会話→感情/行動→自発性、urge/motive/no-action、写真・関係Story | **自発動機の出典**。古いEdgeやSQL丸ごと取り込み不可 |
| `docs/MISAKI_SYSTEM_VISION_20261021.md` | Character/User/Pair分離、Free/Premium proactive、終点のない関係、人格成長 | **既存基本方針を継承** |
| 第5次監査資料65/72/73/76 | 未反映7成果群・IDEA・Forget契約と静的棚卸し | 第6次へ引き継ぐ。完了したのは静的棚卸しであり本番検証ではない |

今回の対話でより明確にした点：**外部情報の文脈依存選別をGemini軽量化の第1優先に置くこと**、**会話の細かな調整を共通engineに部品化してキャラごとの個性に適用すること**、**親密度到達後も「二人の歴史」と「キャラ自身の成長」の双方が長期価値であること**。これらは新規合意・設計方針であり、既存実装の完成宣言ではない。

## 7. 受入ゲート・次に決めること（今回未実施）

1. 固定mainの通常chat/Body Clockの処理を「外部取得・記憶取得・選別・prompt・model呼出し・検査・保存・配送」に分解し、現況対応図を作る。
2. リアルタイム外部情報について、種類別送信文字量・実token候補・取得頻度・キャッシュ・欠測・高優先情報の閾値を測る。**割合や節減額は未測定**。
3. Character/User/PairとFree/Premium用途別capabilitiesを型に落とす。情報の所有・同意・Forget世代・期限を最終送信まで検査する。
4. PR #87/#88/#31/#86とmainの各部品を、再利用／設計再適合／試験資産／不採用理由に分類。両経路の自然さと「送らない」を合成fixtureで比較。
5. Persona承認、Relationship worker writer、Body Clock/写真/通知の競合、Forget派生19種と独立16試験は第6次の未解決・未実施として保つ。実装時は対象writer/利用/配送の安全ゲートを先に審査する。
6. main、本番、Supabase、アメふる、PR merge、実Gemini課金・deployには**新たな承認なく触れない**。本資料の追加は製品コード変更の承認ではない。

**出典リンク**：PR #87 https://github.com/miyazaki1016/misaki/pull/87 ・PR #88 https://github.com/miyazaki1016/misaki/pull/88 ・PR #31 https://github.com/miyazaki1016/misaki/pull/31 ・PR #86 https://github.com/miyazaki1016/misaki/pull/86
