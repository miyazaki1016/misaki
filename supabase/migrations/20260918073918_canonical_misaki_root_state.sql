-- Shared, encrypted, expiring anonymous transport root. Unlike immutable turn
-- receipts, this advances on chat, explicit edits and successful Body Clock delivery.
-- No anonymous plaintext permanent root exists until email saving is requested.
create table public.misaki_temporary_roots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  revision uuid not null default gen_random_uuid(),
  expires_at timestamptz not null
);
alter table public.misaki_temporary_roots enable row level security;
revoke all on public.misaki_temporary_roots from public,anon,authenticated;
grant select,insert,update,delete on public.misaki_temporary_roots to service_role;
create unique index misaki_email_checkpoint_user_idx on public.misaki_relationship_events(user_id)
  where event_type='email_save_checkpoint';

alter table public.daily_message_requests add column if not exists refunded_at timestamptz;
alter table public.daily_message_requests add column completed_at timestamptz,
  add column temporary_result text, add column message_hash text, add column parent_hash text;
create index daily_message_temporary_completed_idx
  on public.daily_message_requests(user_id, completed_at desc)
  where temporary_result is not null;
-- One-time server-only backfill. A successful retained turn is a user message
-- immediately followed by a Misaki reply. Browser numbers are never imported.
alter table public.misaki_relationship_state add column intimacy_migrated_at timestamptz;
alter table public.misaki_user_conversation_state add column today_memory jsonb not null default '{"date":"","items":[]}'::jsonb;
alter table public.misaki_relationship_events add column request_id uuid;
create unique index misaki_relationship_completed_request_idx
  on public.misaki_relationship_events(user_id, request_id)
  where event_type = 'chat_turn_completed';

with sources as (
  select u.id user_id, greatest(coalesce(r.intimacy_points,0), coalesce(b.relationship_points,0),
    coalesce((select count(*)::integer from jsonb_array_elements(coalesce(c.history,'[]')) with ordinality h(item,ord)
      where item->>'role'='misaki' and ord>1 and c.history->(ord::integer-2)->>'role'='user'),0)) points
  from auth.users u
  left join public.misaki_relationship_state r on r.user_id=u.id
  left join public.background_push_state b on b.user_id=u.id
  left join public.misaki_user_conversation_state c on c.user_id=u.id
  where not u.is_anonymous
)
insert into public.misaki_relationship_state(user_id,intimacy_points,intimacy_level,intimacy_migrated_at)
select user_id, points, case when points>=160 then 'very_intimate' when points>=80 then 'intimate'
  when points>=30 then 'familiar' else 'initial' end, now() from sources
on conflict(user_id) do update set intimacy_points=excluded.intimacy_points,
  intimacy_level=excluded.intimacy_level,intimacy_migrated_at=excluded.intimacy_migrated_at
where misaki_relationship_state.intimacy_migrated_at is null;

insert into public.misaki_relationship_events(user_id,event_type,after_state,reason,metadata)
select r.user_id,'intimacy_migration',to_jsonb(r),'one-time server records backfill',
  jsonb_build_object('sources',jsonb_build_array('existing_intimacy','legacy_push_snapshot','retained_completed_pairs'),
    'client_values_imported',false,'history_limit',60)
from public.misaki_relationship_state r where r.intimacy_migrated_at is not null;

-- Preserve today's server-visible memory once; all subsequent writes are server-owned.
update public.misaki_user_conversation_state c set today_memory=b.today_memory
from public.background_push_state b where b.user_id=c.user_id;

