# 第5次再開：証拠不足6ブランチの静的所在・置換分類

2026-10-21 JST。開始HEAD `52c53fec066323e75cd15ddf5495f6f3ed6d442a`、main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。今回6件、旧44件中累計20件を静的分類し、証拠不足24件。**現在機能の動作受入・本番確認・ブランチ削除許可ではない。** 34で使ったstatic-resolved-not-runtimeの集計基準を継承する。全機能同等性が必要な枝は保留のまま。

## 方法

remote HEADをls-remoteで確認し、旧台帳のHEADと一致。各枝とmainのmerge-base→枝HEADの全変更pathを列挙（60に記録）。merge履歴だけで判定せず、文書の全文・実差分とmainソースの責務を照合する。PR patchは#3/10/18/21/22/28、後続main履歴は `git log -- path`。PRの当時説明はそのまま現在の保証としない。

| ID / 枝 / 固定HEAD | 全変更path・根拠 | 分類と保全する成果 | 現機能の未確認事項 |
|---|---|---|---|
| BR-007 `docs/audit-overview-against-source` / `f6d8baf94d037057ec94deb87b156a713445d37f` | merge-base `7131c4775f295ff9438da38a72f6d69b022353f4` から総覧1ファイルのみ。DOC-032全文＋#22 patch | main文書へ反映された歴史的監査成果、後続置換あり。refundの実装と失敗再現を分離、dormant旧経路を記録。main文書履歴 `278f167b2376365e46fd0e97193f1d8c924e6f57`、続く旧経路削除 `15cb968` を確認 | 旧5秒同期を現在機能の受入としない。実機・DB未確認 |
| BR-014 `docs/update-implementation-overview` / `621dea871afc4dca517071cc79666d81cb69e29c` | base `323048ccbb5cc34f40ac9873195d60119878e070` から総覧新規1ファイル。既読DOC-036を22から継承、#21の全392行patchと後続DOC-032を対照 | main反映済みの歴史的文書資産。関係の続きを生きる原点、統合経緯・未確認事項を保存。main初版 `7131c4775f295ff9438da38a72f6d69b022353f4` と対応 | 文書にある本番報告は当時の証言。今回全文件数へ再加算しない |
| BR-015 `docs/update-overview-relationship-growth` / `1d9db32ea15fbea950ac46090cb6e1a8bc750001` | base `a87c0d753589d1014ff868cf5fe7c29581c11a0a` から総覧1ファイルのみ。DOC-020全文、#28全patch、main履歴 `eaa398cb468bbfe4c909e3653a76e774dfe4ddc8` | main文書へ反映、後続設計へ発展。初対面から育つ／課金倍率なし／診断・匿名回復の理由を保全。現acting guideのstatus優先をソース照合 | 固定+1／回数だけの旧説明を現semantic delta・新構想と混同しない |
| BR-031 `fix/gemini-json-retry` / `f93a9444565ce1029cd46c0d466456f651ee7c9e` | base `0e55a38b3e3040fbaac8047337b9dee77bd923e9` からchat-proxyだけ。#3は特定500のときbaseを再実行。#10でそのhelperを撤去、main `20276af`でwrapper全体を単純化 | **後続実装に置換された旧方式**。単純再導入しない。main proxy全文はbaseChatPost(request)を1回だけ呼ぶ。generator内部の通信retry・chatの意味再生成とは別 | #3本文の「冪等な同じrequest IDだから安全」は現保証にしない。#10は二重消費の原因として再実行を説明。料金実測／全失敗分岐未検証 |
| BR-025 `fix/chat-network-reliability` / `7ba84c4d18e3f5b3ae012bd8b31eacebb0162f3a` | base `b0c9b5c40fb027dc04239ab02306e369d2977ee5` からchat-proxyのみ。#10は2回目base呼出しを削除。main履歴 `b88b7a8d9c4b1f2f4fc0844186a312fe975ee4ab`→`20276af`、現proxy全文 | 目的がmainで存続する修正（後続簡素化）。1 wrapper呼出しにつきbase1回の構造を確認。旧proxyの認証・読取・保存責務はcanonical baseへ移った | HTTP再送、base内部の意味retry、usage refundの全経路を今回動作受入していない |
| BR-028 `fix/chat-turn-dedupe` / `017b94c1cf2c3f7d8340a3a59f572d1a012de5e5` | base `9690509c220eceb542834b0397dee8519d1d4bc3` から9/18 014700 migrationだけ。枝Blobとmain同path一致、全文126行＋#18 patch。後続9/18 073918・9/26 000000と現history syncを照合 | mainに保存された歴史的SQL、active責務は後続canonicalへ置換。旧delta overlapアルゴリズムと現在のrequest/event成功確定を区別。9/18は旧syncのauthenticated EXECUTEを撤去。現clientはcacheを正本uploadしない | GitHubにREVOKEがあることと、本番で最終ACLがそうなっていることは別。PUBLIC／他role／全overloadを含む現DB権限は未確認 |

## Turn Dedupeの独立した置換根拠

- 旧SQL：role/text overlap、末尾user重複ならreplyのみ追加、同delta再送を抑止。request単位の利用権・Forget世代は持たない。
- 9/18 canonical：completed event `(user_id, request_id)` 部分unique、既存eventならmessage整合→replay。auth row lock後にもreplay再確認。usage proof／root更新競合／history append／completed保存を同transactionへ。
- mainの後続9/26同署名はこれらを維持しpointsをsemantic deltaに変更。今回同名CREATE/REPLACEを追い、9/18本文だけを最終定義として扱わない。
- 現`conversation-history-sync.tsx`はGET→owner/history guard→cache更新であり、旧sync RPCへdeltaを渡さない。これが単なるmerge有無を超える置換の根拠。
- Forget #66はさらに別署名／control拡張を持つ未採用資産（41）。mainのdedupeがForget世代検証まで保証したとはしない。

## 残す24件

61のpending_branchesを次回の機械可読正本とする。旧匿名Session／Local History／History Sync／Proactive Claim／Action Tagsは今回上記旧版説明との関連を見たが、枝ごとの全差分・置換証拠を完了していないため解消しない。

`codex/legacy-maintenance-drain` はBLOCKED継続、CI成功で解除しない。main外workflow checkout／固定runner（18/23/48）に変更なし。実験資産の保護を継承し、削除・統合・参照更新なし。重点7成果群の新しい本番検証済み認定0。
