-- Synthetic isolated old-main schema, no production data or external effects.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
-- Metadata fixture only: no cron extension, jobs, HTTP or scheduler execution.
create schema cron;
create table cron.job(jobname text,active boolean);
insert into cron.job values('misaki-body-clock',false),('misaki-background-push',false);
create table auth.users(id uuid primary key,is_anonymous boolean not null default false);
create function auth.uid() returns uuid language sql stable as $$
 select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
grant usage on schema auth to authenticated,service_role;
grant execute on function auth.uid() to authenticated,service_role;
create table public.daily_message_usage(user_id uuid,usage_date date,message_count int default 0,updated_at timestamptz default now(),primary key(user_id,usage_date));
create table public.daily_message_requests(request_id uuid primary key,user_id uuid,usage_date date,allowed boolean default false,
 message_count int default 0,remaining int default 0,is_premium boolean default false,processed boolean default false,created_at timestamptz default now(),refunded_at timestamptz);
create table public.misaki_relationship_state(user_id uuid primary key);
create table public.misaki_relationship_events(user_id uuid);
create table public.misaki_user_conversation_state(user_id uuid primary key,history jsonb default '[]',memory jsonb default '[]',
 message_count int default 0,user_message_count int default 0,memory_count int default 0,updated_at timestamptz default now());
create table public.background_push_state(user_id uuid primary key,recent_history jsonb default '[]',long_term_memory jsonb default '[]',
 today_memory jsonb default '{}',relationship_points int default 0,notifications_enabled boolean default true,timezone text default 'Asia/Tokyo',updated_at timestamptz default now());
create table public.misaki_proactive_deliveries(id uuid primary key default gen_random_uuid(),user_id uuid);
create table public.misaki_body_clock_push_attempts(delivery_id uuid primary key,completed_at timestamptz);
create table public.push_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid);
grant all on all tables in schema public to service_role;
grant all on public.background_push_state to authenticated;
create function public.ensure_background_push_schedule() returns trigger language plpgsql as $$begin return new;end$$;
