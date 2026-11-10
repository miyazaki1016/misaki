# work/conversation-context-compression-spike

**目的：** 未確認

**実装状態：** mainとの差分を収録。差分ゼロも記録

**検証の扱い：** 未確認

**PR状態：** PR未関連のブランチ差分

**main統合：** 未確認

**本番反映：** 未確認

**残課題：** 未確認

**次の作業：** 関連PR・mainとの同等実装を照合。ブランチの存在だけで未完成扱いしない

根拠取得日時 (UTC)：2026-11-10T05:03:55.377163+00:00


## 実際の変更処理（コードから抽出）

差分・ソースを参照

- [app/api/chat/route.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/app/api/chat/route.ts)：先頭18000文字・原本リンク参照
- [docs/IMPLEMENTATION_OVERVIEW.md](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/docs/IMPLEMENTATION_OVERVIEW.md)：サイズ上限120KB・原本リンク参照
- [docs/conversation-context-compression-spike.md](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/docs/conversation-context-compression-spike.md)：全文
- [lib/canonical-state.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/canonical-state.ts)：全文
- [lib/context-overlap-analysis.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/context-overlap-analysis.ts)：全文
- [lib/context-size-measurement.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/context-size-measurement.ts)：全文
- [lib/relationship-acting-guide.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/relationship-acting-guide.ts)：全文
- [lib/relationship-analyzer-v1.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/relationship-analyzer-v1.ts)：全文
- [lib/relationship-engine-v1.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/relationship-engine-v1.ts)：全文
- [lib/relationship-identity-resolver.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/relationship-identity-resolver.ts)：全文
- [lib/relationship-runtime-v1.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/lib/relationship-runtime-v1.ts)：全文
- [package-lock.json](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/package-lock.json)：先頭18000文字・原本リンク参照
- [package.json](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/package.json)：全文
- [supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql)：全文
- [supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql)：全文
- [supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql)：全文
- [supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql)：全文
- [tests/context-overlap-analysis.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/context-overlap-analysis.test.ts)：全文
- [tests/context-size-measurement.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/context-size-measurement.test.ts)：全文
- [tests/fixtures/relationship-identity-baseline.sql](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/fixtures/relationship-identity-baseline.sql)：全文
- [tests/relationship-identity-anonymous-runtime.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/relationship-identity-anonymous-runtime.test.ts)：全文
- [tests/relationship-identity-audit.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/relationship-identity-audit.test.ts)：全文
- [tests/relationship-identity-persistence.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/relationship-identity-persistence.test.ts)：全文
- [tests/relationship-identity-resolver.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/relationship-identity-resolver.test.ts)：全文
- [tests/relationship-identity-sql.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/relationship-identity-sql.test.ts)：全文
- [tests/relationship-identity-temporary-import.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/relationship-identity-temporary-import.test.ts)：全文
- [tests/relationship-mutual-acceptance.test.ts](https://github.com/miyazaki1016/misaki/blob/10275b666387115ced06312570111b21d0276e17/tests/relationship-mutual-acceptance.test.ts)：全文

## 検証実行の事実

| ワークフロー | 結果 | 対象SHA |
| --- | --- | --- |
| 実行証拠未取得 | 未確認 | — |

## 当時の説明・結論（原文。作者の主張と実測を区別）

```text

```

## ソース・テスト・資料の抜粋（実行はしない）

### app/api/chat/route.ts

```text
diff --git a/app/api/chat/route.ts b/app/api/chat/route.ts
index 5600ad3..f7037ed 100644
--- a/app/api/chat/route.ts
+++ b/app/api/chat/route.ts
@@ -1,5 +1,6 @@
 import { after } from "next/server";
-import { engineEnabled } from "../../../lib/relationship-engine-v1";
+import { engineEnabled, identityEnabled } from "../../../lib/relationship-engine-v1";
+import { deriveRelationshipTraits } from "../../../lib/relationship-identity-resolver";
 import { enqueueTemporaryTurn, resumeRelationshipProcessing, pendingRelationshipGuide } from "../../../lib/relationship-runtime-v1";
 import { maintenanceResponse } from "../../../lib/maintenance";
 import { createRecallAwareMessage, isMemoryRecallQuestion } from "../../../lib/chat-recall";
@@ -45,6 +46,8 @@ import {
 import { loadRelationshipHistory, deriveRelationshipPatterns, deriveRelationshipStory } from "../../../lib/relationship-patterns";
 import { deriveRelationshipPointDelta } from "../../../lib/relationship-points";
 import { generateGeminiJson } from "../../../lib/gemini-json-generator";
+import { contextSizeMeasurementEnabled, measureContextSize } from "../../../lib/context-size-measurement";
+import { analyzePromptSectionOverlap, countRepeatedRepliesInHistory } from "../../../lib/context-overlap-analysis";
 import { createGeminiTelemetrySink } from "../../../lib/gemini-usage-telemetry-server";
 import {
   createLegacyRelationshipActingState,
@@ -2063,7 +2066,16 @@ export async function POST(
       createRelationshipActingGuide(
         rootState.relationshipActingState ?? (rootState.relationshipEngine ? { ...rootState.relationshipEngine.state, intimacyStage: createLegacyRelationshipActingState(safeRelationshipPoints).intimacyStage } : undefined) ?? createLegacyRelationshipActingState(
           safeRelationshipPoints
-        )
+        ),
+        rootState.relationshipIdentity ? {
+          primaryIdentity: rootState.relationshipIdentity.primaryIdentity,
+          traits: rootState.relationshipActingState ? deriveRelationshipTraits(rootState.relationshipActingState) : undefined,
+          constraint: rootState.relationshipIdentity.constraint
+        } : identityEnabled() && rootState.relationshipEngine?.identity ? {
+          primaryIdentity: rootState.relationshipEngine.identity.primaryIdentity,
+          traits: deriveRelationshipTraits(rootState.relationshipEngine.state),
+          constraint: rootState.relationshipEngine.identity.constraint
+        } : undefined
       );
 
     const userProfile =
@@ -2402,6 +2414,47 @@ misakiTodayMemory は、
 }
 `.trim();
 
+    if (contextSizeMeasurementEnabled(process.env.MISAKI_CONTEXT_SIZE_METRICS) || (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "work/conversation-context-compression-spike")) {
+      // Counts only: no prompt text, user content, IDs, or memory values.
+      console.log("MISAKI CONTEXT SIZE:", {
+        traceId,
+        overlap: {
+          replies: countRepeatedRepliesInHistory(contents, recentMisakiMessages),
+          sections: analyzePromptSectionOverlap(baseSystemPrompt, [
+            { name: "persona", text: personaPrompt },
+            { name: "relationshipGuide", text: relationshipGuide },
+            { name: "relationshipActing", text: relationshipActingGuide },
+            { name: "longTermMemory", text: memoryText },
+            { name: "todayMemory", text: todayMemoryGuide },
+            { name: "recentReplies", text: recentTopicText },
+            { name: "weather", text: weatherGuide },
+            { name: "weatherHistory", text: weatherHistoryGuide },
+            { name: "lifeEvents", text: tokyoLifeEventsGuide },
+          ]),
+        },
+        ...measureContextSize({
+          systemInstruction: baseSystemPrompt,
+          history: contents,
+          userText: modelMessage,
+          persona: personaPrompt,
+          relationshipGuides: [
+            relationshipGuide, relationshipActingGuide,
+            pendingRelationshipGuide(rootState),
+            createRelationshipTimeGuide(relationshipTimeContext),
+            createRelationshipSignalGuide(),
+          ],
+          longTermMemory: memoryText,
+          todayMemory: todayMemoryGuide,
+          repeatedReplies: recentTopicText,
+          environmentGuides: [
+            misakiLife, timeGuide, weatherGuide,
+            weatherHistoryGuide, tokyoLifeEventsGuide,
+            activityGroundingGuide, taxiContextGuide,
+          ],
+        }),
+      });
+    }
+
     async function generateReply(
       retryProblems?: string[],
       supplementaryGuide = ""

```

### docs/IMPLEMENTATION_OVERVIEW.md

```text
diff --git a/docs/IMPLEMENTATION_OVERVIEW.md b/docs/IMPLEMENTATION_OVERVIEW.md
index 9c36f6c..23c3a18 100644
--- a/docs/IMPLEMENTATION_OVERVIEW.md
+++ b/docs/IMPLEMENTATION_OVERVIEW.md
@@ -3487,3 +3487,118 @@ Reply生成時はcanonical relationship stateとcanonical Identityを読み、`s
 PR #66とは別PR。Forget Control、Hearts UI、Body Clock最終統合、multi-character、marriage/world-stateは混ぜない。
 
 **施工開始前にfreezeすべき残件は、post-breakup / rejection constraintの解除条件と、Identity entry/maintenanceの数値classifierだけ。DB境界と実行順序は本節をv1施工基準とする。**
+
+
+---
+
+### Relationship Identity v1 — PR #67 migration順序・resolver総監査（2026-10-07）
+
+**状態:** `work/relationship-identity-v1` / [Draft PR #67](https://github.com/miyazaki1016/misaki/pull/67)。**Production適用済み・Identity gate OFF**。Production migration履歴は `20261007114143 / 20261007114154 / 20261007114158 / 20261007114201`。PRはDraftのまま、merge禁止・gate ON禁止。今回の作業は適用済み履歴へのファイル名整合と総覧・テスト参照更新のみで、Production操作は行わない。PR #66 Forget Controlは変更・混入していない。以下は上の「実装前・コード未実装」handoffに対する現在の施工記録であり、古い施工前ステータスを現在状態と読み違えないこと。
+
+#### 再照合した正本・施工境界
+
+- 最新main: `18e2c0bdfa007c980858f85341eb8c78e0e5301a`。
+- 施工開始branch HEAD: `2b97931217ab816018d70ddc63d0f764bb8bf276`。コード修正commit: `555d35bc19e7003dd9b051d02762b4bdfac1b192`。
+- 本総覧のRelationship Identity handoff / canonical persistence、現行resolver / permanent・anonymous runtime / canonical read / Acting Guide / chat接続、Relationship schema・Engine migrationsとcommit historyを照合した。
+- 070000の復元正本は `c769243c557f9a79eaef0a60821208b3a28fd0e1^` のファイル内容。復元後にbyte一致を確認した。
+- 前回監査時点ではIdentity migrationは未適用だった。その後owner指示によりProduction適用済み。今回ownerから提示されたProduction履歴に4本のファイル名を整合する。SQL本文は全4本とも監査済みcommit `636c3fd` とbyte一致し、Production履歴・DB・gateは変更しない。
+- 既存11 Primary Identities、classifier centers / gates / distance weights、distinct-version 2回confirmation、critical-event precedence、constraintの意味論を維持。仮classifier値を本工事で新しくfreezeしていない。
+- Relationship Engine v1.1のAnalyzer / Interpreter / Evidence → Episode → Pattern → State、3独立Tokyo日Pattern、5軸delta計算、relationship_status、oldest-first、START_AT、fail-closed、retry、lease・processing ledgerを変更していない。mainとの差分でEngine単体は既存PRのIdentity型・feature gate追加のみ、processing / analyzer / Supabase Functionsに今回の差分なし。
+
+#### 実装した修正
+
+1. 070000の先行provenance列参照とboolean引数追加を除去し、provenance導入前の自己完結するatomic temporary importへ復元。
+2. 083000で13引数Identity apply RPCを作成後、旧12引数signatureを `PUBLIC / anon / authenticated / service_role` から明示revokeし、DROP。13引数RPCはSECURITY INVOKERでservice_roleのみ実行可能。
+3. Supabase CLI **2.81.2** の `--help` / `migration new --help` 確認後、`supabase migration new relationship_identity_v1_temporary_import_romance_provenance` により083000より後の新migrationを作成。temporary import v3のboolean provenance対応を移設し、旧21引数import overloadもrevoke → DROP。最終importは22引数のみ。
+4. importではanonymousのcandidate source / constraint anchor / romance re-entryの数値versionを恒久canonicalへコピーしない。candidateをresetし、active `post_breakup / post_rejection` かつprovenance fact=trueの場合だけ、新permanent `v_source_version` へproofをmapする。`none / boundary / false / null` はproof=null。checkpoint import・Identity・transition ledgerを同一transactionに保つ。
+5. importでanchorとproofが同じpermanent versionへmapされた後、従来083000の `proof <= anchor` 検証が次回保存を拒否する不整合を修正。equal-anchor proofは、locked canonical Identity rowに既に同じconstraint / anchor / proofがある場合の保持に限定する。新しくequal-anchor proofを捏造するapplyは拒否し、通常のfresh proofは引き続きanchorより後のcanonical versionを必要とする。
+6. Identity applyがcanonical relationship rowをlockしてsource versionを検証し、その後Identity rowをlockする。初回Identity作成とState更新の競合中もsource検証をtransaction中に固定し、stale拒否 / replay / identity_since / immutable transition ledgerの保証を維持。
+7. resolverのadjacency距離最小選択を維持。現在Identity自身がcandidateのとき近傍へ動かそうとしていた経路を、現在Identity支持として維持するよう修正。距離同率はObject / 配列順で選ばず分類保留し、総覧の「分類不能なら現在Identityを維持」契約を適用。新しいIdentity優先順位やthresholdは追加していない。
+8. permanent workerのromance provenance applicationを `created_at` の先頭rowではなくcanonical `after_state.relationship_state_version` で取得。時刻同率やrow順でfresh proofの有無が変わらないようにした。Engine application自体は変更していない。
+
+#### migration最終構成（必ずこの順序）
+
+| 順序 | migration | その時点の状態 |
+| --- | --- | --- |
+| 1 | `20261007114143_relationship_identity_v1_canonical.sql` | Identity current-state / transition ledger / 12引数apply。既存ファイルを変更せず保持 |
+| 2 | `20261007114154_relationship_identity_v1_atomic_temporary_import.sql` | provenance列不要の21引数temporary import v3。指定commit前の内容へ復元 |
+| 3 | `20261007114158_relationship_identity_v1_romance_reentry_provenance.sql` | provenance列と13引数apply。旧12引数はrevoke後DROP。旧temporary importはまだ呼出し可能 |
+| 4 | `20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql` | boolean fact対応の22引数import v3。旧21引数はrevoke後DROP |
+
+最終schemaに旧12引数apply / 旧21引数importを残さない。新RPCにdefault引数は付けず、旧signatureの暗黙選択を許可しない。
+
+#### 自動検証結果
+
+- `npm ci`: 成功。SQL統合テスト用dev dependency `@electric-sql/pglite@0.5.8` をexact pinしlockfileへ記録。
+- `TZ=UTC npm test`: **320 / 320成功**。
+- `TZ=Asia/Tokyo npm test`: **320 / 320成功**。
+- `node --test --experimental-strip-types tests/relationship-identity-*.test.ts`: **57 / 57成功**（今回追加16件を含む）。
+- `npx tsc --noEmit`: 成功。
+- `npm run build`: 成功。Nextのlint / type validity stageも完了。独立した `npm run lint` script / ESLint configはリポジトリに存在しないため、それを実行したとは扱わない。
+- `git -c core.whitespace=cr-at-eol diff --check`: 成功。
+
+SQL統合テストは空のPGliteに最低限のAuth / legacy参照fixtureを作り、tracked Relationship foundation / Engine migrationsを適用した上で、Identity列を**最初から順番に適用**した。064000の12引数apply、070000の旧import、083000の13引数applyと旧import、最終新importをそれぞれ次migration前に実呼出しして、各時点が自己完結することを確認した。DDLが作成できたことだけで合格にしていない。
+
+確認した契約:
+- 最終RPCのoverload数・引数数・SECURITY INVOKER・role ACL。service_roleの実write成功、browser rolesの呼出し拒否。
+- stale canonical source拒否、same-version replay、identity_since保持/Identity変更時更新、ledger件数の冪等性。ledger保存失敗時のIdentity write rollback。
+- anonymous version=900等をpermanent version=41へコピーせず、constraint / proofを契約どおりmap。import replayでversion / ledgerを二重更新しない。
+- breakup / rejection / boundary、fresh positive romance Pattern proof、後続non-romance updateでの保持、新rejection / boundaryでreset。equal-anchor proofの新規捏造拒否。
+- 既存lease付きState RPCによるpositive romance Pattern applicationと、その後のnon-romance application。時刻同率でもcanonical source versionで正しいrowを参照。
+- importのbad lease / checkpoint欠落拒否、axes更新後にIdentity INSERTが失敗した場合のaxes / Identity / import marker / ledger atomic rollback。
+- hysteresisのdistinct canonical version 2回のみ。same-version replayで2回目confirmationを増やさない。
+- 全11 Identity × canonical shapes × constraints × provenance × critical eventsの**6,336ケース**を、centers Object順・neighbors配列順を反転したresolverと比較し一致。各中心の小変動維持、分類同率保留、非隣接targetの距離rankingも確認。
+- actual temporary Engineの3独立Tokyo日positive romance Patternからproofが成立することを確認。Pattern条件・State更新をテストのために差し替えていない。
+
+全suiteには既存quota / refund、canonical chat / anonymous checkpoint / restore、Body Clock、Relationship Engine / Pattern / Acting Guide等の回帰も含む。
+
+#### CI / Preview
+
+コードcommit `555d35bc19e7003dd9b051d02762b4bdfac1b192`:
+- [GitHub Actions — Canonical relationship integration tests #427](https://github.com/miyazaki1016/misaki/actions/runs/37598444755): **success**。Node 22で `npm ci / npm test / tsc / build` が成功。
+- [Vercel Preview](https://misaki-4l7l9mdsr-kishibojim.vercel.app): **READY**。deployment `dpl_6NzEcK8UZoHAuhegDtxhWJLBnodv`、target=Preview、同じコードSHAを確認。
+- Preview READYはbuild成功を意味し、Identity migrationを適用した隔離Supabaseでの実機受入成功を意味しない。今回PreviewからProduction DBへfixture / chat / RPC writeはしていない。
+
+#### 残存リスク・未解決事項
+
+- PGliteはsingle-session。row lockingは実RPC定義のlock順とtransaction契約を確認したが、複数DBセッションのlock待機・競合試験は未実施。既存Engineのlease挙動を変更していないこととは別に、Identity gate有効化前に隔離Postgresで競合確認が必要。
+- リポジトリは初期Supabase schemaの完全なmigration履歴を収録しておらず、legacyに同一timestampのmigrationもある。今回の「最初から適用成功」は**明示した隔離baseline + tracked Relationship migrations + Identity全4本**である。アプリ全体の空Supabase `db reset` 成功を主張しない。過去の全migration履歴を本scopeで推測修復していない。
+- 既存 `tests/*.rollback.sql` を完全なSupabase実DBへ流す受入検証、および隔離Supabaseに接続したPreviewのanonymous → email → 別端末restore / retry実機受入は未実施。Identity migrationはProduction適用済みだがgate OFF。今回Productionへwriteして検証することは禁止。
+- classifier値は今回の正本HEADを維持しており、数値classifierの新freezeやconstraint解除ルールの追加はしていない。Identity gate有効化前に既存のownerレビューgateを確認する。
+- 全自動・CI/build成功と、Production適用可能との承認を混同しない。PR #67は引き続きDraft / merge禁止で止める。
+
+#### Identity gate有効化前の残存受入手順（この工事では実行しない）
+
+DB migrationはProduction適用済み。以下の旧適用前チェックは残存受入事項として保持する。Productionへの4本再適用は不要・禁止。Identity gateはOFFを維持する。
+
+1. ownerがPR差分・総覧・classifier / constraintの既存承認範囲をレビューする。Draft解除 / merge / Production操作は別承認。
+2. 独立したSupabase / Postgres隔離環境に正しいlegacy baselineを用意し、既存履歴の重複・欠落を確認した上でIdentity4本を順番に適用。最終RPC signature / ACL / stale / replay / ledger / checkpoint原子性を再確認する。
+3. 別セッションでState更新とIdentity apply、同一sourceの二重apply、import競合・retryを試験し、lock待機後のstale拒否と二重ledger防止を確認する。
+4. Previewを隔離DBへ接続し、anonymous → email → 別端末restore、breakup / rejection / boundary、fresh positive Pattern → re-entry → non-romance更新 → 新critical reset、pending / 次turn反映を実機で受入。既存rollback SQL suiteも隔離環境で実施する。
+5. Production履歴は上記4本へ整合済み。既存Relationship Engine v1.1・backup / rollback方針・稼働版のRPC signature整合を確認し、残存受入完了後にIdentity gate有効化を別途判断する。本作業ではgate ONは禁止。
+
+**停止位置:** Production適用済み・Identity gate OFF。PR #67はDraft・未merge。今回の変更はmigrationファイル名・テスト参照・総覧のみ。merge・gate ONは禁止。Forget Control / PR #66は触らない。
+
+#### Production履歴へのファイル名整合（2026-10-07）
+
+1本目はcommit `2eb4b90` で新名ファイルが追加されたが旧名も残っていたため、内容一致を確認して重複を解消し `git mv` で旧名を除去。残り3本も `git mv` し、4本すべて監査済みcommit `636c3fd` のSQL本文とbyte一致を確認。SQL内の旧timestampを含むコメントも変更しない。テストのファイル参照のみ新名称へ更新する。ローカルUTC full suite 320件・tsc・Next build成功。全CIの最終結果はPRの最新HEADに紐づくchecksを正本とする。
+
+#### Relationship Identity v1 — 実機canonical lover受入（2026-10-08）
+
+**結論:** branch Previewで実ユーザー会話から `romantic_acceptance → relationship_status=romantic_partner → Primary Identity=lover` のcanonical経路が成立した。これは表示上の「恋人」発言ではなく、Relationship Engine / Critical Event / canonical State / Identity Resolver / Identity persistenceを通過した正本上の成立である。Production frontendのIdentity gateは引き続きOFF、PR #67はDraft・未merge。
+
+**実機で発見した不具合:** 既存 `criticalCandidates(message)` はユーザーmessageだけから候補を生成し、Validatorの `supportingTurn` もユーザーmessageのみをgrounding対象としていた。そのため、canonical `romantic_proposal` 後にユーザーが「美咲も俺と付き合いたいってことでいい？」と確認し、美咲がreplyで明示的に交際同意しても、`romantic_acceptance` を成立させられずproposalとして再処理されていた。実DBでは修正前に proposal が増える一方 acceptance は0、Identityは `acquaintance` のままだった。
+
+**修正:** commit `2b104642` で、ユーザーの明示的な交際確認質問をacceptance候補へ含め、Validatorに限って「prior canonical romantic_proposal が存在し、かつMisaki replyが交際・恋人関係へ明示同意する」場合のみreplyをacceptanceのgroundingとして許可した。Misakiの「好き」「大好き」等の生成好意だけでは候補にもacceptanceにもならず、proposalなしのreply単独でも成立しない。既存原則「Misaki generated words alone cannot establish dating」は維持する。
+
+**回帰固定:** commit `cd2479ee` で `tests/relationship-mutual-acceptance.test.ts` を追加。①明示的確認質問→acceptance候補、②prior proposal＋明示的Misaki交際同意→acceptance可、③prior proposalなし→reply grounding拒否、④通常の好意表現→Critical Eventなし、を固定。GitHub Actions `Canonical relationship integration tests #432` はsuccess。Vercel Preview deployment `dpl_BJU7aDCqdAHmJYJemNkNV1QbZS2o` / commit `cd2479ee1cad11294132563049a86662f8652576` はREADY。
+
+**実機受入結果:** 最新Previewで同じ確認質問を送信。chat本体・`relationship-turn-record` は成功し、Runtime logに `RELATIONSHIP V1 PROCESSING RETRY REQUIRED` なし。canonical DBで `romantic_acceptance` が記録され、Identity stateは `primary_identity=lover`, `constraint_state=none`, `source_relationship_state_version=4` を確認。critical eventによるcanonical overrideは2-confirmation hysteresisを待たずloverへ遷移する設計どおり。
+
+**重要な解釈:** 以前の会話履歴で美咲が「恋人」と発言していても、それだけではcanonical Identityは `acquaintance` のままだった。今回初めて明示的な相互交際合意がcanonical Critical Eventとして成立し、正本のRelationship Status / Identityと会話上の関係が一致した。会話のノリや高いscoreだけでloverへ昇格していないことも同時に確認できた。
+
+**Acting Guide実機受入 PASS（2026-10-08）:** canonical `lover` 成立後の次turnでownerが「ねえ美咲、俺たちって今どんな関係？😊」と質問。美咲は「私たち、恋人同士でしょ？」と自然に回答し、直前会話も参照した表現を返した。内部の `lover` / Identity / score /判定ルールは露出していない。同一turnの生成結果を遡及変更せず、canonical成立後の**次turn**でActing Guideが現在Identityを自己認識する設計どおり。よって `canonical romantic_acceptance → Identity lover → next-turn Acting Guide self-recognition` の実機E2EをPASSとする。
+
+**次の受入:** anonymous path / temporary import v3 の実アプリ経路を優先し、匿名会話のRelationship Identityが保存時に恒久アカウントへ原子的に引き継がれることを確認する。その後 breakup / rejection / boundary、fresh romance Patternによるre-entry、真のmulti-session lock contentionを未完了事項として残す。
+
+**停止位置:** Production Identity migrationは適用済みだがProduction frontend Identity gateはOFF。PR #67はDraft・未merge。Production gate ON / mergeはownerの別承認まで禁止。PR #66 Forget Controlは触らない。
\ No newline at end of file

```

### docs/conversation-context-compression-spike.md

```text
diff --git a/docs/conversation-context-compression-spike.md b/docs/conversation-context-compression-spike.md
new file mode 100644
index 0000000..b5a6296
--- /dev/null
+++ b/docs/conversation-context-compression-spike.md
@@ -0,0 +1,40 @@
+# Conversation context compression — measurement-first spike
+
+Status: research only; no runtime behavior changes. Branch: `work/conversation-context-compression-spike`. Base: `ece799c20d685f00c007cb2f897bdd6b2443a2d3`.
+
+## Verified baseline
+- `app/api/chat/route.ts`: `MAX_HISTORY=60`; `safeHistory` keeps last 60 valid user/misaki messages.
+- `contents` sends those messages in full to Gemini.
+- The system prompt separately repeats up to eight recent Misaki replies, and includes persona, relationship guides, memory (up to 30), today's memory (up to 12), weather, time, life events, and output instructions.
+- `lib/gemini-json-generator.ts` uses `gemini-3.1-flash-lite`, JSON output, 30s timeout, and retries.
+- Example Production request 2026-10-08 00:51 UTC: attempt 1 timed out at 30,002 ms; attempt 2 succeeded in 16,881 ms with 8,378 input tokens and 316 output tokens. One example is not a benchmark.
+
+## Phase 1: instrumentation (no message content logged)
+Measure estimated or tokenizer-derived tokens/bytes/chars by component:
+1. Persona prompt
+2. Relationship guides and identity/pending guides
+3. Conversation history
+4. Recent-Misaki-reply repetition
+5. Long-term and today's memory
+6. Time, weather, life events and grounding rules
+7. Remaining fixed instructions and current user message
+
+Use the same tokenizer/method for all variants; compare estimates against Gemini `usageMetadata.promptTokenCount`. Store only numeric aggregates and request trace ID; never persist raw conversation content, email, or secret. No canonical relationship/memory writes from measurement. Check whether response tokens, retries and total wall time differ by variant.
+
+## Phase 2: offline candidates
+A. Current baseline: 60 recent messages + all current guides.
+B. Last 20 raw messages + existing long-term memory and relationship state; no summary.
+C. Last 20 raw messages + a **non-authoritative** summary of earlier context + existing long-term memory and relationship state.
+D. Variant C without the duplicated eight Misaki replies, after checking repetition/continuity regression.
+
+Never equate morphological tokenization with semantic summarization. No MeCab/Kuromoji dependency unless retrieval benchmarks show it helps. Summaries must preserve chronology, speaker attribution, negation, reconciliation, promises, uncertainty, and provenance; must not infer or mutate canonical relationship status. Summaries may be stale or unavailable: fall back to baseline. No extra synchronous Gemini call in the chat critical path.
+
+## Evaluation
+- Token count: per component and total, baseline vs variants.
+- Latency: Gemini attempt durations, retry count, end-to-end wall time, p50/p95 over multiple representative runs.
+- Quality: multi-turn coherence, reference resolution, remembered commitments, disagreement/reconciliation, relationship status consistency, and hallucination rate; human review blinded to variant.
+- Failure modes: summary omits correction, misattributes speaker, reverses negation, invents relationship change, drops key promise, or makes latest context inaccessible.
+- No production rollout unless quality is non-inferior and measurable performance gain exists. Draft PR only, gate OFF, no merge or Production configuration change.
+
+## Next implementation slice
+Add read-only context-size instrumentation behind a disabled-by-default flag, with unit tests for component boundaries and no sensitive logging. Do not optimize prompt or introduce summarization until baseline measurements are available.

```

### lib/canonical-state.ts

```text
diff --git a/lib/canonical-state.ts b/lib/canonical-state.ts
index 5849892..db18f21 100644
--- a/lib/canonical-state.ts
+++ b/lib/canonical-state.ts
@@ -1,8 +1,9 @@
 import { createClient } from "@supabase/supabase-js";
 import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
-import { engineEnabled, canonicalActingState, type Snapshot } from "./relationship-engine-v1";
+import { engineEnabled, identityEnabled, canonicalActingState, type Snapshot } from "./relationship-engine-v1";
 import { createLegacyRelationshipActingState, type RelationshipActingState } from "./relationship-acting-guide";
 import { criticalCandidates } from "./relationship-analyzer-v1";
+import { resolveRelationshipIdentity, type IdentityState, type RelationshipIdentity, type RelationshipConstraint } from "./relationship-identity-resolver";
 
 export type RootState = {
   history?: unknown[];
@@ -13,6 +14,7 @@ export type RootState = {
   temporaryRevision?: string | null;
   relationshipEngine?: Snapshot;
   relationshipActingState?: RelationshipActingState;
+  relationshipIdentity?: IdentityState;
   relationshipCriticalPending?: boolean;
   relationshipImportPending?: boolean;
   temporaryRelationship?: {
@@ -81,11 +83,12 @@ export async function loadCanonicalState(userId: string): Promise<RootState & {
     ]);
     relationshipImportPending = !!imported.error || !!temporary.error || (!imported.data && !!openTemporaryState(temporary.data?.token)?.state.relationshipEngine);
   }
-  const [relationship, conversation] = await Promise.all([
+  const [relationship, identity, conversation] = await Promise.all([
     db.from("misaki_relationship_state").select("*").eq("user_id", userId).maybeSingle(),
+    identityEnabled() ? db.from("misaki_relationship_identity_state").select("*").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
     db.from("misaki_user_conversation_state").select("history,memory,today_memory,updated_at").eq("user_id", userId).maybeSingle(),
   ]);
-  if (relationship.error || conversation.error) throw new Error("Canonical state read failed");
+  if (relationship.error || conversation.error || (identityEnabled() && identity.error)) throw new Error("Canonical state read failed");
   let relationshipCriticalPending = relationshipImportPending;
   if (engineEnabled()) {
     const { data, error } = await db.from("misaki_relationship_critical_pending").select("request_id").eq("user_id", userId).in("status", ["pending", "processing", "failed"]);
@@ -106,6 +109,16 @@ export async function loadCanonicalState(userId: string): Promise<RootState & {
     updatedAt: conversation.data?.updated_at ?? null,
     relationshipActingState: engineEnabled() && relationship.data ? canonicalActingState(relationship.data,
       createLegacyRelationshipActingState(relationship.data.intimacy_points).intimacyStage) : undefined,
+    relationshipIdentity: identityEnabled() && identity.data && relationship.data &&
+      Number(identity.data.source_relationship_state_version) === Number(relationship.data.relationship_state_version) ? {
+        primaryIdentity: identity.data.primary_identity as RelationshipIdentity,
+        candidateIdentity: identity.data.candidate_identity as RelationshipIdentity|null,
+        candidateConfirmations: Number(identity.data.candidate_confirmations ?? 0),
+        candidateSourceVersion: identity.data.candidate_source_version == null ? null : Number(identity.data.candidate_source_version),
+        constraint: identity.data.constraint_state as RelationshipConstraint,
+        constraintAnchorVersion: identity.data.constraint_anchor_version == null ? null : Number(identity.data.constraint_anchor_version),
+        preRomanticIdentity: identity.data.pre_romantic_identity as Exclude<RelationshipIdentity,"lover">|null
+      } : undefined,
     relationshipCriticalPending, relationshipImportPending,
   };
 }

```

### lib/context-overlap-analysis.ts

```text
diff --git a/lib/context-overlap-analysis.ts b/lib/context-overlap-analysis.ts
new file mode 100644
index 0000000..8d10394
--- /dev/null
+++ b/lib/context-overlap-analysis.ts
@@ -0,0 +1,42 @@
+/** Pure analysis helpers. Never alter the prompt or relationship state. */
+export type PromptSection = { name: string; text: string };
+export type PromptOverlap = {
+  name: string;
+  chars: number;
+  occurrences: number;
+  extraRepeatedChars: number;
+};
+export function analyzePromptSectionOverlap(
+  fullPrompt: string,
+  sections: PromptSection[],
+): PromptOverlap[] {
+  return sections.map(({ name, text }) => {
+    if (!text) return { name, chars: 0, occurrences: 0, extraRepeatedChars: 0 };
+    let occurrences = 0;
+    let cursor = 0;
+    while (true) {
+      const index = fullPrompt.indexOf(text, cursor);
+      if (index === -1) break;
+      occurrences++;
+      cursor = index + text.length;
+    }
+    return {
+      name,
+      chars: text.length,
+      occurrences,
+      extraRepeatedChars: Math.max(0, occurrences - 1) * text.length,
+    };
+  });
+}
+/** The recent model replies are already present in the raw history.
+ * Return only a numeric overlap diagnostic; never output their contents. */
+export function countRepeatedRepliesInHistory(
+  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
+  recentReplies: string[],
+) {
+  const modelTexts = new Set(history.filter((m) => m.role === "model").flatMap((m) => m.parts.map((p) => p.text)));
+  return {
+    recentReplies: recentReplies.length,
+    duplicatedReplies: recentReplies.filter((reply) => modelTexts.has(reply)).length,
+  };
+}

```

### lib/context-size-measurement.ts

```text
diff --git a/lib/context-size-measurement.ts b/lib/context-size-measurement.ts
new file mode 100644
index 0000000..36a944a
--- /dev/null
+++ b/lib/context-size-measurement.ts
@@ -0,0 +1,39 @@
+/** Numeric-only, non-authoritative chat prompt size measurements. No raw text is logged. */
+export type ContextSizeInput = {
+  systemInstruction: string;
+  history: Array<{ parts: Array<{ text: string }> }>;
+  userText: string;
+  persona: string;
+  relationshipGuides: string[];
+  longTermMemory: string;
+  todayMemory: string;
+  repeatedReplies: string;
+  environmentGuides: string[];
+};
+const chars = (s: string) => s.length;
+const sum = (items: string[]) => items.reduce((n, item) => n + chars(item), 0);
+export function measureContextSize(input: ContextSizeInput) {
+  const historyChars = input.history.reduce((n, item) =>
+    n + item.parts.reduce((m, part) => m + chars(part.text), 0), 0);
+  const dynamic = {
+    persona: chars(input.persona),
+    relationship: sum(input.relationshipGuides),
+    longTermMemory: chars(input.longTermMemory),
+    todayMemory: chars(input.todayMemory),
+    repeatedReplies: chars(input.repeatedReplies),
+    environment: sum(input.environmentGuides),
+  };
+  return {
+    unit: "utf16_chars" as const,
+    systemInstructionChars: chars(input.systemInstruction),
+    historyChars,
+    historyMessages: input.history.length,
+    userMessageChars: chars(input.userText),
+    dynamicComponentChars: dynamic,
+    // This is a character-size diagnostic, NOT token counting.
+    // Dynamic components can occur multiple times; totals are not additive.
+  };
+}
+export function contextSizeMeasurementEnabled(value: string | undefined) {
+  return value === "1";
+}

```

### lib/relationship-acting-guide.ts

```text
diff --git a/lib/relationship-acting-guide.ts b/lib/relationship-acting-guide.ts
index 9f494a4..c12ac2d 100644
--- a/lib/relationship-acting-guide.ts
+++ b/lib/relationship-acting-guide.ts
@@ -1,3 +1,4 @@
+import type { RelationshipIdentity, RelationshipTrait, RelationshipConstraint } from "./relationship-identity-resolver";
 export type RelationshipActingState = {
   intimacyStage: 0 | 1 | 2 | 3 | 4 | 5;
   friendship: number;
@@ -27,7 +28,8 @@ function level(value: number) {
  * Scores must not automatically establish a relationship status.
  */
 export function createRelationshipActingGuide(
-  input: RelationshipActingState
+  input: RelationshipActingState,
+  identity?: { primaryIdentity: RelationshipIdentity; traits?: RelationshipTrait[]; constraint?: RelationshipConstraint }
 ) {
   const state = {
     ...input,
@@ -49,6 +51,23 @@ export function createRelationshipActingGuide(
       : "現在の交際状態は未成立。過去の記憶や点数だけで現在の恋人扱いをしない。",
   ];
 
+  if (identity) {
+    const labels: Partial<Record<RelationshipIdentity,string>> = {
+      acquaintance:"顔見知り", conversation_partner:"話し相手", friend:"友達", compatible_friend:"気の合う友達",
+      trusted_friend:"信頼できる友達", partner_in_crime:"相棒", best_friend:"親友", important_person:"大切な人",
+      person_of_interest:"気になる人", special_person:"特別な人", lover:"恋人"
+    };
+    notes.push(`現在の関係の自己認識は「${labels[identity.primaryIdentity] ?? identity.primaryIdentity}」。通常はラベルを台詞として読み上げず距離感の前提として使う。ただしユーザーから「私たちはどういう関係？」「俺たちって何？」のように関係を直接聞かれた時は、この自己認識と明示的な交際状態に沿って、美咲自身の一人称の言葉で自然に答えてよい。DB名・内部ラベル名・点数・判定基準は説明しない。`);
+    if (identity.primaryIdentity !== "lover") notes.push("Primary Identityが恋人以外なら、親密さや恋愛意識が高くても恋人として既成事実化しない。");
+    if (identity.traits?.includes("deep_trust")) notes.push("深い信頼があるので、必要以上に聞き出さず自然に受け止められる。");
+    if (identity.traits?.includes("playful_sync")) notes.push("呼吸の合う軽いやり取りを文脈に合う時だけ自然に使える。");
+    if (identity.traits?.includes("strong_affection")) notes.push("強い親愛を温かさとしてにじませるが、それだけで恋愛表現へ変換しない。");
+    if (identity.traits?.includes("romantic_awareness")) notes.push("恋愛的な意識は背景にあるが、Primary Identityと明示的な交際状態を越えない。");
+    if (identity.constraint === "post_breakup") notes.push("交際終了後で関係を作り直している途中。過去から残る高い数値だけで以前の恋愛関係を復活させない。");
+    if (identity.constraint === "post_rejection") notes.push("恋愛的な拒否の後。過去から残る恋愛方向の数値だけで関係を押し進めない。");
+    if (identity.constraint === "boundary") notes.push("現在は関係上の境界を親密さより優先する。");
+  }
+
   if (state.intimacyStage <= 1) {
     notes.push("まだ距離を作っている途中。感じよく親しみやすく話すが、相手をよく知っている前提の省略・馴れ馴れしさ・強い甘え・嫉妬・独占的な言い方は避ける。少しだけよそ行きの距離を残す。");
   } else if (state.intimacyStage >= 4) {

```

### lib/relationship-analyzer-v1.ts

```text
diff --git a/lib/relationship-analyzer-v1.ts b/lib/relationship-analyzer-v1.ts
index 05944b0..de1276e 100644
--- a/lib/relationship-analyzer-v1.ts
+++ b/lib/relationship-analyzer-v1.ts
@@ -77,7 +77,7 @@ export function criticalCandidates(message: string): CriticalType[] {
   if (/[「」『』]|もし|たとえば|例えば|仮に|って言|と言|彼女|彼氏|第三者/.test(message)) return [];
   const candidates: CriticalType[] = [];
   if (/付き合って|恋人になって/.test(message)) candidates.push("romantic_proposal");
-  if (/付き合おう|恋人になろう|交際を承諾/.test(message)) candidates.push("romantic_acceptance");
+  if (/付き合おう|恋人になろう|交際を承諾|付き合いたいってことでいい|付き合うってことでいい|恋人(?:同士)?ってことでいい/.test(message)) candidates.push("romantic_acceptance");
   if (/別れよう|交際を終わ|恋人関係を終わ/.test(message)) candidates.push("relationship_end");
   if (/付き合えない|恋愛じゃない|恋人にはなれない/.test(message)) candidates.push("romantic_rejection");
   if (/やめて|しないで|嫌だから/.test(message)) candidates.push("boundary_event");
@@ -96,14 +96,18 @@ export async function validateCriticalEvent(turn: Turn, candidate: CriticalType,
 Return exactly {"confirmed":boolean,"supportingTurn":"exact user substring"}.
 Scores, elapsed time, generated Misaki affection and memory cannot establish dating.
 romantic_acceptance requires explicit mutual agreement to partnership, not merely mutual affection, a proposal or "好き".
+For a user's explicit confirmation question such as "付き合いたいってことでいい？", romantic_acceptance may be confirmed only when a prior canonical romantic_proposal exists AND Misaki's reply explicitly agrees to dating/being partners. Misaki affection alone never qualifies.
 Third-party, quoted, hypothetical, ambiguous or negated events are not confirmed. Reconciliation never means automatic reunion.
 Use prior canonical events only as context; never fabricate them. When uncertain return false.
-supportingTurn must be copied exactly from the user's message. No additional fields.`,
+supportingTurn must be copied exactly from the user's message, except for romantic_acceptance grounded by a prior canonical romantic_proposal plus Misaki's explicit partnership agreement, where it may be copied exactly from Misaki's reply. No additional fields.`,
     userText: JSON.stringify({ turn, candidate, priorEvents }),
   });
   if (!response.ok || !response.text) throw new Error("relationship_validator_unavailable");
   const value = JSON.parse(response.text);
+  const priorProposal = candidate === "romantic_acceptance" && priorEvents.some((event: any) => event?.event_type === "romantic_proposal");
+  const grounded = typeof value?.supportingTurn === "string" &&
+    (turn.message.includes(value.supportingTurn) || (priorProposal && turn.reply.includes(value.supportingTurn)));
   if (!value || Object.keys(value).some(k => !["confirmed", "supportingTurn"].includes(k)) || typeof value.confirmed !== "boolean" ||
-    typeof value.supportingTurn !== "string" || (value.confirmed && (!value.supportingTurn.trim() || !turn.message.includes(value.supportingTurn)))) throw new Error("invalid_critical_validation");
+    typeof value.supportingTurn !== "string" || (value.confirmed && (!value.supportingTurn.trim() || !grounded))) throw new Error("invalid_critical_validation");
   return value.confirmed as boolean;
-}
+}
\ No newline at end of file

```

### lib/relationship-engine-v1.ts

```text
diff --git a/lib/relationship-engine-v1.ts b/lib/relationship-engine-v1.ts
index 969f26a..591ebb1 100644
--- a/lib/relationship-engine-v1.ts
+++ b/lib/relationship-engine-v1.ts
@@ -1,5 +1,6 @@
 import { createHash } from "node:crypto";
 import type { RelationshipActingState } from "./relationship-acting-guide.ts";
+import type { IdentityState } from "./relationship-identity-resolver.ts";
 
 export const PROCESSING_VERSION = "relationship-v1.1";
 export const AXES = ["friendship", "trust", "playfulness", "affection", "romance"] as const;
@@ -21,8 +22,10 @@ export type Snapshot = {
   state: RelationshipActingState; version: number; episodes: Episode[]; appliedPatterns: string[];
   processed: string[]; pending: Turn[];
   criticalEvents?: Array<{ request_id: string; event_type: CriticalType }>;
+  identity?: IdentityState;
 };
 export function engineEnabled() { return process.env.MISAKI_RELATIONSHIP_ENGINE_VERSION === PROCESSING_VERSION; }
+export function identityEnabled() { return engineEnabled() && process.env.MISAKI_RELATIONSHIP_IDENTITY_VERSION === "relationship-identity-v1"; }
 export function hash(text: string) { return createHash("sha256").update(text).digest("hex"); }
 
 /** Fail closed: the model supplies observations, never score/status/delta. */

```

### lib/relationship-identity-resolver.ts

```text
diff --git a/lib/relationship-identity-resolver.ts b/lib/relationship-identity-resolver.ts
new file mode 100644
index 0000000..6327903
--- /dev/null
+++ b/lib/relationship-identity-resolver.ts
@@ -0,0 +1,92 @@
+export const RELATIONSHIP_IDENTITIES = ["acquaintance","conversation_partner","friend","compatible_friend","trusted_friend","partner_in_crime","best_friend","important_person","person_of_interest","special_person","lover"] as const;
+export type RelationshipIdentity = typeof RELATIONSHIP_IDENTITIES[number];
+export type RelationshipConstraint = "none" | "post_breakup" | "post_rejection" | "boundary";
+export type RelationshipTrait = "comfortable" | "deep_trust" | "playful_sync" | "strong_affection" | "romantic_awareness";
+export type IdentityDecision = "maintain" | "promote" | "demote" | "lateral" | "canonical_override" | "hold";
+export type AxisState = { friendship:number; trust:number; playfulness:number; affection:number; romance:number; relationshipStatus?:"none"|"romantic_partner" };
+export type IdentityState = { primaryIdentity:RelationshipIdentity; candidateIdentity?:RelationshipIdentity|null; candidateConfirmations?:number; candidateSourceVersion?:number|null; constraint?:RelationshipConstraint; constraintAnchorVersion?:number|null; preRomanticIdentity?:Exclude<RelationshipIdentity,"lover">|null; romanceReentryVersion?:number|null };
+export type IdentityInput = { state:AxisState; relationshipStateVersion:number; current?:IdentityState; criticalEvent?:"romantic_acceptance"|"romantic_rejection"|"relationship_end"|"boundary_event"|"reconciliation"|null; hasNewRomancePattern?:boolean };
+export type IdentityResult = { primaryIdentity:RelationshipIdentity; traits:RelationshipTrait[]; candidateIdentity:RelationshipIdentity|null; candidateConfirmations:number; candidateSourceVersion:number|null; constraint:RelationshipConstraint; constraintAnchorVersion:number|null; preRomanticIdentity:Exclude<RelationshipIdentity,"lover">|null; romanceReentryVersion:number|null; transitionDecision:IdentityDecision; reasonCode:string };
+
+const centers:Record<Exclude<RelationshipIdentity,"lover">,[number,number,number,number,number]>={
+ acquaintance:[15,10,10,10,0], conversation_partner:[30,20,15,20,0], friend:[50,35,30,30,5],
+ compatible_friend:[65,45,70,40,5], trusted_friend:[65,70,35,50,5], partner_in_crime:[82,72,82,58,8],
+ best_friend:[88,90,55,78,8], important_person:[72,82,42,90,12], person_of_interest:[58,48,38,48,55],
+ special_person:[75,78,48,80,72]
+};
+const gates:Record<Exclude<RelationshipIdentity,"lover">,(s:AxisState)=>boolean>={
+ acquaintance:()=>true, conversation_partner:s=>s.friendship>=20||s.trust>=15||s.affection>=15,
+ friend:s=>s.friendship>=40&&Math.max(s.trust,s.playfulness,s.affection)>=25,
+ compatible_friend:s=>s.friendship>=55&&s.playfulness>=55, trusted_friend:s=>s.friendship>=55&&s.trust>=60,
+ partner_in_crime:s=>s.friendship>=70&&s.trust>=55&&s.playfulness>=70,
+ best_friend:s=>s.friendship>=75&&s.trust>=80&&s.affection>=65,
+ important_person:s=>s.trust>=70&&s.affection>=80&&s.friendship>=55,
+ person_of_interest:s=>s.romance>=45&&Math.max(s.friendship,s.trust,s.affection)>=45&&(s.trust+s.affection)>=90,
+ special_person:s=>s.romance>=65&&s.trust>=65&&s.affection>=70&&s.friendship>=60
+};
+function distance(s:AxisState,c:[number,number,number,number,number]){
+ const a=[s.friendship,s.trust,s.playfulness,s.affection,s.romance],w=[1,1,1,1,.35];
+ return a.reduce((n,v,i)=>n+w[i]*((v-c[i])/100)**2,0)/w.reduce((a,b)=>a+b,0);
+}
+// Equal canonical distances are ambiguous, not an implicit priority from declaration order.
+function uniqueClosest<T extends RelationshipIdentity>(ranked:readonly (readonly [T,number])[]):T|null{
+ if(!ranked.length || (ranked.length>1 && Math.abs(ranked[0][1]-ranked[1][1])<=1e-12)) return null;
+ return ranked[0][0];
+}
+function candidate(s:AxisState,constraint:RelationshipConstraint,allowRomanceUnderConstraint=false){
+ if(s.relationshipStatus==="romantic_partner") return "lover" as const;
+ const blockedRomance=constraint!=="none"&&!allowRomanceUnderConstraint;
+ const ranked=(Object.keys(centers) as Exclude<RelationshipIdentity,"lover">[])
+  .filter(id=>gates[id](s)&&(!blockedRomance||!["person_of_interest","special_person"].includes(id)))
+  .map(id=>[id,distance(s,centers[id])] as const).sort((a,b)=>a[1]-b[1]);
+ if(!ranked.length||ranked[0][1]>.30) return null;
+ // Romance without relational foundation must never manufacture relationship growth.
+ if(s.romance>=80&&Math.max(s.friendship,s.trust,s.affection)<45) return null;
+ return uniqueClosest(ranked);
+}
+const neighbors:Record<Exclude<RelationshipIdentity,"lover">,readonly Exclude<RelationshipIdentity,"lover">[]>={
+ acquaintance:["conversation_partner"], conversation_partner:["friend","acquaintance"],
+ friend:["conversation_partner","compatible_friend","trusted_friend","person_of_interest","important_person"],
+ compatible_friend:["friend","partner_in_crime","important_person"], trusted_friend:["friend","best_friend","important_person"],
+ partner_in_crime:["compatible_friend","important_person","special_person"], best_friend:["trusted_friend","important_person","special_person"],
+ important_person:["friend","compatible_friend","trusted_friend","partner_in_crime","best_friend","person_of_interest","special_person"],
+ person_of_interest:["friend","important_person","special_person"], special_person:["person_of_interest","important_person","partner_in_crime","best_friend"]
+};
+function adjacentTarget(current:RelationshipIdentity,target:RelationshipIdentity,s:AxisState){
+ if(current===target||current==="lover"||target==="lover"||neighbors[current].includes(target)) return target;
+ const local=neighbors[current].filter(id=>gates[id](s)).map(id=>[id,distance(s,centers[id])] as const).sort((a,b)=>a[1]-b[1]);
+ // Escape only when canonical shape overwhelmingly supports a distant region; normal movement prefers the supported neighbor closest to the canonical shape.
+ return local.length?uniqueClosest(local):target;
+}
+export function deriveRelationshipTraits(s:AxisState):RelationshipTrait[]{
+ const out:RelationshipTrait[]=[]; if(Math.max(s.friendship,s.trust,s.affection)>=50)out.push("comfortable");
+ if(s.trust>=70)out.push("deep_trust"); if(s.playfulness>=70&&s.friendship>=60)out.push("playful_sync");
+ if(s.affection>=75)out.push("strong_affection"); if(s.romance>=45&&Math.max(s.friendship,s.trust,s.affection)>=45)out.push("romantic_awareness"); return out;
+}
+export function resolveRelationshipIdentity(input:IdentityInput):IdentityResult{
+ const cur=input.current??{primaryIdentity:"acquaintance",candidateIdentity:null,candidateConfirmations:0,constraint:"none"};
+ let constraint=cur.constraint??"none"; let constraintAnchorVersion=cur.constraintAnchorVersion??null; let romanceReentryVersion=cur.romanceReentryVersion??null;
+ if(input.criticalEvent==="relationship_end"){ constraint="post_breakup"; constraintAnchorVersion=input.relationshipStateVersion; romanceReentryVersion=null; }
+ if(input.criticalEvent==="romantic_rejection"){ constraint="post_rejection"; constraintAnchorVersion=input.relationshipStateVersion; romanceReentryVersion=null; }
+ if(input.criticalEvent==="boundary_event"){ constraint="boundary"; constraintAnchorVersion=input.relationshipStateVersion; romanceReentryVersion=null; }
+ if(input.state.relationshipStatus==="romantic_partner"||input.criticalEvent==="romantic_acceptance")
+  return {primaryIdentity:"lover",traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint:"none",constraintAnchorVersion:null,romanceReentryVersion:null,preRomanticIdentity:cur.primaryIdentity==="lover"?(cur.preRomanticIdentity??null):cur.primaryIdentity,transitionDecision:"canonical_override",reasonCode:"explicit_romantic_partnership"};
+ if(input.criticalEvent==="relationship_end"&&cur.primaryIdentity==="lover")
+  return {primaryIdentity:cur.preRomanticIdentity??"acquaintance",traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint,constraintAnchorVersion,romanceReentryVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"canonical_override",reasonCode:"explicit_relationship_end_restore_safe_identity"};
+ const hasPostAnchorState=constraint==="none"||constraintAnchorVersion==null||input.relationshipStateVersion>constraintAnchorVersion;
+ if(hasPostAnchorState&&constraint!=="none"&&constraint!=="boundary"&&input.hasNewRomancePattern===true) romanceReentryVersion=input.relationshipStateVersion;
+ const allowRomanceReentry=hasPostAnchorState&&constraint!=="boundary"&&(romanceReentryVersion!=null||input.hasNewRomancePattern===true);
+ const rawNext=hasPostAnchorState?candidate(input.state,constraint,allowRomanceReentry):null;
+ // Adjacency shapes ordinary growth. Post-constraint rebuilding is already guarded by the anchor, romance block, and two distinct canonical confirmations.
+ const adjacentNext=rawNext?(constraint==="none"?adjacentTarget(cur.primaryIdentity,rawNext,input.state):rawNext):null;
+ // Preserve a stable distant raw candidate across canonical versions. One observation still follows adjacency; a second distinct canonical confirmation may escape the graph.
+ const priorDistantConfirmed=constraint==="none"&&rawNext&&adjacentNext!==rawNext&&cur.candidateIdentity===rawNext&&cur.candidateSourceVersion!==input.relationshipStateVersion;
+ const next=priorDistantConfirmed?rawNext:adjacentNext;
+ if(!next||next===cur.primaryIdentity) return {primaryIdentity:cur.primaryIdentity,traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint,constraintAnchorVersion,romanceReentryVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"maintain",reasonCode:next?"current_identity_supported":"candidate_refused"};
+ const trackedCandidate=constraint==="none"&&rawNext&&adjacentNext!==rawNext?rawNext:next;
+ const sameCandidate=cur.candidateIdentity===trackedCandidate;
+ const sameSource=sameCandidate&&cur.candidateSourceVersion===input.relationshipStateVersion;
+ const confirmations=sameSource?(cur.candidateConfirmations??1):(sameCandidate?(cur.candidateConfirmations??0)+1:1);
+ if(confirmations<2) return {primaryIdentity:cur.primaryIdentity,traits:deriveRelationshipTraits(input.state),candidateIdentity:trackedCandidate,candidateConfirmations:confirmations,candidateSourceVersion:input.relationshipStateVersion,constraint,constraintAnchorVersion,romanceReentryVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"hold",reasonCode:sameSource?"duplicate_source_version_ignored":"candidate_requires_second_canonical_state"};
+ return {primaryIdentity:next,traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint,constraintAnchorVersion,romanceReentryVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"lateral",reasonCode:"candidate_confirmed_by_distinct_state_versions"};
+}

```

### lib/relationship-runtime-v1.ts

```text
diff --git a/lib/relationship-runtime-v1.ts b/lib/relationship-runtime-v1.ts
index a5d2299..b6c1808 100644
--- a/lib/relationship-runtime-v1.ts
+++ b/lib/relationship-runtime-v1.ts
@@ -1,9 +1,12 @@
 import { createServerSupabase, loadTemporaryRoot, editTemporaryRoot, openTemporaryState, type RootState } from "./canonical-state";
 import { createLegacyRelationshipActingState } from "./relationship-acting-guide";
-import { engineEnabled, PROCESSING_VERSION, applyTemporaryEvidence, AXES, type Snapshot, type Turn } from "./relationship-engine-v1";
+import { engineEnabled, identityEnabled, PROCESSING_VERSION, applyTemporaryEvidence, AXES, type Snapshot, type Turn } from "./relationship-engine-v1";
 import { analyzeRelationshipEvidence, criticalCandidates, validateCriticalEvent } from "./relationship-analyzer-v1";
 import { CanonicalRelationshipStore, processRelationshipTurn } from "./relationship-processing-v1";
 import { createGeminiTelemetrySink } from "./gemini-usage-telemetry-server";
+import { resolveRelationshipIdentity, type IdentityState, type RelationshipIdentity, type RelationshipConstraint } from "./relationship-identity-resolver";
+
+const IDENTITY_RESOLVER_VERSION = "relationship-identity-v1";
 
 // Local deduplication is an optimization; DB leases serialize distributed workers.
 const running = new Map<string, Promise<void>>();
@@ -21,6 +24,7 @@ async function analyzeTemporarySnapshot(root: RootState, save?: (snapshot: Snaps
     if (!history?.some(t => t.requestId === turn.requestId && t.role === "user" && t.text === turn.message) ||
       !history.some(t => t.requestId === turn.requestId && t.role === "misaki" && t.text === turn.reply)) throw new Error("temporary_canonical_turn_required");
     // Pending turn remains encrypted/durable if validation or analysis fails.
+    const turnStartVersion = snapshot.version;
     for (const type of criticalCandidates(turn.message)) {
       const events = snapshot.criticalEvents ?? [];
       if (events.some(e => e.request_id === turn.requestId && e.event_type === type)) continue;
@@ -36,7 +40,30 @@ async function analyzeTemporarySnapshot(root: RootState, save?: (snapshot: Snaps
     await check?.();
     const evidence = await analyzeRelationshipEvidence(turn, createGeminiTelemetrySink("relationship_analyzer", telemetryUserId, turn.requestId));
     await check?.();
+    const preEvidenceVersion=snapshot.version;
+    const preEvidenceRomance=snapshot.state.romance;
     snapshot = applyTemporaryEvidence(snapshot, turn, evidence);
+    const hasFreshRomanceProvenance=snapshot.version>preEvidenceVersion && snapshot.state.romance>preEvidenceRomance;
+    if (identityEnabled() && snapshot.version !== turnStartVersion) {
+      const latestCritical = snapshot.criticalEvents?.filter(e => e.request_id === turn.requestId).at(-1)?.event_type ?? null;
+      const resolved = resolveRelationshipIdentity({
+        relationshipStateVersion: snapshot.version,
+        state: snapshot.state,
+        current: snapshot.identity,
+        criticalEvent: latestCritical==="romantic_proposal"?null:latestCritical,
+        hasNewRomancePattern:hasFreshRomanceProvenance
+      });
+      snapshot = { ...snapshot, identity: {
+        primaryIdentity: resolved.primaryIdentity,
+        candidateIdentity: resolved.candidateIdentity,
+        candidateConfirmations: resolved.candidateConfirmations,
+        candidateSourceVersion: resolved.candidateSourceVersion,
+        constraint: resolved.constraint,
+        constraintAnchorVersion: resolved.constraintAnchorVersion,
+        romanceReentryVersion: resolved.romanceReentryVersion,
+        preRomanticIdentity: resolved.preRomanticIdentity
+      } };
+    }
     if (save) await save(snapshot);
   }
   return snapshot;
@@ -70,7 +97,10 @@ async function runPermanent(userId: string) {
       (t, type, events) => validateCriticalEvent(t, type, events, createGeminiTelemetrySink("critical_validator", userId, t.requestId)),
       (check, token) => importPermanentRelationship(userId, turn.request_id, token, check));
     if (result.status === "deferred") break;
+    if (identityEnabled()) await processPermanentIdentity(userId);
   }
+  // Applied Relationship turns may have been skipped above while Identity previously failed.
+  if (identityEnabled()) await processPermanentIdentity(userId);
 }
 
 /** Called via Next after(): never changes an already-successful chat/quota receipt. */
@@ -106,9 +136,25 @@ export async function importPermanentRelationship(userId: string, requestId: str
   // verified trajectory in memory and materialize atomically through the import RPC.
   if (snapshot.pending.length) snapshot = await analyzeTemporarySnapshot(verified.state, undefined, check, userId);
   await check();
-  const { error: rpcError } = await db.rpc("import_misaki_temporary_relationship_v2", { p_user_id: userId, p_request_id: requestId, p_processing_version: PROCESSING_VERSION, p_lease_token: token, p_source_revision: root.revision,
+  if (!identityEnabled()) {
+    const { error: legacyImportError } = await db.rpc("import_misaki_temporary_relationship_v2", { p_user_id: userId, p_request_id: requestId, p_processing_version: PROCESSING_VERSION, p_lease_token: token, p_source_revision: root.revision,
+      ...Object.fromEntries(AXES.map(axis => [`p_${axis}`, snapshot.state[axis]])), p_relationship_status: snapshot.state.relationshipStatus ?? "none",
+      p_engine_version: PROCESSING_VERSION, p_payload: snapshot });
+    if (legacyImportError) throw new Error(`relationship_import_failed:${legacyImportError.code ?? ""}:${legacyImportError.message ?? ""}`);
+    return;
+  }
+  const identity = snapshot.identity ?? resolveRelationshipIdentity({
+    relationshipStateVersion: snapshot.version,
+    state: snapshot.state
+  });
+  const { error: rpcError } = await db.rpc("import_misaki_temporary_relationship_v3", { p_user_id: userId, p_request_id: requestId, p_processing_version: PROCESSING_VERSION, p_lease_token: token, p_source_revision: root.revision,
     ...Object.fromEntries(AXES.map(axis => [`p_${axis}`, snapshot.state[axis]])), p_relationship_status: snapshot.state.relationshipStatus ?? "none",
-    p_engine_version: PROCESSING_VERSION, p_payload: snapshot });
+    p_engine_version: PROCESSING_VERSION, p_payload: snapshot,
+    p_primary_identity: identity.primaryIdentity, p_candidate_identity: identity.candidateIdentity ?? null,
+    p_candidate_confirmations: identity.candidateConfirmations ?? 0, p_candidate_source_version: identity.candidateSourceVersion ?? null,
+    p_constraint_state: identity.constraint ?? "none", p_constraint_anchor_version: identity.constraintAnchorVersion ?? null,
+    p_romance_reentry_established: identity.romanceReentryVersion != null, p_pre_romantic_identity: identity.preRomanticIdentity ?? null,
+    p_resolver_version: IDENTITY_RESOLVER_VERSION });
   if (rpcError) throw new Error(`relationship_import_failed:${rpcError.code ?? ""}:${rpcError.message ?? ""}`);
 }
 
@@ -116,3 +162,70 @@ export function pendingRelationshipGuide(root: RootState) {
   return root.relationshipCriticalPending || root.relationshipEngine?.pending.some(t => criticalCandidates(t.message).length)
     ? "【未解決の明示的関係イベント】直近の関係変更は検証待ち。成立・継続・復縁を断定せず、現在のユーザーの境界を優先してください。" : "";
 }
+
+
+async function processPermanentIdentity(userId: string) {
+  const db = createServerSupabase();
+  const { data: relationship, error: relationshipError } = await db.from("misaki_relationship_state")
+    .select("friendship_score,trust_score,playfulness_score,affection_score,romance_score,relationship_status,relationship_state_version")
+    .eq("user_id",userId).maybeSingle();
+  if (relationshipError) throw new Error("relationship_identity_source_read_failed");
+  if (!relationship) return;
+
+  const { data: saved, error: identityError } = await db.from("misaki_relationship_identity_state").select("*").eq("user_id",userId).maybeSingle();
+  // Migration is intentionally deployable separately from runtime. Until present, retry later.
+  if (identityError) throw new Error("relationship_identity_state_read_failed");
+  if (saved?.source_relationship_state_version === relationship.relationship_state_version && saved?.resolver_version === IDENTITY_RESOLVER_VERSION) return;
+
+  const { data: eventRows, error: eventError } = await db.from("misaki_relationship_events")
+    .select("event_type,after_state,id").eq("user_id",userId)
+    .in("event_type",["romantic_acceptance","romantic_rejection","relationship_end","boundary_event","reconciliation"])
+    .order("id",{ascending:false}).limit(1);
+  if (eventError) throw new Error("relationship_identity_event_read_failed");
+  const latestEvent = eventRows?.[0];
+  const eventVersion = Number(latestEvent?.after_state?.relationship_state_version);
+  const criticalEvent = eventVersion === Number(relationship.relationship_state_version) ? latestEvent.event_type : null;
+
+  let hasNewRomancePattern=false;
+  if(saved?.constraint_state && saved.constraint_state!=="none" && saved.constraint_state!=="boundary"){
+    const { data: application, error: applicationError } = await db.from("misaki_relationship_state_applications")
+      .select("romance_delta,after_state").eq("user_id",userId)
+      .eq("after_state->>relationship_state_version",String(relationship.relationship_state_version)).limit(1).maybeSingle();
+    if(applicationError) throw new Error("relationship_identity_application_read_failed");
+    hasNewRomancePattern=Number(application?.after_state?.relationship_state_version)===Number(relationship.relationship_state_version)
+      && Number(application?.romance_delta ?? 0)>0;
+  }
+
+  const current:IdentityState|undefined = saved ? {
+    primaryIdentity:saved.primary_identity as RelationshipIdentity,
+    candidateIdentity:saved.candidate_identity as RelationshipIdentity|null,
+    candidateConfirmations:Number(saved.candidate_confirmations ?? 0),
+    candidateSourceVersion:saved.candidate_source_version == null ? null : Number(saved.candidate_source_version),
+    constraint:saved.constraint_state as RelationshipConstraint,
+    constraintAnchorVersion:saved.constraint_anchor_version == null ? null : Number(saved.constraint_anchor_version),
+    romanceReentryVersion:saved.romance_reentry_version == null ? null : Number(saved.romance_reentry_version),
+    preRomanticIdentity:saved.pre_romantic_identity as Exclude<RelationshipIdentity,"lover">|null
+  } : undefined;
+
+  const resolved=resolveRelationshipIdentity({
+    relationshipStateVersion:Number(relationship.relationship_state_version),
+    state:{
+      friendship:Number(relationship.friendship_score),trust:Number(relationship.trust_score),
+      playfulness:Number(relationship.playfulness_score),affection:Number(relationship.affection_score),
+      romance:Number(relationship.romance_score),relationshipStatus:relationship.relationship_status
+    },
+    current,criticalEvent,hasNewRomancePattern
+  });
+
+  const { error: applyError } = await db.rpc("apply_misaki_relationship_identity_v1",{
+    p_user_id:userId,p_source_relationship_state_version:Number(relationship.relationship_state_version),
+    p_resolver_version:IDENTITY_RESOLVER_VERSION,p_primary_identity:resolved.primaryIdentity,
+    p_candidate_identity:resolved.candidateIdentity,p_candidate_confirmations:resolved.candidateConfirmations,
+    p_candidate_source_version:resolved.candidateSourceVersion,p_constraint_state:resolved.constraint,
+    p_constraint_anchor_version:resolved.constraintAnchorVersion,p_romance_reentry_version:resolved.romanceReentryVersion,p_pre_romantic_identity:resolved.preRomanticIdentity,p_transition_decision:resolved.transitionDecision,p_reason_code:resolved.reasonCode
+  });
+  if (applyError) {
+    if (/stale_relationship_state_version/.test(applyError.message ?? "")) return; // a newer canonical state won; retry from it later.
+    throw new Error(`relationship_identity_apply_failed:${applyError.code ?? ""}:${applyError.message ?? ""}`);
+  }
+}

```

### package-lock.json

```text
diff --git a/package-lock.json b/package-lock.json
index e79ef05..519fb1e 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -17,6 +17,7 @@
         "web-push": "^3.6.7"
       },
       "devDependencies": {
+        "@electric-sql/pglite": "0.5.8",
         "@types/node": "^20",
         "@types/react": "^19",
         "@types/react-dom": "^19",
@@ -24,6 +25,13 @@
         "typescript": "^5"
       }
     },
+    "node_modules/@electric-sql/pglite": {
+      "version": "0.5.8",
+      "resolved": "https://registry.npmjs.org/@electric-sql/pglite/-/pglite-0.5.8.tgz",
+      "integrity": "sha512-n9tsbUOhwx2epK1V0ZG9Ar4SHWUju04dhmzZXiSBXwBoleOvIfals33NAaWgagQVAL4Rbvx/Ptsu3P+pA09f6Q==",
+      "dev": true,
+      "license": "Apache-2.0"
+    },
     "node_modules/@emnapi/runtime": {
       "version": "1.11.3",
       "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.3.tgz",
@@ -1232,6 +1240,12 @@
     }
   },
   "dependencies": {
+    "@electric-sql/pglite": {
+      "version": "0.5.8",
+      "resolved": "https://registry.npmjs.org/@electric-sql/pglite/-/pglite-0.5.8.tgz",
+      "integrity": "sha512-n9tsbUOhwx2epK1V0ZG9Ar4SHWUju04dhmzZXiSBXwBoleOvIfals33NAaWgagQVAL4Rbvx/Ptsu3P+pA09f6Q==",
+      "dev": true
+    },
     "@emnapi/runtime": {
       "version": "1.11.3",
       "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.3.tgz",

```

### package.json

```text
diff --git a/package.json b/package.json
index e155267..55ce3cc 100644
--- a/package.json
+++ b/package.json
@@ -18,6 +18,7 @@
     "web-push": "^3.6.7"
   },
   "devDependencies": {
+    "@electric-sql/pglite": "0.5.8",
     "@types/node": "^20",
     "@types/react": "^19",
     "@types/react-dom": "^19",

```

### supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql

```text
diff --git a/supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql b/supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql
new file mode 100644
index 0000000..d72d25b
--- /dev/null
+++ b/supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql
@@ -0,0 +1,125 @@
+-- Relationship Identity v1 canonical persistence foundation.
+-- Migration is intentionally isolated from Relationship Engine canonical score/status tables.
+
+create table if not exists public.misaki_relationship_identity_state (
+  user_id uuid primary key references auth.users(id) on delete cascade,
+  primary_identity text not null default 'acquaintance'
+    check (primary_identity in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover')),
+  candidate_identity text
+    check (candidate_identity is null or candidate_identity in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover')),
+  candidate_confirmations smallint not null default 0 check (candidate_confirmations between 0 and 1),
+  candidate_source_version bigint,
+  constraint_state text not null default 'none'
+    check (constraint_state in ('none','post_breakup','post_rejection','boundary')),
+  constraint_anchor_version bigint,
+  pre_romantic_identity text
+    check (pre_romantic_identity is null or pre_romantic_identity in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person')),
+  identity_since timestamptz not null default clock_timestamp(),
+  identity_version bigint not null default 0,
+  resolver_version text not null,
+  source_relationship_state_version bigint not null default 0,
+  updated_at timestamptz not null default clock_timestamp()
+);
+alter table public.misaki_relationship_identity_state enable row level security;
+revoke all on table public.misaki_relationship_identity_state from public,anon,authenticated;
+grant select,insert,update on table public.misaki_relationship_identity_state to service_role;
+
+create table if not exists public.misaki_relationship_identity_transitions (
+  id bigint generated always as identity primary key,
+  user_id uuid not null references auth.users(id) on delete cascade,
+  source_relationship_state_version bigint not null,
+  resolver_version text not null,
+  from_identity text not null,
+  to_identity text not null,
+  transition_decision text not null check (transition_decision in ('maintain','promote','demote','lateral','canonical_override','hold')),
+  reason_code text not null,
+  before_state jsonb not null,
+  after_state jsonb not null,
+  created_at timestamptz not null default clock_timestamp(),
+  unique(user_id,source_relationship_state_version,resolver_version)
+);
+alter table public.misaki_relationship_identity_transitions enable row level security;
+revoke all on table public.misaki_relationship_identity_transitions from public,anon,authenticated;
+grant select,insert on table public.misaki_relationship_identity_transitions to service_role;
+
+create or replace function public.apply_misaki_relationship_identity_v1(
+ p_user_id uuid,
+ p_source_relationship_state_version bigint,
+ p_resolver_version text,
+ p_primary_identity text,
+ p_candidate_identity text,
+ p_candidate_confirmations integer,
+ p_candidate_source_version bigint,
+ p_constraint_state text,
+ p_constraint_anchor_version bigint,
+ p_pre_romantic_identity text,
+ p_transition_decision text,
+ p_reason_code text
+) returns jsonb language plpgsql security invoker set search_path='' as $$
+declare
+ v_relationship_version bigint; v_current public.misaki_relationship_identity_state%rowtype;
+ v_before jsonb; v_after jsonb; v_now timestamptz:=clock_timestamp();
+begin
+ if nullif(btrim(p_resolver_version),'') is null then raise exception 'resolver_version_required'; end if;
+ if nullif(btrim(p_reason_code),'') is null then raise exception 'identity_reason_required'; end if;
+ if p_primary_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_primary_identity'; end if;
+ if p_candidate_identity is not null and p_candidate_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_candidate_identity'; end if;
+ if p_candidate_confirmations not between 0 and 1 then raise exception 'invalid_candidate_confirmations'; end if;
+ if p_constraint_state not in ('none','post_breakup','post_rejection','boundary') then raise exception 'invalid_identity_constraint'; end if;
+ if p_pre_romantic_identity='lover' then raise exception 'invalid_pre_romantic_identity'; end if;
+ if p_transition_decision not in ('maintain','promote','demote','lateral','canonical_override','hold') then raise exception 'invalid_identity_decision'; end if;
+
+ select relationship_state_version into v_relationship_version
+ from public.misaki_relationship_state where user_id=p_user_id;
+ if v_relationship_version is null then raise exception 'canonical_relationship_state_required'; end if;
+ if v_relationship_version<>p_source_relationship_state_version then raise exception 'stale_relationship_state_version'; end if;
+
+ select * into v_current from public.misaki_relationship_identity_state where user_id=p_user_id for update;
+ if found then
+   if v_current.source_relationship_state_version>p_source_relationship_state_version then raise exception 'identity_source_regression'; end if;
+   if v_current.source_relationship_state_version=p_source_relationship_state_version and v_current.resolver_version=p_resolver_version then
+     return jsonb_build_object('replayed',true,'state',to_jsonb(v_current));
+   end if;
+   v_before:=to_jsonb(v_current);
+ else
+   v_before:='{}'::jsonb;
+ end if;
+
+ insert into public.misaki_relationship_identity_state(
+   user_id,primary_identity,candidate_identity,candidate_confirmations,candidate_source_version,
+   constraint_state,constraint_anchor_version,pre_romantic_identity,identity_since,identity_version,resolver_version,
+   source_relationship_state_version,updated_at
+ ) values(
+   p_user_id,p_primary_identity,p_candidate_identity,p_candidate_confirmations,p_candidate_source_version,
+   p_constraint_state,p_constraint_anchor_version,p_pre_romantic_identity,v_now,1,p_resolver_version,p_source_relationship_state_version,v_now
+ )
+ on conflict(user_id) do update set
+   primary_identity=excluded.primary_identity,
+   candidate_identity=excluded.candidate_identity,
+   candidate_confirmations=excluded.candidate_confirmations,
+   candidate_source_version=excluded.candidate_source_version,
+   constraint_state=excluded.constraint_state,
+   constraint_anchor_version=excluded.constraint_anchor_version,
+   pre_romantic_identity=excluded.pre_romantic_identity,
+   identity_since=case when misaki_relationship_identity_state.primary_identity<>excluded.primary_identity then v_now else misaki_relationship_identity_state.identity_since end,
+   identity_version=misaki_relationship_identity_state.identity_version+1,
+   resolver_version=excluded.resolver_version,
+   source_relationship_state_version=excluded.source_relationship_state_version,
+   updated_at=v_now
+ returning to_jsonb(misaki_relationship_identity_state.*) into v_after;
+
+ insert into public.misaki_relationship_identity_transitions(
+   user_id,source_relationship_state_version,resolver_version,from_identity,to_identity,
+   transition_decision,reason_code,before_state,after_state
+ ) values(
+   p_user_id,p_source_relationship_state_version,p_resolver_version,
+   coalesce(v_before->>'primary_identity',p_primary_identity),p_primary_identity,
+   p_transition_decision,p_reason_code,v_before,v_after
+ )
+ on conflict(user_id,source_relationship_state_version,resolver_version) do nothing;
+
+ return jsonb_build_object('replayed',false,'state',v_after);
+end $$;
+
+revoke execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,text,text,text) from public,anon,authenticated;
+grant execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,text,text,text) to service_role;

```

### supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql

```text
diff --git a/supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql b/supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql
new file mode 100644
index 0000000..fd9a471
--- /dev/null
+++ b/supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql
@@ -0,0 +1,89 @@
+-- Relationship Identity v1: atomic anonymous checkpoint import.
+-- Five-axis/status and Identity are materialized in one DB transaction.
+
+create or replace function public.import_misaki_temporary_relationship_v3(
+ p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
+ p_source_revision uuid,p_friendship integer,p_trust integer,p_playfulness integer,p_affection integer,p_romance integer,
+ p_relationship_status text,p_engine_version text,p_payload jsonb,
+ p_primary_identity text,p_candidate_identity text,p_candidate_confirmations integer,p_candidate_source_version bigint,
+ p_constraint_state text,p_constraint_anchor_version bigint,p_pre_romantic_identity text,p_resolver_version text
+) returns jsonb language plpgsql security invoker set search_path='' as $$
+declare
+ v_checkpoint_id bigint; v_existing jsonb; v_after jsonb; v_identity_before jsonb; v_identity_after jsonb; v_now timestamptz:=clock_timestamp();
+ v_source_version bigint;
+begin
+ if p_engine_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
+ perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
+ if p_friendship not between 0 and 100 or p_trust not between 0 and 100 or p_playfulness not between 0 and 100
+    or p_affection not between 0 and 100 or p_romance not between 0 and 100 then raise exception 'relationship_axis_out_of_bounds'; end if;
+ if p_relationship_status not in ('none','romantic_partner') then raise exception 'invalid_relationship_status'; end if;
+ if p_primary_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_primary_identity'; end if;
+ if p_candidate_identity is not null and p_candidate_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_candidate_identity'; end if;
+ if p_candidate_confirmations not between 0 and 1 then raise exception 'invalid_candidate_confirmations'; end if;
+ if p_constraint_state not in ('none','post_breakup','post_rejection','boundary') then raise exception 'invalid_identity_constraint'; end if;
+ if p_pre_romantic_identity='lover' then raise exception 'invalid_pre_romantic_identity'; end if;
+ if nullif(btrim(p_resolver_version),'') is null then raise exception 'resolver_version_required'; end if;
+
+ select relationship_payload into v_existing from public.misaki_relationship_temporary_v1_imports where user_id=p_user_id;
+ if found then
+   select to_jsonb(s) into v_identity_after from public.misaki_relationship_identity_state s where user_id=p_user_id;
+   if v_identity_after is null then raise exception 'temporary_import_identity_missing'; end if;
+   return jsonb_build_object('replayed',true,'payload',v_existing,'identity',v_identity_after);
+ end if;
+
+ select id into v_checkpoint_id from public.misaki_relationship_events
+ where user_id=p_user_id and event_type='email_save_checkpoint' order by id desc limit 1;
+ if v_checkpoint_id is null then raise exception 'email_save_checkpoint_required'; end if;
+
+ insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
+ perform 1 from public.misaki_relationship_state where user_id=p_user_id for update;
+ if exists(select 1 from public.misaki_relationship_state_applications where user_id=p_user_id) then raise exception 'v1_state_already_processed'; end if;
+
+ select to_jsonb(s) into v_identity_before from public.misaki_relationship_identity_state s where user_id=p_user_id for update;
+
+ update public.misaki_relationship_state set
+   friendship_score=p_friendship,trust_score=p_trust,playfulness_score=p_playfulness,affection_score=p_affection,romance_score=p_romance,
+   relationship_status=p_relationship_status,relationship_state_version=relationship_state_version+1,
+   relationship_engine_version=p_engine_version,state_updated_at=v_now
+ where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*),relationship_state_version into v_after,v_source_version;
+
+ insert into public.misaki_relationship_identity_state(
+   user_id,primary_identity,candidate_identity,candidate_confirmations,candidate_source_version,constraint_state,constraint_anchor_version,pre_romantic_identity,
+   identity_since,identity_version,resolver_version,source_relationship_state_version,updated_at
+ ) values(
+   p_user_id,p_primary_identity,
+   null,0,null,
+   p_constraint_state,case when p_constraint_state='none' then null else v_source_version end,p_pre_romantic_identity,
+   v_now,1,p_resolver_version,v_source_version,v_now
+ ) on conflict(user_id) do update set
+   primary_identity=excluded.primary_identity,candidate_identity=null,
+   candidate_confirmations=0,candidate_source_version=null,
+   constraint_state=excluded.constraint_state,constraint_anchor_version=excluded.constraint_anchor_version,pre_romantic_identity=excluded.pre_romantic_identity,
+   identity_since=case when misaki_relationship_identity_state.primary_identity<>excluded.primary_identity then v_now else misaki_relationship_identity_state.identity_since end,
+   identity_version=misaki_relationship_identity_state.identity_version+1,resolver_version=excluded.resolver_version,
+   source_relationship_state_version=excluded.source_relationship_state_version,updated_at=v_now
+ returning to_jsonb(misaki_relationship_identity_state.*) into v_identity_after;
+
+ insert into public.misaki_relationship_identity_transitions(
+   user_id,source_relationship_state_version,resolver_version,from_identity,to_identity,
+   transition_decision,reason_code,before_state,after_state
+ ) values(
+   p_user_id,v_source_version,p_resolver_version,
+   coalesce(v_identity_before->>'primary_identity',p_primary_identity),p_primary_identity,
+   'canonical_override','temporary_checkpoint_import',coalesce(v_identity_before,'{}'::jsonb),v_identity_after
+ ) on conflict(user_id,source_relationship_state_version,resolver_version) do nothing;
+
+ insert into public.misaki_relationship_temporary_v1_imports(user_id,checkpoint_event_id,source_revision,relationship_payload)
+ values(p_user_id,v_checkpoint_id,p_source_revision,coalesce(p_payload,'{}'::jsonb)||jsonb_build_object(
+   'friendship',p_friendship,'trust',p_trust,'playfulness',p_playfulness,'affection',p_affection,'romance',p_romance,
+   'relationship_status',p_relationship_status,'engine_version',p_engine_version,'identity',v_identity_after));
+
+ insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata)
+ values(p_user_id,'temporary_relationship_v1_imported',null,v_after,'atomic temporary relationship + identity import',
+   jsonb_build_object('checkpoint_event_id',v_checkpoint_id,'source_revision',p_source_revision,'engine_version',p_engine_version,'resolver_version',p_resolver_version));
+
+ return jsonb_build_object('replayed',false,'state',v_after,'identity',v_identity_after);
+end $$;
+
+revoke execute on function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,text,text) from public,anon,authenticated;
+grant execute on function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,text,text) to service_role;

```

### supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql

```text
diff --git a/supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql b/supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql
new file mode 100644
index 0000000..8c3c17c
--- /dev/null
+++ b/supabase/migrations/20261007114158_relationship_identity_v1_romance_reentry_provenance.sql
@@ -0,0 +1,101 @@
+-- Persist proof that romance was canonically rebuilt after a breakup/rejection constraint.
+-- This is Identity-layer provenance only; it does not mutate Relationship Engine scores/status.
+
+alter table public.misaki_relationship_identity_state
+  add column if not exists romance_reentry_version bigint;
+
+create or replace function public.apply_misaki_relationship_identity_v1(
+ p_user_id uuid,
+ p_source_relationship_state_version bigint,
+ p_resolver_version text,
+ p_primary_identity text,
+ p_candidate_identity text,
+ p_candidate_confirmations integer,
+ p_candidate_source_version bigint,
+ p_constraint_state text,
+ p_constraint_anchor_version bigint,
+ p_romance_reentry_version bigint,
+ p_pre_romantic_identity text,
+ p_transition_decision text,
+ p_reason_code text
+) returns jsonb language plpgsql security invoker set search_path='' as $$
+declare
+ v_relationship_version bigint; v_current public.misaki_relationship_identity_state%rowtype;
+ v_before jsonb; v_after jsonb; v_now timestamptz:=clock_timestamp();
+begin
+ if nullif(btrim(p_resolver_version),'') is null then raise exception 'resolver_version_required'; end if;
+ if nullif(btrim(p_reason_code),'') is null then raise exception 'identity_reason_required'; end if;
+ if p_primary_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_primary_identity'; end if;
+ if p_candidate_identity is not null and p_candidate_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_candidate_identity'; end if;
+ if p_candidate_confirmations not between 0 and 1 then raise exception 'invalid_candidate_confirmations'; end if;
+ if p_constraint_state not in ('none','post_breakup','post_rejection','boundary') then raise exception 'invalid_identity_constraint'; end if;
+ if p_constraint_state in ('none','boundary') and p_romance_reentry_version is not null then raise exception 'invalid_romance_reentry_constraint'; end if;
+ if p_romance_reentry_version is not null and (p_constraint_anchor_version is null or p_romance_reentry_version<p_constraint_anchor_version or p_romance_reentry_version>p_source_relationship_state_version) then raise exception 'invalid_romance_reentry_version'; end if;
+ if p_pre_romantic_identity='lover' then raise exception 'invalid_pre_romantic_identity'; end if;
+ if p_transition_decision not in ('maintain','promote','demote','lateral','canonical_override','hold') then raise exception 'invalid_identity_decision'; end if;
+
+ select relationship_state_version into v_relationship_version
+ from public.misaki_relationship_state where user_id=p_user_id for update;
+ if v_relationship_version is null then raise exception 'canonical_relationship_state_required'; end if;
+ if v_relationship_version<>p_source_relationship_state_version then raise exception 'stale_relationship_state_version'; end if;
+
+ select * into v_current from public.misaki_relationship_identity_state where user_id=p_user_id for update;
+ -- Imported checkpoint provenance maps both anchor and proof to the first permanent version.
+ -- Equal versions are valid only when preserving that already-canonical fact, never for fresh proof.
+ if p_romance_reentry_version is not null and p_romance_reentry_version=p_constraint_anchor_version
+    and not (v_current.romance_reentry_version is not distinct from p_romance_reentry_version
+      and v_current.constraint_anchor_version is not distinct from p_constraint_anchor_version
+      and v_current.constraint_state is not distinct from p_constraint_state) then
+   raise exception 'invalid_romance_reentry_version';
+ end if;
+ if v_current.user_id is not null then
+   if v_current.source_relationship_state_version>p_source_relationship_state_version then raise exception 'identity_source_regression'; end if;
+   if v_current.source_relationship_state_version=p_source_relationship_state_version and v_current.resolver_version=p_resolver_version then
+     return jsonb_build_object('replayed',true,'state',to_jsonb(v_current));
+   end if;
+   v_before:=to_jsonb(v_current);
+ else
+   v_before:='{}'::jsonb;
+ end if;
+
+ insert into public.misaki_relationship_identity_state(
+   user_id,primary_identity,candidate_identity,candidate_confirmations,candidate_source_version,
+   constraint_state,constraint_anchor_version,romance_reentry_version,pre_romantic_identity,identity_since,identity_version,resolver_version,
+   source_relationship_state_version,updated_at
+ ) values(
+   p_user_id,p_primary_identity,p_candidate_identity,p_candidate_confirmations,p_candidate_source_version,
+   p_constraint_state,p_constraint_anchor_version,p_romance_reentry_version,p_pre_romantic_identity,v_now,1,p_resolver_version,p_source_relationship_state_version,v_now
+ )
+ on conflict(user_id) do update set
+   primary_identity=excluded.primary_identity,
+   candidate_identity=excluded.candidate_identity,
+   candidate_confirmations=excluded.candidate_confirmations,
+   candidate_source_version=excluded.candidate_source_version,
+   constraint_state=excluded.constraint_state,
+   constraint_anchor_version=excluded.constraint_anchor_version,
+   romance_reentry_version=excluded.romance_reentry_version,
+   pre_romantic_identity=excluded.pre_romantic_identity,
+   identity_since=case when misaki_relationship_identity_state.primary_identity<>excluded.primary_identity then v_now else misaki_relationship_identity_state.identity_since end,
+   identity_version=misaki_relationship_identity_state.identity_version+1,
+   resolver_version=excluded.resolver_version,
+   source_relationship_state_version=excluded.source_relationship_state_version,
+   updated_at=v_now
+ returning to_jsonb(misaki_relationship_identity_state.*) into v_after;
+
+ insert into public.misaki_relationship_identity_transitions(
+   user_id,source_relationship_state_version,resolver_version,from_identity,to_identity,
+   transition_decision,reason_code,before_state,after_state
+ ) values(
+   p_user_id,p_source_relationship_state_version,p_resolver_version,
+   coalesce(v_before->>'primary_identity',p_primary_identity),p_primary_identity,
+   p_transition_decision,p_reason_code,v_before,v_after
+ )
+ on conflict(user_id,source_relationship_state_version,resolver_version) do nothing;
+
+ return jsonb_build_object('replayed',false,'state',v_after);
+end $$;
+
+revoke execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,text,text,text) from public,anon,authenticated,service_role;
+drop function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,text,text,text);
+revoke execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,bigint,text,text,text) from public,anon,authenticated;
+grant execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,bigint,text,text,text) to service_role;

