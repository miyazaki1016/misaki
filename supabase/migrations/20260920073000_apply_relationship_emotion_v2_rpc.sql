-- Relationship emotion v2 write boundary.
-- The server computes the next emotion deterministically from semantic signals,
-- prior persisted state and relationship time. The database owns the final write
-- and event log. Client code cannot select another user's row.

create or replace function public.apply_relationship_emotion_v2(
  p_primary text,
  p_intensity integer,
  p_reason text,
  p_evidence jsonb default '[]'::jsonb,
  p_signal_summary jsonb default '[]'::jsonb,
  p_expected_state_updated_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_before public.misaki_relationship_state%rowtype;
  v_after public.misaki_relationship_state%rowtype;
  v_allowed_primary constant text[] := array[
    'neutral','happy','affectionate','concerned','hurt','sulky','guarded'
  ];
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'permanent account required';
  end if;
  if not (p_primary = any(v_allowed_primary)) then
    raise exception 'invalid emotion primary';
  end if;
  if p_intensity < 0 or p_intensity > 100 then
    raise exception 'invalid emotion intensity';
  end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'emotion reason required';
  end if;
  if jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_signal_summary, '[]'::jsonb)) <> 'array' then
    raise exception 'emotion evidence and signals must be arrays';
  end if;

  select * into v_before
  from public.misaki_relationship_state
  where user_id = v_user_id
  for update;

  if not found then
    insert into public.misaki_relationship_state(user_id)
    values (v_user_id)
    returning * into v_before;
  end if;

  -- Avoid silently overwriting a newer state produced by another request.
  if p_expected_state_updated_at is not null
     and v_before.state_updated_at <> p_expected_state_updated_at then
    return jsonb_build_object(
      'ok', false,
      'conflict', true,
      'state', to_jsonb(v_before)
    );
  end if;

  update public.misaki_relationship_state
  set emotion_state = jsonb_build_object(
        'primary', p_primary,
        'intensity', p_intensity,
        'updated_at', now(),
        'source', 'relationship_emotion_v2'
      ),
      state_updated_at = now()
  where user_id = v_user_id
  returning * into v_after;

  insert into public.misaki_relationship_events(
    user_id, event_type, before_state, after_state, reason, metadata
  ) values (
    v_user_id,
    'emotion_v2_after_chat',
    to_jsonb(v_before),
    to_jsonb(v_after),
    left(p_reason, 160),
    jsonb_build_object(
      'evidence', coalesce(p_evidence, '[]'::jsonb),
      'signals', coalesce(p_signal_summary, '[]'::jsonb)
    )
  );

  return jsonb_build_object(
    'ok', true,
    'conflict', false,
    'state', to_jsonb(v_after)
  );
end;
$$;

revoke execute on function public.apply_relationship_emotion_v2(text,integer,text,jsonb,jsonb,timestamptz)
from public, anon;
grant execute on function public.apply_relationship_emotion_v2(text,integer,text,jsonb,jsonb,timestamptz)
to authenticated;
