alter table public.daily_message_requests
  add column if not exists refunded_at timestamptz;

create or replace function public.refund_daily_message(p_request_id uuid)
returns table(
  refunded boolean,
  message_count integer,
  remaining integer,
  is_premium boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.daily_message_requests%rowtype;
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into v_request
  from public.daily_message_requests
  where request_id = p_request_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Unknown request id';
  end if;

  if v_request.refunded_at is not null
     or v_request.processed is not true
     or v_request.allowed is not true
     or v_request.is_premium is true then
    select coalesce(dmu.message_count, 0)
      into v_count
    from public.daily_message_usage dmu
    where dmu.user_id = v_user_id
      and dmu.usage_date = v_request.usage_date;

    return query
    select false,
           coalesce(v_count, 0),
           greatest(20 - coalesce(v_count, 0), 0),
           v_request.is_premium;
    return;
  end if;

  update public.daily_message_usage dmu
     set message_count = greatest(dmu.message_count - 1, 0),
         updated_at = now()
   where dmu.user_id = v_user_id
     and dmu.usage_date = v_request.usage_date
  returning dmu.message_count into v_count;

  update public.daily_message_requests
     set refunded_at = now(),
         message_count = coalesce(v_count, 0),
         remaining = greatest(20 - coalesce(v_count, 0), 0)
   where request_id = p_request_id
     and user_id = v_user_id;

  return query
  select true,
         coalesce(v_count, 0),
         greatest(20 - coalesce(v_count, 0), 0),
         false;
end;
$$;

revoke all on function public.refund_daily_message(uuid) from public, anon;
grant execute on function public.refund_daily_message(uuid) to authenticated;
