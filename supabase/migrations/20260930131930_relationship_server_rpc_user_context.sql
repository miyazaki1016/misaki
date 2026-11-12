-- Reconstructed from the production Supabase migration/log record for
-- 2026-09-30 13:19:30.016 UTC.
--
-- This migration records SQL that was already applied to production.
-- It is restored here as the canonical Git-managed schema source.
-- Do not re-apply this migration to the existing production database.
-- Rollback SQL was not present in the production migration record.

create or replace function public.get_relationship_time_context(p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(auth.uid(), p_user_id);
  v_state public.misaki_relationship_state%rowtype;
  v_now timestamptz := now();
  v_elapsed_seconds bigint := 0;
  v_elapsed_hours numeric := 0;
  v_band text := 'new';
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if auth.uid() is not null and auth.uid() <> v_user_id then raise exception 'user mismatch'; end if;
  if auth.uid() is not null and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'permanent account required'; end if;
  if not exists(select 1 from auth.users where id=v_user_id and not is_anonymous) then raise exception 'permanent account required'; end if;
  select * into v_state from public.misaki_relationship_state where user_id=v_user_id;
  if not found then return jsonb_build_object('exists',false,'now',v_now,'elapsed_seconds',0,'elapsed_hours',0,'time_band','new','intimacy_level','initial','intimacy_points',0,'emotion_state',jsonb_build_object('primary','neutral','intensity',0),'action_state','NORMAL','last_user_message_at',null,'last_misaki_message_at',null,'last_interaction_at',null,'silence_started_at',null); end if;
  if v_state.last_interaction_at is not null then
    v_elapsed_seconds:=greatest(floor(extract(epoch from(v_now-v_state.last_interaction_at)))::bigint,0);
    v_elapsed_hours:=round(v_elapsed_seconds::numeric/3600,2);
    v_band:=case when v_elapsed_seconds<21600 then 'recent' when v_elapsed_seconds<86400 then 'same_day' when v_elapsed_seconds<259200 then 'one_to_three_days' when v_elapsed_seconds<604800 then 'three_to_seven_days' else 'seven_plus_days' end;
  end if;
  return jsonb_build_object('exists',true,'now',v_now,'elapsed_seconds',v_elapsed_seconds,'elapsed_hours',v_elapsed_hours,'time_band',v_band,'intimacy_level',v_state.intimacy_level,'intimacy_points',v_state.intimacy_points,'emotion_state',v_state.emotion_state,'action_state',v_state.action_state,'last_user_message_at',v_state.last_user_message_at,'last_misaki_message_at',v_state.last_misaki_message_at,'last_interaction_at',v_state.last_interaction_at,'silence_started_at',v_state.silence_started_at,'state_updated_at',v_state.state_updated_at);
end $$;
revoke all on function public.get_relationship_time_context(uuid) from public,anon,authenticated;
grant execute on function public.get_relationship_time_context(uuid) to service_role;

create or replace function public.record_relationship_chat_turn(p_user_message_at timestamptz,p_misaki_message_at timestamptz,p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user_id uuid:=coalesce(auth.uid(),p_user_id); v_before public.misaki_relationship_state%rowtype; v_after public.misaki_relationship_state%rowtype; v_user_at timestamptz:=coalesce(p_user_message_at,now()); v_misaki_at timestamptz:=coalesce(p_misaki_message_at,now()); v_last_at timestamptz:=greatest(v_user_at,v_misaki_at); v_elapsed_seconds bigint:=null;
begin
 if v_user_id is null then raise exception 'authentication required'; end if;
 if auth.uid() is not null and auth.uid()<>v_user_id then raise exception 'user mismatch'; end if;
 if auth.uid() is not null and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'permanent account required'; end if;
 if not exists(select 1 from auth.users where id=v_user_id and not is_anonymous) then raise exception 'permanent account required'; end if;
 if v_user_at>now()+interval '5 minutes' or v_misaki_at>now()+interval '5 minutes' then raise exception 'future timestamp not allowed'; end if;
 select * into v_before from public.misaki_relationship_state where user_id=v_user_id for update;
 if found and v_before.last_interaction_at is not null then v_elapsed_seconds:=greatest(floor(extract(epoch from(v_user_at-v_before.last_interaction_at)))::bigint,0); end if;
 insert into public.misaki_relationship_state(user_id,last_user_message_at,last_misaki_message_at,last_interaction_at,silence_started_at,state_updated_at)
 values(v_user_id,v_user_at,v_misaki_at,v_last_at,v_last_at,now())
 on conflict(user_id) do update set last_user_message_at=greatest(coalesce(misaki_relationship_state.last_user_message_at,excluded.last_user_message_at),excluded.last_user_message_at),last_misaki_message_at=greatest(coalesce(misaki_relationship_state.last_misaki_message_at,excluded.last_misaki_message_at),excluded.last_misaki_message_at),last_interaction_at=greatest(coalesce(misaki_relationship_state.last_interaction_at,excluded.last_interaction_at),excluded.last_interaction_at),silence_started_at=greatest(coalesce(misaki_relationship_state.silence_started_at,excluded.silence_started_at),excluded.silence_started_at),state_updated_at=now() returning * into v_after;
 insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata) values(v_user_id,'chat_turn',case when v_before.user_id is null then null else to_jsonb(v_before) end,to_jsonb(v_after),'normal chat turn completed',jsonb_build_object('user_message_at',v_user_at,'misaki_message_at',v_misaki_at,'silence_before_seconds',v_elapsed_seconds));
 return jsonb_build_object('ok',true,'silence_before_seconds',v_elapsed_seconds,'state',to_jsonb(v_after));
end $$;
revoke all on function public.record_relationship_chat_turn(timestamptz,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.record_relationship_chat_turn(timestamptz,timestamptz,uuid) to service_role;
