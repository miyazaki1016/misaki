# Multi-Character RPC / Caller / Grant Audit

Status: source-level audit of the current `main` branch and migration history. This is not a live-database grant inspection. No runtime, schema, or production setting was changed.

## Purpose

Before introducing `character_id` / User×Character Pair scope, identify write paths that must remain canonical and the security/concurrency contracts that must not be bypassed.

## Findings at a glance

1. The Relationship Engine v1 worker write surface is deliberately service-role-only and lease-fenced through v2 RPCs. The final migration explicitly revokes service-role execution on the legacy v1 mutators. Keep this invariant.
2. Relationship state, relationship events, Relationship Engine evidence/episodes/patterns/critical candidates, and the current Persona Evolution candidate pipeline are user-scoped today. Adding a character selector only to chat would not isolate them.
3. Persona Evolution is a distinct pipeline from Relationship Engine v1. It loads the user's conversation history and traits, calls Gemini, then saves candidate proposals through `create_user_evolution_candidate`; it reports `autoApplied: false`. A full scan of the 35 tracked SQL migration files found grant/revoke statements for these RPCs in `20260917022900_phase0_reduce_anon_surface_and_trigger_rpc_exposure.sql`, but did not find their function bodies or the candidate table definition. The intended grants are therefore partially visible, while ownership checks and state transitions remain unverified.
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
| Persona Evolution analysis claim | `claim_user_evolution_analysis({p_fingerprint, p_min_hours})` in `lib/persona/evolution-runner.ts` | Migration `20260917022900_phase0_reduce_anon_surface_and_trigger_rpc_exposure.sql` revokes EXECUTE from `PUBLIC`/`anon` and grants it to `authenticated`; function body is not present in the tracked migrations scanned | Current fingerprint is built from the user's last 20 user messages; it has no character key. Character-specific histories can collide or share cadence. Verify caller ownership and fingerprint persistence in the live definition. |
| Persona Evolution candidate save | `create_user_evolution_candidate(...)` in `lib/persona/evolution-runner.ts` | Migration `20260917022900_phase0_reduce_anon_surface_and_trigger_rpc_exposure.sql` grants EXECUTE to `authenticated`; function body is not present in the tracked migrations scanned | Existing traits are loaded from `misaki_user_relationship_traits` by `user_id`; the candidate RPC call has no character/pair argument. Verify internal `auth.uid()` ownership enforcement in the live definition before altering grants or adding pair scope. |
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

## Additional grant finding (migration history only)

`20260917022900_phase0_reduce_anon_surface_and_trigger_rpc_exposure.sql` contains these intended ACL changes:

- `claim_user_evolution_analysis(text, integer)`: revoke EXECUTE from `PUBLIC` and `anon`; grant to `authenticated`.
- `create_user_evolution_candidate(text,text,text,text,numeric,text,jsonb)`: grant EXECUTE to `authenticated`.
- `review_user_evolution_candidate(uuid,text)`: revoke EXECUTE from `PUBLIC` and `anon`; grant to `authenticated`.
- `misaki_evolution_candidates`: revoke all table privileges from `anon` only in this migration.

A scan of all 35 SQL migration files on `main` found no tracked `CREATE FUNCTION` / function body for these three RPCs and no additional matching ACL statements. This is a source-repository finding, not proof of current live privileges. In particular, granting EXECUTE to `authenticated` does not by itself prove a cross-user access flaw: the function bodies may enforce ownership internally, but those checks cannot be verified from the tracked migrations. Treat this as a verification blocker, not as a confirmed vulnerability.

## Remaining audit work

- Search all source files for callers of every RPC listed above and record exact file/line, including the Relationship Engine worker and critical-event validator.
- Obtain the deployed SQL definitions for `claim_user_evolution_analysis`, `create_user_evolution_candidate`, and `review_user_evolution_candidate`; verify `auth.uid()` / candidate-owner checks, candidate states, and review/approval side effects.
- Query the live database read-only to verify deployed function ACLs, table grants, schema and migration parity; treat migration files as intended history only.
- Build a cross-surface ownership matrix for chat, memory, persona evolution, relationship events, proactive delivery, photos, notifications, history export/deletion and anonymous-to-permanent account transition.
- Do not implement schema/backfill until the ownership model and rollback path are reviewed.

