-- Relationship v2 owns post-chat emotion/action decisions.
-- Retire the two legacy keyword/derived-action triggers that would otherwise
-- overwrite the v2 reducer result during the same canonical chat turn.
-- Lazy silence/proactive RPCs remain intact; only automatic chat/emotion triggers
-- are removed.

drop trigger if exists trg_relationship_emotion_from_conversation_state
  on public.misaki_user_conversation_state;

drop trigger if exists trg_relationship_action_from_emotion
  on public.misaki_relationship_state;
