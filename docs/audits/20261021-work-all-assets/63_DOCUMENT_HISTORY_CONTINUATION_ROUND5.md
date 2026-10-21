# 第5次続行：文書6版の全文・全変更差分精査

2026-10-21 JST。起点 `2efc394c4c06b952545dda07fd590a094e7b42a8`、main `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`。61の未精査25版から6版を精査し、**66/85版、残19版**。既読版の再加算なし。全資産監査未完了。現DB・モデル・UI試験は未実施。

## 方法と証拠

DOC-001/002/003/052は固定Blob全文を確認。巨大な同名総覧は、全文確認済みDOC-020→DOC-042→DOC-024の**全変更箇所と削除箇所**を読み、変更されていない全文は同一ブロックであることを照合して引き継ぐ。章の抜粋だけで全文済みにしない。67に原文と全差分、66に比較元・SHA・確認範囲を保存する。この比較辺は読解用であり、Gitの直接親子・変更日時順を意味しない。各版の所属・path変更commitは元inventoryを併記する。

| 原本 | 独自成果・版の意味 | 後続実装・現在構想との照合／保持すべき判断 |
|---|---|---|
| DOC-001 `docs/ALL_BRANCH_DOCUMENT_INVENTORY_20261021.md` / `82ea5d4d8f4f8ae7d803e543cc6684758dfa3657` | 全枝文書取得の途中ログ。冒頭24/92、追補8→16→24枝。旧legacy文書・Shared Engine設計・多キャラ・Lab・Body Clock監査を取りこぼさないための探索経緯 | 本文の「次84枝」と冒頭「残68枝」は追記時点差。後のevidence.zip/09台帳の全92枝・85版取得を否定しない。取得＝全文精査ではない原則を保持。今回remoteも92heads。新しい完成機能ではない |
| DOC-002 `docs/AMAFURU_WEATHER_DISASTER_INTEGRATION_HANDOFF_20261016.md` / `fcfab902743c4918813de44ad2d797bd466eda7a` | Misaki側のDraft連携契約。公式情報処理と人格・生活・関連性判断を分担、まず認証read-only降雨snapshot。登録地点／許可現在地／キャラ生活地域を分離 | Misaki内文書として読む。別リポジトリPR60の内容や現在の採用状態は今回未調査。現main chatの天気取得を消していない。旧DOC-024の「関係に応じ送らない」構想と、公式な緊急通知抑止をモデルへ委ねない制約を別責務として保全。schema/TTL/認証/SLA未確定、接続済み認定なし |
| DOC-003 `docs/BRANCH_AUDIT_TRACKER_20261021.md` / `a69704982f4676ae7e1ca66712b32e924b8ecb99` | 92枝のcommitter日時をUTCで並べた全行と、8枝単位の取得履歴。作成日・deploy日・完成判定と区別する運用原則 | 92行のname集合を旧branches.jsonと照合。末尾が92/92、途中ログ16/92等を現在残件に戻さない。先頭ログの残0も後日追記と区別。表の「要照合」は後の09→61で一部解消している。古い表を塗り替えずoverlayを使う |
| DOC-052 `docs/PRODUCTION_SOURCE_OF_TRUTH_RECONCILIATION.md` / `97fc43d139a2ce4b55b74d0613dffb8375a0e9af` | 13節全文。main source、当時DB、ユーザー実機受入、文書の証拠階層。ledger82/main35・同名異version19の訂正、同名RPC再定義、UUID overload由来探索、初回9引数diffと最終10引数本文の誤認訂正 | 現mainには `20260930131930_relationship_server_rpc_user_context.sql` が復元済み。文書の「UUID定義元未発見」は歴史的な調査段階で、現在main上の所在問題は解消している。復元commentは当時適用記録を由来とするが、今回DBに接続せず、適用経路・全DB一致まで新たに実証していない。古い未発見仮説から手動適用や破損を断定しない |
| DOC-042 `docs/IMPLEMENTATION_OVERVIEW.md` / `fc76ff0d9ecb076de4d01a005236f524c92c84d8` | legacy枝の総覧、path変更 `aa8a1cc4dedc0574f225faa0994efeaea0937cff`。既読020に対し、設計理由・同一内部状態・server正本の基礎工事・移行・6段階ハート・品質feedback・legacy BLOCKED反例を追加 | +1と30/80/160維持は保存先移行時の互換要件で、9/26 semantic delta後の永久仕様ではない。旧keyword trigger維持も後続v2で置換される。freeze反例・未解消項目は08/10の後続SQL修正と区別して保持し、BLOCKED解除なし。品質feedbackを関係の罰や自動人格変更に接続しない思想をIDEA14へ |
| DOC-024 同総覧 / `3da8bad0e216589a006cb9862278e012c72f2dc3` | Relationship Time枝、path変更 `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64`。042のlegacy専用節を持たず、関係時間→semantic signal→emotion/action→urge/motive、Life Facts、Story修復・再発、写真整合へ発展 | legacy節がないことはBLOCKED解除ではない。生活記憶の端末正本という当時課題は後続canonicalで置換。Storyは自由文思い出でなくevent由来意味状態。mainにはStory/Life Factsの部品と通常chat接続があるが、現main Edgeには旧枝のurge/motive/storyを使う同一pipelineがない。全機能main反映済みとも全面未実装とも分類しない。7成果群のRelationship Timeに未反映自発性を保全 |

