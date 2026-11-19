-- Branch-only: application + Edge + DB must be reviewed together. No Production execution.
-- Targets/pending confirmation contain sensitive identifiers: AES-GCM payload is owner-bound.
-- No historical chat, Relationship evidence, episodes, patterns or State are modified.
create table public.misaki_forget_controls (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload text not null check(length(payload) between 40 and 1000000),
 updated_at timestamptz not null default clock_timestamp()
);
alter table public.misaki_forget_controls enable row level security;
create trigger aaa_misaki_maintenance before insert or update or delete or truncate
 on public.misaki_forget_controls for each statement execute function misaki_operations.guard_root_write();
revoke all on table public.misaki_forget_controls from public,anon,authenticated;
grant select,insert,update on table public.misaki_forget_controls to service_role;

create function public.persist_misaki_forget_controls(p_user_id uuid,p_payload text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_payload is null or length(p_payload) not between 40 and 1000000 then raise exception 'verified forget payload required'; end if;
 insert into public.misaki_forget_controls(user_id,payload) values(p_user_id,p_payload)
 on conflict(user_id) do update set payload=excluded.payload,updated_at=clock_timestamp();
end $$;
revoke all on function public.persist_misaki_forget_controls(uuid,text) from public,anon,authenticated;
grant execute on function public.persist_misaki_forget_controls(uuid,text) to service_role;

create or replace function public.complete_misaki_chat_turn(p_user_id uuid,p_request_id uuid,p_message text,
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
  v_point_delta integer;
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

  -- Server clamps the application assessment so forged/out-of-range deltas cannot
  -- move the relationship by more than the intentionally small per-turn bound.
  -- Treat a missing or malformed application assessment as no point movement.
  -- The DB still clamps valid values to the intentionally small per-turn bound.
  begin
    v_point_delta:=greatest(-2,least(2,coalesce((p_result->>'relationshipPointDelta')::integer,0)));
  exception when invalid_text_representation or numeric_value_out_of_range then
    v_point_delta:=0;
  end;

  perform 1 from public.background_push_state where user_id=p_user_id for update;
  select updated_at into v_revision from public.misaki_user_conversation_state where user_id=p_user_id for update;
  if v_revision is distinct from (p_result->>'rootUpdatedAt')::timestamptz then
    raise exception 'conversation changed during generation';
  end if;
  perform public.persist_misaki_forget_controls(p_user_id,p_result->>'forgetControlPayload');
  insert into public.misaki_user_conversation_state(user_id) values(p_user_id) on conflict do nothing;
  select history into v_history from public.misaki_user_conversation_state where user_id=p_user_id for update;
  insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
  select * into v_state from public.misaki_relationship_state where user_id=p_user_id for update;
  v_before:=to_jsonb(v_state);
  v_silence:=greatest(0,floor(extract(epoch from (p_user_message_at-v_state.last_interaction_at)))::bigint);
  update public.misaki_relationship_state set intimacy_points=greatest(0,intimacy_points+v_point_delta),
    intimacy_level=case when greatest(0,intimacy_points+v_point_delta)>=160 then 'very_intimate'
      when greatest(0,intimacy_points+v_point_delta)>=80 then 'intimate'
      when greatest(0,intimacy_points+v_point_delta)>=30 then 'familiar' else 'initial' end,
    intimacy_migrated_at=coalesce(intimacy_migrated_at,v_now),state_updated_at=v_now where user_id=p_user_id;
  v_history:=coalesce(v_history,'[]') || jsonb_build_array(
    jsonb_build_object('role','user','text',p_message,'sentAt',p_user_message_at,'requestId',p_request_id),
    jsonb_build_object('role','misaki','text',p_result->>'reply','sentAt',v_now,'requestId',p_request_id));
  select coalesce(jsonb_agg(item order by ord),'[]') into v_history
    from jsonb_array_elements(v_history) with ordinality h(item,ord)
    where ord>greatest(jsonb_array_length(v_history)-60,0);
  update public.misaki_user_conversation_state set history=v_history,memory=p_result->'memory',
    today_memory=p_result->'misakiTodayMemory',message_count=message_count+2,
    user_message_count=user_message_count+1,updated_at=v_now where user_id=p_user_id;
  update public.misaki_relationship_state set last_user_message_at=p_user_message_at,
    last_misaki_message_at=v_now,last_interaction_at=v_now,silence_started_at=v_now,state_updated_at=v_now
    where user_id=p_user_id returning * into v_state;
  update public.background_push_state set recent_history=v_history,long_term_memory=p_result->'memory',
    today_memory=p_result->'misakiTodayMemory',updated_at=v_now where user_id=p_user_id;
  v_result:=(p_result - 'forgetControlPayload') || jsonb_build_object('relationshipPoints',v_state.intimacy_points,
    'relationshipPointDelta',v_point_delta,'memorySynced',true,'relationshipTimeSynced',true);
  insert into public.misaki_relationship_events(user_id,event_type,request_id,before_state,after_state,reason,metadata)
    values(p_user_id,'chat_turn_completed',p_request_id,v_before,to_jsonb(v_state),'normal chat turn completed',
      jsonb_build_object('message',p_message,'result',v_result,'silence_before_seconds',v_silence,
        'relationship_point_delta',v_point_delta));
  update public.daily_message_requests set completed_at=v_now where request_id=p_request_id;
  return v_result;
end $$;

revoke all on function public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb) to service_role;

drop function public.edit_misaki_conversation_state(uuid,text,text);
create function public.edit_misaki_conversation_state(p_user_id uuid,p_action text,p_value text default null,p_expected_updated_at timestamptz default null,p_forget_payload text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_state public.misaki_user_conversation_state%rowtype; v_revision timestamptz;
begin
  perform 1 from auth.users where id=p_user_id and not is_anonymous for update;
  if not found then raise exception 'permanent account required'; end if;
  perform 1 from public.background_push_state where user_id=p_user_id for update;
  select updated_at into v_revision from public.misaki_user_conversation_state where user_id=p_user_id for update;
  if v_revision is distinct from p_expected_updated_at then raise exception 'conversation changed during deletion'; end if;
  insert into public.misaki_user_conversation_state(user_id) values(p_user_id) on conflict do nothing;
  select * into v_state from public.misaki_user_conversation_state where user_id=p_user_id for update;
  perform public.persist_misaki_forget_controls(p_user_id,p_forget_payload);
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
revoke all on function public.edit_misaki_conversation_state(uuid,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.edit_misaki_conversation_state(uuid,text,text,timestamptz,text) to service_role;


drop function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid);
create or replace function public.save_misaki_temporary_state(
  p_user_id uuid,p_history jsonb,p_memory jsonb,p_today_memory jsonb,p_points integer,
  p_relationship jsonb default null,p_expected_revision uuid default null,p_forget_payload text default null
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_claims text:=current_setting('request.jwt.claims',true);
  v_event jsonb;
  v_primary text;
  v_intensity integer;
  v_action text;
  v_last_interaction timestamptz;
  v_event_created_at timestamptz;
begin
  perform 1 from auth.users where id=p_user_id and is_anonymous for update;
  if not found then raise exception 'anonymous account required'; end if;
  perform 1 from public.background_push_state where user_id=p_user_id for update;
  if (select revision from public.misaki_temporary_roots where user_id=p_user_id)
      is distinct from p_expected_revision then raise exception 'temporary state changed'; end if;
  if exists(select 1 from public.misaki_temporary_roots where user_id=p_user_id and expires_at<=clock_timestamp()) then
    raise exception 'temporary state expired'; end if;

  perform public.persist_misaki_forget_controls(p_user_id,p_forget_payload);

  -- A missing relationship payload is a legacy/no-op checkpoint. Never erase a
  -- relationship state that may already have been persisted by a prior retry.
  if p_relationship is null or jsonb_typeof(p_relationship) <> 'object' then
    v_primary:=null;
  else
    v_primary:=coalesce(p_relationship->>'emotionPrimary','neutral');
  end if;
  begin
    v_intensity:=greatest(0,least(100,coalesce((p_relationship->>'emotionIntensity')::integer,0)));
  exception when invalid_text_representation then
    v_intensity:=0;
  end;
  v_action:=coalesce(p_relationship->>'actionState','NORMAL');
  begin
    v_last_interaction:=nullif(p_relationship->>'lastInteractionAt','')::timestamptz;
  exception when invalid_datetime_format then
    v_last_interaction:=null;
  end;
  if v_primary not in ('neutral','happy','affectionate','concerned','hurt','sulky','guarded') then v_primary:='neutral'; end if;
  if v_action not in ('NORMAL','WAIT','TEASE','SULK','CHASE','PULL','RECONNECT') then v_action:='NORMAL'; end if;

  if v_primary is null then
    insert into public.misaki_relationship_state(user_id,intimacy_points,intimacy_level,intimacy_migrated_at)
      values(p_user_id,greatest(0,p_points),case when p_points>=160 then 'very_intimate' when p_points>=80 then 'intimate'
        when p_points>=30 then 'familiar' else 'initial' end,now())
      on conflict(user_id) do update set intimacy_points=excluded.intimacy_points,
        intimacy_level=excluded.intimacy_level,intimacy_migrated_at=excluded.intimacy_migrated_at,
        state_updated_at=now();
  else
    insert into public.misaki_relationship_state(user_id,intimacy_points,intimacy_level,intimacy_migrated_at,emotion_state,action_state,last_interaction_at)
      values(p_user_id,greatest(0,p_points),case when p_points>=160 then 'very_intimate' when p_points>=80 then 'intimate'
        when p_points>=30 then 'familiar' else 'initial' end,now(),
        jsonb_build_object('primary',v_primary,'intensity',v_intensity,'source','temporary_checkpoint'),
        v_action,v_last_interaction)
      on conflict(user_id) do update set intimacy_points=excluded.intimacy_points,
        intimacy_level=excluded.intimacy_level,intimacy_migrated_at=excluded.intimacy_migrated_at,
        emotion_state=excluded.emotion_state,action_state=excluded.action_state,
        last_interaction_at=excluded.last_interaction_at,state_updated_at=now();
  end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',p_user_id,'is_anonymous',true)::text,true);
  insert into public.misaki_user_conversation_state(user_id,history,memory,today_memory,message_count,user_message_count,updated_at)
    values(p_user_id,p_history,p_memory,p_today_memory,jsonb_array_length(p_history),
      (select count(*) from jsonb_array_elements(p_history) h where h->>'role'='user'),now())
    on conflict(user_id) do update set history=excluded.history,memory=excluded.memory,today_memory=excluded.today_memory,
      message_count=excluded.message_count,user_message_count=excluded.user_message_count,updated_at=now();
  perform set_config('request.jwt.claims',coalesce(v_claims,''),true);

  -- Rebuild only the compact semantic events from the authenticated temporary root.
  -- A retry therefore replaces, rather than duplicates, the imported trajectory.
  if v_primary is not null then
    delete from public.misaki_relationship_events
      where user_id=p_user_id and event_type='temporary_relationship_checkpoint';
  for v_event in select value from jsonb_array_elements(coalesce(p_relationship->'events','[]'::jsonb))
  loop
    -- The encrypted root is server-produced, but a malformed legacy timestamp
    -- must not make email-save fail or destroy the rest of the checkpoint.
    begin
      v_event_created_at:=coalesce(nullif(v_event->>'created_at','')::timestamptz,now());
    exception when invalid_datetime_format or datetime_field_overflow then
      v_event_created_at:=now();
    end;
    insert into public.misaki_relationship_events(user_id,event_type,reason,metadata,created_at)
    values(p_user_id,'temporary_relationship_checkpoint','verified anonymous relationship trajectory',
      jsonb_build_object('signal_summary',coalesce(v_event->'metadata'->'signal_summary','[]'::jsonb)),
      v_event_created_at);
  end loop;
  end if;

  insert into public.misaki_relationship_events(user_id,event_type,reason,metadata)
    values(p_user_id,'email_save_checkpoint','latest verified temporary state checkpoint',
      jsonb_build_object('points',p_points,'history_count',jsonb_array_length(p_history)))
    on conflict(user_id) where event_type='email_save_checkpoint'
    do update set metadata=excluded.metadata,reason=excluded.reason;
  return jsonb_build_object('saved',true);
end $$;

revoke all on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid,text) to service_role;


-- The canonical root writer previously called the retired six-argument
-- checkpoint. Replace it so retry-after-email-failure keeps carrying the
-- latest relationship trajectory from the verified encrypted root.
create or replace function public.write_misaki_temporary_root(
  p_user_id uuid,p_token text,p_state jsonb,p_expected_revision uuid,
  p_refresh_expiry boolean default true
)
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

  if nullif(p_state->>'forgetControlPayload','') is null then raise exception 'verified forget payload required'; end if;
  insert into public.misaki_temporary_roots(user_id,token,revision,expires_at)
    values(p_user_id,p_token,v_new,clock_timestamp()+interval '24 hours')
    on conflict(user_id) do update set token=excluded.token,revision=excluded.revision,
      expires_at=case when p_refresh_expiry then excluded.expires_at else misaki_temporary_roots.expires_at end;

  if exists(select 1 from public.misaki_relationship_events
      where user_id=p_user_id and event_type='email_save_checkpoint') then
    perform public.save_misaki_temporary_state(
      p_user_id,
      p_state->'history',
      p_state->'memory',
      p_state->'todayMemory',
      (p_state->>'relationshipPoints')::integer,
      p_state->'temporaryRelationship',
      v_new,
      p_state->>'forgetControlPayload'
    );
  end if;
  return v_new;
end $$;

revoke all on function public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean)
  from public,anon,authenticated;
grant execute on function public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean)
  to service_role;
