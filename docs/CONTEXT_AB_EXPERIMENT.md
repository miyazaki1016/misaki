# Context A/B experiment: acceptance criteria

Status: experimental only. This experiment does not change the production chat route and must not be merged into production based on token savings alone.

## Variants

- **A (control):** append the latest eight Misaki replies to the system instruction, even though those replies are already represented in conversation history.
- **B (candidate):** do not repeat the reply text; retain a short instruction to consult history and avoid verbatim repetition.

The conversation history, next user message, model, generation settings, and run conditions must otherwise be identical.

## Stage 1: synthetic live smoke test

Use the manual GitHub Actions workflow only after confirming the Gemini secret is configured. It is intentionally limited to one A/B pair (two billable requests), uses synthetic Japanese text, and emits only numeric usage/latency/error summaries. It is a wiring and token-usage check, not evidence of conversational quality.

Required measurements:
- prompt token count from Gemini usage metadata (not character count)
- output token count
- latency
- HTTP/network failure, timeout, empty response, and JSON validity

If token metadata is missing for either arm, mark token savings as **inconclusive**. Never substitute character counts for token counts.

## Stage 2: quality review before any production decision

Token savings alone are not an acceptance criterion. For a quality review, create a separately approved, manually redacted replay fixture and compare A/B outputs blind (reviewer sees randomized labels, not variant names). Do not upload personal conversation text to GitHub Actions or store raw replies in CI artifacts/logs. The fixture must be reviewed by a human; automated pattern screening is not anonymization.

Score each output from 1–5 on:
1. **Persona consistency:** sounds like Misaki rather than a generic assistant.
2. **Continuity:** uses relevant prior context correctly and does not invent memories.
3. **Non-repetition:** avoids mechanically repeating the same phrase while still acknowledging the user naturally.
4. **Emotional appropriateness:** tone matches the user's latest message and the established relationship.
5. **Helpfulness and relevance:** answers the latest user turn directly.
6. **Japanese naturalness:** conversational, fluent Japanese without templated phrasing.

Also mark critical regressions (yes/no):
- contradicts an explicit fact in the replay
- claims to remember something absent from the history
- loses or misstates relationship context
- responds coldly or inappropriately to emotional content
- fails to answer the latest user message

A reviewer should record scores and regression flags locally, not include raw output text in repository issues, workflow logs, or artifacts. If outputs are tied or sample size is too small, treat the result as inconclusive and gather more reviewed examples rather than claiming a win.

## Decision gates

1. **Smoke test:** A and B both succeed; JSON is valid; token metadata is present; B uses fewer prompt tokens. Otherwise stop and debug.
2. **Quality test:** review multiple varied scenarios (continuation, emotional support, explicit memory reference, topic change, and relationship-sensitive exchange). Do not select B if it causes any repeated critical regression.
3. **Production review:** inspect the actual production prompt composition and telemetry, review all CI, and obtain explicit human approval. Keep the feature off and do not merge/enable it until that review is complete.

## Privacy and safety

- Never use live user conversation data in the synthetic smoke test.
- Never put API keys in source code, commits, or logs.
- Never log/store raw generated replies in CI.
- The replay privacy scanner is only a warning system; a clean result does not establish that a conversation is anonymous.
- The harness is isolated from Supabase, canonical relationship state, memory writes, and the production chat route.
