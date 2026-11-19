# Shared prompt builder — extraction gate (2026-10-15)

Status: pre-extraction audit only. PR #88 remains Draft. Existing production chat route is unchanged.

## Verified source contract

Production `app/api/chat/route.ts` constructs `baseSystemPrompt` after loading a **versioned persona** via `loadPersonaPrompt`, a canonical relationship state, life/profile/time/weather context, memory, and recent utterances. The template begins in this exact order:

1. `personaPrompt`
2. `relationshipGuide` (legacy conditional)
3. `relationshipActingGuide`
4. `pendingRelationshipGuide(rootState)`
5. `userProfileGuide`
6. `lifeUnderstandingGuide`
7. `createRelationshipTimeGuide(relationshipTimeContext)`
8. `createRelationshipSignalGuide()`
9. `taxiContextGuide`
10. static grounding sections and `misakiLife`, then time/weather/events/today memory/recent utterances/long-term memory and JSON schema.

The dynamic inputs are not safe to recompute in a lab from points alone. They depend on the canonical state, actual persona version, time, weather and user context. The shared engine should receive an explicit resolved immutable snapshot.

## Minimum safe extraction sequence

- Freeze the **entire** current template as a golden fixture with multiple synthetic snapshots, including whitespace, not only its first section.
- Introduce a pure `buildBaseSystemPrompt(resolvedContext)` whose arguments cover **every** interpolated field; do not silently default missing values.
- Compare exact bytes against production's original inline template for every fixture.
- Only then change the production call site in a separate reviewed PR. Do not change model retry behavior, JSON parsing, relationship postprocessing or writes in that PR.
- After a successful pure extraction, use the same builder in the offline lab. Full production parity still requires a common generation/validation pipeline.

## Important regression cases

- No inferred job schedule or residence when user has not established it.
- Weather history cannot be invented from current weather alone.
- A high romance axis never establishes `romantic_partner`.
- Existing partner status is not erased by legacy points.
- Empty and date-rolled memory have the exact same text as current production.
- `currentDate` in JSON output schema is stable across retry.
- Current user message is passed as `userText`, not duplicated in `contents`.
- No personal prompt contents or memories are written to CI logs.

## Current state

PR #88 has pure history, memory, recent-utterance formatting, and relationship-acting adapter with deterministic tests. **No shared prompt builder has yet been extracted**. This document prevents a partial template clone from being mistaken for the real shared engine. Production, DB, and paid Gemini remain untouched.
