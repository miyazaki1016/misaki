# Relationship Engine v1 — DB & Processing Boundary Design

Date: 2026-10-03
Status: implementation design candidate after Production/source audit. No migration is authorized by this document.

## 1. Audited current foundation

The current Production architecture already provides useful canonical foundations:

- `misaki_relationship_state` is the current relationship/intimacy/emotion/action state row.
- `misaki_relationship_events` is an audit/history stream already used by chat, emotion/action, anonymous email checkpointing, and proactive delivery context.
- `complete_misaki_chat_turn` atomically commits successful permanent-account chat history, memory, intimacy +1, usage completion, replay result and a `chat_turn_completed` audit event.
- `request_id` already provides replay/idempotency identity for successful normal chat turns.
- anonymous current state is an encrypted, expiring `misaki_temporary_roots` canonical root; normal anonymous chat does not create a permanent plaintext conversation root.
- Body Clock and normal chat share canonical history/state, but generation still has separate entry/generation logic and has not yet converged on one shared Misaki Reply Core.
- legacy SQL keyword emotion/action triggers have already been retired; application v2 reducers currently own post-chat emotion/action decisions.

## 2. Preserve versus add

### Preserve and extend
`misaki_relationship_state`
- keep intimacy points/legacy level during migration;
- keep current emotion/action fields;
- candidate future additions: five long-term axes, explicit relationship status, state version / relationship processing metadata as required.
- do not fabricate five-axis history from legacy intimacy points.

`misaki_relationship_events`
- preserve all existing rows and semantics;
- keep it as audit / major canonical relationship fact history;
- do NOT turn it into the high-volume Evidence store;
- existing temporary/email checkpoint events remain compatible.

### Add dedicated v1 structures
Candidate logical stores:
- `misaki_relationship_evidence`
- `misaki_relationship_episodes`
- `misaki_relationship_patterns`

Physical table shape is still subject to migration review, but these concepts must remain distinct even if later compacted.

Reason: existing Events already mix audit/state-transition/checkpoint history. Mixing analyzer Evidence into the same stream would blur canonical facts and observations and could affect existing pattern consumers.

## 3. Permanent-account processing boundary

### Reply critical path

1. Load canonical relationship state, canonical events/status, active constraints, recent momentum/pattern context, intimacy and relevant memory.
2. Relationship Context Resolver resolves conflicts.
3. Relationship Interpreter produces acting direction.
4. Shared Misaki Reply Core combines acting direction, persona, grounding and current channel context.
5. Gemini generates candidate reply.
6. Response validation.
7. Detect whether the turn contains a candidate relationship-changing critical event.
8. When applicable, run priority Event Validator.
9. Commit successful canonical turn.

The canonical turn commit remains the authoritative success gate.

For a validated critical relationship event, the same authoritative commit unit must atomically persist:
- canonical conversation turn;
- intimacy success update;
- usage completion/replay receipt;
- canonical critical Event;
- applicable relationship_status transition.

No status transition without its Event audit row; no Event that claims a transition without the matching status transition.

### Event Validator failure
Event Validator failure must NOT turn an otherwise valid/savable chat reply into a failed conversation.

If critical validation cannot complete:
- commit the conversation normally;
- record relationship critical analysis as pending/retryable;
- preserve enough recent canonical-turn context for the next Resolver to avoid blindly trusting stale status.

Until pending critical analysis is resolved, Resolver must consider the recent unprocessed canonical turn as a temporary constraint/context. This is a safety bridge, not a second canonical status source.

## 4. Eventual relationship-analysis path

Only after canonical conversation save succeeds:

canonical saved turn
→ Evidence Analyzer
→ Evidence
→ Semantic Episode
→ Pattern Engine
→ deterministic bounded State Engine
→ five-axis canonical state update.

Ordinary relationship analysis may be retryable/eventually consistent.

A saved conversation remains successful if this pipeline fails temporarily.

No canonical conversation save means no Evidence/Pattern/State update.

## 5. Idempotency and ordering

Root identity for normal chat processing should reuse the existing canonical `request_id` unless implementation audit finds a concrete reason for a second turn identity.

Requirements:
- one source turn cannot create duplicate Evidence on replay;
- Episode grouping must be stable under retry;
- one Pattern application cannot apply its delta twice;
- one critical Event cannot transition Status twice;
- analyzer/model retries converge to the same canonical result for the same processing version;
- relationship state updates require version/transaction/CAS-equivalent protection against lost updates;
- canonical conversation order, not worker completion order, determines relationship application order.

Analyzer/model version must be recorded. A future analyzer version may shadow/re-audit old turns, but must not silently rewrite historical canonical relationship state. Historical rewrite requires an explicit migration decision.

## 6. Semantic Episode requirement

Evidence wording/type is not a novelty boundary.

Equivalent repeated/paraphrased intent in one semantic context must group into one Episode.

Example:
“好き” → “特別” → “女性として見てる” → “恋してる”
must not become four independent romance-growth events merely because surface wording differs.

Episode identity/grouping must be auditable and retry-stable. Persisted Episode rows are currently preferred because of idempotency/audit requirements, but final physical representation remains a migration-review decision.

## 7. Critical Event model

Initial candidate event types:
- romantic_proposal
- romantic_acceptance
- romantic_rejection
- relationship_end
- boundary_event
- reconciliation

Critical Events are immutable/auditable facts.

Rules:
- no minimum romance score is required for a mutually established relationship;
- high romance never automatically creates partner status;
- “好き” / reciprocal affection is not automatically partnership;
- reconciliation is not automatic reunion;
- relationship end does not zero romance;
- historical Event fact persists while its active influence may weaken;
- current relational stance may be derived by Resolver rather than proliferating status labels.

