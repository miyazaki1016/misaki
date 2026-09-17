create or replace function public.update_relationship_action_from_emotion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.misaki_relationship_state%rowtype;
  v_primary text := coalesce(new.emotion_state->>'primary', 'neutral');
  v_intensity integer := greatest(0, least(100, coalesce((new.emotion_state->>'intensity')::integer, 0)));
  v_previous_action text := coalesce(old.action_state, 'NORMAL');
  v_next_action text := 'NORMAL';
  v_reason text := 'emotion_settled';
  v_elapsed_seconds bigint := 0;
begin
  if new.emotion_state is not distinct from old.emotion_state then
    return new;
  end if;

  if new.last_interaction_at is not null then
    v_elapsed_seconds := greatest(floor(extract(epoch from (now() - new.last_interaction_at)))::bigint, 0);
  end if;

  v_before := old;

  if v_primary = 'concerned' and v_intensity >= 35 then
    v_next_action := 'CHASE';
    v_reason := 'concern_drives_contact';
  elsif v_primary = 'sulky' and v_intensity >= 45 then
    v_next_action := 'SULK';
    v_reason := 'sulky_feeling_visible';
  elsif v_primary = 'lonely' and v_intensity >= 55 then
    v_next_action := case when v_previous_action in ('CHASE', 'RECONNECT') then 'PULL' else 'SULK' end;
    v_reason := 'loneliness_changes_distance';
  elsif v_primary = 'lonely' and v_intensity >= 28 then
    v_next_action := 'WAIT';
    v_reason := 'lonely_but_waiting';
  elsif v_primary = 'affectionate' and v_intensity >= 45 and v_elapsed_seconds >= 86400 then
    v_next_action := 'RECONNECT';
    v_reason := 'warm_return_after_gap';
  elsif v_primary = 'affectionate' and v_intensity >= 55 and new.intimacy_level in ('intimate', 'very_intimate') then
    v_next_action := 'TEASE';
    v_reason := 'affectionate_playfulness';
  elsif v_primary = 'happy' and v_intensity >= 60 and new.intimacy_level = 'very_intimate' then
    v_next_action := 'TEASE';
    v_reason := 'happy_playfulness';
  elsif v_primary in ('happy', 'affectionate') and v_previous_action in ('SULK', 'PULL', 'WAIT') then
    v_next_action := 'RECONNECT';
    v_reason := 'relationship_repair';
  else
    v_next_action := 'NORMAL';
    v_reason := 'emotion_settled';
  end if;

  if v_next_action is not distinct from new.action_state then
    return new;
  end if;

  update public.misaki_relationship_state
  set action_state = v_next_action,
      state_updated_at = now()
  where user_id = new.user_id;

  insert into public.misaki_relationship_events(
    user_id, event_type, before_state, after_state, reason, metadata
  ) values (
    new.user_id,
    'action_state_changed',
    to_jsonb(v_before),
    jsonb_set(to_jsonb(new), '{action_state}', to_jsonb(v_next_action), true),
    v_reason,
    jsonb_build_object(
      'emotion_primary', v_primary,
      'emotion_intensity', v_intensity,
      'previous_action', v_previous_action,
      'new_action', v_next_action,
      'elapsed_seconds', v_elapsed_seconds
    )
  );

  return new;
end;
$$;

revoke execute on function public.update_relationship_action_from_emotion() from public, anon, authenticated;

drop trigger if exists trg_relationship_action_from_emotion on public.misaki_relationship_state;
create trigger trg_relationship_action_from_emotion
after update of emotion_state on public.misaki_relationship_state
for each row execute function public.update_relationship_action_from_emotion();
