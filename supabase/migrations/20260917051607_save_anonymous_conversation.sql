-- Explicit email-save checkpoint. A snapshot replaces itself; it is never a delta.
-- SECURITY DEFINER is necessary because the conversation table has no direct
-- client insert/update policies. Ownership and anonymous status are checked here.
create or replace function public.save_anonymous_conversation_state(p_history jsonb, p_memory jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_history jsonb;
  v_memory jsonb;
begin
  if v_user_id is null then raise exception 'anonymous account required'; end if;
  -- Serialize snapshots and hold anonymous status stable against confirmation.
  perform 1 from auth.users where id = v_user_id and is_anonymous = true for update;
  if not found then
    raise exception 'anonymous account required';
  end if;
  if jsonb_typeof(p_history) is distinct from 'array' or jsonb_typeof(p_memory) is distinct from 'array' then
    raise exception 'invalid snapshot';
  end if;
  select coalesce(jsonb_agg(item order by ord), '[]'::jsonb) into v_history
  from (
    select jsonb_build_object('role', elem->>'role', 'text', left(btrim(elem->>'text'), 2000),
      'sentAt', to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) as item, ord
    from jsonb_array_elements(p_history) with ordinality a(elem, ord)
    where elem->>'role' in ('user', 'misaki') and jsonb_typeof(elem->'text') = 'string'
      and length(btrim(elem->>'text')) > 0
    order by ord desc limit 60
  ) items;
  select coalesce(jsonb_agg(item order by ord), '[]'::jsonb) into v_memory
  from (
    select to_jsonb(left(btrim(elem #>> '{}'), 500)) as item, ord
    from jsonb_array_elements(p_memory) with ordinality a(elem, ord)
    where jsonb_typeof(elem) = 'string' and length(btrim(elem #>> '{}')) > 0
    order by ord desc limit 30
  ) items;

  insert into public.misaki_user_conversation_state(user_id, history, memory, updated_at)
  values (v_user_id, v_history, v_memory, now())
  on conflict (user_id) do update set history = excluded.history, memory = excluded.memory, updated_at = now()
  where jsonb_array_length(misaki_user_conversation_state.history) <= jsonb_array_length(excluded.history);
  return jsonb_build_object('saved', true);
end;
$$;
revoke all on function public.save_anonymous_conversation_state(jsonb,jsonb) from public, anon;
grant execute on function public.save_anonymous_conversation_state(jsonb,jsonb) to authenticated;
