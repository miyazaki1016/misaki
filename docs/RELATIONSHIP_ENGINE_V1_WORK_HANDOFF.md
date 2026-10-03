# Relationship Engine v1 — Work Implementation Handoff

Date: 2026-10-03
Owner: せいちゃん
Architecture / DB authority: ソラ
Implementation executor: Work

## 0. Mission

Implement the application layer for Relationship Engine v1 on top of the already-deployed Production DB foundation.

Do **not** redesign the DB or reinterpret the relationship model. The architecture and DB contracts are already frozen/implemented. If application code appears to require a DB-contract change, stop and surface the mismatch for Sora review instead of silently changing semantics.

Core product principle:
- 美咲と出会って、二人だけの関係が育っていくAI
- 美咲とどんな関係になるかは、あなた次第。
- intimacy is not romance
- high romance score is not partner status
- generated Misaki text alone is not positive relationship evidence
- time alone must not invent feelings

Authoritative design:
- docs/RELATIONSHIP_ENGINE_V1.md
- docs/RELATIONSHIP_ENGINE_V1_DB_PROCESSING_DESIGN.md
- docs/IMPLEMENTATION_OVERVIEW.md

## 1. Already completed — DO NOT redo

Production DB foundation is already applied and rollback-tested.

Migrations:
- 20261003081605_relationship_engine_v1_foundation.sql
- 20261003081717_relationship_engine_v1_canonical_state_and_critical_event.sql
- 20261003081813_relationship_engine_v1_bounded_state_application.sql
- 20261003081902_relationship_engine_v1_analysis_write_surface.sql
- 20261003082001_relationship_engine_v1_temporary_import_boundary.sql

DB provides:
- Evidence
- Semantic Episode
- Episode↔Evidence
- Pattern
- Critical Pending
- five long-term axes: friendship / trust / playfulness / affection / romance
- explicit relationship_status
- relationship_state_version
- bounded State application ledger
- processing ledger
- one-time anonymous→permanent v1 import audit
- atomic critical Event/Status RPC

Use the RPC contracts. Do not make the app directly authoritative over axis scores or relationship status.

## 2. Required runtime ordering

Permanent normal chat target flow:

1. Load canonical conversation + canonical relationship state.
2. Build Relationship Context Resolver input.
3. Resolve canonical Event/Status, active boundaries, axes, Momentum, intimacy stage, shared memory, and relevant current user message.
4. Relationship Interpreter produces acting guidance only.
5. Shared Misaki Reply Core builds the final generation context.
6. Gemini generates reply.
7. Validate reply.
8. Canonically save successful chat turn.
9. Only AFTER canonical save, run Relationship Engine analysis:
   - critical candidate handling / Event Validator
   - Evidence Analyzer
   - Semantic Episode grouping
   - Pattern update
   - deterministic bounded State delta application.
10. Analysis failure must not turn a successfully saved conversation into chat failure. Mark/retry processing instead.

Current pre-save pure preview logic may be reused only if it does not persist canonical relationship changes.

### Hard prohibition

Current code has relationship persistence before canonical completion. Refactor this.

Canonical relationship writes must not occur before the canonical conversation turn is successfully saved.

## 3. Resolver precedence

Resolver precedence is fixed:

1. Canonical Event / relationship_status
2. Active constraints and boundaries
3. Long-term five-axis State
4. recent Momentum
5. Intimacy Stage
6. Shared Memory

Current user message has immediate conversational relevance but cannot rewrite established canonical history.

Memory is not the authority for partner/breakup/boundary status.

## 4. Evidence Analyzer

Analyzer emits candidate Evidence only. It must not emit final axis values, relationship status, or unrestricted score deltas.

Most turns are allowed to produce no Evidence.

Supported axes:
- friendship
- trust
- playfulness
- affection
- romance

Interpretation classes:
- direct
- ambiguous
- hypothetical
- quoted
- third_party
- negated

