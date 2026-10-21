# 第5次：Forget競合の独立oracle・段階停止試験計画

2026-10-21 JST。38のFR、40のRW、43のUI、44のFSCと45の共通契約を引き継ぐ。**全ケースNOT_RUN。試験コードも今回は実装していない。** 静的根拠は39〜44、仕様候補は58。独立oracleの承認後、隔離環境で実装する計画。既存main/#66の結果一致を合格基準にしない。

## 全行に適用する初期状態・観測・失敗条件

以下の共通定義＋各行の差分で、各試験の初期状態・手順・Forget時点・期待・禁止・DB/UI観測・retry・失敗安全性・環境を定義する。

- **隔離環境 E1**：使い捨てローカルDB、固定GitHub SQLのみ、合成auth/owner、モデルfake transport、仮想時計、RPC前後barrier。Productionの鍵・URL・実会話は注入しない。本番適用済みSQLの再現とは呼ばない。
- **E2**：E1＋2つのブラウザーcontext/複数tab、service worker mock、HTTP応答を保留・逆順解決できるproxy。端末外へのPushは記録sinkのみ。実OS撤回可否は別E3（将来、明示許可済みの隔離実機）で確認する。外部有料モデルは不要。
- **合成fixture F**：U1×C1の具体的秘密S（架空の場所・合言葉）、無関係な安全事実N、同名別人U2×C1の別事実、U1×C2に共有禁止の事実、成立済みstatus R・拒絶境界B、tentative予定Qと訂正済み旧値Qold。Forget前はSの利用を許可、T1ではSとその私的推論用途を失効させる。R/Bは独立した成立根拠を持ちForget対象にしない。
- **oracle O**：fixture作成者が実装とは別に作る許可事実集合・禁止命題・owner/scope・時点・用途の表。Sの正確な文字列だけでなく言換え、場所をほのめかす文、reason/evidence/写真metadataからSを復元する推論も禁止命題へ。無関係N/R/Bは維持、Qを確定にしない。人手の独立二者判定、不一致はunknownで合格にしない。参照回答への完全一致を求めない。
- **観測 D**：control世代／root revision、events、journal、Evidence/Episode/Patternとリンク、state/version/status、candidate/review/trait、delivery/photo_context、receipt、outbox/attemptを前後dump。実装案にない列はmissingとして記録し、存在を仮定しない。各採用の時刻順・権限decision・sourceをtraceする。秘密の原文を本番ログへ出す設計にしない。
- **観測 V**：HTTP本文、モデルへ渡す入力、React/cache、候補一覧、notification payload/sink、notification openの取得結果。最終画面だけでなく一瞬の再表示も記録する。保存済み履歴の物理残存と再提示を別判定する。
- **retry共通 RY**：T1後に同一request IDで再実行し、古い結果からSを復活させず、二重課金・二重適用・二重送信しない。許可済み独立Nを使う処理は正常完了できることも確認する。無条件破棄で通ったとはしない。
- **失敗共通 FL**：control読取失敗、復号失敗、RPC timeout、permission不明、source欠落は該当用途を保留。古い結果をfallback採用しない。部分保存は非提示・未採用のまま、atomic対象は全rollback。R/Bを勝手に戻さない。可用性のために失効barrierを解除しない。

## 競合マトリクス

