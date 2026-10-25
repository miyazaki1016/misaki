# 東京イベント取得状態V2：Node実行と実コード接続レビュー（2026-10-25）

## 実行した検証

GitHubから読み取った `lib/conversation-engine/tokyo-source-health-v2-offline.mjs` と `tests/tokyo-source-health-v2-offline.test.mjs` をローカルの同じ相対パスに再構成して、Node v22.16.0で `node --test /mnt/data/misaki-check/tests/tokyo-source-health-v2-offline.test.mjs` を実際に実行した。

結果：**9 tests / 9 pass / 0 fail**。GitHub checkoutではない（実行環境から github.com のDNS解決不可）。GitHub CI、TypeScript型検査、実API、Geminiは未実行。

## 接続時に必要な変更（未実装）

現行 `lib/tokyo-life-events.ts` の `fetchText` / `fetchJson` は HTTP失敗・通信例外を `null` に変換し、地震・警報・天気・鉄道・羽田の各イベント関数は `[]` へ潰す経路がある。したがって `getTokyoLifeEvents()` の `Promise.all` を `Promise.allSettled` に置き換えるだけでは失敗状態を復元できない。

安全な段階的接続案：

1. 外部取得ヘルパーは既存呼び出しを変えず、新しい観測付きヘルパーを実験枝に別実装する。戻り値は `{ state: 'success', value }` / `{ state: 'failure' }` とし、ログやユーザー表示にURL・認証情報・個人データを追加しない。
2. 鉄道のVercelスキップは `skipped` として記録。羽田の国内線・国際線、地震・警報の詳細XMLなど、複数取得の単位を明確にして `partial` を判断する。
3. 実イベントを取得できたソースの内容は維持し、失敗したソースについて「確認済み0件」と言わない。災害・警報を無視するような文言は追加しない。
4. 現行の `getTokyoLifeEvents(): Promise<TokyoLifeEvent[]>` と `createTokyoLifeEventsGuide(events)` は本番互換性維持のため直ちに置き換えず、まず独立テストとソース別fixtureで検証する。

## 未解決の設計判断

- 全ソースの完全性を `completenessVerified` と呼ぶ場合、鉄道スキップが通常のVercel環境で常にfalseになる。会話文面で全体を「取得失敗」と誤認させないため、利用可能なソース別の表現と「意図的スキップ」を分ける必要がある。
- V2は `requests` 配列の個数や取得対象URLとの対応を検証していない。例えば羽田国内線のみsuccessで国際線の記録が欠落していても、見かけ上はavailableになる。**本番結線前に必須リクエストの網羅性を検査すること**。
- 既存のガイド短縮V1の安全同等性やトークン・費用削減は未検証。採用保留。

本番、main、DB、Gemini APIへの変更なし。
