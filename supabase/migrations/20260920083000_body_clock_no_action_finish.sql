-- Body Clock v2: claiming a due user creates only a short evaluation lease.
-- If Misaki decides not to contact the user, release that lease atomically and
-- schedule the next opportunity without counting a push or creating a delivery.

create or replace function public.finish_misaki_body_clock_no_action(
  p_user_id uuid,
  p_lease_until timestamptz,
  p_delay_minutes integer
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s public.background_push_state%rowtype;
  v_now timestamptz := clock_timestamp();
  v_next timestamptz;
begin
  select * into s
  from public.background_push_state
  where user_id = p_user_id
  for update;

  if not found
     or s.next_push_at is distinct from p_lease_until
     or p_lease_until <= v_now then
    raise exception 'body_clock_lease_expired';
  end if;

  v_next := v_now + make_interval(
    mins => greatest(55, least(210, coalesce(p_delay_minutes, 55)))
  );

  update public.background_push_state
  set next_push_at = v_next,
      updated_at = v_now
  where user_id = p_user_id;

  return jsonb_build_object(
    'nextPushAt', v_next,
    'pushesToday', greatest(coalesce(s.pushes_today, 0), 0)
  );
end;
$$;

revoke all on function public.finish_misaki_body_clock_no_action(uuid,timestamptz,integer)
from public, anon, authenticated;
grant execute on function public.finish_misaki_body_clock_no_action(uuid,timestamptz,integer)
to service_role;