## Guardrails

- No direct INSERT/UPDATE/upsert bypass around canonical RPC contracts.
- Keep lease fencing, processing-version validation, canonical-turn checks, replay/idempotency and per-user ordering.
- Do not merge this document or the data-scope inventory as approval to ship multi-character behavior.
- Do not auto-copy existing Misaki memories or relationship state to a future character.
- Gemini suggestions must remain proposals; they must not independently establish relationship status, marriage, divorce or consent.
- This is documentation only; no application code, database, production gate or deployment was changed.


## Live database verification (read-only, 2026-10-13)

The connected Supabase project named `misaki` was inspected using SELECT-only catalog queries. This verifies the current connected database state at inspection time; it does not prove that every deployment environment is identical.

### Deployed function definitions and ACLs

All three RPCs exist in `public`, are owned by `postgres`, and are marked `SECURITY DEFINER`. Their current ACLs are:

- `claim_user_evolution_analysis(text, integer)`: EXECUTE for `postgres`, `authenticated`, and `service_role`; no `PUBLIC` or `anon` entry in the function ACL.
- `create_user_evolution_candidate(text,text,text,text,numeric,text,jsonb)`: EXECUTE for `postgres`, `authenticated`, and `service_role`; no `PUBLIC` or `anon` entry in the function ACL.
- `review_user_evolution_candidate(uuid,text)`: EXECUTE for `postgres`, `authenticated`, and `service_role`; no `PUBLIC` or `anon` entry in the function ACL.

Function-body review found the following ownership controls:

- All three initialize the acting user from `auth.uid()` and raise an error when it is null.
- The claim RPC locks/reads analysis state by that authenticated user ID.
- Candidate creation writes `user_id = auth.uid()`, uses `scope = 'user'`, and applies a per-user daily limit and duplicate-pending check.
- Review selects the requested candidate using all of `id = p_candidate_id`, `scope = 'user'`, and `user_id = auth.uid()`, locks that row, and rejects missing/non-owned candidates. Approval updates only that user's trait row and records the decision in evolution history.
- The three functions use fixed `search_path` settings. They are privileged functions, so future changes must preserve the explicit ownership predicates and avoid introducing unqualified object resolution hazards.

**Conclusion for the original cross-user concern:** the deployed definitions do contain explicit per-user checks; the source-only uncertainty is resolved for these three RPCs in this connected database. No confirmed cross-user candidate-review flaw was found in the inspected function bodies.

### Live table grants and RLS policies

The four relevant tables have RLS enabled:

- `misaki_evolution_candidates`: authenticated table ACL includes CRUD privileges, but the observed authenticated RLS policy is SELECT-only and restricts rows to `scope = 'user'` and `auth.uid() = user_id`. No authenticated INSERT/UPDATE/DELETE policy appeared in the catalog query, so those operations should not pass RLS for this role.
- `misaki_evolution_analysis_state`: authenticated SELECT policy restricts reads to the caller's own `user_id`.
- `misaki_evolution_history`: authenticated SELECT policy restricts reads to the caller's own `user_id` and `scope = 'user'`.
- `misaki_user_relationship_traits`: authenticated SELECT is restricted to the caller's own rows, but authenticated INSERT and UPDATE policies also allow writes where `auth.uid() = user_id`.

The last item is a **design-integrity question, not evidence of cross-user access**: a signed-in user appears able to insert/update their own relationship traits directly through the table API, subject to table grants, RLS, constraints and any triggers. That may be intentional, but it means the approved-evolution RPC is not necessarily the only path that can alter a user's own traits. Before treating human review as an enforcement boundary, inspect all direct trait write callers, constraints and triggers, and decide whether direct self-editing is an accepted product capability. Do not change grants or policies as part of this audit.

### Inspection boundaries

- Queries were read-only catalog SELECTs; no row data was selected and no database mutation was performed.
- This confirms the connected `misaki` project's current definitions/ACLs and RLS metadata only. It does not prove parity across other Supabase projects or environments.
- The project migration ledger and live schema parity still need separate review; catalog results are not a substitute for that comparison.


## Follow-up: trait write boundary and migration ledger (read-only, 2026-10-13)

### Direct trait-write boundary

