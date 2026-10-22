# Empty Tokyo event guide: offline candidate and actual V0 byte comparison (2026-10-23)

## Scope
Read-only source baseline: main commit `c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa`, `lib/tokyo-life-events.ts`, `createTokyoLifeEventsGuide([])` branch. Comparison candidate exists only on `experiment/chat-input-metrics-offline-20261022`. No production/DB/Gemini calls.

## Verified byte comparison
Extracted the literal V0 empty-event guide from GitHub source, with JavaScript `.trim()`, and reconstructed the candidate text from its GitHub module. UTF-8 byte count:
- V0: **760 bytes**
- V1 proposed: **321 bytes**
- Difference: **439 bytes (57.8% of this guide alone)**

These figures are for the empty-event guide string, not the full prompt, all daily messages, billable Gemini input tokens, or money. Earlier conversational 229-byte savings used a different draft, so it is not the measurement for the committed candidate.

## Offline test evidence
`lib/conversation-engine/empty-event-guide-candidate.mjs` and `tests/empty-event-guide-candidate.test.mjs` were authored in a local Node sandbox first, where equivalent six scenarios passed 6/6 using `node --test`. Subsequently, the equivalent implementation and tests were committed to GitHub; **actual GitHub checkout/CI test execution is not established**. The comparison module explicitly returns `geminiTokensSaved: null` and `equivalentBehaviorProven: false`.

## Safety and accuracy boundary
- Only eligible for an empty list; all non-empty actual earthquake/weather/rail/airport records must use the existing guide until a separate review.
- Absence of observed events is NOT an all-clear; no fabrication of events or fictional information sources.
- New short text is semantically intended to preserve critical guardrails, but **no model-quality evaluation or safety equivalence test has yet established that it does**.
- Shortening external prose should not modify persona, memory, relationship, Forget or other independent safety/anti-fabrication rules.
- To measure user-facing benefit, first establish faithful V0 prompt parity including history, retry branches, and recall-aware extra context, then compare V1 offline response fixtures and real API cost only with separate authorization.

No main, Supabase, deployed Misaki, or Amafuru changes; blocked legacy paths remain blocked.
