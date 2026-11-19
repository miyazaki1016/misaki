-- The canonical receipt and its pending reducer input commit together.
create table public.misaki_emotion_turns (
  event_id bigint primary key references public.misaki_relationship_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  input jsonb,
  unique (user_id, request_id)
);
create index misaki_emotion_turns_pending on public.misaki_emotion_turns (user_id, event_id)
  where input is not null;
alter table public.misaki_emotion_turns enable row level security;
revoke all on public.misaki_emotion_turns from public, anon, authenticated;
grant select, insert, update on public.misaki_emotion_turns to service_role;

create function public.complete_misaki_chat_turn_with_emotion(
  p_user_id uuid, p_request_id uuid, p_message text, p_user_message_at timestamptz,
  p_result jsonb, p_emotion_input jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_result jsonb;
  v_replay boolean;
begin
  perform 1 from auth.users where id = p_user_id and not is_anonymous for update;
  if not found then raise exception 'permanent account required'; end if;

  select exists (
    select 1 from public.misaki_relationship_events
    where user_id = p_user_id and request_id = p_request_id and event_type = 'chat_turn_completed'
  ) into v_replay;
  v_result := public.complete_misaki_chat_turn(p_user_id, p_request_id, p_message, p_user_message_at, p_result);
  if not v_replay then
    if jsonb_typeof(p_emotion_input) is distinct from 'object' then
      raise exception 'emotion input required';
    end if;
    insert into public.misaki_emotion_turns (event_id, user_id, request_id, input)
    select id, user_id, request_id, p_emotion_input
    from public.misaki_relationship_events
    where user_id = p_user_id and request_id = p_request_id and event_type = 'chat_turn_completed';
    if not found then raise exception 'canonical event required'; end if;
  end if;
  return v_result;
end;
$$;

create function public.apply_misaki_queued_emotion(
  p_user_id uuid, p_request_id uuid, p_expected_state_updated_at timestamptz,
  p_primary text, p_intensity integer, p_action text, p_direction text,
  p_emotion_reason text, p_action_reason text, p_evidence jsonb, p_signal_summary jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_request uuid;
  v_revision timestamptz;
  v_result jsonb;
begin
  perform 1 from auth.users where id = p_user_id and not is_anonymous for update;
  if not found then raise exception 'permanent account required'; end if;
  if exists (
    select 1 from public.misaki_emotion_turns
    where user_id = p_user_id and request_id = p_request_id and input is null
  ) then return jsonb_build_object('ok', true, 'replayed', true); end if;

  select request_id into v_request from public.misaki_emotion_turns
  where user_id = p_user_id and input is not null order by event_id limit 1;
  if not found or v_request is distinct from p_request_id then
    return jsonb_build_object('ok', false, 'conflict', true);
  end if;

  select state_updated_at into v_revision from public.misaki_relationship_state
  where user_id = p_user_id for update;
  if not found or v_revision is distinct from p_expected_state_updated_at then
    return jsonb_build_object('ok', false, 'conflict', true);
  end if;

  v_result := public.apply_relationship_emotion_action_v2(
    p_primary, p_intensity, p_action, p_direction, p_emotion_reason, p_action_reason,
    p_evidence, p_signal_summary, p_expected_state_updated_at, p_user_id
  );
  if v_result->>'ok' = 'true' then
    update public.misaki_emotion_turns set input = null
    where user_id = p_user_id and request_id = p_request_id;
  end if;
  return v_result;
end;
$$;

revoke all on function public.complete_misaki_chat_turn_with_emotion(uuid,uuid,text,timestamptz,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.complete_misaki_chat_turn_with_emotion(uuid,uuid,text,timestamptz,jsonb,jsonb) to service_role;
revoke all on function public.apply_misaki_queued_emotion(uuid,uuid,timestamptz,text,integer,text,text,text,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.apply_misaki_queued_emotion(uuid,uuid,timestamptz,text,integer,text,text,text,text,jsonb,jsonb) to service_role;
