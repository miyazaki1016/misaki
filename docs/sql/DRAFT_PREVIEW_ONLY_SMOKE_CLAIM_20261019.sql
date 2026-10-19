-- DRAFT ONLY. Do not apply to Production without explicit database review.
-- A dedicated isolated Preview database is required.
-- Atomic lifetime reservation: even a failed attempt consumes the one run.
create table if not exists public.misaki_smoke_claims_v1 (
  run_key text primary key,
  owner_uid uuid not null,
  claimed_at timestamptz not null default now(),
  constraint smoke_run_key check (run_key = 'q02-preview-v1')
);
alter table public.misaki_smoke_claims_v1 enable row level security;
revoke all on public.misaki_smoke_claims_v1 from public, anon, authenticated;

create or replace function public.misaki_claim_one_shot_smoke_v1(
  p_owner_uid uuid, p_run_key text
) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare inserted int;
begin
  if p_run_key <> 'q02-preview-v1' or p_owner_uid is null then
    return false;
  end if;
  insert into public.misaki_smoke_claims_v1(run_key, owner_uid)
  values (p_run_key, p_owner_uid)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  return inserted = 1;
end;
$$;
revoke all on function public.misaki_claim_one_shot_smoke_v1(uuid, text) from public, anon, authenticated;
grant execute on function public.misaki_claim_one_shot_smoke_v1(uuid, text) to service_role;
