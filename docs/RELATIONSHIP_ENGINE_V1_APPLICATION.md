# Relationship Engine v1 application integration

Status: review draft, not a production cutover. Uses updated Draft PR #46 at `1df32aeb05be7fa368648e4492c2c17e18b5d889` as the formal distributed-worker DB contract. No migration or DB definition changes are included.

## Runtime boundary

`app/api/chat/route.ts` loads canonical state, feeds the shared Interpreter, generates/validates using the unchanged shared Gemini JSON generator, and commits through the existing permanent/temporary chat RPC. Only successful commit/replay schedules `next/server.after()` processing. Legacy emotion/turn writes also occur after success, with failures isolated from the already-committed quota receipt.

The just-completed turn affects a subsequent response, not its own pre-save generation. This follows the canonical handoff's post-save ordering. Lab continues supplying synthetic profiles to the same Interpreter and generator with `writes:false`.

`lib/canonical-state.ts` reads five axes and explicit status directly from the server row. Legacy points determine only intimacy stage. The Interpreter gives explicit partner status precedence even at zero romance. During v1 operation the old point-based relationship guide is omitted. Pending critical context takes precedence over asserting an established/continuing relationship; recent saved turns bridge the interval before the background worker creates pending rows.

## Enablement

Both the intended processing version and a valid cutover timestamp are needed:

```
MISAKI_RELATIONSHIP_ENGINE_VERSION=relationship-v1.1
MISAKI_RELATIONSHIP_ENGINE_START_AT=<explicit ISO timestamp selected for rollout>
```

Neither has been set by this implementation. Keep the gate off until Sora/owner acceptance review and explicit rollout authorization. Historical turns before the selected boundary are not analyzed with a new model version. Do not move the timestamp backward to rewrite history.

## Analyzer schema

Input is a canonical saved `Turn`: `requestId`, `message`, `reply`, `savedAt`. The model receives it as untrusted data. No Lab, browser-supplied history or other user's turn enters this boundary.

Output is exactly `{evidence: Evidence[]}` (0–5 items), where each item has:

| Field | Contract |
| --- | --- |
| type | care, disclosure, repair, playful_reciprocity, harm, romantic_declaration |
| axis | friendship, trust, playfulness, affection, romance |
| polarity | -1 or +1 |
| strength | integer 1–100 |
| confidence | finite number 0–1 |
| interpretation | direct, ambiguous, hypothetical, quoted, third_party, negated |
| subject | user_to_misaki, misaki_to_user, third_party |
| supportingTurn | exact user-message substring, 1–96 characters |

Unknown fields (including scores, status, delta) and fabricated support are rejected. The RPC payload also records the canonical supporting request, Evidence type and confidence. Generated Misaki text alone cannot qualify for an Episode.

The conservative initial Episode/Pattern policy is an application policy for review: only direct user→Misaki evidence at confidence ≥0.8 and strength ≥50 qualifies. An intention/type/axis/polarity is grouped at most once per Tokyo day; romantic declarations share one Episode across days/paraphrases. Three independent days form a Pattern; each three-day batch is consumed once. A confirmed Pattern votes ±1 and combined per-axis delta is clamped to ±3. No Pattern means no State RPC, including no version-only update. DB's bounded State RPC remains the final authority for permanent state.

## RPCs and retry

`lib/relationship-processing-v1.ts` owns orchestration and RPC-only permanent writes:

- claim_misaki_relationship_processing_v1
- renew_misaki_relationship_processing_lease_v1
- release_misaki_relationship_processing_lease_v1
- advance_misaki_relationship_processing_v1
- record_misaki_relationship_evidence_v1
- upsert_misaki_relationship_episode_v1
- upsert_misaki_relationship_pattern_v1
- apply_misaki_relationship_state_v2
- upsert_misaki_relationship_critical_pending_v1
- advance_misaki_relationship_critical_pending_v1
- apply_misaki_relationship_critical_event_v2

`lib/relationship-runtime-v1.ts` additionally uses `import_misaki_temporary_relationship_v1` at permanence and the existing encrypted-root writer for anonymous post-save processing. Chat's existing completion RPCs remain unchanged.

Before processing or importing permanent Relationship data, the worker claims the oldest unfinished post-cutover request under the DB's per-user/version lease. `lease_busy`, `out_of_order`, `nothing_to_process`, and a replayed same-request claim are deferrals. A replayed claim returns an existing token; this invocation does **not** adopt or release that token. This prevents two same-request workers from sharing ownership. A lost claim response waits for expiry/reclaim.

A newly acquired token is renewed before each store operation, each internal paginated DB read/write, and before/after each external analyzer or validator call. Lease duration is 120 seconds; analyzer calls retain the separate 10-second/no-retry analysis budget. Renewal errors conservatively stop processing. No stale model result, pending status, or failed ledger journal is written after observed lease loss. State and critical mutations use only v2 RPCs with the live token, independently checked by DB. Consumed Patterns are read from `misaki_relationship_pattern_consumptions`; DB enforces consumption once across request IDs. Both successful and aborted owners release in `finally`; token-specific stale release cannot delete a replacement lease. Release errors remain isolated from saved chat.

