-- Run with the proposed migration and canonical-state.rollback.sql in one
-- BEGIN/ROLLBACK. Tokens are opaque here; JS tests validate both crypto runtimes.
do $$
declare
  a uuid:=gen_random_uuid(); r uuid:=gen_random_uuid(); r2 uuid:=gen_random_uuid(); failed uuid:=gen_random_uuid();
  revision uuid; stale uuid; expires timestamptz; lease timestamptz; delivery jsonb; count_before integer;
  state jsonb:='{"history":[{"role":"user","text":"chat1"},{"role":"misaki","text":"reply1"}],"memory":["long memory"],"todayMemory":{"date":"2026/09/18","items":["today memory"]},"relationshipPoints":1}';
begin
  assert not has_table_privilege('authenticated','public.misaki_temporary_roots','select');
  assert not has_table_privilege('authenticated','public.misaki_temporary_roots','insert');
  assert not has_function_privilege('authenticated','public.write_misaki_temporary_root(uuid,text,jsonb,uuid,boolean)','execute');
  assert not has_function_privilege('anon','public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,uuid)','execute');
  assert not has_function_privilege('authenticated','public.finish_misaki_body_clock_delivery(uuid,timestamptz,text,text,text,jsonb,integer,uuid,text,jsonb,timestamptz)','execute');
  assert (select relrowsecurity from pg_class where oid='public.misaki_temporary_roots'::regclass);
  insert into auth.users(id,is_anonymous) values(a,true);
  insert into public.background_push_state(user_id,notifications_enabled,next_push_at)
    values(a,true,clock_timestamp()+interval '5 minutes') returning next_push_at into lease;
  insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
    values(r,a,(now() at time zone 'Asia/Tokyo')::date,true,true,false);
  perform public.complete_misaki_temporary_turn(a,r,'chat1 digest','', 'token1',null,state);
  select t.revision into revision from public.misaki_temporary_roots t where user_id=a;
  assert not exists(select 1 from public.misaki_user_conversation_state where user_id=a);
  stale:=revision;
  select expires_at into expires from public.misaki_temporary_roots where user_id=a;
  state:=jsonb_set(state,'{history}',state->'history'||'[{"role":"misaki","text":"proactive1"}]');
  delivery:=public.finish_misaki_body_clock_delivery(a,lease,'proactive1',null,null,'{"selectorVersion":4}',55,revision,'token2',state);
  select t.revision into revision from public.misaki_temporary_roots t where user_id=a;
  assert revision<>stale;
  assert (select expires_at from public.misaki_temporary_roots where user_id=a)=expires;
  assert not exists(select 1 from public.misaki_user_conversation_state where user_id=a);
  assert (select token from public.misaki_temporary_roots where user_id=a)='token2';
  assert public.complete_misaki_temporary_turn(a,r,'chat1 digest','','ignored old token',null,state)='token1';
  assert (select token from public.misaki_temporary_roots where user_id=a)='token2'; -- Replay never rewinds.
  perform public.save_misaki_temporary_state(a,state->'history',state->'memory',state->'todayMemory',1,revision);
  begin
    perform public.save_misaki_temporary_state(a,'[]','[]','{"date":"","items":[]}',0,stale);
    raise exception 'stale checkpoint accepted';
  exception when others then if sqlerrm<>'temporary state changed' then raise; end if; end;
  -- Email sending may fail here; subsequent successful chat updates the checkpoint atomically.
  state:=jsonb_set(state,'{history}',state->'history'||'[{"role":"user","text":"chat2"},{"role":"misaki","text":"reply2"}]');
  state:=jsonb_set(state,'{relationshipPoints}','2');
  insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
    values(r2,a,(now() at time zone 'Asia/Tokyo')::date,true,true,true);
  perform public.complete_misaki_temporary_turn(a,r2,'chat2 digest','token1 digest','token3',revision,state);
  select t.revision into revision from public.misaki_temporary_roots t where user_id=a;
  assert (select jsonb_array_length(history) from public.misaki_user_conversation_state where user_id=a)=5;
  assert (select intimacy_points from public.misaki_relationship_state where user_id=a)=2;
  state:=jsonb_set(state,'{history}',state->'history'||'[{"role":"misaki","text":"proactive2"}]');
  select next_push_at into lease from public.background_push_state where user_id=a;
  delivery:=public.finish_misaki_body_clock_delivery(a,lease,'proactive2','photo4','/photo4','{"selectorVersion":4}',210,revision,'token4',state);
  select t.revision into revision from public.misaki_temporary_roots t where user_id=a;
  assert (select pushes_today from public.background_push_state where user_id=a)=2;
  assert (select count(*) from public.misaki_proactive_deliveries where user_id=a)=2;
  assert (select jsonb_array_length(history) from public.misaki_user_conversation_state where user_id=a)=6;
  assert (select memory from public.misaki_user_conversation_state where user_id=a)='["long memory"]'::jsonb;
  assert (select today_memory from public.misaki_user_conversation_state where user_id=a)=state->'todayMemory';
  perform public.save_misaki_temporary_state(a,state->'history',state->'memory',state->'todayMemory',2,revision);
  assert (select count(*) from public.misaki_relationship_events where user_id=a and event_type='email_save_checkpoint')=1;
  -- A stale delivery must roll back its inserted delivery AND daily scheduling changes.
  select next_push_at into lease from public.background_push_state where user_id=a;
  begin
    perform public.finish_misaki_body_clock_delivery(a,lease,'stale proactive',null,null,'{}',55,stale,'stale token',state);
    raise exception 'stale delivery accepted';
  exception when others then if sqlerrm<>'temporary state changed' then raise; end if; end;
  assert (select count(*) from public.misaki_proactive_deliveries where user_id=a)=2;
  assert (select pushes_today from public.background_push_state where user_id=a)=2;
  assert (select next_push_at from public.background_push_state where user_id=a)=lease;
  -- A stale normal turn is not completed and Free can refund exactly once.
  insert into public.daily_message_usage(user_id,usage_date,message_count) values(a,(now() at time zone 'Asia/Tokyo')::date,1);
  insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
    values(failed,a,(now() at time zone 'Asia/Tokyo')::date,true,true,false);
  begin
    perform public.complete_misaki_temporary_turn(a,failed,'stale message','old parent','stale token',stale,state);
    raise exception 'stale chat accepted';
  exception when others then if sqlerrm<>'temporary state changed' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','is_anonymous',true)::text,true);
  perform public.refund_daily_message(failed); perform public.refund_daily_message(failed);
  assert (select message_count from public.daily_message_usage where user_id=a)=0;
  assert (select completed_at is null from public.daily_message_requests where request_id=failed);
  -- Existing anonymous emotion handling stays neutral; conversion freezes import.
  update auth.users set is_anonymous=false where id=a;
  begin
    perform public.save_misaki_temporary_state(a,'[]','[]','{"date":"","items":[]}',999,revision);
    raise exception 'permanent account reimported';
  exception when others then if sqlerrm<>'anonymous account required' then raise; end if; end;
  assert (select intimacy_points from public.misaki_relationship_state where user_id=a)=2;
  assert (select jsonb_array_length(history) from public.misaki_user_conversation_state where user_id=a)=6;
  -- Expiry is enforced inside service RPC too; cannot resurrect a stale root.
  update auth.users set is_anonymous=true where id=a;
  update public.misaki_temporary_roots set expires_at=clock_timestamp()-interval '1 second' where user_id=a;
  begin
    perform public.write_misaki_temporary_root(a,'resurrected',state,revision);
    raise exception 'expired root restored';
  exception when others then if sqlerrm<>'temporary state expired' then raise; end if; end;
