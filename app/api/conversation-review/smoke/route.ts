import { createClient } from "@supabase/supabase-js";
import { claimOneShotInGitHub } from "../../../../lib/conversation-lab/github-one-shot-claim";
import { runLiveSmokeProbe, LIVE_SMOKE_MODEL } from "../../../../lib/conversation-lab/live-smoke-probe";
import type { RecordedReplyManifest } from "../../../../lib/conversation-lab/recorded-reply-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_BRANCH = "experiment/conversation-lab-offline-v1-20261015";
function isConfigured() {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === EXPECTED_BRANCH &&
    process.env.MISAKI_SMOKE_ENABLED === "yes" &&
    process.env.MISAKI_SMOKE_GITHUB_QUOTA_CONFIRMED === "yes" &&
    Boolean(process.env.MISAKI_SMOKE_OWNER_UID &&
      process.env.MISAKI_SMOKE_GITHUB_TOKEN &&
      process.env.MISAKI_SMOKE_GITHUB_REPO &&
      process.env.MISAKI_SMOKE_GITHUB_BRANCH &&
      process.env.GEMINI_API_KEY);
}

export async function GET() {
  return Response.json({ ready: isConfigured(), description: "Q02 one-shot research only" }, { headers: { "Cache-Control": "no-store" } });
}


/**
 * Preview-only, owner-only, globally one-shot smoke experiment.
 * The one-shot claim is created in a separate dedicated GitHub repository.
 * Absent configuration / GitHub claim failures always fail closed before Gemini.
 * No public anonymous or cookie-only access.
 */
export async function POST(request: Request) {
  if (!isConfigured()) {
    return Response.json({ error: "disabled" }, { status: 404 });
  }
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const authUrl = "https://tzozajnwznxqgxnjikoy.supabase.co";
  const authKey = "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";
  const quotaToken = process.env.MISAKI_SMOKE_GITHUB_TOKEN;
  const quotaRepo = process.env.MISAKI_SMOKE_GITHUB_REPO;
  const quotaBranch = process.env.MISAKI_SMOKE_GITHUB_BRANCH;
  const owner = process.env.MISAKI_SMOKE_OWNER_UID;
  const key = process.env.GEMINI_API_KEY;
  if (!bearer || !quotaToken || !quotaRepo || !quotaBranch || !owner || !key) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }
  const client = createClient(authUrl, authKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userResult, error: authError } = await client.auth.getUser(bearer);
  if (authError || !userResult.user || userResult.user.id !== owner) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  // Durable GitHub reservation: missing or uncertain claims never spend tokens.
  let claimed = false;
  try {
    claimed = (await claimOneShotInGitHub({
      token: quotaToken,
      repository: quotaRepo,
      branch: quotaBranch,
      runKey: "q02-preview-v1",
    })) === "claimed";
  } catch {
    claimed = false;
  }
  if (!claimed) {
    return Response.json({ error: "smoke quota unavailable or already used" }, { status: 429 });
  }
  const manifest: RecordedReplyManifest = {
    captureId: "q02-preview-v1",
    modelName: LIVE_SMOKE_MODEL,
    modelVersion: "request-model-name-only",
    promptRevision: "fallback-smoke-v1",
    personaRevision: "fallback-current",
    relationshipFixtureId: "unknown",
    memoryFixtureId: "none",
    timeFixture: new Date().toISOString(),
    externalContextFixtureId: "none",
    userConsentOrSyntheticFixture: "synthetic-fixture",
  };
  try {
    const observed = await runLiveSmokeProbe({ apiKey: key, approved: true, manifest });
    return Response.json({
      probeId: observed.imported.run.scenarioId,
      turns: observed.imported.run.turns,
      physicalCalls: observed.physicalCalls,
      verification: "caller-attested-unverified",
      limitation: "Synthetic Q02 fallback persona only; not production Misaki",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Do not refund a claimed run; the request may already have spent tokens.
    return Response.json({ error: "smoke failed; claim consumed" }, { status: 502 });
  }
}
