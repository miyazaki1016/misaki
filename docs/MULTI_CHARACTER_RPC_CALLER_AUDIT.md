# Multi-Character RPC / Caller / Grant Audit

Status: source-level audit of the current `main` branch and migration history. This is not a live-database grant inspection. No runtime, schema, or production setting was changed.

## Purpose

Before introducing `character_id` / User×Character Pair scope, identify write paths that must remain canonical and the security/concurrency contracts that must not be bypassed.

## Findings at a glance

1. The Relationship Engine v1 worker write surface is deliberately service-role-only and lease-fenced through v2 RPCs. The final migration explicitly revokes service-role execution on the legacy v1 mutators. Keep this invariant.
2. Relationship state, relationship events, Relationship Engine evidence/episodes/patterns/critical candidates, and the current Persona Evolution candidate pipeline are user-scoped today. Adding a character selector only to chat would not isolate them.
3. Persona Evolution is a distinct pipeline from Relationship Engine v1. It loads the user's conversation history and traits, calls Gemini, then saves candidate proposals through `create_user_evolution_candidate`; it reports `autoApplied: false`. The complete SQL/grant/state-transition definition for this older RPC was not located in the migration files reviewed here and remains an explicit follow-up.
4. Body Clock uses canonical conversation state, character prompt loading without a character key, and a transactional delivery completion path. Character isolation must cover proactive messages and delivery state, not only chat.
5. This source audit cannot establish current live database grants, deployed migration parity, or production feature-gate state.

## RPC and caller inventory

| Surface | Source-confirmed caller / RPC | Current scope and checks | Multi-character risk / requirement |
|---|---|---|---|
| Relationship silence state | `advance_relationship_silence_state()` called by its consumer (caller inventory still needs full repo-wide call-site confirmation) | Uses `auth.uid()`; migration revokes PUBLIC/anon and grants authenticated | State and event rows are user-keyed. Decide whether silence is global user context or pair-specific; do not assume it is shared. |
| Relationship critical event | `apply_misaki_relationship_critical_event_v1(...)` | Requires `chat_turn_completed` for the same user/request; locks user relationship state; inserts event; service-role grant visible in migration | Currently one relationship state per user. Must become pair-aware atomically before characters can have separate relationship outcomes. |
| Relationship processing status | `advance_misaki_relationship_processing_v2(...)` | Asserts user/request/processing-version/lease-token; requires canonical completed turn; service-role-only v2 surface | Add pair/character identity to processing identity and uniqueness in a coordinated migration; never remove lease fencing. |
| Relationship evidence | `record_misaki_relationship_evidence_v2(...)` | Lease and processing-version match; canonical completed turn required; conflict key currently `(user_id, request_id, evidence_key, analyzer_version)`; v1 execution revoked from service_role by final hardening migration | Evidence default subject is `user_to_misaki`; scope and subject must distinguish user↔character pairs without cross-character retrieval. |
| Relationship episodes | `upsert_misaki_relationship_episode_v2(...)` | Lease/version checked; verifies evidence belongs to the user; v1 execution revoked from service_role | Episode uniqueness currently `(user_id, episode_key, analyzer_version)`; pair scope must be included in ownership and uniqueness. |
| Relationship patterns | `upsert_misaki_relationship_pattern_v2(...)` | Lease/version checked; verifies episode ownership; v1 execution revoked from service_role | Pattern uniqueness currently `(user_id, pattern_key, pattern_version)`; pair scope must be included in ownership and uniqueness. |
| Critical pending candidate | `upsert_misaki_relationship_critical_pending_v2(...)`, `advance_misaki_relationship_critical_pending_v2(...)` | Lease/version checked; canonical completed turn required for upsert; service-role-only v2; legacy v1 grants revoked | Current primary key `(user_id, request_id, candidate_type)`. A proposal for one character must not be applied to another. |
| Temporary relationship import | `import_misaki_temporary_relationship_v2(...)` | Lease/version checked; validates email checkpoint and import idempotency; legacy v1 execution revoked from service_role | Import target must be an explicit User×Character pair; do not automatically copy Misaki state into new characters. |
| Persona Evolution analysis claim | `claim_user_evolution_analysis({p_fingerprint, p_min_hours})` in `lib/persona/evolution-runner.ts` | Called with the authenticated Supabase client; 12-hour cadence; errors fail closed for the analysis run | Current fingerprint is built from the user's last 20 user messages; it has no character key. Character-specific histories can collide or share cadence. |
| Persona Evolution candidate save | `create_user_evolution_candidate(...)` in `lib/persona/evolution-runner.ts` | Saves proposed trait, reason, confidence, risk and evidence; save errors are logged and skipped; route returns `autoApplied: false` | Existing traits are loaded from `misaki_user_relationship_traits` by `user_id`; the candidate RPC call has no character/pair argument. Must define proposal ownership, review/approval states, and grants before changing. |
| Conversation history API | `app/api/persona/history/route.ts`; canonical state via `loadCanonicalState(user.id)`; anonymous checkpoint via `save_misaki_temporary_state` | Authenticated user context; anonymous root uses revision-aware encrypted temporary state and replay recovery | History, memory and today-memory are currently user-rooted. Preserve temporary root encryption, expiry, revision, and replay semantics while adding a pair-private root. |
| Body Clock root | `loadBodyClockRoot(s, userId)` in `supabase/functions/body-clock/conversation-root.ts` | Permanent user reads `misaki_user_conversation_state`; anonymous user reads encrypted temporary root and returns null when expired/unavailable | Proactive message uses same user-level root; must select the correct pair and never mix history/memory. |
| Body Clock persona | `loadPersonaPrompt(s, row.user_id, "proactive")` in `supabase/functions/body-clock/index.ts` | No character ID supplied; generation prompt explicitly names Misaki and uses canonical history/memory | A chat-only character ID would leave proactive messages speaking as Misaki or using the wrong pair's memory. |
| Body Clock delivery | Delivery completion RPC in `20260916002657_misaki_body_clock_atomic_delivery_and_vault_auth.sql`; push attempts keyed by delivery ID in `20260916010326_misaki_body_clock_push_relay_attempts.sql` | Preserve transaction that couples lease validation, daily limits, delivery creation, history append and counters; push relay has delivery identity | Delivery and notification state need an explicit character/pair owner, with atomicity and idempotency preserved. |

