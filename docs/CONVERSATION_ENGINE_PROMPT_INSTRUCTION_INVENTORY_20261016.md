# Base prompt instruction inventory — classification gate (2026-10-16)

**Scope:** complete current `lib/conversation-engine/base-prompt.ts` on Draft PR #88, extracted from `app/api/chat/route.ts`. This inventory is **classification only**; do not use it to replace the current production prompt. Existing byte-parity fixture is the compatibility baseline.

## Classification rules

- **S — Shared safety and fact grounding:** reusable only when neutral toward character identity, with equivalent safety semantics.
- **C — Character identity and lifestyle:** must come from a character-specific, versioned source. No implicit Misaki defaults for another character.
- **R — User × character relationship and memory:** must be fetched and written with both identifiers and explicit sharing rules.
- **E — Externally verified factual context:** location meaning, source, timestamp, freshness and user consent where appropriate.
- **O — Output contract / engine operation:** schema and data validation; separate from conversational personality.
- **M — Mixed / split required:** do not move automatically; split preserving original constraints before migration.

## All 20 dynamic template fields

| Field | Class | Migration note |
| --- | --- | --- |
| `personaPrompt` | C | Versioned persona; mandatory character ID |
| `relationshipGuide` | R | Relationship-stage/5-axis canonical source |
| `relationshipActingGuide` | R/C | Stage-sensitive acting, character-specific expression rules; split |
| `pendingRelationshipGuide` | R | Pending relationship facts must be scoped |
| `userProfileGuide` | R/M | Split explicitly shared user facts vs facts learned by one character; consent gate |
| `lifeUnderstandingGuide` | R/M | Provenance and permission for inferred user lifestyle |
| `relationshipTimeGuide` | R/E | Relationship elapsed time, verified clock |
| `relationshipSignalGuide` | R/O | Signal policy and structured output/validation |
| `taxiContextGuide` | R/C | User occupation facts should not become character persona facts |
| `misakiLife` | C | Misaki-only character identity/schedule |
| `activityGroundingGuide` | S/C | General no-fabrication rule plus character-day grounding |
| `safeCurrentTime` | E | Trusted timezone clock snapshot |
| `timeGuide` | E/C | Trusted time facts vs character-specific routines |
| `weatherGuide` | E | Observed/forecast with source and freshness |
| `weatherHistoryGuide` | E/R | Verified historical context vs prior conversation, provenance |
| `tokyoLifeEventsGuide` | E/C | Tokyo relevance must not be globally assumed |
| `todayMemoryGuide` | R/C | Distinguish character's day log from user memory |
| `recentTopicText` | R | Recent character-specific messages; repetition guard |
| `memoryText` | R | Long-term memory with both scope identifiers |
| `currentDate` | E/O | Verified date plus output JSON date field |

## Every static prompt section (exact headings)

| Current literal heading | Class | Migration disposition |
| --- | --- | --- |
| 【ユーザーの今日の仕事・休みについて】 | S/R | Keep evidence-only rule; work/rest is user-specific |
| 【美咲の仕事日・休日は固定】 | C/M | Preserve consistency behavior, replace Misaki name and fixed-day assumptions with character-specific schedule |
| 【リアルタイム情報の入手経路を作らない】 | S/E | Preserve prohibition on invented source provenance |
| 【現在日時】 | E | Preserve verified clock only |
| 【天気についての最重要ルール】 | S/E/C | Preserve observation/forecast/history distinction; replace “美咲側” with explicit character location and conversational policy |
| 【直近の美咲の発言】 | R/C | Character-specific recent history; preserve repetition guard |
| 【長期記憶】 | R | Per user × character; preserve optional/relevant use |
| 【今日の記憶に保存するルール】 | R/C/O | Misaki today-memory output is not a generic cross-character container |
| 【出力】 | O/R/C | Current fixed JSON names and `misakiTodayMemory` are compatibility-only; output adapter needed |

## Unheaded static instructions and schema

- Under the user's work/rest heading: **do not assume they work today**, avoid prescriptive “お疲れ様” without evidence. **S/R**.
- Under Misaki's fixed workday: same-day work/holiday consistency, resting now does not imply day off. **C/M**.
- Under real-time provenance: no fictitious news/SNS/phone/weather-feed observation by the character; only supplied facts. **S/E**.
- Under weather: observations ≠ nowcast ≠ conversation history; cannot invent past weather; do not reflexively ask “そっちは？” or force umbrella advice. **S/E/C**.
- After recent topics: avoid repeating identical wording. **S/R**.
- After long-term memory: only use naturally when relevant. **S/R**.
- Under today's memory: record only confirmed **character** events today, never imagined past actions or a workday contradiction. **R/C/O**.
- Output: **JSON only**, `reply`, `memory`, `relationshipSignals.signals`, `relationshipSignals.relationshipFacts.mutualAffectionExplicit`, `datingEstablishedExplicit`, `misakiTodayMemory.date/items`. **O/R/C**. No field renames in existing production behavior.

## Gate conditions

1. Automated inventory test must detect a new or removed template interpolation **or** named section before declaring classification complete.
2. Mixed entries must be split with explicit semantics and golden fixtures; mapping alone does **not** establish equivalence.
3. Anti-leakage tests need contrasting characters, unrelated user-character memories, diverse occupations, cities, stages and schedules.
4. Maintain production original for Misaki until **full prompt comparison**, structured JSON validation, retry and canonical persistence are verified.
5. No production wiring, PR merge, DB migration or paid model call without explicit authorization.
