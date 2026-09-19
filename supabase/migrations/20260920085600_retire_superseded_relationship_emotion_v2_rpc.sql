-- The combined emotion+action v2 RPC supersedes the earlier emotion-only write path.
-- Keep the function body for migration history/rollback compatibility, but remove
-- every application-facing execute privilege so there is only one active v2 write boundary.
revoke all on function public.apply_relationship_emotion_v2(text,integer,text,jsonb,jsonb,timestamptz)
from public, anon, authenticated;
