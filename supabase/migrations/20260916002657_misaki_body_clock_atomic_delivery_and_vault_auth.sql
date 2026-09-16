
-- Cron authenticates with a dedicated encrypted Vault secret, never a literal key.
create schema if not exists private;
do $$
begin
  if not exists (select 1 from vault.secrets where name='misaki_body_clock_cron') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'misaki_body_clock_cron');
  end if;
end $$;
create or replace function private.verify_misaki_body_clock_secret(p_secret text)
returns boolean language sql security definer set search_path = ''
as $$
 select coalesce(length(p_secret)=64 and exists (
   select 1 from vault.decrypted_secrets
   where name='misaki_body_clock_cron'
     and extensions.digest(decrypted_secret,'sha256')=extensions.digest(p_secret,'sha256')
 ),false);
$$;
revoke all on function private.verify_misaki_body_clock_secret(text) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.verify_misaki_body_clock_secret(text) to service_role;
create or replace function public.verify_misaki_body_clock_secret(p_secret text)
returns boolean language sql security invoker set search_path = ''
as $$ select private.verify_misaki_body_clock_secret(p_secret); $$;
revoke all on function public.verify_misaki_body_clock_secret(text) from public, anon, authenticated;
grant execute on function public.verify_misaki_body_clock_secret(text) to service_role;

-- One transaction makes a delivery, its conversation history, and its daily count agree.
create or replace function public.finish_misaki_body_clock_delivery(
 p_user_id uuid, p_lease_until timestamptz, p_message text,
 p_photo_id text, p_photo_src text, p_photo_context jsonb, p_delay_minutes integer
) returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
 s public.background_push_state%rowtype;
 v_now timestamptz := clock_timestamp();
 v_today date := (clock_timestamp() at time zone 'Asia/Tokyo')::date;
 v_count integer;
 v_id uuid;
 v_next timestamptz;
 v_history jsonb;
begin
 select * into s from public.background_push_state where user_id=p_user_id for update;
 if not found or s.next_push_at is distinct from p_lease_until or p_lease_until <= v_now then
   raise exception 'body_clock_lease_expired';
 end if;
 v_count := case when s.push_date=v_today then greatest(coalesce(s.pushes_today,0),0) else 0 end;
 if v_count >= 4 then raise exception 'body_clock_daily_limit'; end if;
 if nullif(btrim(p_message),'') is null then raise exception 'body_clock_empty_message'; end if;
 v_next := v_now + make_interval(mins => greatest(45,least(210,p_delay_minutes)));
 insert into public.misaki_proactive_deliveries(user_id,message,photo_id,photo_src,photo_context,status,delivered_at)
 values(p_user_id,p_message,p_photo_id,p_photo_src,coalesce(p_photo_context,'{}'::jsonb),'delivered',v_now)
 returning id into v_id;
 insert into public.misaki_user_conversation_state(user_id) values(p_user_id) on conflict(user_id) do nothing;
 select history into v_history from public.misaki_user_conversation_state where user_id=p_user_id for update;
 if jsonb_typeof(v_history) is distinct from 'array' then v_history := '[]'::jsonb; end if;
 v_history := v_history || jsonb_build_array(jsonb_build_object('role','misaki','text',p_message,'sentAt',v_now));
 select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into v_history
 from jsonb_array_elements(v_history) with ordinality e(value,ord)
 where ord > greatest(0,jsonb_array_length(v_history)-60);
 update public.misaki_user_conversation_state
 set history=v_history, message_count=greatest(coalesce(message_count,0),0)+1, updated_at=v_now
 where user_id=p_user_id;
 update public.background_push_state set last_push_at=v_now,next_push_at=v_next,
 push_date=v_today,pushes_today=v_count+1,last_background_message=p_message,updated_at=v_now
 where user_id=p_user_id;
 return jsonb_build_object('deliveryId',v_id,'nextPushAt',v_next,'pushesToday',v_count+1);
end $$;
revoke all on function public.finish_misaki_body_clock_delivery(uuid,timestamptz,text,text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.finish_misaki_body_clock_delivery(uuid,timestamptz,text,text,text,jsonb,integer) to service_role;
