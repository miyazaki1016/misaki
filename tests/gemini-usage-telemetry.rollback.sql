-- Run against the migrated DB. All synthetic provider facts are rolled back.
begin;
set local role service_role;
insert into public.misaki_gemini_usage_telemetry (request_id,call_kind,model,attempt_no,success,http_status)
values ('telemetry-rollback-check','normal_reply','gemini-3.1-flash-lite',1,false,503),
       ('telemetry-rollback-check','normal_reply','gemini-3.1-flash-lite',2,true,200);
do $$ begin
  if (select count(*) from public.misaki_gemini_usage_telemetry where request_id='telemetry-rollback-check') <> 2 then
    raise exception 'physical_attempt_rows_missing';
  end if;
  if exists (select 1 from public.misaki_gemini_usage_telemetry where request_id='telemetry-rollback-check'
    and (prompt_tokens is not null or candidate_tokens is not null or thoughts_tokens is not null or total_tokens is not null or cached_tokens is not null)) then
    raise exception 'missing_tokens_not_null';
  end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform 1 from public.misaki_gemini_usage_telemetry; raise exception 'anon_select_allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.misaki_gemini_usage_telemetry(call_kind,model,attempt_no,success) values ('normal_reply','test',1,false); raise exception 'anon_insert_allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin perform 1 from public.misaki_gemini_usage_telemetry; raise exception 'authenticated_select_allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.misaki_gemini_usage_telemetry(call_kind,model,attempt_no,success) values ('normal_reply','test',1,false); raise exception 'authenticated_insert_allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select c.relrowsecurity,
  has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') as anon_access,
  has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE') as authenticated_access,
  has_table_privilege('service_role',c.oid,'SELECT') as service_select,
  has_table_privilege('service_role',c.oid,'INSERT') as service_insert,
  not exists(select 1 from aclexplode(c.relacl) a where a.grantee=0) as public_revoked
from pg_class c where c.oid='public.misaki_gemini_usage_telemetry'::regclass;
rollback;