end $$;

do $$
declare u uuid:=gen_random_uuid(); lease timestamptz; revision timestamptz; result jsonb;
begin
  insert into auth.users(id,is_anonymous) values(u,false);
  insert into public.misaki_relationship_state(user_id,intimacy_points) values(u,80);
  insert into public.misaki_user_conversation_state(user_id,history,memory,today_memory)
    values(u,'[{"role":"user","text":"permanent chat"}]','["permanent memory"]','{"date":"2026/09/18","items":["permanent today"]}')
    returning updated_at into revision;
  insert into public.background_push_state(user_id,notifications_enabled,next_push_at)
    values(u,true,clock_timestamp()+interval '5 minutes') returning next_push_at into lease;
  begin
    perform public.finish_misaki_body_clock_delivery(u,lease,'stale generation',null,null,'{}',55,null,null,null,null);
    raise exception 'stale permanent delivery accepted';
  exception when others then if sqlerrm<>'conversation changed during generation' then raise; end if; end;
  assert not exists(select 1 from public.misaki_proactive_deliveries where user_id=u);
  result:=public.finish_misaki_body_clock_delivery(u,lease,'permanent proactive',null,null,'{"selectorVersion":4}',55,null,null,null,revision);
  assert (select jsonb_array_length(history) from public.misaki_user_conversation_state where user_id=u)=2;
  assert (select intimacy_points from public.misaki_relationship_state where user_id=u)=80;
  assert (select memory from public.misaki_user_conversation_state where user_id=u)='["permanent memory"]'::jsonb;
  assert (select today_memory->'items' from public.misaki_user_conversation_state where user_id=u)='["permanent today"]'::jsonb;
  assert (select extract(epoch from(next_push_at-last_push_at))/60 from public.background_push_state where user_id=u)=55;
end $$;
