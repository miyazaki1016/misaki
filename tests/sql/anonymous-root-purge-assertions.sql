-- Apply anonymous-root-purge.sql, then the migration, before these assertions.
do $$
begin
  if has_function_privilege('anon', 'public.purge_expired_misaki_anonymous_root(uuid,uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.purge_expired_misaki_anonymous_root(uuid,uuid)', 'execute') then
    raise exception 'cleanup must not be exposed to clients';
  end if;
end;
$$;

set role service_role;
do $$
declare
  expired uuid := '00000000-0000-4000-8000-000000000001';
  active uuid := '00000000-0000-4000-8000-000000000002';
  registered uuid := '00000000-0000-4000-8000-000000000003';
  checkpointed uuid := '00000000-0000-4000-8000-000000000004';
begin
  if public.purge_expired_misaki_anonymous_root(expired, active)
     or public.purge_expired_misaki_anonymous_root(active, active)
     or public.purge_expired_misaki_anonymous_root(registered, registered)
     or public.purge_expired_misaki_anonymous_root(checkpointed, checkpointed) then
    raise exception 'a protected root was deleted';
  end if;
  if not public.purge_expired_misaki_anonymous_root(expired, expired) then
    raise exception 'expired root was not deleted';
  end if;
  if public.purge_expired_misaki_anonymous_root(expired, expired) then
    raise exception 'cleanup retry did not return false';
  end if;
  begin
    insert into public.misaki_temporary_roots values (expired, expired, clock_timestamp());
    raise exception 'purged root was recreated';
  exception when raise_exception then
    if sqlerrm <> 'temporary state expired' then raise; end if;
  end;
  if (select user_id from public.misaki_expired_temporary_root_users) is distinct from expired
     or (select count(*) from public.misaki_temporary_roots) <> 3
     or (select count(*) from auth.users) <> 4
     or (select count(*) from public.misaki_relationship_events) <> 1 then
    raise exception 'cleanup modified unexpected rows';
  end if;
end;
$$;
reset role;
