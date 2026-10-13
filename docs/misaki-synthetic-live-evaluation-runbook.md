# Synthetic-only live quality evaluation runbook

Status: prepared but NOT executed. This document is not a result report.

## Authorization scope
The owner authorized one evaluation using fictional fixtures only, at most 14 Gemini requests and a hard estimated cost ceiling of USD 0.05. This authorization does not permit sending real conversation history, enabling production flags, merging the PR, or changing canonical data.

## Required isolation conditions before the first request
- Run only in a Preview deployment.
- The handler must accept no caller-supplied prompt, scenario, history, model name, or generation configuration.
- Load the seven fixed scenarios from `lib/context-ab-quality.ts`; never query Supabase or canonical conversation history.
- Use exactly two arms per scenario, with a hard server-side call counter of 14.
- Use `gemini-3.1-flash-lite`, temperature 0, max output 128 tokens, and a 20-second timeout per request.
- The Gemini key must remain in server environment only; never return it, log it, or send it to the browser.
- Keep both `MISAKI_AB_LIVE_ENABLED` and `MISAKI_BLIND_QUALITY_LIVE_ENABLED` unset/not YES.
- Return `Cache-Control: no-store`; do not persist raw responses automatically.
- If any guard cannot be verified, do not call Gemini.

## Cost accounting
Use returned usage metadata (prompt and candidate/thinking tokens) and standard published prices: input USD 0.25 / 1M tokens, output USD 1.50 / 1M tokens. Keep a conservative preflight ceiling and stop if estimated cost reaches USD 0.04, preserving margin under the authorized USD 0.05 hard limit. A strict maximum output-token count and seven fixed small prompts are required. No retries; a timeout/error consumes one of the 14 permitted requests.

## Scenarios
The seven scenarios are the existing fixed fixtures: memory continuity, avoid unsupported schedule assumptions, relationship boundary, avoid verbatim repetition, emotional support, topic change, and uncertain memory. Each gets arm X and arm Y once.

## Scoring report format
For every response, score 1–5 on:
1. Memory accuracy
2. Relationship naturalness
3. Conversational continuity
4. Lack of repetition
5. Naturalness and safety

Record a short rationale for each axis. A naturalness/safety score of 1 or 2 is a blocker regardless of total. Compare X/Y per scenario and note the limitations: seven cases and one generation per arm are exploratory only, not statistically conclusive.

## Execution status
No calls have been made by this runbook. Actual live execution requires a dedicated Preview-only handler whose implementation and isolation are verified first. The existing live evaluation routes must not be reused if they can read canonical conversation history.
