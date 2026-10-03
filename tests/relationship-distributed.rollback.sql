-- Verification only: run the entire file in one BEGIN/ROLLBACK transaction.
-- Existing canonical turn IDs are read as references; message contents are never
-- read. All fixture writes go through approved RPCs and are rolled back.
-- No schema changes, direct INSERT/UPDATE, environment changes, or model calls.
-- A real 31-second expiry wait holds only this unique test-version lease; no
-- canonical State lock or state mutation occurs before the wait.
begin;
set local role service_role;
do $$
declare
  u uuid; requests uuid[]; first_request uuid; later_request uuid;
  boundary timestamptz; version text := 'pr47-distributed-rollback-' || gen_random_uuid()::text;
  claim jsonb; result jsonb; token uuid; stale uuid; statement text; pending_before jsonb; import_before jsonb; evidence uuid; episode uuid; pattern uuid;
  phase text; initial_version bigint;
begin
  select user_id into u from public.misaki_relationship_events
    where event_type='chat_turn_completed' and request_id is not null
    group by user_id having count(distinct request_id)>=2 order by min(id) limit 1;
  if u is null then raise exception 'verification_requires_two_canonical_turns'; end if;
  select array_agg(request_id order by id), min(created_at) into requests,boundary
    from public.misaki_relationship_events where user_id=u and event_type='chat_turn_completed';
  first_request:=requests[1]; later_request:=requests[2];
  select to_jsonb(i) into import_before from public.misaki_relationship_temporary_v1_imports i where user_id=u;
  claim:=public.claim_misaki_relationship_processing_v1(u,later_request,version,boundary,30);
  assert not (claim->>'claimed')::boolean and claim->>'reason'='out_of_order';
  claim:=public.claim_misaki_relationship_processing_v1(u,first_request,version,boundary,30);
  assert (claim->>'claimed')::boolean and not (claim->>'replayed')::boolean;
  token:=(claim->>'leaseToken')::uuid;
  claim:=public.claim_misaki_relationship_processing_v1(u,first_request,version,boundary,30);
  assert (claim->>'replayed')::boolean and (claim->>'leaseToken')::uuid=token;
  claim:=public.claim_misaki_relationship_processing_v1(u,later_request,version,boundary,30);
  assert not (claim->>'claimed')::boolean and claim->>'reason'='lease_busy';
  perform public.renew_misaki_relationship_processing_lease_v1(u,first_request,version,token,30);
  begin
    perform public.apply_misaki_relationship_state_v2(u,first_request,version,gen_random_uuid(),'{}'::uuid[]);
    raise exception 'invalid lease accepted';
  exception when others then if sqlerrm<>'relationship_processing_lease_required' then raise; end if; end;
  begin
    perform public.apply_misaki_relationship_critical_event_v2(u,first_request,version,gen_random_uuid(),'romantic_acceptance',version);
    raise exception 'invalid critical lease accepted';
  exception when others then if sqlerrm<>'relationship_processing_lease_required' then raise; end if; end;
  begin
    perform public.apply_misaki_relationship_state_v2(u,first_request,version,token,'{}'::uuid[],4);
    raise exception 'unbounded delta accepted';
  exception when others then if sqlerrm<>'relationship_delta_out_of_bounds' then raise; end if; end;
  begin
    perform public.apply_misaki_relationship_state_v2(u,first_request,version,token,'{}'::uuid[],1);
    raise exception 'missing Pattern accepted';
  exception when others then if sqlerrm<>'nonzero_delta_requires_pattern' then raise; end if; end;
  -- Create one real pending fixture with the live token, then expire ownership.
  pending_before:=public.upsert_misaki_relationship_critical_pending_v2(u,first_request,version,token,'boundary_event','{}',version);
  stale:=token;
  perform pg_sleep(31);
  claim:=public.claim_misaki_relationship_processing_v1(u,first_request,version,boundary,30);
  token:=(claim->>'leaseToken')::uuid; assert token<>stale;
  assert not public.release_misaki_relationship_processing_lease_v1(u,first_request,version,stale);
  begin
    perform public.renew_misaki_relationship_processing_lease_v1(u,first_request,version,stale,30);
    raise exception 'stale renewal accepted';
  exception when others then if sqlerrm<>'relationship_processing_lease_lost' then raise; end if; end;
  begin
    perform public.apply_misaki_relationship_state_v2(u,first_request,version,stale,'{}'::uuid[]);
    raise exception 'stale final accepted';
  exception when others then if sqlerrm<>'relationship_processing_lease_required' then raise; end if; end;
  -- Every intermediate write rejects the old token after expiry and reclaim.
  for statement in select x from unnest(array[
    format('select public.advance_misaki_relationship_processing_v2(%L,%L,%L,%L,%L)',u,first_request,version,stale,'analyzing'),
    format('select public.record_misaki_relationship_evidence_v2(%L,%L,%L,%L,%L,%L,1,70,%L,%L,%L,%L)',u,first_request,version,stale,'stale','trust','direct','user_to_misaki','{}',version),
    format('select public.upsert_misaki_relationship_episode_v2(%L,%L,%L,%L,%L,%L,%L,%L,%L,%L)',u,first_request,version,stale,'stale','care',version,first_request,first_request,'{}'),
    format('select public.upsert_misaki_relationship_pattern_v2(%L,%L,%L,%L,%L,%L,%L,%L,%L,%L)',u,first_request,version,stale,'stale','care',version,'{}',first_request,first_request),
    format('select public.upsert_misaki_relationship_critical_pending_v2(%L,%L,%L,%L,%L,%L,%L)',u,first_request,version,stale,'boundary_event','{}',version),
    format('select public.upsert_misaki_relationship_critical_pending_v2(%L,%L,%L,%L,%L,%L,%L)',u,first_request,version,stale,'romantic_proposal','{}',version),
    format('select public.advance_misaki_relationship_critical_pending_v2(%L,%L,%L,%L,%L,%L,%L)',u,first_request,version,stale,'boundary_event','processing',version),
    format('select public.import_misaki_temporary_relationship_v2(%L,%L,%L,%L,%L,0,0,0,0,0,%L,%L)',u,first_request,version,stale,gen_random_uuid(),'none',version),
    format('select public.apply_misaki_relationship_critical_event_v2(%L,%L,%L,%L,%L,%L)',u,first_request,version,stale,'boundary_event',version)
  ]) x loop
    begin
      execute statement;
      raise exception 'stale mutation accepted';
    exception when others then if sqlerrm<>'relationship_processing_lease_required' then raise; end if; end;
  end loop;
  assert (select status from public.misaki_relationship_processing where user_id=u and request_id=first_request and processing_version=version)='pending';
  assert not exists(select 1 from public.misaki_relationship_evidence where user_id=u and analyzer_version=version);
  assert not exists(select 1 from public.misaki_relationship_episodes where user_id=u and analyzer_version=version);
  assert not exists(select 1 from public.misaki_relationship_patterns where user_id=u and pattern_version=version);
  assert not exists(select 1 from public.misaki_relationship_state_applications where user_id=u and processing_version=version);
  assert (select status from public.misaki_relationship_critical_pending where user_id=u and request_id=first_request and candidate_type='boundary_event')='pending';
  assert import_before is not distinct from (select to_jsonb(i) from public.misaki_relationship_temporary_v1_imports i where user_id=u);
  -- Fresh ownership can progress through the same v2 wrappers.
  perform public.advance_misaki_relationship_critical_pending_v2(u,first_request,version,token,'boundary_event','processing',version);
  evidence:=public.record_misaki_relationship_evidence_v2(u,first_request,version,token,'rollback','trust',1,70,'direct','user_to_misaki','{}',version);
  episode:=public.upsert_misaki_relationship_episode_v2(u,first_request,version,token,'rollback','care',version,first_request,first_request,array[evidence]);
  pattern:=public.upsert_misaki_relationship_pattern_v2(u,first_request,version,token,'rollback','care',version,array[episode],first_request,first_request);
  select relationship_state_version into initial_version from public.misaki_relationship_state where user_id=u;
  result:=public.apply_misaki_relationship_state_v2(u,first_request,version,token,array[pattern],0,1);
  assert not (result->>'replayed')::boolean;
  result:=public.apply_misaki_relationship_state_v2(u,first_request,version,token,array[pattern],0,1);
  assert (result->>'replayed')::boolean;
  assert (select relationship_state_version from public.misaki_relationship_state where user_id=u)=initial_version+1;
  foreach phase in array array['analyzing','evidence_saved','episode_saved','pattern_saved','applied'] loop
    perform public.advance_misaki_relationship_processing_v2(u,first_request,version,token,phase);
  end loop;
  assert public.release_misaki_relationship_processing_lease_v1(u,first_request,version,token);
  claim:=public.claim_misaki_relationship_processing_v1(u,later_request,version,boundary,30);
  assert (claim->>'claimed')::boolean;
  token:=(claim->>'leaseToken')::uuid;
  begin
    perform public.apply_misaki_relationship_state_v2(u,later_request,version,token,array[pattern],0,1);
    raise exception 'Pattern consumed across requests';
  exception when others then if sqlerrm<>'relationship_pattern_already_consumed' then raise; end if; end;
  assert (select relationship_state_version from public.misaki_relationship_state where user_id=u)=initial_version+1;
  assert (select count(*) from public.misaki_relationship_pattern_consumptions where user_id=u and processing_version=version)=1;
  assert public.release_misaki_relationship_processing_lease_v1(u,later_request,version,token);
end $$;
rollback;
