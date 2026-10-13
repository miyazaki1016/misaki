# Conversation context A/B validation protocol

Status: experiment only; **no Production deployment or merge**.

## Variants
- A: `work/conversation-context-compression-spike` (recent eight Misaki replies repeated inside system prompt).
- B: `work/context-no-duplicate-replies-ab` (same raw 60-message history, repetition instruction retained, repeated reply list omitted).
- Both use the same persona, relationship engine, memory source and canonical server-side writes.

## Validity and safety
Do **not** send identical prompts repeatedly to the live chat account as a benchmark: each successful chat may commit history, memory, relationship events and usage. That changes the next trial's input and contaminates the comparison.
A reliable controlled benchmark requires an isolated non-committing harness or disposable test identities with equivalent seeded state; **do not use ordinary /api/chat for automated replay**. Never copy private chat content to diagnostic logs.

## Existing observed measurements (different inputs; descriptive, not causal)
| Metric | A | B |
|---|---:|---:|
| System instruction UTF-16 chars | 12,719 | 12,224 |
| History messages | 60 | 60 |
| History UTF-16 chars | 2,577 | 2,567 |
| Gemini fetch duration | 1,700 ms | 1,258 ms |
| Recent replies duplicated in raw history | 8/8 | 8/8 (but removed from B system instruction) |

The 495-character reduction is measured. Timing difference cannot be attributed to prompt reduction on these samples. Token counts for these two calls were not verified.

## Next gated experiment
1. Implement a **read-only / non-committing** benchmark using identical snapshot data, or isolated equivalent seeded identities. No production writes.
2. Fix model, generation settings, time/weather/life events, history, memory, persona, and exact user input; randomize A/B ordering and collect at least 20 runs per variant.
3. Record model-reported prompt/output tokens (if available), latency p50/p95, timeout/retry rate, JSON validity, cost estimate and any differences in output quality.
4. Human-review blinded replies for coherence, unwanted repeated phrasing, relationship continuity, and factual memory. Do not log raw user content.
5. Keep B as experimental until quality and latency gates are met; no Production merge or deployment without explicit approval.

## Immediate conclusion
B is structurally simpler and demonstrably reduces system prompt length by ~3.9%. No proven latency improvement or quality equivalence yet.
