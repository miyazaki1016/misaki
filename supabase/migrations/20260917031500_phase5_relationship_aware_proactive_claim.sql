create or replace function public.claim_misaki_body_clock_due_users(p_limit integer default 10)
returns table(user_id uuid, relationship_points integer, long_term_memory jsonb, today_memory jsonb, recent_history jsonb, notifications_enabled boolean, timezone text, pushes_today integer, push_date date)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Relationship time continues while the app is closed. Silence can soften warmth
  -- or deepen an already plausible longing, but elapsed time alone never invents
  -- user-side facts or forces one fixed emotion.
  with due_ids as (
    select b.user_id
    from public.background_push_state b
    where b.next_push_at is not null
      and b.next_push_at <= now()
      and (case when b.push_date = (now() at time zone 'Asia/Tokyo')::date then coalesce(b.pushes_today,0) else 0 end) < 4
  ), evolved as (
    update public.misaki_relationship_state r
    set emotion_state = case
          when r.last_interaction_at is null then r.emotion_state
          when coalesce(r.emotion_state->>'primary','neutral') in ('happy','affectionate')
               and now() - r.last_interaction_at >= interval '24 hours'
            then jsonb_build_object('primary',coalesce(r.emotion_state->>'primary','neutral'),'intensity',greatest(12,coalesce((r.emotion_state->>'intensity')::int,0)-case when now()-r.last_interaction_at >= interval '3 days' then 18 else 10 end),'source','relationship_silence')
          when r.intimacy_level in ('familiar','intimate','very_intimate')
               and now()-r.last_interaction_at >= interval '3 days'
               and coalesce(r.emotion_state->>'primary','neutral') in ('neutral','lonely')
            then jsonb_build_object('primary','lonely','intensity',least(72,greatest(coalesce((r.emotion_state->>'intensity')::int,0),case when now()-r.last_interaction_at >= interval '7 days' then 48 when now()-r.last_interaction_at >= interval '5 days' then 38 else 28 end)),'source','relationship_silence')
          else r.emotion_state end,
        action_state = case
          when r.intimacy_level in ('familiar','intimate','very_intimate') and now()-r.last_interaction_at >= interval '7 days' and coalesce(r.emotion_state->>'primary','neutral') in ('neutral','lonely','sulky') then 'PULL'
          when r.intimacy_level in ('familiar','intimate','very_intimate') and now()-r.last_interaction_at >= interval '3 days' and coalesce(r.emotion_state->>'primary','neutral') in ('neutral','lonely') then 'WAIT'
          else r.action_state end,
        state_updated_at=now()
    from due_ids d
    where r.user_id=d.user_id and r.last_interaction_at is not null and now()-r.last_interaction_at >= interval '24 hours'
    returning r.user_id
  ), candidates as (
    select b.user_id,coalesce(r.action_state,'NORMAL') action_state,random() roll
    from public.background_push_state b
    left join public.misaki_relationship_state r on r.user_id=b.user_id
    where b.next_push_at is not null and b.next_push_at<=now()
      and (case when b.push_date=(now() at time zone 'Asia/Tokyo')::date then coalesce(b.pushes_today,0) else 0 end)<4
    order by b.next_push_at asc
    for update of b skip locked
    limit greatest(1,least(coalesce(p_limit,10)*3,75))
  ), decisions as (
    select c.*,case when c.action_state='PULL' then false when c.action_state='WAIT' then c.roll<0.25 when c.action_state='SULK' then c.roll<0.45 else true end should_send
    from candidates c
  ), deferred as (
    update public.background_push_state b
    set next_push_at=now()+make_interval(mins=>55+floor(random()*156)::int),updated_at=now()
    from decisions d where b.user_id=d.user_id and not d.should_send returning b.user_id
  ), logged as (
    insert into public.misaki_relationship_events(user_id,event_type,reason,metadata)
    select d.user_id,'proactive_decision','relationship_action_deferred',jsonb_build_object('action_state',d.action_state,'decision','defer','roll',round(d.roll::numeric,4))
    from decisions d where not d.should_send returning user_id
  ), sendable as (
    select d.user_id from decisions d where d.should_send order by d.roll limit greatest(1,least(coalesce(p_limit,10),25))
  ), claimed as (
    update public.background_push_state b
    set next_push_at=now()+interval '15 minutes',
        push_date=case when b.push_date=(now() at time zone 'Asia/Tokyo')::date then b.push_date else (now() at time zone 'Asia/Tokyo')::date end,
        pushes_today=case when b.push_date=(now() at time zone 'Asia/Tokyo')::date then coalesce(b.pushes_today,0) else 0 end,
        updated_at=now()
    from sendable s where b.user_id=s.user_id returning b.*
  )
  select c.user_id,coalesce(c.relationship_points,0),coalesce(c.long_term_memory,'[]'::jsonb),coalesce(c.today_memory,'{}'::jsonb),coalesce(c.recent_history,'[]'::jsonb),coalesce(c.notifications_enabled,false),coalesce(c.timezone,'Asia/Tokyo'),coalesce(c.pushes_today,0),c.push_date
  from claimed c;
end;
$$;

revoke all on function public.claim_misaki_body_clock_due_users(integer) from public, anon, authenticated;
grant execute on function public.claim_misaki_body_clock_due_users(integer) to service_role;
