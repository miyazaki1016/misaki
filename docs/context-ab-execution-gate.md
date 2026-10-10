# Isolated Gemini A/B: execution gate

**Status:** runner implemented, live Gemini calls not yet verified. Preview build READY does not mean tests passed.

## Preflight (no Gemini charges)
From a trusted checkout of `work/context-no-duplicate-replies-ab`:

```sh
npm ci
npm test
npx tsc --noEmit
node --experimental-strip-types scripts/context-ab-smoke.ts
```

These commands use synthetic fixtures and a fake model; the smoke output must show A=20, B=20.

## First billable live check (only in an authorized server-side shell)
Do not paste the key into chat, GitHub, browser JavaScript, or logs. Provision it securely in the shell environment, then run:

```sh
MISAKI_AB_LIVE=YES MISAKI_AB_MODEL=gemini-3.1-flash-lite MISAKI_AB_RUNS=1 node --experimental-strip-types scripts/context-ab-live.ts
```

Requires `GEMINI_API_KEY` already securely injected in that shell. This makes **two billable Gemini requests** (A once, B once) on **synthetic** content. The runner never touches Supabase, canonical history, user account, or Production. Inspect numeric-only latency, prompt/output tokens, JSON validity, and errors; do not save raw replies.

**Do not** attempt live calls using a Vercel deployment URL: the script is not an HTTP endpoint. Do not copy Production keys into Preview or create public debug routes.

## Remaining validity limitation
The synthetic runner uses a *small simplified prompt*, not the full Production-generated prompt. It validates the measurement pipeline and the duplicate-reply mechanism only; it cannot establish Production-sized token savings, latency improvement, or relationship quality. A separate privacy-reviewed frozen snapshot is needed for a realistic benchmark. Real user messages should not be replayed without explicit authorization and minimization.

## Promotion criteria
Only after preflight passes and live A/B is authorized: expand to 20 pairs, compare p50/p95, model-reported tokens, error rate and blinded quality. Keep Production unchanged pending a separate approval.