```

### supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql

```text
diff --git a/supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql b/supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql
new file mode 100644
index 0000000..ca8f6b9
--- /dev/null
+++ b/supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql
@@ -0,0 +1,95 @@
+-- Requires 20261007083000: map anonymous provenance as a fact, never an anonymous version.
+-- Relationship Identity v1: atomic anonymous checkpoint import.
+-- Five-axis/status and Identity are materialized in one DB transaction.
+
+create or replace function public.import_misaki_temporary_relationship_v3(
+ p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
+ p_source_revision uuid,p_friendship integer,p_trust integer,p_playfulness integer,p_affection integer,p_romance integer,
+ p_relationship_status text,p_engine_version text,p_payload jsonb,
+ p_primary_identity text,p_candidate_identity text,p_candidate_confirmations integer,p_candidate_source_version bigint,
+ p_constraint_state text,p_constraint_anchor_version bigint,p_romance_reentry_established boolean,p_pre_romantic_identity text,p_resolver_version text
+) returns jsonb language plpgsql security invoker set search_path='' as $$
+declare
+ v_checkpoint_id bigint; v_existing jsonb; v_after jsonb; v_identity_before jsonb; v_identity_after jsonb; v_now timestamptz:=clock_timestamp();
+ v_source_version bigint;
+begin
+ if p_engine_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
+ perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
+ if p_friendship not between 0 and 100 or p_trust not between 0 and 100 or p_playfulness not between 0 and 100
+    or p_affection not between 0 and 100 or p_romance not between 0 and 100 then raise exception 'relationship_axis_out_of_bounds'; end if;
+ if p_relationship_status not in ('none','romantic_partner') then raise exception 'invalid_relationship_status'; end if;
+ if p_primary_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_primary_identity'; end if;
+ if p_candidate_identity is not null and p_candidate_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_candidate_identity'; end if;
+ if p_candidate_confirmations not between 0 and 1 then raise exception 'invalid_candidate_confirmations'; end if;
+ if p_constraint_state not in ('none','post_breakup','post_rejection','boundary') then raise exception 'invalid_identity_constraint'; end if;
+ if p_pre_romantic_identity='lover' then raise exception 'invalid_pre_romantic_identity'; end if;
+ if nullif(btrim(p_resolver_version),'') is null then raise exception 'resolver_version_required'; end if;
+
+ select relationship_payload into v_existing from public.misaki_relationship_temporary_v1_imports where user_id=p_user_id;
+ if found then
+   select to_jsonb(s) into v_identity_after from public.misaki_relationship_identity_state s where user_id=p_user_id;
+   if v_identity_after is null then raise exception 'temporary_import_identity_missing'; end if;
+   return jsonb_build_object('replayed',true,'payload',v_existing,'identity',v_identity_after);
+ end if;
+
+ select id into v_checkpoint_id from public.misaki_relationship_events
+ where user_id=p_user_id and event_type='email_save_checkpoint' order by id desc limit 1;
+ if v_checkpoint_id is null then raise exception 'email_save_checkpoint_required'; end if;
+
+ insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
+ perform 1 from public.misaki_relationship_state where user_id=p_user_id for update;
+ if exists(select 1 from public.misaki_relationship_state_applications where user_id=p_user_id) then raise exception 'v1_state_already_processed'; end if;
+
+ select to_jsonb(s) into v_identity_before from public.misaki_relationship_identity_state s where user_id=p_user_id for update;
+
+ update public.misaki_relationship_state set
+   friendship_score=p_friendship,trust_score=p_trust,playfulness_score=p_playfulness,affection_score=p_affection,romance_score=p_romance,
+   relationship_status=p_relationship_status,relationship_state_version=relationship_state_version+1,
+   relationship_engine_version=p_engine_version,state_updated_at=v_now
+ where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*),relationship_state_version into v_after,v_source_version;
+
+ insert into public.misaki_relationship_identity_state(
+   user_id,primary_identity,candidate_identity,candidate_confirmations,candidate_source_version,constraint_state,constraint_anchor_version,romance_reentry_version,pre_romantic_identity,
+   identity_since,identity_version,resolver_version,source_relationship_state_version,updated_at
+ ) values(
+   p_user_id,p_primary_identity,
+   null,0,null,
+   p_constraint_state,case when p_constraint_state='none' then null else v_source_version end,
+   case when p_constraint_state in ('post_breakup','post_rejection') and coalesce(p_romance_reentry_established,false) then v_source_version else null end,p_pre_romantic_identity,
+   v_now,1,p_resolver_version,v_source_version,v_now
+ ) on conflict(user_id) do update set
+   primary_identity=excluded.primary_identity,candidate_identity=null,
+   candidate_confirmations=0,candidate_source_version=null,
+   constraint_state=excluded.constraint_state,constraint_anchor_version=excluded.constraint_anchor_version,romance_reentry_version=excluded.romance_reentry_version,pre_romantic_identity=excluded.pre_romantic_identity,
+   identity_since=case when misaki_relationship_identity_state.primary_identity<>excluded.primary_identity then v_now else misaki_relationship_identity_state.identity_since end,
+   identity_version=misaki_relationship_identity_state.identity_version+1,resolver_version=excluded.resolver_version,
+   source_relationship_state_version=excluded.source_relationship_state_version,updated_at=v_now
+ returning to_jsonb(misaki_relationship_identity_state.*) into v_identity_after;
+
+ insert into public.misaki_relationship_identity_transitions(
+   user_id,source_relationship_state_version,resolver_version,from_identity,to_identity,
+   transition_decision,reason_code,before_state,after_state
+ ) values(
+   p_user_id,v_source_version,p_resolver_version,
+   coalesce(v_identity_before->>'primary_identity',p_primary_identity),p_primary_identity,
+   'canonical_override','temporary_checkpoint_import',coalesce(v_identity_before,'{}'::jsonb),v_identity_after
+ ) on conflict(user_id,source_relationship_state_version,resolver_version) do nothing;
+
+ insert into public.misaki_relationship_temporary_v1_imports(user_id,checkpoint_event_id,source_revision,relationship_payload)
+ values(p_user_id,v_checkpoint_id,p_source_revision,coalesce(p_payload,'{}'::jsonb)||jsonb_build_object(
+   'friendship',p_friendship,'trust',p_trust,'playfulness',p_playfulness,'affection',p_affection,'romance',p_romance,
+   'relationship_status',p_relationship_status,'engine_version',p_engine_version,'identity',v_identity_after));
+
+ insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata)
+ values(p_user_id,'temporary_relationship_v1_imported',null,v_after,'atomic temporary relationship + identity import',
+   jsonb_build_object('checkpoint_event_id',v_checkpoint_id,'source_revision',p_source_revision,'engine_version',p_engine_version,'resolver_version',p_resolver_version));
+
+ return jsonb_build_object('replayed',false,'state',v_after,'identity',v_identity_after);
+end $$;
+
+revoke execute on function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,boolean,text,text) from public,anon,authenticated;
+grant execute on function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,boolean,text,text) to service_role;
+
+-- Retire the pre-provenance overload after the replacement exists.
+revoke execute on function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,text,text) from public,anon,authenticated,service_role;
+drop function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,text,text);

