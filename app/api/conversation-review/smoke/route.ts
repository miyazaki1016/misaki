import { createClient } from "@supabase/supabase-js";
import { runLiveSmokeProbe, LIVE_SMOKE_MODEL } from "../../../../lib/conversation-lab/live-smoke-probe";
import type { RecordedReplyManifest } from "../../../../lib/conversation-lab/recorded-reply-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Preview-only, owner-only, globally one-shot smoke experiment.
 * The atomic claim RPC must live in an isolated Preview Supabase project.
 * Absent configuration / RPC errors always fail closed before Gemini.
 * No public anonymous or cookie-only access.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.MISAKI_SMOKE_ENABLED !== "yes" ||
      process.env.MISAKI_SMOKE_ISOLATED_DB_CONFIRMED !== "yes") {
    return Response.json({ error: "disabled" }, { status: 404 });
  }
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  // Existing Auth identity can be verified without touching its database.
  // The quota database must be a wholly different Supabase project.
  const authUrl = "https://tzozajnwznxqgxnjikoy.supabase.co";
  const authKey = "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";
  const quotaUrl = process.env.MISAKI_SMOKE_QUOTA_SUPABASE_URL;
  const quotaService = process.env.MISAKI_SMOKE_QUOTA_SERVICE_ROLE_KEY;
  const quotaRef = process.env.MISAKI_SMOKE_QUOTA_PROJECT_REF;
  let quotaHost = "";
  try { quotaHost = new URL(quotaUrl || "").hostname; } catch { /* fail closed below */ }
  if (!quotaRef || !/^[a-z]{20}$/.test(quotaRef) ||
      quotaRef === "tzozajnwznxqgxnjikoy" || quotaHost !== quotaRef + ".supabase.co") {
    return Response.json({ error: "isolated quota database missing" }, { status: 503 });
  }
  const owner = process.env.MISAKI_SMOKE_OWNER_UID;
  const key = process.env.GEMINI_API_KEY;
  if (!bearer || !quotaService || !owner || !key) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }
  const client = createClient(authUrl, authKey, { auth: { persistSession: false } });
  const { data: userResult, error: authError } = await client.auth.getUser(bearer);
  if (authError || !userResult.user || userResult.user.id !== owner) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  // Database RPC MUST atomically reserve the sole lifetime run before spending tokens.
  // Never reset the reservation on failure, and never trust a browser-side counter.
  const admin = createClient(quotaUrl!, quotaService, { auth: { persistSession: false } });
  const { data: claim, error: claimError } = await admin.rpc("misaki_claim_one_shot_smoke_v1", {
    p_owner_uid: owner,
    p_run_key: "q02-preview-v1",
  });
  if (claimError || claim !== true) {
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
