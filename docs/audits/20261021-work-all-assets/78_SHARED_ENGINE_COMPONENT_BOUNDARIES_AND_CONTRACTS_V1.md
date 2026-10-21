# Misaki 共通会話エンジン：部品の責務境界・契約 v1

日付: 2026-10-22。**77の続編となる検討資料**。本書のコード例・型・受入条件は設計案であり、製品実装、現在稼働、本番適用、料金仕様確定を表さない。基準main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`、監査枝の資料73/76/77、PR #31/#86/#87/#88を参照。監査専用枝への新規文書保存のみ。

## 1. 境界の原則

**共通エンジンは「認可済みの状況から、各キャラクターらしい返答候補を作る」ための純粋な共通機構。** DBから勝手に記憶を読まない。外部ネットワークで勝手に現実情報を集めない。Free/Premiumの決済・quota管理をしない。候補を書込み・配信しない。モデルの物理API回数は明示されたbudgetの内側。通常チャット・自発候補・Labで同一の契約を持つが、入口と配信/永続化ルールは異なる。

| 責務 | 入力 | 判断・結果 | 禁止/外側の責務 |
|---|---|---|---|
| A. Runtime Gateway | auth済みUser/Character、purpose(chat/proactive/lab)、用途別entitlements、許可・budget | 実行権限確認、読み取り準備、モデルport等の接続 | プラン名で人格/関係を変更しない |
| B. Snapshot Resolver | 正本読取・各sourceのprovenance/鮮度・scope・同意・利用許可 | Character / User / Pair / externalを混在させない不変snapshot | pure engineにDB権限や外部API鍵を与えない |
| C. Relevance Selector | 会話直近の話題、重要度、自発動機、候補情報、情報の利用範囲 | 使う情報と「使わない理由」、欠測/期限切れを返す | 全外部情報を毎ターンdumpしない、秘密の再推論をしない |
| D. Character Behavior | Characterの基本人格/承認済み成長、Pairの状態、会話の場面 | style / expression / tone / conversation-mode、proactiveの話題候補 | 人格・Relationshipの正本を更新しない |
| E. Prompt Composer | 選別済みsnapshot、共通/キャラ固有/Pair固有のguide、出力契約 | modelのsystem/messagesの構築、各節のbyte/token候補計測 | キャラ固有人生を全キャラへ固定しない |
| F. Generation & Response Evaluator | model port、候補、validation policy、残budget | schema parse、矛盾/捏造/反復/安全境界チェック、限定retry、ReplyCandidate | 評価で好意/relationship/traitを自動減点・変更しない |
| G. Runtime Output Coordinator | ReplyCandidate、最新のsource権限/Forget世代/関係・更新version、同意・プラン・delivery状態 | 再認可、正本commit、quota確定/返金、通知/写真/relay/receipt/公開 | Snapshot生成時の許可だけで送信しない |

**純粋な共通化の中核**は C・D・E と Fの判定部分。A・Bの認証/実データ取得とGは環境別adapter。Fの実Gemini通信はinjectされたModelPort/transportの責任で、費用とretryの実際の試行数を記録。PR #87の純粋engine定義に準拠するよう、境界の論理名を整理したもの。

## 2. Snapshotの最小契約案

```ts
type Purpose = "chat" | "proactive" | "lab";
type ScopedSource<T> = Readonly<{
  value: T;
  owner: "character" | "user" | "pair" | "external";
  characterId?: string; userId?: string;
  sourceId: string; obtainedAt?: string; validUntil?: string;
  epistemic: "confirmed" | "tentative" | "corrected" | "unknown";
  authorizedPurpose: readonly Purpose[];
  revision?: string;  // 実際のstate/Forgetバージョンと混同しない
}>;
type ConversationSnapshot = Readonly<{
  purpose: Purpose; userId: string; characterId: string;
  character: ScopedSource<unknown>;
  userContext: readonly ScopedSource<unknown>[];
  pairContext: readonly ScopedSource<unknown>[];
  externalCandidates: readonly ScopedSource<unknown>[];
  turns: readonly Readonly<{role:"user"|"character"; text:string}>[];
  permittedCapabilities: Readonly<{
    memoryUse: "none"|"character_only"|"consented_user_and_shared";
    allowProactive: boolean;
    allowPhotoCandidate: boolean;
  }>;
  authorizationEvidence: Readonly<{
    forgetGeneration?: string;
    relationshipVersion?: string;
    personaVersion?: string;
    asOf: string;
  }>;
}>;
type PreparedReply = Readonly<{
  selectedSourceIds: readonly string[];
  excludedSourceReasons: readonly string[];
  systemInstruction: string;
  replyCandidate?: string; // writerが採用するまでは候補に過ぎない
}>;
```

上記の `unknown`、enum、フィールドは**説明用の仮契約**。現行SQL/RPC型ではない。実装時は「unknownを黙って渡さず安全側に保留」「確定した出典と訂正履歴」「用途ごとの利用権の再検証」を機械的に証明する必要がある。Free/Premiumの文字列はエンジンに渡さず、**認可済みの利用範囲**だけを渡す。データ取得/絞込み段階も正当なアクセス制御を越えてはいけない。

## 3. 通常チャットと自発メッセージは「同じ素材・別の入口」

### 通常チャット

ユーザーの明示発言を重視し、外部情報は **質問・直近の流れ・キャラ生活文脈・根拠ある重要性** に合う場合のみ候補として選ぶ。不要なら外部イベント詳細/天気数値をsystem promptに埋め込まない。ただし「データ取得不可」を「現実に何も起きていない」に置換しない。救急/警報でも過度な作話、断定、存在しない入手経路は禁止。必要な安全ルールは削除しない。

### 自発メッセージ（Body Clock）

1. due/claimは**評価機会**。送信命令ではない。DB claimによる既存の見送りと、PR #31のurge/motive/no-actionを同一視しない。
2. 先にRelationship Story、合意・境界、履歴/生活根拠、連絡間隔から**話しかける理由があるか**を判定。`NO_ACTION` は正当な結果。余計なGemini生成を省ける可能性があるが費用効果は未計測。
3. 話しかける正当な理由がある場合のみ、話題と関連する記憶・外部情報を選ぶ。自発文だけ外部情報で人格が変わらない。
4. Freeの自発話題は **Character自身の日常/出来事/気持ちが中心で、過去会話・共有思い出を素材にしない**。Premiumでは同意済User/Shared Memoryの少数利用を検討できる。ただし課金と好意・人格成長を結び付けず、実際の通知頻度・上限/正常系は未決。
5. 本文生成、写真候補生成、commit、Push relay、open/receiptの各境界で**現行の同意、利用権、Forgetや状態version**を再評価。外部handoff後の撤回限界は明示する。

### Lab

実ユーザーデータではなく隔離した合成snapshotで、同一のprompt builder、validators、attempt/retry指示が同じになることを確認。モデル品質比較には独立した人手評価が別途必要。Labの成功を本番の安全性/品質の証明としない。

## 4. 会話調整・キャラクター成長の配置

- 共通品質制約（捏造しない/相手を取り違えない/同意/安全/反復抑制）と、character別の表現傾向（話し方、ユーモア、質問、感情表現、話題好み）を別レイヤーにする。
- Pair別の関係と履歴はさらに別。恋人/結婚というstatusや深い信頼が会話品質フィードバックで増減する設計にしない。
- 長期成長は **Character自身の承認済みの変更**と **Pairに蓄積した出来事/理解** の2経路。どちらも時間経過だけで生成しない。長く続ける価値＝成熟した関係の継続と、基本人格の連続性を持った新しい発見。
- Persona Evolution・Relationship worker等のwriterが候補と根拠を審査/採用する。会話エンジンは結果を表現するだけで、成長値をDBへ直接書かない。**Life Continuityは利用モデル/設計思想であって、新たな独立正本を作らない。**
- 設定値だけで自然さを保証しない。短期/長期履歴・訂正・親密度/Stage・情緒、通常/自発の双方を含むfixtureで非劣化を評価。会話の継続を促すための罪悪感・寂しさ誘導は採用しない。

## 5. 最新の実装対応と未採用の差分（固定mainの静的照合）

| 設計区画 | 現行mainの観測 | 既存実験/設計 | 未完成部分 |
|---|---|---|---|
| 外部情報 | `app/api/chat/route.ts` 2160周辺で天気＋生活イベントを集め、2300周辺のsystem promptへ挿入。 `lib/tokyo-life-events.ts` は地震/警報/予報/鉄道/羽田。 | PR #87の `resolvedGuides.weather` 等 | 会話/動機に応じた選別、prompt長の実測、Body Clockとの共有source |
| Character + Pair | mainは美咲中心のcanonical状態/guide | PR #88の `layered-context.ts` は shared/character/pairのscopeを検査、`layered-prompt.ts` は5レイヤー組立 | productionのmulti-character DB/auth/History/RLS/Persona更新を完成扱いできない |
| Retry/attempt | mainのchat route＋`lib/gemini-json-generator.ts`。retry/validation等が複数責務に分散 | PR #88 `attempt.ts` はprompt+retry guideを組む純粋adapter（本番接続ではない） | full byte parity、expression/失敗ケース、物理retryの全費用確認 |
| Body Clock | main `supabase/functions/body-clock/index.ts` は `loadBodyClockRoot` → persona/life/decision → Gemini → photo → finish → relay。 | PR #31の自発動機/NO_ACTION、Body Clockの旧route | Free/Premiumの自発用記憶scopeの完成認定不可。最終race/権限確認と外部source統合は未検証 |
| Lab | main外Conversation Lab #86。 | PR #87純粋共有pipeline構想 | productionとのsnapshot/parity・人手品質・課金許可は未受入 |

**特記事項（今後必ず確認）**：main Body Clock `generateMessage()` では現状、長期記憶 `memory` と最近の会話 `history` をpromptに含めるコードがある。この静的事実だけでは、基本構想第6章の「Free自発では過去会話/共有思い出を素材にしない」という**プラン別制限が実効化済みとは言えない**。現本番のplangate/同意/適用状況を断定せず、現状対照と第6次の仕様審査対象にする。**この指摘は静的な仕様とコード経路の差であり、実漏洩や本番障害の再現ではない。**

## 6. 次の安全な作業順（まだ実施していない）

1. 主体/用途/データソース/出所/有効期限/Forget世代の**現行input inventory**。今のmodel promptの節別送信文字数・tokens相当量と物理callを、合成snapshotで測る。
2. **完全互換の純粋Composer** を旧promptのbyte parityから着手。Builderだけを調整して、認証・DB・token quota・正本writerを一緒に移さない。
3. 外部情報の取得キャッシュと relevance selectorのfixture：通常「ただいま」「羽田に向かう」「雨が心配」、自発「自分の近況」「ユーザーの明示的予定」「無言/no-action」、Free/Premiumの差、地震/警報の実在と欠測を比較。
4. 会話品質の character/Pair/life-continuity fixtureとLab parity。必要なら、旧PR #31のurge/motiveを現行claim/finish契約に**再設計**（丸移植禁止）。
5. Forget派生19分類と独立16試験は**未実施**。新たにsourceを扱うwriter/送信/写真/通知を本番適用する前に、同意・scope・Forgetの競合を独立検証する。main/Production/Supabase/アメふるへの書込み、PR merge、有料モデル呼出し・deployは別途明示承認が必要。

## 7. 関連記録

- [77 構想・骨格](77_SHARED_CONVERSATION_ENGINE_VISION_AND_SKELETON_V1.md)
- [73 第6次受入・未検証事項](73_ROUND6_VERIFICATION_AND_RESTART_HANDOFF.md)
- [76 第5次最終台帳](76_ROUND5_FINAL_INVENTORY_LEDGER.json)
- [基本構想](../../MISAKI_SYSTEM_VISION_20261021.md)
- PR #87 https://github.com/miyazaki1016/misaki/pull/87
- PR #88 https://github.com/miyazaki1016/misaki/pull/88
- PR #31 https://github.com/miyazaki1016/misaki/pull/31
- PR #86 https://github.com/miyazaki1016/misaki/pull/86

**最後に**：ここでの「骨格案」「型」「受入ゲート」は決定済みのビジネス要件と、今後検証する技術提案を区別する。実装済みの新機能認定0。全開発資産監査・本番検証は未完了。legacy BLOCKED、Forget独立16試験NOT_RUNを継承。
