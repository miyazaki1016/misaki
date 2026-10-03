-- Relationship Engine v1 distributed worker safety contract.
-- Adds per-user/version lease ownership, canonical post-cutover ordering,
-- and cross-request single Pattern consumption. Final state/status mutation
-- requires a live lease token.

create table if not exists public.misaki_relationship_worker_leases (
  user_id uuid not null references auth.users(id) on delete cascade,
  processing_version text not null,
  request_id uuid not null,
  lease_token uuid not null,
  lease_until timestamptz not null,
  claimed_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, processing_version),
  unique (lease_token)
);
alter table public.misaki_relationship_worker_leases enable row level security;
revoke all on table public.misaki_relationship_worker_leases from public, anon, authenticated;
grant select, insert, update, delete on table public.misaki_relationship_worker_leases to service_role;

create table if not exists public.misaki_relationship_pattern_consumptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  processing_version text not null,
  pattern_id uuid not null references public.misaki_relationship_patterns(id) on delete restrict,
  request_id uuid not null,
  consumed_at timestamptz not null default clock_timestamp(),
  primary key (user_id, processing_version, pattern_id),
  unique (user_id, processing_version, request_id, pattern_id)
);
alter table public.misaki_relationship_pattern_consumptions enable row level security;
revoke all on table public.misaki_relationship_pattern_consumptions from public, anon, authenticated;
grant select, insert on table public.misaki_relationship_pattern_consumptions to service_role;

create or replace function public.claim_misaki_relationship_processing_v1(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_start_at timestamptz,p_lease_seconds integer default 120
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_now timestamptz:=clock_timestamp();
  v_current_event_id bigint;
  v_head_request uuid;
  v_token uuid;
  v_existing public.misaki_relationship_worker_leases%rowtype;
begin
 if nullif(btrim(p_processing_version),'') is null then raise exception 'processing_version_required'; end if;
 if p_start_at is null then raise exception 'processing_start_at_required'; end if;
 if p_lease_seconds < 30 or p_lease_seconds > 600 then raise exception 'invalid_lease_seconds'; end if;

 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':'||p_processing_version,0));

 select min(id) into v_current_event_id
 from public.misaki_relationship_events
 where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed' and created_at>=p_start_at;
 if v_current_event_id is null then raise exception 'canonical_post_cutover_turn_required'; end if;

 select * into v_existing
 from public.misaki_relationship_worker_leases
 where user_id=p_user_id and processing_version=p_processing_version
 for update;

 if found and v_existing.lease_until>v_now then
   if v_existing.request_id=p_request_id then
     return jsonb_build_object('claimed',true,'replayed',true,'leaseToken',v_existing.lease_token,'leaseUntil',v_existing.lease_until);
   end if;
   return jsonb_build_object('claimed',false,'reason','lease_busy','requestId',v_existing.request_id,'leaseUntil',v_existing.lease_until);
 end if;

 select e.request_id into v_head_request
 from public.misaki_relationship_events e
 left join public.misaki_relationship_processing p
   on p.user_id=e.user_id and p.request_id=e.request_id and p.processing_version=p_processing_version
 where e.user_id=p_user_id
   and e.event_type='chat_turn_completed'
   and e.created_at>=p_start_at
   and coalesce(p.status,'pending')<>'applied'
 order by e.id asc
 limit 1;

 if v_head_request is null then return jsonb_build_object('claimed',false,'reason','nothing_to_process'); end if;
 if v_head_request<>p_request_id then return jsonb_build_object('claimed',false,'reason','out_of_order','headRequestId',v_head_request); end if;

 insert into public.misaki_relationship_processing(user_id,request_id,processing_version,status,attempts,updated_at)
 values(p_user_id,p_request_id,p_processing_version,'pending',0,v_now)
 on conflict do nothing;

 v_token:=gen_random_uuid();
 insert into public.misaki_relationship_worker_leases(user_id,processing_version,request_id,lease_token,lease_until,claimed_at,updated_at)
 values(p_user_id,p_processing_version,p_request_id,v_token,v_now+make_interval(secs=>p_lease_seconds),v_now,v_now)
 on conflict(user_id,processing_version) do update set
   request_id=excluded.request_id,lease_token=excluded.lease_token,lease_until=excluded.lease_until,
   claimed_at=excluded.claimed_at,updated_at=excluded.updated_at;

 return jsonb_build_object('claimed',true,'replayed',false,'leaseToken',v_token,'leaseUntil',v_now+make_interval(secs=>p_lease_seconds));
end $$;

