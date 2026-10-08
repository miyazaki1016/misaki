import assert from "node:assert/strict";
import test from "node:test";
import { runOfflineContextComparison } from "../lib/context-ab-offline-harness.ts";

test("A/B harness uses frozen identical context and balanced ordering", async () => {
  const seen: string[] = [];
  const history = [{ role: "user" as const, text: "hello" }, { role: "model" as const, text: "hi" }];
  const snapshot = {
    systemPromptTemplate: "prefix\n{{RECENT_REPLY_SECTION}}\nsuffix",
    recentReplies: ["hi"],
    history,
    userText: "How are you?",
  };
  const result = await runOfflineContextComparison(snapshot, async (request) => {
    assert.equal(request.history, history);
    assert.equal(request.userText, "How are you?");
    const variant = request.systemInstruction.includes("・hi") ? "A" : "B";
    seen.push(variant);
    return { latencyMs: 100, promptTokens: 100, outputTokens: 20, success: true, jsonValid: true, timedOut: false };
  }, 2);
  assert.deepEqual(seen, ["A", "B", "B", "A"]);
  assert.equal(result.summary.A.count, 2);
  assert.equal(result.summary.B.count, 2);
  assert.equal(result.trials.length, 4);
  assert.deepEqual(snapshot.history, history);
});
test("rejects invalid run counts before calling model", async () => {
  await assert.rejects(
    runOfflineContextComparison({
      systemPromptTemplate: "{{RECENT_REPLY_SECTION}}",
      recentReplies: [],
      history: [],
      userText: "",
    }, async () => { throw new Error("should not run"); }, 0),
  );
});
