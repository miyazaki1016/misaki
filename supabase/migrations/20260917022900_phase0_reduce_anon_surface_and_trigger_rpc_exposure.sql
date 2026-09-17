-- Phase 0: reduce accidental Data API exposure without changing Supabase anonymous-user behavior.
-- Supabase Auth anonymous users use the authenticated role, not the anon Postgres role.

revoke all on table public.background_push_config from anon, authenticated;
revoke all on table public.daily_message_requests from anon, authenticated;
revoke all on table public.misaki_body_clock_push_attempts from anon, authenticated;

revoke all on table public.background_push_state from anon;
revoke all on table public.conversations from anon;
revoke all on table public.daily_message_usage from anon;
revoke all on table public.memories from anon;
revoke all on table public.misaki_evolution_candidates from anon;
revoke all on table public.misaki_evolution_history from anon;
revoke all on table public.misaki_persona_versions from anon;
revoke all on table public.misaki_prompt_modules from anon;
revoke all on table public.misaki_user_relationship_traits from anon;
revoke all on table public.proactive_message_usage from anon;
revoke all on table public.profiles from anon;
revoke all on table public.push_subscriptions from anon;
revoke all on table public.user_entitlements from anon;
revoke all on table public.work_logs from anon;

revoke execute on function public.append_proactive_to_conversation_state(text) from public, anon;
revoke execute on function public.claim_user_evolution_analysis(text, integer) from public, anon;
revoke execute on function public.consume_daily_message() from public, anon;
revoke execute on function public.consume_daily_message(uuid) from public, anon;
revoke execute on function public.get_daily_message_usage() from public, anon;
revoke execute on function public.review_user_evolution_candidate(uuid, text) from public, anon;
revoke execute on function public.ensure_push_subscription_endpoint_owner() from public, anon, authenticated;

grant execute on function public.append_proactive_to_conversation_state(text) to authenticated;
grant execute on function public.claim_user_evolution_analysis(text, integer) to authenticated;
grant execute on function public.consume_daily_message() to authenticated;
grant execute on function public.consume_daily_message(uuid) to authenticated;
grant execute on function public.consume_proactive_message() to authenticated;
grant execute on function public.create_user_evolution_candidate(text,text,text,text,numeric,text,jsonb) to authenticated;
grant execute on function public.get_daily_message_usage() to authenticated;
grant execute on function public.review_user_evolution_candidate(uuid,text) to authenticated;
grant execute on function public.sync_user_conversation_state(jsonb,jsonb) to authenticated;
