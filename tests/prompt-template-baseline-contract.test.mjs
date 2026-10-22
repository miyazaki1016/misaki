/**
 * Source-level contract against the fixed V0 chat prompt shape.
 * Offline only. No route import, user data, network, Gemini or DB calls.
 * These assertions intentionally fail if V0 changes: first investigate
 * whether the baseline was updated, rather than rewriting expectations.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { inspectBaseSystemPromptSource } from "../lib/conversation-engine/prompt-template-audit.mjs";

const file = fileURLToPath(new URL("../app/api/chat/route.ts", import.meta.url));
const routeSource = readFileSync(file, "utf8");

const expectedInterpolations = [
  "personaPrompt",
  "relationshipGuide",
  "relationshipActingGuide",
  "pendingRelationshipGuide(rootState)",
  "userProfileGuide",
  "lifeUnderstandingGuide",
  "createRelationshipTimeGuide(relationshipTimeContext)",
  "createRelationshipSignalGuide()",
  "taxiContextGuide",
  "misakiLife",
  "activityGroundingGuide",
  "safeCurrentTime",
  "timeGuide",
  "weatherGuide",
  "weatherHistoryGuide",
  "tokyoLifeEventsGuide",
  "todayMemoryGuide",
  "recentTopicText",
  "memoryText",
  "currentDate",
];

test("V0 base system template contains the expected 20 insertion sites, in order", () => {
  const metrics = inspectBaseSystemPromptSource(routeSource);
  assert.equal(metrics.interpolationCount, 20);
  assert.deepEqual(metrics.interpolationNames, expectedInterpolations);
});

test("V0 base system template has the known literal scaffold size", () => {
  const metrics = inspectBaseSystemPromptSource(routeSource);
  // Bytes of template literal's source text with substitutions removed, NOT
  // model runtime input and NOT billing tokens.
  assert.equal(metrics.sourceTemplateUtf8Bytes, 3152);
  assert.equal(metrics.constantScaffoldUtf8Bytes, 2708);
  assert.equal(metrics.measuredRuntimeBytes, null);
  assert.equal(metrics.measuredModelTokens, null);
});

test("V0 retains consent/privacy relevant prompt content in source", () => {
  for (const label of [
    "【リアルタイム情報の入手経路を作らない】",
    "【天気についての最重要ルール】",
    "【長期記憶】",
    "【今日の記憶に保存するルール】",
  ]) {
    assert.ok(routeSource.includes(label), "missing source rule " + label);
  }
});
