-- Relationship-time v2 owns emotion/action transitions in the chat route.
-- Disable the legacy keyword trigger so a later conversation-state write cannot
-- overwrite the semantic reducer's persisted result.
drop trigger if exists trg_relationship_emotion_from_conversation_state
on public.misaki_user_conversation_state;

-- Keep the old function temporarily for rollback compatibility, but remove all
-- client execution privileges. It is no longer part of the active write path.
revoke all on function public.update_relationship_emotion_from_conversation_state()
from public, anon, authenticated;
