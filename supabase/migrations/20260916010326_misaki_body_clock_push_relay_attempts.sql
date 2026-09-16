create table if not exists public.misaki_body_clock_push_attempts (
 delivery_id uuid primary key references public.misaki_proactive_deliveries(id) on delete cascade,
 attempted_at timestamptz not null default now(),
 completed_at timestamptz,
 result jsonb
);
alter table public.misaki_body_clock_push_attempts enable row level security;
revoke all on public.misaki_body_clock_push_attempts from public,anon,authenticated;
grant select,insert,update on public.misaki_body_clock_push_attempts to service_role;
