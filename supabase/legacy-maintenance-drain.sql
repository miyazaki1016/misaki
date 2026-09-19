-- Independent old-main equipment. NEVER run against Production in this task.
-- Install on an isolated database; no PR #29 routines or columns are required.
begin;
create schema misaki_drain;
revoke all on schema misaki_drain from public, anon, authenticated, service_role;
create table misaki_drain.control (
  id integer primary key check (id=1),
  phase text not null check (phase in ('open','draining','writes_frozen')),
  epoch bigint not null default 0,
  body_clock_verified boolean not null default false,
  verification_evidence text,
  changed_at timestamptz not null default clock_timestamp()
);
insert into misaki_drain.control(id,phase) values(1,'open');
create table misaki_drain.operations (
  id uuid primary key default gen_random_uuid(),
  capability uuid not null default gen_random_uuid(),
  kind text not null check(kind in ('chat','history','email_checkpoint','body_clock','relay','evolution','push_test')),
  user_id uuid,
  tracking_key uuid not null default gen_random_uuid(),
  epoch bigint not null,
  state text not null default 'admitted' check(state in
    ('admitted','awaiting_browser','refund_pending','unknown','succeeded','failed','refunded','reconciled')),
  started_at timestamptz not null default clock_timestamp(),
  ended_at timestamptz,
  evidence text,
  check ((state in ('succeeded','failed','refunded','reconciled')) = (ended_at is not null))
);
create index on misaki_drain.operations(state) where ended_at is null;
alter table misaki_drain.control enable row level security;
alter table misaki_drain.operations enable row level security;
revoke all on all tables in schema misaki_drain from public,anon,authenticated,service_role;