Preserve direction/subject. User→Misaki evidence must not be confused with Misaki→user generated text.

Examples:
- talking about loving a third party ≠ romance toward Misaki
- hypothetical proposal ≠ canonical proposal
- quoted confession ≠ user confession
- 「好き。でも恋愛じゃない」 must not become positive romance
- Misaki saying affectionate words by herself is not independent positive Evidence

Use:
- record_misaki_relationship_evidence_v1(...)

## 5. Semantic Episode

Group repeated/paraphrased expressions of the same semantic event/intention.

Goal: prevent repetition farming.

Ten paraphrases of one confession must not behave like ten independent relationship-growth events.

Use:
- upsert_misaki_relationship_episode_v1(...)

Episode identity must be stable enough for retry/idempotency and semantically conservative. When uncertain, prefer not to merge unrelated events, but never use raw message count as relationship growth.

## 6. Pattern Engine

Pattern is derived from Episodes, not raw turn count.

Examples:
- sustained care
- reliable repair
- repeated harm
- stable playful reciprocity
- repeated trust disclosure

Pattern accumulation should consider novelty, continuity and reciprocity. Do not convert simple repetition into unlimited growth.

Use:
- upsert_misaki_relationship_pattern_v1(...)

## 7. State application

Only deterministic application logic may request bounded five-axis deltas.

Use:
- apply_misaki_relationship_state_v1(...)

DB enforces:
- each axis delta is within -3..+3
- non-zero delta requires Pattern
- canonical chat turn required
- Pattern ownership required
- request_id + processing_version replay safety
- final scores remain 0..100

Do not derive relationship_status from romance_score.

Do not invent a hidden rule such as romance >= N means partners.

## 8. Critical Event / Status path

Critical types:
- romantic_proposal
- romantic_acceptance
- romantic_rejection
- relationship_end
- boundary_event
- reconciliation

External/model Event Validator must not run inside a DB transaction.

Required behavior:
1. Detect a plausible critical candidate.
2. Canonical chat save succeeds.
3. Preserve pending critical context so the next Resolver cannot act blindly if validation is delayed/fails.
4. Run Event Validator after save.
5. On validated fact, call:
   - apply_misaki_relationship_critical_event_v1(...)
6. Validator failure leaves conversation successful and relationship processing retryable/pending.

Status semantics:
- romantic_acceptance → romantic_partner
- relationship_end → none
- reconciliation does NOT automatically restore romantic_partner
- romantic score does NOT change status

Critical Event + Status transition must stay atomic through the DB RPC.

## 9. Processing / retry

Use misaki_relationship_processing for eventual analysis state.

Conceptual progression:
pending
→ analyzing
→ evidence_saved
→ episode_saved
→ pattern_saved
→ applied

On failure:
- keep canonical chat successful
- mark processing failed / preserve error
- retry idempotently
- do not double-apply State
- do not silently skip unresolved critical candidate context

Record analyzer/processing versions.

Model upgrades must not silently rewrite historical canonical relationship state.

## 10. Anonymous users

Anonymous v1 relationship trajectory must remain inside the encrypted temporary-root payload.

Do NOT incrementally write anonymous Evidence/Episode/Pattern into permanent plaintext v1 tables.

Temporary payload should carry the compact relationship snapshot/trajectory needed for continuity, including:
- five axes
- relationship status
- relationship engine/version metadata
- compact episode/pattern/pending-critical context as required by Resolver
- enough retry/idempotency metadata to avoid duplicate semantic growth

Preserve existing temporary-root rules:
- server root is authoritative
- revision checked
- tamper/expiry stops; no silent reset
- normal chat / explicit edit/load can renew existing 24h behavior
- Body Clock must not extend anonymous lifetime
- email-save retry uses newest verified root

On permanent email-save checkpoint, import the final v1 snapshot once using:
- import_misaki_temporary_relationship_v1(...)