```

### tests/context-overlap-analysis.test.ts

```text
diff --git a/tests/context-overlap-analysis.test.ts b/tests/context-overlap-analysis.test.ts
new file mode 100644
index 0000000..6072184
--- /dev/null
+++ b/tests/context-overlap-analysis.test.ts
@@ -0,0 +1,24 @@
+import assert from "node:assert/strict";
+import test from "node:test";
+import { analyzePromptSectionOverlap, countRepeatedRepliesInHistory } from "../lib/context-overlap-analysis.ts";
+
+test("counts identical sections without exposing their contents", () => {
+  assert.deepEqual(analyzePromptSectionOverlap("abc\nabc\nxyz", [
+    { name: "duplicate", text: "abc" },
+    { name: "unique", text: "xyz" },
+    { name: "empty", text: "" },
+  ]), [
+    { name: "duplicate", chars: 3, occurrences: 2, extraRepeatedChars: 3 },
+    { name: "unique", chars: 3, occurrences: 1, extraRepeatedChars: 0 },
+    { name: "empty", chars: 0, occurrences: 0, extraRepeatedChars: 0 },
+  ]);
+});
+test("detects recent model replies repeated in history", () => {
+  const result = countRepeatedRepliesInHistory([
+    { role: "user", parts: [{ text: "hello" }] },
+    { role: "model", parts: [{ text: "reply A" }] },
+    { role: "model", parts: [{ text: "reply B" }] },
+  ], ["reply A", "reply B", "other"]);
+  assert.deepEqual(result, { recentReplies: 3, duplicatedReplies: 2 });
+  assert.equal(JSON.stringify(result).includes("reply A"), false);
+});

