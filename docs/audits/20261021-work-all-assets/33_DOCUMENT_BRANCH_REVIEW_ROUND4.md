# 第4次：文書8版とブランチ2件
今回全文8版、累計40/85、残45。旧32版と重複なし。取得だけのファイル、overview部分閲覧、既読certaintyを加算しない。Blobの版を単位とする。

| ID/Blob | 全文・変遷・実装照合の結論 |
|---|---|
| DOC-048 949bd01677f83cd3bc88194697f30bb8dbc2a9fd | 複数キャラはUI追加ではなく全RPC/job/cache/消去のpair境界。現コードuser単位と一致。main未収録設計候補として保全 |
| DOC-051 143f329c7ef4e5d17fee63c06978c658f2f70c80 | 冒頭source-only未確認→10/13DB調査報告で所有確認→自己traits書込境界→ledger差→caller限定調査へ追補。冒頭だけで本文全体を未確認としない。過去DB観測を現在確認にしない。RPC本文の追跡不足/世代失効は残る |
| DOC-054 465f21fa358d21c6050212ecf622fa23b8e8fa41 | 通常chatとEdgeの演技入力非対称。relayは生成入口でない。現在main本文と整合、実モデル品質は未認定 |
| DOC-055 c91e7e695fa69c2094412810ba881800f6bcd43a | read-only DTO/Deno互換/匿名正本/タグ衝突を段階計画。ガイドだけ足してromanticタグを無視しない。未実装設計を保全 |
| DOC-061 bdc5a9b9ace3866149a0a536d1f64577dcc621bc | 会話updated_atと関係正本versionを分け、RPC内比較を提案。31で実SQLへ接続。観測バグではなく未検証競合 |
| DOC-062 4e9d2d2286073b20df480f021f1b85de932f8dbc | 当時SQL未取得という調査記録。今回main 9/18 finish本文を取得、関係version比較なしをソース上確認。ただし全writer/本番の保証は残件。後続調査で一部解消、歴史資料を上書きしない |
| DOC-072 d786df430526a4fe12abab61d0053c0af2f9f6fe | server正本、receipt/root分離、匿名Body Clock/checkpoint、停止/drain/freeze/復旧の全文。検証記録は当時の報告。旧trigger維持・+1等は後続v2に置換、現在仕様に復活させない |
| DOC-084 085e5eb74c62641e972ee4c4c547bf60e9fd62fc | cron→Edge→保存→relayとattemptの契約、Push停止と履歴配送の区別。記載の本番確認は歴史報告。新Free話題源制限を実装済みとはしない |

## 静的ブランチ再分類
BR-009 docs/multi-character-data-scope-inventory HEAD ad51dfe248fdf9a6903f4ff193f437bf04b2d80c、#79 open未merge。
BR-010 docs/multi-character-rpc-caller-audit HEAD 83476dd2d347687c253a471557d9c27b82e1caf7、#80 open未merge。
二枝とも証拠不足→「未反映で今後の実装候補（設計・監査文書）」へ。動作受入ではない。
三点compareのfilesだけでは枝全体のmain収録を判断できないため、固定二treeと現在main treeの全blob集合を直接照合した。BR-009の枝側差はDOC-048のみ、BR-010はDOC-048とDOC-051のみで、両文書はmainに存在しない。main側の追加RPCは後続別変更。文書内容と現行コードを今回照合し、設計成果の未反映所在を確定した。削除可とは認定しない。
解消2件、累計14/44、残30。枝32件全部の今回再検証は完了していない。

## その他の残件
BR-031 #3旧proxy JSON retryのPR本文は確認したが、代替契約・全後続差分までの受入未完で残件維持。匿名系/旧tags/claim/同期枝も保留。
未マージPR総数15は第3次観測値を継承。今回は全PRを再集計していない。
legacy BLOCKED1を維持。main外workflow参照は18/23の固定・浮動資産保護を継承し、参照先を削除/統合/更新しない。