## DOC-024の重要な判断史

- 時間は既存感情の強さを和らげ得るが、無言の長さだけで恋愛・心配・拒絶・事件を生成しない。claimは評価機会、送らないことも行動という設計。現mainに残る旧claimの時間ベース処理と完全同等とはしない。
- 語の一致で相互好意や交際を確定せず、意味理解をsignal抽出へ、状態更新を決定論的reducerへ分離。意味判定の最初の結果をexpression-only再生成で書き換えない。
- Life Factsはprofile/schedule/routine/situation/preference/concern、observedAt/validUntil/confidence/sourceを持つ。[life:v1]の日時をモデルに書き換えさせない。第三者や不確定予定を本人の確定情報にしない。現mainのselector/adapterへつながるがMemory Certainty完成の証拠ではない。
- repairは謝罪だけで完了せず、後続care/trustを要求。boundaryをhurtfulと同一視しない。repeated_harmは更新可能な二者の状態で、相手の永久ラベル・罰・無視ではない。現main `lib/relationship-patterns.ts` と通常chatのStory参照を照合した。
- Body Clock枝には `proactive-urge.ts`、`proactive-motive.ts`、contact/focus部品が存在する。Storyが未解決のとき写真停止、修復途中のromantic写真除外、外部concernは根拠ある実入力だけ、という当時の成果を保持。mainの写真selector4だけでこれらまで採用済みにしない。
- 文書の9/25実Gemini4シナリオ・CI run/件数は当時の報告。今回追試・課金・実データ取得なし。過去の試験実施をなかったことにせず、今回の未実施16試験のPASSへ流用もしない。

## 未精査のまま保全する追加差分

DOC-035の新チャット引継ぎ追補、DOC-022の5軸成長・Momentum・Interpreter追補は**追加節全体だけ**を読んだ。元の巨大本文DOC-029を全文精査していないため、DOC-035/022とも今回の6版には加算しない。

- DOC-035／BR-011：User/Character/Pair、共通Reply Core、相互記憶の非共有、職業一般知識と個人体験の区別、既存lease/canonical/importを維持する移行順を保全。当時「キャラ側婚姻上限未決」とした記述は、その後の基本構想の婚姻排他方針と時点を分け、旧文書を理由に最新構想を戻さない。
- DOC-022／BR-012：5軸・Status・Intimacy・Momentum・Emotion/Action・Memoryの分離、0→1で人格急変させず中間域を感じられる表現を比較する案。閾値・係数・新tableは未承認。characterization testは現在の挙動を記録するもの、将来の永久仕様や実モデル品質の証明ではない。

残19版は68台帳へ。取得済み・差分生成済みを読了と数えない。特にDEVELOPMENT_REGISTRY原版と巨大総覧18版の全文・全変更精査は未完了。