```

### tests/context-size-measurement.test.ts

```text
diff --git a/tests/context-size-measurement.test.ts b/tests/context-size-measurement.test.ts
new file mode 100644
index 0000000..338b8e2
--- /dev/null
+++ b/tests/context-size-measurement.test.ts
@@ -0,0 +1,28 @@
+import assert from "node:assert/strict";
+import test from "node:test";
+import { contextSizeMeasurementEnabled, measureContextSize } from "../lib/context-size-measurement.ts";
+
+test("disabled by default and only explicitly enabled", () => {
+  assert.equal(contextSizeMeasurementEnabled(undefined), false);
+  assert.equal(contextSizeMeasurementEnabled("true"), false);
+  assert.equal(contextSizeMeasurementEnabled("1"), true);
+});
+test("counts UTF-16 characters and messages without exposing text", () => {
+  const result = measureContextSize({
+    systemInstruction: "persona\nsecret",
+    history: [{ parts: [{ text: "こんにちは" }] }, { parts: [{ text: "😊" }] }],
+    userText: "今",
+    persona: "persona",
+    relationshipGuides: ["rel"],
+    longTermMemory: "secret",
+    todayMemory: "",
+    repeatedReplies: "reply",
+    environmentGuides: ["weather"],
+  });
+  assert.equal(result.historyMessages, 2);
+  assert.equal(result.historyChars, 7); // five Japanese characters + emoji surrogate pair
+  assert.equal(result.dynamicComponentChars.longTermMemory, 6);
+  assert.equal(result.systemInstructionChars, 14);
+  assert.equal(result.unit, "utf16_chars");
+  assert.equal(JSON.stringify(result).includes("secret"), false);
+});

