import assert from "node:assert/strict";
import test from "node:test";
import { analyzePromptSectionOverlap, countRepeatedRepliesInHistory } from "../lib/context-overlap-analysis.ts";

test("counts identical sections without exposing their contents", () => {
  assert.deepEqual(analyzePromptSectionOverlap("abc\nabc\nxyz", [
    { name: "duplicate", text: "abc" },
    { name: "unique", text: "xyz" },
    { name: "empty", text: "" },
  ]), [
    { name: "duplicate", chars: 3, occurrences: 2, extraRepeatedChars: 3 },
    { name: "unique", chars: 3, occurrences: 1, extraRepeatedChars: 0 },
    { name: "empty", chars: 0, occurrences: 0, extraRepeatedChars: 0 },
  ]);
});
test("detects recent model replies repeated in history", () => {
  const result = countRepeatedRepliesInHistory([
    { role: "user", parts: [{ text: "hello" }] },
    { role: "model", parts: [{ text: "reply A" }] },
    { role: "model", parts: [{ text: "reply B" }] },
  ], ["reply A", "reply B", "other"]);
  assert.deepEqual(result, { recentReplies: 3, duplicatedReplies: 2 });
  assert.equal(JSON.stringify(result).includes("reply A"), false);
});
