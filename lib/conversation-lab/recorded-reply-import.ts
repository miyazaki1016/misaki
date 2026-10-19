import type { LabRun } from "./runner.ts";
import type { QualityProbe } from "./quality-probes.ts";

/**
 * Offline import of previously collected, consent-cleared model replies.
 * No API calls, DB reads/writes, or storage. This validates shape and fixture
 * identity, NOT that the declared model actually generated the supplied text.
 */
export type RecordedReplyManifest = Readonly<{
  captureId: string;
  modelName: string;
  modelVersion: string;
  promptRevision: string;
  personaRevision: string;
  relationshipFixtureId: string;
  memoryFixtureId: string;
  timeFixture: string;
  externalContextFixtureId: string;
  userConsentOrSyntheticFixture: "synthetic-fixture" | "consented-redacted";
}>;

export type ImportedQualityTranscript = Readonly<{
  run: LabRun;
  sourceClaim: "recorded-model-output";
  verification: "caller-attested-unverified";
  manifest: RecordedReplyManifest;
}>;

const required: readonly (keyof RecordedReplyManifest)[] = [
  "captureId", "modelName", "modelVersion", "promptRevision",
  "personaRevision", "relationshipFixtureId", "memoryFixtureId",
  "timeFixture", "externalContextFixtureId", "userConsentOrSyntheticFixture",
];

/** Validate all manifest fields *before* a live experiment spends tokens. */
export function validateRecordedReplyManifest(manifest: RecordedReplyManifest): void {
  for (const key of required) {
    const value = manifest[key];
    if (typeof value !== "string" || !value.trim() || value.length > 256) {
      throw new Error("RECORDED_QUALITY_MANIFEST_INVALID");
    }
  }
  if (!["synthetic-fixture", "consented-redacted"].includes(manifest.userConsentOrSyntheticFixture)) {
    throw new Error("RECORDED_QUALITY_CONSENT_STATUS_INVALID");
  }
  const parsedDate = Date.parse(manifest.timeFixture);
  if (!Number.isFinite(parsedDate) || !/(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(manifest.timeFixture)) {
    throw new Error("RECORDED_QUALITY_TIME_INVALID");
  }
}

export function importRecordedQualityReplies(input: {
  probe: QualityProbe;
  replies: readonly string[];
  manifest: RecordedReplyManifest;
}): ImportedQualityTranscript {
  const { probe, replies, manifest } = input;
  if (!probe.id.trim() || probe.turns.length < 2 || probe.turns.length > 20 ||
      replies.length !== probe.turns.length ||
      probe.turns.some(t => typeof t !== "string" || !t.trim() || t.length > 4000) ||
      replies.some(t => typeof t !== "string" || !t.trim() || t.length > 4000)) {
    throw new Error("RECORDED_QUALITY_TRANSCRIPT_INVALID");
  }
  validateRecordedReplyManifest(manifest);
  const turns: LabRun["turns"] = [];
  for (let i = 0; i < replies.length; i++) {
    turns.push({ role: "user", text: probe.turns[i] });
    turns.push({ role: "model", text: replies[i] });
  }
  return {
    run: { scenarioId: probe.id, turns, completedPairs: replies.length, status: "complete" },
    sourceClaim: "recorded-model-output",
    verification: "caller-attested-unverified",
    manifest: { ...manifest },
  };
}

export function compareRecordedReplyManifests(
  baseline: RecordedReplyManifest,
  candidate: RecordedReplyManifest,
): { compatible: boolean; mismatches: readonly string[] } {
  const fixed: readonly (keyof RecordedReplyManifest)[] = [
    "personaRevision", "relationshipFixtureId", "memoryFixtureId",
    "timeFixture", "externalContextFixtureId", "userConsentOrSyntheticFixture",
  ];
  const mismatches = fixed.filter(key => baseline[key] !== candidate[key]);
  return { compatible: mismatches.length === 0, mismatches };
}
