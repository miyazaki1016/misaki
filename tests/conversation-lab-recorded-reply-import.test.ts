import assert from "node:assert/strict";
import test from "node:test";
import { importRecordedQualityReplies, compareRecordedReplyManifests, type RecordedReplyManifest } from "../lib/conversation-lab/recorded-reply-import.ts";
import { prepareQualityReviewPacket } from "../lib/conversation-lab/quality-review-packet.ts";
import { assessQualityProbe } from "../lib/conversation-lab/quality-assessment.ts";
import { QUALITY_PROBES } from "../lib/conversation-lab/quality-probes.ts";

const probe = QUALITY_PROBES.find(p => p.id === "Q13")!;
const manifest: RecordedReplyManifest = {
  captureId: "fixture-001", modelName: "fixture-model", modelVersion: "fixture-1",
  promptRevision: "prompt-a", personaRevision: "persona-1",
  relationshipFixtureId: "relationship-1", memoryFixtureId: "memory-1",
  timeFixture: "2026-10-19T08:00:00+09:00",
  externalContextFixtureId: "weather-unknown",
  userConsentOrSyntheticFixture: "synthetic-fixture",
};

test("imports only fixture-aligned replies, creates reviewer sheet but no scores", () => {
  const replies = probe.turns.map((_, i) => "Synthetic recorded reply " + i);
  const imported = importRecordedQualityReplies({ probe, replies, manifest });
  assert.equal(imported.verification, "caller-attested-unverified");
  const packet = prepareQualityReviewPacket({
    probe, run: imported.run, runLabel: "fixture", sourceClaim: imported.sourceClaim,
  });
  assert.equal(packet.turns.length, replies.length);
  assert.deepEqual(packet.turns.map(t => t.reply), replies);
  assert.ok(packet.checklist.every(f => f.verdict === "unreviewed"));
  assert.ok(!("outcome" in packet));
});

test("rejects missing replies, malformed metadata, and invalid timezone", () => {
  assert.throws(() => importRecordedQualityReplies({ probe, replies: ["one"], manifest }), /TRANSCRIPT_INVALID/);
  assert.throws(() => importRecordedQualityReplies({
    probe, replies: probe.turns.map(() => "ok"), manifest: { ...manifest, modelVersion: "" },
  }), /MANIFEST_INVALID/);
  assert.throws(() => importRecordedQualityReplies({
    probe, replies: probe.turns.map(() => "ok"), manifest: { ...manifest, timeFixture: "2026-10-19" },
  }), /TIME_INVALID/);
  assert.throws(() => importRecordedQualityReplies({
    probe, replies: probe.turns.map(() => "ok"),
    manifest: { ...manifest, userConsentOrSyntheticFixture: "unknown" as "synthetic-fixture" },
  }), /CONSENT_STATUS_INVALID/);
});

test("requires equivalent fixed conditions for meaningful candidate comparison", () => {
  const same = { ...manifest, captureId: "fixture-002", promptRevision: "prompt-b" };
  assert.deepEqual(compareRecordedReplyManifests(manifest, same), { compatible: true, mismatches: [] });
  const different = { ...same, relationshipFixtureId: "relationship-2", memoryFixtureId: "memory-2" };
  const result = compareRecordedReplyManifests(manifest, different);
  assert.equal(result.compatible, false);
  assert.deepEqual(result.mismatches, ["relationshipFixtureId", "memoryFixtureId"]);
});

test("external provenance is not independently authenticated or auto-scored", () => {
  const imported = importRecordedQualityReplies({
    probe, replies: probe.turns.map(() => "fixture reply"), manifest,
  });
  assert.equal(imported.verification, "caller-attested-unverified");
  const sheet = prepareQualityReviewPacket({
    probe, run: imported.run, runLabel: "baseline", sourceClaim: imported.sourceClaim,
  });
  assert.equal(sheet.state, "awaiting-human-review");
  assert.equal(typeof assessQualityProbe, "function");
});
