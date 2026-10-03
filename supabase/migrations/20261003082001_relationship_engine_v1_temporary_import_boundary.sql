create table if not exists public.misaki_relationship_temporary_v1_imports (
 user_id uuid primary key references auth.users(id) on delete cascade,checkpoint_event_id bigint not null references public.misaki_relationship_events(id) on delete restrict,
 source_revision uuid not null,relationship_payload jsonb not null,imported_at timestamptz not null default clock_timestamp());
alter table public.misaki_relationship_temporary_v1_imports enable row level security;
revoke all on table public.misaki_relationship_temporary_v1_imports from public,anon,authenticated;
grant select,insert on table public.misaki_relationship_temporary_v1_imports to service_role;
create or replace function public.import_misaki_temporary_relationship_v1(p_user_id uuid,p_source_revision uuid,p_friendship integer,p_trust integer,p_playfulness integer,p_affection integer,p_romance integer,p_relationship_status text,p_engine_version text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_checkpoint_id bigint;v_existing jsonb;v_after jsonb;v_now timestamptz:=clock_timestamp();
begin
 if p_friendship not between 0 and 100 or p_trust not between 0 and 100 or p_playfulness not between 0 and 100 or p_affection not between 0 and 100 or p_romance not between 0 and 100 then raise exception 'relationship_axis_out_of_bounds';end if;
 if p_relationship_status not in ('none','romantic_partner') then raise exception 'invalid_relationship_status';end if;
 if nullif(btrim(p_engine_version),'') is null then raise exception 'engine_version_required';end if;
 select relationship_payload into v_existing from public.misaki_relationship_temporary_v1_imports where user_id=p_user_id;
 if found then return jsonb_build_object('replayed',true,'payload',v_existing);end if;
 select id into v_checkpoint_id from public.misaki_relationship_events where user_id=p_user_id and event_type='email_save_checkpoint' order by id desc limit 1;
 if v_checkpoint_id is null then raise exception 'email_save_checkpoint_required';end if;
 insert into public.misaki_relationship_state(user_id,intimacy_migrated_at) values(p_user_id,v_now) on conflict do nothing;
 perform 1 from public.misaki_relationship_state where user_id=p_user_id for update;
 if exists(select 1 from public.misaki_relationship_state_applications where user_id=p_user_id) then raise exception 'v1_state_already_processed';end if;
 update public.misaki_relationship_state set friendship_score=p_friendship,trust_score=p_trust,playfulness_score=p_playfulness,affection_score=p_affection,
 romance_score=p_romance,relationship_status=p_relationship_status,relationship_state_version=relationship_state_version+1,
 relationship_engine_version=p_engine_version,state_updated_at=v_now where user_id=p_user_id returning to_jsonb(misaki_relationship_state.*) into v_after;
 insert into public.misaki_relationship_temporary_v1_imports(user_id,checkpoint_event_id,source_revision,relationship_payload)
 values(p_user_id,v_checkpoint_id,p_source_revision,coalesce(p_payload,'{}'::jsonb)||jsonb_build_object('friendship',p_friendship,'trust',p_trust,'playfulness',p_playfulness,'affection',p_affection,'romance',p_romance,'relationship_status',p_relationship_status,'engine_version',p_engine_version));
 insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata)
 values(p_user_id,'temporary_relationship_v1_imported',null,v_after,'one-time encrypted temporary relationship v1 import',
 jsonb_build_object('checkpoint_event_id',v_checkpoint_id,'source_revision',p_source_revision,'engine_version',p_engine_version));
 return jsonb_build_object('replayed',false,'state',v_after);
end $$;
revoke all on function public.import_misaki_temporary_relationship_v1(uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.import_misaki_temporary_relationship_v1(uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb) to service_role;