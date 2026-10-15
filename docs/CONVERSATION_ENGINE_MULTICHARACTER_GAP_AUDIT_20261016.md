# Production prompt vs three-layer multi-character prompt — gap audit (2026-10-16)

Status: Draft audit; **not** production-equivalent and **not** a migration approval. Source baseline: `app/api/chat/route.ts` on main; experimental `lib/conversation-engine/base-prompt.ts`, `layered-context.ts`, `layered-prompt.ts`.

## Verified boundaries

- The legacy `buildBaseSystemPrompt` preserves the full current Misaki template with 20 explicitly resolved fields. It is a compatibility reference, **not** a general-purpose character prompt.
- The new `buildLayeredConversationPrompt` currently concatenates shared rules, persona, lifestyle, relationship guide, and memory guide only. It has **no** production parity, Gemini call, output schema, retry, validation, or canonical persistence.
- The layered scope guard checks user/character identifiers on supplied snapshots; it **does not** prove database isolation. Every retrieval, write, and cache key must eventually be scoped by both IDs.

## Source-to-target gap matrix

| Existing production input/behavior | Intended layer | Current layered status | Required gate |
| --- | --- | --- | --- |
| Versioned `personaPrompt` | Character identity | Simple persona field exists | Versioned lookup, compatibility fallback, character-specific fixture |
| `misakiLife`, fixed work/day-off, activity grounding | Character lifestyle + shared fact-grounding | Only freeform lifestyle field | Generalize time/day rules without forcing Misaki's occupation on other characters |
| `relationshipGuide`, acting guide, pending guide, time/signal guides | User × character relationship | One generic relationship field | Preserve canonical 5-axis/status/identity, signal assessment, and stage boundaries |
| `userProfileGuide`, `lifeUnderstandingGuide`, `taxiContextGuide` | Consent-scoped user profile + relationship context | Not modeled independently | Separate user-shared facts from per-character knowledge; no automatic cross-character leakage |
| `safeCurrentTime`, `timeGuide` | Shared factual time context + character schedule | Missing | Clock snapshot/timezone and character-specific schedule |
| `weatherGuide`, `weatherHistoryGuide`, `tokyoLifeEventsGuide` | Verified external context | Missing | Source, location meaning, freshness, opt-in and relevance selection; no invented browsing |
| `todayMemoryGuide`, `recentTopicText`, `memoryText` | User × character memory | One generic memory field | Day rollover, recency, history, provenance, character-scoped retrieval |
| Workday assumptions, anti-fabrication and weather grounding | Shared safety + character-specific policy | Generic shared rules only | Categorize each static instruction; preserve meaning and ordering where required |
| JSON reply/memory/relationshipSignals/misakiTodayMemory schema | Engine output contract + character-specific memory schema | Missing | Character-neutral response contract, backward-compatible adapters and golden fixtures |
| Retry guide, expression adjustment, final validation | Shared generation pipeline | Extracted pure helper modules elsewhere; not wired | Model parity, retry counts, expression state and final validation |
| Canonical commit, usage charge/refund, idempotency | State adapter, not prompt | Not part of layered prompt | Scoped transaction semantics, auth, rollback, and race tests |
| Proactive Body Clock and notification decisions | Proactive trigger adapter | Not part of layered prompt | Consent, quiet hours, dedupe, relationship-based cadence and disaster-safe rule engine |

## Migration gates (order matters)

1. **Freeze legacy parity**: current Misaki base prompt, retry, expression and model contents must remain byte/behavior compatible under synthetic snapshots. Existing template test is source-string parity; it is not end-to-end model parity.
2. **Classify all existing instructions** into shared safety, character persona/lifestyle, user-character relationship/memory, external verified facts, output contract. Ambiguous rules stay on the legacy path until resolved.
3. **Build structured context adapters** with explicit character/user IDs, persona version, source/freshness metadata, and no default cross-character sharing.
4. **Add independent character fixtures** and negative tests (misaki-only work/day type, romantic stage, memory and weather must not leak).
5. **Compare full generated prompts** (not just text snippets) and JSON behavior. Differences require explicit review; do not replace production route merely because tests pass.
6. **Integrate one adapter at a time** in a separately reviewed PR, with rollback and canonical DB audit. Real Gemini tests need explicit cost approval.

## Safety / scope

Do not turn the current layered builder into the production default. Do not create new DB tables or run migrations as part of this audit. Current production, DB, Edge Functions and paid Gemini remain unchanged.
