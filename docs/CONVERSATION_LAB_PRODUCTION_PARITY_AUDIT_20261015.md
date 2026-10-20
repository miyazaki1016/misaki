# Conversation lab / production parity audit (2026-10-15)

Status: documentation-only audit; no Gemini invocation, DB reads or writes, production modification, or production parity claim. Source reviewed: main at c88cf7f79d4c7ae35765d8ba4664f5e8a358dcfa; PR #85 remains separate Draft.

## Verified differences

| Dimension | Production `app/api/chat/route.ts` | Existing `app/api/acting-lab/route.ts` | Offline PR #86 |
|---|---|---|---|
| Identity and auth | Supabase bearer auth and user lookup | No auth visible in POST | No HTTP endpoint |
| Canonical state | Loads temporary/permanent root, memory and history | No canonical reads | Explicit synthetic fixture |
| Quota | Consumes daily message usage before generation | No request quota | Scenario-pair limit |
| History | Last 60 user/misaki messages mapped to Gemini roles | Empty `contents` | All in-run turns mapped to Gemini roles |
| Persona | `loadPersonaPrompt` may use stored persona | Always shared fallback | Injected reply adapter; no persona loaded |
| Relationship | Acting guide plus relationship runtime/legacy guide | Fixed acting profiles | Scenario metadata only |
| Context | User profile, life facts, time, emotion/action, weather, Tokyo events, today memory, activity grounding | No such context | No such context |
| Generation | Gemini JSON, with retry behavior | Gemini JSON, retries enabled | No Gemini calls |
| Postprocessing | Reply validation, canonical commit, relationship processing | Parses reply only; no canonical writes | Records supplied synthetic text |
| Evidence | Real endpoint behavior, but mutates canonical state | Isolated prompt audition, not production equivalent | Structural tests only, not conversation quality |

## Findings and blockers

1. **P1 preview access/cost risk**: acting-lab endpoint is disabled for `VERCEL_ENV=production`, but preview requests have no visible authorization, rate limit or call budget. The default profile list may fan out multiple Gemini calls, and the generator retries. Do not run automated AI users against this endpoint until hardened.
2. **P1 false-parity risk**: passing conversation history to Gemini is necessary but insufficient. A fallback persona + fixed acting guide does not reproduce stored persona, canonical memory, emotion/action, relationship runtime or production reply validation.
3. **P1 data safety**: production chat consumes usage and writes canonical state. Never use it for automated lab runs or shadow comparisons.
4. **P2 budget**: separate physical Gemini attempt limits from logical turns; retries must be disabled or explicitly counted and capped. Owner must approve cost/attempt ceiling before any paid run.
5. **P2 evidence**: eight-axis scores are a review schema, not an automatic measurement. Human scoring and any future AI judge must disclose reviewer/source; synthetic fixture transcripts cannot be called Gemini output.
6. **P2 baseline**: compare identical persona, state, time, memory and user messages before/after. Use redacted fixtures only; no personal production conversations in lab by default.
7. **P2 production-equivalent architecture**: first extract a pure prompt/context assembly function from production with regression tests, then add an offline read-only fixture adapter. This extraction is a separate reviewed PR; do not change the production route under PR #86.

## Recommended gate sequence

A. Keep PR #86 Draft; confirm tests and typecheck, and review code.  
B. Add deterministic mock transcripts and scoring fixtures; validate failure cases.  
C. Design a separate secure preview-only Gemini runner with explicit auth, allowlist, max-turns, max-physical-attempts, no retries, logging/redaction and no canonical writer.  
D. Before first paid request, obtain owner approval for model, maximum physical attempts, approximate cost, and scope.  
E. Run controlled shadow comparisons and human review; do not merge a change based on synthetic fixtures alone.

## Canonical overview

PR #85's `docs/IMPLEMENTATION_OVERVIEW.md` is newer than main's overview. This audit is a PR #86 companion note, not a substitute for canonical overview. Synchronize reviewed conclusions into the canonical overview only with a deliberate follow-up, avoiding conflicting updates to PR #85.