-- Service-only successful-turn commit: usage proof, history/memory, timestamps,
-- points and replay result become visible together, or none of them do.
create function public.complete_misaki_chat_turn(p_user_id uuid,p_request_id uuid,p_message text,
  p_user_message_at timestamptz,p_result jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_state public.misaki_relationship_state%rowtype;
  v_before jsonb;
  v_history jsonb;
  v_result jsonb;
  v_message text;
  v_now timestamptz:=clock_timestamp();
  v_silence bigint;
  v_revision timestamptz;
begin
  select metadata->'result',metadata->>'message' into v_result,v_message
    from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id
      and event_type='chat_turn_completed';
  if found then
    if v_message is distinct from p_message then raise exception 'request_id_message_mismatch'; end if;
    return v_result;
  end if;
  perform 1 from auth.users where id=p_user_id and not is_anonymous for update;
  if not found then raise exception 'permanent account required'; end if;
  -- The auth row serializes competing requests for this account. Recheck replay.
  select metadata->'result',metadata->>'message' into v_result,v_message
    from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id
      and event_type='chat_turn_completed';
  if found then
    if v_message is distinct from p_message then raise exception 'request_id_message_mismatch'; end if;
    return v_result;
  end if;
  perform 1 from public.daily_message_requests where request_id=p_request_id and user_id=p_user_id
    and allowed and processed and refunded_at is null and completed_at is null for update;
  if not found then raise exception 'valid usage request required'; end if;
  if nullif(btrim(p_result->>'reply'),'') is null or nullif(btrim(p_message),'') is null then
    raise exception 'completed reply required'; end if;
  if jsonb_typeof(p_result->'memory') is distinct from 'array' then raise exception 'invalid memory'; end if;
  -- Keep the Body Clock lock order: delivery state -> conversation -> relationship.
  perform 1 from public.background_push_state where user_id=p_user_id for update;
  select updated_at into v_revision from public.misaki_user_conversation_state where user_id=p_user_id for update;
  if v_revision is distinct from (p_result->>'rootUpdatedAt')::timestamptz then
    raise exception 'conversation changed during generation';
  end if;
  insert into public.misaki_user_conversation_state(user_id) values(p_user_id) on conflict do nothing;
  select history into v_history from public.misaki_user_conversation_state where user_id=p_user_id for update;
  insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
  select * into v_state from public.misaki_relationship_state where user_id=p_user_id for update;
  v_before:=to_jsonb(v_state);
  v_silence:=greatest(0,floor(extract(epoch from (p_user_message_at-v_state.last_interaction_at)))::bigint);
  update public.misaki_relationship_state set intimacy_points=intimacy_points+1,
    intimacy_level=case when intimacy_points+1>=160 then 'very_intimate' when intimacy_points+1>=80 then 'intimate'
      when intimacy_points+1>=30 then 'familiar' else 'initial' end,
    intimacy_migrated_at=coalesce(intimacy_migrated_at,v_now),state_updated_at=v_now where user_id=p_user_id;
  v_history:=coalesce(v_history,'[]') || jsonb_build_array(
    jsonb_build_object('role','user','text',p_message,'sentAt',p_user_message_at,'requestId',p_request_id),
    jsonb_build_object('role','misaki','text',p_result->>'reply','sentAt',v_now,'requestId',p_request_id));
  select coalesce(jsonb_agg(item order by ord),'[]') into v_history
    from jsonb_array_elements(v_history) with ordinality h(item,ord)
    where ord>greatest(jsonb_array_length(v_history)-60,0);
  -- Existing conversation -> emotion -> action triggers remain attached.
  update public.misaki_user_conversation_state set history=v_history,memory=p_result->'memory',
    today_memory=p_result->'misakiTodayMemory',message_count=message_count+2,
    user_message_count=user_message_count+1,updated_at=v_now where user_id=p_user_id;
  update public.misaki_relationship_state set last_user_message_at=p_user_message_at,
    last_misaki_message_at=v_now,last_interaction_at=v_now,silence_started_at=v_now,state_updated_at=v_now
    where user_id=p_user_id returning * into v_state;
  update public.background_push_state set recent_history=v_history,long_term_memory=p_result->'memory',
    today_memory=p_result->'misakiTodayMemory',updated_at=v_now where user_id=p_user_id;
  v_result:=p_result || jsonb_build_object('relationshipPoints',v_state.intimacy_points,
    'memorySynced',true,'relationshipTimeSynced',true);
  insert into public.misaki_relationship_events(user_id,event_type,request_id,before_state,after_state,reason,metadata)
    values(p_user_id,'chat_turn_completed',p_request_id,v_before,to_jsonb(v_state),'normal chat turn completed',
      jsonb_build_object('message',p_message,'result',v_result,'silence_before_seconds',v_silence));
  update public.daily_message_requests set completed_at=v_now where request_id=p_request_id;
  return v_result;
end $$;
revoke all on function public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb) to service_role;

-- Anonymous transport receipt, not a permanent conversation/root row. Store only
-- the encrypted, expiring browser-session response so concurrent/lost responses
-- replay exactly once. No plaintext anonymous memory/history is persisted here.
create function public.complete_misaki_temporary_turn(p_user_id uuid,p_request_id uuid,
  p_message_hash text,p_parent_hash text,p_token text,p_expected_revision uuid default null,p_state jsonb default null)
