# Production prompt extraction: pre-change contract and regression gates

Date: 2026-10-15. Source: `main` commit `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`, `app/api/chat/route.ts` around system prompt and reply generation.

## Decision: do NOT extract production prompt in PR #86

The production prompt is an interpolated template involving numerous dynamic guides and source-dependent values. Moving the template without a precise equivalence test can silently change behavior. PR #86 remains an offline-only test harness. Any production extraction must be a separate, reviewed, feature-flagged change.

## Contract to preserve byte-for-byte

- `loadPersonaPrompt(..., "chat", relationshipTimeContext)` output and its source/version.
- Relationship legacy guide when engine disabled; acting guide from canonical relationship state or neutral legacy adapter; pending relationship guide.
- User profile, explicit life facts, relationship time and signals, taxi context.
- Work/off-day consistency, past activity grounding and user occupation/name non-invention rules.
- Date/time, Tokyo weather and life events, weather-history grounding, today's memory and long-term memory.
- Recent Misaki messages, anti-repetition, JSON output schema and `currentDate`.
- `contents` maps last 60 canonical user/misaki turns to Gemini user/model roles; current input uses `createRecallAwareMessage` when recall applies.
- `generateGeminiJson` receives the exact concatenated system prompt, contents and user text.
- Initial response can be retried after `getReplyProblems`; final reply goes through `cleanFinalReply`.
- Relationship signals may cause a *separate* expression-generation call. A single-response lab cannot claim parity with this flow.

## Extraction plan (separate PR)

1. Introduce a pure function that takes an explicit immutable, already-resolved context object. No auth, DB, weather fetch, clock, Gemini, or canonical writes inside.
2. Add a golden fixture test asserting exact `baseSystemPrompt` equality against the existing template for representative conditions (new user, established non-partner, explicit partner, work/off day, recall, memory empty/present, weather present/missing).
3. Move template verbatim, preserve whitespace and ordering. No prompt edits in extraction PR.
4. Replace only the production prompt assembly call behind an opt-in flag, compare original/new hashes in shadow, then review before activation. Ensure no personal prompt text is logged.
5. Only after proven parity, reuse the pure builder with **synthetic** context fixtures in a read-only lab adapter. It is not full parity until production validation and expression stages are simulated too.

## Immediate offline checks

- Assert alternating user/model turns, correct history mapping and bounded 5/20 pairs.
- Assert no duplicate current user message in history.
- Assert failed response retains partial transcript but never presents a completed pair.
- Assert reviewer score bounds and negative deltas.
- Mark every fixture transcript `offline-synthetic`.

## Safety gates

No calls to production `/api/chat` for experiments. Do not connect to unprotected `/api/acting-lab`. Before any real Gemini experiment: authentication, request/physical-attempt cap, disabled retries, cost estimate and explicit owner approval. Do not merge PR #86 or PR #85 as part of this work.