Do not allow later stale anonymous payload to overwrite permanent v1 state.

## 11. Body Clock / proactive convergence

Current Body Clock has its own Gemini generation path. Refactor toward one Misaki.

Target:
feature decides **why** Misaki speaks;
shared Misaki Reply Core decides **how** Misaki speaks.

Normal chat, Body Clock, proactive/photo, and future Voice must converge on:
- same canonical relationship context
- same Resolver
- same Relationship Interpreter
- same persona/grounding composition principles
- same reply validation principles

Body Clock output alone must not create positive five-axis Evidence.

If the user later reciprocates/responds, that user interaction can become Evidence.

Time/silence may affect Momentum/context but must not by itself invent:
- loneliness
- longing
- jealousy
- romance
- relationship facts

## 12. Existing code to inspect/refactor

Primary:
- app/api/chat/route.ts
- app/api/push/body-clock/route.ts
- supabase/functions/body-clock/index.ts
- lib/canonical-state.ts
- lib/relationship-acting-guide.ts
- lib/relationship-action-reducer.ts
- lib/relationship-emotion-reducer.ts
- lib/relationship-emotion-store.ts
- lib/relationship-patterns.ts
- lib/relationship-signal.ts
- lib/relationship-turn-expression.ts
- lib/gemini-json-generator.ts

Preserve useful pure logic where compatible. Remove or relocate canonical writes that violate post-save ordering.

## 13. Required tests

At minimum add regression/integration coverage for:

1. Stage/high intimacy with zero romance remains non-romantic.
2. High romance without explicit acceptance is not partner status.
3. Explicit proposal + acceptance establishes partner status.
4. Repeated paraphrased confession does not farm State.
5. Third-party / quoted / hypothetical / negated romantic language does not become false romance/Event.
6. Six-month silence does not erase long-term State or invent feelings.
7. Rejection can coexist with friendship/trust.
8. Breakup sets current status none without zeroing historical axes.
9. Reconciliation does not automatically restore partner status.
10. Analyzer failure after successful canonical save does not fail chat.
11. Retry does not double-apply Evidence/Pattern/State/Event.
12. Out-of-order analysis cannot corrupt canonical State ordering.
13. Pending critical candidate is visible to next-turn Resolver.
14. Anonymous chat continuity remains encrypted and server-authoritative.
15. Anonymous Body Clock does not renew temporary expiry.
16. Email-save retry imports newest v1 temporary state exactly once.
17. Body Clock generated message alone does not increase axes.
18. Normal chat and Body Clock use shared relationship interpretation / Reply Core behavior.

Existing tests must continue to pass.

## 14. Rollout constraints

Do not switch all Production behavior merely because code compiles.

Recommended implementation sequence:
1. pure Resolver + Interpreter integration
2. post-save processing orchestration behind explicit v1 enable/version gate
3. Evidence/Episode/Pattern pipeline
4. critical pending + Event Validator
5. anonymous encrypted payload support + permanence import
6. Body Clock shared Core convergence
7. full regression
8. Sora review
9. owner real-device test
10. only then Production behavior cutover

No destructive migration is part of Work scope.

## 15. Deliverable to Sora

When implementation is ready, report:
- PR number / branch
- changed files
- exact runtime ordering
- which DB RPCs are called and where
- how pending/retry/idempotency works
- anonymous payload schema changes
- Body Clock convergence changes
- tests added + exact results
- anything intentionally deferred
- any DB-contract mismatch found

Do not merge/cut over merely to finish the task. Sora reviews first.

## Final acceptance principle

A successful implementation must make this true:

**美咲の返答は関係性を参照する。しかし、美咲自身の生成文や単純な会話回数が勝手に関係性の事実を作らない。ユーザーとの実際のやり取りがEvidence→Episode→Patternを経て、監査可能かつboundedにStateへ反映され、明示的な重大事実だけがEvent/Statusを変える。**
