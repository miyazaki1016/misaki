# Conversation context compression — measurement-first spike

Status: research only; no runtime behavior changes. Branch: `work/conversation-context-compression-spike`. Base: `ece799c20d685f00c007cb2f897bdd6b2443a2d3`.

## Verified baseline
- `app/api/chat/route.ts`: `MAX_HISTORY=60`; `safeHistory` keeps last 60 valid user/misaki messages.
- `contents` sends those messages in full to Gemini.
- The system prompt separately repeats up to eight recent Misaki replies, and includes persona, relationship guides, memory (up to 30), today's memory (up to 12), weather, time, life events, and output instructions.
- `lib/gemini-json-generator.ts` uses `gemini-3.1-flash-lite`, JSON output, 30s timeout, and retries.
- Example Production request 2026-10-08 00:51 UTC: attempt 1 timed out at 30,002 ms; attempt 2 succeeded in 16,881 ms with 8,378 input tokens and 316 output tokens. One example is not a benchmark.

## Phase 1: instrumentation (no message content logged)
Measure estimated or tokenizer-derived tokens/bytes/chars by component:
1. Persona prompt
2. Relationship guides and identity/pending guides
3. Conversation history
4. Recent-Misaki-reply repetition
5. Long-term and today's memory
6. Time, weather, life events and grounding rules
7. Remaining fixed instructions and current user message

Use the same tokenizer/method for all variants; compare estimates against Gemini `usageMetadata.promptTokenCount`. Store only numeric aggregates and request trace ID; never persist raw conversation content, email, or secret. No canonical relationship/memory writes from measurement. Check whether response tokens, retries and total wall time differ by variant.

## Phase 2: offline candidates
A. Current baseline: 60 recent messages + all current guides.
B. Last 20 raw messages + existing long-term memory and relationship state; no summary.
C. Last 20 raw messages + a **non-authoritative** summary of earlier context + existing long-term memory and relationship state.
D. Variant C without the duplicated eight Misaki replies, after checking repetition/continuity regression.

Never equate morphological tokenization with semantic summarization. No MeCab/Kuromoji dependency unless retrieval benchmarks show it helps. Summaries must preserve chronology, speaker attribution, negation, reconciliation, promises, uncertainty, and provenance; must not infer or mutate canonical relationship status. Summaries may be stale or unavailable: fall back to baseline. No extra synchronous Gemini call in the chat critical path.

## Evaluation
- Token count: per component and total, baseline vs variants.
- Latency: Gemini attempt durations, retry count, end-to-end wall time, p50/p95 over multiple representative runs.
- Quality: multi-turn coherence, reference resolution, remembered commitments, disagreement/reconciliation, relationship status consistency, and hallucination rate; human review blinded to variant.
- Failure modes: summary omits correction, misattributes speaker, reverses negation, invents relationship change, drops key promise, or makes latest context inaccessible.
- No production rollout unless quality is non-inferior and measurable performance gain exists. Draft PR only, gate OFF, no merge or Production configuration change.

## Next implementation slice
Add read-only context-size instrumentation behind a disabled-by-default flag, with unit tests for component boundaries and no sensitive logging. Do not optimize prompt or introduce summarization until baseline measurements are available.
