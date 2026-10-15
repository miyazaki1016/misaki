import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeConversationHistory,
  toGeminiConversationHistory,
} from "../lib/conversation-engine/history.ts";

test("maps canonical roles without including the current user turn", () => {
  const history = [
    { role: "user" as const, text: "こんにちは" },
    { role: "misaki" as const, text: "やっほー" },
  ];
  const mapped = toGeminiConversationHistory(history);
  assert.deepEqual(mapped, [
    { role: "user", parts: [{ text: "こんにちは" }] },
    { role: "model", parts: [{ text: "やっほー" }] },
  ]);
  assert.equal(history.length, 2);
  mapped[0].parts[0].text = "changed";
  assert.equal(history[0].text, "こんにちは");
});

test("filters invalid history and retains the last 60 valid turns", () => {
  const history = [
    null,
    { role: "system", text: "not canonical" },
    ...Array.from({ length: 65 }, (_, index) => ({
      role: index % 2 ? "misaki" : "user",
      text: String(index),
    })),
    { role: "user", text: 42 },
  ];
  const safe = sanitizeConversationHistory(history);
  assert.equal(safe.length, 60);
  assert.equal(safe[0].text, "5");
  assert.equal(safe[59].text, "64");
  assert.equal(sanitizeConversationHistory(history, 0).length, 0);
  assert.throws(() => sanitizeConversationHistory(history, -1), /invalid history limit/);
});

test("does not mutate source history", () => {
  const history = [{ role: "user", text: "original" }];
  const safe = sanitizeConversationHistory(history);
  safe[0].text = "modified";
  assert.equal(history[0].text, "original");
});
