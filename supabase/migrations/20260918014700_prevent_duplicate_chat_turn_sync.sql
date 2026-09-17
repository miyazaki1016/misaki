create or replace function public.sync_user_conversation_state(
  p_history jsonb,
  p_memory jsonb default null::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_history jsonb := '[]'::jsonb;
  v_existing_memory jsonb := '[]'::jsonb;
  v_incoming_history jsonb := '[]'::jsonb;
  v_incoming_memory jsonb := null;
  v_merged_history jsonb := '[]'::jsonb;
  v_final_memory jsonb := '[]'::jsonb;
  v_overlap int := 0;
  v_server_len int := 0;
  v_incoming_len int := 0;
  v_is_delta boolean := false;
  i int;
  j int;
begin
  if v_user_id is null then raise exception 'not authenticated'; end if;

  select coalesce(history,'[]'::jsonb), coalesce(memory,'[]'::jsonb)
    into v_existing_history, v_existing_memory
  from public.misaki_user_conversation_state
  where user_id = v_user_id;

  if not found then
    v_existing_history := '[]'::jsonb;
    v_existing_memory := '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'role', x.role,
      'text', x.text,
      'sentAt', coalesce(x.sent_at, to_char(clock_timestamp(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    ) order by x.ord
  ), '[]'::jsonb)
  into v_incoming_history
  from (
    select ord,
           elem->>'role' as role,
           btrim(elem->>'text') as text,
           nullif(elem->>'sentAt','') as sent_at
    from jsonb_array_elements(coalesce(p_history,'[]'::jsonb)) with ordinality a(elem,ord)
    where elem->>'role' in ('user','misaki')
      and length(btrim(coalesce(elem->>'text',''))) > 0
  ) x;

  v_server_len := jsonb_array_length(v_existing_history);
  v_incoming_len := jsonb_array_length(v_incoming_history);
  v_is_delta := v_incoming_len = 2
    and v_incoming_history->0->>'role' = 'user'
    and v_incoming_history->1->>'role' = 'misaki';

  for i in reverse least(v_server_len, v_incoming_len)..1 loop
    j := 0;
    while j < i loop
      exit when coalesce(v_existing_history->(v_server_len-i+j)->>'role','') <> coalesce(v_incoming_history->j->>'role','')
             or coalesce(v_existing_history->(v_server_len-i+j)->>'text','') <> coalesce(v_incoming_history->j->>'text','');
      j := j + 1;
    end loop;
    if j = i then v_overlap := i; exit; end if;
  end loop;

  if v_server_len = 0 then
    v_merged_history := v_incoming_history;
  elsif v_is_delta then
    if v_overlap > 0 then
      v_merged_history := v_existing_history || (
        select coalesce(jsonb_agg(elem order by ord),'[]'::jsonb)
        from jsonb_array_elements(v_incoming_history) with ordinality t(elem,ord)
        where ord > v_overlap
      );
    else
      v_merged_history := v_existing_history || v_incoming_history;
    end if;
  elsif v_overlap > 0 then
    v_merged_history := v_existing_history || (
      select coalesce(jsonb_agg(elem order by ord),'[]'::jsonb)
      from jsonb_array_elements(v_incoming_history) with ordinality t(elem,ord)
      where ord > v_overlap
    );
  else
    v_merged_history := v_existing_history;
  end if;

  select coalesce(jsonb_agg(elem order by ord),'[]'::jsonb)
    into v_merged_history
  from jsonb_array_elements(v_merged_history) with ordinality t(elem,ord)
  where ord > greatest(jsonb_array_length(v_merged_history)-60,0);

  if p_memory is null then
    v_final_memory := v_existing_memory;
  else
    select coalesce(jsonb_agg(to_jsonb(val) order by ord),'[]'::jsonb)
      into v_incoming_memory
    from (
      select distinct on (btrim(value)) btrim(value) val, ord
      from jsonb_array_elements_text(coalesce(p_memory,'[]'::jsonb)) with ordinality t(value,ord)
      where length(btrim(value)) > 0
      order by btrim(value), ord
    ) q;
    v_final_memory := coalesce(v_incoming_memory,'[]'::jsonb);
  end if;

  insert into public.misaki_user_conversation_state(user_id,history,memory,updated_at)
  values(v_user_id,v_merged_history,v_final_memory,now())
  on conflict(user_id) do update set
    history=excluded.history,
    memory=excluded.memory,
    updated_at=now();

  return jsonb_build_object(
    'historyCount',jsonb_array_length(v_merged_history),
    'memoryCount',jsonb_array_length(v_final_memory),
    'overlapCount',v_overlap,
    'deltaMode',v_is_delta
  );
end;
$$;
