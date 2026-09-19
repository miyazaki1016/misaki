-- Relationship time v2: elapsed time is context, not an event.
--
-- The previous lazy RPC could turn a warm state into loneliness solely because
-- three days passed. Keep the RPC for compatibility with already-deployed app
-- code, but make it read-only. The v2 reducer applies time together with
-- semantic conversation evidence before a state transition is persisted.

create or replace function public.advance_relationship_silence_state()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_state public.misaki_relationship_state%rowtype;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'permanent account required';
  end if;

  select * into v_state
  from public.misaki_relationship_state
  where user_id = v_user_id;

  if not found then return null; end if;
  return to_jsonb(v_state);
end;
$$;

revoke execute on function public.advance_relationship_silence_state() from public, anon;
grant execute on function public.advance_relationship_silence_state() to authenticated;
