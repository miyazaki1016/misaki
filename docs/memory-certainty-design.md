# Memory Certainty / Tentative Plan Design Note

Status: **design-only; not implemented; not Production-approved**  
Working branch: work/context-no-duplicate-replies-ab  
Related but separate draft: PR #66, work/forget-control-v1 (Forget Control). This note does not modify PR #66 or its branch.

## Goal

Prevent a tentative statement, a question, a guess, or an outdated plan from becoming a confident current fact in Misaki's replies or proactive messages. Also preserve the difference between a plan and a completed event, and ensure an explicit correction supersedes the older version.

Examples the system should distinguish:

- 「明日は休み」 — user-stated plan, valid for the stated day.
- 「明日は休みかも」 — tentative; must not be asserted as confirmed.
- 「明日は休みじゃなくなった。仕事になった」 — explicit correction; old plan is superseded.
- 「今日は仕事だった」 — completed/past event, not evidence that the user is working now.
- 「弟が明日休みらしい」 — third-party / hearsay, not the user's own schedule.
- 「明日は休み？」 — question, not a fact.
- 「明日は休みだよ」 after an earlier tentative plan — may confirm it, but only when the current statement clearly refers to the same subject and date.

## What the source currently supports

Checked against main implementation and the open Draft PR #66 branch on 2026-10-10:

1. Canonical conversation state currently stores history, memory as string[], and today_memory in misaki_user_conversation_state; the application exposes them through lib/canonical-state.ts.
2. Ordinary long-term memory is stored as strings. The reply route can combine generated memory with structured life facts and stores the result back in the same canonical memory list.
3. [life:v1] adds structure for kind, fact, observedAt, validUntil, confidence, and source. Its current kinds include profile/schedule/routine/situation/preference/concern. selectRelevantLifeFacts checks confidence and expiry and marks schedule/situation/concern as current relevance.
4. The current explicit-life-fact extractor is intentionally narrow and rejects some questions, uncertainty markers, and third-person openings. However, the LifeFact type has no explicit epistemic status such as tentative/confirmed/corrected/completed. validUntil handles time validity, not certainty or completion.
5. Today Memory is a separate day-scoped context. It should not be treated as proof that an item is still true on another day.
6. PR #66 adds Forget Control protections for forgotten/deleted information across memory/context paths. That is a different concern: a fact can be non-forgotten and still be tentative, stale, corrected, or completed. Do not duplicate or weaken its controls.
7. The current design principle is to keep canonical state on the server and avoid creating a new truth source without first checking existing RPC/write paths. No database migration or new table is proposed by this note.

These findings describe code inspected in the referenced sources; they do not establish that the live Gemini model will classify every Japanese phrasing correctly.

## Proposed fact lifecycle (candidate for review)

Use an explicit status in the structured fact representation, rather than asking the model to infer certainty later from prose alone:

- tentative: speaker explicitly signals uncertainty, possibility, or an unconfirmed plan.
- confirmed: clearly asserted by the user about the identified subject/time.
- corrected: a newer explicit statement supersedes an earlier value for the same subject/predicate/time scope. Prefer keeping the replacement as the active fact and retaining supersession/provenance needed for audit; do not let the old value compete as current.
- completed: an event or plan is reported as completed. It may be used as past history, not as a current/future state.
- unknown / no fact: ambiguous wording, a question, hearsay, or insufficient evidence should not be promoted into a usable structured fact.

Minimum useful metadata to evaluate before implementation:

- subject (who the fact is about; e.g. user vs family member)
- predicate/value (what is true or planned)
- temporal scope (date or interval, and timezone where relevant)
- status (tentative / confirmed / corrected / completed)
- source/provenance (explicit user statement vs extracted/generated memory)
- observed time and optional validity end
- confidence, without using confidence alone to turn a tentative fact into a confirmed one
- supersedes/superseded relationship when a correction is explicit

Do not infer that every bare past-tense sentence is a completed plan, or that every future-tense sentence is confirmed. Ambiguity should result in no structured fact or a clarification, not a confident assertion.

## Read/use policy

1. For claims about the user's current schedule or situation, allow only a clearly scoped, non-expired fact whose status is confirmed; require the relevant date/time to match.
2. A tentative fact may be mentioned only with its uncertainty intact (e.g. “休みかもしれないって言ってたね”), never as a definite statement or as a proactive-send trigger requiring certainty.
3. A completed fact is historical evidence only. It must not prove that the plan is still active or that the same state holds today.
4. A corrected fact blocks the superseded value from current-context selection. Latest explicit correction wins within the same subject and temporal scope.
5. If old memory and a fresh explicit user message conflict, the fresh explicit message takes precedence; update/supersede the structured fact only when the scope matches.
6. Keep ordinary shared memories distinct from current life facts, relationship episodes, and Forget Control. Do not turn this into a blanket deletion or automatic compression project.

## Safe implementation sequence

1. Read-only inventory first: enumerate every writer/reader of canonical memory, today_memory, [life:v1], and Body Clock snapshots on the exact base branch that will eventually receive the work. Compare main and PR #66; do not base a future implementation on the older A/B branch's snapshot alone.
2. Define a backward-compatible structured-life-fact version and explicit status semantics. Do not silently reinterpret legacy plain strings as confirmed facts.
3. Add deterministic parser/selector tests before changing prompt/runtime behavior.
4. Add a write-path change only after the exact canonical RPC, anonymous temporary root/checkpoint, email-save, and Body Clock handoff paths are mapped. Keep status changes in the same canonical transaction as the corresponding memory update.
5. Apply the same selector to normal reply and Body Clock before facts enter generation. If status is missing/invalid, fail closed for claims about current plans; preserve ordinary memory for conversational recall without presenting it as current fact.
6. Keep Forget Control filtering in place and verify certainty handling does not reintroduce a forgotten target.
7. Run scripted tests while Gemini billing is unavailable. Do not claim model-quality validation until a live, approved model test can be run after billing is restored.
8. No schema migration, Edge deployment, merge, or Production change without separate explicit approval.

## Required regression matrix

- Confirmed plan vs tentative plan.
- Tentative plan later explicitly confirmed.
- Confirmed plan later corrected to a different plan.
- Plan explicitly cancelled.
- Past/completed event vs current state.
- User's own plan vs a family member's plan / hearsay.
- Question about a plan vs assertion.
- Old memory conflicts with fresh explicit statement.
- Same wording but different dates/subjects.
- Expired plan does not become current.
- Legacy plain memory with no certainty metadata is not silently upgraded to confirmed.
- Today Memory from yesterday is not treated as today's fact.
- Body Clock does not send or phrase a proactive message as if an uncertain plan were confirmed.
- Forget Control active target cannot return through history, generated memory, or certainty upgrade.
- Anonymous temporary state, checkpoint/email-save, permanent account, logout/login, and cross-device read remain consistent.
- No double write / stale generation can overwrite a newer correction.

## Open decisions (not yet approved)

- Whether status belongs only to [life:v2] facts or also to a separately typed shared-memory candidate record.
- Exact Japanese grammar/LLM classification boundary for indirect, joking, conditional, and quoted speech.
- Whether the UI should visibly show uncertainty/status or keep it internal.
- Whether a corrected/completed fact remains as historical evidence, and for how long.
- Whether low-confidence ambiguous statements should trigger clarification or simply remain in history.

**Recommendation:** start with structured life facts because they already have time scope and source metadata, but do not extend this to every ordinary memory until data flow and compatibility are mapped. Certainty must be a first-class property, not a prompt-only instruction.
