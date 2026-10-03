-- Relationship Engine v1 foundation. Additive only: existing chat/runtime behavior is unchanged.
create table if not exists public.misaki_relationship_evidence (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null, evidence_key text not null,
 axis text not null check (axis in ('friendship','trust','playfulness','affection','romance')),
 direction smallint not null check (direction in (-1,1)), strength smallint not null check (strength between 1 and 100),
 interpretation text not null check (interpretation in ('direct','ambiguous','hypothetical','quoted','third_party','negated')),
 subject text not null default 'user_to_misaki', payload jsonb not null default '{}'::jsonb,
 analyzer_version text not null, created_at timestamptz not null default clock_timestamp(),
 unique(user_id,request_id,evidence_key,analyzer_version));
create index if not exists misaki_relationship_evidence_user_request_idx on public.misaki_relationship_evidence(user_id,request_id);
create index if not exists misaki_relationship_evidence_user_created_idx on public.misaki_relationship_evidence(user_id,created_at desc);
create table if not exists public.misaki_relationship_episodes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 episode_key text not null, episode_type text not null, status text not null default 'open' check(status in ('open','closed','superseded')),
 summary jsonb not null default '{}'::jsonb, analyzer_version text not null, first_request_id uuid not null,last_request_id uuid not null,
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 unique(user_id,episode_key,analyzer_version));
create index if not exists misaki_relationship_episodes_user_updated_idx on public.misaki_relationship_episodes(user_id,updated_at desc);
create table if not exists public.misaki_relationship_episode_evidence (
 user_id uuid not null references auth.users(id) on delete cascade,
 episode_id uuid not null references public.misaki_relationship_episodes(id) on delete cascade,
 evidence_id uuid not null references public.misaki_relationship_evidence(id) on delete cascade,
 created_at timestamptz not null default clock_timestamp(), primary key(episode_id,evidence_id));
create index if not exists misaki_relationship_episode_evidence_user_idx on public.misaki_relationship_episode_evidence(user_id,episode_id);
create table if not exists public.misaki_relationship_patterns (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 pattern_key text not null,pattern_type text not null,state text not null default 'active' check(state in ('active','dormant','superseded')),
 summary jsonb not null default '{}'::jsonb,derived_from jsonb not null default '[]'::jsonb,pattern_version text not null,
 first_request_id uuid,last_request_id uuid,created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 unique(user_id,pattern_key,pattern_version));
create index if not exists misaki_relationship_patterns_user_updated_idx on public.misaki_relationship_patterns(user_id,updated_at desc);
create table if not exists public.misaki_relationship_critical_pending (
 user_id uuid not null references auth.users(id) on delete cascade,request_id uuid not null,
 candidate_type text not null check(candidate_type in ('romantic_proposal','romantic_acceptance','romantic_rejection','relationship_end','boundary_event','reconciliation')),
 status text not null default 'pending' check(status in ('pending','processing','resolved','dismissed','failed')),
 context jsonb not null default '{}'::jsonb,validator_version text,attempts integer not null default 0 check(attempts>=0),
 last_error text,created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),resolved_at timestamptz,
 primary key(user_id,request_id,candidate_type));
create index if not exists misaki_relationship_critical_pending_work_idx on public.misaki_relationship_critical_pending(status,created_at) where status in ('pending','failed');
alter table public.misaki_relationship_evidence enable row level security;
alter table public.misaki_relationship_episodes enable row level security;
alter table public.misaki_relationship_episode_evidence enable row level security;
alter table public.misaki_relationship_patterns enable row level security;
alter table public.misaki_relationship_critical_pending enable row level security;
revoke all on table public.misaki_relationship_evidence,public.misaki_relationship_episodes,public.misaki_relationship_episode_evidence,public.misaki_relationship_patterns,public.misaki_relationship_critical_pending from public,anon,authenticated;
grant select,insert,update,delete on table public.misaki_relationship_evidence,public.misaki_relationship_episodes,public.misaki_relationship_episode_evidence,public.misaki_relationship_patterns,public.misaki_relationship_critical_pending to service_role;
