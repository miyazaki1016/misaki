import { createClient } from "@supabase/supabase-js";
import { runLiveSmokeProbe, LIVE_SMOKE_MODEL } from "../../../../lib/conversation-lab/live-smoke-probe";
import type { RecordedReplyManifest } from "../../../../lib/conversation-lab/recorded-reply-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Preview-only, owner-only, globally one-shot smoke experiment.
 * The atomic database claim RPC must be installed and explicitly enabled.
 * Absent configuration / RPC errors always fail closed before Gemini.
 * No public anonymous or cookie-only access.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.MISAKI_SMOKE_ENABLED !== "yes") {
    return Response.json({ error: "disabled" }, { status: 404 });
  }
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const owner = process.env.MISAKI_SMOKE_OWNER_UID;
  const key = process.env.GEMINI_API_KEY;
  if (!bearer || !url || !anon || !service || !owner || !key) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data: userResult, error: authError } = await client.auth.getUser(bearer);
  if (authError || !userResult.user || userResult.user.id !== owner) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  // Database RPC MUST atomically reserve the sole lifetime run before spending tokens.
  // Never reset the reservation on failure, and never trust a browser-side counter.
  const admin = createClient(url, service, { auth: { persistSession: false } });
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
