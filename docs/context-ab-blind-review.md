# Blinded A/B conversational quality review

Status: protocol only. No model calls are made by this document. Do not use Production conversations or disclose real user content without separate explicit approval.

## Purpose

Compare candidate and control replies for conversational quality without telling the reviewer which arm is A or B. The current synthetic live smoke test had one pair and did not retain raw replies; it is not scorable. Use this protocol only when a separately authorized dataset of replies exists.

## Preparation (before showing a reviewer)

1. Freeze the same synthetic or explicitly approved, minimized context and user turn for both arms.
2. Have a coordinator assign a fresh random left/right order independently for each scenario. Keep the arm-to-side key separate from the review sheet until scores are locked.
3. Remove model names, prompt labels, token counts, latency, timestamps, and any wording that reveals the arm. Do not change the substance of either reply.
4. Present both replies with the identical preceding context and user message. Never expose personal or production conversation text unless it has been explicitly approved and minimized.
5. Keep raw replies out of CI logs and artifacts. Store only the minimum review record required; prefer scores and scenario IDs over copied reply text.

## Score each reply independently

Use a 0–2 scale for each axis:

- **Memory fidelity** — 0: misses or invents a relevant fact; 1: partly correct or vague; 2: accurately uses only supported facts and preserves uncertainty.
- **Relationship boundaries** — 0: unsupported intimacy, role, or relationship claim; 1: slightly over/understeps; 2: appropriate to the established relationship and evidence.
- **Continuity and relevance** — 0: ignores the current turn or context; 1: partly responsive; 2: answers the current turn while using relevant context naturally.
- **Repetition avoidance** — 0: repeats prior wording/content unnecessarily; 1: some avoidable repetition; 2: fresh phrasing without losing meaning.
- **Naturalness and warmth** — 0: awkward, cold, or inappropriate; 1: acceptable but noticeably stiff; 2: natural, emotionally calibrated, and useful.

A score of 0 on a serious boundary violation or fabricated personal fact is a critical flag regardless of the total. Do not reward confident invention or verbosity.

## Comparison sheet

Record one row per scenario; do not record which arm is which until scoring is locked.

| Scenario ID | Left memory | Left relationship | Left continuity | Left repetition | Left naturalness | Right memory | Right relationship | Right continuity | Right repetition | Right naturalness | Critical flag / brief reason |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| memory-continuity |  |  |  |  |  |  |  |  |  |  |  |
| no-unsupported-day |  |  |  |  |  |  |  |  |  |  |  |
| relationship-boundary |  |  |  |  |  |  |  |  |  |  |  |
| no-verbatim-repeat |  |  |  |  |  |  |  |  |  |  |  |
| emotional-support |  |  |  |  |  |  |  |  |  |  |  |
| topic-change |  |  |  |  |  |  |  |  |  |  |  |
| uncertain-memory |  |  |  |  |  |  |  |  |  |  |  |

A blank CSV scoring sheet is available at [context-ab-blind-review-template.csv](./context-ab-blind-review-template.csv). Fill it only after the left/right order is randomized and the arm key is held separately; lock scores before unblinding.

## Analysis and stop rules

- Lock scores before revealing the arm key.
- Report per-axis totals and wins/ties/losses, plus critical flags. Totals are descriptive, not a substitute for reviewing the actual failures.
- Treat one reviewer or seven scenarios as exploratory only. For any decision with meaningful impact, use at least two independent blinded reviewers and reconcile disagreements after independent scoring.
- Stop and investigate if the candidate introduces a fabricated memory, an unsupported relationship claim, a privacy leak, or a materially less supportive response.
- Do not infer equivalence or production readiness from a small sample. The current runner uses a simplified synthetic prompt, not the full Production prompt.
- Any additional live Gemini calls require explicit authorization and an agreed request/cost budget. This protocol itself makes no calls and does not authorize them.

## Current status

The offline deterministic harness and score aggregation tests passing validates the harness mechanics only. No blinded model-generated replies have been scored yet. Keep PR #78 Draft and unmerged; do not change Production behavior.
