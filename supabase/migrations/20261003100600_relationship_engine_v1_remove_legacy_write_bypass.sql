-- Relationship Engine v1: direct v2 writes + remove legacy write bypasses.
-- All permanent mutations validate the active lease token inside the same DB
-- transaction as the canonical write. Legacy v1 mutation RPCs are not callable
-- by service_role.

create or replace function public.advance_misaki_relationship_processing_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,p_status text,p_last_error text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.misaki_relationship_processing%rowtype; v_old text; v_ok boolean:=false; v_now timestamptz:=clock_timestamp();
begin
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if nullif(btrim(p_processing_version),'') is null then raise exception 'processing_version_required'; end if;
 if p_status not in ('pending','analyzing','evidence_saved','episode_saved','pattern_saved','applied','failed') then raise exception 'invalid_processing_status'; end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;
 insert into public.misaki_relationship_processing(user_id,request_id,processing_version,status,attempts,updated_at)
 values(p_user_id,p_request_id,p_processing_version,'pending',0,v_now) on conflict do nothing;
 select * into v from public.misaki_relationship_processing
 where user_id=p_user_id and request_id=p_request_id and processing_version=p_processing_version for update;
 v_old:=v.status;
 v_ok := p_status=v_old or p_status='failed'
   or (v_old='pending' and p_status='analyzing') or (v_old='analyzing' and p_status='evidence_saved')
   or (v_old='evidence_saved' and p_status='episode_saved') or (v_old='episode_saved' and p_status='pattern_saved')
   or (v_old='pattern_saved' and p_status='applied') or (v_old='failed' and p_status='analyzing');
 if v_old='applied' and p_status<>'applied' then raise exception 'processing_already_applied'; end if;
 if not v_ok then raise exception 'invalid_processing_transition:%->%',v_old,p_status; end if;
 update public.misaki_relationship_processing
 set status=p_status,
     attempts=attempts+case when p_status='analyzing' and v_old<>'analyzing' then 1 else 0 end,
     last_error=case when p_status='failed' then nullif(left(coalesce(p_last_error,''),2000),'') else null end,
     started_at=case when p_status='analyzing' then coalesce(started_at,v_now) else started_at end,
     updated_at=v_now,
     completed_at=case when p_status='applied' then v_now else null end
 where user_id=p_user_id and request_id=p_request_id and processing_version=p_processing_version
 returning * into v;
 return to_jsonb(v);
end $$;

create or replace function public.record_misaki_relationship_evidence_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_evidence_key text,p_axis text,p_direction integer,p_strength integer,p_interpretation text,p_subject text,
 p_payload jsonb,p_analyzer_version text
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
 if p_analyzer_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if nullif(btrim(p_evidence_key),'') is null or nullif(btrim(p_analyzer_version),'') is null then raise exception 'evidence_identity_required'; end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;
 insert into public.misaki_relationship_evidence(user_id,request_id,evidence_key,axis,direction,strength,interpretation,subject,payload,analyzer_version)
 values(p_user_id,p_request_id,p_evidence_key,p_axis,p_direction,p_strength,p_interpretation,
        coalesce(nullif(btrim(p_subject),''),'user_to_misaki'),coalesce(p_payload,'{}'::jsonb),p_analyzer_version)
 on conflict(user_id,request_id,evidence_key,analyzer_version) do update set payload=excluded.payload
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.upsert_misaki_relationship_episode_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_episode_key text,p_episode_type text,p_analyzer_version text,p_first_request_id uuid,p_last_request_id uuid,p_evidence_ids uuid[],p_summary jsonb default '{}'::jsonb
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_count integer; v_need integer;
begin
 if p_analyzer_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if coalesce(cardinality(p_evidence_ids),0)=0 then raise exception 'episode_requires_evidence'; end if;
 v_need := (select count(distinct x) from unnest(p_evidence_ids) x);
 select count(distinct id) into v_count from public.misaki_relationship_evidence
 where user_id=p_user_id and id=any(p_evidence_ids);
 if v_count<>v_need then raise exception 'evidence_not_owned_or_missing'; end if;
 insert into public.misaki_relationship_episodes(user_id,episode_key,episode_type,summary,analyzer_version,first_request_id,last_request_id)
 values(p_user_id,p_episode_key,p_episode_type,coalesce(p_summary,'{}'::jsonb),p_analyzer_version,p_first_request_id,p_last_request_id)
 on conflict(user_id,episode_key,analyzer_version) do update
 set last_request_id=excluded.last_request_id,summary=excluded.summary,updated_at=clock_timestamp()
 returning id into v_id;
 insert into public.misaki_relationship_episode_evidence(user_id,episode_id,evidence_id)
 select p_user_id,v_id,x from unnest(p_evidence_ids) x
 on conflict(episode_id,evidence_id) do nothing;
 return v_id;
