import test from "node:test";
import assert from "node:assert/strict";
import { compareLabReviews, serializeLabRecord, QUALITY_AXES, type LabReview } from "../lib/conversation-lab/evaluation.ts";
import { runOfflineBaseline } from "../lib/conversation-lab/runner.ts";
import { BASELINE_SCENARIOS } from "../lib/conversation-lab/scenarios.ts";

test("offline baseline completes with deterministic fixtures and full history", async () => {
  const saved: string[] = [];
  const results = await runOfflineBaseline({
    scenarios: BASELINE_SCENARIOS.slice(0, 2),
    reply: async ({ turnIndex, history }) => "fixture answer " + turnIndex + " history=" + history.length,
    nextUser: async ({ turnIndex }) => "fixture user " + turnIndex,
    sink: run => { saved.push(serializeLabRecord(run)); },
  });
  assert.equal(results.length, 2);
  assert.deepEqual(results.map(r => r.status), ["complete", "complete"]);
  assert.deepEqual(results.map(r => r.completedPairs), [5, 5]);
  assert.equal(saved.length, 2);
  assert.equal(JSON.parse(saved[0]).provenance, "offline-synthetic");
  assert.equal(results[0].turns[3].text, "fixture answer 1 history=2");
});

test("eight-axis review identifies regressions", () => {
  const scores = Object.fromEntries(QUALITY_AXES.map(axis => [axis, 3])) as LabReview["scores"];
  const baseline: LabReview = {
    scenarioId: "A01", source: "human", reviewer: "fixture reviewer",
    scores, notes: [], flaggedTurns: [],
  };
  const candidate: LabReview = {
    ...baseline, scores: { ...scores, naturalness: 4, grounding: 2 },
  };
  const comparison = compareLabReviews(baseline, candidate);
  assert.equal(comparison.deltas.naturalness, 1);
  assert.equal(comparison.deltas.grounding, -1);
  assert.deepEqual(comparison.regressions, ["grounding"]);
});
