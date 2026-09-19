-- Harden relationship v2 persistence inputs. The application already sanitizes
-- signals; the RPC also enforces shape/size so event metadata cannot grow without bound.
create or replace function public.apply_relationship_emotion_action_v2(
  p_primary text,p_intensity integer,p_action text,p_direction text,p_emotion_reason text,p_action_reason text,
  p_evidence jsonb default '[]'::jsonb,p_signal_summary jsonb default '[]'::jsonb,p_expected_state_updated_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_before public.misaki_relationship_state%rowtype;
  v_after public.misaki_relationship_state%rowtype;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'permanent account required'; end if;
  if not (p_primary=any(array['neutral','happy','affectionate','concerned','hurt','sulky','guarded'])) then raise exception 'invalid emotion primary'; end if;
  if p_intensity<0 or p_intensity>100 then raise exception 'invalid emotion intensity'; end if;
  if not (p_action=any(array['NORMAL','WAIT','TEASE','SULK','CHASE','PULL','RECONNECT'])) then raise exception 'invalid action'; end if;
  if not (p_direction=any(array['steady','closer','gentle','repair','space','check_in'])) then raise exception 'invalid direction'; end if;
  if nullif(btrim(coalesce(p_emotion_reason,'')),'') is null or length(p_emotion_reason)>160 then raise exception 'invalid emotion reason'; end if;
  if nullif(btrim(coalesce(p_action_reason,'')),'') is null or length(p_action_reason)>160 then raise exception 'invalid action reason'; end if;
  if jsonb_typeof(coalesce(p_evidence,'[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_evidence,'[]'::jsonb))>4 then raise exception 'invalid evidence'; end if;
  if jsonb_typeof(coalesce(p_signal_summary,'[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_signal_summary,'[]'::jsonb))>8 then raise exception 'invalid signal summary'; end if;
  if pg_column_size(coalesce(p_evidence,'[]'::jsonb))>4096 or pg_column_size(coalesce(p_signal_summary,'[]'::jsonb))>8192 then raise exception 'relationship metadata too large'; end if;

  select * into v_before from public.misaki_relationship_state where user_id=v_user_id for update;
  if not found then insert into public.misaki_relationship_state(user_id) values(v_user_id) returning * into v_before; end if;
  if p_expected_state_updated_at is not null and v_before.state_updated_at<>p_expected_state_updated_at then
    return jsonb_build_object('ok',false,'conflict',true,'state',to_jsonb(v_before));
  end if;
  update public.misaki_relationship_state
  set emotion_state=jsonb_build_object('primary',p_primary,'intensity',p_intensity,'updated_at',now(),'source','relationship_v2'),
      action_state=p_action,state_updated_at=now()
  where user_id=v_user_id returning * into v_after;
  insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata)
  values(v_user_id,'emotion_action_v2_after_chat',to_jsonb(v_before),to_jsonb(v_after),left(p_action_reason,160),
    jsonb_build_object('emotion_reason',p_emotion_reason,'action_reason',p_action_reason,'direction',p_direction,'evidence',coalesce(p_evidence,'[]'::jsonb),'signals',coalesce(p_signal_summary,'[]'::jsonb)));
  return jsonb_build_object('ok',true,'conflict',false,'state',to_jsonb(v_after),'direction',p_direction);
end;
$$;
revoke all on function public.apply_relationship_emotion_action_v2(text,integer,text,text,text,text,jsonb,jsonb,timestamptz) from public,anon;
grant execute on function public.apply_relationship_emotion_action_v2(text,integer,text,text,text,text,jsonb,jsonb,timestamptz) to authenticated;