end $$;

create or replace function public.upsert_misaki_relationship_pattern_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_pattern_key text,p_pattern_type text,p_pattern_version text,p_episode_ids uuid[],p_first_request_id uuid,p_last_request_id uuid,p_summary jsonb default '{}'::jsonb
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_count integer; v_need integer;
begin
 if p_pattern_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if coalesce(cardinality(p_episode_ids),0)=0 then raise exception 'pattern_requires_episode'; end if;
 v_need := (select count(distinct x) from unnest(p_episode_ids) x);
 select count(distinct id) into v_count from public.misaki_relationship_episodes
 where user_id=p_user_id and id=any(p_episode_ids);
 if v_count<>v_need then raise exception 'episode_not_owned_or_missing'; end if;
 insert into public.misaki_relationship_patterns(user_id,pattern_key,pattern_type,summary,derived_from,pattern_version,first_request_id,last_request_id)
 values(p_user_id,p_pattern_key,p_pattern_type,coalesce(p_summary,'{}'::jsonb),to_jsonb(p_episode_ids),p_pattern_version,p_first_request_id,p_last_request_id)
 on conflict(user_id,pattern_key,pattern_version) do update
 set summary=excluded.summary,derived_from=excluded.derived_from,last_request_id=excluded.last_request_id,updated_at=clock_timestamp()
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.upsert_misaki_relationship_critical_pending_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_candidate_type text,p_context jsonb default '{}'::jsonb,p_validator_version text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.misaki_relationship_critical_pending%rowtype; v_now timestamptz:=clock_timestamp();
begin
 if p_validator_version is not null and p_validator_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if p_candidate_type not in ('romantic_proposal','romantic_acceptance','romantic_rejection','relationship_end','boundary_event','reconciliation') then raise exception 'invalid_relationship_event_type'; end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;
 insert into public.misaki_relationship_critical_pending(user_id,request_id,candidate_type,status,context,validator_version,updated_at)
 values(p_user_id,p_request_id,p_candidate_type,'pending',coalesce(p_context,'{}'::jsonb),nullif(btrim(p_validator_version),''),v_now)
 on conflict(user_id,request_id,candidate_type) do update
 set context=excluded.context,
     validator_version=coalesce(excluded.validator_version,misaki_relationship_critical_pending.validator_version),
     status=case when misaki_relationship_critical_pending.status in ('resolved','dismissed') then misaki_relationship_critical_pending.status else 'pending' end,
     last_error=case when misaki_relationship_critical_pending.status in ('resolved','dismissed') then misaki_relationship_critical_pending.last_error else null end,
     updated_at=v_now
 returning * into v;
 return to_jsonb(v);
end $$;

create or replace function public.advance_misaki_relationship_critical_pending_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_candidate_type text,p_status text,p_validator_version text default null,p_last_error text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.misaki_relationship_critical_pending%rowtype; v_old text; v_ok boolean:=false; v_now timestamptz:=clock_timestamp();
begin
 if p_validator_version is not null and p_validator_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if p_status not in ('pending','processing','resolved','dismissed','failed') then raise exception 'invalid_critical_pending_status'; end if;
 select * into v from public.misaki_relationship_critical_pending
 where user_id=p_user_id and request_id=p_request_id and candidate_type=p_candidate_type for update;
 if not found then raise exception 'critical_pending_not_found'; end if;
 v_old:=v.status;
 v_ok:=p_status=v_old or p_status='failed'
   or (v_old='pending' and p_status in ('processing','dismissed'))
   or (v_old='processing' and p_status in ('resolved','dismissed'))
   or (v_old='failed' and p_status='processing');
 if v_old in ('resolved','dismissed') and p_status<>v_old then raise exception 'critical_pending_terminal'; end if;
 if not v_ok then raise exception 'invalid_critical_pending_transition:%->%',v_old,p_status; end if;
 update public.misaki_relationship_critical_pending
 set status=p_status,
     validator_version=coalesce(nullif(btrim(p_validator_version),''),validator_version),
     attempts=attempts+case when p_status='processing' and v_old<>'processing' then 1 else 0 end,
     last_error=case when p_status='failed' then nullif(left(coalesce(p_last_error,''),2000),'') else null end,
     updated_at=v_now,
     resolved_at=case when p_status in ('resolved','dismissed') then coalesce(resolved_at,v_now) else null end
 where user_id=p_user_id and request_id=p_request_id and candidate_type=p_candidate_type
 returning * into v;
 return to_jsonb(v);
