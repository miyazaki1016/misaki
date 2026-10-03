create table if not exists public.misaki_relationship_state_applications (
 user_id uuid not null references auth.users(id) on delete cascade,request_id uuid not null,processing_version text not null,pattern_ids uuid[] not null default '{}'::uuid[],
 friendship_delta smallint not null default 0 check(friendship_delta between -3 and 3),trust_delta smallint not null default 0 check(trust_delta between -3 and 3),
 playfulness_delta smallint not null default 0 check(playfulness_delta between -3 and 3),affection_delta smallint not null default 0 check(affection_delta between -3 and 3),
 romance_delta smallint not null default 0 check(romance_delta between -3 and 3),before_state jsonb not null,after_state jsonb not null,
 created_at timestamptz not null default clock_timestamp(),primary key(user_id,request_id,processing_version));
alter table public.misaki_relationship_state_applications enable row level security;
revoke all on table public.misaki_relationship_state_applications from public,anon,authenticated;
grant select,insert on table public.misaki_relationship_state_applications to service_role;
create index if not exists misaki_relationship_state_applications_user_created_idx on public.misaki_relationship_state_applications(user_id,created_at desc);
create or replace function public.apply_misaki_relationship_state_v1(p_user_id uuid,p_request_id uuid,p_processing_version text,p_pattern_ids uuid[],
 p_friendship_delta integer default 0,p_trust_delta integer default 0,p_playfulness_delta integer default 0,p_affection_delta integer default 0,p_romance_delta integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_state public.misaki_relationship_state%rowtype;v_before jsonb;v_after jsonb;v_existing jsonb;v_pattern_count integer;v_requested_count integer;v_now timestamptz:=clock_timestamp();
begin
 if nullif(btrim(p_processing_version),'') is null then raise exception 'processing_version_required'; end if;
 if p_friendship_delta not between -3 and 3 or p_trust_delta not between -3 and 3 or p_playfulness_delta not between -3 and 3 or p_affection_delta not between -3 and 3 or p_romance_delta not between -3 and 3 then raise exception 'relationship_delta_out_of_bounds'; end if;
 select after_state into v_existing from public.misaki_relationship_state_applications where user_id=p_user_id and request_id=p_request_id and processing_version=p_processing_version;
 if found then return jsonb_build_object('replayed',true,'state',v_existing); end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';
 if not found then raise exception 'canonical_chat_turn_required'; end if;
 v_requested_count:=coalesce(cardinality(p_pattern_ids),0);
 if v_requested_count=0 then
  if p_friendship_delta<>0 or p_trust_delta<>0 or p_playfulness_delta<>0 or p_affection_delta<>0 or p_romance_delta<>0 then raise exception 'nonzero_delta_requires_pattern'; end if;
 else
  select count(distinct p.id) into v_pattern_count from public.misaki_relationship_patterns p where p.user_id=p_user_id and p.id=any(p_pattern_ids);
  if v_pattern_count<>(select count(distinct x) from unnest(p_pattern_ids)x) then raise exception 'pattern_not_owned_or_missing'; end if;
 end if;
 insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
 select * into v_state from public.misaki_relationship_state where user_id=p_user_id for update;v_before:=to_jsonb(v_state);
 update public.misaki_relationship_state set friendship_score=greatest(0,least(100,friendship_score+p_friendship_delta)),
 trust_score=greatest(0,least(100,trust_score+p_trust_delta)),playfulness_score=greatest(0,least(100,playfulness_score+p_playfulness_delta)),
 affection_score=greatest(0,least(100,affection_score+p_affection_delta)),romance_score=greatest(0,least(100,romance_score+p_romance_delta)),
 relationship_state_version=relationship_state_version+1,relationship_engine_version=p_processing_version,state_updated_at=v_now
 where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*) into v_after;
 insert into public.misaki_relationship_state_applications(user_id,request_id,processing_version,pattern_ids,friendship_delta,trust_delta,playfulness_delta,affection_delta,romance_delta,before_state,after_state)
 values(p_user_id,p_request_id,p_processing_version,coalesce(p_pattern_ids,'{}'::uuid[]),p_friendship_delta,p_trust_delta,p_playfulness_delta,p_affection_delta,p_romance_delta,v_before,v_after);
 insert into public.misaki_relationship_events(user_id,event_type,request_id,before_state,after_state,reason,metadata)
 values(p_user_id,'relationship_state_v1_applied',p_request_id,v_before,v_after,'bounded relationship engine v1 state application',
 jsonb_build_object('processing_version',p_processing_version,'pattern_ids',coalesce(to_jsonb(p_pattern_ids),'[]'::jsonb),'delta',
 jsonb_build_object('friendship',p_friendship_delta,'trust',p_trust_delta,'playfulness',p_playfulness_delta,'affection',p_affection_delta,'romance',p_romance_delta)));
 return jsonb_build_object('replayed',false,'state',v_after);
end $$;
revoke all on function public.apply_misaki_relationship_state_v1(uuid,uuid,text,uuid[],integer,integer,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.apply_misaki_relationship_state_v1(uuid,uuid,text,uuid[],integer,integer,integer,integer,integer) to service_role;