create or replace function public.renew_misaki_relationship_processing_lease_v1(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,p_lease_seconds integer default 120
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_now timestamptz:=clock_timestamp(); v_until timestamptz;
begin
 if p_lease_seconds<30 or p_lease_seconds>600 then raise exception 'invalid_lease_seconds'; end if;
 update public.misaki_relationship_worker_leases
 set lease_until=v_now+make_interval(secs=>p_lease_seconds),updated_at=v_now
 where user_id=p_user_id and processing_version=p_processing_version and request_id=p_request_id and lease_token=p_lease_token and lease_until>v_now
 returning lease_until into v_until;
 if v_until is null then raise exception 'relationship_processing_lease_lost'; end if;
 return jsonb_build_object('ok',true,'leaseUntil',v_until);
end $$;

create or replace function public.release_misaki_relationship_processing_lease_v1(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid
) returns boolean language plpgsql security invoker set search_path='' as $$
declare v_count integer;
begin
 delete from public.misaki_relationship_worker_leases
 where user_id=p_user_id and processing_version=p_processing_version and request_id=p_request_id and lease_token=p_lease_token;
 get diagnostics v_count=row_count;
 return v_count=1;
end $$;

create or replace function public.apply_misaki_relationship_state_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,p_pattern_ids uuid[],
 p_friendship_delta integer default 0,p_trust_delta integer default 0,p_playfulness_delta integer default 0,p_affection_delta integer default 0,p_romance_delta integer default 0
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 v_state public.misaki_relationship_state%rowtype;
 v_before jsonb; v_after jsonb; v_existing jsonb;
 v_pattern_count integer; v_need integer; v_now timestamptz:=clock_timestamp();
begin
 if nullif(btrim(p_processing_version),'') is null then raise exception 'processing_version_required'; end if;
 if p_friendship_delta not between -3 and 3 or p_trust_delta not between -3 and 3 or p_playfulness_delta not between -3 and 3 or p_affection_delta not between -3 and 3 or p_romance_delta not between -3 and 3 then raise exception 'relationship_delta_out_of_bounds'; end if;

 perform 1 from public.misaki_relationship_worker_leases
 where user_id=p_user_id and processing_version=p_processing_version and request_id=p_request_id and lease_token=p_lease_token and lease_until>v_now;
 if not found then raise exception 'relationship_processing_lease_required'; end if;

 select after_state into v_existing from public.misaki_relationship_state_applications
 where user_id=p_user_id and request_id=p_request_id and processing_version=p_processing_version;
 if found then return jsonb_build_object('replayed',true,'state',v_existing); end if;

 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;

 v_need:=coalesce((select count(distinct x) from unnest(p_pattern_ids) x),0);
 if v_need=0 then
   if p_friendship_delta<>0 or p_trust_delta<>0 or p_playfulness_delta<>0 or p_affection_delta<>0 or p_romance_delta<>0 then raise exception 'nonzero_delta_requires_pattern'; end if;
 else
   select count(distinct p.id) into v_pattern_count
   from public.misaki_relationship_patterns p
   where p.user_id=p_user_id and p.pattern_version=p_processing_version and p.id=any(p_pattern_ids);
   if v_pattern_count<>v_need then raise exception 'pattern_not_owned_or_missing'; end if;
 end if;

 insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
 select * into v_state from public.misaki_relationship_state where user_id=p_user_id for update;
 v_before:=to_jsonb(v_state);

 begin
   insert into public.misaki_relationship_pattern_consumptions(user_id,processing_version,pattern_id,request_id)
   select p_user_id,p_processing_version,x,p_request_id from (select distinct unnest(p_pattern_ids) x) s;
 exception when unique_violation then
   raise exception 'relationship_pattern_already_consumed';
 end;

 update public.misaki_relationship_state
 set friendship_score=greatest(0,least(100,friendship_score+p_friendship_delta)),
     trust_score=greatest(0,least(100,trust_score+p_trust_delta)),
     playfulness_score=greatest(0,least(100,playfulness_score+p_playfulness_delta)),
     affection_score=greatest(0,least(100,affection_score+p_affection_delta)),
     romance_score=greatest(0,least(100,romance_score+p_romance_delta)),
     relationship_state_version=relationship_state_version+1,
     relationship_engine_version=p_processing_version,state_updated_at=v_now
 where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*) into v_after;

 insert into public.misaki_relationship_state_applications(
   user_id,request_id,processing_version,pattern_ids,friendship_delta,trust_delta,playfulness_delta,affection_delta,romance_delta,before_state,after_state
 ) values(
   p_user_id,p_request_id,p_processing_version,coalesce(p_pattern_ids,'{}'::uuid[]),
   p_friendship_delta,p_trust_delta,p_playfulness_delta,p_affection_delta,p_romance_delta,v_before,v_after
 );

 insert into public.misaki_relationship_events(user_id,event_type,request_id,before_state,after_state,reason,metadata)
 values(p_user_id,'relationship_state_v2_applied',p_request_id,v_before,v_after,
   'lease-guarded bounded relationship engine state application',
   jsonb_build_object('processing_version',p_processing_version,'pattern_ids',coalesce(to_jsonb(p_pattern_ids),'[]'::jsonb)));

 return jsonb_build_object('replayed',false,'state',v_after);
