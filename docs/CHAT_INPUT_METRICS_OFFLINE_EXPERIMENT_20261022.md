# 通常会話 Gemini入力測定：隔離実験（2026-10-22）

基点: mainの固定コミット `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。このブランチは **オフライン専用／未統合**。実装対象は `lib/conversation-engine/chat-input-metrics.ts` および `tests/chat-input-metrics-offline.test.ts` のみ。main、Production、Supabase、Body Clock、アメふるに変更を加えていない。Geminiへの実API呼出しは0件。

## 今回作成した部品

- 任意の**すでに文字列へ変換済みの**合成チャットprompt節について、UTF-16 code units、Unicode code points、UTF-8 bytesを別計測する純粋関数。
- sourceKey重複と、select済み/非selectの区別。理由別 `present/empty/unavailable/expired/not_relevant` を保持。
- 実Gemini tokenについては `null` とし、文字数からの無根拠な課金token数を作らない。
- テスト6件を追加：日本語、空節、非選択、重複source、未選択source、Unicode、重複名エラー（複数assert）。
- **実ユーザーの本文/記憶は扱わず、log保存もしない**。DB/API/ネットワークのimportはない。

## 必ず区別する状態

- **済**：GitHubに実験用コード・テストを追加した。
- **未実施**：Nodeテスト実行、TypeScript typecheck、実main promptからの節の抽出、V0 byte parity、旧prompt/新prompt tokenの実測、品質A/B、実Gemini呼び出し、runtime統合、PR merge。
- まだ `app/api/chat/route.ts` と連動していないため、**本番の送信量を測ったわけではない**。

## 次の安全な工程

1. 実験枝で `node --test --experimental-strip-types tests/chat-input-metrics-offline.test.ts` を動かし、Node/TypeScriptの実行結果を確定する。
2. 読み取り専用のV0合成snapshotとprompt section rendererを追加。現行main builderとの差分比較を実施し、完全一致を確認。
3. その後、天気・生活情報の動的部分だけをselectするV1を合成テストで比較する。人格/記憶/関係性/Forget/安全ガードは削らない。
4. 料金・Free/Premiumの記憶利用境界とBody Clockの設計は別件（監査資料79/80/81）。本番変更/有料callには別途安全・費用承認を要する。

背景: 監査専用枝 `docs/development-registry-audit-20261020` の資料77–81。静的監査完了はForget等のruntime安全証明ではない。legacy BLOCKED、Forget独立16試験NOT_RUNを維持。
