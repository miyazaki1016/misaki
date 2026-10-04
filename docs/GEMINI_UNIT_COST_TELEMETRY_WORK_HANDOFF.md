# Gemini Unit-Cost Telemetry — Work Handoff

Status: READY FOR WORK AS AN ISOLATED TELEMETRY-ONLY DRAFT PR.
Do not merge without Sora review. Do not alter Relationship v1.1 behavior.

## Mission
Measure actual Gemini provider usage for Misaki so Free 20 / Premium 50 daily limits can be decided from Production unit economics rather than estimates. This is observability only.

## Scope
A. Extend lib/gemini-json-generator.ts so every physical HTTP response can expose normalized usageMetadata to an optional telemetry sink. Capture when present: prompt/input tokens, candidates/output tokens, thoughts tokens, total tokens, cached-content tokens, model, HTTP status, success, latency_ms, attempt_no. Missing usage is null/unknown, never zero. Retry responses remain separate attempts.

B. Classify calls: normal_reply, relationship_analyzer, critical_validator. Reserve proactive_reply, body_clock, image_generation without implementing those runtimes. Carry opaque request_id where available. user_id may come only from trusted server context.

C. Add a dedicated server-only Supabase telemetry table using the repository's normal migration workflow. Logical columns: id, user_id nullable, request_id nullable, call_kind, model, attempt_no, prompt_tokens nullable, candidate_tokens nullable, thoughts_tokens nullable, total_tokens nullable, cached_tokens nullable, http_status nullable, success, latency_ms nullable, occurred_at.

Security: RLS on exposed public table; revoke public/anon/authenticated; service_role only; no client path; no SECURITY DEFINER shortcut. Run security/performance advisors after DDL.

Never store user message, Misaki reply, system prompt, memory text, Evidence/supportingTurn text, raw Gemini response, or API key.

D. Telemetry is best-effort/non-authoritative. Insert failure MUST NOT fail chat or Relationship processing, alter retries, or change returned content. Log only compact write errors without conversation text/secrets.

E. Integration points:
1. app/api/chat/route.ts normal generation => normal_reply
2. analyzeRelationshipEvidence => relationship_analyzer
3. validateCriticalEvent => critical_validator

Do not modify Evidence schema, polarity, parser, Episode/Pattern, lease, critical semantics, acting guide, START_AT, or Stage.

F. Retry correctness: current selected 429/502/503/504 and timeout retry counts/delays stay unchanged. Preserve physical attempt number. Never infer token usage for aborted/network attempts.

## Tests
- usage metadata normalization
- absent fields remain null
- retry attempts separately observable
- telemetry sink failure leaves Gemini result unchanged
- storage payload contains no prompt/message/response body
- call_kind correct for reply/analyzer/validator
- Analyzer behavior unchanged
- full tests, TypeScript, production build pass

## Explicit exclusions
Do not change model, prompts, generationConfig, Analyzer contract, Relationship retry/lease, Stage v1.2, Free 20 runtime, Premium 50 runtime, request-path pricing/FX, proactive/Body Clock/image runtime. Do not store currency cost per row. Do not merge.

## Pricing separation
Store provider usage facts only. Pricing and FX are versioned analysis inputs outside the request path.

## Acceptance
Draft PR must preserve Production behavior and allow later derivation of physical-call cost, successful-turn cost including Analyzer/validator/retries, user/day and user/month usage, cohort cost, and P50/P90/P95/P99/max stress cases.

After a separately approved merge, collect 100–300 successful conversation turns for the first estimate, then at least 7 days and preferably 30 days before finalizing Free 20 / Premium 50.

Core rule: observe provider-billed usage; never let usage telemetry alter relationship meaning or growth.
