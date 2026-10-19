import { runLiveSmokeProbe, LIVE_SMOKE_MODEL } from "../lib/conversation-lab/live-smoke-probe.ts";
import { prepareQualityReviewPacket } from "../lib/conversation-lab/quality-review-packet.ts";
import { QUALITY_PROBES } from "../lib/conversation-lab/quality-probes.ts";
import type { RecordedReplyManifest } from "../lib/conversation-lab/recorded-reply-import.ts";

/**
 * Local one-shot operator command (never wired to Vercel public routes).
 * Usage after operator-reviewed secret provisioning:
 * MISAKI_LIVE_SMOKE_APPROVED=yes GEMINI_API_KEY=<inherited secret> \
 *   node --experimental-strip-types scripts/run-conversation-smoke.ts --approved-small-test
 *
 * No file output, database access, or retries; only Q02 synthetic prompts.
 */
async function main() {
  if (process.argv.slice(2).join(" ") !== "--approved-small-test" ||
      process.env.MISAKI_LIVE_SMOKE_APPROVED !== "yes") {
    throw new Error("Explicit operator approval flags are required; no model invoked");
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured; no model invoked");
  const captureId = "smoke-" + new Date().toISOString().replace(/[^0-9TZ]/g, "");
  const manifest: RecordedReplyManifest = {
    captureId,
    modelName: LIVE_SMOKE_MODEL,
    modelVersion: "request-model-name-only",
    promptRevision: "fallback-smoke-v1",
    personaRevision: "fallback-persona-current-on-checked-out-commit",
    relationshipFixtureId: "unknown",
    memoryFixtureId: "none",
    timeFixture: new Date().toISOString(),
    externalContextFixtureId: "none",
    userConsentOrSyntheticFixture: "synthetic-fixture",
  };
  const result = await runLiveSmokeProbe({ apiKey, approved: true, manifest });
  const probe = QUALITY_PROBES.find(p => p.id === "Q02");
  if (!probe) throw new Error("Missing Q02");
  const packet = prepareQualityReviewPacket({
    probe, run: result.imported.run, runLabel: captureId,
    sourceClaim: result.imported.sourceClaim,
  });
  // Never log request headers, API keys or Vercel environment variables.
  process.stdout.write(JSON.stringify({
    ...packet, physicalCalls: result.physicalCalls,
    verification: "caller-attested-unverified",
    limitation: "fallback-persona smoke only; not production Misaki parity",
  }, null, 2) + "\n");
}

main().catch(error => {
  process.stderr.write("Smoke not completed: " + (error instanceof Error ? error.message : "unknown") + "\n");
  process.exitCode = 1;
});