returns text language plpgsql security invoker set search_path = '' as $$
declare v_request public.daily_message_requests%rowtype;
begin
  perform 1 from auth.users where id=p_user_id and is_anonymous for update;
  if not found then raise exception 'anonymous account required'; end if;
  select * into v_request from public.daily_message_requests where request_id=p_request_id and user_id=p_user_id for update;
  if not found or not v_request.allowed or not v_request.processed or v_request.refunded_at is not null then
    raise exception 'valid usage request required'; end if;
  if v_request.completed_at is not null then
    if v_request.message_hash is distinct from p_message_hash or v_request.parent_hash is distinct from p_parent_hash then
      raise exception 'request_id_message_mismatch'; end if;
    return v_request.temporary_result;
  end if;
  perform public.write_misaki_temporary_root(p_user_id,p_token,p_state,p_expected_revision);
  update public.daily_message_requests set completed_at=clock_timestamp(),temporary_result=p_token,
    message_hash=p_message_hash,parent_hash=p_parent_hash where request_id=p_request_id;
  return p_token;
end $$;
revoke all on function public.complete_misaki_temporary_turn(uuid,uuid,text,text,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.complete_misaki_temporary_turn(uuid,uuid,text,text,text,uuid,jsonb) to service_role;

-- Refreshable pre-confirmation checkpoint. Permanent accounts cannot import again.
-- The application decrypts the latest server root; revision rejects stale saves.
create function public.save_misaki_temporary_state(p_user_id uuid,p_history jsonb,p_memory jsonb,
  p_today_memory jsonb,p_points integer,p_expected_revision uuid default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_claims text:=current_setting('request.jwt.claims',true);
begin
  perform 1 from auth.users where id=p_user_id and is_anonymous for update;
  if not found then raise exception 'anonymous account required'; end if;
  perform 1 from public.background_push_state where user_id=p_user_id for update;
  if (select revision from public.misaki_temporary_roots where user_id=p_user_id)
      is distinct from p_expected_revision then raise exception 'temporary state changed'; end if;
  if exists(select 1 from public.misaki_temporary_roots where user_id=p_user_id and expires_at<=clock_timestamp()) then
    raise exception 'temporary state expired'; end if;
  insert into public.misaki_relationship_state(user_id,intimacy_points,intimacy_level,intimacy_migrated_at)
    values(p_user_id,greatest(0,p_points),case when p_points>=160 then 'very_intimate' when p_points>=80 then 'intimate'
      when p_points>=30 then 'familiar' else 'initial' end,now())
    on conflict(user_id) do update set intimacy_points=excluded.intimacy_points,
      intimacy_level=excluded.intimacy_level,intimacy_migrated_at=excluded.intimacy_migrated_at;
  -- Match the existing anonymous checkpoint: do not run emotion inference while
  -- the user is still anonymous. Restore the service JWT claims immediately.
  perform set_config('request.jwt.claims',jsonb_build_object('sub',p_user_id,'is_anonymous',true)::text,true);
  insert into public.misaki_user_conversation_state(user_id,history,memory,today_memory,message_count,user_message_count,updated_at)
    values(p_user_id,p_history,p_memory,p_today_memory,jsonb_array_length(p_history),
      (select count(*) from jsonb_array_elements(p_history) h where h->>'role'='user'),now())
    on conflict(user_id) do update set history=excluded.history,memory=excluded.memory,today_memory=excluded.today_memory,
      message_count=excluded.message_count,user_message_count=excluded.user_message_count,updated_at=now();
  perform set_config('request.jwt.claims',coalesce(v_claims,''),true);
  insert into public.misaki_relationship_events(user_id,event_type,reason,metadata)
    values(p_user_id,'email_save_checkpoint','latest verified temporary state checkpoint',
      jsonb_build_object('points',p_points,'history_count',jsonb_array_length(p_history)))
    on conflict(user_id) where event_type='email_save_checkpoint'
    do update set metadata=excluded.metadata,reason=excluded.reason;
  return jsonb_build_object('saved',true);
end $$;
revoke all on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,uuid) from public,anon,authenticated;
grant execute on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,uuid) to service_role;

