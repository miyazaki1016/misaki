# ⑤ 2026-10-21基本構想との整合性

基準: 監査枝 `docs/MISAKI_SYSTEM_VISION_20261021.md` Blob `572f96e6a291133b4ca246825b262d0ebfbf9c93`。将来構想を現在実装済みと誤読しない。

| 観点 | 確認できた整合点 | ギャップ・矛盾・次の検証 |
|---|---|---|
| 人格・Acting | mainのacting guideは人格を乗っ取らず距離感へ反映し、明示statusを優先。時間だけで感情を作らない指示あり。 | affection/friendship/trust等は80以上のvery_highで初めて追加指示になる。中間成長の表現は#85候補。閾値の変更は品質比較が必要。 |
| 一人の美咲 | 共通fallback personaがNode/Edgeで同一Blobの版あり。shared engine設計は方向性が一致。 | chatとBody Clockは異なる生成経路。#88の純粋部品だけでは本番同等性・全チャネル一貫性を保証しない。 |
| 記憶の正確性と忘却 | mainはcanonical memory/historyとrecallを持つ。#66は参照入口・保存のforget policyを横断。 | mainにForget v1のcanonical配線なし。古いhistoryからの復活防止はrecallと同等ではない。品質・原子性・rollback・追加Gemini call数を同時評価する。 |
| 関係性の自然な成長 | mainは5軸/明示status/Pattern/critical eventとfeature gateを持つ。 | 一部旧文書のポイントやstageだけの説明を恋愛成立へ読み替えない。Identityは未マージ。mainの現在gate実値は未確認。 |
| 婚姻の排他性 | 新構想はキャラクター側の同時婚姻もDBで制約する方針。 | main総覧はキャラクター側の婚姻排他を未決定とする段落が残る。これは仕様の時点差。新方針を記録してから状態機械・一意性・離婚/再婚を設計する。現行spouse実装済みとはしない。 |
| Character/User/Pair分離 | #79/#80/#81はuser中心テーブル・RPC・Evolution・Body Clock等を横断した資料を保持。 | character_idをUIだけに足しても所有・検索・削除・import・通知・冪等性は分離できない。実装・移行前に全contractをpair化して設計する。現時点の単一キャラ設計だけを漏洩発生の証拠にしない。 |
| Free/Premiumの公平性 | 新baselineは課金で好意やstatusを変えず、Forgetを常に優先。 | main総覧の「違いは話せる回数」だけという旧記載と、10/19〜21の自発話題源の差が時点不一致。通常会話の保存/検索範囲は未決であり、自発の差から推測しない。 |
| Body Clockの自然さ | 送らない判断、通知上限、生活・時刻、canonical rootを重視。 | #85のrace監査はconversation updated_atとrelationship versionの保護対象を区別。関係性だけ更新された場合の原子的配送検査は実効RPCと全writer照合が必要。 |
| コストと品質 | #61計測はmainに収録。リトライごとのusageを持ち、NULLを0へ偽装しない。圧縮研究は品質非劣化を条件にする。 | telemetry文書上、body_clock/proactive/imageはreservedで未計測。HTTP success≠成功会話。正常完了ターンとphysical attemptsを結んだ指標、付随呼出し、計測欠落を設計する。 |
| 長期会話と反復 | 60件historyとrecent Misaki再掲を現mainで確認。quality probesは記憶/関係/境界/継続性を含む。 | 長期一貫性を実モデルで証明したわけではない。まず同一persona/state/time/memoryのオフライン基準線。要約はcanonical事実を上書きせず、否定・訂正・約束・時系列・話者を保つ。 |

## Previewの安全境界

main `app/api/acting-lab/route.ts` Blob `b046873065f41d26e294f87c419c772b33806a21` はVERCEL_ENV=productionなら404。一方、route内ではPreviewの認証・rate limit・physical attempt予算を確認できず、profile配列を並列生成しgeneratorの既定retryも使う。Vercel側の保護設定・鍵の存在・実悪用は今回未確認。アプリ内ガードの不足と実際の到達可能性を混同しない。**本監査では呼び出していない**。

## 現時点の育て方

既存engine・canonical state・安全制約を土台として、まず資産と根拠の回収、次に計測の穴と忘却/関係状態の境界を解決する。美咲一人の会話品質を同一条件で評価できる基盤を整えてから表現を改善し、その後にpair分離と複数キャラを段階設計する。コストだけのために人格・記憶・関係の材料を削らない。
