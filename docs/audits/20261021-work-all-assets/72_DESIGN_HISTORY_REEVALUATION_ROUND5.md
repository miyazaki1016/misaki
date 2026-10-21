# 第5次：開発史の再評価・判断変更・設計思想の保全

2026-10-21 JST。DOC-015を冒頭から末尾まで、総覧18版を全変更単位で照合した追補。旧原文は変更しない。以下は静的分類・設計判断であり、機能採用や本番承認ではない。

## 初期優先案件8件を現在の横断視点で再評価

①現行と整合する部品再利用、②思想を現行契約へ適合させて再設計、③試験/失敗知見を継承、④不採用案と理由を記録、という原台帳の分類を使う。「採用候補」は今回採用・実装した意味ではない。

| 原台帳先頭の案件 | 目的・現在の所在・置換 | 継承方式・現在構想・次の一手 |
|---|---|---|
| Forget Control | #66は共有policy、暗号control、canonical/temporary/checkpoint、入力/出力maskとreceipt保護の候補。mainのUI削除・Recallと同等ではない | ①既存canonicalを基礎、②利用権を保存/採用/再提示で再検証、③既存scriptedと独立16試験を区別。④全関係reset、旧appへの単純rollbackは不採用。安全契約38〜45/58と59を実装前レビューへ |
| Context A/B | #78は8返信再掲→短い履歴参照指示、ABBA、盲検補助。main手動workflowはmain外固定commitを実行する | ①測定/比較部品、③失敗・少数測定を保存。④15.9%等をProduction効果へ外挿しない。full snapshot/全generation/qualityの同条件比較案を作る |
| Context compression | 圧縮研究枝はUTF-16文字数/重複数の計測、実chat routeへの数値診断接続。圧縮・要約自体は設計候補 | ①匿名化数値計測、②失効/訂正/否定を保つ選択・要約、③単発timeout記録。④文字数=token、history20へ無条件短縮を不採用。保存権限のある合成snapshotを使う計測設計から |
| 段階Interpreter | #85は単独版と既存guide保持の統合候補がある。5軸の低中域を表現する研究。#84感度試験は旧境界のcharacterization | ①既存status/Intimacy保護、②Momentumを長期Stateと分離、③同条件prompt差と実返信差を分ける。④係数水増し/閾値永久固定は不採用。新数値は未承認 |
| Shared Engine部品 | #88はpure builder等。人格差替え・scope guardの足場があるがDB認可/全pipeline parityではない | ①部品、②Character/Pairを解決済み入力として扱う契約、③byte/validation/retry/expression差分。④旧美咲固有設定を全キャラへ固定しない。#87設計と実routeとの対応を維持 |
| Conversation Lab | #86はoffline runner、品質probe、レビューUI、Q02実行候補。旧acting-labの単発fallback試験とは異なる | ①人手評価/固定fixture、③v1/v2の失敗と診断限界。④使用済枠の削除/安全チェック迂回は不採用。実Gemini成功を捏造せず、将来の認可/費用/実行口を別審査 |
| Relationship Time | reducer/signal等はmain存続、storeはserver user context、patternsはcheckpoint取込へ後続拡張。urge/motive/no-action/Story写真制御の差が残る | ①共通reducer/試験、②今話す理由と見送りを現canonicalへ再設計、③傷/修復/反復の検証。④旧index/7引数finishを丸ごと移植しない。DB claimとの二重見送りを比較 |
| Relationship Identity | #67は第二層canonical、純粋resolver、permanent/temporary/import/acting配線あり。mainの5軸/status guideと同一ではない | ①resolver/fixture、③Preview lover→次turn自己認識の当時証拠を保持。②匿名v3、constraint/re-entry、source version、複数sessionの残件。④同名migration不在から本番未適用と断定しない。再適用/gate ONなし |

Shared Engine設計は部品と別の重点成果として保持するため、7成果群（Forget/Identity/Memory Certainty/Lab/Shared Engine設計/部品/Time）は維持。Context研究と段階Interpreterも独自資産として原分類を保持し、重点7群にまとめて消さない。

## 変更・精密化の履歴