The ledger is keyed by user/request/processing version. Completed phases are skipped. Failure records a compact sanitized journal containing the last completed phase and candidate observations; the journal fits the control RPC's 2,000-character field. Recovery performs the explicit failed→analyzing control transition, restores completed phase labels without rerunning their operations, and continues. Partial writes are found by stable keys and links. State success followed by ledger failure is recovered through the application audit/consumed Pattern set and request/version replay guard.

Failures never refund/fail a committed chat. Successful/replayed chat schedules recovery; the worker processes at most three unfinished post-cutover turns chronologically and stops at the first failure or deferral. This is opportunistic retry on user activity, not a continuously running queue worker. Queries page beyond Supabase's default response limit.

## Critical Events

Critical candidates are detected independently from ordinary Evidence using conservative explicit user language. Quoted/hypothetical/third-party text is excluded. Candidate context is saved before an external validator call. The validator emits only `confirmed` and an exact supporting user substring; acceptance must represent explicit mutual agreement, not affection/score/proposal alone. Confirmed facts use the atomic critical RPC. Rejected candidates are dismissed through the pending-control RPC; validator failures stay failed/pending for retry. The critical RPC removes resolved pending rows. Reconciliation never automatically restores partner status; breakup does not zero historical axes.

## Anonymous continuity

The encrypted server-root payload carries `relationshipEngine`: state, version, compact episodes, consumed Pattern keys, processed requests, pending canonical turns and explicit critical events. Queue entries are sealed as part of successful canonical temporary-turn completion. Analysis verifies supporting user/assistant pairs inside the current root and writes through the existing revision-checked root writer. No anonymous Evidence/Episode/Pattern is incrementally written to permanent plaintext tables. Existing Body Clock spread of the encrypted payload preserves the snapshot without generating positive Evidence or extending expiry.

Email save is not made into an early one-time import. After auth becomes permanent, the latest verified frozen root is imported once under the post-save worker’s claimed lease; any pending analysis is finished in memory before the atomic import because the anonymous writer correctly rejects permanent accounts. Failed import/analysis is retryable and blocks subsequent permanent v1 processing, while ordinary conversation/history restoration still succeeds. Old snapshots cannot overwrite an already-recorded import. Canonical state loading is read-only: it detects an outstanding frozen-root import and marks relationship context pending. It never starts an unclaimed import. First post-cutover processing materializes the snapshot before ordinary permanent analysis; until then, generation uses the current canonical row and avoids asserting pending status transitions.

## Verification

- Existing tests: 176/176 pass.
- New tests: 57/57 pass (233 total), including 17 added for this review.
- TypeScript noEmit and Next production build: pass.
- Multi-worker application tests use independent store instances over one shared DB-contract model, explicit barriers, and a controlled clock: same-user/request races, oldest unfinished ordering, lease expiry/reclaim, stale State/critical rejection, cross-request Pattern consumption, competing acceptance/breakup transitions, renewal loss, release failure, guarded import, and saved-chat failure isolation pass. These are deterministic orchestration tests, not live multi-process Vercel tests.
- `tests/relationship-distributed.rollback.sql` ran successfully against the installed DB contract in one BEGIN/ROLLBACK transaction using service_role. It reads existing canonical turn IDs without reading message contents; all fixture writes use RPCs. Checks: out-of-order/busy/replayed claims, renewal, token-specific release/reclaim, stale renewal/final rejection, invalid State/critical tokens, ±3 bound, Pattern requirement, same-request State replay, cross-request Pattern consumption. All seven fixture categories were verified zero after rollback. No persistent DB/schema change.
- The live DB clock-expiry wait is covered by the deterministic worker model; the rollback test reclaims through release rather than holding production locks during an expiry wait. Sora's DB rollback checks are also recorded in the PR #47 review comment.
- Lab writes:false, shared generator boundary and existing quota/history/memory/Body Clock/email-save/device regressions pass.
- Actual Gemini classification quality and signed-in cross-device Preview journeys still require Sora/owner evaluation; mocked generator tests do not establish live model quality.

## Distributed blocker resolution and remaining review

The original missing worker ownership/order/Pattern-consumption contract is resolved by the updated PR #46 contract, token-fenced application integration, and the passing multi-worker/DB rollback tests above. Legacy final apply v1 RPCs are no longer runtime dependencies; installed DB privileges show service_role cannot execute them.

The PR remains Draft and production enablement remains off. Sora still reviews the policy and safety boundaries. Live Gemini classification quality, signed-in cross-device Preview journeys, and actual Vercel multi-instance traffic have not been exercised with the engine enabled. Recovery remains opportunistic on successful/replayed chat activity; there is no newly introduced queue or autonomous retry scheduler.

Body Clock generation architecture is unchanged per this task's no-Body-Clock-change constraint; broader multi-channel Reply Core convergence is not claimed.