```

### tests/fixtures/relationship-identity-baseline.sql

```text
diff --git a/tests/fixtures/relationship-identity-baseline.sql b/tests/fixtures/relationship-identity-baseline.sql
new file mode 100644
index 0000000..58bf3a8
--- /dev/null
+++ b/tests/fixtures/relationship-identity-baseline.sql
@@ -0,0 +1,13 @@
+-- Isolated empty-DB prerequisites. No Production data or credentials.
+-- Legacy Supabase foundation migrations are not fully present in this repository.
+-- Relationship schema/Engine/Identity DDL is loaded unmodified from tracked migrations.
+create role anon;
+create role authenticated;
+create role service_role bypassrls;
+create schema auth;
+grant usage on schema public,auth to anon,authenticated,service_role;
+create table auth.users(id uuid primary key);
+create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
+create function auth.jwt() returns jsonb language sql as $$ select '{}'::jsonb $$;
+create table public.conversations(id bigint primary key);
+create table public.misaki_proactive_deliveries(id uuid primary key);

```

### tests/relationship-identity-anonymous-runtime.test.ts

```text
diff --git a/tests/relationship-identity-anonymous-runtime.test.ts b/tests/relationship-identity-anonymous-runtime.test.ts
new file mode 100644
index 0000000..5ace5f7
--- /dev/null
+++ b/tests/relationship-identity-anonymous-runtime.test.ts
@@ -0,0 +1,64 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import fs from "node:fs";
+
+const runtime=fs.readFileSync(new URL("../lib/relationship-runtime-v1.ts",import.meta.url),"utf8");
+
+test("anonymous identity resolves after a critical-only canonical version change",()=>{
+  assert.match(runtime,/const turnStartVersion = snapshot\.version;/);
+  assert.match(runtime,/if \(identityEnabled\(\) && snapshot\.version !== turnStartVersion\)/);
+  assert.match(runtime,/latestCritical = snapshot\.criticalEvents\?\.filter\(e => e\.request_id === turn\.requestId\)\.at\(-1\)\?\.event_type/);
+  assert.match(runtime,/relationshipStateVersion: snapshot\.version/);
+  assert.match(runtime,/current: snapshot\.identity/);
+});
+
+test("anonymous critical identity resolution is not conditional on a Pattern result",()=>{
+  const applyIndex=runtime.indexOf("snapshot = applyTemporaryEvidence(snapshot, turn, evidence);");
+  const identityIndex=runtime.indexOf("if (identityEnabled() && snapshot.version !== turnStartVersion)");
+  assert.ok(applyIndex>=0&&identityIndex>applyIndex);
+  const between=runtime.slice(applyIndex,identityIndex);
+  assert.doesNotMatch(between,/appliedPatterns|Pattern|pattern/);
+});
+
+test("identity feature gate keeps permanent worker and anonymous resolver off",()=>{
+  assert.match(runtime,/if \(identityEnabled\(\)\) await processPermanentIdentity\(userId\);/);
+  assert.match(runtime,/if \(identityEnabled\(\) && snapshot\.version !== turnStartVersion\)/);
+});
+
+test("identity feature gate off preserves legacy v2 temporary import",()=>{
+  const gate=runtime.indexOf("if (!identityEnabled()) {");
+  const v2=runtime.indexOf('db.rpc("import_misaki_temporary_relationship_v2"',gate);
+  const returnIndex=runtime.indexOf("return;",v2);
+  const v3=runtime.indexOf('db.rpc("import_misaki_temporary_relationship_v3"',gate);
+  assert.ok(gate>=0&&v2>gate&&returnIndex>v2&&v3>returnIndex);
+});
+
+
+test("permanent identity worker carries romance reentry provenance end to end",()=>{
+  const start=runtime.indexOf("async function processPermanentIdentity");
+  assert.ok(start>=0);
+  const worker=runtime.slice(start);
+  assert.match(worker,/romanceReentryVersion:saved\.romance_reentry_version == null \? null : Number\(saved\.romance_reentry_version\)/);
+  assert.match(worker,/hasNewRomancePattern=false/);
+  assert.match(worker,/romance_delta/);
+  assert.match(worker,/hasNewRomancePattern=Number\(application\?\.after_state\?\.relationship_state_version\)[\s\S]*Number\(application\?\.romance_delta \?\? 0\)>0/);
+  assert.match(worker,/current,criticalEvent,hasNewRomancePattern/);
+  assert.match(worker,/p_romance_reentry_version:resolved\.romanceReentryVersion/);
+});
+
+test("anonymous identity snapshot persists romance reentry provenance",()=>{
+  const start=runtime.indexOf("async function analyzeTemporarySnapshot");
+  const end=runtime.indexOf("async function runAnonymous",start);
+  const anonymous=runtime.slice(start,end);
+  assert.match(anonymous,/const hasFreshRomanceProvenance=snapshot\.version>preEvidenceVersion && snapshot\.state\.romance>preEvidenceRomance/);
+  assert.match(anonymous,/hasNewRomancePattern:hasFreshRomanceProvenance/);
+  assert.match(anonymous,/romanceReentryVersion: resolved\.romanceReentryVersion/);
+});
+
+
+test("romance provenance application is selected by canonical source version, not timestamp row order",()=>{
+ assert.match(runtime,/\.eq\("after_state->>relationship_state_version",String\(relationship\.relationship_state_version\)\)/);
+ const start=runtime.indexOf('select("romance_delta,after_state")');
+ const end=runtime.indexOf('if(applicationError)',start);
+ assert.doesNotMatch(runtime.slice(start,end),/order\("created_at"/);
+});

```

### tests/relationship-identity-audit.test.ts

```text
diff --git a/tests/relationship-identity-audit.test.ts b/tests/relationship-identity-audit.test.ts
new file mode 100644
index 0000000..4322203
--- /dev/null
+++ b/tests/relationship-identity-audit.test.ts
@@ -0,0 +1,97 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import fs from "node:fs";
+import ts from "typescript";
+import { RELATIONSHIP_IDENTITIES, resolveRelationshipIdentity, type IdentityInput } from "../lib/relationship-identity-resolver.ts";
+import { applyTemporaryEvidence, type Snapshot, type Evidence, type Turn } from "../lib/relationship-engine-v1.ts";
+
+const source=fs.readFileSync(new URL("../lib/relationship-identity-resolver.ts",import.meta.url),"utf8");
+// Test-only instrumentation: keep private geometry out of the production resolver API.
+async function instrument(reorder=false){
+ const insertion=reorder?"const reversed=Object.entries(centers).reverse(); for(const k of Object.keys(centers)) delete centers[k]; Object.assign(centers,Object.fromEntries(reversed)); for(const k of Object.keys(neighbors)) neighbors[k]=[...neighbors[k]].reverse();":"";
+ const js=ts.transpileModule(source+"\n"+insertion+"\nexport {centers,neighbors,gates,adjacentTarget,candidate,distance,uniqueClosest};",{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
+ return import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
+}
+const shape=(values:number[])=>({friendship:values[0],trust:values[1],playfulness:values[2],affection:values[3],romance:values[4],relationshipStatus:"none" as const});
+
+test("all 11 identities: geometry, constraints, provenance, overrides and hysteresis are declaration-order invariant",async()=>{
+ const normal=await instrument(),reversed=await instrument(true);
+ // Confirm that this is a real permutation, not a duplicate module/cache entry.
+ assert.deepEqual(Object.keys(reversed.centers),Object.keys(normal.centers).reverse());
+ for(const id of Object.keys(normal.neighbors)) assert.deepEqual(reversed.neighbors[id],[...normal.neighbors[id]].reverse());
+ let cases=0;
+ for(const primaryIdentity of RELATIONSHIP_IDENTITIES){
+  for(const values of [...Object.values(normal.centers),[25,15,20,20,100],[90,95,50,90,55]] as number[][]){
+   for(const constraint of ["none","post_breakup","post_rejection","boundary"] as const){
+    for(const proof of [null,11]){
+     for(const criticalEvent of [null,"romantic_acceptance","relationship_end","romantic_rejection","boundary_event","reconciliation"] as const){
+      const input:IdentityInput={state:shape(values),relationshipStateVersion:12,current:{primaryIdentity,constraint,constraintAnchorVersion:constraint==="none"?null:10,romanceReentryVersion:constraint==="post_breakup"||constraint==="post_rejection"?proof:null,preRomanticIdentity:"friend"},criticalEvent,hasNewRomancePattern:proof!==null};
+      const a=normal.resolveRelationshipIdentity(input),b=reversed.resolveRelationshipIdentity(input);
+      assert.deepEqual(a,b,JSON.stringify(input));
+      assert.ok(RELATIONSHIP_IDENTITIES.includes(a.primaryIdentity));
+      assert.equal(a.primaryIdentity==="lover",criticalEvent==="romantic_acceptance"||(primaryIdentity==="lover"&&criticalEvent!=="relationship_end"));
+      if(["relationship_end","romantic_rejection","boundary_event"].includes(criticalEvent??"")) assert.equal(a.romanceReentryVersion,null);
+      if(a.constraint==="boundary") assert.ok(!["person_of_interest","special_person"].includes(a.candidateIdentity??""));
+      const replay=normal.resolveRelationshipIdentity({...input,current:a,criticalEvent:null,hasNewRomancePattern:false});
+      if(a.candidateIdentity) assert.equal(replay.candidateConfirmations,1);
+      cases++;
+     }
+    }
+   }
+  }
+ }
+ assert.equal(cases,6336);
+});
+
+test("exact candidate tie refuses classification and keeps current identity; adjacency ranks real non-adjacent targets by five-axis distance",async()=>{
+ const m=await instrument();
+ const tied=shape([22.5,15,12.5,15,0]);
+ assert.equal(m.candidate(tied,"none"),null);
+ assert.equal(resolveRelationshipIdentity({state:tied,relationshipStateVersion:1,current:{primaryIdentity:"friend"}}).primaryIdentity,"friend");
+ assert.equal(m.uniqueClosest([["friend",.1],["important_person",.1]]),null);
+ let exercised=0;
+ const shapes=Object.values(m.centers) as number[][];
+ for(const current of Object.keys(m.neighbors)){
+  for(const left of shapes) for(const right of shapes){
+   const s=shape(left.map((v,i)=>(v+right[i])/2)),target=m.candidate(s,"none");
+   if(!target||target===current||m.neighbors[current].includes(target)) continue;
+   const supported=m.neighbors[current].filter((id:string)=>m.gates[id](s));
+   const ranked=supported.map((id:string)=>[id,m.distance(s,m.centers[id])]).sort((a:any,b:any)=>a[1]-b[1]);
+   if(ranked.length<2||Math.abs(ranked[0][1]-ranked[1][1])<=1e-12) continue;
+   assert.equal(m.adjacentTarget(current,target,s),ranked[0][0]);
+   if(supported[0]!==ranked[0][0]) exercised++;
+  }
+ }
+ assert.ok(exercised>0);
+});
+
+test("all ten score identities maintain their canonical center under small perturbations; lover requires canonical status",async()=>{
+ const m=await instrument();
+ for(const [primaryIdentity,values] of Object.entries(m.centers) as [any,number[]][]){
+  for(const change of [-1,0,1]){
+   const r=resolveRelationshipIdentity({state:shape(values.map(v=>Math.max(0,v+change))),relationshipStateVersion:20,current:{primaryIdentity}});
+   assert.equal(r.primaryIdentity,primaryIdentity);
+   assert.equal(r.candidateIdentity,null);
+  }
+ }
+ for(const values of Object.values(m.centers) as number[][]){
+  const s={...shape(values),relationshipStatus:"romantic_partner" as const};
+  assert.equal(resolveRelationshipIdentity({state:s,relationshipStateVersion:20,current:{primaryIdentity:"lover"}}).primaryIdentity,"lover");
+ }
+});
+
+test("actual positive three-day romance Pattern opens provenance; non-romance update preserves it; replay cannot confirm",()=>{
+ const turn=(day:number):Turn=>({requestId:`romance-${day}`,message:"fixture",reply:"fixture",savedAt:`2026-10-0${day}T01:00:00Z`});
+ const evidence:Evidence={axis:"romance",type:"care",polarity:1,strength:70,confidence:1,interpretation:"direct",subject:"user_to_misaki",supportingTurn:"fixture"};
+ let snapshot:Snapshot={state:{...shape([78,82,50,85,72]),intimacyStage:4},version:10,episodes:[],appliedPatterns:[],processed:[],pending:[]};
+ for(const day of [1,2]) snapshot=applyTemporaryEvidence(snapshot,turn(day),[evidence]);
+ assert.equal(snapshot.version,10);
+ const before=snapshot;
+ snapshot=applyTemporaryEvidence(snapshot,turn(3),[evidence]);
+ assert.equal(snapshot.version,11); assert.ok(snapshot.state.romance>before.state.romance);
+ const first=resolveRelationshipIdentity({state:snapshot.state,relationshipStateVersion:snapshot.version,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:10},hasNewRomancePattern:snapshot.version>before.version&&snapshot.state.romance>before.state.romance});
+ assert.equal(first.romanceReentryVersion,11);
+ assert.equal(resolveRelationshipIdentity({state:snapshot.state,relationshipStateVersion:11,current:first}).candidateConfirmations,1);
+ const second=resolveRelationshipIdentity({state:snapshot.state,relationshipStateVersion:12,current:first,hasNewRomancePattern:false});
+ assert.equal(second.romanceReentryVersion,11); assert.equal(second.primaryIdentity,"special_person");
+});

```

### tests/relationship-identity-persistence.test.ts

```text
diff --git a/tests/relationship-identity-persistence.test.ts b/tests/relationship-identity-persistence.test.ts
new file mode 100644
index 0000000..a07918a
--- /dev/null
+++ b/tests/relationship-identity-persistence.test.ts
@@ -0,0 +1,61 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import fs from "node:fs";
+
+const sql=fs.readFileSync(new URL("../supabase/migrations/20261007114143_relationship_identity_v1_canonical.sql",import.meta.url),"utf8");
+
+test("identity persistence is isolated from five-axis canonical mutations",()=>{
+  assert.match(sql,/create table if not exists public\.misaki_relationship_identity_state/);
+  assert.doesNotMatch(sql,/set\s+friendship_score\s*=/i);
+  assert.doesNotMatch(sql,/set\s+relationship_status\s*=/i);
+});
+test("identity apply rejects stale relationship state",()=>{
+  assert.match(sql,/v_relationship_version<>p_source_relationship_state_version/);
+  assert.match(sql,/stale_relationship_state_version/);
+});
+test("identity apply is replay-safe by source version and resolver version",()=>{
+  assert.match(sql,/unique\(user_id,source_relationship_state_version,resolver_version\)/);
+  assert.match(sql,/return jsonb_build_object\('replayed',true/);
+});
+test("candidate confirmation cannot be persisted as already-complete",()=>{
+  assert.match(sql,/candidate_confirmations between 0 and 1/);
+  assert.match(sql,/p_candidate_confirmations not between 0 and 1/);
+});
+test("pre-romantic identity can never be lover",()=>{
+  assert.match(sql,/p_pre_romantic_identity='lover'/);
+  assert.match(sql,/invalid_pre_romantic_identity/);
+});
+test("tables and RPC are not callable by browser roles",()=>{
+  assert.match(sql,/revoke all on table public\.misaki_relationship_identity_state from public,anon,authenticated/);
+  assert.match(sql,/revoke execute on function public\.apply_misaki_relationship_identity_v1[\s\S]*from public,anon,authenticated/);
+});
+
+test("temporary identity import resets anonymous candidate versions and remaps active constraint anchor",()=>{
+ const sql=fs.readFileSync(new URL("../supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql",import.meta.url),"utf8");
+ assert.match(sql,/null,0,null,[\s\n]*p_constraint_state,case when p_constraint_state='none' then null else v_source_version end/);
+ assert.match(sql,/candidate_identity=null,[\s\n]*candidate_confirmations=0,candidate_source_version=null/);
+});
+
+test("temporary identity import records an immutable canonical transition",()=>{
+ const sql=fs.readFileSync(new URL("../supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql",import.meta.url),"utf8");
+ assert.match(sql,/insert into public\.misaki_relationship_identity_transitions/);
+ assert.match(sql,/'canonical_override','temporary_checkpoint_import'/);
+ assert.match(sql,/coalesce\(v_identity_before,'\{\}'::jsonb\),v_identity_after/);
+});
+
+
+test("temporary identity import maps romance reentry fact into permanent version namespace",()=>{
+ const importSql=fs.readFileSync(new URL("../supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql",import.meta.url),"utf8");
+ const runtime=fs.readFileSync(new URL("../lib/relationship-runtime-v1.ts",import.meta.url),"utf8");
+ assert.match(runtime,/p_romance_reentry_established:\s*identity\.romanceReentryVersion\s*!=\s*null/);
+ assert.doesNotMatch(runtime,/p_romance_reentry_version:\s*identity\.romanceReentryVersion/);
+ assert.match(importSql,/p_romance_reentry_established boolean/);
+ assert.match(importSql,/p_constraint_state in \('post_breakup','post_rejection'\)[\s\S]*p_romance_reentry_established,false\)[\s\S]*then v_source_version else null end/);
+ assert.doesNotMatch(importSql,/romance_reentry_version[^\n]*p_constraint_anchor_version/);
+});
+
+test("temporary identity import never restores romance reentry under boundary",()=>{
+ const importSql=fs.readFileSync(new URL("../supabase/migrations/20261007114201_relationship_identity_v1_temporary_import_romance_provenance.sql",import.meta.url),"utf8");
+ assert.match(importSql,/p_constraint_state in \('post_breakup','post_rejection'\)/);
+ assert.doesNotMatch(importSql,/p_constraint_state in \([^\n]*'boundary'[^\n]*\)[^\n]*p_romance_reentry_established/);
+});

```

### tests/relationship-identity-resolver.test.ts

```text
diff --git a/tests/relationship-identity-resolver.test.ts b/tests/relationship-identity-resolver.test.ts
new file mode 100644
index 0000000..b928570
--- /dev/null
+++ b/tests/relationship-identity-resolver.test.ts
@@ -0,0 +1,133 @@
+import test from "node:test"; import assert from "node:assert/strict";
+import {resolveRelationshipIdentity,type IdentityState} from "../lib/relationship-identity-resolver.ts";
+const state=(friendship:number,trust:number,playfulness:number,affection:number,romance:number,relationshipStatus:"none"|"romantic_partner"="none")=>({friendship,trust,playfulness,affection,romance,relationshipStatus});
+function twice(s:ReturnType<typeof state>,current:IdentityState={primaryIdentity:"friend",candidateIdentity:null,candidateConfirmations:0,constraint:"none"}){
+ const a=resolveRelationshipIdentity({state:s,relationshipStateVersion:1,current}); return [a,resolveRelationshipIdentity({state:s,relationshipStateVersion:2,current:{primaryIdentity:a.primaryIdentity,candidateIdentity:a.candidateIdentity,candidateConfirmations:a.candidateConfirmations,candidateSourceVersion:a.candidateSourceVersion,constraint:a.constraint,preRomanticIdentity:a.preRomanticIdentity}})] as const;
+}
+test("same depth can settle into different identities after two canonical confirmations",()=>{
+ assert.equal(twice(state(90,82,92,60,5))[1].primaryIdentity,"partner_in_crime");
+ assert.equal(twice(state(90,95,50,85,5))[1].primaryIdentity,"best_friend");
+ assert.equal(twice(state(75,90,35,95,10))[1].primaryIdentity,"important_person");
+});
+test("best friend with mild romance keeps identity and gains awareness",()=>{
+ const r=resolveRelationshipIdentity({state:state(90,95,50,90,55),relationshipStateVersion:1,current:{primaryIdentity:"best_friend",constraint:"none"}});
+ assert.equal(r.primaryIdentity,"best_friend"); assert.ok(r.traits.includes("romantic_awareness"));
+});
+test("romance alone cannot manufacture romantic identity",()=>{
+ const r=resolveRelationshipIdentity({state:state(25,15,20,20,100),relationshipStateVersion:1,current:{primaryIdentity:"conversation_partner",constraint:"none"}});
+ assert.equal(r.primaryIdentity,"conversation_partner"); assert.equal(r.candidateIdentity,null);
+});
+test("explicit partnership overrides scores; breakup overrides lover and blocks stale romance",()=>{
+ const lover=resolveRelationshipIdentity({state:state(20,20,20,20,5,"romantic_partner"),relationshipStateVersion:1,current:{primaryIdentity:"friend",constraint:"none"}});
+ assert.equal(lover.primaryIdentity,"lover");
+ const ended=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:2,current:{primaryIdentity:"lover",constraint:"none",preRomanticIdentity:"best_friend"},criticalEvent:"relationship_end"});
+ assert.notEqual(ended.primaryIdentity,"lover"); assert.equal(ended.constraint,"post_breakup");
+ const after=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:2,current:{primaryIdentity:ended.primaryIdentity,constraint:ended.constraint,preRomanticIdentity:ended.preRomanticIdentity}});
+ assert.notEqual(after.candidateIdentity,"special_person");
+});
+test("candidate must be confirmed by two canonical state observations",()=>{
+ const [a,b]=twice(state(78,82,50,85,75)); assert.equal(a.transitionDecision,"hold"); assert.equal(a.primaryIdentity,"friend"); assert.equal(b.primaryIdentity,"special_person");
+});
+
+test("duplicate canonical state version cannot satisfy second confirmation",()=>{
+ const s=state(78,82,50,85,75);
+ const a=resolveRelationshipIdentity({state:s,relationshipStateVersion:10,current:{primaryIdentity:"friend",constraint:"none"}});
+ const replay=resolveRelationshipIdentity({state:s,relationshipStateVersion:10,current:{primaryIdentity:a.primaryIdentity,candidateIdentity:a.candidateIdentity,candidateConfirmations:a.candidateConfirmations,candidateSourceVersion:a.candidateSourceVersion,constraint:a.constraint}});
+ assert.equal(replay.primaryIdentity,"friend"); assert.equal(replay.candidateConfirmations,1);
+});
+test("breakup restores safe pre-romantic identity instead of inventing acquaintance",()=>{
+ const r=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:20,current:{primaryIdentity:"lover",constraint:"none",preRomanticIdentity:"best_friend"},criticalEvent:"relationship_end"});
+ assert.equal(r.primaryIdentity,"best_friend"); assert.equal(r.constraint,"post_breakup");
+});
+
+test("constraint anchor blocks stale same-version promotion after breakup",()=>{
+ const ended=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:20,current:{primaryIdentity:"lover",constraint:"none",preRomanticIdentity:"best_friend"},criticalEvent:"relationship_end"});
+ assert.equal(ended.constraintAnchorVersion,20);
+ const same=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:20,current:{primaryIdentity:ended.primaryIdentity,constraint:ended.constraint,constraintAnchorVersion:ended.constraintAnchorVersion,preRomanticIdentity:ended.preRomanticIdentity}});
+ assert.equal(same.primaryIdentity,"best_friend"); assert.equal(same.candidateIdentity,null);
+});
+test("only a post-anchor canonical state can start rebuilding identity",()=>{
+ const current:IdentityState={primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:20,preRomanticIdentity:"friend"};
+ const same=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:20,current});
+ assert.equal(same.candidateIdentity,null);
+ const newer=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current});
+ assert.equal(newer.candidateIdentity,"best_friend"); assert.equal(newer.candidateConfirmations,1); assert.equal(newer.candidateSourceVersion,21);
+});
+test("duplicate post-anchor version cannot complete rebuilding confirmation",()=>{
+ const current:IdentityState={primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:20,preRomanticIdentity:"friend"};
+ const first=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current});
+ const replay=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current:{primaryIdentity:first.primaryIdentity,candidateIdentity:first.candidateIdentity,candidateConfirmations:first.candidateConfirmations,candidateSourceVersion:first.candidateSourceVersion,constraint:first.constraint,constraintAnchorVersion:first.constraintAnchorVersion,preRomanticIdentity:first.preRomanticIdentity}});
+ assert.equal(replay.primaryIdentity,"friend"); assert.equal(replay.candidateConfirmations,1);
+});
+test("post rejection blocks romantic promotion while allowing friendship-side rebuilding",()=>{
+ const rejected=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:30,current:{primaryIdentity:"friend",constraint:"none"},criticalEvent:"romantic_rejection"});
+ assert.equal(rejected.constraint,"post_rejection"); assert.equal(rejected.constraintAnchorVersion,30); assert.equal(rejected.candidateIdentity,null);
+ const friendship=resolveRelationshipIdentity({state:state(90,95,50,85,75),relationshipStateVersion:31,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:30}});
+ assert.equal(friendship.candidateIdentity,"best_friend"); assert.notEqual(friendship.candidateIdentity,"special_person");
+});
+
+test("post-breakup constraint remains until relationship is rebuilt; it is not a timer",()=>{
+ const first=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current:{primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:20}});
+ assert.equal(first.constraint,"post_breakup"); assert.equal(first.candidateConfirmations,1);
+ const second=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:22,current:{primaryIdentity:first.primaryIdentity,candidateIdentity:first.candidateIdentity,candidateConfirmations:first.candidateConfirmations,candidateSourceVersion:first.candidateSourceVersion,constraint:first.constraint,constraintAnchorVersion:first.constraintAnchorVersion}});
+ assert.equal(second.primaryIdentity,"best_friend");
+ assert.equal(second.constraint,"post_breakup");
+});
+
+test("normal distant growth holds the current identity on first observation while tracking the raw candidate",()=>{
+ const r=resolveRelationshipIdentity({state:state(58,62,35,58,8),relationshipStateVersion:1,current:{primaryIdentity:"conversation_partner",constraint:"none"}});
+ assert.equal(r.primaryIdentity,"conversation_partner");
+ assert.equal(r.candidateIdentity,"trusted_friend");
+ assert.equal(r.candidateConfirmations,1);
+ assert.equal(r.transitionDecision,"hold");
+});
+test("strong canonical shape may escape adjacency without becoming a mandatory ladder",()=>{
+ const r=resolveRelationshipIdentity({state:state(88,90,55,78,8),relationshipStateVersion:1,current:{primaryIdentity:"friend",constraint:"none"}});
+ assert.equal(r.candidateIdentity,"best_friend");
+});
+test("adjacency does not turn high romance into lover status",()=>{
+ const r=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:1,current:{primaryIdentity:"friend",constraint:"none"}});
+ assert.notEqual(r.candidateIdentity,"lover");
+});
+
+test("post-rejection romance reentry requires a new canonical romance pattern",()=>{
+ const current:IdentityState={primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:10};
+ const stale=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:11,current,hasNewRomancePattern:false});
+ assert.notEqual(stale.candidateIdentity,"special_person");
+ assert.notEqual(stale.candidateIdentity,"person_of_interest");
+ const fresh=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:11,current,hasNewRomancePattern:true});
+ assert.ok(fresh.candidateIdentity==="special_person"||fresh.candidateIdentity==="person_of_interest");
+});
+test("post-breakup friendship-only state update cannot revive romance identity",()=>{
+ const r=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:21,current:{primaryIdentity:"best_friend",constraint:"post_breakup",constraintAnchorVersion:20},hasNewRomancePattern:false});
+ assert.notEqual(r.candidateIdentity,"special_person");
+ assert.notEqual(r.candidateIdentity,"person_of_interest");
+});
+test("boundary constraint blocks romance reentry even with a new romance pattern",()=>{
+ const r=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:31,current:{primaryIdentity:"friend",constraint:"boundary",constraintAnchorVersion:30},hasNewRomancePattern:true});
+ assert.notEqual(r.candidateIdentity,"special_person");
+ assert.notEqual(r.candidateIdentity,"person_of_interest");
+});
+
+test("fresh romance provenance remains available across later non-romance canonical updates",()=>{
+ const state={friendship:78,trust:82,playfulness:50,affection:85,romance:75,relationshipStatus:"none" as const};
+ const first=resolveRelationshipIdentity({relationshipStateVersion:11,state,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:10},hasNewRomancePattern:true});
+ assert.equal(first.romanceReentryVersion,11);
+ assert.ok(first.candidateIdentity==="special_person"||first.candidateIdentity==="person_of_interest");
+ const second=resolveRelationshipIdentity({relationshipStateVersion:12,state,current:first,hasNewRomancePattern:false});
+ assert.equal(second.romanceReentryVersion,11);
+ assert.ok(second.primaryIdentity==="special_person"||second.primaryIdentity==="person_of_interest");
+});
+test("new rejection resets prior romance reentry provenance",()=>{
+ const state={friendship:78,trust:82,playfulness:50,affection:85,romance:75,relationshipStatus:"none" as const};
+ const result=resolveRelationshipIdentity({relationshipStateVersion:20,state,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:10,romanceReentryVersion:11},criticalEvent:"romantic_rejection"});
+ assert.equal(result.romanceReentryVersion,null);
+ assert.equal(result.candidateIdentity,null);
+});
+
+
+test("adjacency chooses the supported neighbor closest to canonical shape rather than array order",()=>{
+ const r=resolveRelationshipIdentity({state:state(75,78,48,80,72),relationshipStateVersion:1,current:{primaryIdentity:"important_person",constraint:"none"}});
+ assert.equal(r.candidateIdentity,"special_person");
+ assert.notEqual(r.candidateIdentity,"friend");
+});

