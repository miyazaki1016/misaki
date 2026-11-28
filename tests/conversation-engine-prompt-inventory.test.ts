import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/** Drift alarm for the audited production-compatible base-prompt extraction.
 * Update the instruction inventory and review all classifications if this fails.
 */
const template = readFileSync(new URL("../lib/conversation-engine/base-prompt.ts", import.meta.url), "utf8");
const inventory = readFileSync(new URL("../docs/CONVERSATION_ENGINE_PROMPT_INSTRUCTION_INVENTORY_20261016.md", import.meta.url), "utf8");
const fields = [
  "personaPrompt", "relationshipGuide", "relationshipActingGuide", "pendingRelationshipGuide",
  "userProfileGuide", "lifeUnderstandingGuide", "relationshipTimeGuide", "relationshipSignalGuide",
  "taxiContextGuide", "misakiLife", "activityGroundingGuide", "safeCurrentTime", "timeGuide",
  "weatherGuide", "weatherHistoryGuide", "tokyoLifeEventsGuide", "todayMemoryGuide",
  "recentTopicText", "memoryText", "currentDate",
];
const headings = [
  "【ユーザーの今日の仕事・休みについて】", "【美咲の仕事日・休日は固定】",
  "【リアルタイム情報の入手経路を作らない】", "【現在日時】",
  "【天気についての最重要ルール】", "【直近の美咲の発言】",
  "【長期記憶】", "【今日の記憶に保存するルール】", "【出力】",
];

test("all production template interpolation fields are explicitly classified", () => {
  const actual = [...template.matchAll(/\$\{context\.([A-Za-z][A-Za-z0-9]*)\}/g)].map((m) => m[1]);
  assert.deepEqual(actual.slice().sort(), fields.slice().sort());
  for (const field of fields) assert.ok(inventory.includes("`" + field + "`"), field);
});

test("all literal Japanese headings are explicitly classified", () => {
  const actual = [...template.matchAll(/【[^\n【】]+】/g)].map((m) => m[0]);
  assert.deepEqual(actual.slice().sort(), headings.slice().sort());
  for (const heading of headings) assert.ok(inventory.includes(heading), heading);
});

test("JSON-only response fields and Misaki compatibility naming remain covered", () => {
  for (const field of ["reply", "memory", "relationshipSignals", "relationshipFacts", "mutualAffectionExplicit", "datingEstablishedExplicit", "misakiTodayMemory"]) {
    assert.ok(template.includes('"' + field + '"'), field);
    assert.ok(inventory.includes("`" + field + "`"), field);
  }
});
