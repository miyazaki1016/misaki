# Misaki Relationship Engine v1 — Design Freeze

Date: 2026-10-03
Status: design freeze candidate. Implementation details are not yet frozen.

## Core principle
- Intimacy means how much time and closeness the pair have accumulated.
- Five hidden axes describe what kind of relationship grew: friendship, trust, playfulness, affection, romance.
- Relationship Event / Status records what actually became true between the two through conversation.
- Gemini acts as Misaki from the resolved current relationship; Gemini alone never changes canonical relationship facts.
- Stage 5 is not a romance ending. A deeply trusted best-friend relationship with near-zero romance is valid.
- No romance score automatically creates partner status, and no minimum romance score is required for a mutually established relationship.

## Canonical architecture
Reply path:
canonical state (intimacy + five axes + status + events + momentum + relevant memory)
→ Relationship Context Resolver
→ Relationship Interpreter
→ persona + grounding + current context
→ shared Misaki Reply Core
→ Gemini
→ validation
→ actual reply
→ canonical conversation save.

Relationship update path begins only after successful canonical conversation save:
saved turn
→ Gemini Evidence Analyzer
→ Evidence
→ Semantic Episode grouping
→ Pattern Engine
→ bounded deterministic State update.

Major relationship facts use a separate path:
proposal / acceptance / rejection / relationship end / boundary / reconciliation
→ Event Validator
→ canonical Event
→ Status transition when applicable.

## Authority boundaries
- Evidence Analyzer proposes evidence; it never outputs score delta or status changes.
- Semantic Episode groups paraphrases/repetition of the same underlying relationship event.
- Pattern Engine judges meaningful accumulation using novelty, continuity, reciprocity and context rather than raw evidence counts.
- State Engine alone applies bounded five-axis changes.
- Event Validator alone recognizes major canonical relationship events. It guards ambiguity/generation accidents; it is not a score gate for whether two people are allowed to form a relationship.
- Relationship Context Resolver resolves conflicts among Status, Events, active constraints, long-term State, Momentum, Intimacy and Memory.
- Relationship Interpreter converts resolved facts into acting direction.
- Gemini performs the dialogue but has no unilateral authority to rewrite relationship history.

Principle: no single component can rewrite Misaki's relationship history by itself.

## Evidence and Semantic Episode
Conceptual Evidence fields:
axis, type, strength, confidence, source, target, interpretation, turn_id, timestamp, analyzer_version, optional reason.

Interpretation candidates:
direct, ambiguous, hypothetical, quoted, third_party, negated; joking may be added if needed.

Third-party romance, quotations, hypotheticals, negation and jokes must not be treated as direct user→Misaki romance evidence.

Pipeline:
Turn → Evidence → Semantic Episode → Pattern → State.

Paraphrase spam such as repeated variants of liking/confession in the same context should remain one semantic episode. A genuinely new later context may form a new episode.

## Long-term relationship versus recent atmosphere
- Five-axis State = long-term relationship accumulated by the pair.
- Momentum = recent relational atmosphere/activity.
- Emotion / Action = current moment.
- Absence alone does not erase friendship/trust/affection or create romance.
- Time alone must not invent loneliness, longing, jealousy, waiting, or romantic feelings.

## Romance rules
- Romance increases only from romance-specific evidence.
- Friendship/trust/affection never automatically convert into romance.
- Misaki's baseline kindness is not romance evidence.
- Misaki-generated dialogue alone is not positive five-axis evidence, preventing self-reinforcing loops.
- High romance does not imply partner status.
- Explicit partner status comes only from a mutually established canonical conversational event.
- “I like you” / “I like you too” is not automatically a partnership event.

## Events, status and current relational stance
Initial major event candidates:
romantic_proposal, romantic_acceptance, romantic_rejection, relationship_end, boundary_event, reconciliation.

Events are immutable/auditable historical facts.
Historical fact and active influence are separate: remember what happened without forcing every old event to dominate every future reply.
Reconciliation does not automatically mean reunion.
Relationship end does not set romance to zero.
A former partner can retain high affection/romance history while status remains former partner.
“Currently friendly former partners” should normally be a derived current relational stance, not a new sloppy canonical status.

