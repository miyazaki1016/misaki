import assert from "node:assert/strict";
import test from "node:test";
import { measureRenderedChatSections } from "../lib/conversation-engine/chat-input-metrics.ts";

test("counts rendered Japanese sections without claiming real model tokens", () => {
  const result = measureRenderedChatSections([
    { key: "persona", text: "美咲の会話", state: "present", sourceKeys: ["persona-v1"] },
    { key: "weather", text: "雨です☔", state: "present", sourceKeys: ["weather-1"] },
    { key: "events", text: "", state: "empty" },
  ]);
  assert.equal(result.sections.length, 3);
  assert.equal(result.modelInputTokens, null);
  assert.equal(result.selectedUtf16Units, "美咲の会話雨です☔".length);
  assert.ok(result.selectedUtf8Bytes > result.selectedUtf16Units);
  assert.equal(result.sections[2].state, "empty");
  assert.equal(result.sections[2].utf8Bytes, 0);
});

test("excludes unselected sections from totals and preserves reason", () => {
  const result = measureRenderedChatSections([
    { key: "weather", text: "20℃", state: "not_relevant", selected: false },
    { key: "reply_policy", text: "根拠のない天気を作らない", state: "present" },
  ]);
  assert.equal(result.selectedUtf16Units, "根拠のない天気を作らない".length);
  assert.equal(result.sections[0].selected, false);
  assert.equal(result.sections[0].utf16Units, 3);
});

test("detects source repeated in selected prompt sections", () => {
  const result = measureRenderedChatSections([
    { key: "history", text: "前の発言", state: "present", sourceKeys: ["turn-1", "turn-2"] },
    { key: "recent_misaki", text: "前の発言", state: "present", sourceKeys: ["turn-2"] },
  ]);
  assert.deepEqual(result.sections[1].repeatedSourceKeys, ["turn-2"]);
});

test("unselected sources do not count as repeated evidence", () => {
  const result = measureRenderedChatSections([
    { key: "unused_weather", text: "雨", state: "not_relevant", selected: false, sourceKeys: ["wx-1"] },
    { key: "weather", text: "雨", state: "present", sourceKeys: ["wx-1"] },
  ]);
  assert.deepEqual(result.sections[1].repeatedSourceKeys, []);
});

test("UTF-16, Unicode code points, and UTF-8 bytes are not conflated", () => {
  const result = measureRenderedChatSections([
    { key: "emoji", text: "☔️🤭", state: "present" },
  ]);
  assert.equal(result.sections[0].utf16Units, 4);
  assert.equal(result.sections[0].codePoints, 3);
  assert.ok(result.sections[0].utf8Bytes > 4);
});

test("rejects ambiguous section names", () => {
  assert.throws(() => measureRenderedChatSections([
    { key: "memory", text: "A", state: "present" },
    { key: "memory", text: "B", state: "present" },
  ]), /CHAT_METRIC_DUPLICATE_OR_EMPTY_SECTION_KEY/);
});
