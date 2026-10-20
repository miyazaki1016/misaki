import assert from "node:assert/strict";
import test from "node:test";
import { runQualityProbe, runQualityProbeSuite } from "../lib/conversation-lab/quality-probe-runner.ts";
import { QUALITY_PROBES } from "../lib/conversation-lab/quality-probes.ts";

test("replays every supplied user turn in order and carries exact prior history", async () => {
  const seen: Array<{message:string; historyLength:number; turnIndex:number}> = [];
  const probe = QUALITY_PROBES.find(p => p.id === "Q12")!;
  const result = await runQualityProbe(probe, async ({ message, history, turnIndex }) => {
    seen.push({ message, historyLength: history.length, turnIndex });
    return "Synthetic reply " + turnIndex;
  });
  assert.equal(result.status, "complete");
  assert.equal(result.completedPairs, 3);
  assert.deepEqual(seen, [
    { message: probe.turns[0], historyLength: 0, turnIndex: 0 },
    { message: probe.turns[1], historyLength: 2, turnIndex: 1 },
    { message: probe.turns[2], historyLength: 4, turnIndex: 2 },
  ]);
  assert.deepEqual(result.turns.map(x => x.role), ["user", "model", "user", "model", "user", "model"]);
});

test("runs all 22 scenarios with injected synthetic replies only", async () => {
  let count = 0;
  const runs = await runQualityProbeSuite(async () => { count++; return "synthetic"; });
  assert.equal(runs.length, 22);
  assert.ok(runs.every(x => x.status === "complete"));
  assert.equal(count, QUALITY_PROBES.reduce((n, p) => n + p.turns.length, 0));
});

test("invalid fixture is rejected before any reply invocation", async () => {
  let called = false;
  await assert.rejects(
    runQualityProbe({ ...QUALITY_PROBES[0], turns: [] }, async () => { called = true; return "synthetic"; }),
    /INVALID_PROBE_TURNS/,
  );
  assert.equal(called, false);
});

test("a failed reply marks transcript as error, not a successful quality evaluation", async () => {
  const run = await runQualityProbe(QUALITY_PROBES[0], async () => { throw new Error("synthetic failure"); });
  assert.equal(run.status, "error");
  assert.equal(run.completedPairs, 0);
});
