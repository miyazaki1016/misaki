import { NextRequest, NextResponse } from "next/server";
import { verifyTuningOwnerBearer } from "../../../../lib/conversation-tuning-owner-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * A read-only auth probe for the future tuning UI.
 * This endpoint NEVER returns settings, personal data, or the configured owner ID.
 * It is fail-closed until MISAKI_TUNING_OWNER_USER_ID is configured.
 */
export async function GET(request: NextRequest) {
  const result = await verifyTuningOwnerBearer(request.headers.get("authorization"));
  if (!result.ok) {
    return NextResponse.json({ authorized: false }, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return NextResponse.json({ authorized: true, mode: "preview-only" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
