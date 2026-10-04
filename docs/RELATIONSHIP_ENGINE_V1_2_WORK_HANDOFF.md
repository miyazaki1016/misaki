# Relationship Engine v1.2 — Work Implementation Handoff

Date: 2026-10-04
Owner: せいちゃん
Architecture / canonical contract: ソラ
Implementation executor: Work

> STATUS: READY AS A HANDOFF SPEC, BUT DO NOT START RUNTIME/DB CUTOVER UNTIL SORA CONFIRMS v1.1 3-day Production Pattern→State→acting real-run is complete.

## 0. Mission

Implement Relationship Engine v1.2 Stage / 5-heart on top of the existing v1.1 canonical relationship trunk.

Do not redesign the relationship model. Do not create a second intimacy/points engine.

Canonical trunk remains:
conversation → Evidence → Episode → Pattern → five axes

v1.2 adds:
canonical relationship-established fact → Stage Resolver → existing acting guide → read-only 5-heart UI.

Authoritative design: docs/IMPLEMENTATION_OVERVIEW.md.

## 1. Non-negotiable product semantics

- Stage is relationship depth, not romance.
- Stage 5 does not mean partner.
- romantic_partner does not imply Stage 5.
- payment/Premium must not accelerate Stage.
- raw message count must not accelerate Stage.
- elapsed time alone must not accelerate Stage.
- one disclosure/declaration/event cannot jump multiple Stages.
- normal deterioration floors at Stage 1 once relationship history is established.
- Stage 0 returns only through explicit full reset/data deletion.
- Gemini observes candidates; app/DB canonical contracts decide facts.
- memory summary alone cannot establish relationship history.
- client/localStorage cannot authoritatively write Stage.

## 2. Existing code to preserve

Do not replace:
- lib/relationship-engine-v1.ts v1.1 Evidence→Episode→Pattern contracts
- lease fencing / oldest-first retry / idempotency
- critical Event Validator/status contract
- canonical post-save processing ordering
- anonymous encrypted temporary-root authority
- one-time anonymous→permanent import safety
- lib/relationship-acting-guide.ts as the acting/interpreter surface

Current legacy weakness:
lib/canonical-state.ts builds canonical acting state with createLegacyRelationshipActingState(intimacy_points).intimacyStage.
v1.2 eventually replaces only this Stage source with canonical Stage Resolver output. Do not remove legacy fallback until migration/cutover tests pass.

## 3. PR-A — pure Stage domain only

Goal: implement deterministic, side-effect-free Stage domain types/resolver and fixtures.

Suggested new module:
- lib/relationship-stage-v1.ts
Suggested tests:
- tests/relationship-stage-v1.test.ts

No DB writes. No runtime switch. No UI.

Define:
- Stage = 0|1|2|3|4|5
- resolver version = relationship-stage-v1
- RelationshipFacts with evidence references
- resolveRelationshipStage(facts, previousDerivedStage?) returning:
  - stage
  - resolverVersion
  - satisfiedFacts
  - explanation/reason codes
  - evidenceRefs

Layer A facts and Layer B gates must remain separate.

Required fixtures include all matrix cases in IMPLEMENTATION_OVERVIEW.md.

Do not use sum(axis scores) or legacy intimacy_points inside pure Stage gates.

STOP if implementation requires inventing a product semantic not present in overview.

## 4. PR-B — relationship-established canonical fact

Only after PR-A review.

### Permanent DB
Add minimal versioned migration:
- relationship_established_at nullable timestamp on misaki_relationship_state
- once-only/auditable relationship_established event
- server-only RPC for establishment

RPC must:
- require current canonical chat_turn_completed
- require prior request_id owned by same user and earlier than current canonical turn
- reject same request as prior/current
- be idempotent on replay
- never clear established_at
- store continuity_type, prior/current request refs, processing/resolver version metadata
- respect existing lease/worker authority if called from relationship processing

Do not allow anon/authenticated clients to call authoritative establishment RPC directly.

### Continuity observer
Add a versioned observer separate from Evidence Stage authority.
Model may return candidate only:
- currentSupportingTurn
- priorContextDescription/retrieval hint
- continuityType
- confidence

Initial continuity types:
shared_event / personal_context / misaki_specific / shared_reference.

Ground current side as exact non-empty substring of current user message.
Retrieve and ground prior side against canonical same-user past chat turn.
No prior canonical match → drop candidate.
Memory-only match → do not establish.
Ambiguous past match → fail closed/no establishment.

### Anonymous
Extend encrypted relationship snapshot/root with equivalent established fact and audit refs.
Do not create plaintext anonymous Evidence/establishment history outside existing allowed temporary architecture.
Email save/import must preserve established fact once and never regress it.

Required tests:
- grounded interview→later result establishes
- greeting repetition does not
- same story repetition without new meaning does not
- memory-only does not
- replay does not duplicate
- cross-user prior ref rejected
- same/future request rejected
- anonymous→email import preserves
- stale anonymous replay cannot overwrite permanent fact

## 5. PR-C — Resolver runtime + existing acting guide

Only after PR-A/B review.

Read canonical facts/history and resolve Stage server-side.
Feed resolved Stage into existing createRelationshipActingGuide/canonicalActingState path.

