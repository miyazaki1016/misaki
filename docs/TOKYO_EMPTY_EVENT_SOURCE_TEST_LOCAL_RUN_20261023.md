# 東京イベント0件ソース抽出テスト：ローカル実行記録（2026-10-23）

## 実施した検証
GitHub実験ブランチの `tests/tokyo-empty-event-guide-source-offline.test.mjs` と `lib/tokyo-life-events.ts` の0件分岐をGitHubから読み取り、ローカル作業領域に**必要な関数部分とテストを転記して再構成**した。GitHubブランチの実checkoutではない。Node v22.16.0で以下を実行。

`node --test /mnt/data/misaki-offline/tests/tokyo-empty-event-guide-source-offline.test.mjs`

結果：**8 tests / 8 pass / 0 fail**。出力：V0 **760 UTF-8 bytes**、V1 **339 UTF-8 bytes**、差 **421 bytes**（当該節で約55.4%）。実Gemini token・実費・安全同等性は未測定。

## 限界と安全判断
- GitHubブランチをclone/checkoutしたテストではない。GitHub CI PASS・リポジトリ全体のtest PASSを主張しない。
- このテストは「V1で失われる明示禁止例・自然な返答例」を意図的に検出する。8 PASSは**安全同等性の証明ではない**。
- V1は**採用保留**。本番prompt・DB・課金API・mainは変更なし。
- 次の作業：実験ブランチの実checkout/CIでテストし、取得失敗・災害質問・地域不明・通常雑談のfixtureを追加。安全ガードを保持できた場合のみ品質比較へ進む。
