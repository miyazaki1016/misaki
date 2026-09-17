create or replace function public.enforce_misaki_proactive_cadence_floor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.last_push_at is not null
     and new.last_push_at is distinct from old.last_push_at
     and new.next_push_at is not null
     and new.next_push_at < new.last_push_at + interval '55 minutes' then
    new.next_push_at := new.last_push_at + interval '55 minutes';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_misaki_proactive_cadence_floor() from public, anon, authenticated;

drop trigger if exists trg_enforce_misaki_proactive_cadence_floor on public.background_push_state;
create trigger trg_enforce_misaki_proactive_cadence_floor
before update of last_push_at, next_push_at on public.background_push_state
for each row execute function public.enforce_misaki_proactive_cadence_floor();
