-- Relationship points are now a consequence of the assessed conversation meaning.
-- This replaces the fixed +1 inside the canonical successful-turn transaction.
-- Branch-only migration: do not apply to Production before cutover review.

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
  v_point_delta:=greatest(-2,least(2,coalesce((p_result->>'relationshipPointDelta')::integer,0)));

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
  v_result:=p_result || jsonb_build_object('relationshipPoints',v_state.intimacy_points,
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
