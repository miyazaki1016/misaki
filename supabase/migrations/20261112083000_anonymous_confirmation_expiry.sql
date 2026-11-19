-- Recheck anonymous checkpoint ages at the auth transition, which can occur
-- long after the user requested a confirmation email.
alter function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid,text)
  rename to save_misaki_temporary_state_unstamped;

create function public.save_misaki_temporary_state(
  p_user_id uuid, p_history jsonb, p_memory jsonb, p_today_memory jsonb,
  p_points integer, p_relationship jsonb, p_expected_revision uuid, p_forget_payload text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_result jsonb;
begin
  v_result := public.save_misaki_temporary_state_unstamped(p_user_id,p_history,p_memory,
    p_today_memory,p_points,p_relationship - 'anonymousExpiry',p_expected_revision,p_forget_payload);
  update public.misaki_relationship_events
  set metadata = metadata || jsonb_build_object('anonymousExpiry',p_relationship->'anonymousExpiry')
  where user_id = p_user_id and event_type = 'email_save_checkpoint';
  return v_result;
end;
$$;

revoke all on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid,text)
  from public,anon,authenticated;
grant execute on function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid,text)
  to service_role;

create function public.filter_misaki_anonymous_checkpoint_items(p_items jsonb, p_times jsonb, p_now_ms numeric)
returns jsonb language sql immutable set search_path = '' as $$
  select coalesce(jsonb_agg(item order by ord), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) with ordinality a(item, ord)
  where exists (
    select 1 from jsonb_array_elements(case when jsonb_typeof(p_times)='array' then p_times else '[]'::jsonb end) t
    where t->0 = item
      and case when jsonb_typeof(t->1)='number' then
        (t->>1)::numeric > p_now_ms - 86400000 and (t->>1)::numeric <= p_now_ms
      else false end
  );
$$;
revoke all on function public.filter_misaki_anonymous_checkpoint_items(jsonb,jsonb,numeric) from public,anon,authenticated;

create function public.is_misaki_fresh_checkpoint_message(p_sent_at text, p_now timestamptz)
returns boolean language plpgsql stable set search_path = '' as $$
declare v_sent_at timestamptz;
begin
  if p_sent_at is null or p_sent_at !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$' then
    return false;
  end if;
  v_sent_at := p_sent_at::timestamptz;
  return v_sent_at > p_now - interval '24 hours' and v_sent_at <= p_now;
exception when invalid_datetime_format or datetime_field_overflow then
  return false;
end;
$$;
revoke all on function public.is_misaki_fresh_checkpoint_message(text,timestamptz) from public,anon,authenticated;

create function public.expire_misaki_anonymous_checkpoint_on_confirmation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_times jsonb;
  v_now timestamptz := clock_timestamp();
  v_now_ms numeric := extract(epoch from v_now)*1000;
  v_history jsonb;
  v_memory jsonb;
  v_today jsonb;
begin
  select metadata->'anonymousExpiry' into v_times from public.misaki_relationship_events
  where user_id = new.id and event_type = 'email_save_checkpoint';
  if not found then return new; end if;

  select coalesce((select jsonb_agg(item order by ord)
      from jsonb_array_elements(c.history) with ordinality h(item,ord)
      where public.is_misaki_fresh_checkpoint_message(item->>'sentAt',v_now)), '[]'::jsonb),
    public.filter_misaki_anonymous_checkpoint_items(c.memory,v_times->'memory',v_now_ms),
    jsonb_set(c.today_memory,'{items}',
      public.filter_misaki_anonymous_checkpoint_items(c.today_memory->'items',v_times->'today',v_now_ms))
  into v_history,v_memory,v_today
  from public.misaki_user_conversation_state c where c.user_id=new.id;

  if found then
    update public.misaki_user_conversation_state set history=v_history,memory=v_memory,today_memory=v_today,
      message_count=jsonb_array_length(v_history),
      user_message_count=(select count(*) from jsonb_array_elements(v_history) h where h->>'role'='user'),
      updated_at=v_now where user_id=new.id;
    update public.background_push_state set recent_history=v_history,long_term_memory=v_memory,
      today_memory=v_today,updated_at=v_now where user_id=new.id;
  end if;

  if not coalesce((v_times->>'relationship')::numeric > v_now_ms-86400000
    and (v_times->>'relationship')::numeric <= v_now_ms,false) then
    update public.misaki_relationship_state set intimacy_points=0,intimacy_level='initial',
      emotion_state=jsonb_build_object('primary','neutral','intensity',0),
      action_state='NORMAL',last_interaction_at=null,state_updated_at=v_now where user_id=new.id;
    delete from public.misaki_relationship_events where user_id=new.id and event_type='temporary_relationship_checkpoint';
  end if;

  update public.misaki_relationship_events set metadata=metadata-'anonymousExpiry'
  where user_id=new.id and event_type='email_save_checkpoint';
  return new;
end;
$$;

revoke all on function public.expire_misaki_anonymous_checkpoint_on_confirmation() from public,anon,authenticated;
create trigger misaki_expire_anonymous_checkpoint_on_confirmation
after update of is_anonymous on auth.users for each row
when (old.is_anonymous and not new.is_anonymous)
execute function public.expire_misaki_anonymous_checkpoint_on_confirmation();