```

### tests/relationship-identity-sql.test.ts

```text
diff --git a/tests/relationship-identity-sql.test.ts b/tests/relationship-identity-sql.test.ts
new file mode 100644
index 0000000..5b1cd6d
--- /dev/null
+++ b/tests/relationship-identity-sql.test.ts
@@ -0,0 +1,185 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import fs from "node:fs";
+import { randomUUID } from "node:crypto";
+import { PGlite } from "@electric-sql/pglite";
+import { resolveRelationshipIdentity, type IdentityResult } from "../lib/relationship-identity-resolver.ts";
+
+const directory=new URL("../supabase/migrations/",import.meta.url);
+const read=(name:string)=>fs.readFileSync(new URL(name,directory),"utf8");
+const migrations=fs.readdirSync(directory).filter(n=>n.includes("relationship_identity_v1")).sort();
+const axes={friendship:78,trust:82,playfulness:50,affection:85,romance:75,relationshipStatus:"none" as const};
+const resolver="relationship-identity-v1";
+
+test("Relationship Identity migrations and RPC contracts in a fresh isolated PostgreSQL",async t=>{
+ const db=new PGlite();
+ try {
+  await db.exec(fs.readFileSync(new URL("fixtures/relationship-identity-baseline.sql",import.meta.url),"utf8"));
+  await db.exec(read("20260917023000_phase1_relationship_state_and_events_foundation.sql"));
+  // Columns originally introduced by legacy migrations absent/incomplete in the repo's baseline.
+  await db.exec("alter table public.misaki_relationship_state add column intimacy_migrated_at timestamptz; alter table public.misaki_relationship_events add column request_id uuid;");
+  for(const name of fs.readdirSync(directory).filter(n=>n.startsWith("20261003")&&n.includes("relationship_engine_v1")).sort()) await db.exec(read(name));
+  const scalar=async(sql:string,params:unknown[]=[])=>Object.values((await db.query(sql,params)).rows[0])[0];
+  const fixture=async()=>{
+   const user=randomUUID(),request=randomUUID(),token=randomUUID();
+   await db.query("insert into auth.users values($1)",[user]);
+   await db.query("insert into public.misaki_relationship_state(user_id,relationship_state_version,friendship_score,trust_score,playfulness_score,affection_score,romance_score) values($1,40,78,82,50,85,75)",[user]);
+   await db.query("insert into public.misaki_relationship_events(user_id,event_type,request_id) values($1,'email_save_checkpoint',$2),($1,'chat_turn_completed',$2)",[user,request]);
+   await db.query("insert into public.misaki_relationship_worker_leases(user_id,processing_version,request_id,lease_token,lease_until) values($1,$2,$3,$4,clock_timestamp()+interval '1 hour')",[user,"relationship-v1.1",request,token]);
+   return {user,request,token};
+  };
+  const apply=async(user:string,version:number,result:IdentityResult)=>{
+   const params=[user,version,resolver,result.primaryIdentity,result.candidateIdentity,result.candidateConfirmations,result.candidateSourceVersion,result.constraint,result.constraintAnchorVersion,result.romanceReentryVersion,result.preRomanticIdentity,result.transitionDecision,result.reasonCode];
+   return scalar("select public.apply_misaki_relationship_identity_v1("+params.map((_,i)=>`$${i+1}`).join(",")+")",params) as Promise<any>;
+  };
+  const importSnapshot=async(f:Awaited<ReturnType<typeof fixture>>,constraint:string,proof:boolean|null,legacy=false,primary="friend",token=f.token)=>{
+   const params:unknown[]=[f.user,f.request,"relationship-v1.1",token,randomUUID(),78,82,50,85,75,"none","relationship-v1.1",{version:900},primary,"special_person",1,899,constraint,800];
+   if(!legacy) params.push(proof);
+   params.push("friend",resolver);
+   return scalar("select public.import_misaki_temporary_relationship_v3("+params.map((_,i)=>`$${i+1}`).join(",")+")",params) as Promise<any>;
+  };
+
+  await t.test("every migration stage is callable before its successor, including pre-provenance import",async()=>{
+   assert.equal(migrations.length,4);
+   await db.exec(read(migrations[0]));
+   const f=await fixture();
+   await db.query("select public.apply_misaki_relationship_identity_v1($1,40,$2,'friend',null,0,null,'none',null,null,'maintain','stage_064000')",[f.user,resolver]);
+   await db.exec(read(migrations[1]));
+   const old=await fixture();
+   assert.equal((await importSnapshot(old,"post_breakup",false,true)).identity.source_relationship_state_version,41);
+   assert.equal(await scalar("select count(*)::int from information_schema.columns where table_name='misaki_relationship_identity_state' and column_name='romance_reentry_version'"),0);
+   await db.exec(read(migrations[2]));
+   const interim=await fixture();
+   const r=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40});
+   await apply(interim.user,40,r);
+   // The old temporary import remains self-contained after the new column is added.
+   await importSnapshot(await fixture(),"none",false,true);
+   await db.exec(read(migrations[3]));
+   await importSnapshot(await fixture(),"none",false);
+  });
+  await t.test("final schema has only 13-argument Identity apply and 22-argument import, service-only invoker ACL",async()=>{
+   const rows=(await db.query<any>("select p.proname,p.pronargs,p.prosecdef,has_function_privilege('anon',p.oid,'EXECUTE') as anon,has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated,has_function_privilege('service_role',p.oid,'EXECUTE') as service from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('apply_misaki_relationship_identity_v1','import_misaki_temporary_relationship_v3') order by p.proname")).rows;
+   assert.deepEqual(rows.map(r=>r.pronargs),[13,22]);
+   for(const r of rows) assert.deepEqual([r.prosecdef,r.anon,r.authenticated,r.service],[false,false,false,true]);
+   const f=await fixture();
+   await db.exec("set role service_role");
+   // Real role invocation, not just catalog inspection.
+   const existing=await scalar("select user_id from public.misaki_relationship_identity_state limit 1");
+   await assert.rejects(()=>db.query("select public.apply_misaki_relationship_identity_v1($1,999,$2,'friend',null,0,null,'none',null,null,null,'maintain','acl')",[existing,resolver]),/stale_relationship_state_version/);
+   await apply(f.user,40,resolveRelationshipIdentity({state:axes,relationshipStateVersion:40}));
+   for(const role of ["anon","authenticated"]){
+    await db.exec(`set role ${role}`);
+    await assert.rejects(()=>apply(f.user,40,resolveRelationshipIdentity({state:axes,relationshipStateVersion:40})),/permission denied for function/);
+   }
+   await db.exec("reset role");
+  });
+  await t.test("stale source refuses writes; replay preserves identity_since, version and immutable ledger; new identity changes since",async()=>{
+   const f=await fixture();
+   const first=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40,current:{primaryIdentity:"friend"}});
+   const a=await apply(f.user,40,first);
+   assert.equal(a.state.candidate_confirmations,1);
+   assert.deepEqual((await apply(f.user,40,first)).state,a.state);
+   await assert.rejects(()=>apply(f.user,39,first),/stale_relationship_state_version/);
+   await db.query("update public.misaki_relationship_state set relationship_state_version=41 where user_id=$1",[f.user]);
+   const second=resolveRelationshipIdentity({state:axes,relationshipStateVersion:41,current:first});
+   const b=await apply(f.user,41,second);
+   assert.equal(b.state.primary_identity,"special_person");
+   assert.notEqual(b.state.identity_since,a.state.identity_since);
+   await db.query("update public.misaki_relationship_state set relationship_state_version=42 where user_id=$1",[f.user]);
+   const c=await apply(f.user,42,resolveRelationshipIdentity({state:axes,relationshipStateVersion:42,current:second}));
+   assert.equal(c.state.identity_since,b.state.identity_since);
+   assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_transitions where user_id=$1",[f.user]),3);
+   assert.equal(await scalar("select romance_score::int from public.misaki_relationship_state where user_id=$1",[f.user]),75);
+  });
+  await t.test("RPC definition locks canonical source before Identity row and replay check (definition contract; PGlite is single-session)",async()=>{
+   const definition=String(await scalar("select pg_get_functiondef(oid) from pg_proc where proname='apply_misaki_relationship_identity_v1'"));
+   const source=definition.indexOf("where user_id=p_user_id for update;");
+   const identity=definition.indexOf("select * into v_current");
+   const replay=definition.indexOf("'replayed',true");
+   assert.ok(source>=0&&identity>source&&replay>identity);
+  });
+  await t.test("Identity state and transition ledger roll back together when ledger persistence fails",async()=>{
+   const f=await fixture(),r=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40});
+   await db.exec("create function public.fail_identity_ledger_fixture() returns trigger language plpgsql as $$ begin raise exception 'identity_ledger_fixture_failure'; end $$; create trigger fail_identity_ledger_fixture before insert on public.misaki_relationship_identity_transitions for each row execute function public.fail_identity_ledger_fixture();");
+   try {
+    await assert.rejects(()=>apply(f.user,40,r),/identity_ledger_fixture_failure/);
+    assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_state where user_id=$1",[f.user]),0);
+    assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_transitions where user_id=$1",[f.user]),0);
+   } finally { await db.exec("drop trigger fail_identity_ledger_fixture on public.misaki_relationship_identity_transitions; drop function public.fail_identity_ledger_fixture();"); }
+   assert.equal((await apply(f.user,40,r)).replayed,false);
+  });
+  await t.test("anonymous versions never cross namespace; only active breakup/rejection proof maps to permanent import version",async()=>{
+   for(const constraint of ["none","post_breakup","post_rejection","boundary"]){
+    for(const proof of [true,false,null]){
+     const f=await fixture(),r=await importSnapshot(f,constraint,proof),s=r.identity;
+     assert.equal(s.source_relationship_state_version,41);
+     assert.equal(s.candidate_source_version,null); assert.equal(s.candidate_identity,null); assert.equal(s.candidate_confirmations,0);
+     assert.equal(s.constraint_anchor_version,constraint==="none"?null:41);
+     assert.equal(s.romance_reentry_version,proof===true&&["post_breakup","post_rejection"].includes(constraint)?41:null);
+     assert.equal((await importSnapshot(f,constraint,proof)).replayed,true);
+     assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_transitions where user_id=$1",[f.user]),1);
+     assert.equal(await scalar("select relationship_state_version::int from public.misaki_relationship_state where user_id=$1",[f.user]),41);
+    }
+   }
+  });
+  await t.test("imported proof survives subsequent non-romance update without accepting newly invented equal-anchor proof",async()=>{
+   const f=await fixture();
+   await importSnapshot(f,"post_rejection",true);
+   await db.query("update public.misaki_relationship_state set relationship_state_version=42 where user_id=$1",[f.user]);
+   const r=resolveRelationshipIdentity({state:axes,relationshipStateVersion:42,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:41,romanceReentryVersion:41}});
+   assert.equal((await apply(f.user,42,r)).state.romance_reentry_version,41);
+   const unproven=await fixture();
+   await assert.rejects(()=>apply(unproven.user,40,{...r,constraintAnchorVersion:39,romanceReentryVersion:39}),/invalid_romance_reentry_version/);
+  });
+  await t.test("fresh positive romance proof persists, same-version replay is not confirmation, new rejection/boundary resets proof",async()=>{
+   for(const constraint of ["post_breakup","post_rejection"] as const){
+    const f=await fixture();
+    const first=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40,current:{primaryIdentity:"friend",constraint,constraintAnchorVersion:39},hasNewRomancePattern:true});
+    const a=await apply(f.user,40,first);
+    assert.equal(a.state.romance_reentry_version,40);
+    const replay=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40,current:first});
+    assert.equal(replay.candidateConfirmations,1);
+    assert.equal((await apply(f.user,40,replay)).state.identity_version,1);
+    await db.query("update public.misaki_relationship_state set relationship_state_version=41 where user_id=$1",[f.user]);
+    const second=resolveRelationshipIdentity({state:axes,relationshipStateVersion:41,current:first,hasNewRomancePattern:false});
+    assert.equal((await apply(f.user,41,second)).state.romance_reentry_version,40);
+    await db.query("update public.misaki_relationship_state set relationship_state_version=42 where user_id=$1",[f.user]);
+    const reset=resolveRelationshipIdentity({state:axes,relationshipStateVersion:42,current:second,criticalEvent:constraint==="post_breakup"?"boundary_event":"romantic_rejection"});
+    assert.equal((await apply(f.user,42,reset)).state.romance_reentry_version,null);
+   }
+  });
+  await t.test("lease-fenced positive romance Pattern application supplies proof by canonical version even when application timestamps tie",async()=>{
+   const f=await fixture(),pattern=randomUUID();
+   await db.query("insert into public.misaki_relationship_patterns(id,user_id,pattern_key,pattern_type,pattern_version) values($1,$2,'romance-fixture','care','relationship-v1.1')",[pattern,f.user]);
+   const result:any=await scalar("select public.apply_misaki_relationship_state_v2($1,$2,'relationship-v1.1',$3,$4::uuid[],0,0,0,0,1)",[f.user,f.request,f.token,[pattern]]);
+   assert.equal(result.state.relationship_state_version,41);
+   assert.equal(result.state.romance_score,76);
+   const proof=async(version:number)=>(await db.query<any>("select romance_delta,after_state from public.misaki_relationship_state_applications where user_id=$1 and after_state->>'relationship_state_version'=$2",[f.user,String(version)])).rows[0];
+   const application=await proof(41);
+   const first=resolveRelationshipIdentity({state:{...axes,romance:76},relationshipStateVersion:41,current:{primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:40},hasNewRomancePattern:application.romance_delta>0});
+   assert.equal((await apply(f.user,41,first)).state.romance_reentry_version,41);
+   const later=randomUUID(),laterPattern=randomUUID();
+   await db.query("insert into public.misaki_relationship_events(user_id,event_type,request_id) values($1,'chat_turn_completed',$2)",[f.user,later]);
+   await db.query("update public.misaki_relationship_worker_leases set request_id=$2 where user_id=$1",[f.user,later]);
+   await db.query("insert into public.misaki_relationship_patterns(id,user_id,pattern_key,pattern_type,pattern_version) values($1,$2,'trust-fixture','care','relationship-v1.1')",[laterPattern,f.user]);
+   await scalar("select public.apply_misaki_relationship_state_v2($1,$2,'relationship-v1.1',$3,$4::uuid[],0,1,0,0,0)",[f.user,later,f.token,[laterPattern]]);
+   await db.query("update public.misaki_relationship_state_applications set created_at='2026-10-07T01:00:00Z' where user_id=$1",[f.user]);
+   assert.equal((await proof(42)).romance_delta,0);
+   assert.equal((await proof(41)).romance_delta,1);
+   const second=resolveRelationshipIdentity({state:{...axes,trust:83,romance:76},relationshipStateVersion:42,current:first,hasNewRomancePattern:(await proof(42)).romance_delta>0});
+   assert.equal((await apply(f.user,42,second)).state.romance_reentry_version,41);
+  });
+  await t.test("import failure rolls back axes, Identity, checkpoint marker and ledger; missing checkpoint/bad lease refuse",async()=>{
+   const f=await fixture();
+   await assert.rejects(()=>importSnapshot(f,"none",false,false,"friend",randomUUID()),/relationship_processing_lease_required/);
+   await db.query("delete from public.misaki_relationship_events where user_id=$1 and event_type='email_save_checkpoint'",[f.user]);
+   await assert.rejects(()=>importSnapshot(f,"none",false),/email_save_checkpoint_required/);
+   await db.query("insert into public.misaki_relationship_events(user_id,event_type) values($1,'email_save_checkpoint')",[f.user]);
+   // An invalid pre-romantic value fails at Identity INSERT after axes UPDATE.
+   const sql="select public.import_misaki_temporary_relationship_v3($1,$2,'relationship-v1.1',$3,$4,10,10,10,10,10,'none','relationship-v1.1','{}','friend',null,0,null,'none',null,false,'invalid', $5)";
+   await assert.rejects(()=>db.query(sql,[f.user,f.request,f.token,randomUUID(),resolver]),/check constraint/);
+   assert.equal(await scalar("select relationship_state_version::int from public.misaki_relationship_state where user_id=$1",[f.user]),40);
+   for(const table of ["misaki_relationship_identity_state","misaki_relationship_identity_transitions","misaki_relationship_temporary_v1_imports"]) assert.equal(await scalar(`select count(*)::int from public.${table} where user_id=$1`,[f.user]),0);
+  });
+ } finally { await db.close(); }
+});

