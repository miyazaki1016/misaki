alter table public.misaki_relationship_state
 add column if not exists friendship_score smallint not null default 0,
 add column if not exists trust_score smallint not null default 0,
 add column if not exists playfulness_score smallint not null default 0,
 add column if not exists affection_score smallint not null default 0,
 add column if not exists romance_score smallint not null default 0,
 add column if not exists relationship_status text not null default 'none',
 add column if not exists relationship_state_version bigint not null default 0,
 add column if not exists relationship_engine_version text;
alter table public.misaki_relationship_state
 add constraint misaki_relationship_friendship_score_check check(friendship_score between 0 and 100),
 add constraint misaki_relationship_trust_score_check check(trust_score between 0 and 100),
 add constraint misaki_relationship_playfulness_score_check check(playfulness_score between 0 and 100),
 add constraint misaki_relationship_affection_score_check check(affection_score between 0 and 100),
 add constraint misaki_relationship_romance_score_check check(romance_score between 0 and 100),
 add constraint misaki_relationship_status_v1_check check(relationship_status in ('none','romantic_partner'));
create unique index if not exists misaki_relationship_major_event_request_idx on public.misaki_relationship_events(user_id,request_id,event_type)
 where request_id is not null and event_type in ('romantic_proposal','romantic_acceptance','romantic_rejection','relationship_end','boundary_event','reconciliation');
create or replace function public.apply_misaki_relationship_critical_event_v1(p_user_id uuid,p_request_id uuid,p_event_type text,p_validator_version text,p_reason text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_state public.misaki_relationship_state%rowtype;v_before jsonb;v_after jsonb;v_existing jsonb;v_new_status text;v_now timestamptz:=clock_timestamp();
begin
 if p_event_type not in ('romantic_proposal','romantic_acceptance','romantic_rejection','relationship_end','boundary_event','reconciliation') then raise exception 'invalid_relationship_event_type'; end if;
 if nullif(btrim(p_validator_version),'') is null then raise exception 'validator_version_required'; end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;
 select jsonb_build_object('eventType',event_type,'statusAfter',after_state->>'relationship_status','stateVersion',after_state->>'relationship_state_version') into v_existing
 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type=p_event_type;
 if found then return v_existing||jsonb_build_object('replayed',true); end if;
 insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
 select * into v_state from public.misaki_relationship_state where user_id=p_user_id for update;
 v_before:=to_jsonb(v_state);v_new_status:=v_state.relationship_status;
 if p_event_type='romantic_acceptance' then v_new_status:='romantic_partner'; elsif p_event_type='relationship_end' then v_new_status:='none'; end if;
 update public.misaki_relationship_state set relationship_status=v_new_status,relationship_state_version=relationship_state_version+1,
 relationship_engine_version='v1',state_updated_at=v_now where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*) into v_after;
 insert into public.misaki_relationship_events(user_id,event_type,request_id,before_state,after_state,reason,metadata)
 values(p_user_id,p_event_type,p_request_id,v_before,v_after,coalesce(nullif(btrim(p_reason),''),'relationship engine v1 critical event'),
 coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('validator_version',p_validator_version,'relationship_engine_version','v1'));
 delete from public.misaki_relationship_critical_pending where user_id=p_user_id and request_id=p_request_id and candidate_type=p_event_type;
 return jsonb_build_object('eventType',p_event_type,'statusAfter',v_new_status,'stateVersion',v_after->>'relationship_state_version','replayed',false);
end $$;
revoke all on function public.apply_misaki_relationship_critical_event_v1(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.apply_misaki_relationship_critical_event_v1(uuid,uuid,text,text,text,jsonb) to service_role;