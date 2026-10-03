-- Relationship Engine v1 control-plane RPC contract.
-- Production was applied first after Work correctly identified the missing safe write boundary.
-- Keep this migration aligned with the production definitions.

create or replace function public.advance_misaki_relationship_processing_v1(p_user_id uuid,p_request_id uuid,p_processing_version text,p_status text,p_last_error text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.misaki_relationship_processing%rowtype; v_old text; v_ok boolean:=false; v_now timestamptz:=clock_timestamp();
begin
 if nullif(btrim(p_processing_version),'') is null then raise exception 'processing_version_required'; end if;
 if p_status not in ('pending','analyzing','evidence_saved','episode_saved','pattern_saved','applied','failed') then raise exception 'invalid_processing_status'; end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;
 insert into public.misaki_relationship_processing(user_id,request_id,processing_version,status,attempts,updated_at) values(p_user_id,p_request_id,p_processing_version,'pending',0,v_now) on conflict do nothing;
 select * into v from public.misaki_relationship_processing where user_id=p_user_id and request_id=p_request_id and processing_version=p_processing_version for update; v_old:=v.status;
 v_ok := p_status=v_old or p_status='failed' or (v_old='pending' and p_status='analyzing') or (v_old='analyzing' and p_status='evidence_saved') or (v_old='evidence_saved' and p_status='episode_saved') or (v_old='episode_saved' and p_status='pattern_saved') or (v_old='pattern_saved' and p_status='applied') or (v_old='failed' and p_status='analyzing');
 if v_old='applied' and p_status<>'applied' then raise exception 'processing_already_applied'; end if;
 if not v_ok then raise exception 'invalid_processing_transition:%->%',v_old,p_status; end if;
 update public.misaki_relationship_processing set status=p_status,attempts=attempts+case when p_status='analyzing' and v_old<>'analyzing' then 1 else 0 end,last_error=case when p_status='failed' then nullif(left(coalesce(p_last_error,''),2000),'') else null end,started_at=case when p_status='analyzing' then coalesce(started_at,v_now) else started_at end,updated_at=v_now,completed_at=case when p_status='applied' then v_now else null end where user_id=p_user_id and request_id=p_request_id and processing_version=p_processing_version returning * into v;
 return to_jsonb(v);
end $$;

create or replace function public.upsert_misaki_relationship_critical_pending_v1(p_user_id uuid,p_request_id uuid,p_candidate_type text,p_context jsonb default '{}'::jsonb,p_validator_version text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.misaki_relationship_critical_pending%rowtype; v_now timestamptz:=clock_timestamp();
begin
 if p_candidate_type not in ('romantic_proposal','romantic_acceptance','romantic_rejection','relationship_end','boundary_event','reconciliation') then raise exception 'invalid_relationship_event_type'; end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed'; if not found then raise exception 'canonical_chat_turn_required'; end if;
 insert into public.misaki_relationship_critical_pending(user_id,request_id,candidate_type,status,context,validator_version,updated_at) values(p_user_id,p_request_id,p_candidate_type,'pending',coalesce(p_context,'{}'::jsonb),nullif(btrim(p_validator_version),''),v_now)
 on conflict(user_id,request_id,candidate_type) do update set context=excluded.context,validator_version=coalesce(excluded.validator_version,misaki_relationship_critical_pending.validator_version),status=case when misaki_relationship_critical_pending.status in ('resolved','dismissed') then misaki_relationship_critical_pending.status else 'pending' end,last_error=case when misaki_relationship_critical_pending.status in ('resolved','dismissed') then misaki_relationship_critical_pending.last_error else null end,updated_at=v_now returning * into v;
 return to_jsonb(v);
end $$;

create or replace function public.advance_misaki_relationship_critical_pending_v1(p_user_id uuid,p_request_id uuid,p_candidate_type text,p_status text,p_validator_version text default null,p_last_error text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.misaki_relationship_critical_pending%rowtype; v_old text; v_ok boolean:=false; v_now timestamptz:=clock_timestamp();
begin
 if p_status not in ('pending','processing','resolved','dismissed','failed') then raise exception 'invalid_critical_pending_status'; end if;
 select * into v from public.misaki_relationship_critical_pending where user_id=p_user_id and request_id=p_request_id and candidate_type=p_candidate_type for update; if not found then raise exception 'critical_pending_not_found'; end if; v_old:=v.status;
 v_ok:=p_status=v_old or p_status='failed' or (v_old='pending' and p_status in ('processing','dismissed')) or (v_old='processing' and p_status in ('resolved','dismissed')) or (v_old='failed' and p_status='processing');
 if v_old in ('resolved','dismissed') and p_status<>v_old then raise exception 'critical_pending_terminal'; end if;
 if not v_ok then raise exception 'invalid_critical_pending_transition:%->%',v_old,p_status; end if;
 update public.misaki_relationship_critical_pending set status=p_status,validator_version=coalesce(nullif(btrim(p_validator_version),''),validator_version),attempts=attempts+case when p_status='processing' and v_old<>'processing' then 1 else 0 end,last_error=case when p_status='failed' then nullif(left(coalesce(p_last_error,''),2000),'') else null end,updated_at=v_now,resolved_at=case when p_status in ('resolved','dismissed') then coalesce(resolved_at,v_now) else null end where user_id=p_user_id and request_id=p_request_id and candidate_type=p_candidate_type returning * into v;
 return to_jsonb(v);
end $$;

revoke execute on function public.advance_misaki_relationship_processing_v1(uuid,uuid,text,text,text) from public,anon,authenticated;
revoke execute on function public.upsert_misaki_relationship_critical_pending_v1(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
revoke execute on function public.advance_misaki_relationship_critical_pending_v1(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.advance_misaki_relationship_processing_v1(uuid,uuid,text,text,text) to service_role;
grant execute on function public.upsert_misaki_relationship_critical_pending_v1(uuid,uuid,text,jsonb,text) to service_role;
grant execute on function public.advance_misaki_relationship_critical_pending_v1(uuid,uuid,text,text,text,text) to service_role;
