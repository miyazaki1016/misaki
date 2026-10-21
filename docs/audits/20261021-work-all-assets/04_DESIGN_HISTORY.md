# ④ 設計思想と開発経緯（確定できた骨格）

## 継承する思想

美咲は「生活を覚えている相手」であり、人格・生活・記憶・関係の続きがある。会話量や課金額を好意や恋人成立へ直接変換しない。キャラクター自身の生成した甘い返答は、独立したユーザーの恋愛Evidenceではない。沈黙・時間だけで恋しさや関係事実を発明しない。通常会話・Body Clock・写真で一人の美咲を保つ。

| 段階 | 何を変えた／目指したか | 理由・保存すべき判断 | 証拠 |
|---|---|---|---|
| 初期の生活・親密度・通知 | 仕事理解、生活時刻、記憶、30/80/160等の旧親密度、Push/写真 | タクシー運転手から始める市場仮説。閾値は歴史であり恋愛事実の決定器にしない。 | main総覧、`supabase/BODY_CLOCK.md`、古いfix/refine/feature枝 |
| ブラウザからサーバー正本へ | canonical成功ターン、request冪等性、Free refund、暗号化temporary root/checkpoint | 複数端末・再送・匿名→メール保存で履歴/記憶/利用回数が巻き戻らないようにする。localStorageへ権威を戻さない。 | `docs/SERVER_CANONICAL_STATE.md`、`codex/server-canonical-foundation`、#29/#32等の履歴 |
| 関係時間v2 | semantic signal→emotion→action→proactive motive、修復/傷の関係史 | 定期通知を会話の続きとしての自発性へ。何もしない判断も成功。謝罪回数を自動信頼にしない。 | #31 @ `e2eb89df45e0cc315cbc7491b597b0bdc1cb5f64`、reducers、proactive群 |
| Relationship Engine | Evidence→Episode→Pattern→bounded State、critical Event/Status、canonical save後解析 | 反復による点稼ぎ、第三者/否定/引用の誤認、生成文由来の自己増幅を防ぐ。事実と演技を分ける。 | `RELATIONSHIP_ENGINE_V1.md`、DB処理設計、application handoff、main engine/runtime |
| lease/fencing・順序の強化 | oldest-first、処理ledger、active lease、再実行安全 | 非同期の完了順で関係を変えず、重複要求でも二重成長させない。v1というファイル名でもruntime/SQLのv2契約を確認する。 | main `20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql`、RPC caller監査 |
| Forget / Identity / Memory再設計 | 忘却の復活防止、関係の自己認識、User/Shared/Relationship Memoryの区別 | 記憶保存だけでは体験にならない。訂正・忘却・関係史・不確実性を参照入口から保護する。新しい並列Memory Engineを無条件に作らない。 | #66/#67、memory-certainty設計、main総覧の実装前handoff |
| コスト・会話品質の評価 | physical attempt計測、context重複測定、盲検比較、多往復ラボ | 安いが人格や記憶を壊す案を避ける。合成fixture成功を実モデル改善と呼ばない。 | #61/#78/#86、telemetry/圧縮/quality gate文書 |
| 共通会話エンジン | pure assemblyとstate/auth/quota/writesを分離 | 本番とラボ、chatとBody Clockで別人格になるのを防ぐ。history adapterだけで本番parityとは言わない。 | #87/#88、prompt extraction契約 |
| 2026-10-19〜21の長期方針 | Character/User/Pair境界、自然な関係成長、Free/Premium自発話題源、婚姻排他 | 個別秘密をキャラクター共通知識へ流さない。課金で好意を買う構造にしない。 | `MISAKI_FREE_PREMIUM_MEMORY_PROACTIVE_BASELINE_20261019.md`、`MISAKI_SYSTEM_VISION_20261021.md` |

## 記録を上書きせず読み分ける

main総覧はBlob `711b7674d9fa8547f73137016030c2a10195d859`。監査枝と実験枝には別版がある。文書名が同じでも、文書化日、採用、実装、本番稼働は別軸。IMPLEMENTATION_OVERVIEWは24版存在する。各版の所属・最新path commit・見出しは索引に保存した。全文精査が済むまで「全ての思想を回収済み」としない。

特に次の決定理由は失わない：server authoritative / post-save analysis / explicit status / idempotency / anonymous encryption / fail-closed / not sending is valid / forgetting dominates paid entitlement / production-equivalent evaluation。

## 旧記録の訂正候補

台帳の初期91枝・後続92枝、文書棚卸しの24確認済み・残り84等は異なる時点や更新漏れを含む。今回の実測とは別保存する。RPC由来監査の「mainにUUID overload SQLを未発見」は、現mainに復元SQLが存在するため、その段落だけを現在の不足と扱わない。一方、82件DB ledgerと35件ソース等の過去比較は当時の記録であり今回の最新DB実測ではない。

全変更の理由を完全に復元するには、85文書版の差分本文、全関連コミット、レビュー会話の意味内容をさらに照合する必要がある。公開されていない過去チャットの理由は推測しない。
