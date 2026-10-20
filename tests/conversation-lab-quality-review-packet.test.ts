import assert from "node:assert/strict";
import test from "node:test";
import { prepareQualityReviewPacket } from "../lib/conversation-lab/quality-review-packet.ts";
import { runQualityProbe } from "../lib/conversation-lab/quality-probe-runner.ts";
import { QUALITY_PROBES } from "../lib/conversation-lab/quality-probes.ts";

const probe = QUALITY_PROBES.find(p => p.id === "Q13")!;
const syntheticReply = async () => "Synthetic reply only; no model call.";

test("prepares complete per-turn transcript and unscored reviewer checklist", async () => {
  const run = await runQualityProbe(probe, syntheticReply);
  const packet = prepareQualityReviewPacket({
    probe, run, runLabel: "fixture-baseline", sourceClaim: "offline-synthetic",
  });
  assert.equal(packet.state, "awaiting-human-review");
  assert.equal(packet.sourceClaim, "offline-synthetic");
  assert.equal(packet.turns.length, probe.turns.length);
  assert.deepEqual(packet.turns.map(t => t.user), probe.turns);
  assert.ok(packet.turns.every(t => t.reply.includes("Synthetic")));
  assert.equal(packet.checklist.length, probe.expected.length + probe.prohibited.length);
  assert.ok(packet.checklist.every(c => c.verdict === "unreviewed" && c.evidenceTurn === null));
  assert.ok(!("outcome" in packet));
  assert.ok(!("score" in packet));
});

test("rejects failed, partial and edited transcripts", async () => {
  const good = await runQualityProbe(probe, syntheticReply);
  assert.throws(() => prepareQualityReviewPacket({
    probe, run: { ...good, status: "error" }, runLabel: "baseline", sourceClaim: "offline-synthetic",
  }), /INVALID_RUN/);
  assert.throws(() => prepareQualityReviewPacket({
    probe, run: { ...good, turns: good.turns.map((t,i) => i === 0 ? { ...t, text: "changed" } : t) },
    runLabel: "baseline", sourceClaim: "offline-synthetic",
  }), /TRANSCRIPT_MISMATCH/);
  assert.throws(() => prepareQualityReviewPacket({
    probe, run: good, runLabel: "  ", sourceClaim: "offline-synthetic",
  }), /INVALID_RUN/);
});

test("accepts source label without asserting verified real-model provenance", async () => {
  const run = await runQualityProbe(probe, syntheticReply);
  const packet = prepareQualityReviewPacket({
    probe, run, runLabel: "external-record-label", sourceClaim: "recorded-model-output",
  });
  assert.equal(packet.state, "awaiting-human-review");
  assert.equal(packet.sourceClaim, "recorded-model-output");
  // Source attribution is caller-provided, not independently authenticated.
});
