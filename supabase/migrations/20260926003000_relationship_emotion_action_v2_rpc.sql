-- Persist the v2 relationship reducers for permanent users.
-- The application derives meaning; this RPC atomically applies the resulting
-- emotion/action and records the compact signal summary consumed by relationship-patterns.ts.

create or replace function public.apply_relationship_emotion_action_v2(
  p_primary text,
  p_intensity integer,
  p_action text,
  p_direction text,
  p_emotion_reason text,
  p_action_reason text,
  p_evidence jsonb,
  p_signal_summary jsonb,
  p_expected_state_updated_at timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_state public.misaki_relationship_state%rowtype;
  v_before jsonb;
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'permanent account required';
  end if;
  if p_primary not in ('neutral','happy','affectionate','concerned','hurt','sulky','guarded') then
    raise exception 'invalid emotion';
  end if;
  if p_action not in ('NORMAL','WAIT','TEASE','SULK','CHASE','PULL','RECONNECT') then
    raise exception 'invalid action';
  end if;
  if p_intensity < 0 or p_intensity > 100 then raise exception 'invalid intensity'; end if;
  if jsonb_typeof(coalesce(p_signal_summary,'[]'::jsonb)) <> 'array' then
    raise exception 'invalid signal summary';
  end if;

  insert into public.misaki_relationship_state(user_id) values(v_user_id) on conflict do nothing;
  select * into v_state from public.misaki_relationship_state where user_id=v_user_id for update;

  if p_expected_state_updated_at is not null
     and v_state.state_updated_at is distinct from p_expected_state_updated_at then
    return jsonb_build_object('ok',false,'conflict',true);
  end if;

  v_before := to_jsonb(v_state);
  update public.misaki_relationship_state
    set emotion_state=jsonb_build_object('primary',p_primary,'intensity',p_intensity,'updated_at',v_now,'source','relationship_v2'),
        action_state=p_action,
        state_updated_at=v_now
    where user_id=v_user_id
    returning * into v_state;

  insert into public.misaki_relationship_events(
    user_id,event_type,before_state,after_state,reason,metadata
  ) values (
    v_user_id,'emotion_action_v2_after_chat',v_before,to_jsonb(v_state),
    coalesce(nullif(p_emotion_reason,''),'relationship_v2'),
    jsonb_build_object(
      'emotion_reason',coalesce(p_emotion_reason,''),
      'action_reason',coalesce(p_action_reason,''),
      'direction',coalesce(p_direction,''),
      'evidence',coalesce(p_evidence,'[]'::jsonb),
      'signal_summary',coalesce(p_signal_summary,'[]'::jsonb)
    )
  );

  return jsonb_build_object('ok',true,'conflict',false,'stateUpdatedAt',v_state.state_updated_at);
end;
$$;

revoke all on function public.apply_relationship_emotion_action_v2(text,integer,text,text,text,text,jsonb,jsonb,timestamptz)
  from public,anon,authenticated;
grant execute on function public.apply_relationship_emotion_action_v2(text,integer,text,text,text,text,jsonb,jsonb,timestamptz)
  to authenticated,service_role;