A catalog query found no non-internal triggers on `public.misaki_user_relationship_traits` or `public.misaki_evolution_candidates` in the connected database. The previously observed authenticated RLS policies allow a signed-in user to INSERT/UPDATE their own trait rows (`auth.uid() = user_id`). Therefore, the database currently does not make the evolution-review RPC the exclusive write path for a user's own traits.

This is not a cross-user isolation finding. It is a product/security boundary decision: if users are intentionally allowed to edit their own traits, document and test that capability; if only reviewed evolution proposals should change traits, direct table writes must eventually be constrained and all legitimate write paths routed through a canonical contract. No policy or grant was changed. A complete repository-wide direct-writer inventory remains open; do not assume that the absence of triggers proves there are no other write paths.

### Live migration ledger versus repository history

The connected project's migration ledger and the current `main` branch do not use identical migration version/name pairs for several related changes. For example, the live ledger reports `20260917022914_phase0_reduce_anon_surface_and_trigger_rpc_exposure`, while the tracked file is `20260917022900_phase0_reduce_anon_surface_and_trigger_rpc_exposure.sql`; similar timestamp/name differences appear in the relationship foundation and Body Clock entries.

This is a **migration-history parity discrepancy to reconcile**, not proof that the deployed schema is wrong: migrations may have been renamed/rebased in source after application, or the environments may have different histories. Before a character-scope schema migration is designed, compare the complete live ledger with repository migration files and inspect the relevant live table/function definitions. Do not blindly reapply or reset migrations to make the lists match.

### Current audit conclusion

- The three inspected Persona Evolution RPCs have explicit authenticated-user ownership checks in the connected database.
- The traits table allows users to write their own trait rows directly under RLS, and neither relevant table has a user-defined trigger in the inspected catalog.
- The connected project's migration ledger differs from the repository's migration version/name pairs; schema-history parity is not yet established.
- All queries in this follow-up were read-only. No application code, database schema/data, grants, policies, production gate, or deployment was changed.


## Follow-up: repository caller sample and complete ledger count (read-only, 2026-10-13)

### Confirmed Persona Evolution caller paths

A targeted source review of the current repository branch confirmed:

- `lib/persona/evolution-runner.ts` reads `misaki_user_relationship_traits` filtered by `user_id`; candidate creation is done through `create_user_evolution_candidate`, not a direct trait INSERT/UPDATE in this runner.
- `app/api/persona/evolution/analyze/route.ts` authenticates the bearer token, loads canonical conversation state for signed-in users, and calls the runner. Its response retains `autoApplied: false`.
- `app/api/persona/evolution/candidates/route.ts` is read-only and filters candidate listing by both `scope = 'user'` and the authenticated `user_id`.
- `app/api/persona/evolution/review/route.ts` calls `review_user_evolution_candidate`; it does not directly update the traits table.
- `app/admin/evolution/page.tsx` invokes these API routes for analysis and review.

This targeted review confirms the intended reviewed-evolution path, but **does not close the repository-wide direct-writer inventory**. GitHub code-search returned no indexed matches for the table name, so a zero-result search must not be treated as proof that no other callers exist. The live RLS allowance for own-row INSERT/UPDATE remains the decisive write-boundary question.

### Full migration-ledger comparison

A read-only comparison of the connected Supabase project's migration ledger with SQL filenames on repository `main` found:

- Repository SQL migration files: **35**
- Live ledger entries: **82**
- Exact version-and-name pairs in both lists: **11**
- Repository-only pairs: **24**
- Live-ledger-only pairs: **71**

The differences are broader than timestamp-only renames. The live ledger contains many entries for which no same-version-and-name file exists on current `main`, including early schema/entitlement/conversation migrations and later canonical-root and relationship-identity migrations. Conversely, current `main` has files whose version/name pairs differ from the live ledger (including multiple relationship phase migrations and Relationship Engine lease-fencing migrations).

These counts compare literal version/name pairs only. They do **not** establish that 71 migrations are missing from the deployed schema or that 24 repository migrations were never applied: files may have been consolidated, renamed, rebased, or applied under different versions. The next safe step is to reconcile migration history against live schema/function definitions and the deployment's source history, not to replay, reset, or rename migrations blindly.

No database, application code, grants, policies, production gate, or deployment was changed during this inspection.
