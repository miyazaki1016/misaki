-- Isolated empty-DB prerequisites. No Production data or credentials.
-- Legacy Supabase foundation migrations are not fully present in this repository.
-- Relationship schema/Engine/Identity DDL is loaded unmodified from tracked migrations.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
grant usage on schema public,auth to anon,authenticated,service_role;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create function auth.jwt() returns jsonb language sql as $$ select '{}'::jsonb $$;
create table public.conversations(id bigint primary key);
create table public.misaki_proactive_deliveries(id uuid primary key);
