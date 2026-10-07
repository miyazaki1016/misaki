-- Persist proof that romance was canonically rebuilt after a breakup/rejection constraint.
-- This is Identity-layer provenance only; it does not mutate Relationship Engine scores/status.

alter table public.misaki_relationship_identity_state
  add column if not exists romance_reentry_version bigint;

create or replace function public.apply_misaki_relationship_identity_v1(
 p_user_id uuid,
 p_source_relationship_state_version bigint,
 p_resolver_version text,
 p_primary_identity text,
 p_candidate_identity text,
 p_candidate_confirmations integer,
 p_candidate_source_version bigint,
 p_constraint_state text,
 p_constraint_anchor_version bigint,
 p_romance_reentry_version bigint,
 p_pre_romantic_identity text,
 p_transition_decision text,
 p_reason_code text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 v_relationship_version bigint; v_current public.misaki_relationship_identity_state%rowtype;
 v_before jsonb; v_after jsonb; v_now timestamptz:=clock_timestamp();
begin
 if nullif(btrim(p_resolver_version),'') is null then raise exception 'resolver_version_required'; end if;
 if nullif(btrim(p_reason_code),'') is null then raise exception 'identity_reason_required'; end if;
 if p_primary_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_primary_identity'; end if;
 if p_candidate_identity is not null and p_candidate_identity not in ('acquaintance','conversation_partner','friend','compatible_friend','trusted_friend','partner_in_crime','best_friend','important_person','person_of_interest','special_person','lover') then raise exception 'invalid_candidate_identity'; end if;
 if p_candidate_confirmations not between 0 and 1 then raise exception 'invalid_candidate_confirmations'; end if;
 if p_constraint_state not in ('none','post_breakup','post_rejection','boundary') then raise exception 'invalid_identity_constraint'; end if;
 if p_constraint_state in ('none','boundary') and p_romance_reentry_version is not null then raise exception 'invalid_romance_reentry_constraint'; end if;
 if p_romance_reentry_version is not null and (p_constraint_anchor_version is null or p_romance_reentry_version<=p_constraint_anchor_version or p_romance_reentry_version>p_source_relationship_state_version) then raise exception 'invalid_romance_reentry_version'; end if;
 if p_pre_romantic_identity='lover' then raise exception 'invalid_pre_romantic_identity'; end if;
 if p_transition_decision not in ('maintain','promote','demote','lateral','canonical_override','hold') then raise exception 'invalid_identity_decision'; end if;

 select relationship_state_version into v_relationship_version
 from public.misaki_relationship_state where user_id=p_user_id;
 if v_relationship_version is null then raise exception 'canonical_relationship_state_required'; end if;
 if v_relationship_version<>p_source_relationship_state_version then raise exception 'stale_relationship_state_version'; end if;

 select * into v_current from public.misaki_relationship_identity_state where user_id=p_user_id for update;
 if found then
   if v_current.source_relationship_state_version>p_source_relationship_state_version then raise exception 'identity_source_regression'; end if;
   if v_current.source_relationship_state_version=p_source_relationship_state_version and v_current.resolver_version=p_resolver_version then
     return jsonb_build_object('replayed',true,'state',to_jsonb(v_current));
   end if;
   v_before:=to_jsonb(v_current);
 else
   v_before:='{}'::jsonb;
 end if;

 insert into public.misaki_relationship_identity_state(
   user_id,primary_identity,candidate_identity,candidate_confirmations,candidate_source_version,
   constraint_state,constraint_anchor_version,romance_reentry_version,pre_romantic_identity,identity_since,identity_version,resolver_version,
   source_relationship_state_version,updated_at
 ) values(
   p_user_id,p_primary_identity,p_candidate_identity,p_candidate_confirmations,p_candidate_source_version,
   p_constraint_state,p_constraint_anchor_version,p_romance_reentry_version,p_pre_romantic_identity,v_now,1,p_resolver_version,p_source_relationship_state_version,v_now
 )
 on conflict(user_id) do update set
   primary_identity=excluded.primary_identity,
   candidate_identity=excluded.candidate_identity,
   candidate_confirmations=excluded.candidate_confirmations,
   candidate_source_version=excluded.candidate_source_version,
   constraint_state=excluded.constraint_state,
   constraint_anchor_version=excluded.constraint_anchor_version,
   romance_reentry_version=excluded.romance_reentry_version,
   pre_romantic_identity=excluded.pre_romantic_identity,
   identity_since=case when misaki_relationship_identity_state.primary_identity<>excluded.primary_identity then v_now else misaki_relationship_identity_state.identity_since end,
   identity_version=misaki_relationship_identity_state.identity_version+1,
   resolver_version=excluded.resolver_version,
   source_relationship_state_version=excluded.source_relationship_state_version,
   updated_at=v_now
 returning to_jsonb(misaki_relationship_identity_state.*) into v_after;

 insert into public.misaki_relationship_identity_transitions(
   user_id,source_relationship_state_version,resolver_version,from_identity,to_identity,
   transition_decision,reason_code,before_state,after_state
 ) values(
   p_user_id,p_source_relationship_state_version,p_resolver_version,
   coalesce(v_before->>'primary_identity',p_primary_identity),p_primary_identity,
   p_transition_decision,p_reason_code,v_before,v_after
 )
 on conflict(user_id,source_relationship_state_version,resolver_version) do nothing;

 return jsonb_build_object('replayed',false,'state',v_after);
end $$;

revoke execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,text,text,text) from service_role;
revoke execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.apply_misaki_relationship_identity_v1(uuid,bigint,text,text,text,integer,bigint,text,bigint,bigint,text,text,text) to service_role;
