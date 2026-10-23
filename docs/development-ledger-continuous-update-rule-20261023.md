# Development ledger continuous-update rule (2026-10-23)

Status: adopted operating rule; registry index linkage and branch-wide reconciliation pending.

## Required workflow
1. At the start of **every** work session, enumerate relevant branches and their head commits, then compare code, tests, prior handoff records, and the development ledger. Do not assume `main` is the newest work.
2. Identify the exact working branch, baseline commit, purpose, and completion status before edits.
3. For every meaningful implementation, investigation, decision, or test, record the evidence, outcome, remaining risks, and next step in GitHub, updating the existing development ledger rather than leaving notes solely in chat.
4. Distinguish implemented / tested / production-confirmed / experimental / blocked / unverified. A newer branch is not necessarily more complete.
5. Before ending a session or switching chats, reconcile the ledger against actual branch heads and commits, note discrepancies explicitly, and commit the updated handoff state.
6. Keep Gemini input-cost optimization and browser-side Transformers.js experiments separately tracked. Preserve current behavior and use isolated branches for risky experiments.
7. Never mark a ledger reconciliation complete without actually checking the relevant GitHub refs and evidence.

## Current verification
- Confirmed branches exist: `docs/development-registry-audit-20261020` and `experiment/chat-input-metrics-offline-20261022`.
- Full contents, latest commit heads, and canonical registry index path are **not yet verified**; do not claim otherwise.
- Next: locate canonical ledger files, reconcile both branches, and link or integrate this rule into the canonical registry.