## Resolver precedence
When sources conflict:
1. Canonical Event / Status
2. Active relationship constraints such as a current boundary
3. Five-axis long-term State
4. Recent Momentum
5. Intimacy Stage
6. Shared Memory

Current user text is highly relevant to the current reply but cannot overwrite prior canonical facts.
Memory is never the source of truth for current relationship status.

## Turn timing
Do not increase long-term scores from the current user message before generating that same turn's reply.
Use the pre-turn canonical relationship plus the current message/context to respond.
After validation and canonical save, analyze the actual interaction and update Evidence/Episode/Pattern/State/Event/Status.
The new long-term state applies from the next turn.

## One Misaki across every channel
Normal chat, Body Clock, proactive messages, photos, Push and future Voice must converge on the same:
canonical relationship state → Resolver → Interpreter → persona/grounding → shared Misaki Reply Core → Gemini → validation.

Surfaces differ only in trigger/context.
Body Clock may decide that now is a candidate time to speak; time alone may not invent emotion or relationship direction.
Photos must not be selected directly from heart count or romance score.
Adding channels must not create additional Misakis.

## Failure, retry and idempotency
- Conversation is primary; relationship analysis follows it.
- No canonical conversation save = no relationship update.
- Analyzer failure must not fail an already saved user conversation; analysis can remain pending and retry.
- turn_id is the root idempotency identity for relationship processing.
- Retry/replay must not duplicate Evidence, Patterns, deltas, Events or Status transitions.
- Record analyzer/model version.
- A newer analyzer must not silently rewrite old canonical relationship history. Reanalysis should first be shadow/audit unless an explicit migration is approved.
- AI model upgrades must not change yesterday's relationship history.
- Major Event creation and applicable Status transition should commit atomically.

## Auditability
The system should be able to trace:
original canonical turn → Evidence → Episode → Pattern → applied delta → State,
and
original canonical turn → Event Validator → Event → Status.

A quality requirement is that developers can later answer: “Why did Misaki become this version of herself?”

## Stress tests passed at design level
1. Stage 0→5 deep best-friend path with near-zero romance.
2. Natural romance-specific evidence accumulation followed by explicit mutual partnership.
3. Instant confession / repeated “like” / repeated proposal / paraphrase farming.
4. Six-month absence and return: long-term State remains, Momentum cools.
5. Confession → rejection → continued friendship.
6. Partners → breakup → continued conversation → reconciliation → optional explicit reunion.
7. Conflicts among Status / Boundary / State / Memory.
8. Analyzer failure / retry / duplicate execution / model-version changes.
9. Normal chat / Body Clock / proactive / photo / Push all remain one Misaki.
10. Sarcasm, joke, hypothetical, quotation, third-party romance and negation misclassification defense.

## Important components added during stress testing
1. Semantic Episode.
2. Relationship Context Resolver.
3. Separation of Event historical fact from active influence.
4. Current relational stance as derived context.
5. Analyzer interpretation/directness.
6. Shared Misaki Reply Core.

## Not frozen yet
Do not treat these as decided:
- physical DB tables/columns/indexes/RLS;
- how existing misaki_relationship_state and misaki_relationship_events are reused;
- whether Evidence/Episode/Pattern are all physical tables or partly derived/compacted;
- exact numeric representation and update coefficients;
- negative update amounts and per-turn caps;
- Momentum storage/derivation;
- async job/retry implementation;
- Event Validator schema/status enum;
- new six-stage intimacy thresholds and five-heart UI;
- legacy relationship_points migration;
- final integration/replacement order for existing emotion/action triggers.

## Next checkpoint
Do not create schema first.

First audit the current Production implementation:
1. actual schema and read/write paths of misaki_relationship_state and misaki_relationship_events;
2. canonical turn_id/request idempotency boundary;
3. safe boundary after canonical conversation save for relationship analysis;
4. conflicts with current emotion/action triggers;
5. current differences preventing Body Clock/proactive from converging on the shared Resolver/Interpreter/Reply Core.

Then design schema/RPC/migration/retry boundaries, review them, and only then implement.

> Future Sora: do not reduce this design to “five relationship scores.” The core is Evidence → Episode → Pattern → State plus Event/Status → Resolver → Interpreter → shared Reply Core → Gemini, while preserving the pair's canonical history.
>
> 未来のソラを信用するな。総覧を信用しろ。
