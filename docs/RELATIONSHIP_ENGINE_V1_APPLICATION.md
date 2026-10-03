# Relationship Engine v1 application integration

Status: review draft, not a production cutover. Depends on the formal DB contracts in PR #46. No migration or DB definition changes are included.

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

Neither has been set by this implementation. Do not enable before resolving the distributed ordering blocker below and Sora/owner review. Historical turns before the selected boundary are not analyzed with a new model version. Do not move the timestamp backward to rewrite history.

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

- advance_misaki_relationship_processing_v1
- record_misaki_relationship_evidence_v1
- upsert_misaki_relationship_episode_v1
- upsert_misaki_relationship_pattern_v1
- apply_misaki_relationship_state_v1
- upsert_misaki_relationship_critical_pending_v1
- advance_misaki_relationship_critical_pending_v1
- apply_misaki_relationship_critical_event_v1

`lib/relationship-runtime-v1.ts` additionally uses `import_misaki_temporary_relationship_v1` at permanence and the existing encrypted-root writer for anonymous post-save processing. Chat's existing completion RPCs remain unchanged.

The ledger is keyed by user/request/processing version. Completed phases are skipped. Failure records a compact sanitized journal containing the last completed phase and candidate observations; the journal fits the control RPC's 2,000-character field. Recovery performs the explicit failed→analyzing control transition, restores completed phase labels without rerunning their operations, and continues. Partial writes are found by stable keys and links. State success followed by ledger failure is recovered through the application audit/consumed Pattern set and request/version replay guard.

Failures never refund/fail a committed chat. Successful/replayed chat schedules recovery; the worker processes at most three unfinished post-cutover turns chronologically and stops at the first failure. This is opportunistic retry on user activity, not a continuously running queue worker. Queries page beyond Supabase's default response limit.

## Critical Events

Critical candidates are detected independently from ordinary Evidence using conservative explicit user language. Quoted/hypothetical/third-party text is excluded. Candidate context is saved before an external validator call. The validator emits only `confirmed` and an exact supporting user substring; acceptance must represent explicit mutual agreement, not affection/score/proposal alone. Confirmed facts use the atomic critical RPC. Rejected candidates are dismissed through the pending-control RPC; validator failures stay failed/pending for retry. The critical RPC removes resolved pending rows. Reconciliation never automatically restores partner status; breakup does not zero historical axes.

## Anonymous continuity

The encrypted server-root payload carries `relationshipEngine`: state, version, compact episodes, consumed Pattern keys, processed requests, pending canonical turns and explicit critical events. Queue entries are sealed as part of successful canonical temporary-turn completion. Analysis verifies supporting user/assistant pairs inside the current root and writes through the existing revision-checked root writer. No anonymous Evidence/Episode/Pattern is incrementally written to permanent plaintext tables. Existing Body Clock spread of the encrypted payload preserves the snapshot without generating positive Evidence or extending expiry.

Email save is not made into an early one-time import. After auth becomes permanent, the latest verified frozen root is imported once; any pending analysis is finished in memory before the atomic import because the anonymous writer correctly rejects permanent accounts. Failed import/analysis is retryable and blocks subsequent permanent v1 processing, while ordinary conversation/history restoration still succeeds. Old snapshots cannot overwrite an already-recorded import.

## Verification

- Existing tests: 176/176 pass.
- New tests: 40/40 pass (216 total).
- TypeScript noEmit and Next production build: pass.
- Live DB checks inside BEGIN/ROLLBACK: canonical cross-user/unsaved guards, ±3 bound, Pattern requirement, failed→analyzing recovery, State replay, and explicit acceptance/breakup all passed. Evidence/Episode/Pattern fixtures were created only through RPCs and fully rolled back. No persistent DB/schema change.
- Lab writes:false, shared generator boundary and existing quota/history/memory/Body Clock/email-save/device regressions pass.
- Actual Gemini classification quality and signed-in cross-device Preview journeys still require Sora/owner evaluation; mocked generator tests do not establish live model quality.

## Unresolved acceptance blocker

The control-plane RPC has no atomic worker claim/lease or per-user processing-order lock. In-process task sharing and chronological scans do not serialize separate Vercel instances. Two distinct requests could concurrently consume the same Pattern or apply critical transitions out of canonical order. DB request/version uniqueness prevents replay of one State application, but does not enforce Pattern consumption once across different request IDs. Neither existing State RPC nor the control RPC checks predecessor ordering/expected version.

This cannot be truthfully claimed as distributed-safe without a Sora-approved contract/worker design. No direct writes, schema change, hidden lock or production cutover were introduced to bypass it. Keep the gate disabled. Therefore this Draft is **not complete against the final acceptance condition** until this blocker is resolved and a multi-worker/out-of-order test passes.

Body Clock generation architecture is unchanged per this task's no-Body-Clock-change constraint; broader multi-channel Reply Core convergence is not claimed.
