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
  return v_deleted = 1;
end;
$$;

revoke all on function public.purge_expired_misaki_anonymous_root(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.purge_expired_misaki_anonymous_root(uuid, uuid)
  to service_role;