Do not create another acting engine.

Required behavior:
- Stage controls depth/distance only.
- five axes retain directional nuance.
- relationship_status remains explicit fact.
- emotion/action can temporarily change behavior without rewriting Stage.
- failure to derive a higher Stage must fail conservative; never invent intimacy.
- do not turn a read failure into silent Stage 0 for an established existing user.
- preserve a safe last-known derived result/fallback strategy approved by Sora.

Remove legacy points as ordinary Stage authority only after migration fixtures pass.
Keep compatibility path until cutover is explicitly approved.

Add Stage transition audit event when derived Stage changes:
relationship_stage_changed
metadata: from_stage/to_stage/resolver_version/fact refs/reason codes.
Audit event is not Stage authority.

Required acting cases:
- Stage5 + status none + romance low => deep non-romantic bond
- Stage3 + romantic_partner => partner fact but not long-history acting
- Stage4 + withdrawal action => closeness can coexist with temporary distance
- Stage1 + romance high => attraction without pretending long shared history

## 6. Existing-user migration

Do not write a points→Stage conversion table.

Migration priority:
1. reconstruct established/history facts from canonical history/events/v1.1 artifacts
2. derive Stage from actual facts
3. use legacy points only as continuity safeguard where historical canonical detail is missing

If an old user clearly had a pre-v1 relationship but history is insufficient, use a migration-only legacy_relationship_known/established marker solely to prevent false Stage 0.
That marker cannot justify Stage 2–5.

Before migration SQL:
- inspect real data distribution
- build fixtures
- report ambiguous populations to Sora
- stop before irreversible production migration.

## 7. PR-D — 5-heart UI

Only after server-derived Stage path is reviewed.

Likely surface: app/chat/page.tsx/header composition, but inspect current component structure before editing.

Render:
0 ♡♡♡♡♡
1 ♥♡♡♡♡
2 ♥♥♡♡♡
3 ♥♥♥♡♡
4 ♥♥♥♥♡
5 ♥♥♥♥♥

Requirements:
- read-only
- server-derived Stage
- no optimistic increment
- no write path from UI
- no localStorage authority
- relationship status/romance not represented by heart count
- accessibility label such as 関係の深さ 2/5
- loading/read error must not flash an established user to Stage 0
- subtle transition; avoid game-level-up semantics
- responsive on iPhone/iPad/PC Chrome layouts

Do not redesign monetization/paywall in this PR.

## 8. PR-E — Evidence v1.2 only if Sora authorizes after evidence-gap test

Do not implement shared_life/reliance preemptively.

First run fixtures against current Evidence/Pattern history.
Only if real relationship histories for Stage2/3 cannot be observed adequately, propose:
- shared_life
- reliance

If authorized, version Analyzer/schema/parser/Episode/Pattern/anonymous import together.
Do not patch one side only.

## 9. Stage downward movement

No simple negative score threshold.

One transient harm/emotion/action must not drop a heart.
Sustained negative canonical Pattern/history may make a higher Stage meaning no longer explainable.
Normal downward transition is one Stage at a time and floors at 1 if established.
relationship_end alone changes status, not history and not immediately Stage 0.
silence duration alone does not lower Stage.

Add fixtures for all of the above.

## 10. Context/Breadth rules

Use context family only for deduping independent relationship history, not as points.

Initial families:
work/school/task; daily_life; health/wellbeing; hobby/entertainment; food/outing; personal_concern/consultation; shared_joke/pair_reference; relationship/feelings.

Same request/story chain cannot count as multiple independent histories merely because it maps to multiple labels.
Taxonomy must be versioned.

Do not require a specific family checklist for any Stage.

## 11. Required CI / verification per PR

For every PR:
- existing full test suite
- TypeScript
- production build
- relevant new unit/integration tests
- no unexpected migration/runtime diff outside scope

For DB PR:
- BEGIN/ROLLBACK verification where practical
- RLS/grants/server-only authority check
- idempotency/replay
- lease/fencing compatibility
- anonymous import compatibility

For UI PR:
- production build
- responsive verification
- no hydration/loading regression
- accessibility check

## 12. Deliverable protocol

Each unit must be a separate Draft PR.
Do not merge.
Do not deploy/cut over.
Report:
- PR/branch
- changed files
- contract implemented
- tests and exact results
- DB migration/RPC details if any
- deviations/ambiguities
- anything intentionally deferred

Sora reviews each PR before the next authority-changing step.

## 13. Explicit exclusions

Do NOT:
- change v1.1 Production while 3-day real-run is pending
- change START_AT
- reset canonical axes
- redesign relationship_status
- merge Stage with romance
- add Stage points
- make Premium grow Stage faster
- implement Body Clock shared Reply Core as part of these PRs
- change Free 20/day monetization in these PRs
- rewrite landing copy
- add shared_life/reliance without evidence-gap authorization
- merge any PR yourself

## 14. Start condition

Work may prepare/read this handoff now, but implementation execution begins only after Sora states:

**v1.1 3-day Production Pattern→State→acting verification is complete; start Relationship Engine v1.2 PR-A.**

Until then, leave Production runtime/DB behavior unchanged.
