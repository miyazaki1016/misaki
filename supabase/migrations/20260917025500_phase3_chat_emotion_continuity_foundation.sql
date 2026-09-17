create or replace function public.update_relationship_emotion_from_conversation_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := new.user_id;
  v_len integer := jsonb_array_length(coalesce(new.history, '[]'::jsonb));
  v_last jsonb;
  v_prev jsonb;
  v_user_text text := '';
  v_misaki_text text := '';
  v_state public.misaki_relationship_state%rowtype;
  v_before jsonb;
  v_primary text := 'neutral';
  v_intensity integer := 0;
  v_new_primary text := 'neutral';
  v_new_intensity integer := 0;
  v_signal text := 'ordinary_turn';
  v_silence_seconds bigint := 0;
  v_now timestamptz := now();
begin
  if coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.history is not distinct from old.history then
    return new;
  end if;

  if v_len < 2 then return new; end if;

  v_last := new.history -> (v_len - 1);
  v_prev := new.history -> (v_len - 2);
  if v_prev->>'role' <> 'user' or v_last->>'role' <> 'misaki' then return new; end if;

  v_user_text := left(coalesce(v_prev->>'text', ''), 2000);
  v_misaki_text := left(coalesce(v_last->>'text', ''), 2000);
  if btrim(v_user_text) = '' or btrim(v_misaki_text) = '' then return new; end if;

  select * into v_state from public.misaki_relationship_state where user_id = v_user_id for update;
  if found then
    v_before := to_jsonb(v_state);
    v_primary := coalesce(v_state.emotion_state->>'primary', 'neutral');
    v_intensity := greatest(0, least(100, coalesce((v_state.emotion_state->>'intensity')::integer, 0)));
    if v_state.last_interaction_at is not null then
      v_silence_seconds := greatest(floor(extract(epoch from (v_now - v_state.last_interaction_at)))::bigint, 0);
    end if;
  else
    insert into public.misaki_relationship_state(user_id) values (v_user_id) returning * into v_state;
    v_before := null;
  end if;

  v_new_primary := v_primary;
  v_new_intensity := greatest(v_intensity - 8, 0);
  if v_new_intensity = 0 then v_new_primary := 'neutral'; end if;

  if v_user_text ~* '(好き|大好き|愛して|会いたかった|会いたい|かわいい|可愛い|ありがとう|ありがと|嬉しい|うれしい|美咲〜|美咲ー)' then
    v_new_primary := case when v_user_text ~* '(好き|大好き|愛して|会いたかった|会いたい)' then 'affectionate' else 'happy' end;
    v_new_intensity := least(100, greatest(v_intensity, 20) + case when v_silence_seconds >= 259200 then 22 else 14 end);
    v_signal := case when v_silence_seconds >= 259200 then 'warm_reconnection' else 'user_warmth' end;
  elsif v_user_text ~* '(ごめん|ごめんね|すまん|すみません|悪かった)' then
    if v_primary in ('lonely', 'sulky') then
      v_new_primary := 'happy'; v_new_intensity := greatest(18, v_intensity - 18); v_signal := 'repair_after_apology';
    else
      v_new_primary := 'affectionate'; v_new_intensity := least(70, greatest(v_intensity, 15) + 10); v_signal := 'user_apology';
    end if;
  elsif v_user_text ~* '(事故|怪我|けが|救急|病院|倒れ|高熱|息苦|眠くて危|限界|動けない|体調悪)' then
    v_new_primary := 'concerned'; v_new_intensity := least(100, greatest(v_intensity, 25) + 25); v_signal := 'user_safety_concern';
  elsif v_user_text ~* '(嫌い|うざい|ウザい|もう話したくない|放っておいて|ほっといて)' then
    v_new_primary := case when v_primary = 'affectionate' then 'lonely' else 'sulky' end;
    v_new_intensity := least(75, greatest(v_intensity, 20) + 18); v_signal := 'user_rejection';
  end if;

  update public.misaki_relationship_state
  set emotion_state = jsonb_build_object('primary', v_new_primary, 'intensity', v_new_intensity, 'updated_at', v_now, 'source', 'conversation'),
      state_updated_at = v_now
  where user_id = v_user_id
  returning * into v_state;

  insert into public.misaki_relationship_events(user_id,event_type,before_state,after_state,reason,metadata)
  values (v_user_id,'emotion_after_chat',v_before,to_jsonb(v_state),v_signal,
    jsonb_build_object('previous_primary',v_primary,'previous_intensity',v_intensity,'new_primary',v_new_primary,'new_intensity',v_new_intensity,'silence_before_seconds',v_silence_seconds,'user_text_excerpt',left(v_user_text,160),'misaki_text_excerpt',left(v_misaki_text,160)));

  return new;
end;
$$;

revoke execute on function public.update_relationship_emotion_from_conversation_state() from public, anon, authenticated;

drop trigger if exists trg_relationship_emotion_from_conversation_state on public.misaki_user_conversation_state;
create trigger trg_relationship_emotion_from_conversation_state
after insert or update of history on public.misaki_user_conversation_state
for each row execute function public.update_relationship_emotion_from_conversation_state();