-- Explicit user commands are separate from automatic display-cache sync.
create function public.edit_misaki_conversation_state(p_user_id uuid,p_action text,p_value text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_state public.misaki_user_conversation_state%rowtype;
begin
  perform 1 from auth.users where id=p_user_id and not is_anonymous for update;
  if not found then raise exception 'permanent account required'; end if;
  perform 1 from public.background_push_state where user_id=p_user_id for update;
  insert into public.misaki_user_conversation_state(user_id) values(p_user_id) on conflict do nothing;
  select * into v_state from public.misaki_user_conversation_state where user_id=p_user_id for update;
  if p_action='deleteMemory' then
    select coalesce(jsonb_agg(item order by ord),'[]') into v_state.memory
    from jsonb_array_elements(v_state.memory) with ordinality a(item,ord) where item #>> '{}' is distinct from p_value;
  elsif p_action='clearMemory' then v_state.memory:='[]';
  elsif p_action='clearHistory' then v_state.history:='[]';
  else raise exception 'invalid action'; end if;
  update public.misaki_user_conversation_state set memory=v_state.memory,history=v_state.history,updated_at=now()
    where user_id=p_user_id;
  update public.background_push_state set long_term_memory=v_state.memory,recent_history=v_state.history,updated_at=now()
    where user_id=p_user_id;
  return jsonb_build_object('memory',v_state.memory,'history',v_state.history);
end $$;
revoke all on function public.edit_misaki_conversation_state(uuid,text,text) from public,anon,authenticated;
grant execute on function public.edit_misaki_conversation_state(uuid,text,text) to service_role;

-- Display caches can no longer write personality/memory via the old public RPCs.
revoke execute on function public.sync_user_conversation_state(jsonb,jsonb) from authenticated;
revoke execute on function public.save_anonymous_conversation_state(jsonb,jsonb) from authenticated;
revoke execute on function public.record_relationship_chat_turn(timestamptz,timestamptz) from authenticated;
revoke execute on function public.append_proactive_to_conversation_state(text) from authenticated;

-- Keep the legacy Push number as a compatibility column only. It cannot be used
-- for later imports; Body Clock reads the canonical relationship row directly.
create function public.refresh_misaki_background_snapshot()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_conversation public.misaki_user_conversation_state%rowtype; v_points integer;
begin
  select * into v_conversation from public.misaki_user_conversation_state where user_id=new.user_id;
  select intimacy_points into v_points from public.misaki_relationship_state where user_id=new.user_id;
  new.relationship_points:=coalesce(v_points,0);
  new.recent_history:=coalesce(v_conversation.history,'[]');
  new.long_term_memory:=coalesce(v_conversation.memory,'[]');
  new.today_memory:=coalesce(v_conversation.today_memory,'{"date":"","items":[]}');
  return new;
end $$;
revoke all on function public.refresh_misaki_background_snapshot() from public,anon,authenticated;
create trigger trg_refresh_misaki_background_snapshot before insert or update
on public.background_push_state for each row execute function public.refresh_misaki_background_snapshot();

-- Do not let a failed concurrent replay refund a committed successful request.
-- Raising rolls back the entire refund RPC, including its earlier usage update.
create function public.guard_misaki_completed_turn_refund()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.refunded_at is null and new.refunded_at is not null and (old.completed_at is not null or exists (
    select 1 from public.misaki_relationship_events e where e.user_id=new.user_id
      and e.request_id=new.request_id and e.event_type='chat_turn_completed'
  )) then raise exception 'completed chat turn cannot be refunded'; end if;
  return new;
end $$;
revoke all on function public.guard_misaki_completed_turn_refund() from public,anon,authenticated;
create trigger trg_guard_misaki_completed_turn_refund before update of refunded_at
on public.daily_message_requests for each row execute function public.guard_misaki_completed_turn_refund();

-- All temporary writers use the same auth -> background -> temporary lock order.
-- Updating an email checkpoint is in the SAME transaction as the root/receipt.
create function public.write_misaki_temporary_root(p_user_id uuid,p_token text,p_state jsonb,p_expected_revision uuid,p_refresh_expiry boolean default true)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_revision uuid; v_new uuid:=gen_random_uuid();
begin
  perform 1 from auth.users where id=p_user_id and is_anonymous for update;
  if not found then raise exception 'anonymous account required'; end if;
  perform 1 from public.background_push_state where user_id=p_user_id for update;
  select revision into v_revision from public.misaki_temporary_roots where user_id=p_user_id for update;
  if v_revision is distinct from p_expected_revision then raise exception 'temporary state changed'; end if;
  if exists(select 1 from public.misaki_temporary_roots where user_id=p_user_id and expires_at<=clock_timestamp()) then
    raise exception 'temporary state expired'; end if;
  if p_token is null or jsonb_typeof(p_state->'history') is distinct from 'array'
    or jsonb_typeof(p_state->'memory') is distinct from 'array' then raise exception 'verified state required'; end if;
  insert into public.misaki_temporary_roots(user_id,token,revision,expires_at)
    values(p_user_id,p_token,v_new,clock_timestamp()+interval '24 hours')
    on conflict(user_id) do update set token=excluded.token,revision=excluded.revision,
      expires_at=case when p_refresh_expiry then excluded.expires_at else misaki_temporary_roots.expires_at end;
  if exists(select 1 from public.misaki_relationship_events where user_id=p_user_id and event_type='email_save_checkpoint') then
    perform public.save_misaki_temporary_state(p_user_id,p_state->'history',p_state->'memory',
      p_state->'todayMemory',(p_state->>'relationshipPoints')::integer,v_new);
  end if;
  return v_new;
end $$;
revoke all on function public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean) from public,anon,authenticated;
grant execute on function public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean) to service_role;

