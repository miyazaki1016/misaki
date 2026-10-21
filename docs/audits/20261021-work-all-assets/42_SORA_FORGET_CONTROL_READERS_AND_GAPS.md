# ソラ第5次・Forget制御情報の読取経路と未照合経路（固定ソース照合）

2026-10-21 JST。**監査未完了。** Forget PR #66 HEAD `84d147ba5b46698d3b46fb727a9859f87f79f3d2` とmain `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa` のrecursive Git treeを取得し、双方とも `truncated:false` を確認した。本追補では#66 branchの関連エントリポイント10件以上と共有コードを直接読み、Forget controlの**静的に確認できる読取・引継ぎ**と、**その経路で明示的参照を確認できない箇所**を区別する。全依存グラフ・本番DB・実OSの動作確認ではない。関連する従前の38〜41も参照。

## A. Forget controlを読み、使うことが静的に確認できる経路

| ID | 入口 → 読取/フィルタ | 固定ソース（#66 HEAD）・Blob SHA | 確認済みと限界 |
|---|---|---|---|
| FC-01 | 通常chat → canonical root読込 → Forget turn/context → history/memory/today/reply mask | `app/api/chat/route.ts` `9bf009f871eba55732986807445337cc557ac179`: 1832–39、2713–93 | `loadCanonicalState`経由でcontrolを取得して生成前/後に使用。**生成開始後のcontrol変更をあらゆる処理で防ぐ保証とは別**。 |
| FC-02 | permanent canonical → DB control payload → 復号 | `lib/canonical-state.ts` `20445722e4ea90bc00a192fb8244f8614eeb0a44`: 91、117–124 | `misaki_forget_controls`からuser_idでpayloadを読み、`openForgetControls`。全writerによる世代進行保証は未確認。 |
| FC-03 | HTTP chat replay → 最新root forgetVersionとcompleted/replayの世代比較 | `app/api/chat/route.ts`: 1809、1816–25 | 409拒否が存在。比較後〜HTTP応答採用までの窓は別。 |
| FC-04 | Persona Evolution analyze → canonical context/controls → runnerへ引渡し | `app/api/persona/evolution/analyze/route.ts` `3c6815b0101e82bd951c8a0d30665635dc739993`: 87、116 | 解析**入力**にはForget対応。後から保存するcandidate reason/evidenceと承認経路の保護は別。 |
| FC-05 | Persona Evolution runner → user traits/candidate proposedContent mask | `lib/persona/evolution-runner.ts` `5586b1c63aa8938b2d4fb0838d220170c802403c`: 152–64 | 対象は既存trait本文と候補`proposedContent`。候補保存RPCはreason/evidence.quotesを送る（90–100行）。同じmaskをreason/evidenceに施す処理を確認できない。生成中のcontrol再読は未確認。 |
| FC-06 | Persona store → user trait derived mask | `lib/persona/persona-store.ts` `fb4395e2054b82110932163c78f5a29ec5a9eed7`: 197、239–54 | 呼出し側から渡されたcontrolsをtraitへ適用。共通persona module全管理writerの安全性証明ではない。 |
| FC-07 | Body Clock root取得 → permanent control payloadの読取/復号 | `supabase/functions/body-clock/conversation-root.ts` `efbd90f3b9cee36d2a20174e24892201f454a435`: 25–28 | 対象ユーザーのcontrolを読取。匿名rootは暗号state内のcontrols（15行）。この取得は**生成開始時点**。 |
| FC-08 | Body Clock生成 → forgetContext / reply mask / persona trait mask → finish RPC | `supabase/functions/body-clock/index.ts` `13aad1a52bc30f4dc0f2506735ef0a2286979d1c`: 1、19–22；`supabase/functions/body-clock/persona-store.ts` `a83f7c94440b7a1fe4560b1c09229b6fed136086`: 191 | 生成時の入力/出力フィルタあり。finish/relayで最新control世代を再取得・比較する保証はこの入口から未確認。 |
| FC-09 | Memory/history UI編集 → canonical state取得・control再保存 | `app/api/persona/history/route.ts` `c99434f06f76525339a46a22a8bf22d6ed2440b4`: 84–116、`lib/canonical-state.ts`: 123–24 | memoryの削除とcontrol payloadの更新を結ぶ。削除とhistory再提示・派生物の失効は同義ではない。 |

## B. 明示的Forget control読取/照合を確認できない重要経路

「直接のcontrol参照なし」はその経路の静的観測であり、上流/DB/外部guardの存在を否定したものでも、漏洩実測でもない。