-- Every lifecycle mutation and every protected business transaction takes this
-- same lock FIRST. No TTL, timeout, lease expiry or process restart resolves an op.
create function public.admit_misaki_legacy_operation(p_kind text,p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c misaki_drain.control%rowtype; o misaki_drain.operations%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
  select * into strict c from misaki_drain.control where id=1;
  if c.phase <> 'open' then raise exception 'MISAKI_MAINTENANCE' using errcode='55000'; end if;
  if p_kind in ('chat','history','email_checkpoint','evolution','push_test') and p_user_id is null then raise exception 'user required'; end if;
  insert into misaki_drain.operations(kind,user_id,epoch) values(p_kind,p_user_id,c.epoch) returning * into o;
  return jsonb_build_object('id',o.id,'capability',o.capability,'trackingKey',o.tracking_key);
end $$;
revoke all on function public.admit_misaki_legacy_operation(text,uuid) from public,anon,authenticated;
grant execute on function public.admit_misaki_legacy_operation(text,uuid) to service_role;

create function misaki_drain.require_operation(p_id uuid,p_capability uuid)
returns misaki_drain.operations language plpgsql security definer set search_path='' as $$
declare o misaki_drain.operations%rowtype; phase text;
begin
  perform pg_catalog.pg_advisory_xact_lock_shared(1296646475,30);
  select c.phase into strict phase from misaki_drain.control c where id=1;
  if phase='writes_frozen' then raise exception 'MISAKI_MAINTENANCE' using errcode='55000'; end if;
  select * into o from misaki_drain.operations where id=p_id and capability=p_capability and ended_at is null;
  if not found then raise exception 'invalid or resolved operation'; end if;
  return o;
end $$;
revoke all on function misaki_drain.require_operation(uuid,uuid) from public,anon,authenticated,service_role;

create function public.progress_misaki_legacy_operation(p_id uuid,p_capability uuid,p_state text)
returns void language plpgsql security definer set search_path='' as $$
declare o misaki_drain.operations%rowtype; r public.daily_message_requests%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
  o:=misaki_drain.require_operation(p_id,p_capability);
  if p_state not in ('awaiting_browser','refund_pending','unknown','succeeded','failed','refunded') then raise exception 'invalid transition'; end if;
  if o.kind='chat' then
    select * into r from public.daily_message_requests where request_id=o.tracking_key and user_id=o.user_id;
    if p_state='succeeded' then raise exception 'chat requires browser save'; end if;
    if p_state='awaiting_browser' and (r.processed is not true or r.allowed is not true or r.refunded_at is not null) then
      raise exception 'usage not confirmed';
    end if;
    if p_state='refunded' and r.refunded_at is null then raise exception 'refund not confirmed'; end if;
    if p_state='failed' and (r.request_id is null or r.processed is not true or (r.allowed is true and r.is_premium is not true)) then
      raise exception 'usage/refund unresolved';
    end if;
  elsif p_state in ('awaiting_browser','refund_pending','refunded') then raise exception 'invalid kind transition';
  end if;
  if o.state='unknown' and p_state <> 'unknown' then raise exception 'operator reconciliation required'; end if;
  update misaki_drain.operations set state=p_state,
    ended_at=case when p_state in ('succeeded','failed','refunded') then clock_timestamp() else null end
    where id=o.id;
end $$;
revoke all on function public.progress_misaki_legacy_operation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.progress_misaki_legacy_operation(uuid,uuid,text) to service_role;

-- Definer is needed to read the private registry when reached via old definer
-- RPCs. It does NOT grant permission to perform the business write itself.
create function misaki_drain.guard_write() returns trigger
language plpgsql security definer set search_path='' as $$
declare phase text; h jsonb; o misaki_drain.operations%rowtype; role_name text;
begin
  perform pg_catalog.pg_advisory_xact_lock_shared(1296646475,30);
  select c.phase into strict phase from misaki_drain.control c where id=1;
  if phase='writes_frozen' then raise exception 'MISAKI_MAINTENANCE' using errcode='55000'; end if;
  h:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
  -- The browser-completion RPC uses transaction-local context after validation.
  if nullif(current_setting('misaki_drain.operation',true),'') is not null then
    o:=misaki_drain.require_operation(current_setting('misaki_drain.operation')::uuid,current_setting('misaki_drain.capability')::uuid);
    if o.user_id is distinct from auth.uid() then raise exception 'operation owner mismatch'; end if;
    return null;
  end if;
  if h ? 'x-misaki-operation' then
    o:=misaki_drain.require_operation((h->>'x-misaki-operation')::uuid,(h->>'x-misaki-capability')::uuid);
    role_name:=coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
    if role_name <> 'service_role' and (o.user_id is null or o.user_id is distinct from auth.uid()) then raise exception 'operation owner mismatch'; end if;
    return null;
  end if;
  -- Old direct RPCs/background upserts are synchronous DB transactions: the
  -- transaction lock is their drain boundary, not a lease or HTTP timeout.
  if phase <> 'open' then raise exception 'MISAKI_MAINTENANCE' using errcode='55000'; end if;
  return null;
end $$;
revoke all on function misaki_drain.guard_write() from public,anon,authenticated,service_role;

-- One transaction persists the old browser's post-response history/background
-- snapshot, then resolves chat. Anonymous chat remains ephemeral: no unsolicited
-- email checkpoint or permanent conversation save is introduced.
create function public.complete_misaki_legacy_browser_save(
  p_id uuid,p_capability uuid,p_history jsonb,p_memory jsonb,p_today_memory jsonb,
  p_relationship_points integer,p_notifications_enabled boolean,p_timezone text
) returns void language plpgsql security definer set search_path='' as $$
declare o misaki_drain.operations%rowtype; anonymous boolean; r public.daily_message_requests%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
  -- Idempotent lost-response retry; still validates authenticated owner/capability.
  select * into o from misaki_drain.operations where id=p_id and capability=p_capability and user_id=auth.uid();
  if not found then raise exception 'operation owner mismatch'; end if;
  if o.state='succeeded' then return; end if;
  o:=misaki_drain.require_operation(p_id,p_capability);
  if o.kind <> 'chat' or o.state <> 'awaiting_browser' then raise exception 'chat is not ready to save'; end if;
  select * into strict r from public.daily_message_requests where request_id=o.tracking_key and user_id=o.user_id;
  if r.allowed is not true or r.processed is not true or r.refunded_at is not null then raise exception 'usage unresolved'; end if;
  if jsonb_typeof(p_history) is distinct from 'array' or jsonb_typeof(p_memory) is distinct from 'array'
     or jsonb_array_length(p_history)=0 or jsonb_array_length(p_history)>60 or jsonb_array_length(p_memory)>30 then raise exception 'invalid browser snapshot'; end if;
  select is_anonymous into strict anonymous from auth.users where id=o.user_id for share;
  perform set_config('misaki_drain.operation',o.id::text,true);
  perform set_config('misaki_drain.capability',o.capability::text,true);
  if anonymous is not true then perform public.sync_user_conversation_state(p_history,p_memory); end if;
  insert into public.background_push_state(user_id,recent_history,long_term_memory,today_memory,relationship_points,notifications_enabled,timezone,updated_at)
  values(o.user_id,p_history,p_memory,p_today_memory,p_relationship_points,p_notifications_enabled,p_timezone,clock_timestamp())
  on conflict(user_id) do update set recent_history=excluded.recent_history,long_term_memory=excluded.long_term_memory,
    today_memory=excluded.today_memory,relationship_points=excluded.relationship_points,
    notifications_enabled=excluded.notifications_enabled,timezone=excluded.timezone,updated_at=excluded.updated_at;
  update misaki_drain.operations set state='succeeded',ended_at=clock_timestamp(),evidence='old browser save committed' where id=o.id;
  perform set_config('misaki_drain.operation','',true);
  perform set_config('misaki_drain.capability','',true);
end $$;
revoke all on function public.complete_misaki_legacy_browser_save(uuid,uuid,jsonb,jsonb,jsonb,integer,boolean,text) from public,anon;
grant execute on function public.complete_misaki_legacy_browser_save(uuid,uuid,jsonb,jsonb,jsonb,integer,boolean,text) to authenticated;

-- Operator-only controls. service_role cannot freeze, reopen, attest or reconcile.
create function misaki_drain.stop_admission() returns void language plpgsql set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
 update misaki_drain.control set phase='draining',epoch=epoch+1,changed_at=clock_timestamp() where id=1 and phase='open';
 if not found then raise exception 'not open'; end if;
end $$;
create function misaki_drain.verify_body_clock(p_evidence text) returns void language plpgsql set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
 if length(btrim(coalesce(p_evidence,'')))<20 then raise exception 'verification evidence required'; end if;
 update misaki_drain.control set body_clock_verified=true,verification_evidence=p_evidence where id=1 and phase='draining';
 if not found then raise exception 'not draining'; end if;
end $$;
create function misaki_drain.freeze() returns void language plpgsql set search_path='' as $$
declare c misaki_drain.control%rowtype; scheduler_active boolean;
begin
 perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
 select * into strict c from misaki_drain.control where id=1;
 if c.phase <> 'draining' or not c.body_clock_verified then raise exception 'admission/body clock not drained'; end if;
 -- Scheduler controls remain a separate operator action. This RPC only reads
 -- their state; it never alters cron or treats stopping cron as draining work.
 if to_regclass('cron.job') is not null then
   execute 'select exists(select 1 from cron.job where active and jobname in (''misaki-body-clock'',''misaki-background-push''))' into scheduler_active;
   if scheduler_active then raise exception 'Body Clock scheduler still active'; end if;
 end if;
 if exists(select 1 from misaki_drain.operations where ended_at is null) then raise exception 'unresolved operations'; end if;
 if exists(select 1 from public.misaki_body_clock_push_attempts where completed_at is null) then raise exception 'unresolved relay attempts'; end if;
 update misaki_drain.control set phase='writes_frozen',changed_at=clock_timestamp() where id=1;
end $$;
create function misaki_drain.reopen() returns void language plpgsql set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
 update misaki_drain.control set phase='open',body_clock_verified=false,verification_evidence=null,changed_at=clock_timestamp() where id=1;
 if not found then raise exception 'control missing'; end if;
 -- Never discard unresolved operations when reopening.
end $$;
create function misaki_drain.reconcile(p_id uuid,p_evidence text) returns void language plpgsql set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(1296646475,30);
 if length(btrim(coalesce(p_evidence,'')))<20 then raise exception 'reconciliation evidence required'; end if;
 update misaki_drain.operations set state='reconciled',ended_at=clock_timestamp(),evidence=p_evidence where id=p_id and ended_at is null;
 if not found then raise exception 'unresolved operation required'; end if;
end $$;
revoke all on all functions in schema misaki_drain from public,anon,authenticated,service_role;
create view misaki_drain.unresolved as
 select id,kind,user_id,tracking_key,epoch,state,started_at,evidence from misaki_drain.operations where ended_at is null;
revoke all on misaki_drain.unresolved from public,anon,authenticated,service_role;

do $$ declare target text;
begin
 foreach target in array array['daily_message_usage','daily_message_requests','misaki_relationship_state',
 'misaki_relationship_events','misaki_user_conversation_state','background_push_state','misaki_proactive_deliveries',
 'misaki_body_clock_push_attempts','push_subscriptions'] loop
   execute format('create trigger aaa_misaki_legacy_drain before insert or update or delete or truncate on public.%I for each statement execute function misaki_drain.guard_write()',target);
 end loop;
 -- Evolution edits can affect the persona using the same user memory/traits.
 -- Optional because their DDL is outside the old tracked migrations.
 foreach target in array array['misaki_user_relationship_traits','misaki_evolution_candidates','misaki_evolution_history'] loop
   if to_regclass('public.'||target) is not null then
     execute format('create trigger aaa_misaki_legacy_drain before insert or update or delete or truncate on public.%I for each statement execute function misaki_drain.guard_write()',target);
   end if;
 end loop;
end $$;
commit;
