# 第4次精査：GitHub内SQLの定義順・境界
本番接続は禁止につき実施していない。「最終」は固定mainの追跡対象SQL内の定義順であり、本番DB・全92枝を通じた実効最終定義ではない。mainの35 migrationと補助SQLを取得し対象routine/triggerを索引化。全SQLの意味精査完了ではない。

| オブジェクト | 定義の変遷・追跡範囲内の最終 | 保護/不足 |
|---|---|---|
| finish_misaki_body_clock_delivery | 9/16 atomic 7引数→9/18 canonical migrationで旧署名DROP、11引数版:299–353 | auth/background行lock、lease、日次4、空文拒否、匿名root revision又は恒久conversation.updated_at、履歴/配送/回数を同transaction。relationship_state_version/Forget世代比較はない。F migrationもこのroutineを置換しない |
| complete_misaki_chat_turn | 9/18成功turn原子化→9/26 semantic delta。F 20261006200002がForget保存を拡張 | controlと正本保存の原子性を再利用。旧writer/rollback/同時更新試験は必要 |
| edit_misaki_conversation_state | 9/18 memory/history別操作→F expected_updated_atとforget payloadを加える | 旧signatureとの協調更新を必要とする。clearHistoryは別責務 |
| save_misaki_temporary_state / write_misaki_temporary_root | 9/18→9/26関係trajectory/checkpoint維持→F control payload | 暗号root/revision/expiry/checkpoint。Relationship importの派生利用権は別 |
| Relationship v2証拠/episode/pattern/pending/import | 10/3 094200はlease assertion後v1委譲→100600で直接v2 writerへ置換、旧v1 service_role実行撤去 | lease/processing version/canonical turn/同user参照を保存transactionへ入れる。Forget世代はこのworker SQLに含まれない |
| apply state v2 / critical event v2 | 10/3 091800でtoken/期限/canonical turn/idempotency、state version増加 | 実際の全文でロックの差がある。全writerが同じfencing強度だと拡張しない。lease奪取と並行保存は既存隔離試験の精査残件 |
| persona claim/create/review RPC | main 9/17 phase0はGRANT/REVOKEのみ | 35 migration内にこれら3RPCのCREATE本文を確認できない。DOC-051の10/13DB調査報告は履歴証拠であり、今のDB定義の再確認ではない |
| conversation→emotion/action trigger | 9/17作成→9/26 005000で旧2triggerをDROP | 古い9/18canonical文書の「維持」を現在仕様へ戻さない。関係v2への置換とlazy silenceは別 |
| refresh background snapshot / refund guard | 9/18 canonical migration:238–266 | browser由来を正本にしない、成功turn refund拒否。Forgetの内容失効とは別 |
| cron / relay attempts | BODY_CLOCK.md、body-clock-enable.sql、9/16 migration/relay-signing.sql | GitHub定義は予定/認証/attempt境界の証拠。現在activeなcron、外部Job、Edge SHA/適用順/ACL/RLSは未確認 |

## Transactionと権限
F misaki_forget_controlsはRLS有効、PUBLIC/anon/authenticated撤去、service_role select/insert/update。persistは暗号payloadを同transactionへ保存する。DB内に意味判定器があるわけではない。
Relationshipのlease row lockはlease所有権を守る。関係state versionの増加、会話updated_at、Forgetのlogical versionは別物。単に各々の識別子が存在しても、すべての読取/保存/配送が比較しているとは言えない。
DOC-051に旧DB ledger82件/対象main migration35件、同名でversion違い21、厳密一致11という過去報告がある。現DB不正・未適用件数とは認定せず、再適用/rename/resetしない。

35にはmain SQLの全Blob、36には関連固定ソースを保持する。型シグネチャ/overload/明示施工順と、過去枝の補助復元SQLを合わせた全実効順は次回へ残す。今回DDL/SQL/DBアクセス/実行試験0。