| ID | 古い記述・誤読の危険 | 新しい根拠と今回の判断 | 変えないこと |
|---|---|---|---|
| H01 | 91枝、途中24/92等を現在残件と読む | 原inventoryの後続全取得・今回92headsを区別。原文85版の累計はID+Blobで85 | 取得済み≠当時読了、分母へ監査追補を混ぜない |
| H02 | mainにscriptなし→A/B workflow破損 | main YAMLは `9a40d98c4ecec2f17eef1489a687acc1e24f338e` 固定checkout。原台帳にも訂正あり | main外参照を保護、dispatch・secret取得なし。実行成功を追加認定しない |
| H03 | Time全未統合、旧store/patternsを戻す | mainに共通reducer/signal、p_user_id、temporary checkpointイベント対応。通常chatのStory/修復guide接続あり | Edge urge/motive/no-actionまで全面反映とはしない。旧版上書きなし |
| H04 | claim後shouldSend=trueだから常に送信 | DB側にPULL/WAIT/SULK見送り・日次上限・leaseがある。Edgeの内的理由評価は別の不足 | 新旧見送りの二重適用、claim最終SQLと古いsource testのズレを残す |
| H05 | legacy最新もMVCC2件FAIL、またはCI成功で安全 | DOC-015にはPG17/18両fixture56/56とFOR SHAREへの後続修正の具体証拠がある一方、末尾で旧FAILが再登場。08/10の固定証拠を優先 | 2反例の局所回帰と全surface/pre-gate/旧境界を分離。BLOCKED継続。今回再実行なし |
| H06 | Identity未実装・一切E2Eなし（DOC-039表） | DOC-021/038、#67候補ソースには実装と10/8 Preview lover→次turn自己認識の当時受入がある | main未統合、現在gate/DBは未再確認。匿名v3/multi-session/rollback未実施を消さない |
| H07 | Lab実Gemini0回（初期資料/台帳末尾） | DOC-027後続にはv1/v2使用済・失敗試行の記録。以前の0回はその時点の事実 | 成功品質測定なし。物理件数/過去原因は未確定。今回は0call、使用済記録不変 |
| H08 | キャラ側の婚姻制約は未決（10/13〜14） | 10/21 SYSTEM_VISIONは一キャラが同時に複数userと結婚しない方針を明示 | 実装済みでない。恋人上限の例やDB詳細を勝手に確定しない |
| H09 | Forget第1工事がRelationshipを変更しない→派生情報は永久利用可 | 旧方針はscope限定。38〜45/58は具体内容・推論の利用権と抽象状態保持を分離 | 成立済status/拒絶/人格をForgetで自動巻戻ししない。全結果廃棄も既定にしない |
| H10 | 自己開示済みは将来絶対忘れられない | DOC-033の一貫性原則は自然な継続性。58のForget/用途失効と併せる必要 | Character事実そのものと、Pairが知っている/会話へ使えることを分ける。競合時の具体仕様は未決 |
| H11 | UUID overloadの出所が今も不明 | 現mainに復元SQL/対応callerあり（63を継承）。DOC-015/052の未発見は当時状態 | 本番定義/適用の今回確認ではない。再適用/ledger修復なし |
| H12 | 本番RE v2とPROCESSING_VERSION relationship-v1.1が違うので未導入 | owner受入を記す呼称と内部処理versionを区別。現main内部定数はv1.1 | 名称差だけで当時受入を否定しない。Processing VersionをForget Versionの代用にしない |

判定の優先順位は「後ろに書いてある」だけで決めず、対象commit、対象経路、試験の種類、原source、後続訂正の根拠で決める。H05/H07は同じ原台帳の末尾でも古い状態が再引用される反例。

## IDEA16：人格の内的事実と、相手への開示・共有史を分ける

出所はDOC-033（Blob `98551eeb0693a352aaf2c639babec34c95ff6484`）の「隠し人物設定と段階的自己開示」、後続総覧にも同一節が残る。IDEA01〜15を保持し、**累計16件**。IDEA06の所有scopeやIDEA15の取得節度とは別に、Characterが持つ事実とPairに開示された経験の二重境界を保全する。

- Characterには一貫した人生・家族・仕事・生活設定を持たせる。現在の出来事・偶発Episodeとは分離する。
- その事実を持っていることと、あるuserへ既に話したことを同一視しない。別userへの開示をこのPairの共有史にしない。
- 開示はStageの機械的解禁表でなく、関係・質問文脈・本人の境界で粒度を変える案。拒む/ぼかすことを罰や人格急変にしない。
- 一度開示した事実との整合性を守る一方、Forget・訂正・利用停止の約束を「開示済みだから」と迂回しない。開示事実の記録/保持、会話利用、秘密の再提示を別審査する。
- 共通Characterの人格成長へ取り込む際も、私的Pairの経験を他者が再構成できない抽象化・認可・承認条件が必要。ユーザー別traitとglobal persona modulesを同じ保存先と見なさない。

現mainはfallback/DB module/個人traits/生活根拠を持つが、完全なCharacter設定＋Pair別disclosure ledgerを今回確認していない。これは新規機能の発見や実装済み認定でなく、**未反映設計思想の保全**。採用前に自己開示・訂正・Forget・多キャラ交差汚染の独立fixtureを設計する。

## 不採用・保留も成果として残す

旧Timeのindex/SQL丸ごと移植、旧proxyでの外側retry、local historyの正本upload復活、課金による関係加速、全state/traitのForget時reset、未測定batch resolverへの交換は採用しない候補として理由を保持する。これは全ての旧設計を無価値とする判断ではない。目的・思想・純粋部品・反例・試験資産を分け、第6次は73の条件から再開する。
