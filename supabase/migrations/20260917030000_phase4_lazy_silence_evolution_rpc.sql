drop function if exists public.advance_relationship_silence_state();

create function public.advance_relationship_silence_state()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_state public.misaki_relationship_state%rowtype;
  v_before jsonb;
  v_now timestamptz := now();
  v_elapsed bigint := 0;
  v_primary text;
  v_intensity integer;
  v_next_primary text;
  v_next_intensity integer;
  v_next_action text;
  v_reason text := null;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then raise exception 'permanent account required'; end if;

  select * into v_state
  from public.misaki_relationship_state
  where user_id = v_user_id
  for update;

  if not found or v_state.last_interaction_at is null then return null; end if;

  v_before := to_jsonb(v_state);
  v_elapsed := greatest(floor(extract(epoch from (v_now - v_state.last_interaction_at)))::bigint, 0);
  v_primary := coalesce(v_state.emotion_state->>'primary', 'neutral');
  v_intensity := greatest(0, least(100, coalesce((v_state.emotion_state->>'intensity')::integer, 0)));
  v_next_primary := v_primary;
  v_next_intensity := v_intensity;
  v_next_action := v_state.action_state;

  -- Silence alone never proves loneliness. It only evolves an existing
  -- relational emotion, with intimacy and elapsed time as context.
  if v_primary = 'concerned' and v_elapsed >= 86400 then
    v_next_intensity := greatest(v_intensity - 15, 12);
    v_reason := 'concern_softens_with_silence';
  elsif v_primary in ('happy', 'affectionate') and v_elapsed >= 259200
        and v_state.intimacy_level in ('familiar', 'intimate', 'very_intimate') then
    v_next_primary := 'lonely';
    v_next_intensity := case when v_elapsed >= 604800 then 34 else 22 end;
    v_next_action := case when v_elapsed >= 604800 then 'WAIT' else v_state.action_state end;
    v_reason := 'warmth_turns_into_missing_after_gap';
  elsif v_primary in ('happy', 'affectionate') and v_elapsed >= 86400 then
    v_next_intensity := greatest(v_intensity - 10, 8);
    v_reason := 'warmth_settles_during_silence';
  elsif v_primary = 'lonely' and v_elapsed >= 604800 then
    v_next_intensity := least(60, greatest(v_intensity, 34) + 8);
    v_next_action := case when v_state.intimacy_level in ('intimate', 'very_intimate') then 'PULL' else 'WAIT' end;
    v_reason := 'loneliness_deepens_but_does_not_force_contact';
  elsif v_primary = 'lonely' and v_elapsed >= 259200 then
    v_next_intensity := least(48, greatest(v_intensity, 24) + 5);
    v_next_action := 'WAIT';
    v_reason := 'lonely_and_waiting';
  elsif v_primary = 'sulky' and v_elapsed >= 604800 then
    v_next_intensity := greatest(v_intensity - 12, 18);
    v_next_action := 'PULL';
    v_reason := 'sulk_cools_into_distance';
  elsif v_primary = 'sulky' and v_elapsed >= 259200 then
    v_next_action := 'SULK';
    v_reason := 'sulk_continues_through_gap';
  end if;

  if v_reason is null or (
    v_next_primary = v_primary and
    v_next_intensity = v_intensity and
    v_next_action = v_state.action_state
  ) then
    return to_jsonb(v_state);
  end if;

  update public.misaki_relationship_state
  set emotion_state = jsonb_build_object(
        'primary', v_next_primary,
        'intensity', v_next_intensity,
        'updated_at', v_now,
        'source', 'relationship_silence'
      ),
      action_state = v_next_action,
      state_updated_at = v_now
  where user_id = v_user_id
  returning * into v_state;

  insert into public.misaki_relationship_events(
    user_id, event_type, before_state, after_state, reason, metadata
  ) values (
    v_user_id,
    'silence_state_evolved',
    v_before,
    to_jsonb(v_state),
    v_reason,
    jsonb_build_object('elapsed_seconds', v_elapsed)
  );

  return to_jsonb(v_state);
end;
$$;

revoke execute on function public.advance_relationship_silence_state() from public, anon;
grant execute on function public.advance_relationship_silence_state() to authenticated;
