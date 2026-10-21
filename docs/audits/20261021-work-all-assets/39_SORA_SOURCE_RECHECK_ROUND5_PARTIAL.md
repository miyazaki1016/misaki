# ソラ直接ソース再照合：Forget競合と最終採用境界（第5次・部分）

日付2026-10-21。対象固定main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。第4次監査 `2e66367dce1887d3e6d2f944ab1405ae44148372` と第5次試験案 `38_SORA_HANDOFF_FORGET_RACE_TEST_CONTRACT.md` のうち、**3経路のmainソースをGitHubから再取得して直接照合**。再現テスト、DB接続、現本番環境観測は行っていない。全監査未完了。全9試験を実証したとの主張ではない。

## 再照合済みの固定ソース

| 対象 | パス・Blob SHA | コード上で確認できた境界 | Forget保証の判定 |
|---|---|---|---|
| Push relay | `app/api/push/body-clock/route.ts` / `c68f6afdfad7a6b904fcd0dc6341ead95f58b51b` | 43〜60行付近：delivery status/source/1時間制限、notifications_enabled、subscription、push_attempts重複排除。67行でWeb Push外部送信。 | このルートにはForget version/controlを明示的に取得・検査する処理が見えない。**確定済みdelivery→Forget→relay**を保護するとは静的に認定できない。ただしDB trigger/上流全体・本番適用は未確認で、漏洩再現の証拠ではない。 |
| Persona review API | `app/api/persona/evolution/review/route.ts` / `8e891146b826ed0655e2bbb2516975d65fc367fb` | 103〜109行付近：`review_user_evolution_candidate` に `p_candidate_id` と `p_action` だけを渡す。 | API境界でForget versionを渡していない。RPCの内部が現在どう検証するかはDB実体未確認。旧候補承認の全安全性を否定できるわけでも、証明できるわけでもない。 |
| Persona candidate save | `lib/persona/evolution-runner.ts` / `d2ac4b323f74d726c5c0fc172519b1263fd5c3d4` | 88〜99行付近：候補RPCへ`proposedContent`だけでなく`reason`と`evidence.quotes`を保存用に渡す。 | Forget後の利用権評価対象は候補本文のみでは足りない。reason/evidenceも含めて確認が必要。 |
| Body Clock finish SQL | `supabase/migrations/20260918073918_canonical_misaki_root_state.sql` / `3362d5c70449081bf6bc70dfb0164adbb152c959` | 298〜353行に11引数の`finish_misaki_body_clock_delivery`定義。匿名rootはexpected revision、恒久rootは`updated_at`をrow lock下で比較（331〜335行）。 | SQLのこの定義には明示的Forget version比較がない。更新時刻がForget実行に連動するか、他の後続SQLで定義更新があるか、現在DBに適用されているかは別途確認が必要。 |

## 技術的に重要な切り分け

- **relayの「送信試行一回」と「その内容を今も送ってよい」は別契約。** push_attemptsのPKは再送抑止であり、忘却後の利用権を意味しない。
- **候補の「承認操作が認可される」と「候補の根拠が今も使える」は別契約。** APIでの認証とRPC内部の所有権判定は、Forget世代の照合に自動的に等価ではない。
- **Body Clockの`updated_at`比較は有用な競合防止だが、Forget controlの更新が必ず同じ世代を変更するかの証明が必要。** 忘却の内容失効と単なるroot更新の違いを残す。
- **今回の4ファイル再取得は、他のworker・cache・全migrationについて網羅済みを意味しない。**

## 次の静的監査ポイント（未完了）

1. `finish_misaki_body_clock_delivery` の後続全署名と呼出しを、全migration/補助SQL・#66の差分を通じて追う。現在のDB定義は未確認。
2. `review_user_evolution_candidate` のCREATE/REPLACE元・owner ACLをGitHub文書と参照可能なSQLで追う。未発見なら未確認と明記。
3. Relationship workerのretry journal→evidence/episode/pattern保存のRPCで、元sourceとforget generationの比較位置を探す。leaseと混同しない。
4. ブラウザーの遅着応答・複数tab・履歴不変だがMemory変更のみのケースを固定コードと照合する。
5. 残り45文書版と証拠不足30ブランチの精査継続。**今回の文書作成はそれらの精査件数に加算しない。**

## 状態

確認済み：上記固定main 4ファイルの特定行・構造。未確認：Forget漏洩の再現、DB内の最新実体、後続SQL、実ブラウザー/実OS、全非同期経路の閉鎖。legacyは引き続きBLOCKED。main・本番・Supabase・アメふる・PR・デプロイは一切変更せず、有料Gemini・DB実行試験なし。
