-- Relationship Engine v1 full lease fencing.
-- All permanent Relationship Engine mutation paths validate the active lease token
-- inside the same DB transaction as the canonical write.

create or replace function public.assert_misaki_relationship_lease_v1(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid
) returns void language plpgsql security invoker set search_path='' as $$
declare v_until timestamptz;
begin
 select lease_until into v_until
 from public.misaki_relationship_worker_leases
 where user_id=p_user_id and processing_version=p_processing_version
   and request_id=p_request_id and lease_token=p_lease_token
 for update;
 if v_until is null or v_until<=clock_timestamp() then
   raise exception 'relationship_processing_lease_required';
 end if;
end $$;

create or replace function public.advance_misaki_relationship_processing_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,p_status text,p_last_error text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 return public.advance_misaki_relationship_processing_v1(p_user_id,p_request_id,p_processing_version,p_status,p_last_error);
end $$;

create or replace function public.record_misaki_relationship_evidence_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_evidence_key text,p_axis text,p_direction integer,p_strength integer,p_interpretation text,p_subject text,
 p_payload jsonb,p_analyzer_version text
) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if p_analyzer_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 return public.record_misaki_relationship_evidence_v1(p_user_id,p_request_id,p_evidence_key,p_axis,p_direction,p_strength,p_interpretation,p_subject,p_payload,p_analyzer_version);
end $$;

create or replace function public.upsert_misaki_relationship_episode_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_episode_key text,p_episode_type text,p_analyzer_version text,p_first_request_id uuid,p_last_request_id uuid,p_evidence_ids uuid[],p_summary jsonb default '{}'::jsonb
) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if p_analyzer_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 return public.upsert_misaki_relationship_episode_v1(p_user_id,p_episode_key,p_episode_type,p_analyzer_version,p_first_request_id,p_last_request_id,p_evidence_ids,p_summary);
end $$;

create or replace function public.upsert_misaki_relationship_pattern_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_pattern_key text,p_pattern_type text,p_pattern_version text,p_episode_ids uuid[],p_first_request_id uuid,p_last_request_id uuid,p_summary jsonb default '{}'::jsonb
) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if p_pattern_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 return public.upsert_misaki_relationship_pattern_v1(p_user_id,p_pattern_key,p_pattern_type,p_pattern_version,p_episode_ids,p_first_request_id,p_last_request_id,p_summary);
end $$;

create or replace function public.upsert_misaki_relationship_critical_pending_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_candidate_type text,p_context jsonb default '{}'::jsonb,p_validator_version text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if p_validator_version is not null and p_validator_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 return public.upsert_misaki_relationship_critical_pending_v1(p_user_id,p_request_id,p_candidate_type,p_context,p_validator_version);
end $$;

create or replace function public.advance_misaki_relationship_critical_pending_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_candidate_type text,p_status text,p_validator_version text default null,p_last_error text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if p_validator_version is not null and p_validator_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 return public.advance_misaki_relationship_critical_pending_v1(p_user_id,p_request_id,p_candidate_type,p_status,p_validator_version,p_last_error);
end $$;

create or replace function public.import_misaki_temporary_relationship_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_source_revision uuid,p_friendship integer,p_trust integer,p_playfulness integer,p_affection integer,p_romance integer,
 p_relationship_status text,p_engine_version text,p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if p_engine_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 return public.import_misaki_temporary_relationship_v1(p_user_id,p_source_revision,p_friendship,p_trust,p_playfulness,p_affection,p_romance,p_relationship_status,p_engine_version,p_payload);
end $$;

revoke execute on function public.assert_misaki_relationship_lease_v1(uuid,uuid,text,uuid) from public,anon,authenticated;
revoke execute on function public.advance_misaki_relationship_processing_v2(uuid,uuid,text,uuid,text,text) from public,anon,authenticated;
revoke execute on function public.record_misaki_relationship_evidence_v2(uuid,uuid,text,uuid,text,text,integer,integer,text,text,jsonb,text) from public,anon,authenticated;
revoke execute on function public.upsert_misaki_relationship_episode_v2(uuid,uuid,text,uuid,text,text,text,uuid,uuid,uuid[],jsonb) from public,anon,authenticated;
revoke execute on function public.upsert_misaki_relationship_pattern_v2(uuid,uuid,text,uuid,text,text,text,uuid[],uuid,uuid,jsonb) from public,anon,authenticated;
revoke execute on function public.upsert_misaki_relationship_critical_pending_v2(uuid,uuid,text,uuid,text,jsonb,text) from public,anon,authenticated;
revoke execute on function public.advance_misaki_relationship_critical_pending_v2(uuid,uuid,text,uuid,text,text,text,text) from public,anon,authenticated;
revoke execute on function public.import_misaki_temporary_relationship_v2(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb) from public,anon,authenticated;

grant execute on function public.assert_misaki_relationship_lease_v1(uuid,uuid,text,uuid) to service_role;
grant execute on function public.advance_misaki_relationship_processing_v2(uuid,uuid,text,uuid,text,text) to service_role;
grant execute on function public.record_misaki_relationship_evidence_v2(uuid,uuid,text,uuid,text,text,integer,integer,text,text,jsonb,text) to service_role;
grant execute on function public.upsert_misaki_relationship_episode_v2(uuid,uuid,text,uuid,text,text,text,uuid,uuid,uuid[],jsonb) to service_role;
grant execute on function public.upsert_misaki_relationship_pattern_v2(uuid,uuid,text,uuid,text,text,text,uuid[],uuid,uuid,jsonb) to service_role;
grant execute on function public.upsert_misaki_relationship_critical_pending_v2(uuid,uuid,text,uuid,text,jsonb,text) to service_role;
grant execute on function public.advance_misaki_relationship_critical_pending_v2(uuid,uuid,text,uuid,text,text,text,text) to service_role;
grant execute on function public.import_misaki_temporary_relationship_v2(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb) to service_role;