```

### tests/relationship-identity-temporary-import.test.ts

```text
diff --git a/tests/relationship-identity-temporary-import.test.ts b/tests/relationship-identity-temporary-import.test.ts
new file mode 100644
index 0000000..e866e7e
--- /dev/null
+++ b/tests/relationship-identity-temporary-import.test.ts
@@ -0,0 +1,17 @@
+import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
+const sql=fs.readFileSync(new URL("../supabase/migrations/20261007114154_relationship_identity_v1_atomic_temporary_import.sql",import.meta.url),"utf8");
+test("temporary import materializes relationship and identity in one RPC transaction",()=>{
+ assert.match(sql,/update public\.misaki_relationship_state/);
+ assert.match(sql,/insert into public\.misaki_relationship_identity_state/);
+ assert.match(sql,/insert into public\.misaki_relationship_temporary_v1_imports/);
+});
+test("replay cannot silently leave imported axes without identity",()=>{
+ assert.match(sql,/temporary_import_identity_missing/);
+ assert.match(sql,/return jsonb_build_object\('replayed',true/);
+});
+test("atomic import remains relationship-lease fenced",()=>{
+ assert.match(sql,/assert_misaki_relationship_lease_v1/);
+});
+test("browser roles cannot call atomic import",()=>{
+ assert.match(sql,/revoke execute on function public\.import_misaki_temporary_relationship_v3[\s\S]*from public,anon,authenticated/);
+});

```

### tests/relationship-mutual-acceptance.test.ts

```text
diff --git a/tests/relationship-mutual-acceptance.test.ts b/tests/relationship-mutual-acceptance.test.ts
new file mode 100644
index 0000000..4c979a2
--- /dev/null
+++ b/tests/relationship-mutual-acceptance.test.ts
@@ -0,0 +1,52 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import { criticalCandidates, validateCriticalEvent } from "../lib/relationship-analyzer-v1.ts";
+import type { Turn } from "../lib/relationship-engine-v1.ts";
+
+const turn: Turn = {
+  requestId: "acceptance-turn",
+  message: "じゃあ、美咲も俺と付き合いたいってことでいい？😊",
+  reply: "恋人同士なんだから、そんなに不安にならなくてもいいんだよ。大好きだよ。",
+  savedAt: "2026-10-08T00:00:00Z",
+};
+
+test("explicit confirmation question creates romantic_acceptance candidate", () => {
+  assert.ok(criticalCandidates(turn.message).includes("romantic_acceptance"));
+});
+
+test("prior proposal plus explicit Misaki partnership reply can ground acceptance", async () => {
+  const oldFetch = globalThis.fetch;
+  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
+    confirmed: true,
+    supportingTurn: "恋人同士なんだから",
+  }) }] } }] });
+  try {
+    assert.equal(await validateCriticalEvent(turn, "romantic_acceptance", [
+      { request_id: "proposal-turn", event_type: "romantic_proposal" },
+    ]), true);
+  } finally {
+    globalThis.fetch = oldFetch;
+  }
+});
+
+test("Misaki reply alone cannot ground acceptance without prior canonical proposal", async () => {
+  const oldFetch = globalThis.fetch;
+  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
+    confirmed: true,
+    supportingTurn: "恋人同士なんだから",
+  }) }] } }] });
+  try {
+    await assert.rejects(
+      () => validateCriticalEvent(turn, "romantic_acceptance", []),
+      /invalid_critical_validation/,
+    );
+  } finally {
+    globalThis.fetch = oldFetch;
+  }
+});
+
+test("ordinary affection still creates no critical event", () => {
+  for (const text of ["好き", "大好き", "ずっとそばにいるよ"]) {
+    assert.deepEqual(criticalCandidates(text), []);
+  }
+});

```

