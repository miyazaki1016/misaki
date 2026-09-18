-- REUSABLE PREREQUISITE, NOT AN AUTOMATIC CUTOVER MIGRATION.
-- Install separately on the old compatible schema only in an approved window.
-- No production application is performed by this PR.
begin;
create table public.misaki_maintenance_control (
  id integer primary key check (id = 1),
  enabled boolean not null default false,
  writes_frozen boolean not null default false,
  check (not writes_frozen or enabled),
  changed_at timestamptz not null default clock_timestamp()
);
insert into public.misaki_maintenance_control(id) values (1);
alter table public.misaki_maintenance_control enable row level security;
revoke all on public.misaki_maintenance_control from public, anon, authenticated, service_role;
grant select on public.misaki_maintenance_control to service_role;

create schema if not exists misaki_operations;
revoke all on schema misaki_operations from public, anon, authenticated, service_role;

-- These functions must be owned by the trusted installer (postgres). The
-- definer reads the control row for triggers reached through old definer RPCs.
-- It never returns private data and never elevates a caller's business write.
create function misaki_operations.guard_root_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare stopped boolean;
begin
  -- A trusted SQL operator must still be able to migrate/restore while ON.
  -- Check original session/SET ROLE, not current_user inside this definer.
  if session_user in ('postgres','supabase_admin')
     and current_setting('role') in ('none','postgres','supabase_admin') then return null; end if;
  perform pg_catalog.pg_advisory_xact_lock_shared(1296646475, 29);
  select writes_frozen into stopped from public.misaki_maintenance_control where id=1 for share;
  if stopped is distinct from false then
    raise exception 'MISAKI_MAINTENANCE' using errcode='55000';
  end if;
  return null;
end $$;
revoke all on function misaki_operations.guard_root_write() from public,anon,authenticated,service_role;

create function misaki_operations.set_maintenance(p_enabled boolean, p_freeze boolean default false) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_enabled is null or p_freeze is null or (p_freeze and not p_enabled) then raise exception 'invalid maintenance state'; end if;
  -- Wait for admitted DB transactions before declaring the freeze committed.
  perform pg_catalog.pg_advisory_xact_lock(1296646475, 29);
  update public.misaki_maintenance_control set enabled=p_enabled, writes_frozen=p_freeze, changed_at=clock_timestamp() where id=1;
  if not found then raise exception 'maintenance control missing'; end if;
end $$;
revoke all on function misaki_operations.set_maintenance(boolean,boolean) from public,anon,authenticated,service_role;

do $$
declare target text;
begin
  foreach target in array array['daily_message_usage','daily_message_requests',
    'misaki_relationship_state','misaki_relationship_events',
    'misaki_user_conversation_state','background_push_state','misaki_proactive_deliveries'] loop
    execute format('create trigger aaa_misaki_maintenance before insert or update or delete or truncate on public.%I for each statement execute function misaki_operations.guard_root_write()',target);
  end loop;
  -- The canonical migration has not created this table on old main yet.
  if to_regclass('public.misaki_temporary_roots') is not null then
    create trigger aaa_misaki_maintenance before insert or update or delete or truncate
      on public.misaki_temporary_roots for each statement execute function misaki_operations.guard_root_write();
  end if;
end $$;
commit;
