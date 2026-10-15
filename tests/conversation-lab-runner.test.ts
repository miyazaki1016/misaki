import test from "node:test";
import assert from "node:assert/strict";
import { BASELINE_SCENARIOS } from "../lib/conversation-lab/scenarios.ts";
import { runLabScenario } from "../lib/conversation-lab/runner.ts";

test("offline runner carries full prior conversation without any API calls", async () => {
  const seen: number[] = [];
  const result = await runLabScenario({
    scenario: BASELINE_SCENARIOS[0],
    pairs: 3,
    nextUser: async ({ turnIndex }) => "user " + turnIndex,
    reply: async ({ history, turnIndex }) => {
      seen.push(history.length);
      return "reply " + turnIndex;
    },
  });
  assert.equal(result.status, "complete");
  assert.equal(result.completedPairs, 3);
  assert.deepEqual(seen, [0, 2, 4]);
  assert.deepEqual(result.turns.map(turn => turn.role), ["user", "model", "user", "model", "user", "model"]);
});

test("runner refuses to exceed the scenario limit", async () => {
  await assert.rejects(() => runLabScenario({
    scenario: BASELINE_SCENARIOS[0], pairs: 6,
    nextUser: async () => "hi", reply: async () => "hello",
  }), /budget/);
});

test("runner retains partial transcript on failed reply", async () => {
  const result = await runLabScenario({
    scenario: BASELINE_SCENARIOS[0], pairs: 2,
    nextUser: async () => "again",
    reply: async ({ turnIndex }) => { if (turnIndex === 1) throw Error("injected failure"); return "ok"; },
  });
  assert.equal(result.status, "error");
  assert.equal(result.completedPairs, 1);
  assert.equal(result.turns.length, 3);
  assert.equal(result.error, "injected failure");
});
