import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLongTermMemory,
  formatRecentMisakiMessages,
} from "../lib/conversation-engine/context-format.ts";

test("formats empty and nonempty long-term memory exactly as production", () => {
  assert.equal(formatLongTermMemory([]), "まだ長期記憶はありません。");
  assert.equal(formatLongTermMemory(["好きな食べ物は桃", "犬を飼っている"]), "・好きな食べ物は桃\n・犬を飼っている");
});

test("recent messages use only the last eight Misaki turns", () => {
  const history = Array.from({ length: 12 }, (_, i) => [
    { role: "user" as const, text: `user-${i}` },
    { role: "misaki" as const, text: `misaki-${i}` },
  ]).flat();
  assert.equal(
    formatRecentMisakiMessages(history),
    Array.from({ length: 8 }, (_, i) => `・misaki-${i + 4}`).join("\n"),
  );
  assert.equal(formatRecentMisakiMessages([{ role: "user", text: "hi" }]), "なし");
});
