# Isolated Gemini A/B: execution gate

**Status:** first live synthetic A/B smoke test completed successfully on 2026-10-13. This confirms the runner and Gemini response/usage parsing work for one short synthetic pair; it is **not** evidence of conversational quality or Production-equivalent savings. Preview build READY does not itself mean tests passed.

## Completed: first billable live check

The manual GitHub Actions workflow ran the offline tests and then one A/B pair using synthetic Japanese content and `gemini-3.1-flash-lite`. Numeric summary from the run:

| Metric | A (control) | B (candidate) |
|---|---:|---:|
| Requests | 1 | 1 |
| HTTP 200 | 1 | 1 |
| Successes | 1 | 1 |
| Prompt tokens (mean) | 322 | 233 |
| Output tokens (mean) | 18 | 21 |
| Latency | 639 ms | 837 ms |
| Timeouts | 0 | 0 |
| Invalid/malformed JSON | 0 | 0 |
| Empty candidates | 0 | 0 |

B used 89 fewer prompt tokens (about 27.6%) on this one pair. Its measured prompt text was 147 characters shorter (296 vs 149; about 49.7%), but character counts are not token counts. B was 198 ms slower in this single observation; with one sample per arm, no latency conclusion can be drawn.

**Interpretation:** smoke-test gate passed for this short synthetic fixture: both variants succeeded, JSON was valid, token metadata was present, and B used fewer prompt tokens. Sample size is one per variant, so the result is preliminary.

## Preflight (no Gemini charges)

From a trusted checkout of `work/context-no-duplicate-replies-ab`:

```sh
npm ci
npm test
npx tsc --noEmit
node --experimental-strip-types scripts/context-ab-smoke.ts
```

These commands use synthetic fixtures and a fake model; the smoke output must show A=20, B=20. The manual workflow also runs `node --experimental-strip-types --test tests/context-ab-*.test.ts` before any live request.

## Next step: quality validation, not automatic expansion

Do **not** automatically launch 20 more live pairs. Further live calls can incur charges and need an explicit budget/authorization. First use the existing offline synthetic quality tests and review protocol to validate the measurement and scoring path without live calls. For any live quality experiment, set the sample size and budget first, use synthetic or separately approved and manually redacted frozen data, and keep raw replies out of CI logs/artifacts. Blinded human review is required; heuristic checks and valid JSON do not prove conversational quality.

The synthetic runner uses a *small simplified prompt*, not the full Production-generated prompt. It cannot establish Production-sized token savings, latency improvement, or relationship quality. Real user messages should not be replayed without explicit authorization and minimization.

## Safety and promotion criteria

- The harness does not touch Supabase, canonical history, user account, or Production.
- Do not paste API keys into chat, GitHub source, browser JavaScript, or logs.
- Do not attempt live calls using a Vercel deployment URL: the script is not an HTTP endpoint.
- Keep PR #78 as Draft and unmerged; keep Production unchanged.
- Before any production decision, compare varied scenarios (continuation, emotional support, explicit memory reference, topic change, relationship-sensitive exchange), use blinded human review, inspect the actual Production prompt and all CI, and obtain explicit human approval.


## Offline quality-harness update (2026-10-13)

- Expanded deterministic synthetic quality scenarios from 4 to 7: explicit memory recall, unsupported schedule assumptions, relationship boundary, verbatim repetition, emotional support, topic change, and uncertain memory/plan.
- Added a deterministic test for blind score aggregation across the five axes, including tie handling.
- CI for commit `19cc84667a1a205a6b4b7193f74637197ba938df` passed:
  - `npm ci`
  - `npm test`
  - `node --experimental-strip-types scripts/context-ab-smoke.ts`
  - `npx tsc --noEmit`
  - Offline replay tests passed separately.
- The checks validate test/harness behavior only; they do not run model-generated quality trials and do not establish A/B conversational equivalence.
- Next gate remains blinded review of varied replies. The scoring, random left/right masking, stop rules, and review sheet are documented in [context-ab-blind-review.md](./context-ab-blind-review.md). The first live pair's raw replies were not retained, so it cannot be scored retrospectively. Do not call Gemini again or send real conversation content until a separate explicit authorization and a defined call budget are provided.
