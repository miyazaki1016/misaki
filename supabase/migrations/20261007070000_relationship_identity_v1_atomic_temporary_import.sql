-- Relationship Identity v1: atomic anonymous checkpoint import.
-- Five-axis/status and Identity are materialized in one DB transaction.

create or replace function public.import_misaki_temporary_relationship_v3(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,
 p_source_revision uuid,p_friendship integer,p_trust integer,p_playfulness integer,p_affection integer,p_romance integer,
 p_relationship_status text,p_engine_version text,p_payload jsonb,
 p_primary_identity text,p_candidate_identity text,p_candidate_confirmations integer,p_candidate_source_version bigint,
 p_constraint_state text,p_constraint_anchor_version bigint,p_romance_reentry_established boolean,p_pre_romantic_identity text,p_resolver_version text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 v_checkpoint_id bigint; v_existing jsonb; v_after jsonb; v_identity_before jsonb; v_identity_after jsonb; v_now timestamptz:=clock_timestamp();
 v_source_version bigint;
begin
 if p_engine_version<>p_processing_version then raise exception 'relationship_processing_version_mismatch'; end if;
 perform public.assert_misaki_relationship_lease_v1(p_user_id,p_request_id,p_processing_version,p_lease_token);
 if p_friendship not between 0 and 100 or p_trust not between 0 and 100 or p_playfulness not between 0 and 100
    or p_affection not between 0 and 100 or p_romance not between 0 and 100 then raise exception 'relationship_axis_out_of_bounds'; end if;
 if p_relationship_status not in ('none','romantic_partner') then raise exception 'invalid_relationship_status'; end if;
 if p_primary_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_primary_identity'; end if;
 if p_candidate_identity is not null and p_candidate_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_candidate_identity'; end if;
 if p_candidate_confirmations not between 0 and 1 then raise exception 'invalid_candidate_confirmations'; end if;
 if p_constraint_state not in ('none','post_breakup','post_rejection','boundary') then raise exception 'invalid_identity_constraint'; end if;
 if p_pre_romantic_identity='lover' then raise exception 'invalid_pre_romantic_identity'; end if;
 if nullif(btrim(p_resolver_version),'') is null then raise exception 'resolver_version_required'; end if;

 select relationship_payload into v_existing from public.misaki_relationship_temporary_v1_imports where user_id=p_user_id;
 if found then
   select to_jsonb(s) into v_identity_after from public.misaki_relationship_identity_state s where user_id=p_user_id;
   if v_identity_after is null then raise exception 'temporary_import_identity_missing'; end if;
   return jsonb_build_object('replayed',true,'payload',v_existing,'identity',v_identity_after);
 end if;

 select id into v_checkpoint_id from public.misaki_relationship_events
 where user_id=p_user_id and event_type='email_save_checkpoint' order by id desc limit 1;
 if v_checkpoint_id is null then raise exception 'email_save_checkpoint_required'; end if;

 insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
 perform 1 from public.misaki_relationship_state where user_id=p_user_id for update;
 if exists(select 1 from public.misaki_relationship_state_applications where user_id=p_user_id) then raise exception 'v1_state_already_processed'; end if;

 select to_jsonb(s) into v_identity_before from public.misaki_relationship_identity_state s where user_id=p_user_id for update;

 update public.misaki_relationship_state set
   friendship_score=p_friendship,trust_score=p_trust,playfulness_score=p_playfulness,affection_score=p_affection,romance_score=p_romance,
   relationship_status=p_relationship_status,relationship_state_version=relationship_state_version+1,
   relationship_engine_version=p_engine_version,state_updated_at=v_now
 where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*),relationship_state_version into v_after,v_source_version;

 insert into public.misaki_relationship_identity_state(
   user_id,primary_identity,candidate_identity,candidate_confirmations,candidate_source_version,constraint_state,constraint_anchor_version,romance_reentry_version,pre_romantic_identity,
   identity_since,identity_version,resolver_version,source_relationship_state_version,updated_at
 ) values(
   p_user_id,p_primary_identity,
   null,0,null,
   p_constraint_state,case when p_constraint_state='none' then null else v_source_version end,
   case when p_constraint_state in ('post_breakup','post_rejection') and coalesce(p_romance_reentry_established,false) then v_source_version else null end,p_pre_romantic_identity,
   v_now,1,p_resolver_version,v_source_version,v_now
 ) on conflict(user_id) do update set
   primary_identity=excluded.primary_identity,candidate_identity=null,
   candidate_confirmations=0,candidate_source_version=null,
   constraint_state=excluded.constraint_state,constraint_anchor_version=excluded.constraint_anchor_version,romance_reentry_version=excluded.romance_reentry_version,pre_romantic_identity=excluded.pre_romantic_identity,
   identity_since=case when misaki_relationship_identity_state.primary_identity<>excluded.primary_identity then v_now else misaki_relationship_identity_state.identity_since end,
   identity_version=misaki_relationship_identity_state.identity_version+1,resolver_version=excluded.resolver_version,
   source_relationship_state_version=excluded.source_relationship_state_version,updated_at=v_now
 returning to_jsonb(misaki_relationship_identity_state.*) into v_identity_after;

 insert into public.misaki_relationship_identity_transitions(
   user_id,source_relationship_state_version,resolver_version,from_identity,to_identity,
   transition_decision,reason_code,before_state,after_state
 ) values(
   p_user_id,v_source_version,p_resolver_version,
   coalesce(v_identity_before->>'primary_identity',p_primary_identity),p_primary_identity,
   'canonical_override','temporary_checkpoint_import',coalesce(v_identity_before,'{}'::jsonb),v_identity_after
 ) on conflict(user_id,source_relationship_state_version,resolver_version) do nothing;

 insert into public.misaki_relationship_temporary_v1_imports(user_id,checkpoint_event_id,source_revision,relationship_payload)
 values(p_user_id,v_checkpoint_id,p_source_revision,coalesce(p_payload,'{}'::jsonb)||jsonb_build_object(
   'friendship',p_friendship,'trust',p_trust,'playfulness',p_playfulness,'affection',p_affection,'romance',p_romance,
   'relationship_status',p_relationship_status,'engine_version',p_engine_version,'identity',v_identity_after));

 insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata)
 values(p_user_id,'temporary_relationship_v1_imported',null,v_after,'atomic temporary relationship + identity import',
   jsonb_build_object('checkpoint_event_id',v_checkpoint_id,'source_revision',p_source_revision,'engine_version',p_engine_version,'resolver_version',p_resolver_version));

 return jsonb_build_object('replayed',false,'state',v_after,'identity',v_identity_after);
end $$;

revoke execute on function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,boolean,text,text) from public,anon,authenticated;
grant execute on function public.import_misaki_temporary_relationship_v3(uuid,uuid,text,uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb,text,text,integer,bigint,text,bigint,boolean,text,text) to service_role;
