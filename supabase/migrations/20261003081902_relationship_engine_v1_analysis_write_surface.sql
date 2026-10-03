create table if not exists public.misaki_relationship_processing (
 user_id uuid not null references auth.users(id) on delete cascade,request_id uuid not null,processing_version text not null,
 status text not null default 'pending' check(status in ('pending','analyzing','evidence_saved','episode_saved','pattern_saved','applied','failed')),
 attempts integer not null default 0 check(attempts>=0),last_error text,started_at timestamptz,updated_at timestamptz not null default clock_timestamp(),completed_at timestamptz,
 primary key(user_id,request_id,processing_version));
alter table public.misaki_relationship_processing enable row level security;
revoke all on table public.misaki_relationship_processing from public,anon,authenticated;
grant select,insert,update on table public.misaki_relationship_processing to service_role;
create or replace function public.record_misaki_relationship_evidence_v1(p_user_id uuid,p_request_id uuid,p_evidence_key text,p_axis text,p_direction integer,p_strength integer,p_interpretation text,p_subject text,p_payload jsonb,p_analyzer_version text)
returns uuid language plpgsql security invoker set search_path='' as $$ declare v_id uuid; begin
 if nullif(btrim(p_evidence_key),'') is null or nullif(btrim(p_analyzer_version),'') is null then raise exception 'evidence_identity_required'; end if;
 perform 1 from public.misaki_relationship_events where user_id=p_user_id and request_id=p_request_id and event_type='chat_turn_completed';if not found then raise exception 'canonical_chat_turn_required';end if;
 insert into public.misaki_relationship_evidence(user_id,request_id,evidence_key,axis,direction,strength,interpretation,subject,payload,analyzer_version)
 values(p_user_id,p_request_id,p_evidence_key,p_axis,p_direction,p_strength,p_interpretation,coalesce(nullif(btrim(p_subject),''),'user_to_misaki'),coalesce(p_payload,'{}'::jsonb),p_analyzer_version)
 on conflict(user_id,request_id,evidence_key,analyzer_version) do update set payload=excluded.payload returning id into v_id;return v_id;end $$;
create or replace function public.upsert_misaki_relationship_episode_v1(p_user_id uuid,p_episode_key text,p_episode_type text,p_analyzer_version text,p_first_request_id uuid,p_last_request_id uuid,p_evidence_ids uuid[],p_summary jsonb default '{}'::jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$ declare v_id uuid;v_count integer;v_need integer;begin
 if coalesce(cardinality(p_evidence_ids),0)=0 then raise exception 'episode_requires_evidence';end if;v_need:=(select count(distinct x) from unnest(p_evidence_ids)x);
 select count(distinct id) into v_count from public.misaki_relationship_evidence where user_id=p_user_id and id=any(p_evidence_ids);if v_count<>v_need then raise exception 'evidence_not_owned_or_missing';end if;
 insert into public.misaki_relationship_episodes(user_id,episode_key,episode_type,summary,analyzer_version,first_request_id,last_request_id)
 values(p_user_id,p_episode_key,p_episode_type,coalesce(p_summary,'{}'::jsonb),p_analyzer_version,p_first_request_id,p_last_request_id)
 on conflict(user_id,episode_key,analyzer_version) do update set last_request_id=excluded.last_request_id,summary=excluded.summary,updated_at=clock_timestamp() returning id into v_id;
 insert into public.misaki_relationship_episode_evidence(user_id,episode_id,evidence_id) select p_user_id,v_id,x from unnest(p_evidence_ids)x on conflict(episode_id,evidence_id) do nothing;return v_id;end $$;
create or replace function public.upsert_misaki_relationship_pattern_v1(p_user_id uuid,p_pattern_key text,p_pattern_type text,p_pattern_version text,p_episode_ids uuid[],p_first_request_id uuid,p_last_request_id uuid,p_summary jsonb default '{}'::jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$ declare v_id uuid;v_count integer;v_need integer;begin
 if coalesce(cardinality(p_episode_ids),0)=0 then raise exception 'pattern_requires_episode';end if;v_need:=(select count(distinct x) from unnest(p_episode_ids)x);
 select count(distinct id) into v_count from public.misaki_relationship_episodes where user_id=p_user_id and id=any(p_episode_ids);if v_count<>v_need then raise exception 'episode_not_owned_or_missing';end if;
 insert into public.misaki_relationship_patterns(user_id,pattern_key,pattern_type,summary,derived_from,pattern_version,first_request_id,last_request_id)
 values(p_user_id,p_pattern_key,p_pattern_type,coalesce(p_summary,'{}'::jsonb),to_jsonb(p_episode_ids),p_pattern_version,p_first_request_id,p_last_request_id)
 on conflict(user_id,pattern_key,pattern_version) do update set summary=excluded.summary,derived_from=excluded.derived_from,last_request_id=excluded.last_request_id,updated_at=clock_timestamp() returning id into v_id;return v_id;end $$;
revoke all on function public.record_misaki_relationship_evidence_v1(uuid,uuid,text,text,integer,integer,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.upsert_misaki_relationship_episode_v1(uuid,text,text,text,uuid,uuid,uuid[],jsonb) from public,anon,authenticated;
revoke all on function public.upsert_misaki_relationship_pattern_v1(uuid,text,text,text,uuid[],uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_misaki_relationship_evidence_v1(uuid,uuid,text,text,integer,integer,text,text,jsonb,text) to service_role;
grant execute on function public.upsert_misaki_relationship_episode_v1(uuid,text,text,text,uuid,uuid,uuid[],jsonb) to service_role;
grant execute on function public.upsert_misaki_relationship_pattern_v1(uuid,text,text,text,uuid[],uuid,uuid,jsonb) to service_role;