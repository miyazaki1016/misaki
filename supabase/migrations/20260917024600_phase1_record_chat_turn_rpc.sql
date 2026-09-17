create or replace function public.record_relationship_chat_turn(
  p_user_message_at timestamptz,
  p_misaki_message_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_before public.misaki_relationship_state%rowtype;
  v_after public.misaki_relationship_state%rowtype;
  v_user_at timestamptz := coalesce(p_user_message_at, now());
  v_misaki_at timestamptz := coalesce(p_misaki_message_at, now());
  v_last_at timestamptz := greatest(v_user_at, v_misaki_at);
  v_elapsed_seconds bigint := null;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'permanent account required';
  end if;

  if v_user_at > now() + interval '5 minutes' or v_misaki_at > now() + interval '5 minutes' then
    raise exception 'future timestamp not allowed';
  end if;

  select * into v_before
  from public.misaki_relationship_state
  where user_id = v_user_id
  for update;

  if found and v_before.last_interaction_at is not null then
    v_elapsed_seconds := greatest(floor(extract(epoch from (v_user_at - v_before.last_interaction_at)))::bigint, 0);
  end if;

  insert into public.misaki_relationship_state (
    user_id,
    last_user_message_at,
    last_misaki_message_at,
    last_interaction_at,
    silence_started_at,
    state_updated_at
  ) values (
    v_user_id,
    v_user_at,
    v_misaki_at,
    v_last_at,
    v_last_at,
    now()
  )
  on conflict (user_id) do update set
    last_user_message_at = greatest(coalesce(misaki_relationship_state.last_user_message_at, excluded.last_user_message_at), excluded.last_user_message_at),
    last_misaki_message_at = greatest(coalesce(misaki_relationship_state.last_misaki_message_at, excluded.last_misaki_message_at), excluded.last_misaki_message_at),
    last_interaction_at = greatest(coalesce(misaki_relationship_state.last_interaction_at, excluded.last_interaction_at), excluded.last_interaction_at),
    silence_started_at = greatest(coalesce(misaki_relationship_state.silence_started_at, excluded.silence_started_at), excluded.silence_started_at),
    state_updated_at = now()
  returning * into v_after;

  insert into public.misaki_relationship_events (
    user_id,
    event_type,
    before_state,
    after_state,
    reason,
    metadata
  ) values (
    v_user_id,
    'chat_turn',
    case when v_before.user_id is null then null else to_jsonb(v_before) end,
    to_jsonb(v_after),
    'normal chat turn completed',
    jsonb_build_object(
      'user_message_at', v_user_at,
      'misaki_message_at', v_misaki_at,
      'silence_before_seconds', v_elapsed_seconds
    )
  );

  return jsonb_build_object(
    'ok', true,
    'silence_before_seconds', v_elapsed_seconds,
    'state', to_jsonb(v_after)
  );
end;
$$;

revoke all on function public.record_relationship_chat_turn(timestamptz, timestamptz) from public, anon;
grant execute on function public.record_relationship_chat_turn(timestamptz, timestamptz) to authenticated;