| ID | 入口 / 最終採用点 | 直接確認した固定ソース・Blob | 不足の具体的な問い |
|---|---|---|---|
| FG-01 | Relationship workerのEvent取得→Evidence/Episode/Pattern/State RPC | `lib/relationship-processing-v1.ts` `bc89fbc00036b66b4f0b3d3500f853bf2bf38ed5` (#66/main同一Blob) | lease/processing versionはあるが、`misaki_forget_controls`・`forgetVersion`・`maskForgetRows`は同ファイルに存在しない。RPC内部最終版も別途確認（40〜41）。 |
| FG-02 | Evolution候補一覧GET | `app/api/persona/evolution/candidates/route.ts` `a4131c71fef91a82ac5eb2df6c3fc764a616a6e8` (#66/main同一) | `proposed_content`・`reason`・`evidence`を返すが、GET時にcontrolsを再評価する処理は同ファイルにない。 |
| FG-03 | Evolution候補approve/reject→RPC | `app/api/persona/evolution/review/route.ts` `8e891146b826ed0655e2bbb2516975d65fc367fb` (#66/main同一) | RPC引数は`p_candidate_id`と`p_action`。Forget世代引数なし。内部RPCの全実体は不明。 |
| FG-04 | Push relay→外部Web Push | `app/api/push/body-clock/route.ts` `c68f6afdfad7a6b904fcd0dc6341ead95f58b51b` (#66/main同一) | delivery/同意/attemptは検査するが、relay時にcontrolを取得・比較する処理はない。OS配送後の巻戻しは別契約。 |
| FG-05 | Browser local history/遅着root応答→React採用 | `app/chat/conversation-history-sync.tsx` `3f39da1597ed5b12c7effff2420a3c1f7f571fc4` | このファイルにForget controls/versionの明示的参照なし。親のpageや正本GET、cache検証の全体は今回未精査。先の30のsameHistory/複数tabの問題を継続。 |
| FG-06 | DB上のRelationship v2保存RPCとBody Clock finish | `supabase/migrations/20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql` `75033cfe8172dfef2e5058b8f65865fb4a86ae21`、#66 `supabase/migrations/20261006200002_forget_control_v1.sql` `78311ec1cfe16007c5f9e333b5b692da0b304e5a` | #66 SQLはRelationship v2 writerをCREATE/REPLACEしない。保存契約はroot updated_at/lease等の既存保護と別に証明する必要がある（39〜41）。 |

## C. 保証と不確定性を混同しないための原則

1. **始点でcontrolをロードした** ≠ **結果の保存・承認・配送・画面採用時まで同じ情報利用許可が続く**。
2. **controlsを引数で渡した** ≠ **reason/evidence、retry journal、delivery本文など全派生物をフィルタした**。
3. **現在のroot updated_at/temporary revision/receipt hash/worker lease** ≠ **Forgetの意味的な世代とsource利用権**。ルート更新とcontrol更新が同じtransactionで連動する場所は既存資産として認めるが、全経路へ拡大解釈しない。
4. `forgetVersion`は共有TS上でcontrolsの特定フィールド列から構成されるlogical string（`supabase/functions/_shared/forget-control.ts` Blob `e7763c96e7f94a896fef3323fddaef53fab8072a`: 16–17）。DBの`misaki_forget_controls.updated_at`との等価性・全操作での一意性・generationの厳密性は追加検証が必要。
5. `#67 Relationship Identity`は人物照合ではない。Forgotten sourceの抽象関係状態への利用条件は独立の設計問題。関係statusをForgetだけで巻き戻す案は既定としない。

## 次の直接調査

- `app/chat/page.tsx`とhistory syncから表示cacheの採用点をたどり、他tab/遅着responseをどの状態比較で拒否できるかを確認。
- Forget #66のuser edit/chat/anonymous保存経路から、`updated_at`やrevisionがcontrol変更と常に一緒に進むか例外パスを列挙。
- Evolutionの`create_user_evolution_candidate`/`review_user_evolution_candidate`のSQL定義、ACL/RLSの経路と旧運用時の証拠を明記。現在本番DBは未確認。
- Relationship workerのRPC、failed journal、旧EventとForget controlのsource紐付けを追跡。
- 文書残45版・証拠不足30枝の調査継続。**今回の精査は台帳上の全文精査数・枝解消数を増やしていない**。

## 状態・保存範囲

実コードの再取得/静的照合のみ。新規テスト実行0、再現した忘却漏洩0。本番DB/Preview/OS未確認。legacy BLOCKED維持。監査用文書の保存のみ許可。main・本番Misaki・本番Supabase・アメふる・他ブランチの変更、PR merge、枝削除、deploy、有料Gemini実行なし。
