import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeLongTermMemory,
  sanitizeTodayMemory,
} from "../lib/conversation-engine/memory.ts";

test("long-term memory trims, removes blanks and retains last 30", () => {
  const memory = [" ", null, ...Array.from({ length: 34 }, (_, i) => `  fact-${i}  `)];
  const safe = sanitizeLongTermMemory(memory);
  assert.equal(safe.length, 30);
  assert.equal(safe[0], "fact-4");
  assert.equal(safe.at(-1), "fact-33");
  assert.deepEqual(sanitizeLongTermMemory(memory, 0), []);
  assert.deepEqual(sanitizeLongTermMemory(null), []);
  assert.throws(() => sanitizeLongTermMemory(memory, -1), /invalid memory limit/);
});

test("today memory retains the last 12 strings on the current date", () => {
  const source = {
    date: "2026-10-15",
    items: [null, "", ...Array.from({ length: 15 }, (_, i) => ` item-${i} `)],
  };
  const safe = sanitizeTodayMemory(source, "2026-10-15");
  assert.equal(safe.items.length, 12);
  assert.equal(safe.items[0], "item-3");
  assert.equal(safe.items.at(-1), "item-14");
  assert.equal(source.items[2], " item-0 ");
});

test("today memory resets on day rollover and invalid source", () => {
  assert.deepEqual(
    sanitizeTodayMemory({ date: "2026-10-14", items: ["yesterday"] }, "2026-10-15"),
    { date: "2026-10-15", items: [] },
  );
  assert.deepEqual(
    sanitizeTodayMemory(null, "2026-10-15"),
    { date: "2026-10-15", items: [] },
  );
  assert.deepEqual(
    sanitizeTodayMemory({ date: "2026-10-15", items: ["a"] }, "2026-10-15", 0),
    { date: "2026-10-15", items: [] },
  );
});
