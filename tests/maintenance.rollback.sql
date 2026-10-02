-- Compose: BEGIN; maintenance-gate.sql WITHOUT its BEGIN/COMMIT;
-- this file; ROLLBACK. Only synthetic temporary rows are written.
create temporary table maintenance_probe(value integer);
grant select,insert,update,delete,truncate on maintenance_probe to authenticated,service_role;
create trigger aaa_misaki_maintenance before insert or update or delete or truncate
 on maintenance_probe for each statement execute function misaki_operations.guard_root_write();

do $$ begin
 assert (select relrowsecurity from pg_class where oid='public.misaki_maintenance_control'::regclass);
 assert not has_table_privilege('authenticated','public.misaki_maintenance_control','SELECT');
 assert not has_table_privilege('anon','public.misaki_maintenance_control','UPDATE');
 assert not has_table_privilege('service_role','public.misaki_maintenance_control','UPDATE');
 assert has_table_privilege('service_role','public.misaki_maintenance_control','SELECT');
 assert not has_function_privilege('authenticated','misaki_operations.set_maintenance(boolean,boolean)','EXECUTE');
 assert not has_function_privilege('service_role','misaki_operations.set_maintenance(boolean,boolean)','EXECUTE');
end $$;

set local role authenticated;
insert into maintenance_probe values(1);
reset role;
select misaki_operations.set_maintenance(true,false);
set local role authenticated;
-- Drain phase permits an already admitted turn/refund to settle.
update maintenance_probe set value=2;
reset role;
select misaki_operations.set_maintenance(true,true);
set local role authenticated;
do $$ begin
 begin insert into maintenance_probe values(9); raise exception 'write accepted';
 exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
 begin update maintenance_probe set value=9; raise exception 'write accepted';
 exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
 begin delete from maintenance_probe; raise exception 'write accepted';
 exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
 begin truncate maintenance_probe; raise exception 'truncate accepted';
 exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
end $$;
reset role;
set local role service_role;
do $$ begin
 begin insert into maintenance_probe values(9); raise exception 'service write accepted';
 exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
 -- Even a zero-row old-schema write must stop before business triggers.
 begin update public.background_push_state set relationship_points=0 where false; raise exception 'old write accepted';
 exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
end $$;
reset role;
-- Check every old-schema target without updating any existing row.
set local role service_role;
do $$
declare target text; key_name text;
begin
 foreach target in array array['daily_message_usage','daily_message_requests','misaki_relationship_state',
   'misaki_relationship_events','misaki_user_conversation_state','background_push_state','misaki_proactive_deliveries'] loop
   key_name:=case when target='daily_message_requests' then 'request_id'
    when target in ('misaki_relationship_events','misaki_proactive_deliveries') then 'id' else 'user_id' end;
   begin
     execute format('update public.%I set %I=%I where false',target,key_name,key_name);
     raise exception 'target % write accepted',target;
   exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
 end loop;
end $$;
reset role;
select misaki_operations.set_maintenance(false,false);
set local role authenticated;
update maintenance_probe set value=3;
reset role;
do $$ begin assert (select count(*) from maintenance_probe)=1; assert (select value from maintenance_probe)=3; end $$;

-- Old SECURITY DEFINER callers must not turn the guard into postgres bypass.
create function pg_temp.maintenance_definer_probe() returns void language plpgsql security definer set search_path='' as $$
begin insert into pg_temp.maintenance_probe values(7); end $$;
grant execute on function pg_temp.maintenance_definer_probe() to authenticated;
select misaki_operations.set_maintenance(true,true);
set local role authenticated;
do $$ begin
 begin perform pg_temp.maintenance_definer_probe(); raise exception 'definer bypass accepted';
 exception when sqlstate '55000' then assert sqlerrm='MISAKI_MAINTENANCE'; end;
end $$;
reset role;
select misaki_operations.set_maintenance(false,false);
select 'maintenance assertions passed' result;