-- Replace the pre-foundation signature; prevent old writers bypassing root checks.
drop function public.finish_misaki_body_clock_delivery(uuid,timestamptz,text,text,text,jsonb,integer);
create or replace function public.finish_misaki_body_clock_delivery(
 p_user_id uuid, p_lease_until timestamptz, p_message text,
 p_photo_id text, p_photo_src text, p_photo_context jsonb, p_delay_minutes integer,
 p_expected_revision uuid default null,p_temporary_token text default null,p_temporary_state jsonb default null,
 p_expected_updated_at timestamptz default null
) returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
 s public.background_push_state%rowtype;
 v_now timestamptz := clock_timestamp();
 v_today date := (clock_timestamp() at time zone 'Asia/Tokyo')::date;
 v_count integer;
 v_id uuid;
 v_next timestamptz;
 v_history jsonb;
 v_anonymous boolean; v_revision timestamptz;
begin
 select is_anonymous into v_anonymous from auth.users where id=p_user_id for update;
 if not found then raise exception 'body_clock_account_unavailable'; end if;
 select * into s from public.background_push_state where user_id=p_user_id for update;
 if not found or s.next_push_at is distinct from p_lease_until or p_lease_until <= v_now then
   raise exception 'body_clock_lease_expired';
 end if;
 v_count := case when s.push_date=v_today then greatest(coalesce(s.pushes_today,0),0) else 0 end;
 if v_count >= 4 then raise exception 'body_clock_daily_limit'; end if;
 if nullif(btrim(p_message),'') is null then raise exception 'body_clock_empty_message'; end if;
 v_next := v_now + make_interval(mins => greatest(55,least(210,p_delay_minutes)));
 insert into public.misaki_proactive_deliveries(user_id,message,photo_id,photo_src,photo_context,status,delivered_at)
 values(p_user_id,p_message,p_photo_id,p_photo_src,coalesce(p_photo_context,'{}'::jsonb),'delivered',v_now)
 returning id into v_id;
 if v_anonymous then
   if p_temporary_token is null then raise exception 'temporary state required'; end if;
   if p_expected_revision is null then raise exception 'temporary state required'; end if;
   perform public.write_misaki_temporary_root(p_user_id,p_temporary_token,p_temporary_state,p_expected_revision,false);
 else
   select updated_at into v_revision from public.misaki_user_conversation_state where user_id=p_user_id for update;
   if v_revision is distinct from p_expected_updated_at then raise exception 'conversation changed during generation'; end if;
   insert into public.misaki_user_conversation_state(user_id) values(p_user_id) on conflict(user_id) do nothing;
 select history into v_history from public.misaki_user_conversation_state where user_id=p_user_id for update;
 if jsonb_typeof(v_history) is distinct from 'array' then v_history := '[]'::jsonb; end if;
 v_history := v_history || jsonb_build_array(jsonb_build_object('role','misaki','text',p_message,'sentAt',v_now));
 select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into v_history
 from jsonb_array_elements(v_history) with ordinality e(value,ord)
 where ord > greatest(0,jsonb_array_length(v_history)-60);
 update public.misaki_user_conversation_state
 set history=v_history, message_count=greatest(coalesce(message_count,0),0)+1, updated_at=v_now
 where user_id=p_user_id;
 end if;
 update public.background_push_state set last_push_at=v_now,next_push_at=v_next,
 push_date=v_today,pushes_today=v_count+1,last_background_message=p_message,updated_at=v_now
 where user_id=p_user_id;
 return jsonb_build_object('deliveryId',v_id,'nextPushAt',v_next,'pushesToday',v_count+1);
end $$;
revoke all on function public.finish_misaki_body_clock_delivery(uuid,timestamptz,text,text,text,jsonb,integer,uuid,text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.finish_misaki_body_clock_delivery(uuid,timestamptz,text,text,text,jsonb,integer,uuid,text,jsonb,timestamptz) to service_role;
