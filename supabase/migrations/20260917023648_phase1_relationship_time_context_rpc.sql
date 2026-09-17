create or replace function public.get_relationship_time_context()
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_state public.misaki_relationship_state%rowtype;
  v_now timestamptz := now();
  v_elapsed_seconds bigint := 0;
  v_elapsed_hours numeric := 0;
  v_band text := 'new';
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'permanent account required';
  end if;

  select *
    into v_state
    from public.misaki_relationship_state
   where user_id = v_user_id;

  if not found then
    return jsonb_build_object(
      'exists', false,
      'now', v_now,
      'elapsed_seconds', 0,
      'elapsed_hours', 0,
      'time_band', 'new',
      'intimacy_level', 'initial',
      'intimacy_points', 0,
      'emotion_state', jsonb_build_object('primary','neutral','intensity',0),
      'action_state', 'NORMAL',
      'last_user_message_at', null,
      'last_misaki_message_at', null,
      'last_interaction_at', null,
      'silence_started_at', null
    );
  end if;

  if v_state.last_interaction_at is not null then
    v_elapsed_seconds := greatest(
      floor(extract(epoch from (v_now - v_state.last_interaction_at)))::bigint,
      0
    );
    v_elapsed_hours := round((v_elapsed_seconds::numeric / 3600), 2);
    v_band := case
      when v_elapsed_seconds < 21600 then 'recent'
      when v_elapsed_seconds < 86400 then 'same_day'
      when v_elapsed_seconds < 259200 then 'one_to_three_days'
      when v_elapsed_seconds < 604800 then 'three_to_seven_days'
      else 'seven_plus_days'
    end;
  end if;

  return jsonb_build_object(
    'exists', true,
    'now', v_now,
    'elapsed_seconds', v_elapsed_seconds,
    'elapsed_hours', v_elapsed_hours,
    'time_band', v_band,
    'intimacy_level', v_state.intimacy_level,
    'intimacy_points', v_state.intimacy_points,
    'emotion_state', v_state.emotion_state,
    'action_state', v_state.action_state,
    'last_user_message_at', v_state.last_user_message_at,
    'last_misaki_message_at', v_state.last_misaki_message_at,
    'last_interaction_at', v_state.last_interaction_at,
    'silence_started_at', v_state.silence_started_at
  );
end;
$$;

revoke all on function public.get_relationship_time_context() from public, anon;
grant execute on function public.get_relationship_time_context() to authenticated, service_role;
