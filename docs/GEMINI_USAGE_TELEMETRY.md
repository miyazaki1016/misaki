# Gemini provider usage telemetry

Observability only. Source handoff: `docs/GEMINI_UNIT_COST_TELEMETRY_WORK_HANDOFF.md`
at commit `ed8359319181f20cf73aec87ab75c7a1405264f2` on
`docs/relationship-v1-2-stage-growth-principles` (not yet on main when implemented).

## Recorded facts

Each physical `generateContent` attempt produces its own row in
`public.misaki_gemini_usage_telemetry`, including transient retries, timeouts and
network failures. `attempt_no` starts at 1 per generator invocation; a separate
application-level generation/Relationship retry starts another invocation and
produces additional rows, never an upsert/deduplication. Aggregate all rows for
the same opaque `request_id` to include retries and analysis in turn cost.

`model` is the requested model. `success` means HTTP `Response.ok`, not a parsed
reply, confirmed Evidence/event or a completed billable user turn. A 200 response
with malformed/blocked content can still have real provider usage. HTTP failures
can also have usage. `latency_ms` measures fetch start to HTTP headers, or to
transport rejection; it excludes retry sleep, body parsing and telemetry writes.
`occurred_at` is the attempt start time.

Counts map directly from `usageMetadata`: `promptTokenCount`,
`candidatesTokenCount`, `thoughtsTokenCount`, `totalTokenCount`, and
`cachedContentTokenCount`. Missing/invalid fields remain NULL; explicitly reported
zero remains zero. Do not reconstruct totals, assume cache/thought counts are
zero, or infer charges from network failure. Pricing and FX are separate future
versioned calculation inputs. Usage does not establish a provider invoice by
itself, and NULL rows must remain visible as coverage gaps in later cost reports.

## Identity semantics and future cohort analysis

`user_id` is the auth user UUID verified by the server for the context in which
the Gemini call occurs. It is not necessarily a permanent account or billing
account ID: anonymous authenticated user UUIDs are included. NULL means no
verified identity was supplied; it does not identify a plan or cohort.

Free / Premium cohort analysis must never infer a plan from `user_id` alone,
including whether it is present. Future analysis must safely join the verified
auth identity to canonical account and subscription information, accounting for
anonymous-to-permanent identity transitions and the subscription state applicable
at `occurred_at`. Unresolved identity or subscription mappings must remain unknown
rather than being assigned a plan by assumption. This telemetry change implements
no canonical-account mapping, subscription join, plan detection or billing logic.

## Integration and failure isolation

- Authenticated chat generation: `normal_reply`, server-verified user UUID and
  existing validated request UUID (including anonymous authenticated users).
- Permanent and anonymous canonical Relationship processing, including temporary
  import: `relationship_analyzer` / `critical_validator`, verified owner and turn
  request ID. Analyzer/validator accept an optional usage sink only; schemas,
  prompts, parsing and return values are unchanged.
- `proactive_reply`, `body_clock`, `image_generation` are reserved enum values;
  none of those runtimes or acting-lab calls are instrumented by this change.

The server-only sink registers a Next.js `after()` callback immediately. Inserts
run after the response, also when nested inside existing Relationship `after()`
work. No DB operation is awaited by Gemini, retry decisions, or a Relationship
lease. Retry-body usage is read from a clone asynchronously, bounded to 2 seconds
and 1 million characters; unreadable/late/oversized retry bodies yield NULL usage.
Telemetry DB fetches have a 2-second timeout and no application write retries.
Failed registration/insert emits only `GEMINI TELEMETRY WRITE FAILED`, never an
exception payload. Failures lose observations without altering product behavior.
This is best effort, not a durable accounting ledger.

An explicit storage allowlist includes only usage, transport facts, classification
and opaque correlation IDs. No message/reply, system prompt, memory,
Evidence/supportingTurn, raw response, key, currency or price is passed to storage.

## Database and verification

Migration: `20261004045307_gemini_usage_telemetry.sql`. Initially generated via
`supabase migration new`, then aligned with the version recorded by the remote
Supabase migration API to prevent applying the same DDL twice.

The independent table has no Relationship/quota foreign keys, triggers, RPCs or
client write route. RLS is enabled; PUBLIC/anon/authenticated privileges revoked.
Only service_role receives SELECT/INSERT; policies target that role exclusively.
Indexes support time-range, user/time and request-level cost analysis.

`tests/gemini-usage-telemetry.rollback.sql` checks service writes/reads, separate
attempt rows, NULL defaults, forbidden anon/authenticated reads/writes and PUBLIC
revocation in a transaction, leaving no synthetic data behind.

2026-10-04 DDL/advisor verification on Misaki:

- Security: no findings for the new table; existing findings were unchanged.
- Performance: only three new unused-index INFO findings, expected before
  collection/analysis starts. Keep these purposeful analysis indexes and review
  after actual workload develops. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
- No production application deployment or merge is part of this Draft PR. The
  additive, empty server-only table is prepared; runtime collection starts only
  after a separately reviewed deployment.
