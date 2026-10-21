# ソラ第5次：Relationship/5軸設計文書3版の全文精査

日付: 2026-10-21 JST。従前資料49の精査46/85、残39版から継続。第4次台帳34の未精査IDに一致する次の3版を**原本Blobの全文**で読み、GitHub上の固定コードと照合した。新機能採用や本番安全性の承認ではない。

## DOC-043：Interpreter 5軸の段階表現（Draft #85）

原本 `docs/INTERPRETER_GRADUAL_COMPARISON_20261015.md`、Blob `ca2b53562d061f8fa01cf803b940173b783da8bb`（全1,843文字）。同じ `intimacyStage=2`、`relationshipStatus=none` の条件で現行/実験の軸表現を静的比較したもの。**実Gemini応答のA/Bではない**。

- `experiment/interpreter-gradual-acting-20261015` の `lib/relationship-acting-guide-gradual-experiment.ts` Blob `6d325cdd4ab545c4c6c3d9db239c77650ec2c04a` を全文取得。friendship/trust/playfulness/affection/romanceの広い帯域（20/50/80）、未交際の恋人扱い禁止、根拠のない共有体験を作らない指示、交際成立時の独立処理が実装案に存在する。
- 同ファイル `createIntegratedActingGuideExperiment` は既存 `createRelationshipActingGuide` を土台として一部中間帯域の補助のみ追加する。playfulness 30未満に矛盾する指示を重ねない。これは**実験branch上の統合案**でありproduction call-siteでは使用していない。
- 固定main `lib/relationship-acting-guide.ts` Blob `9f494a43e8bab0d928e48e9dc16e8fffc6dd6daf` に既存の親密度/stage/statusのガードがあり、実験版への一括置換は逆行リスクを持つ。
- 保全すべき設計思想：僅かな関係変化も会話の自然さへ表現したいが、数値上げのために甘さや共有体験を捏造しない。短期Momentum・Emotion・Memoryは5軸点数と異なる入力。低スコアの育ち方と実データ分布は未検証。
- 判定：`draft-gradual-acting-experiment-not-runtime`。実測0、production採用0。

## DOC-070：通常chatのRelationship Guide接続

原本 `docs/RELATIONSHIP_PROMPT_WIRING_AUDIT_20261015.md` Blob `bc11962d6fd31751f5c8f101a57a331d9844cc4d`（全文取得）。

- 固定main `app/api/chat/route.ts` Blob `5600ad37f2660049a570c4dd340e8ed140d9843b` を直接照合。`createRelationshipActingGuide` 呼出しが2062–64行、`baseSystemPrompt`へacting guideと `pendingRelationshipGuide(rootState)` を挿入する箇所が2265–66行に存在する。文書記載の行数2055や2260は当時の番号で、固定mainで意味上対応する位置を再照合した。
- `rootState.relationshipActingState` 優先、relationshipEngine状態、legacy points fallbackがあることは当該コードから確認。**通常chatの接続確認 ≠ プロンプト効果が本番で実証済み**。
- Body Clockの同等性は別物。固定main `supabase/functions/body-clock/proactive-decision.ts` Blob `b75fc031927c5a7c7450ff5e39f4c69ab1772f48` は226行付近で `intimacy_level,intimacy_points,emotion_state,action_state,last_interaction_at` を読む（5軸をまるごと同じDTOとして読むと断定できない）。第4次54/55等も参照し、現在のEdge結線の最終版は別検証。
- 判定：`static-chat-wiring-proven-body-clock-parity-open`、runtime_acceptance=false。

## DOC-071：relationship_state_versionと旧Writerの保護範囲

原本 `docs/RELATIONSHIP_VERSION_LEGACY_WRITER_AUDIT_20261015.md` Blob `0e6fd6be79d882b29055f3faabb3801b3009e7d6`（全文取得）。

- 原本はmain migration 36件の把握、旧14件の書込み抽出を報告し、**5軸/statusの主要更新と旧Emotion/Action/親密度変更のversion境界を分ける**。
- 固定main migration `supabase/migrations/20260926003000_relationship_emotion_action_v2_rpc.sql` Blob `6024f352e8b77a369e94f84559c0f21057e47bbc` の58–59行で `emotion_state` と `action_state` をUPDATEする実装を確認。`relationship_state_version`をこの2行と同時に加算する記述は見えない。この観測だけで「5軸の抜け道」と断定しない。ファイル全域以外の後続定義や本番適用済み版は未検証。
- 固定main `supabase/functions/body-clock/proactive-decision.ts` 226–58行には `emotion_state` / `action_state` と intimacy値の読込がある。したがって **5軸versionだけを根拠にEmotion/Action込みのacting状態が最新版と判断できるか** は個別に検証が必要。
- 第5次38〜45で区別したForget世代/worker lease/Relationship state versionとの役割分離を保持。関係状態の世代をForget世代で代用しない。
- 判定：`static-legacy-writer-boundary-audit-needs-final-db-function-check`、runtime_acceptance=false。

## 3文書横断で守る価値

1. 既存の距離感・境界・交際状態を壊さず、5軸中間帯の自然な変化だけを候補にする。
2. 通常chatとBody Clockで利用する関係状態は**同じ意味の正本**を参照できるか別々に検査する。片方の接続が正しいだけで両方正しいと判定しない。
3. Relationship version、Emotion/Actionの更新、Forget/control世代を混同せず、最終採用時に実際に守る対象を明記する。
4. 関係性の質・自然さは実モデルの会話を独立に観測して評価する。静的Prompt比較を採用実績としない。

## 進捗と権限

今回の新規「全文読解＋固定ソース照合」：**DOC-043・070・071の3版**。前回46/85→**49/85版、残36版**。既存第5次作成資料38〜51は原本85母数外。証拠不足30枝は今回の3版精査で解消せず。ideasは独立に検証するまで既存13件扱い、legacy BLOCKED維持。**本番DB/OS/Edge環境・実モデル・自動テスト未実行、実漏洩や危険経路の再現0。**
GitHub監査専用ブランチへの文書追記だけ。main、Production、Supabase、アメふる、PR merge、branch削除、CI run、Gemini有料呼出し、deployなどに触れていない。