## Source references reviewed

- `app/api/persona/evolution/analyze/route.ts`
- `lib/persona/evolution-runner.ts`
- `lib/persona/evolution-analyzer.ts`
- `app/api/persona/history/route.ts`
- `supabase/functions/body-clock/index.ts`
- `supabase/functions/body-clock/conversation-root.ts`
- `supabase/migrations/20260917023000_phase1_relationship_state_and_events_foundation.sql`
- `supabase/migrations/20260917030000_phase4_lazy_silence_evolution_rpc.sql`
- `supabase/migrations/20261003081605_relationship_engine_v1_foundation.sql`
- `supabase/migrations/20261003081717_relationship_engine_v1_canonical_state_and_critical_event.sql`
- `supabase/migrations/20261003081902_relationship_engine_v1_analysis_write_surface.sql`
- `supabase/migrations/20261003084000_relationship_engine_v1_control_rpcs.sql`
- `supabase/migrations/20261003094200_relationship_engine_v1_full_lease_fencing.sql`
- `supabase/migrations/20261003100600_relationship_engine_v1_remove_legacy_write_bypass.sql`
- `supabase/migrations/20260916002657_misaki_body_clock_atomic_delivery_and_vault_auth.sql`
- `supabase/migrations/20260916010326_misaki_body_clock_push_relay_attempts.sql`

## Remaining audit work

- Search all source files for callers of every RPC listed above and record exact file/line, including the Relationship Engine worker and critical-event validator.
- Locate the SQL definitions and grants for `claim_user_evolution_analysis` and `create_user_evolution_candidate`; document candidate states, ownership, and review/approval transitions.
- Inspect all relevant migrations for actual function ACL changes, but treat them as intended migration history only; separately query the live database read-only to verify deployed schema, grants and migration parity.
- Build a cross-surface ownership matrix for chat, memory, persona evolution, relationship events, proactive delivery, photos, notifications, history export/deletion and anonymous-to-permanent account transition.
- Do not implement schema/backfill until the ownership model and rollback path are reviewed.

## Guardrails

- No direct INSERT/UPDATE/upsert bypass around canonical RPC contracts.
- Keep lease fencing, processing-version validation, canonical-turn checks, replay/idempotency and per-user ordering.
- Do not merge this document or the data-scope inventory as approval to ship multi-character behavior.
- Do not auto-copy existing Misaki memories or relationship state to a future character.
- Gemini suggestions must remain proposals; they must not independently establish relationship status, marriage, divorce or consent.
- This is documentation only; no application code, database, production gate or deployment was changed.
