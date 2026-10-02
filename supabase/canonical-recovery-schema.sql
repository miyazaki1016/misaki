-- OPERATOR-REVIEWED TRANSACTION ONLY. This is schema preparation, NOT a backup.
-- Prerequisites: ingress ON + writes_frozen ON + cron stopped, no reopened traffic,
-- verified pre-cutover archives and restore-routines.sql. DO NOT run standalone.
drop trigger if exists trg_refresh_misaki_background_snapshot on public.background_push_state;
drop trigger if exists trg_guard_misaki_completed_turn_refund on public.daily_message_requests;
drop function if exists public.finish_misaki_body_clock_delivery(uuid,timestamptz,text,text,text,jsonb,integer,uuid,text,jsonb,timestamptz);
drop function if exists public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb);
drop function if exists public.complete_misaki_temporary_turn(uuid,uuid,text,text,text,uuid,jsonb);
drop function if exists public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,uuid);
drop function if exists public.edit_misaki_conversation_state(uuid,text,text);
drop function if exists public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean);
drop function if exists public.refresh_misaki_background_snapshot();
drop function if exists public.guard_misaki_completed_turn_refund();
drop table if exists public.misaki_temporary_roots;
drop index if exists public.misaki_email_checkpoint_user_idx;
drop index if exists public.daily_message_temporary_completed_idx;
drop index if exists public.misaki_relationship_completed_request_idx;
alter table public.daily_message_requests drop column if exists completed_at,
 drop column if exists temporary_result, drop column if exists message_hash, drop column if exists parent_hash;
alter table public.misaki_relationship_state drop column if exists intimacy_migrated_at;
alter table public.misaki_user_conversation_state drop column if exists today_memory;
alter table public.misaki_relationship_events drop column if exists request_id;
-- refunded_at already exists on observed Production; retain its data and type.
-- Restore the old seven-argument delivery RPC, four old RPC ACLs and refund body
-- from the checkpoint's restore-routines.sql in this same transaction.