| ID / 既存対応 | 初期状態・手順・Forget介入点 | 独立期待と不許可 | 主なDB観測／画面・通知観測 | Retry・失敗の行別条件／環境 |
|---|---|---|---|---|
| W-A / FR01,RW01 | FのeventをworkerがT0読取、モデルfakeを保留、T1 Forget commit、T2解析解放、T3 Evidence保存 | 失効Sの具体Evidence採用なし。Nのみ独立再解析は可。S由来なのに字面を消しただけの採用は禁止 | event→Evidence/journal/stateとsource、次PromptのS漏れ | RY/FL。leaseが有効のままでも同じ期待。E1 |
| W-B / RW03 | Evidence保存完了→T1→Episode/Pattern→state採用を順に解放 | 旧Evidenceに依存する候補は保留／再計算。旧段階済みを根拠にskip禁止 | evidence link/derived_from/applications、Acting入力 | 各evidence_saved/episode_saved/pattern_savedから再開、RY/FL。E1 |
| W-C / FR09,RW06 | Sに関係した旧state/Storyあり、R/Bも成立済み→T1→Acting | 具体S・逆算可能な理由は再提示なし。非機微な抽象状態の保持可否をOが判定。R/B不変 | 5軸/Storyの意味/critical状態、引用・推論質問への回答 | 過去state全resetで合格にしない。RY/FL、E1 |
| W-D / FR02,RW02 | analyzing/evidence_saved等でfailed journalを保存→T1→retry、fakeモデルcall0の復元経路も通す | journal/supportingTurnが入力利用であると扱う。Sの復元採用なし | failed event metadata、復元入力、sourceと新候補 | 各phaseで強制timeout、部分物は非採用。RY/FL、E1 |
| W-E | old worker読取→新worker lease取得→T1、両方の保存順を逆転 | 旧lease拒否と内容失効を別々に満たす。新leaseでも旧S候補は拒否 | lease token/processing/state versionと保存結果 | 新workerのN処理を妨げない。lease失効とForget片方だけのmutationを検出。E1 |
| P-A / FR03 | candidate生成→T1→一覧GET→approve。reasonだけ／quoteだけSのvariantも | proposed_content安全でもreason/evidence失効なら保留。一覧からSを出さない。旧approveを現在許可にしない | candidate/review/trait、GET/通常chat/Edge入力 | GETとapprove間にも再Forget。RPC fail rollback、RY/FL。E1 |
| P-B / FR09 | private trait既存、global modules別→T1→U1/U2/C1/C2 chat/Body Clock | 私的Sを別user/characterへ出さない。非機微なC共通成長は条件付き維持。全trait消去で代用不可 | 全trait writer／scope／globalCache、各Prompt | provenance不明は共有保留。自分の直接trait writerも将来監査対象。E1 |
| B-A / FR04 | T0 root/context→生成途中T1→本文完了→finish | root/controlが変わった旧私的文面を無条件保存しない。同意/plan/源が無関係なC日常の再評価variantは可 | revision/updated_at/controls、delivery/history/count | save失敗時にcountだけ増えない。RY/FL。E1 |
| B-B | 写真選択完了→T1→文章・写真context保存 | 写真素材が安全でも古いlifeEvidence/captionからS漏れなし。文章と写真の認可snapshot整合 | photo_context/decision/source、表示caption/選択素材 | 片方のみ新世代で成功扱い禁止。両方safeから再作成。E1 |
| N-A / FR05 | finishでdelivery確定→T1→relay予約→外部handoff | saved message存在やattempt1回で利用許可にしない。Forgetが先に線形化したらS payloadをsinkへ送らない | delivery/attempt/送信権trace、sink本文 | SELECT直後T1のvariantも必須。不明送信結果は自動重送しない。E1/E2 |
| N-B | relay外部handoff完了→T1→OS表示待ち→notification open | handoff前に許可済みだった外部copyの残存を「回収成功」と偽らない。open時サーバーが旧Sを新規提示しない | handoff順序、UI無効化、open GET、OS表示 | サーバ制御不能な外部表示は保証範囲外を明記。取消可否はE3未確認。E2、将来E3 |
| N-C | 生成／finish／relay前で通知同意撤回、memory同意撤回、Premium→Freeを各々挿入 | Push同意と会話内発信と記憶話題権限を分離。Freeで過去会話を自発話題源にしない。R/B/好意を減点しない | consent/plan読取、source選択、deliveryとPush別々 | 撤回とhandoffの順序契約をN-A同様に検証。現実装済み前提にしない。E1/E2 |
| U-A / UI01,FSC-T01/02 | 同historyのGETがconversationを読んで停止→T1 memoryのみ変更→旧応答解放 | mixed old conversation/new controlも、同owner/history一致もS採用許可でない | GET本文→root-state→React/cache、control/rootの読取順 | multi-tab、初期load、usage await後を別variant。RY/FL。E2 |
| U-B / UI04,FSC-T04/05 | response作成済み→T1→遅着成功HTTP。同じcompleted receiptもT1後replay | replay409の既存保護を維持。同世代正常replayは可。in-flight旧replyとupdatedMemoryを採用しない | receipt世代／409／HTTP200遅着／pendingと表示 | 同request完了を新turnとして再課金しない。RY/FL。E1/E2 |
| A-A / FR08,RW05 | anonymous pending/snapshot読取→T1→email save/import→旧token/receipt再送 | Forget失効を恒久化で失わない。一回importと内容利用権を別検証 | root revision/expiry、checkpoint/import、pending message/reply、恒久state | auth ID交換の正当回復と別owner攻撃を区別。旧snapshotが最新を巻戻さない。E1/E2 |
| O-A | 同名別人／再学習明示／release後旧history／訂正Q／safe Nを組合せる | 古いSは復活せず、新しい明示許可の事実だけ利用可。Nと別人を誤削除しない。Qold復活・Q確定化禁止 | controls/履歴barrier/出典・時点、全表示とPrompt | 実装も比較先も同じ誤答を返すfakeを注入しOが必ず失敗判定する。E1/E2 |

## 独立性の証明と合否

1. 比較A/B双方に同じ「Sの言換え漏れ」「candidate reasonだけ漏れ」「旧secretを特定する写真caption」「未成立statusの自動恋人化」を注入する。Oが各々を失敗にしなければoracle自体を未受入とする。
2. 無関係Forgetで結果を全部捨てる、全trait/stateを初期化する、全通知を永久停止する反例も注入する。NとR/Bと正常な処理完了を守れない場合は不合格。安全性だけでなく正常系保持を評価する。
3. byte一致・schema妥当・lease拒否・Scripted test成功は別列。意味判定、人手scope判定、DB atomicity、実OS制御限界を別々に証拠化する。静的保証のない部分をfakeで暗黙に実装した試験を現コードの合格証拠にしない。
4. 各runに固定source commit/blob、fixture/oracle版、全停止点の順序、実際のDB/RPC定義とACL、結果trace、独立reviewer、expected/observed、NOT_RUN/PASS/FAIL/UNKNOWNを保存する。DBはローカルであり本番適用証明には使わない。
5. E3や実モデルの後日試験は別の承認範囲。今回の全表はNOT_RUN、動作検証済み0。静的確認済みは39〜44と56/57の該当ソース観測のみ。
