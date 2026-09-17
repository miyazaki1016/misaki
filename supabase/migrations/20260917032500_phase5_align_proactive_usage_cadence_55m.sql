create or replace function public.consume_proactive_message()
returns table(allowed boolean, message_count integer, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_today date := (v_now at time zone 'Asia/Tokyo')::date;
  v_count integer := 0;
  v_last_sent timestamptz;
  v_retry integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then raise exception 'Permanent account required'; end if;

  insert into public.proactive_message_usage(user_id,usage_date,message_count,last_sent_at,updated_at)
  values(v_user_id,v_today,0,null,v_now)
  on conflict (user_id,usage_date) do nothing;

  select p.message_count,p.last_sent_at into v_count,v_last_sent
  from public.proactive_message_usage p
  where p.user_id=v_user_id and p.usage_date=v_today
  for update;

  if v_count >= 4 then return query select false,v_count,0,0; return; end if;

  if v_last_sent is not null and v_last_sent + interval '55 minutes' > v_now then
    v_retry := greatest(ceil(extract(epoch from ((v_last_sent + interval '55 minutes') - v_now)))::integer,1);
    return query select false,v_count,greatest(4-v_count,0),v_retry; return;
  end if;

  update public.proactive_message_usage p
  set message_count=p.message_count+1,last_sent_at=v_now,updated_at=v_now
  where p.user_id=v_user_id and p.usage_date=v_today
  returning p.message_count into v_count;

  return query select true,v_count,greatest(4-v_count,0),0;
end;
$function$;

revoke execute on function public.consume_proactive_message() from public, anon;
grant execute on function public.consume_proactive_message() to authenticated;
