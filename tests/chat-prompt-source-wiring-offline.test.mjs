/**
 * Read-only checks against the real chat route's source text.
 * No model calls, no DB, no runtime import of the chat route.
 * These lock the *current V0 wiring*, not a proposed optimized V1.
 *
 * Run in a checkout containing app/api/chat/route.ts:
 *   node --test tests/chat-prompt-source-wiring-offline.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("../app/api/chat/route.ts", import.meta.url)),
  "utf8",
);

test("V0 sends up to 60 prior turns as model contents", () => {
  assert.match(source, /const MAX_HISTORY\s*=\s*60;/);
  assert.match(source, /\.slice\(-MAX_HISTORY\)/);
  assert.match(source, /const contents:[\s\S]*?safeHistory\.map\(/);
  assert.match(source, /parts:\s*\[\s*\{\s*text:\s*item\.text/);
});

test("V0 also repeats the last eight Misaki replies in the system prompt", () => {
  assert.match(source, /const recentMisakiMessages\s*=\s*safeHistory[\s\S]*?\.slice\(-8\)/);
  assert.match(source, /const recentTopicText\s*=/);
  assert.match(source, /【直近の美咲の発言】[\s\S]*?\$\{recentTopicText\}/);
});

test("V0 retrieves weather and Tokyo events before building the prompt", () => {
  assert.match(source, /getTokyoWeather\(\)/);
  assert.match(source, /getTokyoLifeEvents\(\)/);
  assert.match(source, /const \[\s*tokyoWeather,\s*tokyoLifeEvents,[\s\S]*?await Promise\.all/);
  assert.match(source, /const weatherGuide\s*=/);
  assert.match(source, /const tokyoLifeEventsGuide\s*=/);
  assert.match(source, /\$\{weatherGuide\}/);
  assert.match(source, /\$\{tokyoLifeEventsGuide\}/);
});

test("V0 keeps the persona, relationship, memory and safety boundaries", () => {
  for (const marker of [
    "${personaPrompt}", "${relationshipActingGuide}",
    "${userProfileGuide}", "${activityGroundingGuide}",
    "${memoryText}", "${todayMemoryGuide}",
    "【リアルタイム情報の入手経路を作らない】",
    "【天気についての最重要ルール】",
  ]) {
    assert.ok(source.includes(marker), "missing V0 marker: " + marker);
  }
});

test("V0 uses the recall-aware user message and separate retry instructions", () => {
  assert.match(source, /const modelMessage\s*=\s*createRecallAwareMessage\(/);
  assert.match(source, /baseSystemPrompt\s*\+\s*retryGuide\s*\+\s*supplementaryGuide/);
  assert.match(source, /userText:\s*modelMessage/);
  assert.match(source, /systemInstruction:/);
});

test("this test inspects source only and makes no token or cost claim", () => {
  assert.equal(typeof source, "string");
  assert.ok(source.length > 10000);
});
