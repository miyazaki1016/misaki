import { NextRequest } from "next/server";
import { ACTING_LAB_PROFILES, createRelationshipActingGuide } from "../../../lib/relationship-acting-guide";

/**
 * Development-only inspection endpoint.
 *
 * It intentionally performs no Supabase writes and no quota/history/memory
 * operations. It exposes the exact shared acting guide that production can use.
 * Gemini generation will be wired through a shared generator in the next step,
 * rather than duplicating the production chat implementation here.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const profileKey = typeof body?.profile === "string" ? body.profile : "A";
  const state = ACTING_LAB_PROFILES[profileKey];

  if (!state) {
    return Response.json({ error: "Unknown audition profile" }, { status: 400 });
  }

  return Response.json({
    profile: profileKey,
    state,
    actingGuide: createRelationshipActingGuide(state),
    writes: false,
  });
}
