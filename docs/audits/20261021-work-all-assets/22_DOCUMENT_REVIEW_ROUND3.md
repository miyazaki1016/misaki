# 第3次精査：文書全文レビューと版の変遷

2026-10-21。今回8版、累計32/85版、残53版。原85版のID/Blobを固定し、別版や監査文書を分母へ足さない。部分抽出のみの巨大総覧は今回も全文済みに数えない。以下の8版は本文全体を読み、実装との関係を記録した。機能受入ではない。所属・変更commitは24に旧台帳から継承。

| ID / 文書 | 意味・思想と変遷 | 実装との照合・分類・残件 |
|---|---|---|
| DOC-006 `CONVERSATION_ENGINE_PROMPT_EXTRACTION_GATE_20261015.md` | immutable resolved snapshot、全文/空白byte parity後に接続。Prompt短縮やretry変更を同時にしない。「未抽出」は当時の状態 | #88現在にはbase-promptがあり、今回main literal一致を確認。文書の未抽出記述は時点更新が必要。分類：未完成・要修正（歴史的gateは保全）。20入力resolver/全pipelineは未完成。21参照 |
| DOC-007 `CONVERSATION_ENGINE_PROMPT_INSTRUCTION_INVENTORY_20261016.md` | 20動的入力、全static見出し/非見出し/JSONをS/C/R/E/O/Mへ分類。Mixedを自動移植しない。既存名前/schemaは互換契約 | #88 base/layered/character/context各部品を照合。分類：未反映で今後の実装候補。分類表≠安全な別キャラ化、mixed分割とDB scope/JSON/保存検証は未完 |
| DOC-008 `CONVERSATION_LAB_PRODUCTION_PARITY_AUDIT_20261015.md` | prod auth/root/quota/完全人格/保存とacting-lab単発/fallback/無認証との差。offline構造試験を品質成果にしない | main chat/acting-lab、#86 runner、#88部品を照合。分類：未反映で今後の実装候補。古いacting-labを呼ばず、後続smoke実装を本番parityとしない |
| DOC-009 `CONVERSATION_LAB_PROMPT_EXTRACTION_CONTRACT_20261015.md` | #86から抽出工事を分離、全文Prompt・current userText・validation/retry/expressionまでparity必要 | #86 runnerとmain pipeline、#88 attempt/baseを照合。分類：未反映で今後の実装候補。byte gateを越えて生成後処理も必要。feature flag提案は未接続 |
| DOC-010 `CONVERSATION_LONG_TERM_PROBES_20261019.md` | User事実/Shared体験、成熟/別れ、Free/Premium、忘却/通知停止の連続性。合成を実測としない | #86 Q13–18に具体化、現在Q22まで増加。分類：未反映で今後の実装候補。記憶保持/プラン機能の実運用成功ではない。20のoracle/経路試験へ |
| DOC-011 `CONVERSATION_QUALITY_MULTITURN_GATE_20261017.md` | 初期12case→runner接続→人手findings→18case→packet→recorded import→reviewed比較→実モデル入口監査という追補順。provenance自己申告≠真正性を明記 | #86現コードは22case。判定/比較コードあり、Gemini品質未実測。分類：未完成・要修正（冒頭件数等の時点注記が必要）。null evidenceTurn、失敗/不確実性/同一fixture条件の運用受入を20へ |
| DOC-036 `IMPLEMENTATION_OVERVIEW.md` Blob b017757 | 9/18、基準323048c。関係の続きを生きる原則、Body Clock統合・初期browser同期・二重保存修正・refund・実地品質課題を全体として保存 | mainは後続server canonicalへ移行。5秒同期/ブラウザ追記を現在の正本仕様へ戻さない。分類：未完成・要修正（歴史資料）。過去本番成功は当時の報告。現在SQL/DB/実機を認定しない |
| DOC-025 `IMPLEMENTATION_OVERVIEW.md` Blob 3e5c58a | 9/18、基準7131c47。旧自発API削除、55–210分、upstream claimの責務、写真各1枚、Preview origin、refund失敗再現未実施へ精密化 | mainに旧frontend APIはなくEdge/relay継続、canonical成功turn/receiptへ後続置換。分類：未完成・要修正（歴史資料）。旧説明より受入範囲を狭めた理由を保持、現通知間隔/有効SQLの認定はしない |

## 総覧2版の具体的な変更理由

DOC-036→DOC-025は同日でも基準commitが異なる。後版は「安定状態」を、iPhone通常往復の実地確認とrefund失敗経路の未再現へ分けた。これは実装済みという語を受入済みと混同しないための重要な補正。旧ブラウザー自発経路削除は一本化、写真差分の小ささは各時間帯候補が一枚という制約で説明されている。

後続main `lib/canonical-state.ts` の履歴では20276af（9/18 server canonical、成功turn原子化）、61569a9（email retry/anonymous Body Clock）、7aaf104（9/26 compact trajectory）、0f66d98/c6fc896（10/3保存後Relationship/lease）へ進む。したがって9/18初期overviewにあるbrowser→server同期方式を、そのまま現Memory仕様として復活させない。これは上記2版と後続コードの照合であり、残り22版の全変更理由を解明したという意味ではない。

## 数えない閲覧

現在監査枝の巨大overview、他の22 overview版、readiness/runbook、#78確実性の既読設計は、関係節や試験入口を調べても今回の8版へ追加していない。13/17の累計24版は維持。残53版は24のpending_documentsを正本に次回継続。
