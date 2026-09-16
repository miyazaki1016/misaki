-- A dedicated signing key stays encrypted in Vault. Only service_role can sign.
do $$
begin
  if not exists (select 1 from vault.secrets where name='misaki_body_clock_relay') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'misaki_body_clock_relay');
  end if;
end $$;
create or replace function private.sign_misaki_body_clock_relay(p_timestamp text, p_delivery_id text)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_signature text;
begin
  if p_timestamp is null or p_timestamp !~ '^[0-9]{13}$'
    or abs(extract(epoch from clock_timestamp()) * 1000 - p_timestamp::numeric) > 300000
    or p_delivery_id is null
    or (p_delivery_id <> 'health' and p_delivery_id !~* '^[a-f0-9-]{36}$') then
    raise exception 'invalid_relay_request';
  end if;
  select encode(extensions.hmac('misaki-body-clock-push:v1' || chr(10) || p_timestamp || chr(10) || p_delivery_id,
    decrypted_secret, 'sha256'),'hex') into v_signature
  from vault.decrypted_secrets where name='misaki_body_clock_relay';
  if v_signature is null then raise exception 'relay_key_missing'; end if;
  return v_signature;
end $$;
revoke all on function private.sign_misaki_body_clock_relay(text,text) from public,anon,authenticated;
grant execute on function private.sign_misaki_body_clock_relay(text,text) to service_role;
create or replace function public.sign_misaki_body_clock_relay(p_timestamp text,p_delivery_id text)
returns text language sql security invoker set search_path = ''
as $$ select private.sign_misaki_body_clock_relay(p_timestamp,p_delivery_id); $$;
revoke all on function public.sign_misaki_body_clock_relay(text,text) from public,anon,authenticated;
grant execute on function public.sign_misaki_body_clock_relay(text,text) to service_role;
