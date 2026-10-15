# Body Clock と通常チャットの関係演技入力差分（2026-10-15）

**照合対象（main）** `app/api/chat/route.ts`、`supabase/functions/body-clock/index.ts`、`app/api/push/body-clock/route.ts`、`docs/IMPLEMENTATION_OVERVIEW.md`。コード照合のみ。本番変更なし。

## 確認結果

| | 通常チャット | Body Clock |
|---|---|---|
| 人格 | personaPrompt | `loadPersonaPrompt(...,"proactive")` |
| 関係の演技 | `createRelationshipActingGuide(...)` をsystem promptに挿入 | **同関数は使用されていない** |
| 5軸/Status | `rootState.relationshipActingState` 等を渡す | `generateMessage` の引数・promptには5軸/Statusの明示項目なし |
| intimacy | acting guideとlegacy補完 | `decision.relationshipPoints` を「関係性ポイント」として渡す |
| 直近会話 | historyほか多数の文脈 | recent history最大20件を文字列化 |
| 記憶 | 複数のmemory guide | 長期記憶最大30件 |
| Emotion/Action | チャット側の独立した信号/時間/表現系 | `createProactiveDecisionGuide(decision)` を渡す |

`supabase/functions/body-clock/index.ts` の `generateMessage` は `persona`、`decision`、`life`、時刻、ポイント、記憶、最近の会話を組み立て、Geminiへ送る。**5軸/Status専用のInterpreterガイドは現行Body Clockの生成promptには直接入っていない**。ただし `decision` 内の情報やpersonaに間接的に関係が表現され得るため、現時点で「Body Clockは関係を一切見ていない」とは断定しない。

`app/api/push/body-clock/route.ts` はPush relayであり、生成本文のInterpreter接続場所ではない。旧 `app/api/body-clock/route.ts` は削除済みで、現在の自発本文生成はSupabase Edge Functionが正しい照合対象。

## 影響と未解決点

- 同じ5軸score/Statusでも、通常チャットは専用演技ガイドを受け、Body Clockはポイント/decision中心のため**演技の非対称性が存在する**。
- これは「自発文面が実際によそよそしい」と証明するものではない。実Gemini比較は未実施。
- **重要:** Body ClockはDeno Edge環境。Node/Vercel用の `createRelationshipActingGuide` を安易にimportするのは互換性・依存・実行コスト検証が必要。
- `loadBodyClockRoot`、`buildProactiveDecisionContext` が読み取る正本の詳細を次に照合し、5軸/Statusの同一正本を追加の権威ソースなしで渡せるか確認する。
- 新しいMomentumは現時点では両方に接続されていない。まず既存5軸/Statusの読み方を揃え、次に短期空気の導出を検討する。
- 本番反映前には通常/匿名、交際成立・解消、関係scoreの低/中/高、Push写真の文脈整合、配信世代競合の回帰検証が必要。

**提案（未承認）:** 両経路に共通する関係演技用の**正本から派生した読み取り専用DTO**を設計し、生成プロンプトへの反映だけを段階的に実験する。二重正本を作らない。PR #85はDraft・未merge、Gemini未実行。
