-- Run only against a fresh disposable PostgreSQL database.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users (id uuid primary key, is_anonymous boolean not null);
create table public.misaki_temporary_roots (
  user_id uuid primary key references auth.users(id),
  revision uuid not null,
  expires_at timestamptz not null
);
create table public.misaki_relationship_events (user_id uuid, event_type text);

insert into auth.users
select ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, n <> 3
from generate_series(1, 4) as ids(n);
insert into public.misaki_temporary_roots
select id, id, case when id::text like '%2'
  then clock_timestamp() + interval '1 hour'
  else clock_timestamp() - interval '1 hour' end
from auth.users;
insert into public.misaki_relationship_events values
  ('00000000-0000-4000-8000-000000000004', 'email_save_checkpoint');

grant usage on schema auth to service_role;
grant select, update on auth.users to service_role;
grant select on public.misaki_relationship_events to service_role;
alter role service_role bypassrls;
grant select, insert, delete on public.misaki_temporary_roots to service_role;