end $$;

create or replace function public.apply_misaki_relationship_critical_event_v2(
 p_user_id uuid,p_request_id uuid,p_processing_version text,p_lease_token uuid,p_event_type text,p_validator_version text,p_reason text default null,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_state public.misaki_relationship_state%rowtype; v_before jsonb; v_after jsonb; v_existing jsonb; v_new_status text; v_now timestamptz:=clock_timestamp();
begin
 if p_event_type not in ('romantic_proposal','romantic_acceptance','romantic_rejection','relationship_end','boundary_event','reconciliation') then raise exception 'invalid_relationship_event_type'; end if;
 if nullif(btrim(p_validator_version),'') is null then raise exception 'validator_version_required'; end if;

 perform 1 from public.misaki_relationship_worker_leases
 where user_id=p_user_id and processing_version=p_processing_version and request_id=p_request_id and lease_token=p_lease_token and lease_until>v_now;
 if not found then raise exception 'relationship_processing_lease_required'; end if;

 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;

 select jsonb_build_object('eventType',event_type,'statusAfter',after_state->>'relationship_status','stateVersion',after_state->>'relationship_state_version')
 into v_existing from public.misaki_relationship_events
 where user_id=p_user_id and request_id=p_request_id and event_type=p_event_type;
 if found then return v_existing||jsonb_build_object('replayed',true); end if;

 insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
 select * into v_state from public.misaki_relationship_state where user_id=p_user_id for update;

 v_before:=to_jsonb(v_state);
 v_new_status:=v_state.relationship_status;
 if p_event_type='romantic_acceptance' then v_new_status:='romantic_partner';
 elsif p_event_type='relationship_end' then v_new_status:='none'; end if;

 update public.misaki_relationship_state
 set relationship_status=v_new_status,relationship_state_version=relationship_state_version+1,
     relationship_engine_version=p_processing_version,state_updated_at=v_now
 where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*) into v_after;

 insert into public.misaki_relationship_events(user_id,event_type,request_id,before_state,after_state,reason,metadata)
 values(p_user_id,p_event_type,p_request_id,v_before,v_after,
   coalesce(nullif(btrim(p_reason),''),'lease-guarded critical event'),
   coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('validator_version',p_validator_version,'processing_version',p_processing_version));

 delete from public.misaki_relationship_critical_pending
 where user_id=p_user_id and request_id=p_request_id and candidate_type=p_event_type;

 return jsonb_build_object('eventType',p_event_type,'statusAfter',v_new_status,'stateVersion',v_after->>'relationship_state_version','replayed',false);
end $$;

revoke execute on function public.claim_misaki_relationship_processing_v1(uuid,uuid,text,timestamptz,integer) from public,anon,authenticated;
revoke execute on function public.renew_misaki_relationship_processing_lease_v1(uuid,uuid,text,uuid,integer) from public,anon,authenticated;
revoke execute on function public.release_misaki_relationship_processing_lease_v1(uuid,uuid,text,uuid) from public,anon,authenticated;
revoke execute on function public.apply_misaki_relationship_state_v2(uuid,uuid,text,uuid,uuid[],integer,integer,integer,integer,integer) from public,anon,authenticated;
revoke execute on function public.apply_misaki_relationship_critical_event_v2(uuid,uuid,text,uuid,text,text,text,jsonb) from public,anon,authenticated;

grant execute on function public.claim_misaki_relationship_processing_v1(uuid,uuid,text,timestamptz,integer) to service_role;
grant execute on function public.renew_misaki_relationship_processing_lease_v1(uuid,uuid,text,uuid,integer) to service_role;
grant execute on function public.release_misaki_relationship_processing_lease_v1(uuid,uuid,text,uuid) to service_role;
grant execute on function public.apply_misaki_relationship_state_v2(uuid,uuid,text,uuid,uuid[],integer,integer,integer,integer,integer) to service_role;
grant execute on function public.apply_misaki_relationship_critical_event_v2(uuid,uuid,text,uuid,text,text,text,jsonb) to service_role;

-- Prevent the application service role from bypassing the lease/ordering contract.
revoke execute on function public.apply_misaki_relationship_state_v1(uuid,uuid,text,uuid[],integer,integer,integer,integer,integer) from service_role;
revoke execute on function public.apply_misaki_relationship_critical_event_v1(uuid,uuid,text,text,text,jsonb) from service_role;
