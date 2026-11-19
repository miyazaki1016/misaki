alter table public.misaki_emotion_turns
  add column recovery_after timestamptz not null default '-infinity';

-- Claim only the oldest pending turn per user. An unsuccessful attempt becomes
-- eligible again after the lease, while other users can continue immediately.
create function public.claim_misaki_emotion_recovery()
returns table(user_id uuid)
language sql security invoker set search_path = '' as $$
  with candidates as (
    select pending.event_id
    from public.misaki_emotion_turns pending
    where pending.input is not null
      and pending.recovery_after <= statement_timestamp()
      and not exists (
        select 1 from public.misaki_emotion_turns earlier
        where earlier.user_id = pending.user_id
          and earlier.event_id < pending.event_id and earlier.input is not null
      )
    order by pending.recovery_after, pending.event_id
    limit 8
    for update of pending skip locked
  )
  update public.misaki_emotion_turns pending
  set recovery_after = statement_timestamp() + interval '2 minutes'
  from candidates
  where pending.event_id = candidates.event_id
  returning pending.user_id;
$$;
revoke all on function public.claim_misaki_emotion_recovery() from public, anon, authenticated;
grant execute on function public.claim_misaki_emotion_recovery() to service_role;
