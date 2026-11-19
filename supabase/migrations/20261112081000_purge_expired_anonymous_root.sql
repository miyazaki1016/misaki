-- Retain the expiry decision after removing the encrypted payload. Otherwise a
-- previously issued bearer token could seed this user again after root deletion.
create table public.misaki_expired_temporary_root_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.misaki_expired_temporary_root_users enable row level security;
revoke all on public.misaki_expired_temporary_root_users from public, anon, authenticated;
grant select, insert on public.misaki_expired_temporary_root_users to service_role;

create function public.reject_expired_misaki_root_recreation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.misaki_expired_temporary_root_users where user_id = new.user_id
  ) then
    raise exception 'temporary state expired';
  end if;
  return new;
end;
$$;
revoke all on function public.reject_expired_misaki_root_recreation() from public, anon, authenticated;

create trigger misaki_reject_expired_root_recreation
before insert on public.misaki_temporary_roots
for each row execute function public.reject_expired_misaki_root_recreation();

-- Explicit, revision-checked cleanup for one expired encrypted transport root.
-- Keep the same auth -> root lock order as chat and email checkpoint writers.
-- Installing the function does not run it or schedule cleanup.
create function public.purge_expired_misaki_anonymous_root(
  p_user_id uuid,
  p_expected_revision uuid
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  perform 1
  from auth.users
  where id = p_user_id and is_anonymous
  for update;

  if not found then
    return false;
  end if;

  if exists (
    select 1 from public.misaki_relationship_events
    where user_id = p_user_id and event_type = 'email_save_checkpoint'
  ) then
    return false;
  end if;

  delete from public.misaki_temporary_roots
  where user_id = p_user_id
    and revision = p_expected_revision
    and expires_at <= clock_timestamp();

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    return false;
  end if;

  insert into public.misaki_expired_temporary_root_users (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
  return true;
end;
$$;

revoke all on function public.purge_expired_misaki_anonymous_root(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.purge_expired_misaki_anonymous_root(uuid, uuid)
  to service_role;
