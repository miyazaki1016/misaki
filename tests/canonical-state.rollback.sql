-- Run after the proposed migration inside BEGIN ... ROLLBACK only.
-- Uses synthetic users; no generation, email, push, or production data persists.
do $$
declare
  u uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); r uuid:=gen_random_uuid();
  premium uuid:=gen_random_uuid(); failed uuid:=gen_random_uuid();
  temporary_request uuid:=gen_random_uuid();
  result jsonb; replay jsonb; points integer; usage_count integer;
  snapshot jsonb:='[{"role":"user","text":"こんにちは"},{"role":"misaki","text":"こんにちは😊"}]';
  generated jsonb:='{"reply":"こんにちは😊","memory":["test memory"],"misakiTodayMemory":{"date":"2026/09/18","items":[]},"usage":{"isPremium":false}}';
begin
  assert not has_function_privilege('authenticated','public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb)','execute');
  assert not has_function_privilege('authenticated','public.sync_user_conversation_state(jsonb,jsonb)','execute');
  assert not has_function_privilege('authenticated','public.save_anonymous_conversation_state(jsonb,jsonb)','execute');
  assert not has_function_privilege('authenticated','public.record_relationship_chat_turn(timestamptz,timestamptz)','execute');
  assert not has_function_privilege('anon','public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb)','execute');
  assert has_function_privilege('service_role','public.complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb)','execute');
  assert exists(select 1 from pg_trigger where tgname='trg_relationship_emotion_from_conversation_state');
  assert exists(select 1 from pg_trigger where tgname='trg_relationship_action_from_emotion');
  insert into auth.users(id,is_anonymous) values(u,false),(a,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'is_anonymous',false,'role','authenticated')::text,true);
  insert into public.daily_message_usage(user_id,usage_date,message_count) values(u,(now() at time zone 'Asia/Tokyo')::date,1);
  insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
    values(r,u,(now() at time zone 'Asia/Tokyo')::date,true,true,false);
  result:=public.complete_misaki_chat_turn(u,r,'こんにちは',now(),generated);
  assert (result->>'relationshipPoints')::integer=1;
  replay:=public.complete_misaki_chat_turn(u,r,'こんにちは',now(),generated);
  assert replay=result;
  assert (select intimacy_points from public.misaki_relationship_state where user_id=u)=1;
  assert (select jsonb_array_length(history) from public.misaki_user_conversation_state where user_id=u)=2;
  assert (select count(*) from public.misaki_relationship_events where user_id=u and event_type='chat_turn_completed')=1;
  begin
    perform public.complete_misaki_chat_turn(u,r,'different message',now(),generated);
    raise exception 'message mismatch accepted';
  exception when others then
    if sqlerrm<>'request_id_message_mismatch' then raise; end if;
  end;
  begin
    perform public.refund_daily_message(r);
    raise exception 'completed request refunded';
  exception when others then
    if sqlerrm<>'completed chat turn cannot be refunded' then raise; end if;
  end;
  assert (select message_count from public.daily_message_usage where user_id=u)=1;
  insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
    values(premium,u,(now() at time zone 'Asia/Tokyo')::date,true,true,true);
  generated:=generated || jsonb_build_object('rootUpdatedAt',(select updated_at from public.misaki_user_conversation_state where user_id=u));
  result:=public.complete_misaki_chat_turn(u,premium,'ありがとう',now(),generated);
  assert (result->>'relationshipPoints')::integer=2; -- Premium still +1.
  assert (select emotion_state->>'primary' from public.misaki_relationship_state where user_id=u)='happy';
  assert (select count(*) from public.misaki_relationship_events where user_id=u and event_type='emotion_after_chat')>=2;
  insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
    values(failed,u,(now() at time zone 'Asia/Tokyo')::date,true,true,false);
  update public.daily_message_usage set message_count=message_count+1 where user_id=u;
  perform public.refund_daily_message(failed);
  perform public.refund_daily_message(failed);
  assert (select message_count from public.daily_message_usage where user_id=u)=1;
  begin
    perform public.complete_misaki_chat_turn(u,failed,'failed',now(),generated);
    raise exception 'refunded request committed';
  exception when others then
    if sqlerrm<>'valid usage request required' then raise; end if;
  end;
  assert (select intimacy_points from public.misaki_relationship_state where user_id=u)=2;
  -- Legacy 30/80/160 boundaries are unchanged.
  foreach points in array array[29,79,159] loop
    update public.misaki_relationship_state set intimacy_points=points where user_id=u;
    r:=gen_random_uuid();
    insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
      values(r,u,(now() at time zone 'Asia/Tokyo')::date,true,true,true);
    generated:=generated || jsonb_build_object('rootUpdatedAt',(select updated_at from public.misaki_user_conversation_state where user_id=u));
    perform public.complete_misaki_chat_turn(u,r,'ordinary',now(),generated);
    assert (select intimacy_level from public.misaki_relationship_state where user_id=u)=
      case points when 29 then 'familiar' when 79 then 'intimate' else 'very_intimate' end;
  end loop;
  insert into public.background_push_state(user_id,relationship_points,long_term_memory,recent_history,notifications_enabled,next_push_at)
    values(u,999,'["fake"]','[]',true,now()+interval '60 minutes');
  assert (select relationship_points from public.background_push_state where user_id=u)=160;
  assert (select long_term_memory from public.background_push_state where user_id=u)='["test memory"]'::jsonb;
  assert (select notifications_enabled from public.background_push_state where user_id=u);
  assert (select next_push_at from public.background_push_state where user_id=u)=now()+interval '60 minutes';
  perform public.edit_misaki_conversation_state(u,'deleteMemory','test memory');
  assert (select memory from public.misaki_user_conversation_state where user_id=u)='[]'::jsonb;
  perform public.edit_misaki_conversation_state(u,'clearHistory');
  assert (select history from public.misaki_user_conversation_state where user_id=u)='[]'::jsonb;
  assert (select intimacy_points from public.misaki_relationship_state where user_id=u)=160;
  -- Body Clock can already have created a neutral relationship row for an anon.
  insert into public.misaki_relationship_state(user_id) values(a);
  perform public.save_misaki_temporary_state(a,snapshot,'["anonymous memory"]','{"date":"","items":[]}',7);
  perform public.save_misaki_temporary_state(a,snapshot || snapshot,'["new anonymous memory"]','{"date":"","items":[]}',8);
  assert (select intimacy_points from public.misaki_relationship_state where user_id=a)=8;
  assert (select memory from public.misaki_user_conversation_state where user_id=a)='["new anonymous memory"]'::jsonb;
  assert (select user_message_count from public.misaki_user_conversation_state where user_id=a)=2;
  assert (select emotion_state->>'primary' from public.misaki_relationship_state where user_id=a)='neutral';
  update auth.users set is_anonymous=false where id=a;
  assert (select intimacy_points from public.misaki_relationship_state where user_id=a)=8;
  assert (select jsonb_array_length(history) from public.misaki_user_conversation_state where user_id=a)=4;
  -- Use a different live anonymous account for temporary transport receipts.
  a:=gen_random_uuid(); insert into auth.users(id,is_anonymous) values(a,true);
  insert into public.daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium)
    values(temporary_request,a,(now() at time zone 'Asia/Tokyo')::date,true,true,false);
  assert public.complete_misaki_temporary_turn(a,temporary_request,'message digest','parent digest','sealed response',null,jsonb_build_object('history',snapshot,'memory','[]'::jsonb,'todayMemory','{"date":"","items":[]}'::jsonb,'relationshipPoints',1))='sealed response';
  assert public.complete_misaki_temporary_turn(a,temporary_request,'message digest','parent digest','different sealed response',null,jsonb_build_object('history',snapshot,'memory','[]'::jsonb,'todayMemory','{"date":"","items":[]}'::jsonb,'relationshipPoints',1))='sealed response';
  assert not exists(select 1 from public.misaki_relationship_state where user_id=a);
  assert not exists(select 1 from public.misaki_user_conversation_state where user_id=a);
  begin
    perform public.complete_misaki_temporary_turn(a,temporary_request,'another message','parent digest','sealed response',null,jsonb_build_object('history',snapshot,'memory','[]'::jsonb,'todayMemory','{"date":"","items":[]}'::jsonb,'relationshipPoints',1));
    raise exception 'temporary billed request reused';
  exception when others then
    if sqlerrm<>'request_id_message_mismatch' then raise; end if;
  end;
  perform set_config('misaki_test.user_id',u::text,true);
end $$;

set local role authenticated;
do $$
declare u uuid:=current_setting('misaki_test.user_id')::uuid;
begin
  assert (select count(*) from public.misaki_relationship_state where user_id<>u)=0;
  update public.background_push_state set relationship_points=999,long_term_memory='["forged"]',recent_history='[]'
    where user_id=u;
  assert (select relationship_points from public.background_push_state where user_id=u)=160;
  assert (select long_term_memory from public.background_push_state where user_id=u)='[]'::jsonb;
  begin
    perform public.complete_misaki_chat_turn(u,gen_random_uuid(),'forged',now(),'{}');
    raise exception 'authenticated completion RPC callable';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
