-- Relationship-time v2: claiming a due Body Clock opportunity must not
-- manufacture emotion/action from elapsed silence or randomly decide contact.
-- The Edge function derives proactive urge from persisted relationship state.
create or replace function public.claim_misaki_body_clock_due_users(p_limit integer default 10)
returns table(user_id uuid,relationship_points integer,long_term_memory jsonb,today_memory jsonb,recent_history jsonb,notifications_enabled boolean,timezone text,pushes_today integer,push_date date)
language plpgsql security definer set search_path to ''
as $function$
#variable_conflict use_column
begin
  return query
  with candidates as (
    select b.user_id
    from public.background_push_state b
    where b.next_push_at is not null
      and b.next_push_at <= now()
      and (case when b.push_date=(now() at time zone 'Asia/Tokyo')::date then coalesce(b.pushes_today,0) else 0 end)<4
    order by b.next_push_at asc
    for update of b skip locked
    limit greatest(1,least(coalesce(p_limit,10),25))
  ), claimed as (
    update public.background_push_state b
    set next_push_at=now()+interval '15 minutes',
        push_date=case when b.push_date=(now() at time zone 'Asia/Tokyo')::date then b.push_date else (now() at time zone 'Asia/Tokyo')::date end,
        pushes_today=case when b.push_date=(now() at time zone 'Asia/Tokyo')::date then coalesce(b.pushes_today,0) else 0 end,
        updated_at=now()
    from candidates c where b.user_id=c.user_id
    returning b.*
  )
  select c.user_id,coalesce(c.relationship_points,0),coalesce(c.long_term_memory,'[]'::jsonb),coalesce(c.today_memory,'{}'::jsonb),coalesce(c.recent_history,'[]'::jsonb),coalesce(c.notifications_enabled,false),coalesce(c.timezone,'Asia/Tokyo'),coalesce(c.pushes_today,0),c.push_date
  from claimed c;
end;
$function$;
revoke all on function public.claim_misaki_body_clock_due_users(integer) from public, anon, authenticated;
grant execute on function public.claim_misaki_body_clock_due_users(integer) to service_role;