end $$;

create or replace function public.import_misaki_temporary_relationship_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_source_revision uuid,p_friendship integer,p_trust integer,p_playfulness integer,p_affection integer,p_romance integer,
 p_relationship_status text,p_engine_version text,p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_checkpoint_id bigint; v_existing jsonb; v_after jsonb; v_now timestamptz:=clock_timestamp();
begin
 if p_engine_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if p_friendship not between 0 and 100 or p_trust not between 0 and 100
    or p_playfulness not between 0 and 100 or p_affection not between 0 and 100
    or p_romance not between 0 and 100 then raise exception 'relationship_axis_out_of_bounds'; end if;
 if p_relationship_status not in ('none','romantic_partner') then raise exception 'invalid_relationship_status'; end if;
 if nullif(btrim(p_engine_version),'') is null then raise exception 'engine_version_required'; end if;
 select relationship_payload into v_existing
 from public.misaki_relationship_temporary_v1_imports where user_id=p_user_id;
 if found then return jsonb_build_object('replayed',true,'payload',v_existing); end if;
 select id into v_checkpoint_id from public.misaki_relationship_events
 where user_id=p_user_id and event_type='email_save_checkpoint'
 order by id desc limit 1;
 if v_checkpoint_id is null then raise exception 'email_save_checkpoint_required'; end if;
 insert into public.misaki_relationship_state(user_id,intimacy_migrated_at)
 values(p_user_id,v_now) on conflict do nothing;
 perform 1 from public.misaki_relationship_state where user_id=p_user_id for update;
 if exists(select 1 from public.misaki_relationship_state_applications where user_id=p_user_id)
 then raise exception 'v1_state_already_processed'; end if;
 update public.misaki_relationship_state
 set friendship_score=p_friendship,trust_score=p_trust,playfulness_score=p_playfulness,
     affection_score=p_affection,romance_score=p_romance,relationship_status=p_relationship_status,
     relationship_state_version=relationship_state_version+1,relationship_engine_version=p_engine_version,
     state_updated_at=v_now
 where user_id=p_user_id
 returning to_jsonb(misaki_relationship_state.*) into v_after;
 insert into public.misaki_relationship_temporary_v1_imports(user_id,checkpoint_event_id,source_revision,relationship_payload)
 values(p_user_id,v_checkpoint_id,p_source_revision,
   coalesce(p_payload,'{}'::jsonb)||jsonb_build_object(
     'friendship',p_friendship,'trust',p_trust,'playfulness',p_playfulness,'affection',p_affection,'romance',p_romance,
     'relationship_status',p_relationship_status,'engine_version',p_engine_version));
 insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata)
 values(p_user_id,'temporary_relationship_v1_imported',null,v_after,
   'one-time encrypted temporary relationship v1 import',
   jsonb_build_object('checkpoint_event_id',v_checkpoint_id,'source_revision',p_source_revision,'engine_version',p_engine_version));
 return jsonb_build_object('replayed',false,'state',v_after);
end $$;

revoke execute on function public.advance_misaki_relationship_processing_v1(uuid,uuid,text,text,text) from service_role;
revoke execute on function public.record_misaki_relationship_evidence_v1(uuid,uuid,text,text,integer,integer,text,text,jsonb,text) from service_role;
revoke execute on function public.upsert_misaki_relationship_episode_v1(uuid,text,text,text,uuid,uuid,uuid[],jsonb) from service_role;
revoke execute on function public.upsert_misaki_relationship_pattern_v1(uuid,text,text,text,uuid[],uuid,uuid,jsonb) from service_role;
revoke execute on function public.upsert_misaki_relationship_critical_pending_v1(uuid,uuid,text,jsonb,text) from service_role;
revoke execute on function public.advance_misaki_relationship_critical_pending_v1(uuid,uuid,text,text,text,text) from service_role;
revoke execute on function public.import_misaki_temporary_relationship_v1(uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb) from service_role;
