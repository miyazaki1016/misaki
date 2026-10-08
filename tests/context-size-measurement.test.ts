import assert from "node:assert/strict";
import test from "node:test";
import { contextSizeMeasurementEnabled, measureContextSize } from "../lib/context-size-measurement.ts";

test("disabled by default and only explicitly enabled", () => {
  assert.equal(contextSizeMeasurementEnabled(undefined), false);
  assert.equal(contextSizeMeasurementEnabled("true"), false);
  assert.equal(contextSizeMeasurementEnabled("1"), true);
});
test("counts UTF-16 characters and messages without exposing text", () => {
  const result = measureContextSize({
    systemInstruction: "persona\nsecret",
    history: [{ parts: [{ text: "こんにちは" }] }, { parts: [{ text: "😊" }] }],
    userText: "今",
    persona: "persona",
    relationshipGuides: ["rel"],
    longTermMemory: "secret",
    todayMemory: "",
    repeatedReplies: "reply",
    environmentGuides: ["weather"],
  });
  assert.equal(result.historyMessages, 2);
  assert.equal(result.historyChars, 7); // five Japanese characters + emoji surrogate pair
  assert.equal(result.dynamicComponentChars.longTermMemory, 6);
  assert.equal(result.systemInstructionChars, 14);
  assert.equal(result.unit, "utf16_chars");
  assert.equal(JSON.stringify(result).includes("secret"), false);
});