Status enum expansion, including former-partner representation, remains a schema decision.

## 8. Anonymous-account architecture

Do not make anonymous users write the same permanent plaintext Evidence tables turn-by-turn.

Continue using encrypted expiring temporary root as canonical anonymous state.

Candidate encrypted relationship payload:
- current five-axis state;
- current emotion/action where required;
- canonical temporary relationship Events;
- compact unresolved/recent Evidence/Episode/Pattern trajectory required for continuity;
- relationship processing/analyzer version metadata;
- pending critical relationship analysis when applicable.

Anonymous flow:
temporary canonical root
→ chat / Body Clock / edits advance the same encrypted root
→ email-save checkpoint follows the latest verified root
→ account permanence transition materializes the required v1 canonical relationship state/history once.

Existing properties must remain:
- email transport failure does not roll back checkpoint;
- subsequent chat/Body Clock after checkpoint advances the same latest state;
- stale browser tokens cannot overwrite newer server root;
- Body Clock does not extend anonymous expiry;
- permanent account rejects re-import of anonymous state;
- retries replace/converge rather than duplicate imported trajectory.

Exactly how much Evidence/Episode/Pattern audit history is materialized at permanence is still a migration/privacy/storage decision. Do not silently discard information required to explain the resulting five-axis state.

## 9. Long-term State, Momentum, Emotion and Action

Keep separate responsibilities:

- five-axis State: long-term relationship accumulated over time;
- Momentum: recent relationship atmosphere/activity;
- emotion_state: what Misaki currently feels;
- action_state: how Misaki currently behaves;
- intimacy: accumulated closeness/time, not relationship direction;
- Event/Status: canonical established facts.

Absence alone changes Momentum, not long-term axes.
Time alone must not create romance, longing, loneliness or jealousy.

Initial v1 preference: derive Momentum from recent Patterns/Events rather than create another canonical table unless performance/clarity requires one.

Existing emotion/action reducers should be retained conceptually but moved behind the canonical-save boundary and made consumers of resolved relationship context rather than independent authorities over long-term relationship facts.

## 10. Body Clock / proactive / future channels

Current audit found that Body Clock shares canonical history/state but still has its own direct generation path.

Target architecture:
normal chat / Body Clock / proactive / photo / Push / future Voice
→ channel trigger/context only
→ same Relationship Context Resolver
→ same Relationship Interpreter
→ same shared Misaki Reply Core
→ Gemini
→ validation.

Channel differences may affect expression and trigger, not relationship truth/personality authority.

A proactive Misaki message alone is not positive five-axis Evidence.
Actual user reciprocity after it may become Evidence/Pattern.
Time since last interaction is not relationship Evidence.

## 11. Existing Events migration safety

Existing `misaki_relationship_events` rows must not be rewritten/reclassified during v1 introduction.

Existing consumers must be audited before changing event semantics.

v1 major canonical Events should be distinguishable from legacy emotion/action/checkpoint/audit events by explicit event type/version metadata.

Migration must preserve current anonymous email-save continuity and existing completed-turn replay indexes.

## 12. RLS / grants / deletion

Any new tables:
- RLS enabled explicitly;
- public/anon denied by default;
- authenticated read only if product actually needs direct client read; otherwise keep service-role-only;
- service role permissions explicit;
- user ownership enforced;
- `auth.users(id) on delete cascade` or equivalent deletion path so account deletion removes relationship evidence/history/state as intended.

Do not rely on platform defaults for Data API exposure or grants.

## 13. What is deliberately NOT frozen yet

- exact table columns/indexes;
- exact five-axis numeric representation;
- positive/negative delta coefficients;
- attenuation and caps;
- full relationship_status enum;
- six-stage intimacy thresholds / heart UI;
- whether Momentum needs a materialized cache/table;
- exact critical-event pending ledger representation;
- exact anonymous Evidence history retention/materialization policy;
- queue/worker mechanism for eventual analysis;
- rollout/cutover migration sequence.

## 14. Recommended implementation order

Do not implement all layers at once.

1. Final schema/RPC proposal with indexes, RLS, deletion and rollback.
2. Critical Event/Status transaction boundary and pending-analysis bridge.
3. Evidence store + analyzer with no State writes (shadow mode).
4. Semantic Episode grouping in shadow mode.
5. Pattern derivation in shadow mode.
6. Compare/audit outcomes against scripted relationship journeys and current Production behavior.
7. Enable bounded five-axis State updates.
8. Feed five-axis/Status/Momentum through Resolver + Interpreter.
9. Move existing emotion/action update behind canonical save and align with resolved context.
10. Converge Body Clock/proactive generation on shared Misaki Reply Core.
11. Only after stability: six-stage intimacy thresholds/hearts and user-visible experience changes.

## 15. Acceptance principle

The implementation is not complete merely because five numeric columns update.

It is complete only when:
- the same canonical conversation produces explainable Evidence → Episode → Pattern → State;
- major relationship facts are atomic and auditable;
- retries cannot duplicate relationship growth;
- analyzer/model upgrades cannot silently rewrite yesterday;
- anonymous/email-save continuity remains intact;
- normal chat and proactive channels behave as one Misaki;
- a Stage 5 non-romantic best friend remains a first-class valid outcome;
- the system can answer internally: “why is Misaki acting this way now?”

Related design source of truth:
`docs/RELATIONSHIP_ENGINE_V1.md`.

> Future Sora: schema follows relationship semantics; do not let table convenience collapse Evidence, Event, State, Emotion and Action into one concept.
