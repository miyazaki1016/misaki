# Shared Conversation Engine — design contract v0 (2026-10-15)

**Status: proposed design, not implemented or approved for production.** Isolated branch from `main`. No API calls, database access, runtime edits, or deployment.

## Goal

Both production chat and an offline conversation tuning lab invoke the **same pure reply pipeline**. The runtime supplies state; the engine decides how to render and validate language; the runtime alone controls persistence, quota, authentication and state transitions.

```text
Production authenticated runtime ──┐
                                  ├── resolve immutable ConversationSnapshot
Offline synthetic lab adapter ─────┘                │
                                                    ▼
                                  shared ConversationEngine
                               prompt → model → validate → expression
                                                    │
                                                    ▼
                                      ReplyCandidate + diagnostics
                                                    │
                       ┌────────────────────────────┴─────────────────┐
                       ▼                                              ▼
               Production commit adapter                       Lab record only
```

## Boundaries

**Outside shared engine**: auth, quota, canonical DB reads/writes, relationship event commits, clock/weather/network retrieval, scheduling, telemetry with user IDs. Only production adapter can commit canonical state.

**Inside shared engine**: prompt assembly, Gemini message mapping, generation orchestration via an injected model port, parsing, reply problem detection, retry decision, expression rewrite and final cleanup. Relationship/emotion calculation must be pure and take snapshot input; if not yet pure, keep it outside and supply resolved guides.

## Proposed typed interface

```ts
type ConversationSnapshot = Readonly<{
  persona: { text: string; source: string; version: string | null };
  userText: string;
  modelUserText: string;
  history: readonly { role: "user" | "misaki"; text: string }[];
  memory: readonly string[];
  todayMemory: { date: string; items: readonly string[] };
  relationship: {
    points: number;
    actingGuide: string;
    legacyGuide: string;
    pendingGuide: string;
    emotionGuide: string;
  };
  resolvedGuides: {
    profile: string; life: string; time: string; signals: string;
    taxi: string; misakiLife: string; activity: string;
    weather: string; weatherHistory: string; tokyoEvents: string;
    todayMemory: string; recentTopics: string;
  };
  currentTime: string;
  currentDate: string;
  dayType: "work" | "off";
}>;
type ModelPort = (input: {
  systemInstruction: string;
  contents: readonly { role: "user" | "model"; parts: readonly { text: string }[] }[];
  userText: string;
  attempt: number;
}) => Promise<{ ok: boolean; text: string | null; status: number }>;
type ReplyCandidate = {
  reply: string;
  proposedMemory: readonly string[];
  proposedTodayMemory: readonly string[];
  proposedSignals: unknown;
  diagnostics: readonly string[];
  modelCalls: number;
};
```

This is an architectural sketch, **not a claim that the current production route already satisfies these types**. Preserve the exact existing JSON schema, parsing, retries and conditional expression stage during extraction. The engine never persists `proposed*` fields.

## Safety and parity invariants

1. Identical snapshot + deterministic model fixture must produce identical prompt bytes, history order, retry decisions, cleanup and reply in production and lab adapters.
2. Preserve production's 60-message history cap, recall-aware user text, persona source/version and all dynamic guide ordering.
3. Never manufacture five-axis relationship values from legacy intimacy points; neutral fallback is explicit.
4. No lab adapter imports canonical writers or production chat API. A type-level boundary alone is insufficient; add import graph checks.
5. Explicit `modelCalls` and physical attempt budget; retries inside model transport count too. Hard-stop before exceeding owner-approved cap.
6. `ReplyCandidate` is a proposal only; production commits after its existing authorization, quota and idempotency checks.
7. Synthetic records have provenance `offline-synthetic`. Real Gemini records require separate consent, redaction and access controls.
8. No prompt content or user memories in logs by default. Never auto-merge or auto-deploy tuned prompts.

## Phased implementation and acceptance

**Phase 0 — design review**: document dependencies and choose safe extraction seam. No runtime modifications.

**Phase 1 — pure prompt builder** (separate Draft PR): capture exact old prompt with fixtures; move template verbatim; compare byte-for-byte in tests, including work/off day, memory, relationship, recall, weather and empty state. No change to production code path until tests pass.

**Phase 2 — injected generation pipeline**: model port and deterministic test double; replicate initial generation, rejection/retry, cleanup and conditional emotion/expression generation. Count logical calls and physical retries separately.

**Phase 3 — adapter parity**: production adapter and offline synthetic adapter use same pure engine. Test that lab adapter cannot import Supabase, production route, quota or canonical writer. Production feature flag remains off pending review.

**Phase 4 — controlled real model**: authenticated nonproduction runner, no canonical writes, max attempts/turns, no hidden retries, preapproved cost, manually scored comparisons. No real Gemini calls until owner approval.

**Phase 5 — release gate**: review against PR #85's newer draft overview, staged rollout, monitor regressions, rollback plan, explicit owner go/no-go.

## Open design questions

- Which relationship/emotion expression functions are pure today, and which require DB or external state?
- What is the exact current Gemini transport retry ceiling, and how is each physical attempt observed?
- Which parts of reply validation/cleanup are safe to extract without changing semantics?
- How to handle evolving stored persona versions while keeping baseline comparisons reproducible?
- Should experiment quality reports be stored as private CI artifacts or in a separate protected data store? Neither is implemented.

## Coordination

PR #86 is an **offline fixture harness**. PR #85 is a separate **draft relationship/interpreter overview**. This design must not overwrite either or silently change the canonical implementation overview. Before implementation, reconcile these contracts in the latest canonical overview.
