-- READ ONLY. Run with psql from an encrypted, access-restricted backup directory
-- outside the repository. Never commit output. This is a manifest, NOT a backup.
\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on
\o manifest.txt
begin isolation level repeatable read read only;
select id,enabled,writes_frozen,changed_at from public.misaki_maintenance_control;
do $$ begin
 if not exists(select 1 from public.misaki_maintenance_control where id=1 and enabled and writes_frozen) then
   raise exception 'freeze required before checkpoint';
 end if;
end $$;
\copy (select id,is_anonymous from auth.users order by id) to 'user-kinds.csv' csv header
\copy (select u.id user_id,r.intimacy_points existing_points,b.relationship_points legacy_points,coalesce((select count(*)::integer from jsonb_array_elements(coalesce(c.history,'[]')) with ordinality h(item,ord) where item->>'role'='misaki' and ord>1 and c.history->(ord::integer-2)->>'role'='user'),0) retained_pairs,greatest(coalesce(r.intimacy_points,0),coalesce(b.relationship_points,0),coalesce((select count(*)::integer from jsonb_array_elements(coalesce(c.history,'[]')) with ordinality h(item,ord) where item->>'role'='misaki' and ord>1 and c.history->(ord::integer-2)->>'role'='user'),0)) expected_points from auth.users u left join public.misaki_relationship_state r on r.user_id=u.id left join public.background_push_state b on b.user_id=u.id left join public.misaki_user_conversation_state c on c.user_id=u.id where not u.is_anonymous order by u.id) to 'migration-values.csv' csv header
-- Stable whole-row manifests. They preserve no raw conversation body here.
select 'relationship' object,count(*) rows,md5(coalesce(string_agg(to_jsonb(t)::text,'' order by user_id),'')) digest from public.misaki_relationship_state t
union all select 'conversation',count(*),md5(coalesce(string_agg(to_jsonb(t)::text,'' order by user_id),'')) from public.misaki_user_conversation_state t
union all select 'events',count(*),md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.misaki_relationship_events t
union all select 'background',count(*),md5(coalesce(string_agg(to_jsonb(t)::text,'' order by user_id),'')) from public.background_push_state t
union all select 'usage',count(*),md5(coalesce(string_agg(to_jsonb(t)::text,'' order by user_id,usage_date),'')) from public.daily_message_usage t
union all select 'requests',count(*),md5(coalesce(string_agg(to_jsonb(t)::text,'' order by request_id),'')) from public.daily_message_requests t
union all select 'deliveries',count(*),md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.misaki_proactive_deliveries t;
select n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid) definition
 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
 where not t.tgisinternal and n.nspname in ('public','auth') order by n.nspname,c.relname,t.tgname;
select p.proname,pg_get_function_identity_arguments(p.oid) arguments,p.proacl,p.prosecdef,pg_get_functiondef(p.oid) definition
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','misaki_operations') order by n.nspname,p.proname,arguments;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname;
select table_name,column_name,privilege_type,grantee from information_schema.column_privileges where table_schema='public' order by table_name,column_name,grantee,privilege_type;
select table_name,privilege_type,grantee from information_schema.table_privileges where table_schema='public' order by table_name,grantee,privilege_type;
select schemaname,sequencename,last_value from pg_sequences where schemaname='public' order by sequencename;
-- Exact pre-cutover bodies, owner and ACLs for the replaced/revoked routines.
\o restore-routines.sql
select pg_get_functiondef(p.oid) || E'\nALTER FUNCTION ' || p.oid::regprocedure::text || ' OWNER TO ' || quote_ident(pg_get_userbyid(p.proowner)) || E';\nREVOKE ALL ON FUNCTION ' || p.oid::regprocedure::text || E' FROM PUBLIC,anon,authenticated,service_role;\n' ||
 coalesce((select string_agg('GRANT EXECUTE ON FUNCTION ' || p.oid::regprocedure::text || ' TO ' || case when a.grantee=0 then 'PUBLIC' else quote_ident(pg_get_userbyid(a.grantee)) end || case when a.is_grantable then ' WITH GRANT OPTION' else '' end || ';',E'\n') from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.privilege_type='EXECUTE'),'')
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('finish_misaki_body_clock_delivery','sync_user_conversation_state','save_anonymous_conversation_state','record_relationship_chat_turn','append_proactive_to_conversation_state','refund_daily_message') order by p.proname;
\o manifest.txt
commit;
-- Explicitly preserve the event identity sequence even if pg_dump -t does not
-- include its dependency. NULL last_value means the sequence is not called yet.
\o restore-sequences.sql
select format('select pg_catalog.setval(%L::regclass,%s,%s);',schemaname||'.'||sequencename,coalesce(last_value,start_value),case when last_value is null then 'false' else 'true' end)
 from pg_sequences where schemaname||'.'||sequencename=pg_get_serial_sequence('public.misaki_relationship_events','id');
\o
