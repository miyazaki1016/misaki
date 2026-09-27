-- Preserve the verified anonymous relationship trajectory at the email checkpoint.
-- The encrypted temporary root remains authoritative input; callers cannot submit
-- arbitrary plaintext relationship history.
-- Replace the old six-argument checkpoint signature so stale callers cannot
-- bypass relationship preservation.
drop function if exists public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,uuid);

create or replace function public.save_misaki_temporary_state(
  p_user_id uuid,p_history jsonb,p_memory jsonb,p_today_memory jsonb,p_points integer,
  p_relationship jsonb default null,p_expected_revision uuid default null
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_claims text:=current_setting('request.jwt.claims',true);
  v_event jsonb;
  v_primary text;
  v_intensity integer;
  v_action text;
  v_last_interaction timestamptz;
begin
  perform 1 from auth.users where id=p_user_id and is_anonymous for update;
  if not found then raise exception 'anonymous account required'; end if;
  perform 1 from public.background_push_state where user_id=p_user_id for update;
  if (select revision from public.misaki_temporary_roots where user_id=p_user_id)
      is distinct from p_expected_revision then raise exception 'temporary state changed'; end if;
  if exists(select 1 from public.misaki_temporary_roots where user_id=p_user_id and expires_at<=clock_timestamp()) then
    raise exception 'temporary state expired'; end if;

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
    insert into public.misaki_relationship_events(user_id,event_type,reason,metadata,created_at)
    values(p_user_id,'temporary_relationship_checkpoint','verified anonymous relationship trajectory',
      jsonb_build_object('signal_summary',coalesce(v_event->'metadata'->'signal_summary','[]'::jsonb)),
      case
        when nullif(v_event->>'created_at','') is null then now()
        else (v_event->>'created_at')::timestamptz
      end);
  end loop;
  end if;

  insert into public.misaki_relationship_events(user_id,event_type,reason,metadata)
    values(p_user_id,'email_save_checkpoint','latest verified temporary state checkpoint',
      jsonb_build_object('points',p_points,'history_count',jsonb_array_length(p_history)))
    on conflict(user_id) where event_type='email_save_checkpoint'
    do update set metadata=excluded.metadata,reason=excluded.reason;
  return jsonb_build_object('saved',true);
end $$;

revoke all on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid) to service_role;


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
      v_new
    );
  end if;
  return v_new;
end $$;

revoke all on function public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean)
  from public,anon,authenticated;
grant execute on function public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean)
  to service_role;
